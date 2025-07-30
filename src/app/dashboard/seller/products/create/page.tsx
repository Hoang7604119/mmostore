'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { UserData } from '@/types/user'
import Header from '@/components/Header'
import { 
  ShoppingBagIcon, 
  CurrencyDollarIcon, 
  DocumentTextIcon,
  UserGroupIcon,
  PlusIcon,
  TrashIcon,
  CloudArrowUpIcon,
  EyeIcon,
  EyeSlashIcon,
  SparklesIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface Account {
  data: string // Dữ liệu tài khoản theo định dạng tự do
  fields?: string[] // Tên các trường (ví dụ: ['email', 'password', '2fa', 'recovery'])
}

// Removed static PRODUCT_TYPES - will fetch from API instead

interface User extends UserData {
  credit: number
}

export default function CreateProductPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [productTypes, setProductTypes] = useState<string[]>([])
  const [formData, setFormData] = useState({
    type: '',
    title: '',
    description: '',
    pricePerUnit: '',
    quantity: '',
    category: ''
  })
  const [accounts, setAccounts] = useState<Account[]>([{ data: '', fields: [] }])
  const [bulkInput, setBulkInput] = useState('')
  const [showBulkInput, setShowBulkInput] = useState(false)
  const [accountFormat, setAccountFormat] = useState('')
  const [fieldNames, setFieldNames] = useState<string[]>(['email', 'password'])
  const [showFormatHelper, setShowFormatHelper] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          if (!['admin', 'manager', 'seller'].includes(data.user.role)) {
            router.push('/dashboard')
            return
          }
          setUser(data.user)
          // Fetch product types after auth
          await fetchProductTypes()
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

  const fetchProductTypes = async () => {
    try {
      const response = await fetch('/api/product-types')
      if (response.ok) {
        const data = await response.json()
        setProductTypes(data.productTypes?.map((pt: any) => pt.name) || [])
      }
    } catch (error) {
      console.error('Error fetching product types:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAccountChange = (index: number, value: string) => {
    const newAccounts = [...accounts]
    newAccounts[index] = { ...newAccounts[index], data: value, fields: fieldNames }
    setAccounts(newAccounts)
  }

  const addAccount = () => {
    setAccounts([...accounts, { data: '', fields: fieldNames }])
  }

  const handleFormatChange = (format: string) => {
    setAccountFormat(format)
    // Tự động phân tích các trường từ format
    const fields = format.split('|').map((field, index) => {
      const trimmed = field.trim()
      if (trimmed) return trimmed
      return `field${index + 1}`
    }).filter(Boolean)
    setFieldNames(fields)
    
    // Cập nhật tất cả accounts hiện có
    setAccounts(accounts.map(account => ({
      ...account,
      fields: fields
    })))
  }

  const removeAccount = (index: number) => {
    if (accounts.length > 1) {
      setAccounts(accounts.filter((_, i) => i !== index));
    }
  };

  const handleBulkImport = () => {
    if (!bulkInput.trim()) {
      toast.error('Vui lòng nhập dữ liệu tài khoản')
      return
    }

    if (fieldNames.length === 0) {
      toast.error('Vui lòng định nghĩa format tài khoản trước')
      return
    }

    const lines = bulkInput.trim().split('\n')
    const newAccounts: Account[] = []

    for (const line of lines) {
      const trimmedLine = line.trim()
      if (trimmedLine) {
        // Kiểm tra số lượng trường
        const parts = trimmedLine.split('|')
        if (parts.length !== fieldNames.length) {
          toast.error(`Dòng "${trimmedLine}" không đúng format. Cần ${fieldNames.length} trường: ${fieldNames.join('|')}`)
          return
        }
        
        newAccounts.push({
          data: trimmedLine,
          fields: [...fieldNames]
        })
      }
    }

    if (newAccounts.length > 0) {
      setAccounts(newAccounts)
      setFormData(prev => ({ ...prev, quantity: newAccounts.length.toString() }))
      setBulkInput('')
      setShowBulkInput(false)
      toast.success(`Đã import ${newAccounts.length} tài khoản`)
    } else {
      toast.error('Không có dữ liệu hợp lệ để import')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // Validation
      if (!formData.type || !formData.title || !formData.pricePerUnit || !formData.quantity) {
        toast.error('Vui lòng điền đầy đủ thông tin')
        setSubmitting(false)
        return
      }

      const quantityNum = parseInt(formData.quantity)
      if (isNaN(quantityNum) || quantityNum <= 0) {
        toast.error('Số lượng phải là số nguyên dương')
        setSubmitting(false)
        return
      }

      // Filter out empty accounts
      const validAccounts = accounts.filter(account => account.data && account.data.trim())
      
      if (validAccounts.length !== quantityNum) {
        toast.error(`Số lượng tài khoản hợp lệ (${validAccounts.length}) không khớp với số lượng khai báo (${quantityNum})`)
        setSubmitting(false)
        return
      }

      if (fieldNames.length === 0) {
        toast.error('Vui lòng định nghĩa format tài khoản trước')
        setSubmitting(false)
        return
      }

      // Validate accounts
      for (let i = 0; i < validAccounts.length; i++) {
        const account = validAccounts[i]
        
        // Kiểm tra format
        const parts = account.data.split('|')
        if (parts.length !== fieldNames.length) {
          toast.error(`Tài khoản thứ ${i + 1} không đúng format. Cần ${fieldNames.length} trường: ${fieldNames.join('|')}`)
          setSubmitting(false)
          return
        }
        
        // Kiểm tra không có trường nào trống
        for (let j = 0; j < parts.length; j++) {
          if (!parts[j].trim()) {
            toast.error(`Tài khoản thứ ${i + 1}: Trường "${fieldNames[j]}" không được để trống`)
            setSubmitting(false)
            return
          }
        }
      }

      const response = await fetch('/api/seller/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          pricePerUnit: parseFloat(formData.pricePerUnit),
          quantity: parseInt(formData.quantity),
          category: formData.category || formData.type,
          accounts: validAccounts
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Tạo sản phẩm thành công! Đang chờ duyệt.')
        router.push('/dashboard/seller/products')
      } else {
        toast.error(data.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Create product error:', error)
      toast.error('Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={handleLogout} />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
              <SparklesIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Tạo sản phẩm mới
            </h1>
            <p className="text-gray-600 text-lg">Tạo và bán tài khoản của bạn một cách dễ dàng</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Progress indicator */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-1"></div>
            
            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8">
                  <div className="flex items-center mb-6">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-500 rounded-lg mr-3">
                      <ShoppingBagIcon className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Thông tin cơ bản</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-medium text-gray-700">
                        <ShoppingBagIcon className="w-4 h-4 mr-2 text-blue-500" />
                        Loại tài khoản *
                      </label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                        required
                      >
                        <option value="">Chọn loại tài khoản</option>
                        {productTypes.map(type => (
                          <option key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-medium text-gray-700">
                        <DocumentTextIcon className="w-4 h-4 mr-2 text-blue-500" />
                        Tiêu đề sản phẩm *
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                        placeholder="VD: Tài khoản Gmail chất lượng cao"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-medium text-gray-700">
                        <CurrencyDollarIcon className="w-4 h-4 mr-2 text-green-500" />
                        Giá mỗi tài khoản (VND) *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          name="pricePerUnit"
                          value={formData.pricePerUnit}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                          placeholder="50000"
                          min="1000"
                          required
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 text-sm">₫</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-medium text-gray-700">
                        <UserGroupIcon className="w-4 h-4 mr-2 text-purple-500" />
                        Số lượng *
                      </label>
                      <input
                        type="number"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                        placeholder="100"
                        min="1"
                        required
                      />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label className="flex items-center text-sm font-medium text-gray-700">
                        <DocumentTextIcon className="w-4 h-4 mr-2 text-indigo-500" />
                        Danh mục (tùy chọn)
                      </label>
                      <input
                        type="text"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                        placeholder="Để trống sẽ sử dụng loại tài khoản làm danh mục"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label className="flex items-center text-sm font-medium text-gray-700">
                        <DocumentTextIcon className="w-4 h-4 mr-2 text-gray-500" />
                        Mô tả sản phẩm
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md resize-none"
                        placeholder="Mô tả chi tiết về sản phẩm, chất lượng, ưu điểm..."
                      />
                    </div>
                  </div>
                </div>

                {/* Account Format Definition */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-8">
                  <div className="flex items-center mb-6">
                    <div className="flex items-center justify-center w-10 h-10 bg-green-500 rounded-lg mr-3">
                      <DocumentTextIcon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Định nghĩa format tài khoản</h3>
                  </div>
              
                <div className="bg-white rounded-lg p-6 shadow-sm border border-green-100">
                  <div className="flex items-center justify-between mb-4">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <DocumentTextIcon className="w-4 h-4 mr-2 text-green-500" />
                      Format tài khoản (các trường cách nhau bởi dấu |)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowFormatHelper(!showFormatHelper)}
                      className="flex items-center px-3 py-1 text-sm text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-all duration-200"
                    >
                      {showFormatHelper ? (
                        <><EyeSlashIcon className="w-4 h-4 mr-1" /> Ẩn ví dụ</>
                      ) : (
                        <><EyeIcon className="w-4 h-4 mr-1" /> Hiện ví dụ</>
                      )}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={accountFormat}
                    onChange={(e) => handleFormatChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                    placeholder="email|password|2fa|recovery"
                  />
                  {showFormatHelper && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="font-medium mb-3 text-green-800 flex items-center">
                        <CheckCircleIcon className="w-4 h-4 mr-2" />
                        Ví dụ các format phổ biến:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="cursor-pointer hover:bg-green-100 p-2 rounded-lg transition-all duration-200" onClick={() => handleFormatChange('email|password')}>
                          <code className="text-green-700 font-medium">email|password</code>
                          <span className="text-green-600 text-sm ml-2">- Cơ bản</span>
                        </div>
                        <div className="cursor-pointer hover:bg-green-100 p-2 rounded-lg transition-all duration-200" onClick={() => handleFormatChange('email|password|2fa')}>
                          <code className="text-green-700 font-medium">email|password|2fa</code>
                          <span className="text-green-600 text-sm ml-2">- Có 2FA</span>
                        </div>
                        <div className="cursor-pointer hover:bg-green-100 p-2 rounded-lg transition-all duration-200" onClick={() => handleFormatChange('email|password|2fa|recovery')}>
                          <code className="text-green-700 font-medium">email|password|2fa|recovery</code>
                          <span className="text-green-600 text-sm ml-2">- Đầy đủ</span>
                        </div>
                        <div className="cursor-pointer hover:bg-green-100 p-2 rounded-lg transition-all duration-200" onClick={() => handleFormatChange('username|password|email|phone')}>
                          <code className="text-green-700 font-medium">username|password|email|phone</code>
                          <span className="text-green-600 text-sm ml-2">- Có SĐT</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {fieldNames.length > 0 && (
                    <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800 flex items-center">
                        <CheckCircleIcon className="w-4 h-4 mr-2 text-blue-500" />
                        Các trường sẽ được tạo: 
                        <span className="ml-2 flex flex-wrap gap-1">
                          {fieldNames.map((field, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                              {field}
                            </span>
                          ))}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

                {/* Accounts Section */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-10 h-10 bg-purple-500 rounded-lg mr-3">
                    <UserGroupIcon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Danh sách tài khoản</h3>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowBulkInput(!showBulkInput)}
                    disabled={fieldNames.length === 0}
                    className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    <CloudArrowUpIcon className="w-4 h-4 mr-2" />
                    Import hàng loạt
                  </button>
                  <button
                    type="button"
                    onClick={addAccount}
                    disabled={fieldNames.length === 0}
                    className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Thêm tài khoản
                  </button>
                </div>
              </div>

              {showBulkInput && (
                <div className="mb-6 p-6 bg-white rounded-xl shadow-lg border border-purple-100">
                  <div className="flex items-center mb-4">
                    <CloudArrowUpIcon className="w-5 h-5 text-purple-500 mr-2" />
                    <label className="text-sm font-medium text-gray-700">
                      Import hàng loạt (định dạng: {fieldNames.join('|')} - mỗi dòng một tài khoản)
                    </label>
                  </div>
                  {fieldNames.length > 0 && (
                    <div className="mb-4 p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg border border-purple-200">
                      <div className="flex items-center text-sm text-purple-800">
                        <CheckCircleIcon className="w-4 h-4 mr-2" />
                        <strong>Format hiện tại:</strong> 
                        <span className="ml-2 font-mono bg-purple-200 px-2 py-1 rounded text-xs">
                          {fieldNames.join(' | ')}
                        </span>
                      </div>
                    </div>
                  )}
                  <textarea
                    value={bulkInput}
                    onChange={(e) => setBulkInput(e.target.value)}
                    rows={8}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white font-mono text-sm"
                    placeholder={fieldNames.length > 0 ? 
                      fieldNames.map((field, index) => 
                        `${field}${index + 1}`
                      ).join('|') + '\n' +
                      fieldNames.map((field, index) => 
                        `${field}${index + 2}`
                      ).join('|') + '\n' +
                      fieldNames.map((field, index) => 
                        `${field}${index + 3}`
                      ).join('|')
                      : 'Vui lòng định nghĩa format trước'
                    }
                    disabled={fieldNames.length === 0}
                  />
                  <div className="mt-4 flex space-x-3">
                    <button
                      type="button"
                      onClick={handleBulkImport}
                      disabled={fieldNames.length === 0}
                      className="flex items-center px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                      <CloudArrowUpIcon className="w-4 h-4 mr-2" />
                      Import
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBulkInput(false)}
                      className="flex items-center px-6 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <TrashIcon className="w-4 h-4 mr-2" />
                      Hủy
                    </button>
                  </div>
                </div>
              )}

              {fieldNames.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                      <DocumentTextIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-lg font-medium mb-2">Chưa có format tài khoản</p>
                    <p className="text-sm">Vui lòng định nghĩa format tài khoản trước khi thêm tài khoản</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {accounts.map((account, index) => (
                    <div key={index} className="p-6 bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                            <span className="text-white text-sm font-bold">{index + 1}</span>
                          </div>
                          <h4 className="font-semibold text-gray-900">Tài khoản #{index + 1}</h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAccount(index)}
                          className="flex items-center px-3 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 text-sm shadow-md hover:shadow-lg transform hover:scale-105"
                          disabled={accounts.length === 1}
                        >
                          <TrashIcon className="w-4 h-4 mr-1" />
                          Xóa
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                            <DocumentTextIcon className="w-4 h-4 mr-2 text-purple-500" />
                            Dữ liệu tài khoản (định dạng: {fieldNames.join('|')}) *
                          </label>
                          <input
                            type="text"
                            value={account.data}
                            onChange={(e) => handleAccountChange(index, e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white font-mono text-sm"
                            placeholder={fieldNames.map(field => `${field}_example`).join('|')}
                            required
                          />
                        </div>
                        
                        {account.data && (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {account.data.split('|').map((value, fieldIndex) => (
                              <div key={fieldIndex} className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                  {fieldNames[fieldIndex] || `Field ${fieldIndex + 1}`}
                                </div>
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {value.trim() || <span className="text-red-400 italic">(trống)</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

                {/* Submit */}
                <div className="flex justify-end space-x-4 pt-8 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
              >
                <XMarkIcon className="w-5 h-5 mr-2" />
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Tạo sản phẩm
                  </>
                )}
              </button>
                </div>
              </form>
            </div>
        </div>
        </div>
      </div>
    </div>
  )
}