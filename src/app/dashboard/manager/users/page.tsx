'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Check, X, Eye, UserCheck, UserX, FileText } from 'lucide-react'
import Header from '@/components/Header'
import { UserData } from '@/types/user'

interface User {
  _id: string
  username: string
  email: string
  role: 'admin' | 'manager' | 'seller' | 'buyer'
  isActive: boolean
  credit: number
  sellerRequest?: {
    status: 'pending' | 'approved' | 'rejected'
    requestedAt: string
    reviewedAt?: string
    reviewedBy?: string
    note?: string
  }
}



export default function ManagerUsersPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'sellers' | 'buyers'>('all')

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (!response.ok) {
          router.push('/auth/login')
          return
        }
        const data = await response.json()
         if (data.user.role !== 'manager' && data.user.role !== 'admin') {
           router.push('/dashboard')
           return
         }
         setUser(data.user)
         fetchUsers()
       } catch (error) {
         console.error('Auth check error:', error)
         router.push('/auth/login')
       } finally {
         setLoading(false)
       }
     }
     checkAuth()
  }, [router])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/manager/users')
      const data = await response.json()
      if (response.ok) {
        setUsers(data.users)
      } else {
        alert(data.error || 'Có lỗi xảy ra khi tải danh sách user')
      }
    } catch (error) {
      console.error('Fetch users error:', error)
      alert('Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setLoading(false)
    }
  }

  const handleSellerRequest = async (userId: string, action: 'approve' | 'reject', note?: string) => {
    setActionLoading(userId)
    try {
      const response = await fetch('/api/manager/seller-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          action,
          note
        })
      })

      const data = await response.json()
      if (response.ok) {
        alert(data.message)
        fetchUsers() // Refresh danh sách
      } else {
        alert(data.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Handle seller request error:', error)
      alert('Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRoleChange = async (userId: string, newRole: 'buyer' | 'seller') => {
    if (!confirm(`Bạn có chắc muốn thay đổi quyền user này thành ${newRole}?`)) {
      return
    }

    setActionLoading(userId)
    try {
      const response = await fetch('/api/manager/change-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          newRole
        })
      })

      const data = await response.json()
      if (response.ok) {
        alert(data.message)
        fetchUsers() // Refresh danh sách
      } else {
        alert(data.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Change role error:', error)
      alert('Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setActionLoading(null)
    }
  }

  const filteredUsers = users.filter(u => {
    if (filter === 'pending') return u.sellerRequest?.status === 'pending'
    if (filter === 'sellers') return u.role === 'seller'
    if (filter === 'buyers') return u.role === 'buyer'
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {user && <Header user={user} onLogout={handleLogout} />}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/manager" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Quản Lý User</h1>
          <p className="text-gray-600 mt-2">Phê duyệt yêu cầu seller và quản lý quyền user</p>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tất cả ({users.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Chờ duyệt ({users.filter(u => u.sellerRequest?.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilter('sellers')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'sellers'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Sellers ({users.filter(u => u.role === 'seller').length})
            </button>
            <button
              onClick={() => setFilter('buyers')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'buyers'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Buyers ({users.filter(u => u.role === 'buyer').length})
            </button>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Yêu cầu Seller
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{u.username}</div>
                        <div className="text-sm text-gray-500">{u.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        u.role === 'admin' ? 'bg-red-100 text-red-800' :
                        u.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                        u.role === 'seller' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {u.isActive ? 'Hoạt động' : 'Bị khóa'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {u.sellerRequest ? (
                        <div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            u.sellerRequest.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            u.sellerRequest.status === 'approved' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {u.sellerRequest.status === 'pending' ? 'Chờ duyệt' :
                             u.sellerRequest.status === 'approved' ? 'Đã duyệt' : 'Từ chối'}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(u.sellerRequest.requestedAt).toLocaleDateString('vi-VN')}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Không có</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {u.sellerRequest && (
                          <Link
                            href={`/dashboard/manager/users/${u._id}/seller-request`}
                            className="text-blue-600 hover:text-blue-900"
                            title="Xem form chi tiết"
                          >
                            <FileText className="h-4 w-4" />
                          </Link>
                        )}
                        
                        {u.sellerRequest?.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleSellerRequest(u._id, 'approve')}
                              disabled={actionLoading === u._id}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50"
                              title="Phê duyệt"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                const note = prompt('Lý do từ chối (tùy chọn):')
                                handleSellerRequest(u._id, 'reject', note || undefined)
                              }}
                              disabled={actionLoading === u._id}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                              title="Từ chối"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        
                        {u.role !== 'admin' && u.role !== 'manager' && (
                          <>
                            {u.role === 'buyer' && (
                              <button
                                onClick={() => handleRoleChange(u._id, 'seller')}
                                disabled={actionLoading === u._id}
                                className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                                title="Nâng cấp thành Seller"
                              >
                                <UserCheck className="h-4 w-4" />
                              </button>
                            )}
                            {u.role === 'seller' && (
                              <button
                                onClick={() => handleRoleChange(u._id, 'buyer')}
                                disabled={actionLoading === u._id}
                                className="text-orange-600 hover:text-orange-900 disabled:opacity-50"
                                title="Hạ cấp thành Buyer"
                              >
                                <UserX className="h-4 w-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Eye className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Không có user nào</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter === 'pending' ? 'Không có yêu cầu nào đang chờ duyệt' : 'Không tìm thấy user nào'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}