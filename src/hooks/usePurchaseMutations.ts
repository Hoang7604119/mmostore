'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useCrossTabSync } from './useCrossTabSync'

interface PurchaseData {
  productId: string
  quantity: number
  buyerId: string
}

interface Product {
  id: string
  name: string
  price: number
  quantity?: number
  status: string
  seller_id: string
  [key: string]: any
}

export function usePurchaseMutations() {
  const queryClient = useQueryClient()
  const { broadcastPurchaseUpdate } = useCrossTabSync()

  // Optimistic update helper
  const updateProductOptimistically = useCallback((productId: string, quantityChange: number) => {
    // Update individual product cache
    queryClient.setQueryData(['product', productId], (oldData: Product | undefined) => {
      if (!oldData) return oldData
      
      const newQuantity = Math.max(0, (oldData.quantity || 0) - quantityChange)
      const newStatus = newQuantity === 0 ? 'sold_out' : oldData.status
      
      return {
        ...oldData,
        quantity: newQuantity,
        status: newStatus,
        updated_at: new Date().toISOString()
      }
    })

    // Update products list cache
    queryClient.setQueryData(['products'], (oldData: any) => {
      if (!oldData?.pages) return oldData
      
      const newPages = oldData.pages.map((page: any) => {
        if (!page?.products) return page
        
        return {
          ...page,
          products: page.products.map((product: Product) => {
            if (product.id === productId) {
              const newQuantity = Math.max(0, (product.quantity || 0) - quantityChange)
              const newStatus = newQuantity === 0 ? 'sold_out' : product.status
              
              return {
                ...product,
                quantity: newQuantity,
                status: newStatus,
                updated_at: new Date().toISOString()
              }
            }
            return product
          })
        }
      })
      
      return { ...oldData, pages: newPages }
    })

    // Broadcast to other tabs
    const updatedProduct = queryClient.getQueryData(['product', productId]) as Product
    if (updatedProduct) {
      broadcastPurchaseUpdate(productId, updatedProduct.quantity || 0)
    }
  }, [queryClient, broadcastPurchaseUpdate])

  // Revert optimistic update on error
  const revertOptimisticUpdate = useCallback((productId: string, originalQuantity: number) => {
    queryClient.setQueryData(['product', productId], (oldData: Product | undefined) => {
      if (!oldData) return oldData
      
      return {
        ...oldData,
        quantity: originalQuantity,
        status: originalQuantity > 0 ? 'active' : 'sold_out',
        updated_at: new Date().toISOString()
      }
    })

    // Revert products list cache
    queryClient.setQueryData(['products'], (oldData: any) => {
      if (!oldData?.pages) return oldData
      
      const newPages = oldData.pages.map((page: any) => {
        if (!page?.products) return page
        
        return {
          ...page,
          products: page.products.map((product: Product) => {
            if (product.id === productId) {
              return {
                ...product,
                quantity: originalQuantity,
                status: originalQuantity > 0 ? 'active' : 'sold_out',
                updated_at: new Date().toISOString()
              }
            }
            return product
          })
        }
      })
      
      return { ...oldData, pages: newPages }
    })

    // Broadcast revert to other tabs
    broadcastPurchaseUpdate(productId, originalQuantity)
  }, [queryClient, broadcastPurchaseUpdate])

  // Purchase mutation with optimistic updates
  const purchaseMutation = useMutation({
    mutationFn: async (purchaseData: PurchaseData) => {
      const response = await fetch('/api/buyer/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(purchaseData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Purchase failed' }))
        throw new Error(errorData.message || 'Purchase failed')
      }

      return response.json()
    },
    onMutate: async (purchaseData: PurchaseData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['product', purchaseData.productId] })
      await queryClient.cancelQueries({ queryKey: ['products'] })

      // Get current product data
      const previousProduct = queryClient.getQueryData(['product', purchaseData.productId]) as Product
      const originalQuantity = previousProduct?.quantity || 0

      // Apply optimistic update
      updateProductOptimistically(purchaseData.productId, purchaseData.quantity)

      // Return context for rollback
      return { previousProduct, originalQuantity }
    },
    onError: (error, purchaseData, context) => {
      console.error('[Purchase] Failed:', error)
      
      // Revert optimistic update
      if (context?.originalQuantity !== undefined) {
        revertOptimisticUpdate(purchaseData.productId, context.originalQuantity)
      }
    },
    onSuccess: (data, purchaseData) => {

      
      // Invalidate related queries to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ['product', purchaseData.productId] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['user', 'orders'] })
    },
    onSettled: () => {
      // Always refetch after mutation settles
      queryClient.invalidateQueries({ queryKey: ['products'] })
    }
  })

  // Add to cart mutation (if cart functionality exists)
  const addToCartMutation = useMutation({
    mutationFn: async (cartData: { productId: string; quantity: number; buyerId: string }) => {
      const response = await fetch('/api/buyer/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(cartData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Add to cart failed' }))
        throw new Error(errorData.message || 'Add to cart failed')
      }

      return response.json()
    },
    onSuccess: (data, cartData) => {

      
      // Invalidate cart queries
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      queryClient.invalidateQueries({ queryKey: ['user', 'cart'] })
    },
    onError: (error) => {
      console.error('[Cart] Add failed:', error)
    }
  })

  // Reserve product mutation (temporary hold)
  const reserveProductMutation = useMutation({
    mutationFn: async (reserveData: { productId: string; quantity: number; buyerId: string; duration?: number }) => {
      const response = await fetch('/api/buyer/reserve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(reserveData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Reserve failed' }))
        throw new Error(errorData.message || 'Reserve failed')
      }

      return response.json()
    },
    onMutate: async (reserveData) => {
      // Apply optimistic update for reservation
      await queryClient.cancelQueries({ queryKey: ['product', reserveData.productId] })
      
      const previousProduct = queryClient.getQueryData(['product', reserveData.productId]) as Product
      
      // Mark as reserved in cache
      queryClient.setQueryData(['product', reserveData.productId], (oldData: Product | undefined) => {
        if (!oldData) return oldData
        
        return {
          ...oldData,
          reserved_quantity: (oldData.reserved_quantity || 0) + reserveData.quantity,
          available_quantity: Math.max(0, (oldData.quantity || 0) - reserveData.quantity),
          updated_at: new Date().toISOString()
        }
      })
      
      return { previousProduct }
    },
    onError: (error, reserveData, context) => {
      console.error('[Reserve] Failed:', error)
      
      // Revert reservation
      if (context?.previousProduct) {
        queryClient.setQueryData(['product', reserveData.productId], context.previousProduct)
      }
    },
    onSuccess: (data, reserveData) => {

      
      // Invalidate to get fresh data
      queryClient.invalidateQueries({ queryKey: ['product', reserveData.productId] })
    }
  })

  return {
    purchaseMutation,
    addToCartMutation,
    reserveProductMutation,
    updateProductOptimistically,
    revertOptimisticUpdate
  }
}