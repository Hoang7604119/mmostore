'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
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

export default function CreateProductPage() {
  const router = useRouter()
  const { user, loading, logout } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showFormatHelper, setShowFormatHelper] = useState(false)
  const [showBulkInput, setShowBulkInput] = useState(false)
  const [bulkInput, setBulkInput] = useState('')
  const [accountFormat, setAccountFormat] = useState('')
  const [fieldNames, setFieldNames] = useState<string[]>([])
  const [accounts, setAccounts] = useState<Account[]>([{ data: '', fields: [] }])
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isProcessingFile, setIsProcessingFile] = useState(false)
  const [formData, setFormData] = useState({
    type: '',
    title: '',
    description: '',
    pricePerUnit: '',
    quantity: '',
    category: ''
  })
  const [productTypes, setProductTypes] = useState<string[]>([])

  useEffect(() => {
    if (!loading && user && user.role === 'manager') {
      fetchProductTypes()
    }
  }, [user, loading])

  const fetchProductTypes = async () => {
    try {
      const response = await fetch('/api/product-types', {
        credentials: 'include'
      })
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
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAccountChange = (index: number, value: string) => {
    const newAccounts = [...accounts]
    newAccounts[index] = { ...newAccounts[index], data: value, fields: fieldNames }
    setAccounts(newAccounts)
  }

  const addAccount = () => {
    setAccounts([...accounts, { data: '', fields: fieldNames }])
  }

  const removeAccount = (index: number) => {
    if (accounts.length > 1) {
      setAccounts(accounts.filter((_, i) => i !== index))
    }
  }

  const handleFormatChange = (format: string) => {
    setAccountFormat(format)
    
    // Parse field names from format
    const fields = format.split('|').map(field => field.trim()).filter(field => field.length > 0)
    setFieldNames(fields)
    
    // Update existing accounts with new field structure
    setAccounts(accounts.map(account => ({
      ...account,
      fields: fields
    })))
  }

  const handleBulkImport = () => {
    if (!bulkInput.trim()) {
      toast.error('Vui lòng nhập dữ liệu tài khoản')
      return
    }

    if (fieldNames.length === 0) {
      toast.error('Vui lòng định nghĩa format tài khoản trước')
      return
    }

    const lines = bulkInput.trim().split('\n').filter(line => line.trim())
    const newAccounts: Account[] = []
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (line) {
        const parts = line.split('|')
        if (parts.length !== fieldNames.length) {
          toast.error(`Dòng ${i + 1}: Số trường không khớp với format (cần ${fieldNames.length} trường, có ${parts.length} trường)`)
          return
        }
        
        if (parts.some(part => !part.trim())) {
          toast.error(`Dòng ${i + 1}: Tất cả các trường phải có dữ liệu`)
          return
        }
        
        newAccounts.push({
          data: line,
          fields: fieldNames
        })
      }
    }
    
    if (newAccounts.length > 0) {
      setAccounts(newAccounts)
      setBulkInput('')
      setShowBulkInput(false)
      toast.success(`Đã import ${newAccounts.length} tài khoản`)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Kiểm tra định dạng file
    const allowedTypes = ['text/plain', 'text/csv', 'application/csv']
    const fileExtension = file.name.toLowerCase().split('.').pop()
    
    if (!allowedTypes.includes(file.type) && !['txt', 'csv'].includes(fileExtension || '')) {
      toast.error('Chỉ hỗ trợ file TXT và CSV')
      return
    }

    if (fieldNames.length === 0) {
      toast.error('Vui lòng định nghĩa format tài khoản trước khi tải file')
      return
    }

    setUploadedFile(file)
    setIsProcessingFile(true)

    try {
      const text = await file.text()
      const lines = text.trim().split('\n').filter(line => line.trim())
      const newAccounts: Account[] = []
      const errors: string[] = []
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        if (line) {
          // Hỗ trợ cả dấu phẩy và dấu gạch đứng
          let parts: string[]
          if (line.includes('|')) {
            parts = line.split('|')
          } else if (line.includes(',')) {
            parts = line.split(',')
          } else {
            errors.push(`Dòng ${i + 1}: Không tìm thấy dấu phân cách (| hoặc ,)`)
            continue
          }
          
          // Loại bỏ khoảng trắng thừa
          parts = parts.map(part => part.trim())
          
          if (parts.length !== fieldNames.length) {
            errors.push(`Dòng ${i + 1}: Số trường không khớp (cần ${fieldNames.length}, có ${parts.length})`)
            continue
          }
          
          if (parts.some(part => !part)) {
            errors.push(`Dòng ${i + 1}: Tất cả các trường phải có dữ liệu`)
            continue
          }
          
          // Chuyển đổi về format chuẩn với dấu |
          const standardizedData = parts.join('|')
          newAccounts.push({
            data: standardizedData,
            fields: fieldNames
          })
        }
      }
      
      if (errors.length > 0) {
        toast.error(`Có ${errors.length} lỗi trong file:\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? '\n...' : ''}`)
        return
      }
      
      if (newAccounts.length > 0) {
        setAccounts(newAccounts)
        setFormData(prev => ({ ...prev, quantity: newAccounts.length.toString() }))
        toast.success(`Đã import ${newAccounts.length} tài khoản từ file`)
      } else {
        toast.error('Không tìm thấy dữ liệu hợp lệ trong file')
      }
    } catch (error) {
      console.error('Error processing file:', error)
      toast.error('Lỗi khi xử lý file')
    } finally {
      setIsProcessingFile(false)
    }
  }

  const removeUploadedFile = () => {
    setUploadedFile(null)
    // Reset file input
    const fileInput = document.getElementById('file-upload') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isSubmitting) return
    setIsSubmitting(true)

    // Validation
    if (!formData.type || !formData.title || !formData.pricePerUnit || !formData.quantity) {
      toast.error('Vui lòng điền đầy đủ thông tin')
      setIsSubmitting(false)
      return
    }

    const quantityNum = parseInt(formData.quantity)
    if (isNaN(quantityNum) || quantityNum <= 0) {
      toast.error('Số lượng phải là số nguyên dương')
      setIsSubmitting(false)
      return
    }

    // Filter out empty accounts
    const validAccounts = accounts.filter(account => account.data && account.data.trim())
    
    if (validAccounts.length !== quantityNum) {
      toast.error(`Số lượng tài khoản hợp lệ (${validAccounts.length}) không khớp với số lượng khai báo (${quantityNum})`)
      setIsSubmitting(false)
      return
    }

    if (fieldNames.length === 0) {
      toast.error('Vui lòng định nghĩa format tài khoản trước')
      setIsSubmitting(false)
      return
    }

    // Validate accounts
    for (let i = 0; i < validAccounts.length; i++) {
      const account = validAccounts[i]
      
      // Kiểm tra format
      const parts = account.data.split('|')
      if (parts.length !== fieldNames.length) {
        toast.error(`Tài khoản thứ ${i + 1} không đúng format. Cần ${fieldNames.length} trường: ${fieldNames.join('|')}`)
        setIsSubmitting(false)
        return
      }
      
      // Kiểm tra không có trường nào trống
      for (let j = 0; j < parts.length; j++) {
        if (!parts[j].trim()) {
          toast.error(`Tài khoản thứ ${i + 1}: Trường "${fieldNames[j]}" không được để trống`)
          setIsSubmitting(false)
          return
        }
      }
    }

    try {
      const response = await fetch('/api/manager/products', {
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
        toast.success('Tạo sản phẩm thành công! Sản phẩm đã được tự động duyệt.')
        router.push('/dashboard/manager/products')
      } else {
        toast.error(data.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Error creating product:', error)
      toast.error('Có lỗi xảy ra khi tạo sản phẩm')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user || !['admin', 'manager'].includes(user.role)) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={handleLogout} />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 mb-8 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <ShoppingBagIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Tạo Sản Phẩm Mới</h1>
                  <p className="text-blue-100 mt-1">Thêm sản phẩm mới vào cửa hàng của bạn</p>
                </div>
              </div>
            </div>

            {/* Progress indicator */}
            <div className="px-8 py-4 bg-gray-50 border-b">
              <div className="text-sm text-gray-600">Bước 1: Thông tin cơ bản → Bước 2: Tài khoản → Bước 3: Xác nhận</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Info */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <DocumentTextIcon className="h-6 w-6 mr-3" />
                  Thông Tin Cơ Bản
                </h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Loại sản phẩm</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 shadow-sm hover:shadow-md appearance-none cursor-pointer"
                      required
                    >
                      <option value="">Chọn loại sản phẩm</option>
                      {productTypes.map(type => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tiêu đề sản phẩm</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Nhập tiêu đề sản phẩm"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả sản phẩm</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Mô tả chi tiết về sản phẩm"
                  />
                </div>
              </div>
            </div>

            {/* Pricing & Quantity */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <CurrencyDollarIcon className="h-6 w-6 mr-3" />
                  Giá & Số Lượng
                </h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Giá mỗi đơn vị (VNĐ)</label>
                    <input
                      type="number"
                      name="pricePerUnit"
                      value={formData.pricePerUnit}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="0"
                      min="0"
                      step="1000"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Số lượng</label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="0"
                      min="1"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục</label>
                    <input
                      type="text"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Danh mục sản phẩm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Account Format Section */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <UserGroupIcon className="h-6 w-6 mr-3" />
                  Định Dạng Tài Khoản
                </h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">Format tài khoản (phân cách bằng |)</label>
                  <button
                    type="button"
                    onClick={() => setShowFormatHelper(!showFormatHelper)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                  >
                    <InformationCircleIcon className="h-4 w-4 mr-1" />
                    Hướng dẫn
                  </button>
                </div>
                
                {showFormatHelper && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Hướng dẫn định dạng:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Sử dụng dấu | để phân cách các trường</li>
                      <li>• Ví dụ: email|password|2fa|recovery</li>
                      <li>• Hoặc: username|password|backup_email</li>
                    </ul>
                  </div>
                )}
                
                <input
                  type="text"
                  value={accountFormat}
                  onChange={(e) => handleFormatChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Ví dụ: email|password|2fa|recovery"
                />
                
                {fieldNames.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {fieldNames.map((field, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {field}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bulk Import Section */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-blue-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white flex items-center">
                    <CloudArrowUpIcon className="h-6 w-6 mr-3" />
                    Import Hàng Loạt
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowBulkInput(!showBulkInput)}
                    className="text-white hover:text-blue-200 transition-colors"
                  >
                    {showBulkInput ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              
              {showBulkInput && (
                <div className="p-6 space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Lưu ý:</strong> Mỗi dòng là một tài khoản, sử dụng format đã định nghĩa ở trên. Hỗ trợ cả nhập liệu thủ công và tải file TXT/CSV.
                    </p>
                  </div>

                  {/* File Upload Section */}
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 bg-gray-50">
                    <div className="text-center">
                      <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4">
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <span className="mt-2 block text-sm font-medium text-gray-900">
                            Tải file TXT hoặc CSV
                          </span>
                          <span className="mt-1 block text-xs text-gray-500">
                            Hỗ trợ dấu phân cách: | hoặc ,
                          </span>
                        </label>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          accept=".txt,.csv"
                          className="sr-only"
                          onChange={handleFileUpload}
                          disabled={isProcessingFile || fieldNames.length === 0}
                        />
                        <label
                          htmlFor="file-upload"
                          className="mt-3 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                          {isProcessingFile ? 'Đang xử lý...' : 'Chọn file'}
                        </label>
                      </div>
                    </div>
                    
                    {uploadedFile && (
                      <div className="mt-4 flex items-center justify-between bg-white p-3 rounded-lg border">
                        <div className="flex items-center">
                          <DocumentTextIcon className="h-5 w-5 text-blue-500 mr-2" />
                          <span className="text-sm text-gray-900">{uploadedFile.name}</span>
                          <span className="text-xs text-gray-500 ml-2">({(uploadedFile.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={removeUploadedFile}
                          className="text-red-500 hover:text-red-700"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <textarea
                    value={bulkInput}
                    onChange={(e) => setBulkInput(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    rows={8}
                    placeholder={`Định dạng: ${fieldNames.join('|')}\n\nVí dụ:\nuser1@gmail.com|password123|ABCD1234|backup@email.com\nuser2@gmail.com|password456|EFGH5678|backup2@email.com`}
                  />
                  
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleBulkImport}
                      disabled={(!bulkInput.trim() && !uploadedFile) || fieldNames.length === 0 || isProcessingFile}
                      className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center"
                    >
                      <CloudArrowUpIcon className="h-5 w-5 mr-2" />
                      {isProcessingFile ? 'Đang xử lý...' : 'Import Tài Khoản'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Accounts Section */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white flex items-center">
                    <UserGroupIcon className="h-6 w-6 mr-3" />
                    Danh Sách Tài Khoản ({accounts.length})
                  </h2>
                  <span className="text-green-100 text-sm">
                    {accounts.filter(acc => acc.data.trim()).length} tài khoản hợp lệ
                  </span>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                {accounts.map((account, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {index + 1}
                      </span>
                    </div>
                    
                    <div className="flex-1">
                      {accounts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeAccount(index)}
                          className="float-right text-red-500 hover:text-red-700 transition-colors"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                      
                      <input
                        type="text"
                        value={account.data}
                        onChange={(e) => handleAccountChange(index, e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder={fieldNames.join('|')}
                      />
                      
                      {/* Preview */}
                      {account.data && fieldNames.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {account.data.split('|').map((value, fieldIndex) => (
                            <div key={fieldIndex} className="text-xs">
                              <span className="text-gray-500">{fieldNames[fieldIndex] || `Field ${fieldIndex + 1}`}:</span>
                              <span className="ml-1 text-gray-800 font-medium">{value || '(trống)'}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={addAccount}
                  disabled={fieldNames.length === 0}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Thêm Tài Khoản
                </button>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 pb-8">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-8 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Tạo Sản Phẩm
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}