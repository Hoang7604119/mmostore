'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function LoginRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/auth/login')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="relative mx-auto">
                <LoadingSpinner size="sm" fullScreen={false} />
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-pulse"></div>
              </div>
        <p className="mt-2 text-gray-600">Đang chuyển hướng...</p>
      </div>
    </div>
  )
}