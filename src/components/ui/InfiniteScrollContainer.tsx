'use client'

import React, { useEffect, useRef, useCallback } from 'react'
import { useInView } from 'react-intersection-observer'
import { SmartLoadingIndicator } from './SmartLoadingIndicator'
import { cn } from '@/lib/utils'

interface InfiniteScrollContainerProps {
  children: React.ReactNode
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  fetchNextPage?: () => void
  isLoading?: boolean
  isError?: boolean
  error?: Error | null
  threshold?: number // Intersection threshold (0-1)
  rootMargin?: string // Root margin for intersection observer
  loadingComponent?: React.ReactNode
  errorComponent?: React.ReactNode
  endMessage?: React.ReactNode
  className?: string
  containerClassName?: string
  triggerClassName?: string
  onLoadMore?: () => void
  disabled?: boolean
}

export function InfiniteScrollContainer({
  children,
  hasNextPage = false,
  isFetchingNextPage = false,
  fetchNextPage,
  isLoading = false,
  isError = false,
  error,
  threshold = 0.1,
  rootMargin = '100px',
  loadingComponent,
  errorComponent,
  endMessage,
  className,
  containerClassName,
  triggerClassName,
  onLoadMore,
  disabled = false
}: InfiniteScrollContainerProps) {
  const loadMoreRef = useRef<() => void>()
  
  // Intersection observer for infinite scroll trigger
  const { ref: triggerRef, inView } = useInView({
    threshold,
    rootMargin,
    skip: disabled || !hasNextPage || isFetchingNextPage || isLoading
  })

  // Store the load more function in ref to avoid stale closures
  loadMoreRef.current = useCallback(() => {
    if (disabled || !hasNextPage || isFetchingNextPage || isLoading) return
    
    fetchNextPage?.()
    onLoadMore?.()
  }, [disabled, hasNextPage, isFetchingNextPage, isLoading, fetchNextPage, onLoadMore])

  // Trigger load more when trigger element comes into view
  useEffect(() => {
    if (inView && loadMoreRef.current) {
      loadMoreRef.current()
    }
  }, [inView])

  const renderLoadingComponent = () => {
    if (loadingComponent) return loadingComponent
    
    return (
      <div className="flex justify-center py-8">
        <SmartLoadingIndicator
          type="spinner"
          size="md"
          variant="primary"
          message="Đang tải thêm..."
        />
      </div>
    )
  }

  const renderErrorComponent = () => {
    if (errorComponent) return errorComponent
    
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Có lỗi xảy ra</h3>
        <p className="text-gray-600 mb-4">
          {error?.message || 'Không thể tải thêm dữ liệu'}
        </p>
        <button
          onClick={() => loadMoreRef.current?.()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Thử lại
        </button>
      </div>
    )
  }

  const renderEndMessage = () => {
    if (endMessage) return endMessage
    
    return (
      <div className="flex justify-center py-8">
        <div className="text-center text-gray-500">
          <div className="w-12 h-12 mx-auto mb-4 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-medium">Đã hiển thị tất cả sản phẩm</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('relative', containerClassName)}>
      {/* Main content */}
      <div className={cn('space-y-4', className)}>
        {children}
      </div>

      {/* Loading state for initial load */}
      {isLoading && (
        <div className="py-8">
          {renderLoadingComponent()}
        </div>
      )}

      {/* Error state */}
      {isError && !isLoading && (
        <div className="py-4">
          {renderErrorComponent()}
        </div>
      )}

      {/* Infinite scroll trigger and states */}
      {!isLoading && !isError && (
        <>
          {/* Loading more indicator */}
          {isFetchingNextPage && (
            <div className="py-4">
              {renderLoadingComponent()}
            </div>
          )}

          {/* Infinite scroll trigger */}
          {hasNextPage && !isFetchingNextPage && (
            <div 
              ref={triggerRef}
              className={cn(
                'flex justify-center py-8 min-h-[100px]',
                triggerClassName
              )}
            >
              <div className="text-center text-gray-500">
                <div className="animate-pulse">
                  <div className="w-8 h-8 mx-auto mb-2 bg-gray-300 rounded-full"></div>
                  <p className="text-sm">Cuộn để tải thêm...</p>
                </div>
              </div>
            </div>
          )}

          {/* End message */}
          {!hasNextPage && !isFetchingNextPage && (
            <div className="py-4">
              {renderEndMessage()}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Hook for manual infinite scroll control
export function useInfiniteScrollControl() {
  const containerRef = useRef<HTMLDivElement>(null)
  
  const scrollToTop = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }
  }, [])

  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [])

  const scrollToElement = useCallback((elementId: string) => {
    const element = document.getElementById(elementId)
    if (element && containerRef.current) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
    }
  }, [])

  return {
    containerRef,
    scrollToTop,
    scrollToBottom,
    scrollToElement
  }
}