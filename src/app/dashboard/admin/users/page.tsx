'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShoppingCart, Users, Shield, Edit, Trash2, UserPlus, LogOut, ArrowLeft, Search, Filter } from 'lucide-react'
import { UserData } from '@/types/user'
import Header from '@/components/Header'



interface UserListItem {
  _id: string
  username: string
  email: string
  role: 'admin' | 'manager' | 'seller' | 'buyer'
  isActive: boolean
  createdAt: string
}

export default function AdminUsersPage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [users, setUsers] = useState<UserListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        if (data.user.role !== 'admin') {
          router.push('/dashboard')
          return
        }
        setUser(data.user)
        await fetchUsers()
      } else {
        router.push('/auth/login')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

    checkAuth()
  }, [router])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'GET',
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      } else {
        console.error('Error fetching users:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      localStorage.removeItem('user')
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ userId, role: newRole })
      })
      
      if (response.ok) {
        const data = await response.json()
        setUsers(users.map(u => u._id === userId ? { ...u, role: newRole as any } : u))
        alert('Cập nhật role thành công!')
      } else {
        const errorData = await response.json()
        alert(`Lỗi: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error changing role:', error)
      alert('Lỗi kết nối, vui lòng thử lại')
    }
  }

  const handleToggleActive = async (userId: string) => {
    try {
      const currentUser = users.find(u => u._id === userId)
      const newActiveStatus = !currentUser?.isActive
      
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ userId, isActive: newActiveStatus })
      })
      
      if (response.ok) {
        setUsers(users.map(u => u._id === userId ? { ...u, isActive: newActiveStatus } : u))
        alert(`${newActiveStatus ? 'Kích hoạt' : 'Khóa'} tài khoản thành công!`)
      } else {
        const errorData = await response.json()
        alert(`Lỗi: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error toggling active status:', error)
      alert('Lỗi kết nối, vui lòng thử lại')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa user này?')) {
      try {
        const response = await fetch('/api/admin/users', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ userId })
        })
        
        if (response.ok) {
          setUsers(users.filter(u => u._id !== userId))
          alert('Xóa user thành công!')
        } else {
          const errorData = await response.json()
          alert(`Lỗi: ${errorData.error}`)
        }
      } catch (error) {
        console.error('Error deleting user:', error)
        alert('Lỗi kết nối, vui lòng thử lại')
      }
    }
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return 'Quản trị viên'
      case 'manager': return 'Quản lý'
      case 'seller': return 'Người bán'
      case 'buyer': return 'Người mua'
      default: return role
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'manager': return 'bg-purple-100 text-purple-800'
      case 'seller': return 'bg-green-100 text-green-800'
      case 'buyer': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center mb-6">
          <Link href="/dashboard/admin" className="flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Quay lại Admin Dashboard
          </Link>
        </div>

        {/* Page Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">
                Quản Lý Người Dùng
              </h1>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
              <UserPlus className="h-4 w-4 mr-2" />
              Thêm User
            </button>
          </div>
          
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên hoặc email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Filter className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">Tất cả role</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="seller">Seller</option>
                <option value="buyer">Buyer</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Người dùng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((userItem) => (
                  <tr key={userItem._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{userItem.username}</div>
                        <div className="text-sm text-gray-500">{userItem.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={userItem.role}
                        onChange={(e) => handleRoleChange(userItem._id, e.target.value)}
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(userItem.role)} border-0 focus:ring-2 focus:ring-blue-500`}
                        disabled={userItem.role === 'admin' && userItem._id === user?._id}
                      >
                        <option value="buyer">Buyer</option>
                        <option value="seller">Seller</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(userItem._id)}
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          userItem.isActive 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        } transition-colors`}
                      >
                        {userItem.isActive ? 'Hoạt động' : 'Bị khóa'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(userItem.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button className="text-blue-600 hover:text-blue-900 p-1">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(userItem._id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          disabled={userItem.role === 'admin' && userItem._id === user?._id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Không tìm thấy user nào</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}