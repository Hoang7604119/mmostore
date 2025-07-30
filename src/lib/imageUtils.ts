import { SupabaseStorageService } from './supabaseStorage'
import { APP_CONFIG } from '@/config/app'

export interface ImageSource {
  imageUrl?: string // Supabase Storage URL
  image?: string // Legacy file system path
  imageBase64?: string // Base64 encoded image
  name?: string // For fallback display
}

/**
 * Get the best available image URL with fallback logic
 * Priority: imageUrl (Supabase) > imageBase64 > image (file system) > default
 */
export function getImageUrl(source?: ImageSource, defaultImage?: string): string {
  // Handle undefined source
  if (!source) {
    return defaultImage || APP_CONFIG.PRODUCTS?.DEFAULT_IMAGES?.other || '/uploads/other.svg'
  }

  // 1. Priority: Supabase Storage URL
  if (source.imageUrl && source.imageUrl.trim()) {
    return source.imageUrl
  }

  // 2. Base64 encoded image
  if (source.imageBase64 && source.imageBase64.trim()) {
    return source.imageBase64
  }

  // 3. Legacy file system image
  if (source.image && source.image.trim()) {
    // Check if it's already a full URL
    if (source.image.startsWith('http')) {
      return source.image
    }
    // Convert relative path to API endpoint
    return `/api/images?path=${encodeURIComponent(source.image)}`
  }

  // 4. Default image
  if (defaultImage) {
    return defaultImage
  }

  // 5. Final fallback
  return APP_CONFIG.PRODUCTS?.DEFAULT_IMAGES?.other || '/uploads/other.svg'
}

/**
 * Get optimized image URL for different display contexts
 */
export function getOptimizedImageUrl(
  source?: ImageSource, 
  context: 'thumbnail' | 'card' | 'detail' | 'full' = 'card',
  defaultImage?: string
): string {
  if (!source) {
    return defaultImage || APP_CONFIG.PRODUCTS?.DEFAULT_IMAGES?.other || '/uploads/other.svg'
  }
  const baseUrl = getImageUrl(source, defaultImage)
  
  // Only apply optimization for Supabase URLs
  if (!SupabaseStorageService.isSupabaseUrl(baseUrl)) {
    return baseUrl
  }

  const fileName = SupabaseStorageService.extractFileNameFromUrl(baseUrl)
  if (!fileName) return baseUrl

  // Define optimization settings for different contexts
  const optimizations = {
    thumbnail: { width: 64, height: 64, quality: 80 },
    card: { width: 200, height: 200, quality: 85 },
    detail: { width: 400, height: 400, quality: 90 },
    full: { quality: 95 }
  }

  return SupabaseStorageService.getOptimizedUrl(fileName, optimizations[context])
}

/**
 * Get product type image with proper fallback
 */
export function getProductTypeImage(
  productType?: ImageSource & { name?: string },
  context: 'thumbnail' | 'card' | 'detail' | 'full' = 'card'
): string {
  // Handle undefined productType
  if (!productType) {
    return APP_CONFIG.PRODUCTS?.DEFAULT_IMAGES?.other || '/uploads/other.svg'
  }

  // Try to get default image from config
  const defaultImage = productType?.name ? 
    APP_CONFIG.PRODUCTS?.DEFAULT_IMAGES?.[productType.name?.toLowerCase() as keyof typeof APP_CONFIG.PRODUCTS.DEFAULT_IMAGES] :
    undefined

  return getOptimizedImageUrl(productType, context, defaultImage || APP_CONFIG.PRODUCTS?.DEFAULT_IMAGES?.other || '/uploads/other.svg')
}

/**
 * Check if an image source has any valid image
 */
export function hasValidImage(source?: ImageSource): boolean {
  if (!source) return false
  return !!(source.imageUrl?.trim() || source.imageBase64?.trim() || source.image?.trim())
}

/**
 * Get fallback display for when no image is available
 */
export function getFallbackDisplay(source?: ImageSource & { displayName?: string; color?: string } | string): {
  text: string
  color: string
} {
  // Handle both string and object inputs
  let name: string
  let color: string | undefined
  
  if (typeof source === 'string') {
    name = source
    color = undefined
  } else if (source) {
    name = source.displayName || source.name || '?'
    color = source.color
  } else {
    name = '?'
    color = undefined
  }
  
  const text = name.charAt(0).toUpperCase()
  
  // Use provided color or generate consistent color based on name
  if (color) {
    return { text, color }
  }
  
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ]
  
  const colorIndex = name ? 
    name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length :
    0
    
  return {
    text,
    color: colors[colorIndex]
  }
}

/**
 * Migrate legacy image to Supabase Storage
 * This function can be used for gradual migration
 */
export async function migrateLegacyImage(
  source: ImageSource,
  entityId: string,
  entityType: 'product-type' | 'product' = 'product-type'
): Promise<{
  success: boolean
  imageUrl?: string
  error?: string
}> {
  try {
    // Skip if already using Supabase
    if (source.imageUrl) {
      return { success: true, imageUrl: source.imageUrl }
    }

    // Skip if no legacy image
    if (!source.image || source.image.trim() === '') {
      return { success: true }
    }

    // TODO: Implement actual migration logic
    // This would involve:
    // 1. Reading the file from the legacy path
    // 2. Converting it to a File object
    // 3. Uploading to Supabase Storage
    // 4. Updating the database record
    
    console.log(`Migration needed for ${entityType} ${entityId}: ${source.image}`)
    
    return {
      success: false,
      error: 'Migration not implemented yet'
    }
    
  } catch (error) {
    console.error('Migration error:', error)
    return {
      success: false,
      error: 'Migration failed'
    }
  }
}

/**
 * Clean up old image when updating to new one
 */
export async function cleanupOldImage(oldImageUrl?: string): Promise<void> {
  if (!oldImageUrl || !SupabaseStorageService.isSupabaseUrl(oldImageUrl)) {
    return
  }

  const fileName = SupabaseStorageService.extractFileNameFromUrl(oldImageUrl)
  if (fileName) {
    await SupabaseStorageService.deleteImage(fileName)
  }
}