'use client'

import React from 'react'
import { Loader2, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SmartLoadingIndicatorProps {
  type?: 'spinner' | 'pulse' | 'dots' | 'progress' | 'skeleton'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'primary' | 'secondary' | 'muted' | 'success' | 'warning' | 'error'
  message?: string
  progress?: number // 0-100 for progress type
  isVisible?: boolean
  className?: string
  showIcon?: boolean
  iconType?: 'loading' | 'refresh' | 'network' | 'offline'
  position?: 'inline' | 'overlay' | 'fixed-top' | 'fixed-bottom'
  backdrop?: boolean
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
}

const variantClasses = {
  primary: 'text-blue-600',
  secondary: 'text-gray-600',
  muted: 'text-gray-400',
  success: 'text-green-600',
  warning: 'text-yellow-600',
  error: 'text-red-600'
}

const positionClasses = {
  inline: '',
  overlay: 'absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm',
  'fixed-top': 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50',
  'fixed-bottom': 'fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50'
}

export function SmartLoadingIndicator({
  type = 'spinner',
  size = 'md',
  variant = 'primary',
  message,
  progress,
  isVisible = true,
  className,
  showIcon = true,
  iconType = 'loading',
  position = 'inline',
  backdrop = false
}: SmartLoadingIndicatorProps) {
  if (!isVisible) return null

  const getIcon = () => {
    if (!showIcon) return null

    const iconClass = cn(sizeClasses[size], variantClasses[variant], 'animate-spin')
    
    switch (iconType) {
      case 'refresh':
        return <RefreshCw className={iconClass} />
      case 'network':
        return <Wifi className={cn(sizeClasses[size], variantClasses[variant])} />
      case 'offline':
        return <WifiOff className={cn(sizeClasses[size], variantClasses[variant])} />
      default:
        return <Loader2 className={iconClass} />
    }
  }

  const renderLoadingContent = () => {
    switch (type) {
      case 'spinner':
        return (
          <div className="flex items-center gap-3">
            {getIcon()}
            {message && (
              <span className={cn('text-sm font-medium', variantClasses[variant])}>
                {message}
              </span>
            )}
          </div>
        )

      case 'pulse':
        return (
          <div className="flex items-center gap-3">
            <div className={cn(
              'rounded-full animate-pulse',
              sizeClasses[size],
              variant === 'primary' ? 'bg-blue-600' :
              variant === 'secondary' ? 'bg-gray-600' :
              variant === 'success' ? 'bg-green-600' :
              variant === 'warning' ? 'bg-yellow-600' :
              variant === 'error' ? 'bg-red-600' : 'bg-gray-400'
            )} />
            {message && (
              <span className={cn('text-sm font-medium', variantClasses[variant])}>
                {message}
              </span>
            )}
          </div>
        )

      case 'dots':
        return (
          <div className="flex items-center gap-3">
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={cn(
                    'w-2 h-2 rounded-full animate-bounce',
                    variant === 'primary' ? 'bg-blue-600' :
                    variant === 'secondary' ? 'bg-gray-600' :
                    variant === 'success' ? 'bg-green-600' :
                    variant === 'warning' ? 'bg-yellow-600' :
                    variant === 'error' ? 'bg-red-600' : 'bg-gray-400'
                  )}
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
            {message && (
              <span className={cn('text-sm font-medium', variantClasses[variant])}>
                {message}
              </span>
            )}
          </div>
        )

      case 'progress':
        return (
          <div className="w-full max-w-xs">
            {message && (
              <div className="flex justify-between items-center mb-2">
                <span className={cn('text-sm font-medium', variantClasses[variant])}>
                  {message}
                </span>
                {progress !== undefined && (
                  <span className={cn('text-sm', variantClasses[variant])}>
                    {Math.round(progress)}%
                  </span>
                )}
              </div>
            )}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={cn(
                  'h-2 rounded-full transition-all duration-300 ease-out',
                  variant === 'primary' ? 'bg-blue-600' :
                  variant === 'secondary' ? 'bg-gray-600' :
                  variant === 'success' ? 'bg-green-600' :
                  variant === 'warning' ? 'bg-yellow-600' :
                  variant === 'error' ? 'bg-red-600' : 'bg-gray-400'
                )}
                style={{ width: `${progress || 0}%` }}
              />
            </div>
          </div>
        )

      case 'skeleton':
        return (
          <div className="animate-pulse">
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-gray-300 h-10 w-10"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const containerClasses = cn(
    'flex items-center justify-center',
    positionClasses[position],
    backdrop && position === 'overlay' && 'bg-white/90 backdrop-blur-sm',
    className
  )

  return (
    <div className={containerClasses}>
      {renderLoadingContent()}
    </div>
  )
}

// Preset components for common use cases
export function PageLoadingIndicator({ message = "Đang tải..." }: { message?: string }) {
  return (
    <SmartLoadingIndicator
      type="spinner"
      size="lg"
      variant="primary"
      message={message}
      position="overlay"
      backdrop
    />
  )
}

export function InlineLoadingIndicator({ message }: { message?: string }) {
  return (
    <SmartLoadingIndicator
      type="spinner"
      size="sm"
      variant="secondary"
      message={message}
      position="inline"
    />
  )
}

export function ProgressLoadingIndicator({ 
  progress, 
  message = "Đang xử lý..." 
}: { 
  progress: number
  message?: string 
}) {
  return (
    <SmartLoadingIndicator
      type="progress"
      variant="primary"
      message={message}
      progress={progress}
      position="inline"
    />
  )
}

export function NetworkStatusIndicator({ 
  isOnline = true, 
  message 
}: { 
  isOnline?: boolean
  message?: string 
}) {
  return (
    <SmartLoadingIndicator
      type="spinner"
      size="sm"
      variant={isOnline ? "success" : "error"}
      message={message || (isOnline ? "Đã kết nối" : "Mất kết nối")}
      iconType={isOnline ? "network" : "offline"}
      showIcon
      position="fixed-top"
    />
  )
}