'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Minus, User, CreditCard, RefreshCw, ShoppingCart, LogOut } from 'lucide-react'

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

export default function AdminCreditPage() {
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [amount, setAmount] = useState<number>(0)
  const [action, setAction] = useState<'add' | 'subtract'>('add')
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    fetchUsers()
  }, [])

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
                <h1 className="text-2xl font-bold text-gray-900">Quản lý Credit</h1>
                <p className="text-gray-600 mt-1">Thêm hoặc trừ credit cho users</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      </div>
    </div>
  )
}