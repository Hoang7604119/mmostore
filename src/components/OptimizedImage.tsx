import React from 'react'
import LazyImage from './LazyImage'
import { cn } from '@/lib/utils'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  containerClassName?: string
  priority?: boolean
  sizes?: string
  quality?: number
  onLoad?: () => void
  onError?: () => void
}

// Generate optimized image URLs for different sizes
const generateOptimizedUrl = (src: string, width?: number, height?: number, quality = 80) => {
  if (!src || src.startsWith('data:') || src.startsWith('blob:')) {
    return src
  }

  // If it's already an optimized URL or external URL, return as is
  if (src.includes('w_') || src.includes('h_') || src.startsWith('http')) {
    return src
  }

  // For Vercel Storage or similar services, add optimization parameters
  const url = new URL(src, window.location.origin)
  
  if (width) url.searchParams.set('w', width.toString())
  if (height) url.searchParams.set('h', height.toString())
  url.searchParams.set('q', quality.toString())
  url.searchParams.set('f', 'webp') // Prefer WebP format
  
  return url.toString()
}

// Generate srcSet for responsive images
const generateSrcSet = (src: string, width?: number, height?: number, quality = 80) => {
  if (!width) return undefined

  const sizes = [1, 1.5, 2] // 1x, 1.5x, 2x for different pixel densities
  
  return sizes
    .map(scale => {
      const scaledWidth = Math.round(width * scale)
      const scaledHeight = height ? Math.round(height * scale) : undefined
      const url = generateOptimizedUrl(src, scaledWidth, scaledHeight, quality)
      return `${url} ${scale}x`
    })
    .join(', ')
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  containerClassName,
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 80,
  onLoad,
  onError,
}) => {
  // Generate optimized URLs
  const optimizedSrc = generateOptimizedUrl(src, width, height, quality)
  const srcSet = generateSrcSet(src, width, height, quality)
  
  // Fallback image for errors
  const fallbackSrc = '/images/product-placeholder.jpg'

  return (
    <LazyImage
      src={optimizedSrc}
      alt={alt}
      fallback={fallbackSrc}
      className={cn(
        'object-cover transition-transform duration-300 hover:scale-105',
        className
      )}
      containerClassName={cn(
        'relative overflow-hidden rounded-lg',
        containerClassName
      )}
      priority={priority}
      onLoad={onLoad}
      onError={onError}
    />
  )
}

// Preset components for common use cases
export const ProductImage: React.FC<Omit<OptimizedImageProps, 'width' | 'height'>> = (props) => (
  <OptimizedImage
    {...props}
    width={300}
    height={300}
    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
  />
)

export const ProductThumbnail: React.FC<Omit<OptimizedImageProps, 'width' | 'height'>> = (props) => (
  <OptimizedImage
    {...props}
    width={80}
    height={80}
    sizes="80px"
    quality={90}
  />
)

export const HeroImage: React.FC<Omit<OptimizedImageProps, 'width' | 'height' | 'priority'>> = (props) => (
  <OptimizedImage
    {...props}
    width={1200}
    height={600}
    priority={true}
    sizes="100vw"
    quality={90}
  />
)

export default OptimizedImage