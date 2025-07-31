'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { UserData } from '@/types/user'
import Header from '@/components/Header'
import LoadingSpinner from '@/components/LoadingSpinner'



import { 
  CreditCard, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  ArrowLeft,
  DollarSign,
  Banknote,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  Copy,
  QrCode
} from 'lucide-react'
import { CONTACT_INFO, getContactPhone, getContactEmail } from '@/config/contact'

interface Transaction {
  id: string
  type: 'deposit' | 'withdrawal'
  amount: number
  status: 'pending' | 'completed' | 'failed'
  date: string
  method: string
}

export default function CreditPage() {
  const { user, loading, refetch } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/auth/login')
  }
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit')
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [selectedMethod, setSelectedMethod] = useState('payos')
  const [bankAccount, setBankAccount] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showBankTransferModal, setShowBankTransferModal] = useState(false)
  const [qrCode, setQrCode] = useState('')
  const [paymentUrl, setPaymentUrl] = useState('')
  const [currentOrderCode, setCurrentOrderCode] = useState('')
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)
  const searchParams = useSearchParams()

  // State for transaction history
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(true)

  // Fetch transaction history
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoadingTransactions(true)
        const response = await fetch('/api/payment/history?limit=20', {
          credentials: 'include'
        })
        
        if (response.ok) {
          const data = await response.json()
          const formattedTransactions: Transaction[] = data.data.payments.map((payment: any) => ({
            id: payment.id,
            type: 'deposit',
            method: payment.paymentMethod === 'payos' ? 'PayOS' : payment.paymentMethod,
            date: new Date(payment.createdAt).toLocaleDateString('vi-VN'),
            amount: payment.amount,
            status: payment.status === 'paid' ? 'completed' : payment.status === 'pending' ? 'processing' : 'failed'
          }))
          setTransactions(formattedTransactions)
        }
      } catch (error) {
        console.error('Error fetching transactions:', error)
      } finally {
        setLoadingTransactions(false)
      }
    }

    fetchTransactions()
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  // Handle PayOS return parameters
  useEffect(() => {
    const status = searchParams.get('status')
    const orderCode = searchParams.get('orderCode')
    const amount = searchParams.get('amount')
    const message = searchParams.get('message')

    if (status) {
      switch (status) {
        case 'success':
          alert(`Nạp tiền thành công! Số tiền: ${parseInt(amount || '0').toLocaleString('vi-VN')} VNĐ`)
          // Refresh user data
          window.location.reload()
          break
        case 'cancel':
          alert('Thanh toán đã bị hủy')
          break
        case 'error':
          alert(`Lỗi thanh toán: ${message || 'Không xác định'}`)
          break
        case 'pending':
          alert('Thanh toán đang được xử lý')
          break
      }
      // Clean URL parameters
      router.replace('/dashboard/credit')
    }
  }, [searchParams, router])

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) return null

  const handleDeposit = async () => {
    if (!depositAmount || parseInt(depositAmount) < 10000) {
      alert('Số tiền nạp tối thiểu là 10,000 VNĐ')
      return
    }

    if (parseInt(depositAmount) > 50000000) {
      alert('Số tiền nạp tối đa là 50,000,000 VNĐ')
      return
    }

    setIsProcessing(true)

    try {
      if (selectedMethod === 'payos') {
        // Create PayOS payment
        const response = await fetch('/api/payment/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            amount: parseInt(depositAmount)
          })
        })

        const data = await response.json()

        if (response.ok && data.success) {
          setPaymentUrl(data.data.paymentUrl)
          setQrCode(data.data.qrCode)
          setCurrentOrderCode(data.data.orderCode.toString())
          setShowPaymentModal(true)
        } else {
          alert(data.error || 'Lỗi tạo link thanh toán')
        }
        return
      } else if (selectedMethod === 'bank') {
      setShowBankTransferModal(true)
    } else {
        alert('Phương thức thanh toán chưa được hỗ trợ')
      }
    } catch (error) {
      console.error('Payment error:', error)
      alert('Lỗi kết nối. Vui lòng thử lại!')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseInt(withdrawAmount) < 50000) {
      alert('Số tiền rút tối thiểu là 50,000 VNĐ')
      return
    }

    if (parseInt(withdrawAmount) > 10000000) {
      alert('Số tiền rút tối đa là 10,000,000 VNĐ')
      return
    }

    if (parseInt(withdrawAmount) > (user.credit || 0)) {
      alert('Số dư không đủ để thực hiện giao dịch')
      return
    }

    // Validate bank account info for users without saved bank account
    const hasSavedBankAccount = user.role === 'seller' && user.sellerRequest?.status === 'approved' && user.sellerRequest?.bankAccount
    if (!hasSavedBankAccount) {
      if (!bankAccount || bankAccount.trim().length < 6) {
        alert('Vui lòng nhập thông tin tài khoản ngân hàng hợp lệ')
        return
      }
    }

    setIsProcessing(true)

    try {
      const requestBody: any = {
        amount: parseInt(withdrawAmount)
      }

      // Use saved bank account if available, otherwise use manual input
      const hasSavedBankAccount = user.role === 'seller' && user.sellerRequest?.status === 'approved' && user.sellerRequest?.bankAccount
      if (hasSavedBankAccount && user.sellerRequest?.bankAccount) {
        requestBody.bankAccount = {
          accountNumber: user.sellerRequest.bankAccount.accountNumber,
          accountName: user.sellerRequest.bankAccount.accountHolder,
          bankName: user.sellerRequest.bankAccount.bankName
        }
      } else {
        // For manual input, we need more info - show a form or use default values
        requestBody.bankAccount = {
          accountNumber: bankAccount.trim(),
          accountName: user.username, // Default to username
          bankName: 'Vui lòng cập nhật' // User needs to contact admin to update
        }
      }

      const response = await fetch('/api/withdrawal/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()

      if (response.ok && data.success) {
        alert(data.message || 'Yêu cầu rút tiền đã được tạo thành công!')
        setWithdrawAmount('')
        setBankAccount('')
        // Refresh user data to get updated credit
        await refetch()
      } else {
        alert(data.error || 'Có lỗi xảy ra khi tạo yêu cầu rút tiền')
      }
    } catch (error) {
      console.error('Withdrawal error:', error)
      alert('Lỗi kết nối. Vui lòng thử lại!')
    } finally {
      setIsProcessing(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Đã sao chép vào clipboard!')
  }

  const closePaymentModal = () => {
    setShowPaymentModal(false)
    setPaymentUrl('')
    setQrCode('')
    setCurrentOrderCode('')
    setDepositAmount('')
    setIsCheckingStatus(false)
  }

  const checkPaymentStatus = async () => {
    if (!currentOrderCode || isCheckingStatus) return

    setIsCheckingStatus(true)
    try {
      const response = await fetch(`/api/payment/status/${currentOrderCode}`)
      const data = await response.json()

      if (response.status === 429) {
        alert('Hệ thống đang quá tải, vui lòng thử lại sau ít phút')
        return
      }

      if (data.success) {
        if (data.data.status === 'PAID') {
          alert('Thanh toán thành công!')
          closePaymentModal()
          // Refresh user data to get updated credit
          await refetch()
        } else if (data.data.status === 'CANCELLED') {
          alert('Thanh toán đã bị hủy')
          closePaymentModal()
        } else {
          alert('Thanh toán đang được xử lý...')
        }
      } else {
        alert(data.error || 'Không thể kiểm tra trạng thái thanh toán')
      }
    } catch (error) {
      console.error('Check payment status error:', error)
      alert('Lỗi kiểm tra trạng thái thanh toán')
    } finally {
      setIsCheckingStatus(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      <Header user={user} onLogout={handleLogout} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Credit Overview */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-3xl p-8 text-white mb-8 shadow-2xl border border-white/20 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Số dư hiện tại</h2>
              <p className="text-4xl font-bold">
                {(user.credit || 0).toLocaleString('vi-VN')} VNĐ
              </p>
              <p className="text-blue-100 mt-2">Tài khoản: {user.username}</p>
            </div>
            <div className="text-right">
              <Wallet className="h-16 w-16 text-blue-200 mb-4" />
              <div className="flex space-x-4">
                <div className="text-center">
                  <TrendingUp className="h-6 w-6 mx-auto mb-1" />
                  <p className="text-sm">Nạp tiền</p>
                </div>
                <div className="text-center">
                  <TrendingDown className="h-6 w-6 mx-auto mb-1" />
                  <p className="text-sm">Rút tiền</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Tab Navigation */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 mb-6">
              <div className="flex border-b border-gray-200/50">
                <button
                  onClick={() => setActiveTab('deposit')}
                  className={`flex-1 px-6 py-4 text-center font-medium transition-all duration-300 ${
                    activeTab === 'deposit'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-gradient-to-r from-blue-50 to-purple-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
                  }`}
                >
                  <CreditCard className="h-5 w-5 inline-block mr-2" />
                  Nạp Credit
                </button>
                <button
                  onClick={() => setActiveTab('withdraw')}
                  className={`flex-1 px-6 py-4 text-center font-medium transition-all duration-300 ${
                    activeTab === 'withdraw'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-gradient-to-r from-blue-50 to-purple-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
                  }`}
                >
                  <Banknote className="h-5 w-5 inline-block mr-2" />
                  Rút tiền
                </button>
              </div>

              <div className="p-6">
                {activeTab === 'deposit' ? (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số tiền muốn nạp (VNĐ)
                      </label>
                      <input
                        type="number"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="Nhập số tiền"
                        className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 bg-white/50 backdrop-blur-sm transition-all duration-300 hover:bg-white/80"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Phương thức thanh toán
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div
                          onClick={() => setSelectedMethod('payos')}
                          className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                            selectedMethod === 'payos'
                              ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 shadow-lg'
                              : 'border-gray-200/50 hover:border-gray-300 hover:shadow-md bg-white/50 backdrop-blur-sm'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <QrCode className="h-6 w-6 text-blue-600" />
                            <div>
                              <p className="font-medium">QR pay</p>
                              <p className="text-sm text-gray-500">Nhanh chóng, tiện lợi</p>
                            </div>
                          </div>
                        </div>
                        <div
                          onClick={() => setSelectedMethod('bank')}
                          className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                            selectedMethod === 'bank'
                              ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 shadow-lg'
                              : 'border-gray-200/50 hover:border-gray-300 hover:shadow-md bg-white/50 backdrop-blur-sm'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <CreditCard className="h-6 w-6 text-blue-600" />
                            <div>
                              <p className="font-medium">Chuyển khoản ngân hàng</p>
                              <p className="text-sm text-gray-500">Miễn phí, 5-10 phút</p>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>

                    <button
                      onClick={handleDeposit}
                      disabled={!depositAmount || isProcessing}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02]"
                    >
                      {isProcessing ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Đang xử lý...</span>
                        </div>
                      ) : (
                        'Nạp Credit'
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số tiền muốn rút (VNĐ)
                      </label>
                      <input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="Nhập số tiền"
                        max={user.credit || 0}
                        className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 bg-white/50 backdrop-blur-sm transition-all duration-300 hover:bg-white/80"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Số dư khả dụng: {(user.credit || 0).toLocaleString('vi-VN')} VNĐ
                      </p>
                    </div>

                    {/* Bank Account Information */}
                    {user.role === 'seller' && user.sellerRequest?.status === 'approved' && user.sellerRequest?.bankAccount ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Thông tin tài khoản ngân hàng
                        </label>
                        <div className="bg-gradient-to-r from-gray-50 to-blue-50/30 border border-gray-200/50 rounded-xl p-4 space-y-2 backdrop-blur-sm">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Ngân hàng:</span>
                            <span className="text-sm font-medium">{user.sellerRequest.bankAccount.bankName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Số tài khoản:</span>
                            <span className="text-sm font-medium">{user.sellerRequest.bankAccount.accountNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Chủ tài khoản:</span>
                            <span className="text-sm font-medium">{user.sellerRequest.bankAccount.accountHolder}</span>
                          </div>
                          {user.sellerRequest.bankAccount.branch && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Chi nhánh:</span>
                              <span className="text-sm font-medium">{user.sellerRequest.bankAccount.branch}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-blue-600 mt-2">
                          💡 Đây là tài khoản rút tiền chính của bạn. Muốn thay đổi vui lòng liên hệ admin.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Số tài khoản ngân hàng
                        </label>
                        <input
                          type="text"
                          value={bankAccount}
                          onChange={(e) => setBankAccount(e.target.value)}
                          placeholder="Nhập số tài khoản"
                          className="w-full px-4 py-3 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 bg-white/50 backdrop-blur-sm transition-all duration-300 hover:bg-white/80"
                        />
                        <p className="text-xs text-blue-600 mt-2">
                          💡 Để có tài khoản rút tiền cố định, bạn có thể đăng ký trở thành seller.
                        </p>
                      </div>
                    )}

                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50/30 border border-yellow-200/50 rounded-xl p-4 backdrop-blur-sm">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800">Lưu ý quan trọng</p>
                          <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                            <li>• Phí rút tiền: 2% (tối thiểu 10,000 VNĐ)</li>
                            <li>• Thời gian xử lý: 1-3 ngày làm việc</li>
                            <li>• Số tiền tối thiểu: 50,000 VNĐ</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleWithdraw}
                      disabled={
                        !withdrawAmount || 
                        isProcessing || 
                        (parseInt(withdrawAmount) > (user.credit || 0)) ||
                        (!(user.role === 'seller' && user.sellerRequest?.status === 'approved' && user.sellerRequest?.bankAccount) && !bankAccount)
                      }
                      className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white py-3 px-6 rounded-xl font-medium hover:from-red-700 hover:to-pink-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02]"
                    >
                      {isProcessing ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Đang xử lý...</span>
                        </div>
                      ) : (
                        'Rút tiền'
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Transaction History */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50" data-section="transaction-history">
              <div className="px-6 py-4 border-b border-gray-200/50 bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-t-2xl">
                <h3 className="text-lg font-semibold text-gray-900">Lịch sử giao dịch</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {loadingTransactions ? (
                  <div className="px-6 py-8 text-center">
                    <LoadingSpinner size="sm" fullScreen={false} />
                    <p className="text-gray-500">Đang tải lịch sử giao dịch...</p>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-500">
                    <p>Chưa có giao dịch nào</p>
                  </div>
                ) : (
                  transactions.map((transaction) => (
                  <div key={transaction.id} className="px-6 py-4 flex items-center justify-between hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-purple-50/30 transition-all duration-300">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${
                        transaction.type === 'deposit' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {transaction.type === 'deposit' ? (
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          Nạp tiền
                        </p>
                        <p className="text-sm text-gray-500">{transaction.method}</p>
                        <p className="text-sm text-gray-500">{transaction.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          +{transaction.amount.toLocaleString('vi-VN')} VNĐ
                        </p>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            transaction.status === 'completed' ? 'bg-green-500' :
                            transaction.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></div>
                          <span className={`text-sm ${
                            transaction.status === 'completed' ? 'text-green-600' :
                            transaction.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {transaction.status === 'completed' ? 'Hoàn thành' :
                             transaction.status === 'pending' ? 'Đang xử lý' : 'Thất bại'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => router.push(`/dashboard/credit/${transaction.id}`)}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-lg text-sm hover:from-blue-700 hover:to-purple-700 hover:shadow-md transition-all duration-300 transform hover:scale-105"
                      >
                        Chi tiết
                      </button>
                    </div>
                  </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Thao tác nhanh</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center space-x-3 p-3 text-left border border-gray-200/50 rounded-xl hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 hover:shadow-md transition-all duration-300 transform hover:scale-[1.02]">
                  <QrCode className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium">Quét mã QR</span>
                </button>
                <button 
                  onClick={() => {
                    // Scroll to transaction history section
                    const historySection = document.querySelector('[data-section="transaction-history"]')
                    if (historySection) {
                      historySection.scrollIntoView({ behavior: 'smooth' })
                    }
                  }}
                  className="w-full flex items-center space-x-3 p-3 text-left border border-gray-200/50 rounded-xl hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 hover:shadow-md transition-all duration-300 transform hover:scale-[1.02]"
                >
                  <Clock className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">Lịch sử chi tiết</span>
                </button>
                <button className="w-full flex items-center space-x-3 p-3 text-left border border-gray-200/50 rounded-xl hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 hover:shadow-md transition-all duration-300 transform hover:scale-[1.02]">
                  <Shield className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium">Bảo mật tài khoản</span>
                </button>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Thông tin thanh toán</h3>
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 border border-blue-200/50 rounded-xl p-4 backdrop-blur-sm">
                  <h4 className="font-medium text-blue-900 mb-2">Chuyển khoản ngân hàng</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Ngân hàng:</span>
                      <span className="font-medium text-blue-900">{CONTACT_INFO.PAYMENT.BANK_NAME}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">STK:</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-blue-900">{CONTACT_INFO.PAYMENT.ACCOUNT_NUMBER}</span>
                        <button
                          onClick={() => copyToClipboard(CONTACT_INFO.PAYMENT.ACCOUNT_NUMBER)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Chủ TK:</span>
                      <span className="font-medium text-blue-900">{CONTACT_INFO.PAYMENT.ACCOUNT_HOLDER}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50/50 border border-green-200/50 rounded-xl p-4 backdrop-blur-sm">
                  <h4 className="font-medium text-green-900 mb-2">Hướng dẫn nạp tiền</h4>
                  <ol className="text-sm text-green-700 space-y-1">
                    <li>1. Chuyển khoản theo thông tin trên</li>
                    <li>2. Ghi nội dung: NAP [USERNAME]</li>
                    <li>3. Chờ 5-10 phút để hệ thống xử lý</li>
                    <li>4. Credit sẽ được cộng tự động</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Support */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Hỗ trợ</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">Hỗ trợ 24/7</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600">Hotline: {getContactPhone('HOTLINE')}</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-gray-600">Email: {getContactEmail('SUPPORT')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PayOS Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200/50">
            <div className="text-center">
              <div className="mb-4">
                <QrCode className="h-12 w-12 text-purple-600 mx-auto mb-2" />
                <h3 className="text-xl font-bold text-gray-900">Thanh toán PayOS</h3>
                <p className="text-gray-600">Quét mã QR để thanh toán</p>
              </div>

              <div className="mb-6">
                {qrCode ? (
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCode)}`}
                    alt="PayOS QR Code" 
                    className="w-48 h-48 mx-auto border border-gray-200/50 rounded-2xl shadow-lg"
                    onError={(e) => {
                      console.error('QR Code image failed to load:', qrCode)
                    }}
                  />
                ) : (
                  <div className="w-48 h-48 mx-auto border border-gray-200/50 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100/50 flex items-center justify-center shadow-lg backdrop-blur-sm">
                    <div className="text-center text-gray-500">
                      <QrCode className="h-12 w-12 mx-auto mb-2" />
                      <p className="text-sm">Đang tải mã QR...</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50/50 rounded-xl border border-purple-200/50 backdrop-blur-sm">
                <p className="text-sm text-gray-600 mb-2">Số tiền:</p>
                <p className="text-2xl font-bold text-purple-600">
                  {parseInt(depositAmount).toLocaleString('vi-VN')} VNĐ
                </p>
                <p className="text-sm text-gray-500 mt-2">Mã đơn hàng: {currentOrderCode}</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    if (paymentUrl) {
                      window.open(paymentUrl, '_blank')
                    } else {
                      alert('Đường dẫn thanh toán không khả dụng')
                    }
                  }}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-4 rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
                >
                  Mở trang thanh toán
                </button>
                
                <button
                  onClick={checkPaymentStatus}
                  disabled={isCheckingStatus}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-700 hover:to-cyan-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02]"
                >
                  {isCheckingStatus ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Đang kiểm tra...</span>
                    </div>
                  ) : (
                    'Kiểm tra trạng thái'
                  )}
                </button>
                
                <button
                  onClick={closePaymentModal}
                  className="w-full bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 py-3 px-4 rounded-xl font-medium hover:from-gray-300 hover:to-gray-400 hover:shadow-md transition-all duration-300 transform hover:scale-[1.02]"
                >
                  Đóng
                </button>
              </div>

              <div className="mt-4 text-xs text-gray-500 text-center">
                <p>• Quét mã QR bằng app ngân hàng</p>
                <p>• Hoặc nhấn "Mở trang thanh toán"</p>
                <p>• Thanh toán sẽ được xử lý tự động</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bank Transfer Modal */}
      {showBankTransferModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200/50">
            <div className="text-center">
              <div className="mb-4">
                <CreditCard className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                <h3 className="text-xl font-bold text-gray-900">Chuyển khoản ngân hàng</h3>
                <p className="text-gray-600">Thông tin chuyển khoản</p>
              </div>

              <div className="mb-6 space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 border border-blue-200/50 rounded-xl p-4 backdrop-blur-sm">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-700">Ngân hàng:</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-blue-900">{CONTACT_INFO.PAYMENT.BANK_NAME}</span>
                        <button
                          onClick={() => copyToClipboard(CONTACT_INFO.PAYMENT.BANK_NAME)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-700">STK:</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-blue-900">{CONTACT_INFO.PAYMENT.ACCOUNT_NUMBER}</span>
                        <button
                          onClick={() => copyToClipboard(CONTACT_INFO.PAYMENT.ACCOUNT_NUMBER)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-700">Chủ TK:</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-blue-900">{CONTACT_INFO.PAYMENT.ACCOUNT_HOLDER}</span>
                        <button
                          onClick={() => copyToClipboard(CONTACT_INFO.PAYMENT.ACCOUNT_HOLDER)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-700">Số tiền:</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-blue-900">{parseInt(depositAmount || '0').toLocaleString('vi-VN')} VNĐ</span>
                        <button
                          onClick={() => copyToClipboard(depositAmount)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-700">Nội dung:</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-blue-900">{user.email}</span>
                        <button
                          onClick={() => copyToClipboard(user.email)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-50 to-orange-50/30 border border-yellow-200/50 rounded-xl p-4 backdrop-blur-sm">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-yellow-800">Lưu ý quan trọng</p>
                      <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                        <li>• Chuyển khoản đúng số tiền và nội dung</li>
                        <li>• Nội dung chuyển khoản: <strong>{user.email}</strong></li>
                        <li>• Credit sẽ được cộng sau 5-10 phút</li>
                        <li>• Liên hệ admin nếu quá 30 phút chưa nhận được</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowBankTransferModal(false)
                    setDepositAmount('')
                    alert('Vui lòng chuyển khoản theo thông tin trên. Credit sẽ được cộng tự động sau 5-10 phút.')
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
                >
                  Đã hiểu, tiến hành chuyển khoản
                </button>
                
                <button
                  onClick={() => setShowBankTransferModal(false)}
                  className="w-full bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 py-3 px-4 rounded-xl font-medium hover:from-gray-300 hover:to-gray-400 hover:shadow-md transition-all duration-300 transform hover:scale-[1.02]"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}