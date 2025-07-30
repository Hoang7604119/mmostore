'use client'

import { Download, FileText, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'

interface Attachment {
  type: 'image' | 'file'
  url: string
  name: string
  size?: number
}

interface MessageAttachmentProps {
  attachment: Attachment
  isCurrentUser: boolean
}

export default function MessageAttachment({ attachment, isCurrentUser }: MessageAttachmentProps) {
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = attachment.url
    link.download = attachment.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (attachment.type === 'image') {
    return (
      <div className="mt-2">
        <div className="relative max-w-xs">
          <Image
            src={attachment.url}
            alt={attachment.name}
            width={300}
            height={200}
            className="rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(attachment.url, '_blank')}
          />
          <button
            onClick={handleDownload}
            className={`absolute top-2 right-2 p-1 rounded-full transition-colors ${
              isCurrentUser 
                ? 'bg-blue-700 hover:bg-blue-800 text-white' 
                : 'bg-gray-700 hover:bg-gray-800 text-white'
            }`}
            title="Tải xuống"
          >
            <Download size={14} />
          </button>
        </div>
        <div className={`text-xs mt-1 ${
          isCurrentUser ? 'text-blue-100' : 'text-gray-500'
        }`}>
          {attachment.name} {attachment.size && `(${formatFileSize(attachment.size)})`}
        </div>
      </div>
    )
  }

  return (
    <div className="mt-2">
      <div className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer hover:opacity-90 transition-opacity ${
        isCurrentUser 
          ? 'bg-blue-700 border-blue-600' 
          : 'bg-white border-gray-200'
      }`} onClick={handleDownload}>
        <div className={`p-2 rounded ${
          isCurrentUser ? 'bg-blue-600' : 'bg-gray-100'
        }`}>
          <FileText size={20} className={isCurrentUser ? 'text-white' : 'text-gray-600'} />
        </div>
        <div className="flex-1 min-w-0">
          <div className={`font-medium truncate ${
            isCurrentUser ? 'text-white' : 'text-gray-900'
          }`}>
            {attachment.name}
          </div>
          {attachment.size && (
            <div className={`text-xs ${
              isCurrentUser ? 'text-blue-100' : 'text-gray-500'
            }`}>
              {formatFileSize(attachment.size)}
            </div>
          )}
        </div>
        <Download size={16} className={isCurrentUser ? 'text-blue-100' : 'text-gray-400'} />
      </div>
    </div>
  )
}