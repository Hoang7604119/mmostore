'use client'

import { useEffect, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'

interface CrossTabMessage {
  type: 'PRODUCT_UPDATE' | 'CACHE_INVALIDATE' | 'PURCHASE_UPDATE' | 'SYNC_REQUEST'
  payload: any
  timestamp: number
  tabId: string
}

interface SyncState {
  isLeader: boolean
  activeTabs: number
  lastSync: Date | null
}

export function useCrossTabSync() {
  const [syncState, setSyncState] = useState<SyncState>({
    isLeader: false,
    activeTabs: 1,
    lastSync: null
  })
  const queryClient = useQueryClient()
  const [tabId] = useState(() => `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)

  // Broadcast message to other tabs
  const broadcast = useCallback((type: CrossTabMessage['type'], payload: any) => {
    if (typeof window === 'undefined') return

    const message: CrossTabMessage = {
      type,
      payload,
      timestamp: Date.now(),
      tabId
    }

    try {
      localStorage.setItem('cross-tab-message', JSON.stringify(message))
      localStorage.removeItem('cross-tab-message') // Trigger storage event
      
  
    } catch (error) {
      console.error('[CrossTab] Broadcast failed:', error)
    }
  }, [tabId])

  // Handle incoming messages from other tabs
  const handleMessage = useCallback((message: CrossTabMessage) => {
    // Ignore messages from same tab
    if (message.tabId === tabId) return


    setSyncState(prev => ({ ...prev, lastSync: new Date() }))

    switch (message.type) {
      case 'PRODUCT_UPDATE':
        // Invalidate product queries to refetch fresh data
        queryClient.invalidateQueries({ queryKey: ['products'] })
        queryClient.invalidateQueries({ queryKey: ['productTypes'] })
        break

      case 'CACHE_INVALIDATE':
        // Invalidate specific cache keys
        if (message.payload.queryKeys) {
          message.payload.queryKeys.forEach((queryKey: string[]) => {
            queryClient.invalidateQueries({ queryKey })
          })
        }
        break

      case 'PURCHASE_UPDATE':
        // Handle purchase updates (inventory changes, etc.)
        const { productId, newQuantity } = message.payload
        
        // Update product cache optimistically
        queryClient.setQueryData(['product', productId], (oldData: any) => {
          if (!oldData) return oldData
          return {
            ...oldData,
            quantity: newQuantity,
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
              products: page.products.map((product: any) => 
                product.id === productId 
                  ? { ...product, quantity: newQuantity, updated_at: new Date().toISOString() }
                  : product
              )
            }
          })
          
          return { ...oldData, pages: newPages }
        })
        break

      case 'SYNC_REQUEST':
        // Respond to sync request if we're the leader
        if (syncState.isLeader) {
          broadcast('CACHE_INVALIDATE', {
            queryKeys: [['products'], ['productTypes']]
          })
        }
        break
    }
  }, [tabId, queryClient, syncState.isLeader, broadcast])

  // Listen for storage events (cross-tab communication)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'cross-tab-message' && event.newValue) {
        try {
          const message: CrossTabMessage = JSON.parse(event.newValue)
          handleMessage(message)
        } catch (error) {
          console.error('[CrossTab] Failed to parse message:', error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [handleMessage])

  // Tab leadership election (simple timestamp-based)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const electLeader = () => {
      const leaderKey = 'cross-tab-leader'
      const leaderData = localStorage.getItem(leaderKey)
      
      if (!leaderData) {
        // No leader, become leader
        const leaderInfo = { tabId, timestamp: Date.now() }
        localStorage.setItem(leaderKey, JSON.stringify(leaderInfo))
        setSyncState(prev => ({ ...prev, isLeader: true }))
    
      } else {
        try {
          const leader = JSON.parse(leaderData)
          const isCurrentLeader = leader.tabId === tabId
          setSyncState(prev => ({ ...prev, isLeader: isCurrentLeader }))
          
          // Check if leader is stale (older than 30 seconds)
          if (Date.now() - leader.timestamp > 30000 && !isCurrentLeader) {
            const newLeaderInfo = { tabId, timestamp: Date.now() }
            localStorage.setItem(leaderKey, JSON.stringify(newLeaderInfo))
            setSyncState(prev => ({ ...prev, isLeader: true }))
        
          }
        } catch (error) {
          console.error('[CrossTab] Leader election error:', error)
        }
      }
    }

    // Initial election
    electLeader()

    // Periodic leadership check
    const leadershipInterval = setInterval(electLeader, 10000)

    // Update leader timestamp if we're the leader
    const heartbeatInterval = setInterval(() => {
      if (syncState.isLeader) {
        const leaderInfo = { tabId, timestamp: Date.now() }
        localStorage.setItem('cross-tab-leader', JSON.stringify(leaderInfo))
      }
    }, 5000)

    return () => {
      clearInterval(leadershipInterval)
      clearInterval(heartbeatInterval)
      
      // Clean up leadership if we're leaving
      if (syncState.isLeader) {
        localStorage.removeItem('cross-tab-leader')
      }
    }
  }, [tabId, syncState.isLeader])

  // Track active tabs count
  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateTabCount = () => {
      const tabsKey = 'active-tabs'
      const tabsData = localStorage.getItem(tabsKey)
      let activeTabs: string[] = []
      
      if (tabsData) {
        try {
          const parsed = JSON.parse(tabsData)
          activeTabs = Array.isArray(parsed) ? parsed : []
        } catch (error) {
          console.error('[CrossTab] Failed to parse active tabs:', error)
        }
      }
      
      // Add current tab if not present
      if (!activeTabs.includes(tabId)) {
        activeTabs.push(tabId)
      }
      
      // Remove stale tabs (older than 1 minute)
      const now = Date.now()
      activeTabs = activeTabs.filter(id => {
        const timestamp = parseInt(id.split('-')[1])
        return now - timestamp < 60000
      })
      
      localStorage.setItem(tabsKey, JSON.stringify(activeTabs))
      setSyncState(prev => ({ ...prev, activeTabs: activeTabs.length }))
    }

    // Initial count
    updateTabCount()

    // Periodic update
    const tabCountInterval = setInterval(updateTabCount, 10000)

    return () => {
      clearInterval(tabCountInterval)
      
      // Remove current tab from active list
      const tabsData = localStorage.getItem('active-tabs')
      if (tabsData) {
        try {
          const activeTabs = JSON.parse(tabsData).filter((id: string) => id !== tabId)
          localStorage.setItem('active-tabs', JSON.stringify(activeTabs))
        } catch (error) {
          console.error('[CrossTab] Failed to cleanup tab count:', error)
        }
      }
    }
  }, [tabId])

  // Request sync from other tabs
  const requestSync = useCallback(() => {
    broadcast('SYNC_REQUEST', { requesterId: tabId })
  }, [broadcast, tabId])

  // Invalidate cache across all tabs
  const invalidateAcrossTabs = useCallback((queryKeys: string[][]) => {
    broadcast('CACHE_INVALIDATE', { queryKeys })
  }, [broadcast])

  // Broadcast product update
  const broadcastProductUpdate = useCallback((productId: string, updateData: any) => {
    broadcast('PRODUCT_UPDATE', { productId, updateData })
  }, [broadcast])

  // Broadcast purchase update
  const broadcastPurchaseUpdate = useCallback((productId: string, newQuantity: number) => {
    broadcast('PURCHASE_UPDATE', { productId, newQuantity })
  }, [broadcast])

  return {
    syncState,
    tabId,
    requestSync,
    invalidateAcrossTabs,
    broadcastProductUpdate,
    broadcastPurchaseUpdate
  }
}