'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface FilterState {
  searchTerm: string
  selectedType: string
  minPrice: string
  maxPrice: string
  sortBy: string
  timestamp: number
}

interface UseFilterPersistenceOptions {
  key?: string
  enabled?: boolean
  maxAge?: number // Maximum age in milliseconds before filter state expires
  syncWithUrl?: boolean // Whether to sync with URL search params
}

export function useFilterPersistence({
  key = 'marketplace-filters',
  enabled = true,
  maxAge = 24 * 60 * 60 * 1000, // 24 hours
  syncWithUrl = true
}: UseFilterPersistenceOptions = {}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isInitializedRef = useRef(false)

  // Save filter state to localStorage
  const saveFilterState = useCallback((filters: Omit<FilterState, 'timestamp'>) => {
    if (!enabled) return

    const filterState: FilterState = {
      ...filters,
      timestamp: Date.now()
    }

    try {
      localStorage.setItem(key, JSON.stringify(filterState))
    } catch (error) {
      console.warn('Failed to save filter state:', error)
    }
  }, [enabled, key])

  // Load filter state from localStorage
  const loadFilterState = useCallback((): Partial<FilterState> | null => {
    if (!enabled) return null

    try {
      const stored = localStorage.getItem(key)
      if (!stored) return null

      const filterState: FilterState = JSON.parse(stored)
      
      // Check if filter state is not too old
      if (Date.now() - filterState.timestamp > maxAge) {
        localStorage.removeItem(key)
        return null
      }

      return filterState
    } catch (error) {
      console.warn('Failed to load filter state:', error)
      return null
    }
  }, [enabled, key, maxAge])

  // Clear filter state from localStorage
  const clearFilterState = useCallback(() => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.warn('Failed to clear filter state:', error)
    }
  }, [key])

  // Get current filters from URL search params
  const getCurrentFiltersFromUrl = useCallback((): Omit<FilterState, 'timestamp'> => {
    return {
      searchTerm: searchParams.get('search') || '',
      selectedType: searchParams.get('type') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      sortBy: searchParams.get('sortBy') || 'newest'
    }
  }, [searchParams])

  // Update URL with filter state
  const updateUrlWithFilters = useCallback((filters: Omit<FilterState, 'timestamp'>) => {
    if (!syncWithUrl) return

    const params = new URLSearchParams()
    
    if (filters.searchTerm) params.set('search', filters.searchTerm)
    if (filters.selectedType) params.set('type', filters.selectedType)
    if (filters.minPrice) params.set('minPrice', filters.minPrice)
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice)
    if (filters.sortBy && filters.sortBy !== 'newest') params.set('sortBy', filters.sortBy)

    const queryString = params.toString()
    const newUrl = queryString ? `?${queryString}` : '/marketplace'
    
    // Use replace to avoid adding to browser history for filter changes
    router.replace(newUrl, { scroll: false })
  }, [router, syncWithUrl])

  // Restore filters from localStorage if URL is empty
  const restoreFiltersIfNeeded = useCallback(() => {
    if (!enabled || isInitializedRef.current) return null

    const currentFilters = getCurrentFiltersFromUrl()
    const hasUrlFilters = Object.values(currentFilters).some(value => value !== '' && value !== 'newest')
    
    // If URL already has filters, don't restore from localStorage
    if (hasUrlFilters) {
      isInitializedRef.current = true
      return null
    }

    // Try to restore from localStorage
    const storedFilters = loadFilterState()
    if (storedFilters) {
      const filtersToRestore = {
        searchTerm: storedFilters.searchTerm || '',
        selectedType: storedFilters.selectedType || '',
        minPrice: storedFilters.minPrice || '',
        maxPrice: storedFilters.maxPrice || '',
        sortBy: storedFilters.sortBy || 'newest'
      }
      
      updateUrlWithFilters(filtersToRestore)
      isInitializedRef.current = true
      return filtersToRestore
    }

    isInitializedRef.current = true
    return null
  }, [enabled, getCurrentFiltersFromUrl, loadFilterState, updateUrlWithFilters])

  // Save current URL filters to localStorage
  const persistCurrentFilters = useCallback(() => {
    if (!enabled) return

    const currentFilters = getCurrentFiltersFromUrl()
    saveFilterState(currentFilters)
  }, [enabled, getCurrentFiltersFromUrl, saveFilterState])

  // Update both URL and localStorage with new filters
  const updateFilters = useCallback((filters: Partial<Omit<FilterState, 'timestamp'>>) => {
    const currentFilters = getCurrentFiltersFromUrl()
    const newFilters = { ...currentFilters, ...filters }
    
    updateUrlWithFilters(newFilters)
    saveFilterState(newFilters)
  }, [getCurrentFiltersFromUrl, updateUrlWithFilters, saveFilterState])

  // Reset all filters
  const resetFilters = useCallback(() => {
    const defaultFilters = {
      searchTerm: '',
      selectedType: '',
      minPrice: '',
      maxPrice: '',
      sortBy: 'newest'
    }
    
    updateUrlWithFilters(defaultFilters)
    clearFilterState()
  }, [updateUrlWithFilters, clearFilterState])

  // Initialize on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      restoreFiltersIfNeeded()
    }
  }, [])

  // Save filters when URL changes
  useEffect(() => {
    if (isInitializedRef.current) {
      persistCurrentFilters()
    }
  }, [searchParams, persistCurrentFilters])

  return {
    saveFilterState,
    loadFilterState,
    clearFilterState,
    getCurrentFiltersFromUrl,
    updateFilters,
    resetFilters,
    restoreFiltersIfNeeded,
    persistCurrentFilters
  }
}