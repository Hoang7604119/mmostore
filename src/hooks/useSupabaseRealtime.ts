'use client'

import { useEffect, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase, RealtimeProduct, RealtimeProductType, RealtimePayload } from '@/lib/supabase-client'

export function useSupabaseRealtime() {
  const [isConnected, setIsConnected] = useState(false)
  const queryClient = useQueryClient()

  // Handle product updates
  const handleProductUpdate = useCallback((payload: RealtimePayload<RealtimeProduct>) => {
    const { eventType, new: newRecord, old: oldRecord } = payload
    
    // Invalidate products queries to refetch data
    queryClient.invalidateQueries({ queryKey: ['products'] })
    
    // Optionally update specific product in cache
    if (eventType === 'UPDATE' && newRecord) {
      queryClient.setQueryData(['product', newRecord.id], newRecord)
    }
    

  }, [queryClient])

  // Handle product type updates
  const handleProductTypeUpdate = useCallback((payload: RealtimePayload<RealtimeProductType>) => {
    const { eventType, new: newRecord, old: oldRecord } = payload
    
    // Invalidate product types queries
    queryClient.invalidateQueries({ queryKey: ['productTypes'] })
    

  }, [queryClient])

  useEffect(() => {
    // Test connection and setup realtime subscriptions
    const setupRealtime = async () => {
      try {
        // Test basic connection
        const { data, error } = await supabase.from('products').select('id').limit(1)
        
        if (error) {
          console.error('Supabase connection failed:', error)
          setIsConnected(false)
          return
        }

        setIsConnected(true)

        // Subscribe to products table changes
        const productsSubscription = supabase
          .channel('products-changes')
          .on(
            'postgres_changes' as any,
            {
              event: '*',
              schema: 'public',
              table: 'products'
            },
            handleProductUpdate
          )
          .subscribe()

        // Subscribe to product_types table changes
        const productTypesSubscription = supabase
          .channel('product-types-changes')
          .on(
            'postgres_changes' as any,
            {
              event: '*',
              schema: 'public',
              table: 'product_types'
            },
            handleProductTypeUpdate
          )
          .subscribe()

        // Cleanup function
        return () => {
          productsSubscription.unsubscribe()
          productTypesSubscription.unsubscribe()
        }
      } catch (err) {
        console.error('Supabase realtime setup failed:', err)
        setIsConnected(false)
      }
    }

    const cleanup = setupRealtime()
    
    return () => {
      cleanup?.then(cleanupFn => cleanupFn?.())
    }
  }, [handleProductUpdate, handleProductTypeUpdate])

  return { isConnected }
}