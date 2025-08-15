'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface ProgressiveLoadingState {
  stage: 'idle' | 'initial' | 'loading' | 'complete' | 'error'
  progress: number
  message: string
  error?: string
}

interface ProgressiveLoadingOptions {
  stages?: Array<{
    name: string
    message: string
    duration?: number // Expected duration in ms for progress calculation
  }>
  autoProgress?: boolean
  progressInterval?: number // Interval for auto progress updates
  onStageChange?: (stage: string, progress: number) => void
  onComplete?: () => void
  onError?: (error: string) => void
}

const defaultStages = [
  { name: 'initial', message: 'Khởi tạo...', duration: 500 },
  { name: 'loading', message: 'Đang tải dữ liệu...', duration: 2000 },
  { name: 'processing', message: 'Đang xử lý...', duration: 1000 },
  { name: 'complete', message: 'Hoàn thành!', duration: 300 }
]

export function useProgressiveLoading({
  stages = defaultStages,
  autoProgress = false,
  progressInterval = 100,
  onStageChange,
  onComplete,
  onError
}: ProgressiveLoadingOptions = {}) {
  const [state, setState] = useState<ProgressiveLoadingState>({
    stage: 'idle',
    progress: 0,
    message: 'Sẵn sàng'
  })

  const currentStageIndexRef = useRef(0)
  const progressIntervalRef = useRef<NodeJS.Timeout>()
  const stageStartTimeRef = useRef<number>(0)
  const isActiveRef = useRef(false)

  // Start progressive loading
  const startLoading = useCallback(() => {
    if (isActiveRef.current) return

    isActiveRef.current = true
    currentStageIndexRef.current = 0
    stageStartTimeRef.current = Date.now()

    const firstStage = stages[0]
    setState({
      stage: 'initial',
      progress: 0,
      message: firstStage?.message || 'Bắt đầu...'
    })

    onStageChange?.(firstStage?.name || 'initial', 0)

    if (autoProgress) {
      startAutoProgress()
    }
  }, [stages, autoProgress, onStageChange])

  // Stop progressive loading
  const stopLoading = useCallback(() => {
    isActiveRef.current = false
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = undefined
    }
  }, [])

  // Complete loading successfully
  const completeLoading = useCallback(() => {
    stopLoading()
    
    setState({
      stage: 'complete',
      progress: 100,
      message: 'Hoàn thành!'
    })

    onComplete?.()
  }, [stopLoading, onComplete])

  // Set error state
  const setError = useCallback((error: string) => {
    stopLoading()
    
    setState({
      stage: 'error',
      progress: 0,
      message: 'Có lỗi xảy ra',
      error
    })

    onError?.(error)
  }, [stopLoading, onError])

  // Move to next stage
  const nextStage = useCallback(() => {
    if (!isActiveRef.current) return

    const nextIndex = currentStageIndexRef.current + 1
    
    if (nextIndex >= stages.length) {
      completeLoading()
      return
    }

    currentStageIndexRef.current = nextIndex
    stageStartTimeRef.current = Date.now()
    
    const stage = stages[nextIndex]
    const progress = Math.round((nextIndex / stages.length) * 100)
    
    setState({
      stage: 'loading',
      progress,
      message: stage.message
    })

    onStageChange?.(stage.name, progress)
  }, [stages, completeLoading, onStageChange])

  // Set custom progress
  const setProgress = useCallback((progress: number, message?: string) => {
    if (!isActiveRef.current) return

    setState(prev => ({
      ...prev,
      progress: Math.max(0, Math.min(100, progress)),
      message: message || prev.message
    }))
  }, [])

  // Set custom stage
  const setStage = useCallback((stageName: string, progress?: number, message?: string) => {
    if (!isActiveRef.current) return

    const stageIndex = stages.findIndex(s => s.name === stageName)
    if (stageIndex !== -1) {
      currentStageIndexRef.current = stageIndex
      stageStartTimeRef.current = Date.now()
    }

    setState(prev => ({
      ...prev,
      stage: 'loading',
      progress: progress !== undefined ? Math.max(0, Math.min(100, progress)) : prev.progress,
      message: message || stages[stageIndex]?.message || prev.message
    }))

    onStageChange?.(stageName, progress || state.progress)
  }, [stages, onStageChange, state.progress])

  // Auto progress functionality
  const startAutoProgress = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
    }

    progressIntervalRef.current = setInterval(() => {
      if (!isActiveRef.current) return

      const currentStage = stages[currentStageIndexRef.current]
      if (!currentStage) return

      const elapsed = Date.now() - stageStartTimeRef.current
      const stageDuration = currentStage.duration || 1000
      const stageProgress = Math.min(elapsed / stageDuration, 1)
      
      const baseProgress = (currentStageIndexRef.current / stages.length) * 100
      const stageProgressPercent = (stageProgress / stages.length) * 100
      const totalProgress = Math.min(baseProgress + stageProgressPercent, 100)

      setState(prev => ({
        ...prev,
        progress: totalProgress
      }))

      // Auto advance to next stage when current stage duration is complete
      if (stageProgress >= 1) {
        nextStage()
      }
    }, progressInterval)
  }, [stages, progressInterval, nextStage])

  // Reset to idle state
  const reset = useCallback(() => {
    stopLoading()
    currentStageIndexRef.current = 0
    
    setState({
      stage: 'idle',
      progress: 0,
      message: 'Sẵn sàng'
    })
  }, [stopLoading])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLoading()
    }
  }, [stopLoading])

  return {
    ...state,
    isLoading: state.stage === 'initial' || state.stage === 'loading',
    isComplete: state.stage === 'complete',
    isError: state.stage === 'error',
    isIdle: state.stage === 'idle',
    startLoading,
    stopLoading,
    completeLoading,
    setError,
    nextStage,
    setProgress,
    setStage,
    reset,
    currentStage: stages[currentStageIndexRef.current]?.name || 'unknown'
  }
}

// Preset configurations for common loading scenarios
export const loadingPresets = {
  dataFetch: [
    { name: 'connecting', message: 'Đang kết nối...', duration: 300 },
    { name: 'fetching', message: 'Đang tải dữ liệu...', duration: 1500 },
    { name: 'processing', message: 'Đang xử lý...', duration: 500 }
  ],
  
  fileUpload: [
    { name: 'preparing', message: 'Chuẩn bị tải lên...', duration: 200 },
    { name: 'uploading', message: 'Đang tải lên...', duration: 3000 },
    { name: 'processing', message: 'Đang xử lý tệp...', duration: 1000 },
    { name: 'finalizing', message: 'Hoàn tất...', duration: 300 }
  ],
  
  search: [
    { name: 'searching', message: 'Đang tìm kiếm...', duration: 800 },
    { name: 'filtering', message: 'Đang lọc kết quả...', duration: 400 },
    { name: 'sorting', message: 'Đang sắp xếp...', duration: 200 }
  ],
  
  pageLoad: [
    { name: 'initializing', message: 'Khởi tạo...', duration: 300 },
    { name: 'loading-data', message: 'Tải dữ liệu...', duration: 1200 },
    { name: 'rendering', message: 'Hiển thị...', duration: 400 }
  ]
}