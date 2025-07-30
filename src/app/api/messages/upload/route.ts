import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { verifyToken } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Verify user token (không cần admin)
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Vui lòng đăng nhập để upload file' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Token không hợp lệ' },
        { status: 403 }
      )
    }

    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File

    if (!file) {
      return NextResponse.json(
        { error: 'Không có file được upload' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    const allowedFileTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    
    const isImage = allowedImageTypes.includes(file.type)
    const isFile = allowedFileTypes.includes(file.type)
    
    if (!isImage && !isFile) {
      return NextResponse.json(
        { error: 'Loại file không được hỗ trợ. Chỉ chấp nhận: JPG, PNG, GIF, WebP, PDF, DOC, DOCX, TXT' },
        { status: 400 }
      )
    }

    // Giới hạn file size cho hosting miễn phí
    const maxSize = isImage ? 2 * 1024 * 1024 : 1 * 1024 * 1024 // 2MB cho ảnh, 1MB cho file
    if (file.size > maxSize) {
      const maxSizeText = isImage ? '2MB' : '1MB'
      return NextResponse.json(
        { error: `File quá lớn. Tối đa ${maxSizeText} cho ${isImage ? 'hình ảnh' : 'file'}` },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `msg_${timestamp}_${originalName}`
    
    // Create uploads directory path
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'messages')
    const filePath = join(uploadsDir, filename)

    // Create directory if it doesn't exist
    const fs = require('fs')
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }

    // Write file
    await writeFile(filePath, buffer)

    // Return the public URL
    const fileUrl = `/uploads/messages/${filename}`
    const fileType = isImage ? 'image' : 'file'

    return NextResponse.json(
      { 
        message: 'Upload thành công',
        url: fileUrl,
        type: fileType,
        name: file.name,
        size: file.size
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Message upload error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}