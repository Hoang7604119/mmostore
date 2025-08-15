import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface LazyImageProps {
  src: string
  alt: string
  fallback?: string
  className?: string
  containerClassName?: string
  onLoad?: () => void
  onError?: () => void
  priority?: boolean // For above-the-fold images
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  fallback = '/images/placeholder.jpg',
  className,
  containerClassName,
  onLoad,
  onError,
  priority = false,
}) => {
  const [imageSrc, setImageSrc] = useState(priority ? src : fallback)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)
  const [hasIntersected, setHasIntersected] = useState(priority)

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || hasIntersected) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasIntersected(true)
          setImageSrc(src)
          observer.disconnect()
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px', // Start loading 50px before the image enters viewport
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [src, priority, hasIntersected])

  // Handle image load
  const handleImageLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  // Handle image error
  const handleImageError = () => {
    setHasError(true)
    setIsLoading(false)
    if (imageSrc !== fallback) {
      setImageSrc(fallback)
    }
    onError?.()
  }

  return (
    <div
      ref={imgRef}
      className={cn(
        'relative overflow-hidden bg-gray-100',
        containerClassName
      )}
    >
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 animate-pulse bg-gray-200 flex items-center justify-center">
          <div className="w-8 h-8 text-gray-400">
            <svg
              className="w-full h-full"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Actual image */}
      <img
        src={imageSrc}
        alt={alt}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          className
        )}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading={priority ? 'eager' : 'lazy'}
      />

      {/* Error state */}
      {hasError && imageSrc === fallback && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="w-8 h-8 mx-auto mb-2 text-gray-400">
              <svg
                className="w-full h-full"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="text-xs">Không thể tải ảnh</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default LazyImage