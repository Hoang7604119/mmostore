import { supabase } from './supabase'

// Supabase Storage utilities for product type images
export class SupabaseStorageService {
  private static readonly BUCKET_NAME = 'product-images'
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

  /**
   * Upload image to Supabase Storage
   * @param file - File to upload
   * @param fileName - Custom filename (optional)
   * @returns Promise with upload result
   */
  static async uploadImage(file: File, fileName?: string): Promise<{
    success: boolean
    url?: string
    error?: string
  }> {
    try {
      // Validate file type
      if (!this.ALLOWED_TYPES.includes(file.type)) {
        return {
          success: false,
          error: 'Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)'
        }
      }

      // Validate file size
      if (file.size > this.MAX_FILE_SIZE) {
        return {
          success: false,
          error: 'File quá lớn. Tối đa 5MB'
        }
      }

      // Generate filename if not provided
      const timestamp = Date.now()
      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const finalFileName = fileName || `product-type-${timestamp}.${extension}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(finalFileName, file, {
          cacheControl: '3600',
          upsert: true // Allow overwriting existing files
        })

      if (error) {
        console.error('Supabase upload error:', error)
        return {
          success: false,
          error: 'Lỗi upload ảnh. Vui lòng thử lại'
        }
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(finalFileName)

      return {
        success: true,
        url: publicUrl
      }

    } catch (error) {
      console.error('Upload error:', error)
      return {
        success: false,
        error: 'Lỗi server. Vui lòng thử lại'
      }
    }
  }

  /**
   * Delete image from Supabase Storage
   * @param fileName - File name to delete
   * @returns Promise with delete result
   */
  static async deleteImage(fileName: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([fileName])

      if (error) {
        console.error('Supabase delete error:', error)
        return {
          success: false,
          error: 'Lỗi xóa ảnh'
        }
      }

      return { success: true }

    } catch (error) {
      console.error('Delete error:', error)
      return {
        success: false,
        error: 'Lỗi server'
      }
    }
  }

  /**
   * Get public URL for an image
   * @param fileName - File name
   * @returns Public URL
   */
  static getPublicUrl(fileName: string): string {
    const { data: { publicUrl } } = supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(fileName)
    
    return publicUrl
  }

  /**
   * Extract filename from Supabase URL
   * @param url - Supabase public URL
   * @returns Filename or null
   */
  static extractFileNameFromUrl(url: string): string | null {
    try {
      const urlParts = url.split('/')
      return urlParts[urlParts.length - 1] || null
    } catch {
      return null
    }
  }

  /**
   * Check if URL is a Supabase Storage URL
   * @param url - URL to check
   * @returns boolean
   */
  static isSupabaseUrl(url: string): boolean {
    return url.includes('supabase.co/storage/v1/object/public')
  }

  /**
   * Generate optimized image URL with transformations
   * @param fileName - File name
   * @param options - Transformation options
   * @returns Optimized URL
   */
  static getOptimizedUrl(fileName: string, options?: {
    width?: number
    height?: number
    quality?: number
  }): string {
    const baseUrl = this.getPublicUrl(fileName)
    
    if (!options) return baseUrl
    
    const params = new URLSearchParams()
    if (options.width) params.append('width', options.width.toString())
    if (options.height) params.append('height', options.height.toString())
    if (options.quality) params.append('quality', options.quality.toString())
    
    return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl
  }
}

// Helper function for backward compatibility
export const uploadProductTypeImage = SupabaseStorageService.uploadImage
export const deleteProductTypeImage = SupabaseStorageService.deleteImage
export const getProductTypeImageUrl = SupabaseStorageService.getPublicUrl