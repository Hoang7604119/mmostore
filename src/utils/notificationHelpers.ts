import { sendNotification, sendBulkNotification, createNotificationData, NotificationTemplates } from '@/lib/notifications'

// Helper functions for common notification scenarios

// Product-related notifications
export const notifyProductApproved = async (userId: string, productName: string) => {
  try {
    await sendNotification(
      'PRODUCT_APPROVED',
      userId,
      {
        productName
      },
      `/dashboard/seller/products`
    )
  } catch (error) {
    console.error('Error sending product approved notification:', error)
  }
}

export const notifyProductRejected = async (userId: string, productName: string, reason: string) => {
  try {
    await sendNotification(
      'PRODUCT_REJECTED',
      userId,
      {
        productName,
        reason
      },
      `/dashboard/seller/products`
    )
  } catch (error) {
    console.error('Error sending product rejected notification:', error)
  }
}



export const notifyLowStock = async (userId: string, productName: string, currentStock: number, productId: string) => {
  const result = await sendNotification(
    'PRODUCT_OUT_OF_STOCK',
    userId,
    {
      productName,
      currentStock: currentStock.toString(),
      alertDate: new Date().toLocaleDateString('vi-VN')
    },
    `/dashboard/seller/products/${productId}`
  )
  
  return result
}

// Order-related notifications
export const notifyOrderPlaced = async (userId: string, orderId: string, totalAmount: number, itemCount: number) => {
  const result = await sendNotification(
    'ORDER_RECEIVED',
    userId,
    {
      orderId,
      amount: totalAmount.toLocaleString('vi-VN'),
      itemCount: itemCount.toString(),
      orderDate: new Date().toLocaleDateString('vi-VN')
    },
    `/dashboard/buyer/orders/${orderId}`
  )
  
  
  return result
}

export const notifyOrderStatusUpdate = async (userId: string, orderId: string, status: string, estimatedDelivery?: string) => {
  const templateKey = status === 'completed' ? 'ORDER_COMPLETED' : 'ORDER_RECEIVED'
  return await sendNotification(
    templateKey,
    userId,
    {
      orderId,
      status,
      updateDate: new Date().toLocaleDateString('vi-VN'),
      ...(estimatedDelivery && { estimatedDelivery })
    },
    `/dashboard/buyer/orders/${orderId}`
  )
}

export const notifyOrderDelivered = async (userId: string, orderId: string, deliveryDate: string) => {
  return await sendNotification(
    'ORDER_COMPLETED',
    userId,
    {
      orderId,
      deliveryDate,
      completionDate: new Date().toLocaleDateString('vi-VN')
    },
    `/dashboard/buyer/orders/${orderId}`
  )
}

// Account-related notifications
export const notifyAccountUpgrade = async (userId: string, newRole: string, upgradeDate: string) => {
  return await sendNotification(
    'ACCOUNT_APPROVED',
    userId,
    {
      role: newRole,
      upgradeDate,
      effectiveDate: new Date().toLocaleDateString('vi-VN')
    },
    '/dashboard/profile'
  )
}

export const notifyPasswordChanged = async (userId: string, changeDate: string, ipAddress: string) => {
  return await sendNotification(
    'ACCOUNT_APPROVED',
    userId,
    {
      role: 'user',
      changeDate,
      ipAddress,
      securityDate: new Date().toLocaleDateString('vi-VN')
    },
    '/dashboard/security'
  )
}

// Payment-related notifications
export const notifyPaymentReceived = async (userId: string, amount: number, method: string, transactionId: string) => {
  return await sendNotification(
    'PAYMENT_RECEIVED',
    userId,
    {
      amount: amount.toLocaleString('vi-VN'),
      method,
      transactionId,
      paymentDate: new Date().toLocaleDateString('vi-VN')
    },
    '/dashboard/credit'
  )
}

export const notifyPaymentFailed = async (userId: string, amount: number, reason: string, orderId?: string) => {
  return await sendNotification(
    'PAYMENT_RECEIVED',
    userId,
    {
      amount: amount.toLocaleString('vi-VN'),
      reason,
      failureDate: new Date().toLocaleDateString('vi-VN'),
      ...(orderId && { orderId })
    },
    orderId ? `/dashboard/buyer/orders/${orderId}` : '/dashboard/credit'
  )
}

// System notifications
export const notifySystemMaintenance = async (userIds: string[], startTime: string, endTime: string, description: string) => {
  return await sendBulkNotification(
    'SYSTEM_MAINTENANCE',
    userIds,
    {
      startTime,
      endTime,
      description,
      notificationDate: new Date().toLocaleDateString('vi-VN')
    }
  )
}

export const notifyNewFeature = async (userIds: string[], featureName: string, description: string, learnMoreUrl?: string) => {
  return await sendBulkNotification(
    'WELCOME',
    userIds,
    {
      featureName,
      description,
      releaseDate: new Date().toLocaleDateString('vi-VN')
    },
    learnMoreUrl
  )
}

// Promotional notifications
export const notifyPromotion = async (userIds: string[], title: string, description: string, discountPercent: number, validUntil: string, promoCode?: string) => {
  return await sendBulkNotification(
    'WELCOME',
    userIds,
    {
      title,
      description,
      discountPercent: discountPercent.toString(),
      validUntil,
      ...(promoCode && { promoCode }),
      promotionDate: new Date().toLocaleDateString('vi-VN')
    },
    '/dashboard/buyer/marketplace'
  )
}

// Message-related notifications
export const notifyNewMessage = async (receiverId: string, senderName: string, messageContent: string, conversationId: string) => {
  try {
    // Truncate message content if too long
    const truncatedContent = messageContent.length > 50 
      ? messageContent.substring(0, 50) + '...'
      : messageContent

    await sendNotification(
      'NEW_MESSAGE',
      receiverId,
      {
        senderName,
        messageContent: truncatedContent
      },
      `/dashboard/messages`
    )
  } catch (error) {
    console.error('Error sending new message notification:', error)
  }
}

// Mark message notifications as read when user views conversation
export const markMessageNotificationsAsRead = async (userId: string, conversationId: string) => {
  try {
    const connectDB = (await import('@/lib/mongodb')).default
    const Notification = (await import('@/models/Notification')).default
    
    await connectDB()
    
    // Mark all message notifications as read since they all redirect to /dashboard/messages
    const result = await Notification.updateMany(
      {
        userId,
        category: 'system',
        actionUrl: `/dashboard/messages`,
        isRead: false
      },
      {
        $set: { isRead: true }
      }
    )
    
    console.log(`Marked ${result.modifiedCount} message notifications as read for user ${userId}`)
  } catch (error) {
    console.error('Error marking message notifications as read:', error)
  }
}

// Review and rating notifications
export const notifyNewReview = async (userId: string, productName: string, rating: number, reviewerName: string, productId: string) => {
  const notificationData = {
    title: 'Đánh giá mới cho sản phẩm',
    message: `${reviewerName} đã đánh giá ${rating} sao cho sản phẩm "${productName}". Hãy xem và phản hồi!`,
    type: 'info' as const,
    category: 'product' as const,
    metadata: {
      productName,
      rating: rating.toString(),
      reviewerName,
      reviewDate: new Date().toLocaleDateString('vi-VN')
    },
    actionUrl: `/dashboard/seller/products/${productId}/reviews`,
    actionText: 'Xem đánh giá'
  }
  
  return await sendNotification(
    'PRODUCT_SOLD',
    userId,
    {
      productName,
      amount: rating.toString(),
      rating: rating.toString(),
      reviewerName,
      reviewDate: new Date().toLocaleDateString('vi-VN')
    },
    `/dashboard/seller/products/${productId}/reviews`
  )
}

// Wishlist notifications
export const notifyWishlistItemOnSale = async (userId: string, productName: string, originalPrice: number, salePrice: number, productId: string) => {
  const discount = Math.round(((originalPrice - salePrice) / originalPrice) * 100)
  
  const notificationData = {
    title: 'Sản phẩm yêu thích đang giảm giá!',
    message: `"${productName}" trong danh sách yêu thích của bạn đang giảm ${discount}% (từ ${originalPrice.toLocaleString('vi-VN')} VNĐ xuống ${salePrice.toLocaleString('vi-VN')} VNĐ).`,
    type: 'success' as const,
    category: 'product' as const,
    metadata: {
      productName,
      originalPrice: originalPrice.toLocaleString('vi-VN'),
      salePrice: salePrice.toLocaleString('vi-VN'),
      discount: discount.toString(),
      saleDate: new Date().toLocaleDateString('vi-VN')
    },
    actionUrl: `/dashboard/buyer/marketplace/product/${productId}`,
    actionText: 'Mua ngay'
  }
  
  return await sendNotification(
    'PRODUCT_SOLD',
    userId,
    {
      productName,
      amount: salePrice.toLocaleString('vi-VN'),
      originalPrice: originalPrice.toLocaleString('vi-VN'),
      salePrice: salePrice.toLocaleString('vi-VN'),
      discount: discount.toString(),
      saleDate: new Date().toLocaleDateString('vi-VN')
    },
    `/dashboard/buyer/marketplace/product/${productId}`
  )
}

// Credit/wallet notifications
export const notifyCreditAdded = async (userId: string, amount: number, method: string, newBalance: number) => {
  const notificationData = {
    title: 'Nạp tiền thành công',
    message: `Bạn đã nạp thành công ${amount.toLocaleString('vi-VN')} VNĐ vào tài khoản. Số dư hiện tại: ${newBalance.toLocaleString('vi-VN')} VNĐ.`,
    type: 'success' as const,
    category: 'payment' as const,
    metadata: {
      amount: amount.toLocaleString('vi-VN'),
      method,
      newBalance: newBalance.toLocaleString('vi-VN'),
      transactionDate: new Date().toLocaleDateString('vi-VN')
    },
    actionUrl: '/dashboard/credit',
    actionText: 'Xem lịch sử'
  }
  
  return await sendNotification(
    'CREDIT_DEPOSITED',
    userId,
    {
      amount: amount.toLocaleString('vi-VN'),
      method,
      newBalance: newBalance.toLocaleString('vi-VN'),
      transactionDate: new Date().toLocaleDateString('vi-VN')
    },
    '/dashboard/credit'
  )
}

export const notifyCreditWithdrawn = async (userId: string, amount: number, method: string, newBalance: number) => {
  const notificationData = {
    title: 'Rút tiền thành công',
    message: `Bạn đã rút thành công ${amount.toLocaleString('vi-VN')} VNĐ từ tài khoản. Số dư hiện tại: ${newBalance.toLocaleString('vi-VN')} VNĐ.`,
    type: 'info' as const,
    category: 'payment' as const,
    metadata: {
      amount: amount.toLocaleString('vi-VN'),
      method,
      newBalance: newBalance.toLocaleString('vi-VN'),
      transactionDate: new Date().toLocaleDateString('vi-VN')
    },
    actionUrl: '/dashboard/credit',
    actionText: 'Xem lịch sử'
  }
  
  return await sendNotification(
    'CREDIT_WITHDRAWN',
    userId,
    {
      amount: amount.toLocaleString('vi-VN'),
      method,
      newBalance: newBalance.toLocaleString('vi-VN'),
      transactionDate: new Date().toLocaleDateString('vi-VN')
    },
    '/dashboard/credit'
  )
}

// Additional helper functions for integrated notifications
export const notifyProductCreated = async (userId: string, productName: string, status: string, productId: string) => {
  const result = await sendNotification(
    'PRODUCT_APPROVED',
    userId,
    {
      productName,
      status,
      createdDate: new Date().toLocaleDateString('vi-VN')
    },
    `/dashboard/seller/products/${productId}`
  )
  
  return result
}

export const notifyOrderCreated = async (userId: string, productName: string, quantity: number, totalAmount: number, productId: string) => {
  const result = await sendNotification(
    'ORDER_RECEIVED',
    userId,
    {
      orderId: 'new',
      amount: totalAmount.toLocaleString('vi-VN'),
      productName,
      quantity: quantity.toString(),
      totalAmount: totalAmount.toLocaleString('vi-VN'),
      orderDate: new Date().toLocaleDateString('vi-VN')
    },
    `/dashboard/buyer/orders`
  )
  
  return result
}

export const notifyProductSold = async (userId: string, productName: string, quantity: number, totalAmount: number, buyerName: string, productId: string) => {
  const result = await sendNotification(
    'ORDER_RECEIVED',
    userId,
    {
      orderId: 'new',
      amount: totalAmount.toLocaleString('vi-VN'),
      productName,
      quantity: quantity.toString(),
      totalAmount: totalAmount.toLocaleString('vi-VN'),
      buyerName,
      saleDate: new Date().toLocaleDateString('vi-VN')
    },
    `/dashboard/seller/products/${productId}`
  )
  
  return result
}

export const notifyCreditUpdated = async (userId: string, action: 'added' | 'subtracted', amount: number, newBalance: number, reason: string) => {
  const result = await sendNotification(
    action === 'added' ? 'CREDIT_DEPOSITED' : 'CREDIT_WITHDRAWN',
    userId,
    {
      action,
      amount: amount.toLocaleString('vi-VN'),
      newBalance: newBalance.toLocaleString('vi-VN'),
      reason,
      updateDate: new Date().toLocaleDateString('vi-VN')
    },
    '/dashboard/credit'
  )
  
  return result
}

export const notifyRoleChanged = async (userId: string, oldRole: string, newRole: string, changedBy: string) => {
  try {
    await sendNotification(
      'ROLE_CHANGED',
      userId,
      {
        role: newRole,
        oldRole,
        changedBy,
        changeDate: new Date().toLocaleDateString('vi-VN')
      },
      '/dashboard/profile'
    )
  } catch (error) {
    console.error('Error sending role changed notification:', error)
  }
}

export const notifyAccountStatusChanged = async (userId: string, status: 'activated' | 'deactivated', changedBy: string) => {
  try {
    await sendNotification(
      status === 'activated' ? 'ACCOUNT_APPROVED' : 'ACCOUNT_SUSPENDED',
      userId,
      {
        status,
        changedBy,
        changeDate: new Date().toLocaleDateString('vi-VN')
      },
      '/dashboard/profile'
    )
  } catch (error) {
    console.error('Error sending account status changed notification:', error)
  }
}

export const notifySellerRequestSubmitted = async (userId: string, username: string) => {
  return await sendNotification(
    'SELLER_REQUEST_SUBMITTED',
    userId,
    {
      username,
      requestDate: new Date().toLocaleDateString('vi-VN')
    },
    '/dashboard/profile'
  )
}

// Notify admins/managers about new seller request
export const notifyAdminsNewSellerRequest = async (username: string, userEmail: string, userId: string) => {
  try {
    // Import User model dynamically to avoid circular dependency
    const User = (await import('@/models/User')).default
    
    // Get all admins and managers
    const adminUsers = await User.find({ 
      role: { $in: ['admin', 'manager'] },
      isActive: true 
    })

    // Notify each admin/manager
    for (const admin of adminUsers) {
      await sendNotification(
        'NEW_SELLER_REQUEST',
        admin._id.toString(),
        {
          username,
          userEmail,
          requestDate: new Date().toLocaleDateString('vi-VN')
        },
        `/dashboard/manager/users/${userId}/seller-request`
      )
    }
  } catch (error) {
    console.error('Error sending new seller request notifications to admins:', error)
  }
}

// Report-related notifications
export const notifyReportCreated = async (adminUserId: string, reportTitle: string, reportType: string, reporterName: string, reportId: string) => {
  try {
    await sendNotification(
      'REPORT_CREATED',
      adminUserId,
      {
        reportTitle,
        reportType,
        reporterName,
        reportDate: new Date().toLocaleDateString('vi-VN')
      },
      `/dashboard/admin/reports`
    )
    

  } catch (error) {
    console.error('Error sending report created notification:', error)
  }
}

export const notifyReportResolved = async (userId: string, reportTitle: string, status: string, adminNote: string, reportId: string) => {
  try {
    await sendNotification(
      'REPORT_RESOLVED',
      userId,
      {
        reportTitle,
        status,
        adminNote,
        resolvedDate: new Date().toLocaleDateString('vi-VN')
      },
      `/dashboard/buyer/reports/${reportId}`
    )
  } catch (error) {
    console.error('Error sending report resolved notification:', error)
  }
}

export const notifyRefundProcessed = async (userId: string, refundAmount: number, reportTitle: string, reportId: string) => {
  try {
    await sendNotification(
      'REFUND_PROCESSED',
      userId,
      {
        refundAmount: refundAmount.toLocaleString('vi-VN'),
        reportTitle,
        processedDate: new Date().toLocaleDateString('vi-VN')
      },
      `/dashboard/buyer/reports/${reportId}`
    )
    

  } catch (error) {
    console.error('Error sending refund processed notification:', error)
  }
}

// Seller request approval/rejection notifications
export const notifySellerRequestApproved = async (userId: string) => {
  try {
    await sendNotification(
      'SELLER_REQUEST_APPROVED',
      userId,
      {},
      '/dashboard/seller/products'
    )
  } catch (error) {
    console.error('Error sending seller request approved notification:', error)
  }
}

export const notifySellerRequestRejected = async (userId: string, note?: string) => {
  try {
    await sendNotification(
      'SELLER_REQUEST_REJECTED',
      userId,
      {
        note: note ? `. Lý do: ${note}` : ''
      },
      '/dashboard/profile'
    )
  } catch (error) {
    console.error('Error sending seller request rejected notification:', error)
  }
}

// Legacy function for backward compatibility
export const createNotification = async (userId: string, message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
  try {
    // Direct database operation to create notification
    const connectDB = (await import('@/lib/mongodb')).default
    const Notification = (await import('@/models/Notification')).default
    
    await connectDB()
    
    const notification = new Notification({
      userId,
      title: type === 'success' ? 'Thông báo' : type === 'error' ? 'Lỗi' : 'Thông tin',
      message,
      type,
      category: 'account',
      isRead: false
    })
    
    await notification.save()
    
    // Send real-time notification via Supabase Realtime
    try {
      const { supabase } = await import('@/lib/supabase')
      const channel = supabase.channel(`user-${userId}`)
      
      // Subscribe to channel first, then send the message
      await new Promise((resolve, reject) => {
        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            // Channel is ready, send the notification
            channel.send({
              type: 'broadcast',
              event: 'new-notification',
              payload: {
                _id: notification._id,
                title: notification.title,
                message: notification.message,
                type: notification.type,
                category: notification.category,
                isRead: notification.isRead,
                actionUrl: notification.actionUrl,
                actionText: notification.actionText,
                createdAt: notification.createdAt,
                metadata: notification.metadata
              }
            }).then(() => {
              // Unsubscribe after sending
              channel.unsubscribe()
              resolve(true)
            }).catch(reject)
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            reject(new Error(`Channel subscription failed: ${status}`))
          }
        })
        
        // Set a timeout to avoid hanging
        setTimeout(() => {
          reject(new Error('Channel subscription timeout'))
        }, 5000)
      })
      
      console.log(`Legacy realtime notification sent to user ${userId}`)
    } catch (error) {
      console.error('Failed to send Supabase Realtime notification:', error)
    }
    
    return {
      success: true,
      notification
    }
  } catch (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}