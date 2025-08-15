'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

interface ScrollPosition {
  x: number
  y: number
  timestamp: number
}

interface UseScrollRestorationOptions {
  key?: string
  enabled?: boolean
  debounceMs?: number
  maxAge?: number // Maximum age in milliseconds before scroll position expires
}

export function useScrollRestoration({
  key = 'marketplace-scroll',
  enabled = true,
  debounceMs = 100,
  maxAge = 30 * 60 * 1000 // 30 minutes
}: UseScrollRestorationOptions = {}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const isRestoringRef = useRef(false)
  const hasRestoredRef = useRef(false)

  // Create unique key based on pathname and search params
  const getStorageKey = useCallback(() => {
    const params = searchParams.toString()
    return `${key}-${pathname}${params ? `-${params}` : ''}`
  }, [key, pathname, searchParams])

  // Save scroll position to sessionStorage
  const saveScrollPosition = useCallback(() => {
    if (!enabled || isRestoringRef.current) return

    const scrollPosition: ScrollPosition = {
      x: window.scrollX,
      y: window.scrollY,
      timestamp: Date.now()
    }

    try {
      sessionStorage.setItem(getStorageKey(), JSON.stringify(scrollPosition))
    } catch (error) {
      console.warn('Failed to save scroll position:', error)
    }
  }, [enabled, getStorageKey])

  // Debounced save function
  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    saveTimeoutRef.current = setTimeout(saveScrollPosition, debounceMs)
  }, [saveScrollPosition, debounceMs])

  // Restore scroll position from sessionStorage
  const restoreScrollPosition = useCallback(() => {
    if (!enabled || hasRestoredRef.current) return

    try {
      const stored = sessionStorage.getItem(getStorageKey())
      if (!stored) return

      const scrollPosition: ScrollPosition = JSON.parse(stored)
      
      // Check if scroll position is not too old
      if (Date.now() - scrollPosition.timestamp > maxAge) {
        sessionStorage.removeItem(getStorageKey())
        return
      }

      isRestoringRef.current = true
      
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        window.scrollTo({
          left: scrollPosition.x,
          top: scrollPosition.y,
          behavior: 'auto' // Instant scroll for restoration
        })
        
        // Reset flag after a short delay
        setTimeout(() => {
          isRestoringRef.current = false
          hasRestoredRef.current = true
        }, 100)
      })
    } catch (error) {
      console.warn('Failed to restore scroll position:', error)
      isRestoringRef.current = false
    }
  }, [enabled, getStorageKey, maxAge])

  // Clear scroll position from storage
  const clearScrollPosition = useCallback(() => {
    try {
      sessionStorage.removeItem(getStorageKey())
    } catch (error) {
      console.warn('Failed to clear scroll position:', error)
    }
  }, [getStorageKey])

  // Smooth scroll to top
  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    })
  }, [])

  // Smooth scroll to element
  const scrollToElement = useCallback((elementId: string, offset = 0) => {
    const element = document.getElementById(elementId)
    if (element) {
      const elementPosition = element.offsetTop - offset
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      })
    }
  }, [])

  // Setup scroll event listener
  useEffect(() => {
    if (!enabled) return

    // Restore scroll position on mount
    restoreScrollPosition()

    // Save scroll position on scroll
    const handleScroll = () => {
      debouncedSave()
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    // Save scroll position before page unload
    const handleBeforeUnload = () => {
      saveScrollPosition()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [enabled, restoreScrollPosition, debouncedSave, saveScrollPosition])

  // Reset restoration flag when route changes
  useEffect(() => {
    hasRestoredRef.current = false
  }, [pathname, searchParams])

  return {
    saveScrollPosition,
    restoreScrollPosition,
    clearScrollPosition,
    scrollToTop,
    scrollToElement,
    isRestoring: isRestoringRef.current
  }
}