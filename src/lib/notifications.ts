import { INotification } from '@/models/Notification'

// Notification templates for different scenarios
export const NotificationTemplates = {
  // Product related notifications
  PRODUCT_APPROVED: {
    title: 'Sản phẩm đã được phê duyệt',
    message: 'Sản phẩm "{productName}" của bạn đã được phê duyệt và có thể bán trên marketplace.',
    type: 'success' as const,
    category: 'product' as const,
    actionText: 'Xem sản phẩm'
  },
  PRODUCT_REJECTED: {
    title: 'Sản phẩm bị từ chối',
    message: 'Sản phẩm "{productName}" của bạn đã bị từ chối. Lý do: {reason}',
    type: 'error' as const,
    category: 'product' as const,
    actionText: 'Chỉnh sửa sản phẩm'
  },
  PRODUCT_SOLD: {
    title: 'Đã bán được sản phẩm!',
    message: 'Chúc mừng! Sản phẩm "{productName}" của bạn đã được bán với giá {amount} VNĐ.',
    type: 'success' as const,
    category: 'order' as const,
    actionText: 'Xem đơn hàng'
  },
  PRODUCT_OUT_OF_STOCK: {
    title: 'Sản phẩm hết hàng',
    message: 'Sản phẩm "{productName}" của bạn đã hết hàng. Vui lòng bổ sung thêm.',
    type: 'warning' as const,
    category: 'product' as const,
    actionText: 'Bổ sung hàng'
  },

  // Order related notifications
  ORDER_RECEIVED: {
    title: 'Đơn hàng mới',
    message: 'Bạn có đơn hàng mới #{orderId} với giá trị {amount} VNĐ.',
    type: 'info' as const,
    category: 'order' as const,
    actionText: 'Xem đơn hàng'
  },
  ORDER_COMPLETED: {
    title: 'Đơn hàng hoàn thành',
    message: 'Đơn hàng #{orderId} đã được hoàn thành thành công.',
    type: 'success' as const,
    category: 'order' as const,
    actionText: 'Xem chi tiết'
  },
  ORDER_CANCELLED: {
    title: 'Đơn hàng bị hủy',
    message: 'Đơn hàng #{orderId} đã bị hủy. Lý do: {reason}',
    type: 'warning' as const,
    category: 'order' as const,
    actionText: 'Xem chi tiết'
  },

  // Account related notifications
  SELLER_REQUEST_SUBMITTED: {
    title: 'Yêu cầu trở thành seller đã được gửi',
    message: 'Yêu cầu trở thành seller của bạn đã được gửi thành công. Vui lòng đợi admin/manager xem xét.',
    type: 'info' as const,
    category: 'account' as const,
    actionText: 'Xem trạng thái'
  },
  NEW_SELLER_REQUEST: {
    title: 'Yêu cầu trở thành seller mới',
    message: 'Người dùng {username} ({userEmail}) đã gửi yêu cầu trở thành seller vào ngày {requestDate}.',
    type: 'info' as const,
    category: 'account' as const,
    actionText: 'Xem yêu cầu'
  },
  
  // Seller request approval/rejection
  SELLER_REQUEST_APPROVED: {
    title: 'Yêu cầu trở thành seller đã được phê duyệt',
    message: 'Chúc mừng! Yêu cầu trở thành người bán của bạn đã được phê duyệt. Bạn có thể bắt đầu bán sản phẩm ngay bây giờ.',
    type: 'success' as const,
    category: 'account' as const,
    actionText: 'Bắt đầu bán hàng'
  },
  SELLER_REQUEST_REJECTED: {
    title: 'Yêu cầu trở thành seller bị từ chối',
    message: 'Yêu cầu trở thành người bán của bạn đã bị từ chối{note}. Bạn có thể gửi lại yêu cầu sau khi khắc phục các vấn đề.',
    type: 'error' as const,
    category: 'account' as const,
    actionText: 'Gửi lại yêu cầu'
  },
  ACCOUNT_APPROVED: {
    title: 'Tài khoản được phê duyệt',
    message: 'Tài khoản {role} của bạn đã được phê duyệt. Chào mừng bạn đến với marketplace!',
    type: 'success' as const,
    category: 'account' as const,
    actionText: 'Bắt đầu'
  },
  ACCOUNT_REJECTED: {
    title: 'Tài khoản bị từ chối',
    message: 'Yêu cầu {role} của bạn đã bị từ chối. Lý do: {reason}',
    type: 'error' as const,
    category: 'account' as const,
    actionText: 'Nộp lại đơn'
  },
  ACCOUNT_SUSPENDED: {
    title: 'Tài khoản bị tạm khóa',
    message: 'Tài khoản của bạn đã bị tạm khóa do vi phạm quy định. Liên hệ hỗ trợ để biết thêm chi tiết.',
    type: 'error' as const,
    category: 'account' as const,
    actionText: 'Liên hệ hỗ trợ'
  },
  ROLE_CHANGED: {
    title: 'Quyền tài khoản đã thay đổi',
    message: 'Quyền tài khoản của bạn đã được thay đổi từ {oldRole} thành {role} bởi {changedBy}.',
    type: 'info' as const,
    category: 'account' as const,
    actionText: 'Xem hồ sơ'
  },

  // Payment related notifications
  PAYMENT_RECEIVED: {
    title: 'Đã nhận thanh toán',
    message: 'Bạn đã nhận được {amount} VNĐ từ đơn hàng #{orderId}.',
    type: 'success' as const,
    category: 'payment' as const,
    actionText: 'Xem giao dịch'
  },
  CREDIT_DEPOSITED: {
    title: 'Nạp credit thành công',
    message: 'Bạn đã nạp thành công {amount} VNĐ vào tài khoản.',
    type: 'success' as const,
    category: 'payment' as const,
    actionText: 'Xem số dư'
  },
  CREDIT_WITHDRAWN: {
    title: 'Rút tiền thành công',
    message: 'Bạn đã rút thành công {amount} VNĐ từ tài khoản.',
    type: 'success' as const,
    category: 'payment' as const,
    actionText: 'Xem giao dịch'
  },
  WITHDRAWAL_FAILED: {
    title: 'Rút tiền thất bại',
    message: 'Yêu cầu rút {amount} VNĐ của bạn đã thất bại. Lý do: {reason}',
    type: 'error' as const,
    category: 'payment' as const,
    actionText: 'Thử lại'
  },

  // System notifications
  SYSTEM_MAINTENANCE: {
    title: 'Bảo trì hệ thống',
    message: 'Hệ thống sẽ bảo trì từ {startTime} đến {endTime}. Vui lòng hoàn thành giao dịch trước thời gian này.',
    type: 'warning' as const,
    category: 'system' as const
  },
  WELCOME: {
    title: 'Chào mừng đến với MMO Store!',
    message: 'Cảm ơn bạn đã tham gia cộng đồng của chúng tôi. Hãy khám phá các tính năng tuyệt vời!',
    type: 'info' as const,
    category: 'system' as const,
    actionText: 'Khám phá'
  },

  // Message related notifications
  NEW_MESSAGE: {
    title: 'Tin nhắn mới',
    message: 'Bạn có tin nhắn mới từ {senderName}: "{messageContent}"',
    type: 'info' as const,
    category: 'system' as const,
    actionText: 'Xem tin nhắn'
  },

  // Report related notifications
  REPORT_CREATED: {
    title: 'Báo cáo mới',
    message: 'Có báo cáo mới từ {reporterName}: "{reportTitle}" về {reportType}.',
    type: 'warning' as const,
    category: 'system' as const,
    actionText: 'Xem báo cáo'
  },
  REPORT_RESOLVED: {
    title: 'Báo cáo đã được xử lý',
    message: 'Báo cáo "{reportTitle}" của bạn đã được xử lý. Trạng thái: {status}.',
    type: 'info' as const,
    category: 'system' as const,
    actionText: 'Xem chi tiết'
  },
  REFUND_PROCESSED: {
    title: 'Hoàn tiền thành công',
    message: 'Bạn đã được hoàn {refundAmount} VNĐ cho báo cáo "{reportTitle}".',
    type: 'success' as const,
    category: 'payment' as const,
    actionText: 'Xem chi tiết'
  },
  SELLER_REPLY: {
    title: 'Người bán đã phản hồi đánh giá',
    message: 'Người bán {sellerName} đã phản hồi đánh giá của bạn cho sản phẩm "{productName}" vào ngày {replyDate}.',
    type: 'info' as const,
    category: 'product' as const,
    actionText: 'Xem phản hồi'
  }
}

// Helper function to replace placeholders in notification templates
export function formatNotificationMessage(template: string, data: Record<string, any>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return data[key] !== undefined ? String(data[key]) : match
  })
}

// Helper function to create notification data
export function createNotificationData(
  templateKey: keyof typeof NotificationTemplates,
  userId: string,
  data: Record<string, any> = {},
  actionUrl?: string
): Omit<INotification, '_id' | 'createdAt' | 'updatedAt'> {
  const template = NotificationTemplates[templateKey]
  
  if (!template) {
    console.error(`Template not found for key: ${templateKey}`)
    throw new Error(`Template not found for key: ${templateKey}`)
  }
  
  return {
    userId,
    title: formatNotificationMessage(template.title, data),
    message: formatNotificationMessage(template.message, data),
    type: template.type,
    category: template.category,
    isRead: false,
    actionUrl: actionUrl || data.actionUrl,
    actionText: 'actionText' in template ? template.actionText : undefined,
    metadata: data
  }
}

// Utility function to send notification (to be used in API routes)
export async function sendNotification(
  templateKey: keyof typeof NotificationTemplates,
  userId: string,
  data: Record<string, any> = {},
  actionUrl?: string
) {
  try {
    const notificationData = createNotificationData(templateKey, userId, data, actionUrl)
    
    // Direct database operation instead of HTTP call to avoid circular dependency
    const connectDB = (await import('@/lib/mongodb')).default
    const Notification = (await import('@/models/Notification')).default
    
    await connectDB()
    
    const notification = new Notification(notificationData)
    await notification.save()
    
    // Send real-time notification via Socket.io
    if (global.io) {
      try {
        global.io.to(`user-${userId}`).emit('new-notification', {
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
        })
      } catch (error) {
        console.error('Failed to send Socket.io notification:', error)
      }
    }
    
    return {
      success: true,
      notification
    }
  } catch (error) {
    console.error('Error sending notification:', error)
    throw error
  }
}

// Utility function for bulk notifications (e.g., system announcements)
export async function sendBulkNotification(
  templateKey: keyof typeof NotificationTemplates,
  userIds: string[],
  data: Record<string, any> = {},
  actionUrl?: string
) {
  try {
    const notifications = userIds.map(userId => 
      createNotificationData(templateKey, userId, data, actionUrl)
    )
    
    // Direct database operation instead of HTTP call
    const connectDB = (await import('@/lib/mongodb')).default
    const Notification = (await import('@/models/Notification')).default
    
    await connectDB()
    
    const result = await Notification.insertMany(notifications)
    
    // Send real-time notifications via Socket.io for each created notification
    if (global.io && result.length > 0) {
      try {
        result.forEach(notification => {
          const userId = notification.userId
          global.io.to(`user-${userId}`).emit('new-notification', {
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
          })
        })
        console.log(`Socket.io bulk notifications sent for ${result.length} notifications`)
      } catch (socketError) {
        console.error('Failed to send Socket.io bulk notifications:', socketError)
      }
    }
    
    return {
      success: true,
      insertedCount: result.length,
      notifications: result
    }
  } catch (error) {
    console.error('Error sending bulk notifications:', error)
    throw error
  }
}