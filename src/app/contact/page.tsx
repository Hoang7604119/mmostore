'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Facebook, Twitter, Instagram, Linkedin, Send } from 'lucide-react';
import { contactInfo } from '@/config/contact';
import { useAuth } from '@/hooks/useAuth'
import Header from '@/components/Header'
import PublicHeader from '@/components/PublicHeader'
import Footer from '@/components/Footer';

export default function ContactPage() {
  const { user, loading, logout } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
    alert('Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất có thể.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

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
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">Liên hệ với chúng tôi</h1>
              <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                Chúng tôi luôn sẵn sàng hỗ trợ bạn. Hãy liên hệ với chúng tôi qua các kênh dưới đây.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Thông tin liên hệ</h2>
                <p className="text-gray-600 mb-8">{contactInfo.description}</p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <Mail className="w-6 h-6 text-blue-600 mt-1" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Email</h3>
                    <p className="text-gray-600">{contactInfo.email}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <Phone className="w-6 h-6 text-blue-600 mt-1" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Điện thoại</h3>
                    <p className="text-gray-600">{contactInfo.phone}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <MapPin className="w-6 h-6 text-blue-600 mt-1" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Địa chỉ</h3>
                    <p className="text-gray-600">{contactInfo.address}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <Clock className="w-6 h-6 text-blue-600 mt-1" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Giờ làm việc</h3>
                    <div className="text-gray-600">
                      <p>Thứ 2 - Thứ 6: {contactInfo.workingHours.weekdays}</p>
                      <p>Thứ 7: {contactInfo.workingHours.saturday}</p>
                      <p>Chủ nhật: {contactInfo.workingHours.sunday}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Theo dõi chúng tôi</h3>
                <div className="flex space-x-4">
                  <a href={contactInfo.socialMedia.facebook} className="text-blue-600 hover:text-blue-800 transition-colors">
                    <Facebook className="w-6 h-6" />
                  </a>
                  <a href={contactInfo.socialMedia.twitter} className="text-blue-400 hover:text-blue-600 transition-colors">
                    <Twitter className="w-6 h-6" />
                  </a>
                  <a href={contactInfo.socialMedia.instagram} className="text-pink-600 hover:text-pink-800 transition-colors">
                    <Instagram className="w-6 h-6" />
                  </a>
                  <a href={contactInfo.socialMedia.linkedin} className="text-blue-700 hover:text-blue-900 transition-colors">
                    <Linkedin className="w-6 h-6" />
                  </a>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Gửi tin nhắn</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Nhập họ và tên của bạn"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Nhập email của bạn"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Chủ đề *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Nhập chủ đề tin nhắn"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Tin nhắn *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                    placeholder="Nhập nội dung tin nhắn của bạn"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <Send className="w-5 h-5" />
                  <span>Gửi tin nhắn</span>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Legal Information */}
        <div className="bg-gray-100 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Thông tin pháp lý</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Thông tin doanh nghiệp</h3>
                  <div className="text-gray-600 space-y-2">
                    <p><strong>Tên công ty:</strong> {contactInfo.legal.companyName}</p>
                    <p><strong>Mã số thuế:</strong> {contactInfo.legal.taxCode}</p>
                    <p><strong>Giấy phép kinh doanh:</strong> {contactInfo.legal.businessLicense}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Địa chỉ đăng ký</h3>
                  <p className="text-gray-600">{contactInfo.legal.registeredAddress}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}