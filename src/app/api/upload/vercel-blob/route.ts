import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/utils'
import { VercelBlobStorageService } from '@/lib/vercelBlobStorage'

export const dynamic = 'force-dynamic'

/**
 * POST - Upload image to Vercel Blob Storage
 * Only accessible by admin users
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin token
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 403 }
      )
    }

    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File
    const customFileName = data.get('fileName') as string

    if (!file) {
      return NextResponse.json(
        { error: 'Không có file được upload' },
        { status: 400 }
      )
    }

    // Upload to Vercel Blob Storage
    const result = await VercelBlobStorageService.uploadImage(file, customFileName)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        message: 'Upload thành công',
        url: result.url,
        fileName: VercelBlobStorageService.extractFileNameFromUrl(result.url || '')
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Vercel Blob upload error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Delete image from Vercel Blob Storage
 * Only accessible by admin users
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verify admin token
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return NextResponse.json(
        { error: 'URL là bắt buộc' },
        { status: 400 }
      )
    }

    // Delete from Vercel Blob Storage
    const result = await VercelBlobStorageService.deleteImage(url)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Xóa ảnh thành công' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Vercel Blob delete error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}