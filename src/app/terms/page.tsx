'use client';

import { Shield, FileText, Users, CreditCard, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth'
import Header from '@/components/Header'
import PublicHeader from '@/components/PublicHeader'
import Footer from '@/components/Footer';

export default function TermsPage() {
  const { user, loading, logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
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
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">Điều khoản sử dụng</h1>
              <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                Vui lòng đọc kỹ các điều khoản và điều kiện sử dụng dịch vụ của chúng tôi.
              </p>
            </div>
          </div>
        </div>

        {/* Terms Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-lg shadow-lg p-8 space-y-8">
            
            {/* Introduction */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center space-x-3 mb-4">
                <FileText className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">1. Giới thiệu</h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Chào mừng bạn đến với MMO Store. Bằng việc truy cập và sử dụng trang web của chúng tôi, 
                bạn đồng ý tuân thủ và bị ràng buộc bởi các điều khoản và điều kiện sử dụng sau đây. 
                Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản này, vui lòng không sử dụng dịch vụ của chúng tôi.
              </p>
            </div>

            {/* User Accounts */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center space-x-3 mb-4">
                <Users className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">2. Tài khoản người dùng</h2>
              </div>
              <div className="space-y-4 text-gray-600">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p>Bạn phải đủ 18 tuổi hoặc có sự đồng ý của cha mẹ/người giám hộ để tạo tài khoản.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p>Thông tin đăng ký phải chính xác, đầy đủ và được cập nhật thường xuyên.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p>Bạn có trách nhiệm bảo mật thông tin đăng nhập và chịu trách nhiệm về mọi hoạt động trong tài khoản.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p>Nghiêm cấm việc chia sẻ, bán hoặc chuyển nhượng tài khoản cho bên thứ ba.</p>
                </div>
              </div>
            </div>

            {/* Marketplace Rules */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">3. Quy định marketplace</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Đối với người bán:</h3>
                  <ul className="space-y-2 text-gray-600 ml-4">
                    <li>• Sản phẩm phải là tài khoản game/ứng dụng hợp pháp và không vi phạm bản quyền</li>
                    <li>• Mô tả sản phẩm phải chính xác, đầy đủ và không gây hiểu lầm</li>
                    <li>• Giao hàng đúng thời gian đã cam kết</li>
                    <li>• Không được bán tài khoản đã bị khóa, hack hoặc có vấn đề bảo mật</li>
                    <li>• Tuân thủ chính sách hoàn tiền và hỗ trợ khách hàng</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Đối với người mua:</h3>
                  <ul className="space-y-2 text-gray-600 ml-4">
                    <li>• Thanh toán đầy đủ và đúng hạn</li>
                    <li>• Kiểm tra kỹ thông tin sản phẩm trước khi mua</li>
                    <li>• Không sử dụng tài khoản đã mua để vi phạm điều khoản của game/ứng dụng gốc</li>
                    <li>• Báo cáo kịp thời nếu phát hiện sản phẩm có vấn đề</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Payment Terms */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center space-x-3 mb-4">
                <CreditCard className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">4. Thanh toán và phí dịch vụ</h2>
              </div>
              <div className="space-y-4 text-gray-600">
                <p>Chúng tôi thu phí dịch vụ từ mỗi giao dịch thành công:</p>
                <ul className="space-y-2 ml-4">
                  <li>• Phí người bán: 5% giá trị đơn hàng</li>
                  <li>• Phí người mua: 2% giá trị đơn hàng</li>
                  <li>• Phí rút tiền: 10,000 VNĐ/lần rút</li>
                  <li>• Thanh toán được xử lý qua PayOS với các phương thức: Thẻ ATM, Ví điện tử, QR Code</li>
                </ul>
                <p>Tất cả giao dịch đều được bảo vệ bởi hệ thống escrow, đảm bảo an toàn cho cả người mua và người bán.</p>
              </div>
            </div>

            {/* Prohibited Activities */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <h2 className="text-2xl font-bold text-gray-900">5. Hoạt động bị cấm</h2>
              </div>
              <div className="space-y-4 text-gray-600">
                <p>Các hoạt động sau đây bị nghiêm cấm trên nền tảng:</p>
                <ul className="space-y-2 ml-4">
                  <li>• Bán tài khoản giả mạo, hack hoặc bất hợp pháp</li>
                  <li>• Lừa đảo, gian lận trong giao dịch</li>
                  <li>• Sử dụng bot, script tự động để thao túng hệ thống</li>
                  <li>• Đăng nội dung khiêu dâm, bạo lực hoặc vi phạm pháp luật</li>
                  <li>• Spam, quảng cáo không liên quan</li>
                  <li>• Tạo nhiều tài khoản để lách luật</li>
                  <li>• Vi phạm quyền sở hữu trí tuệ của bên thứ ba</li>
                </ul>
              </div>
            </div>

            {/* Dispute Resolution */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">6. Giải quyết tranh chấp</h2>
              </div>
              <div className="space-y-4 text-gray-600">
                <p>Khi có tranh chấp giữa người mua và người bán:</p>
                <ul className="space-y-2 ml-4">
                  <li>• Các bên nên cố gắng giải quyết trực tiếp trước</li>
                  <li>• Nếu không thể thỏa thuận, có thể yêu cầu can thiệp từ đội ngũ hỗ trợ</li>
                  <li>• Chúng tôi sẽ xem xét bằng chứng từ cả hai bên và đưa ra quyết định công bằng</li>
                  <li>• Quyết định của chúng tôi là cuối cùng và có tính ràng buộc</li>
                  <li>• Thời gian giải quyết tranh chấp: 3-7 ngày làm việc</li>
                </ul>
              </div>
            </div>

            {/* Liability */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">7. Giới hạn trách nhiệm</h2>
              </div>
              <div className="space-y-4 text-gray-600">
                <p>MMO Store hoạt động như một nền tảng trung gian:</p>
                <ul className="space-y-2 ml-4">
                  <li>• Chúng tôi không chịu trách nhiệm về chất lượng sản phẩm được bán</li>
                  <li>• Không đảm bảo tính khả dụng liên tục của dịch vụ</li>
                  <li>• Không chịu trách nhiệm về thiệt hại gián tiếp hoặc hậu quả</li>
                  <li>• Trách nhiệm tối đa của chúng tôi không vượt quá giá trị giao dịch</li>
                </ul>
              </div>
            </div>

            {/* Changes to Terms */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <FileText className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">8. Thay đổi điều khoản</h2>
              </div>
              <div className="space-y-4 text-gray-600">
                <p>
                  Chúng tôi có quyền cập nhật và thay đổi các điều khoản này bất cứ lúc nào. 
                  Các thay đổi sẽ có hiệu lực ngay khi được đăng tải trên website. 
                  Việc tiếp tục sử dụng dịch vụ sau khi có thay đổi đồng nghĩa với việc bạn chấp nhận các điều khoản mới.
                </p>
                <p className="text-sm text-gray-500">
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