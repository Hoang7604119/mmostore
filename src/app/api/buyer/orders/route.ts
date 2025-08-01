import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
import AccountItem from '@/models/AccountItem'
import User from '@/models/User'
import Order from '@/models/Order'
import PendingCredit from '@/models/PendingCredit'
import { verifyToken } from '@/lib/utils'
import mongoose from 'mongoose'
import { notifyOrderCreated, notifyProductSold } from '@/utils/notificationHelpers'
import { CREDIT_HOLD_CONFIG, CREDIT_HOLD_REASONS } from '@/constants/credit'

export const dynamic = 'force-dynamic'

// POST - Tạo đơn hàng mua tài khoản
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    // Verify buyer token
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Vui lòng đăng nhập để mua sản phẩm' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Token không hợp lệ' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { productId, quantity = 1 } = body

    // Validation
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID là bắt buộc' },
        { status: 400 }
      )
    }

    if (quantity < 1) {
      return NextResponse.json(
        { error: 'Số lượng phải lớn hơn 0' },
        { status: 400 }
      )
    }

    // Find product
    const product = await Product.findById(productId).populate('sellerId', 'username email')
    if (!product) {
      return NextResponse.json(
        { error: 'Không tìm thấy sản phẩm' },
        { status: 404 }
      )
    }

    // Check if product is approved
    if (product.status !== 'approved') {
      return NextResponse.json(
        { error: 'Sản phẩm chưa được duyệt hoặc không còn bán' },
        { status: 400 }
      )
    }

    // Check if buyer is not the seller
    if (product.sellerId._id.toString() === decoded.userId) {
      return NextResponse.json(
        { error: 'Không thể mua sản phẩm của chính mình' },
        { status: 400 }
      )
    }

    // Get buyer info and check credit
    const buyer = await User.findById(decoded.userId)
    if (!buyer) {
      return NextResponse.json(
        { error: 'Không tìm thấy thông tin người mua' },
        { status: 404 }
      )
    }

    const totalAmount = product.pricePerUnit * quantity
    if (buyer.credit < totalAmount) {
      return NextResponse.json(
        { error: `Không đủ credit. Bạn có ${buyer.credit.toLocaleString('vi-VN')} VNĐ, cần ${totalAmount.toLocaleString('vi-VN')} VNĐ` },
        { status: 400 }
      )
    }

    // Sử dụng MongoDB transaction để đảm bảo tính atomic và tránh race condition
    const session = await mongoose.startSession()
    let purchasedAccounts: any[] = []
    let seller: any = null
    let newOrder: any = null
    
    try {
      await session.withTransaction(async () => {
        // 1. Tìm và reserve accounts trong cùng 1 operation atomic
        const reserveResult = await AccountItem.updateMany(
          {
            productId: productId,
            status: 'available'
          },
          {
            $set: {
              status: 'sold',
              soldTo: decoded.userId,
              soldAt: new Date()
            }
          },
          { 
            session,
            limit: quantity // MongoDB sẽ chỉ update đúng số lượng cần thiết
          }
        )

        // Kiểm tra xem có đủ accounts được reserve không
        if (reserveResult.modifiedCount < quantity) {
          throw new Error(`Chỉ còn ${reserveResult.modifiedCount} tài khoản có sẵn, không đủ ${quantity} tài khoản yêu cầu`)
        }

        // 2. Trừ credit từ buyer (với session)
        const buyerUpdateResult = await User.findByIdAndUpdate(
          decoded.userId,
          { $inc: { credit: -totalAmount } },
          { session, new: true }
        )

        if (!buyerUpdateResult || buyerUpdateResult.credit < 0) {
          throw new Error('Không đủ credit để thực hiện giao dịch')
        }

        // 3. Tạo PendingCredit cho seller thay vì cộng credit trực tiếp
        const releaseDate = new Date()
        releaseDate.setTime(releaseDate.getTime() + CREDIT_HOLD_CONFIG.HOLD_DURATION_MS)
        
        // Cập nhật pendingCredit cho seller
        seller = await User.findByIdAndUpdate(
          product.sellerId._id,
          { $inc: { pendingCredit: totalAmount } },
          { session, new: true }
        )

        // 4. Lấy thông tin accounts đã mua
        purchasedAccounts = await AccountItem.find({
          productId: productId,
          soldTo: decoded.userId,
          status: 'sold'
        }, 'username password email additionalInfo accountData fieldNames', { session })
        .sort({ soldAt: -1 })
        .limit(quantity)

        const accountIds = purchasedAccounts.map(acc => acc._id)

        // 5. Tạo Order record
        const orderNumber = await Order.generateOrderNumber()
        const orderData = new Order({
          orderNumber,
          buyerId: decoded.userId,
          sellerId: product.sellerId._id,
          productId: productId,
          accountItems: accountIds,
          quantity,
          pricePerUnit: product.pricePerUnit,
          totalAmount,
          status: 'completed',
          paymentMethod: 'credit',
          completedAt: new Date()
        })
        
        newOrder = await orderData.save({ session })

        // 6. Tạo PendingCredit record
        const pendingCreditData = new PendingCredit({
          userId: product.sellerId._id,
          amount: totalAmount,
          reason: CREDIT_HOLD_REASONS.SALE_COMMISSION,
          orderId: newOrder._id,
          releaseDate: releaseDate,
          note: `Credit từ bán hàng - Đơn hàng #${orderNumber}`
        })
        
        await pendingCreditData.save({ session })

        // 7. Cập nhật product sold count và kiểm tra sold out
        const remainingAccounts = await AccountItem.countDocuments({
          productId: productId,
          status: 'available'
        }, { session })
        
        const updateData: any = { $inc: { soldCount: quantity } }
        if (remainingAccounts === 0) {
          updateData.$set = { status: 'sold_out' }
        }
        
        await Product.findByIdAndUpdate(productId, updateData, { session })
      })
    } catch (error) {
      // Nếu có lỗi trong transaction, tất cả thay đổi sẽ được rollback tự động
      throw error
    } finally {
      await session.endSession()
    }

    // Send notifications
    try {
      // Notify buyer about successful order
      await notifyOrderCreated(
        decoded.userId,
        product.title,
        quantity,
        totalAmount,
        product._id.toString()
      )

      // Notify seller about product sale
      await notifyProductSold(
        product.sellerId._id.toString(),
        product.title,
        quantity,
        totalAmount,
        buyer.username,
        product._id.toString()
      )
    } catch (notificationError) {
      console.error('Error sending notifications:', notificationError)
      // Don't fail the main operation if notification fails
    }

    return NextResponse.json({
      message: 'Mua hàng thành công',
      order: {
        orderNumber: newOrder.orderNumber,
        orderId: newOrder._id,
        productId: product._id,
        productTitle: product.title,
        productType: product.type,
        quantity,
        pricePerUnit: product.pricePerUnit,
        totalAmount,
        seller: {
          username: product.sellerId.username,
          email: product.sellerId.email
        },
        accounts: purchasedAccounts,
        purchasedAt: new Date(),
        createdAt: newOrder.createdAt,
        remainingCredit: (await User.findById(decoded.userId)).credit
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}

// GET - Lấy lịch sử đơn hàng của buyer
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    // Verify buyer token
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Vui lòng đăng nhập' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Token không hợp lệ' },
        { status: 403 }
      )
    }

    // Get orders with product and seller info
    const orders = await Order.find({
      buyerId: decoded.userId
    })
    .populate({
      path: 'productId',
      select: 'title type category pricePerUnit sellerId',
      populate: {
        path: 'sellerId',
        select: 'username email'
      }
    })
    .populate({
      path: 'sellerId',
      select: 'username email'
    })
    .populate({
      path: 'accountItems',
      select: 'username password email additionalInfo accountData fieldNames'
    })
    .sort({ createdAt: -1 })

    return NextResponse.json({ 
      orders: orders,
      total: orders.length 
    }, { status: 200 })

  } catch (error) {
    console.error('Get buyer orders error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}