import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ikpdsvjmvmgohyuwfgow.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrcGRzdmptdm1nb2h5dXdmZ293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTQ0OTksImV4cCI6MjA2OTQ3MDQ5OX0.VqfmWsp13ZioSRNEMFZJ70HyPrM5L2JXII_WNZ6cItI'

// Create Supabase client for frontend use
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Types for realtime subscriptions
export interface RealtimeProduct {
  id: string
  name: string
  price: number
  type: string
  status: 'available' | 'sold' | 'pending'
  createdAt: string
  updatedAt: string
}

export interface RealtimeProductType {
  id: string
  name: string
  description?: string
  imageUrl?: string
  productCount: number
  updatedAt: string
}

// Realtime event types
export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE'

export interface RealtimePayload<T> {
  eventType: RealtimeEvent
  new: T
  old: T
  errors: any[]
}