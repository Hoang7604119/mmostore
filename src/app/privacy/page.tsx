'use client';

import { Shield, Eye, Lock, Database, UserCheck, AlertCircle, FileText, Globe } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth'
import Header from '@/components/Header'
import PublicHeader from '@/components/PublicHeader'
import Footer from '@/components/Footer';

export default function PrivacyPage() {
  const { user, loading, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {user ? (
        <Header user={user} onLogout={handleLogout} />
      ) : (
        <PublicHeader />
      )}
      <div className="flex-1">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-bold mb-4">Chính sách bảo mật</h1>
              <p className="text-lg sm:text-xl text-green-100 max-w-2xl mx-auto">
                Chúng tôi cam kết bảo vệ quyền riêng tư và thông tin cá nhân của bạn một cách tốt nhất.
              </p>
            </div>
          </div>
        </div>

        {/* Privacy Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8 space-y-6 sm:space-y-8">
            
            {/* Introduction */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">1. Cam kết bảo mật</h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                MMO Store cam kết bảo vệ thông tin cá nhân của người dùng. Chính sách này mô tả cách chúng tôi 
                thu thập, sử dụng, lưu trữ và bảo vệ thông tin của bạn khi sử dụng dịch vụ của chúng tôi. 
                Bằng việc sử dụng website, bạn đồng ý với các thực hành được mô tả trong chính sách này.
              </p>
            </div>

            {/* Information Collection */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center space-x-3 mb-4">
                <Database className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">2. Thông tin chúng tôi thu thập</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Thông tin cá nhân:</h3>
                  <ul className="space-y-2 text-gray-600 ml-4">
                    <li>• Họ tên, email, số điện thoại</li>
                    <li>• Thông tin thanh toán (được mã hóa và xử lý qua PayOS)</li>
                    <li>• Địa chỉ IP và thông tin thiết bị</li>
                    <li>• Lịch sử giao dịch và hoạt động trên nền tảng</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Thông tin tự động:</h3>
                  <ul className="space-y-2 text-gray-600 ml-4">
                    <li>• Cookies và dữ liệu phiên làm việc</li>
                    <li>• Thông tin trình duyệt và hệ điều hành</li>
                    <li>• Thời gian truy cập và tương tác với website</li>
                    <li>• Dữ liệu phân tích và thống kê sử dụng</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Information Usage */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center space-x-3 mb-4">
                <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">3. Cách chúng tôi sử dụng thông tin</h2>
              </div>
              <div className="space-y-4 text-gray-600">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Mục đích chính:</h4>
                  <ul className="space-y-1 text-green-700">
                    <li>• Cung cấp và vận hành dịch vụ marketplace</li>
                    <li>• Xử lý giao dịch và thanh toán</li>
                    <li>• Xác thực danh tính và ngăn chặn gian lận</li>
                    <li>• Hỗ trợ khách hàng và giải quyết tranh chấp</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Mục đích phụ:</h4>
                  <ul className="space-y-1">
                    <li>• Cải thiện chất lượng dịch vụ</li>
                    <li>• Gửi thông báo quan trọng về tài khoản</li>
                    <li>• Phân tích xu hướng và hành vi người dùng</li>
                    <li>• Tuân thủ các yêu cầu pháp lý</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Data Protection */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center space-x-3 mb-4">
                <Lock className="w-6 h-6 text-green-600" />
                <h2 className="text-2xl font-bold text-gray-900">4. Bảo vệ dữ liệu</h2>
              </div>
              <div className="space-y-4 text-gray-600">
                <p>Chúng tôi áp dụng nhiều lớp bảo mật để bảo vệ thông tin của bạn:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Bảo mật kỹ thuật:</h4>
                    <ul className="space-y-1 text-blue-700 text-sm">
                      <li>• Mã hóa SSL/TLS cho tất cả dữ liệu truyền tải</li>
                      <li>• Mã hóa AES-256 cho dữ liệu lưu trữ</li>
                      <li>• Xác thực hai yếu tố (2FA)</li>
                      <li>• Firewall và hệ thống phát hiện xâm nhập</li>
                    </ul>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-800 mb-2">Bảo mật vận hành:</h4>
                    <ul className="space-y-1 text-purple-700 text-sm">
                      <li>• Kiểm soát truy cập nghiêm ngặt</li>
                      <li>• Sao lưu dữ liệu định kỳ</li>
                      <li>• Giám sát bảo mật 24/7</li>
                      <li>• Đào tạo nhân viên về bảo mật</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Sharing */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center space-x-3 mb-4">
                <UserCheck className="w-6 h-6 text-green-600" />
                <h2 className="text-2xl font-bold text-gray-900">5. Chia sẻ thông tin</h2>
              </div>
              <div className="space-y-4 text-gray-600">
                <p>Chúng tôi <strong>KHÔNG</strong> bán, cho thuê hoặc trao đổi thông tin cá nhân của bạn với bên thứ ba vì mục đích thương mại.</p>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <h4 className="font-semibold text-yellow-800 mb-2">Chúng tôi chỉ chia sẻ thông tin trong các trường hợp:</h4>
                  <ul className="space-y-1 text-yellow-700">
                    <li>• Với đối tác thanh toán (PayOS) để xử lý giao dịch</li>
                    <li>• Khi có yêu cầu từ cơ quan pháp luật có thẩm quyền</li>
                    <li>• Để bảo vệ quyền lợi và an toàn của người dùng khác</li>
                    <li>• Với sự đồng ý rõ ràng của bạn</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Cookies */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center space-x-3 mb-4">
                <Globe className="w-6 h-6 text-green-600" />
                <h2 className="text-2xl font-bold text-gray-900">6. Cookies và công nghệ theo dõi</h2>
              </div>
              <div className="space-y-4 text-gray-600">
                <p>Chúng tôi sử dụng cookies và các công nghệ tương tự để:</p>
                <ul className="space-y-2 ml-4">
                  <li>• Ghi nhớ thông tin đăng nhập và tùy chọn của bạn</li>
                  <li>• Cải thiện trải nghiệm người dùng</li>
                  <li>• Phân tích lưu lượng truy cập website</li>
                  <li>• Ngăn chặn gian lận và tăng cường bảo mật</li>
                </ul>
                <p>Bạn có thể quản lý cookies thông qua cài đặt trình duyệt, tuy nhiên việc tắt cookies có thể ảnh hưởng đến một số tính năng của website.</p>
              </div>
            </div>

            {/* User Rights */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center space-x-3 mb-4">
                <UserCheck className="w-6 h-6 text-green-600" />
                <h2 className="text-2xl font-bold text-gray-900">7. Quyền của người dùng</h2>
              </div>
              <div className="space-y-4 text-gray-600">
                <p>Bạn có các quyền sau đối với thông tin cá nhân của mình:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="font-medium">Quyền truy cập:</span>
                    </div>
                    <p className="text-sm ml-4">Yêu cầu xem thông tin cá nhân chúng tôi đang lưu trữ</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="font-medium">Quyền chỉnh sửa:</span>
                    </div>
                    <p className="text-sm ml-4">Cập nhật hoặc sửa đổi thông tin không chính xác</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="font-medium">Quyền xóa:</span>
                    </div>
                    <p className="text-sm ml-4">Yêu cầu xóa thông tin cá nhân (trong một số trường hợp)</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="font-medium">Quyền phản đối:</span>
                    </div>
                    <p className="text-sm ml-4">Từ chối việc xử lý thông tin cho mục đích marketing</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Retention */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center space-x-3 mb-4">
                <Database className="w-6 h-6 text-green-600" />
                <h2 className="text-2xl font-bold text-gray-900">8. Thời gian lưu trữ dữ liệu</h2>
              </div>
              <div className="space-y-4 text-gray-600">
                <p>Chúng tôi chỉ lưu trữ thông tin cá nhân trong thời gian cần thiết:</p>
                <ul className="space-y-2 ml-4">
                  <li>• <strong>Thông tin tài khoản:</strong> Cho đến khi bạn yêu cầu xóa tài khoản</li>
                  <li>• <strong>Lịch sử giao dịch:</strong> 7 năm (theo quy định pháp luật)</li>
                  <li>• <strong>Dữ liệu phân tích:</strong> 2 năm</li>
                  <li>• <strong>Logs bảo mật:</strong> 1 năm</li>
                </ul>
                <p>Sau thời gian này, dữ liệu sẽ được xóa hoặc ẩn danh hóa một cách an toàn.</p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center space-x-3 mb-4">
                <AlertCircle className="w-6 h-6 text-green-600" />
                <h2 className="text-2xl font-bold text-gray-900">9. Liên hệ về quyền riêng tư</h2>
              </div>
              <div className="space-y-4 text-gray-600">
                <p>Nếu bạn có bất kỳ câu hỏi nào về chính sách bảo mật này hoặc muốn thực hiện quyền của mình, vui lòng liên hệ:</p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <ul className="space-y-2">
                    <li><strong>Email:</strong> support@mail.mmostore.site</li>
                    <li><strong>Điện thoại:</strong> +84 123 456 789</li>
                    <li><strong>Địa chỉ:</strong> 123 Đường ABC, Quận 1, TP.HCM</li>
                    <li><strong>Thời gian phản hồi:</strong> Trong vòng 30 ngày</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Policy Updates */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <FileText className="w-6 h-6 text-green-600" />
                <h2 className="text-2xl font-bold text-gray-900">10. Cập nhật chính sách</h2>
              </div>
              <div className="space-y-4 text-gray-600">
                <p>
                  Chúng tôi có thể cập nhật chính sách bảo mật này theo thời gian để phản ánh các thay đổi 
                  trong thực hành của chúng tôi hoặc vì lý do pháp lý, vận hành hoặc quy định khác.
                </p>
                <p>
                  Chúng tôi sẽ thông báo về các thay đổi quan trọng qua email hoặc thông báo nổi bật trên website. 
                  Việc tiếp tục sử dụng dịch vụ sau khi thay đổi có nghĩa là bạn chấp nhận chính sách mới.
                </p>
                <p className="text-sm text-gray-500">
                  <strong>Phiên bản hiện tại:</strong> 2.0<br/>
                  <strong>Cập nhật lần cuối:</strong> {new Date().toLocaleDateString('vi-VN')}
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}