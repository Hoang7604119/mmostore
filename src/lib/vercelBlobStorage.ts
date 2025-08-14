import { put, del, head } from '@vercel/blob'

// Vercel Blob Storage utilities for product type images
export class VercelBlobStorageService {
  private static readonly MAX_FILE_SIZE = 4.5 * 1024 * 1024 // 4.5MB (Vercel limit for server upload)
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

  /**
   * Upload image to Vercel Blob Storage
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
          error: 'File quá lớn. Tối đa 4.5MB'
        }
      }

      // Generate filename if not provided
      const timestamp = Date.now()
      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const finalFileName = fileName || `product-type-${timestamp}.${extension}`

      // Upload to Vercel Blob Storage
      const blob = await put(finalFileName, file, {
        access: 'public',
        addRandomSuffix: false // Keep consistent filename
      })

      return {
        success: true,
        url: blob.url
      }

    } catch (error) {
      console.error('Vercel Blob upload error:', error)
      return {
        success: false,
        error: 'Lỗi upload ảnh. Vui lòng thử lại'
      }
    }
  }

  /**
   * Delete image from Vercel Blob Storage
   * @param url - Blob URL to delete
   * @returns Promise with delete result
   */
  static async deleteImage(url: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      await del(url)
      return { success: true }
    } catch (error) {
      console.error('Vercel Blob delete error:', error)
      return {
        success: false,
        error: 'Lỗi xóa ảnh'
      }
    }
  }

  /**
   * Check if image exists in Vercel Blob Storage
   * @param url - Blob URL to check
   * @returns Promise with existence check result
   */
  static async imageExists(url: string): Promise<boolean> {
    try {
      await head(url)
      return true
    } catch {
      return false
    }
  }

  /**
   * Extract filename from Vercel Blob URL
   * @param url - Vercel Blob URL
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
   * Check if URL is a Vercel Blob Storage URL
   * @param url - URL to check
   * @returns boolean
   */
  static isVercelBlobUrl(url: string): boolean {
    return url.includes('blob.vercel-storage.com')
  }

  /**
   * Get optimized image URL with transformations
   * Note: Vercel Blob doesn't have built-in image optimization like Supabase
   * This method returns the original URL for now
   * @param url - Original blob URL
   * @param options - Transformation options (not used for now)
   * @returns Original URL
   */
  static getOptimizedUrl(url: string, options?: {
    width?: number
    height?: number
    quality?: number
  }): string {
    // Vercel Blob doesn't have built-in image transformations
    // For optimization, you would need to use Vercel's Image Optimization
    // or a third-party service like Cloudinary
    return url
  }
}

// Helper functions for backward compatibility
export const uploadProductTypeImageToBlob = VercelBlobStorageService.uploadImage
export const deleteProductTypeImageFromBlob = VercelBlobStorageService.deleteImage
export const getProductTypeImageBlobUrl = (url: string) => url // No transformation needed