'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Minus, User, CreditCard, RefreshCw, ShoppingCart, LogOut, DollarSign, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface User {
  _id: string
  username: string
  email: string
  credit: number
  role: string
}

interface CurrentUser {
  _id: string
  username: string
  email: string
  credit: number
  role: string
}

interface WithdrawalRequest {
  _id: string
  userId: {
    _id: string
    username: string
    email: string
  }
  amount: number
  bankAccount: {
    accountNumber: string
    accountName: string
    bankName: string
  }
  status: 'pending' | 'processing' | 'completed' | 'rejected'
  adminNote?: string
  createdAt: string
  updatedAt: string
}

export default function AdminCreditPage() {
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [amount, setAmount] = useState<number>(0)
  const [action, setAction] = useState<'add' | 'subtract'>('add')
  const [activeTab, setActiveTab] = useState<'credit' | 'withdrawals'>('credit')
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([])
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    fetchUsers()
    if (activeTab === 'withdrawals') {
      fetchWithdrawals()
    }
  }, [activeTab])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      })
      
      if (!response.ok) {
        router.push('/auth/login')
        return
      }
      
      const data = await response.json()
      if (data.user.role !== 'admin') {
        router.push('/marketplace')
        return
      }
      
      setCurrentUser(data.user)
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/auth/login')
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/credit', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      } else {
        alert('Lỗi khi tải danh sách users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      alert('Lỗi kết nối')
    } finally {
      setLoading(false)
    }
  }

  const fetchWithdrawals = async () => {
    setLoadingWithdrawals(true)
    try {
      const response = await fetch('/api/admin/withdrawals', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setWithdrawals(data.withdrawals)
      } else {
        alert('Lỗi khi tải danh sách yêu cầu rút tiền')
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error)
      alert('Lỗi kết nối')
    } finally {
      setLoadingWithdrawals(false)
    }
  }

  const handleWithdrawalAction = async (withdrawalId: string, action: 'approve' | 'reject', adminNote?: string) => {
    setProcessing(withdrawalId)
    try {
      const response = await fetch('/api/admin/withdrawals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          withdrawalId,
          action,
          adminNote
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        alert(`✅ ${action === 'approve' ? 'Duyệt' : 'Từ chối'} yêu cầu rút tiền thành công!`)
        fetchWithdrawals() // Refresh withdrawals list
      } else {
        alert(`❌ ${data.error}`)
      }
    } catch (error) {
      console.error('Error processing withdrawal:', error)
      alert('❌ Lỗi kết nối')
    } finally {
      setProcessing(null)
    }
  }

  const handleCreditUpdate = async () => {
    if (!selectedUser || amount <= 0) {
      alert('Vui lòng chọn user và nhập số tiền hợp lệ')
      return
    }

    setProcessing(selectedUser)
    try {
      const response = await fetch('/api/admin/credit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: selectedUser,
          amount,
          action
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        alert(`✅ ${action === 'add' ? 'Thêm' : 'Trừ'} ${amount.toLocaleString('vi-VN')} credit thành công!\nCredit hiện tại: ${data.user.credit.toLocaleString('vi-VN')}`)
        fetchUsers() // Refresh users list
        setAmount(0)
        setSelectedUser('')
      } else {
        alert(`❌ ${data.error}`)
      }
    } catch (error) {
      console.error('Error updating credit:', error)
      alert('❌ Lỗi kết nối')
    } finally {
      setProcessing(null)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      router.push('/auth/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <ShoppingCart className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">MMO Store</span>
              </Link>
            </div>

            {/* Navigation & User Info */}
            <div className="flex items-center space-x-6">
              <nav className="flex space-x-4">
                <Link href="/marketplace" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                  Marketplace
                </Link>
                <Link href="/dashboard/admin" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                  Dashboard
                </Link>
                <Link href="/dashboard/admin/users" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                  Quản lý Users
                </Link>
                <span className="text-blue-600 text-sm font-medium">
                  Quản lý Credit
                </span>
              </nav>
              
              {currentUser && (
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{currentUser.username}</div>
                    <div className="text-xs text-gray-500">
                      {currentUser.credit.toLocaleString('vi-VN')} VNĐ • {currentUser.role}
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-gray-400 hover:text-gray-600"
                    title="Đăng xuất"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Page Title */}
        <div className="bg-gray-50 border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Quản lý Credit & Rút tiền</h1>
                <p className="text-gray-600 mt-1">Quản lý credit và xử lý yêu cầu rút tiền</p>
              </div>
            </div>
            
            {/* Tabs */}
            <div className="mt-4">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('credit')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'credit'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <CreditCard className="h-4 w-4 inline-block mr-2" />
                    Quản lý Credit
                  </button>
                  <button
                    onClick={() => setActiveTab('withdrawals')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'withdrawals'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <DollarSign className="h-4 w-4 inline-block mr-2" />
                    Yêu cầu rút tiền
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'credit' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Credit Update Form */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Cập nhật Credit
                </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chọn User
                  </label>
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- Chọn user --</option>
                    {users.map(user => (
                      <option key={user._id} value={user._id}>
                        {user.username} ({user.email}) - {user.credit.toLocaleString('vi-VN')} credit
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hành động
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="add"
                        checked={action === 'add'}
                        onChange={(e) => setAction(e.target.value as 'add')}
                        className="mr-2"
                      />
                      <Plus className="h-4 w-4 text-green-600 mr-1" />
                      Thêm credit
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="subtract"
                        checked={action === 'subtract'}
                        onChange={(e) => setAction(e.target.value as 'subtract')}
                        className="mr-2"
                      />
                      <Minus className="h-4 w-4 text-red-600 mr-1" />
                      Trừ credit
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số tiền (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    min="0"
                    step="1000"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập số tiền..."
                  />
                </div>
                
                <button
                  onClick={handleCreditUpdate}
                  disabled={!selectedUser || amount <= 0 || processing === selectedUser}
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                    action === 'add'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {processing === selectedUser ? (
                    <RefreshCw className="h-4 w-4 animate-spin mx-auto" />
                  ) : (
                    `${action === 'add' ? 'Thêm' : 'Trừ'} ${amount.toLocaleString('vi-VN')} Credit`
                  )}
                </button>
                </div>
              </div>
            </div>
            
            {/* Users List */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Danh sách Users ({users.length})
                    </h2>
                    <button
                      onClick={fetchUsers}
                      className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Làm mới
                    </button>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Credit
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Hành động
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map(user => (
                        <tr key={user._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                                {user.username.charAt(0).toUpperCase()}
                              </div>
                              <div className="text-sm font-medium text-gray-900">
                                {user.username}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-green-600">
                              {user.credit.toLocaleString('vi-VN')} VNĐ
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => setSelectedUser(user._id)}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Chọn
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {users.length === 0 && (
                  <div className="text-center py-12">
                    <User className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Không có users</h3>
                    <p className="mt-1 text-sm text-gray-500">Chưa có users nào trong hệ thống.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Withdrawals Management */
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Yêu cầu rút tiền</h2>
                <button
                  onClick={fetchWithdrawals}
                  disabled={loadingWithdrawals}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingWithdrawals ? 'animate-spin' : ''}`} />
                  Làm mới
                </button>
              </div>
            </div>
            
            {loadingWithdrawals ? (
              <div className="flex justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : withdrawals.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Không có yêu cầu rút tiền nào</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người dùng</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số tiền</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thông tin ngân hàng</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {withdrawals.map((withdrawal) => (
                      <tr key={withdrawal._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{withdrawal.userId.username}</div>
                            <div className="text-sm text-gray-500">{withdrawal.userId.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-green-600">
                            {withdrawal.amount.toLocaleString()} VNĐ
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div>STK: {withdrawal.bankAccount.accountNumber}</div>
                            <div>Tên: {withdrawal.bankAccount.accountName}</div>
                            <div>Ngân hàng: {withdrawal.bankAccount.bankName}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            withdrawal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            withdrawal.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                            withdrawal.status === 'completed' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {withdrawal.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                            {withdrawal.status === 'processing' && <AlertCircle className="h-3 w-3 mr-1" />}
                            {withdrawal.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {withdrawal.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                            {withdrawal.status === 'pending' ? 'Chờ xử lý' :
                             withdrawal.status === 'processing' ? 'Đang xử lý' :
                             withdrawal.status === 'completed' ? 'Hoàn thành' : 'Từ chối'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(withdrawal.createdAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {withdrawal.status === 'pending' && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleWithdrawalAction(withdrawal._id, 'approve')}
                                disabled={processing === withdrawal._id}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Duyệt
                              </button>
                              <button
                                onClick={() => {
                                  const note = prompt('Lý do từ chối (tùy chọn):');
                                  if (note !== null) {
                                    handleWithdrawalAction(withdrawal._id, 'reject', note || undefined);
                                  }
                                }}
                                disabled={processing === withdrawal._id}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Từ chối
                              </button>
                            </div>
                          )}
                          {withdrawal.adminNote && (
                            <div className="mt-1 text-xs text-gray-500">
                              Ghi chú: {withdrawal.adminNote}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}