import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/utils'
import { SupabaseStorageService } from '@/lib/supabaseStorage'

export const dynamic = 'force-dynamic'

/**
 * POST - Upload image to Supabase Storage
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

    // Upload to Supabase Storage
    const result = await SupabaseStorageService.uploadImage(file, customFileName)

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
        fileName: SupabaseStorageService.extractFileNameFromUrl(result.url || '')
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Supabase upload error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Delete image from Supabase Storage
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
    const fileName = searchParams.get('fileName')
    const url = searchParams.get('url')

    let fileNameToDelete = fileName
    
    // Extract filename from URL if provided
    if (!fileNameToDelete && url) {
      fileNameToDelete = SupabaseStorageService.extractFileNameFromUrl(url)
    }

    if (!fileNameToDelete) {
      return NextResponse.json(
        { error: 'Tên file hoặc URL là bắt buộc' },
        { status: 400 }
      )
    }

    // Delete from Supabase Storage
    const result = await SupabaseStorageService.deleteImage(fileNameToDelete)

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
    console.error('Supabase delete error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}