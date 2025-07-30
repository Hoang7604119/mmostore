'use client'

import { useState, useRef } from 'react'
import { Paperclip, Image, X, Upload } from 'lucide-react'

interface MessageFileUploadProps {
  onFileSelect: (file: File, type: 'image' | 'file') => void
  onUploadComplete: (attachment: { type: 'image' | 'file', url: string, name: string, size: number }) => void
  disabled?: boolean
}

export default function MessageFileUpload({ onFileSelect, onUploadComplete, disabled }: MessageFileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (file: File, type: 'image' | 'file') => {
    if (!file) return

    setUploading(true)
    setSelectedFile(file)
    onFileSelect(file, type)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/messages/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        const attachment = {
          type: data.type || type,
          url: data.url,
          name: data.name || file.name,
          size: data.size || file.size
        }
        onUploadComplete(attachment)
      } else {
        const errorData = await response.json()
        alert(`Lỗi upload: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Lỗi upload file')
    } finally {
      setUploading(false)
      setSelectedFile(null)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate image file
      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file hình ảnh')
        return
      }
      if (file.size > 2 * 1024 * 1024) { // 2MB cho ảnh
        alert('Hình ảnh quá lớn (tối đa 2MB)')
        return
      }
      handleFileUpload(file, 'image')
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
      if (!allowedTypes.includes(file.type)) {
        alert('Loại file không được hỗ trợ. Chỉ chấp nhận: PDF, DOC, DOCX, TXT')
        return
      }
      if (file.size > 1 * 1024 * 1024) { // 1MB cho file
        alert('File quá lớn (tối đa 1MB)')
        return
      }
      handleFileUpload(file, 'file')
    }
  }

  const clearSelection = () => {
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  return (
    <div className="flex items-center space-x-2">
      {/* Image Upload Button */}
      <button
        type="button"
        onClick={() => imageInputRef.current?.click()}
        disabled={disabled || uploading}
        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Gửi hình ảnh"
      >
        <Image size={18} />
      </button>

      {/* File Upload Button */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || uploading}
        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Gửi file"
      >
        <Paperclip size={18} />
      </button>

      {/* Hidden File Inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Status */}
      {uploading && selectedFile && (
        <div className="flex items-center space-x-2 text-sm text-blue-600">
          <Upload size={16} className="animate-pulse" />
          <span>Đang tải {selectedFile.name}...</span>
          <button
            onClick={clearSelection}
            className="text-gray-400 hover:text-red-500"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  )
}