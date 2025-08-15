'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase-client'

interface RealtimeProduct {
  id: string
  name: string
  description?: string
  price?: number
  image_url?: string
  type?: string
  seller_id?: string
  status?: string
  created_at?: string
  updated_at?: string
}

interface RealtimePayload<T> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: T | null
  old: T | null
  errors: any[] | null
}

export function useRealtimeProducts() {
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const queryClient = useQueryClient()
  const subscriptionRef = useRef<any>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const maxReconnectAttempts = 5

  // Handle product updates from Supabase realtime
  const handleProductUpdate = useCallback((payload: any) => {
    
    
    const { eventType, new: newRecord, old: oldRecord } = payload
    const productId = newRecord?.id || oldRecord?.id
    
    if (!productId) return
    
    try {
      switch (eventType) {
        case 'INSERT':
          // Add new product to cache
          queryClient.setQueryData(['products'], (oldData: any) => {
            if (!oldData?.pages) return oldData
            
            const firstPage = oldData.pages[0]
            if (!firstPage?.products) return oldData
            
            const updatedFirstPage = {
              ...firstPage,
              products: [newRecord, ...firstPage.products],
              total: (firstPage.total || 0) + 1
            }
            
            return {
              ...oldData,
              pages: [updatedFirstPage, ...oldData.pages.slice(1)]
            }
          })
          
          // Set individual product cache
          queryClient.setQueryData(['product', productId], newRecord)
          
          // Update infinite query cache
          queryClient.setQueryData(['products', 'infinite'], (oldData: any) => {
            if (!oldData?.pages) return oldData
            
            const firstPage = oldData.pages[0]
            if (!firstPage?.products) return oldData
            
            const updatedFirstPage = {
              ...firstPage,
              products: [newRecord, ...firstPage.products]
            }
            
            return {
              ...oldData,
              pages: [updatedFirstPage, ...oldData.pages.slice(1)]
            }
          })
          break
          
        case 'UPDATE':
          // Update existing product in cache
          queryClient.setQueryData(['product', productId], newRecord)
          
          // Update in products list
          queryClient.setQueryData(['products'], (oldData: any) => {
            if (!oldData?.pages) return oldData
            
            const newPages = oldData.pages.map((page: any) => {
              if (!page?.products) return page
              
              return {
                ...page,
                products: page.products.map((product: any) => 
                  product.id === productId ? { ...product, ...newRecord } : product
                )
              }
            })
            
            return { ...oldData, pages: newPages }
          })
          
          // Update infinite query cache
          queryClient.setQueryData(['products', 'infinite'], (oldData: any) => {
            if (!oldData?.pages) return oldData
            
            const newPages = oldData.pages.map((page: any) => {
              if (!page?.products) return page
              
              return {
                ...page,
                products: page.products.map((product: any) => 
                  product.id === productId ? { ...product, ...newRecord } : product
                )
              }
            })
            
            return { ...oldData, pages: newPages }
          })
          break
          
        case 'DELETE':
          // Remove from cache
          queryClient.removeQueries({ queryKey: ['product', productId] })
          
          // Remove from products list
          queryClient.setQueryData(['products'], (oldData: any) => {
            if (!oldData?.pages) return oldData
            
            const newPages = oldData.pages.map((page: any) => {
              if (!page?.products) return page
              
              return {
                ...page,
                products: page.products.filter((product: any) => product.id !== productId),
                total: Math.max(0, (page.total || 0) - 1)
              }
            })
            
            return { ...oldData, pages: newPages }
          })
          
          // Remove from infinite query cache
          queryClient.setQueryData(['products', 'infinite'], (oldData: any) => {
            if (!oldData?.pages) return oldData
            
            const newPages = oldData.pages.map((page: any) => {
              if (!page?.products) return page
              
              return {
                ...page,
                products: page.products.filter((product: any) => product.id !== productId)
              }
            })
            
            return { ...oldData, pages: newPages }
          })
          break
      }
      
      // Broadcast to other tabs
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('product-realtime-update', {
          detail: { eventType, new: newRecord, old: oldRecord }
        }))
      }
      
      // Update last update time
      setLastUpdate(new Date())
      
      // Trigger React Query cache update event for other components
      queryClient.invalidateQueries({ 
        queryKey: ['products'], 
        exact: false,
        refetchType: 'none' // Don't refetch, just notify
      })
      
    } catch (error) {
      console.error('[Realtime] Error handling product update:', error)
      // Fallback: invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product', productId] })
    }
  }, [queryClient])

  // Setup realtime connection with retry logic
  const setupRealtime = useCallback(async () => {
    try {
      // Test connection first
      const { data, error } = await supabase.from('products').select('id').limit(1)
      
      if (error) {
        console.error('[Realtime] Connection test failed:', error)
        setIsConnected(false)
        return false
      }

      // Cleanup existing subscription
      if (subscriptionRef.current) {
        await subscriptionRef.current.unsubscribe()
      }

      // Create new subscription
      subscriptionRef.current = supabase
        .channel('products-realtime')
        .on(
          'postgres_changes' as any,
          {
            event: '*',
            schema: 'public',
            table: 'products'
          },
          handleProductUpdate
        )
        .subscribe((status: string) => {
      
          setIsConnected(status === 'SUBSCRIBED')
          
          if (status === 'SUBSCRIBED') {
            setReconnectAttempts(0)
          }
        })

      return true
    } catch (err) {
      console.error('[Realtime] Setup failed:', err)
      setIsConnected(false)
      return false
    }
  }, [handleProductUpdate])

  // Reconnect with exponential backoff
  const reconnect = useCallback(() => {
    if (reconnectAttempts >= maxReconnectAttempts) {
      console.error('[Realtime] Max reconnect attempts reached')
      return
    }

    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000)
    
    
    reconnectTimeoutRef.current = setTimeout(async () => {
      setReconnectAttempts(prev => prev + 1)
      const success = await setupRealtime()
      
      if (!success && reconnectAttempts < maxReconnectAttempts) {
        reconnect()
      }
    }, delay)
  }, [reconnectAttempts, setupRealtime])

  // Listen for cross-tab updates
  useEffect(() => {
    const handleCrossTabUpdate = (event: CustomEvent) => {
      const { eventType, new: newRecord, old: oldRecord } = event.detail
  
      
      // Update last update time
      setLastUpdate(new Date())
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('product-realtime-update', handleCrossTabUpdate as EventListener)
      
      return () => {
        window.removeEventListener('product-realtime-update', handleCrossTabUpdate as EventListener)
      }
    }
  }, [])

  // Setup realtime on mount
  useEffect(() => {
    setupRealtime()

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [])

  // Monitor connection and reconnect if needed
  useEffect(() => {
    if (!isConnected && reconnectAttempts < maxReconnectAttempts) {
      reconnect()
    }
  }, [isConnected, reconnect, reconnectAttempts])

  return {
    isConnected,
    lastUpdate,
    reconnectAttempts,
    maxReconnectAttempts,
    reconnect: () => {
      setReconnectAttempts(0)
      setupRealtime()
    }
  }
}