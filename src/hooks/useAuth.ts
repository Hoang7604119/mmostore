'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export interface User {
  _id: string
  username: string
  email: string
  role: 'admin' | 'manager' | 'seller' | 'buyer'
  isActive: boolean
  credit: number
  sellerRequest?: {
    status: 'pending' | 'approved' | 'rejected'
    requestedAt: Date
    reviewedAt?: Date
    reviewedBy?: string
    note?: string
    personalInfo?: {
      fullName: string
      phoneNumber: string
      address: string
      idNumber: string
    }
    bankAccount?: {
      bankName: string
      accountNumber: string
      accountHolder: string
      branch?: string
    }
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      setUser(null)
      router.push('/auth/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return {
    user,
    loading,
    logout,
    refetch: checkAuth
  }
}