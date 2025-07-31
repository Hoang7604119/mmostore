'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, Search, MessageCircle, Shield, CreditCard, Users, Truck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth'
import Header from '@/components/Header'
import PublicHeader from '@/components/PublicHeader'
import Footer from '@/components/Footer';

interface FAQItem {
  id: number;
  category: string;
  question: string;
  answer: string;
  icon: React.ReactNode;
}

const faqData: FAQItem[] = [
  // General Questions
  {
    id: 1,
    category: 'Tổng quan',
    question: 'MMO Store là gì?',
    answer: 'MMO Store là nền tảng trung gian an toàn cho việc mua bán tài khoản game, ứng dụng và các dịch vụ số. Chúng tôi cung cấp hệ thống escrow bảo vệ cả người mua và người bán.',
    icon: <HelpCircle className="w-5 h-5" />
  },
  {
    id: 2,
    category: 'Tổng quan',
    question: 'Làm thế nào để bắt đầu sử dụng?',
    answer: 'Bạn chỉ cần đăng ký tài khoản miễn phí, xác thực email và có thể bắt đầu mua bán ngay lập tức. Không cần phí đăng ký hay phí hàng tháng.',
    icon: <Users className="w-5 h-5" />
  },
  {
    id: 3,
    category: 'Tổng quan',
    question: 'Tôi có thể bán những gì trên nền tảng?',
    answer: 'Bạn có thể bán tài khoản game (PUBG, Free Fire, Liên Quân, v.v.), tài khoản ứng dụng (Netflix, Spotify, v.v.), và các dịch vụ số khác. Tất cả phải là hợp pháp và không vi phạm bản quyền.',
    icon: <MessageCircle className="w-5 h-5" />
  },

  // Account & Security
  {
    id: 4,
    category: 'Tài khoản & Bảo mật',
    question: 'Làm thế nào để bảo mật tài khoản của tôi?',
    answer: 'Sử dụng mật khẩu mạnh, bật xác thực hai yếu tố (2FA), không chia sẻ thông tin đăng nhập với ai. Chúng tôi cũng có hệ thống giám sát bảo mật 24/7.',
    icon: <Shield className="w-5 h-5" />
  },
  {
    id: 5,
    category: 'Tài khoản & Bảo mật',
    question: 'Tôi quên mật khẩu, phải làm sao?',
    answer: 'Nhấp vào "Quên mật khẩu" ở trang đăng nhập, nhập email đã đăng ký. Chúng tôi sẽ gửi link đặt lại mật khẩu đến email của bạn trong vòng 5 phút.',
    icon: <Shield className="w-5 h-5" />
  },
  {
    id: 6,
    category: 'Tài khoản & Bảo mật',
    question: 'Tôi có thể thay đổi email đã đăng ký không?',
    answer: 'Có, bạn có thể thay đổi email trong phần Cài đặt tài khoản. Bạn sẽ cần xác thực cả email cũ và email mới để đảm bảo bảo mật.',
    icon: <Users className="w-5 h-5" />
  },

  // Payment & Fees
  {
    id: 7,
    category: 'Thanh toán & Phí',
    question: 'Các phương thức thanh toán nào được hỗ trợ?',
    answer: 'Chúng tôi hỗ trợ thanh toán qua PayOS với các phương thức: Thẻ ATM nội địa, Ví điện tử (MoMo, ZaloPay, ViettelPay), QR Code ngân hàng.',
    icon: <CreditCard className="w-5 h-5" />
  },
  {
    id: 8,
    category: 'Thanh toán & Phí',
    question: 'Phí dịch vụ là bao nhiêu?',
    answer: 'Phí người bán: 5% giá trị đơn hàng. Phí người mua: 2% giá trị đơn hàng. Phí rút tiền: 10,000 VNĐ/lần. Không có phí ẩn nào khác.',
    icon: <CreditCard className="w-5 h-5" />
  },
  {
    id: 9,
    category: 'Thanh toán & Phí',
    question: 'Khi nào tôi nhận được tiền sau khi bán?',
    answer: 'Tiền sẽ được chuyển vào ví của bạn ngay sau khi người mua xác nhận đã nhận được sản phẩm, hoặc sau 24 giờ nếu không có khiếu nại nào.',
    icon: <CreditCard className="w-5 h-5" />
  },
  {
    id: 10,
    category: 'Thanh toán & Phí',
    question: 'Tôi có thể rút tiền như thế nào?',
    answer: 'Bạn có thể rút tiền về tài khoản ngân hàng hoặc ví điện tử. Thời gian xử lý: 1-3 ngày làm việc. Số tiền rút tối thiểu là 50,000 VNĐ.',
    icon: <CreditCard className="w-5 h-5" />
  },

  // Buying & Selling
  {
    id: 11,
    category: 'Mua bán',
    question: 'Làm thế nào để mua một sản phẩm?',
    answer: 'Tìm sản phẩm bạn muốn, nhấp "Mua ngay", thanh toán qua PayOS. Tiền sẽ được giữ an toàn cho đến khi bạn nhận được sản phẩm và xác nhận.',
    icon: <Truck className="w-5 h-5" />
  },
  {
    id: 12,
    category: 'Mua bán',
    question: 'Tôi muốn bán sản phẩm, cần làm gì?',
    answer: 'Đăng ký làm seller, tạo listing với mô tả chi tiết, đặt giá hợp lý. Sau khi có người mua, giao sản phẩm theo đúng mô tả và nhận tiền.',
    icon: <Truck className="w-5 h-5" />
  },
  {
    id: 13,
    category: 'Mua bán',
    question: 'Nếu sản phẩm không đúng như mô tả thì sao?',
    answer: 'Bạn có thể mở tranh chấp trong vòng 24 giờ sau khi nhận sản phẩm. Đội ngũ hỗ trợ sẽ xem xét và hoàn tiền nếu seller vi phạm.',
    icon: <Shield className="w-5 h-5" />
  },
  {
    id: 14,
    category: 'Mua bán',
    question: 'Thời gian giao hàng là bao lâu?',
    answer: 'Đối với tài khoản số, thời gian giao hàng thường là ngay lập tức đến 24 giờ. Seller sẽ gửi thông tin tài khoản qua tin nhắn riêng tư.',
    icon: <Truck className="w-5 h-5" />
  },

  // Support & Disputes
  {
    id: 15,
    category: 'Hỗ trợ & Tranh chấp',
    question: 'Làm thế nào để liên hệ hỗ trợ?',
    answer: 'Bạn có thể liên hệ qua: Email support@mmostore.site, Hotline +84 123 456 789, hoặc chat trực tiếp trên website. Chúng tôi hỗ trợ 24/7.',
    icon: <MessageCircle className="w-5 h-5" />
  },
  {
    id: 16,
    category: 'Hỗ trợ & Tranh chấp',
    question: 'Quy trình giải quyết tranh chấp như thế nào?',
    answer: 'Mở tranh chấp → Cung cấp bằng chứng → Đội ngũ xem xét trong 3-7 ngày → Quyết định cuối cùng → Hoàn tiền hoặc chuyển tiền cho seller.',
    icon: <Shield className="w-5 h-5" />
  },
  {
    id: 17,
    category: 'Hỗ trợ & Tranh chấp',
    question: 'Tôi bị lừa đảo, phải làm sao?',
    answer: 'Ngay lập tức báo cáo cho chúng tôi qua email hoặc hotline. Cung cấp đầy đủ bằng chứng. Chúng tôi sẽ điều tra và xử lý nghiêm khắc.',
    icon: <Shield className="w-5 h-5" />
  },

  // Technical Issues
  {
    id: 18,
    category: 'Kỹ thuật',
    question: 'Website bị lỗi, tôi không thể truy cập?',
    answer: 'Thử làm mới trang, xóa cache trình duyệt, hoặc thử trình duyệt khác. Nếu vẫn lỗi, liên hệ hỗ trợ kỹ thuật qua email tech@mmostore.site.',
    icon: <HelpCircle className="w-5 h-5" />
  },
  {
    id: 19,
    category: 'Kỹ thuật',
    question: 'Tôi không nhận được email xác thực?',
    answer: 'Kiểm tra thư mục spam/junk. Nếu không có, yêu cầu gửi lại email xác thực. Đảm bảo email đã nhập đúng và hộp thư không đầy.',
    icon: <MessageCircle className="w-5 h-5" />
  },
  {
    id: 20,
    category: 'Kỹ thuật',
    question: 'App mobile có sẵn không?',
    answer: 'Hiện tại chúng tôi chỉ có website responsive hoạt động tốt trên mobile. App mobile đang trong quá trình phát triển và sẽ ra mắt trong Q2/2024.',
    icon: <HelpCircle className="w-5 h-5" />
  }
];

const categories = ['Tất cả', 'Tổng quan', 'Tài khoản & Bảo mật', 'Thanh toán & Phí', 'Mua bán', 'Hỗ trợ & Tranh chấp', 'Kỹ thuật'];

export default function FAQPage() {
  const { user, loading, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [expandedItems, setExpandedItems] = useState<number[]>([]);

  const toggleExpanded = (id: number) => {
    setExpandedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const filteredFAQs = faqData.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Tất cả' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-8 sm:py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">Câu hỏi thường gặp</h1>
              <p className="text-base sm:text-lg lg:text-xl text-purple-100 max-w-2xl mx-auto">
                Tìm câu trả lời cho những thắc mắc phổ biến về dịch vụ của chúng tôi.
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
            {/* Search Bar */}
            <div className="relative mb-4 sm:mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm câu hỏi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors touch-manipulation text-sm sm:text-base"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors touch-manipulation ${
                    selectedCategory === category
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {filteredFAQs.length === 0 ? (
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy kết quả</h3>
                <p className="text-gray-600">Thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục khác.</p>
              </div>
            ) : (
              filteredFAQs.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <button
                    onClick={() => toggleExpanded(item.id)}
                    className="w-full px-4 sm:px-6 py-3 sm:py-4 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-inset touch-manipulation"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                        <div className="text-purple-600 flex-shrink-0">
                          {item.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                            {item.category}
                          </span>
                          <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mt-1 break-words">
                            {item.question}
                          </h3>
                        </div>
                      </div>
                      <div className="text-gray-400 flex-shrink-0 ml-2">
                        {expandedItems.includes(item.id) ? (
                          <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" />
                        ) : (
                          <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
                        )}
                      </div>
                    </div>
                  </button>
                  
                  {expandedItems.includes(item.id) && (
                    <div className="px-4 sm:px-6 pb-3 sm:pb-4">
                      <div className="border-t border-gray-200 pt-3 sm:pt-4">
                        <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                          {item.answer}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Contact Support */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 sm:p-8 mt-8 sm:mt-12 text-white text-center">
            <MessageCircle className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold mb-4">Vẫn cần hỗ trợ?</h2>
            <p className="text-sm sm:text-base text-purple-100 mb-6">
              Nếu bạn không tìm thấy câu trả lời cho thắc mắc của mình, đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <a
                href="/contact"
                className="bg-white text-purple-600 px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-semibold hover:bg-gray-100 transition-colors touch-manipulation"
              >
                Liên hệ hỗ trợ
              </a>
              <a
                href="mailto:support@mmostore.site"
                className="border-2 border-white text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-semibold hover:bg-white hover:text-purple-600 transition-colors touch-manipulation"
              >
                Gửi email
              </a>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}