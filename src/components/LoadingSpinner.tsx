interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
  fullScreen?: boolean
}

export default function LoadingSpinner({ size = 'lg', className = '', fullScreen = true }: LoadingSpinnerProps) {
  const sizeClasses = {
    xs: 'h-6 w-6 border-2',
    sm: 'h-8 w-8 border-2',
    md: 'h-16 w-16 border-3', 
    lg: 'h-32 w-32 border-4'
  }

  const containerClass = fullScreen ? 'min-h-screen flex items-center justify-center' : 'flex items-center justify-center'

  return (
    <div className={`${containerClass} ${className}`}>
      <div className="relative">
        <div className={`animate-spin rounded-full ${sizeClasses[size]} border-blue-200 border-t-blue-600 shadow-lg`}></div>
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-pulse"></div>
      </div>
    </div>
  )
}