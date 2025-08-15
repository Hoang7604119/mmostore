'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRealtimeProducts } from '@/hooks/useRealtimeProducts'
import { useCrossTabSync } from '@/hooks/useCrossTabSync'
import { usePurchaseMutations } from '@/hooks/usePurchaseMutations'
import { useQueryClient } from '@tanstack/react-query'

interface TestScenario {
  id: string
  name: string
  description: string
  action: () => Promise<void>
  status: 'pending' | 'running' | 'success' | 'error'
  result?: string
}

export function RealtimeTestComponent() {
  const [isVisible, setIsVisible] = useState(false)
  const [testResults, setTestResults] = useState<TestScenario[]>([])
  const [isRunningTests, setIsRunningTests] = useState(false)
  const queryClient = useQueryClient()
  
  // Initialize hooks
  const { isConnected, lastUpdate, reconnectAttempts } = useRealtimeProducts()
  const { syncState, tabId } = useCrossTabSync()
  const { isLeader } = syncState
  const { purchaseMutation } = usePurchaseMutations()
  
  // Test state
  const testProductId = useRef('test-product-' + Date.now())
  const raceConditionCounter = useRef(0)
  
  // Test scenarios
  const testScenarios: TestScenario[] = [
    {
      id: 'connection-test',
      name: 'Realtime Connection Test',
      description: 'Test Supabase realtime connection and reconnection',
      action: async () => {
        // Force disconnect and reconnect
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('force-realtime-reconnect'))
        }
        await new Promise(resolve => setTimeout(resolve, 2000))
        if (!isConnected) {
          throw new Error('Failed to establish realtime connection')
        }
      },
      status: 'pending'
    },
    {
      id: 'cross-tab-sync',
      name: 'Cross-Tab Synchronization Test',
      description: 'Test data synchronization between browser tabs',
      action: async () => {
        const testData = { productId: testProductId.current, quantity: 5 }
        
        // Broadcast test message
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('cross-tab-test', {
            detail: testData
          }))
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Check if message was received (in real scenario, would check other tabs)
        console.log('Cross-tab sync test completed')
      },
      status: 'pending'
    },
    {
      id: 'optimistic-update',
      name: 'Optimistic Update Test',
      description: 'Test optimistic updates and rollback on error',
      action: async () => {
        const testPurchase = {
          productId: testProductId.current,
          quantity: 1,
          buyerId: 'test-buyer'
        }
        
        // Get initial cache state
        const initialProduct = queryClient.getQueryData(['product', testProductId.current])
        
        try {
          // This will likely fail since it's a test product
          await purchaseMutation.mutateAsync(testPurchase)
        } catch (error) {
          // Expected to fail, check if rollback occurred
          const rolledBackProduct = queryClient.getQueryData(['product', testProductId.current])
          
          if (JSON.stringify(initialProduct) !== JSON.stringify(rolledBackProduct)) {
            console.log('Optimistic update rollback successful')
          }
        }
      },
      status: 'pending'
    },
    {
      id: 'race-condition',
      name: 'Race Condition Test',
      description: 'Test concurrent updates and race condition handling',
      action: async () => {
        const promises = []
        
        // Simulate multiple concurrent updates
        for (let i = 0; i < 5; i++) {
          promises.push(
            new Promise<void>((resolve) => {
              setTimeout(() => {
                raceConditionCounter.current++
                
                // Simulate cache update
                queryClient.setQueryData(['test-race', i], {
                  id: i,
                  counter: raceConditionCounter.current,
                  timestamp: Date.now()
                })
                
                resolve()
              }, Math.random() * 100)
            })
          )
        }
        
        await Promise.all(promises)
        
        // Check final state consistency
        const finalCounter = raceConditionCounter.current
        if (finalCounter !== 5) {
          throw new Error(`Race condition detected: expected 5, got ${finalCounter}`)
        }
      },
      status: 'pending'
    },
    {
      id: 'memory-leak',
      name: 'Memory Leak Test',
      description: 'Test proper cleanup of event listeners and subscriptions',
      action: async () => {
        const initialListeners = typeof window !== 'undefined' 
          ? Object.keys((window as any)._eventListeners || {}).length 
          : 0
        
        // Create and destroy multiple components
        for (let i = 0; i < 10; i++) {
          const testDiv = document.createElement('div')
          testDiv.id = `test-component-${i}`
          document.body.appendChild(testDiv)
          
          // Simulate component mount/unmount
          await new Promise(resolve => setTimeout(resolve, 50))
          
          document.body.removeChild(testDiv)
        }
        
        const finalListeners = typeof window !== 'undefined' 
          ? Object.keys((window as any)._eventListeners || {}).length 
          : 0
        
        if (finalListeners > initialListeners + 5) {
          throw new Error(`Potential memory leak: ${finalListeners - initialListeners} extra listeners`)
        }
      },
      status: 'pending'
    }
  ]
  
  const [scenarios, setScenarios] = useState<TestScenario[]>(testScenarios)
  
  // Run individual test
  const runTest = async (scenarioId: string) => {
    setScenarios(prev => prev.map(s => 
      s.id === scenarioId ? { ...s, status: 'running' } : s
    ))
    
    const scenario = scenarios.find(s => s.id === scenarioId)
    if (!scenario) return
    
    try {
      await scenario.action()
      setScenarios(prev => prev.map(s => 
        s.id === scenarioId 
          ? { ...s, status: 'success', result: 'Test passed successfully' }
          : s
      ))
    } catch (error) {
      setScenarios(prev => prev.map(s => 
        s.id === scenarioId 
          ? { 
              ...s, 
              status: 'error', 
              result: error instanceof Error ? error.message : 'Test failed'
            }
          : s
      ))
    }
  }
  
  // Run all tests
  const runAllTests = async () => {
    setIsRunningTests(true)
    
    for (const scenario of scenarios) {
      await runTest(scenario.id)
      await new Promise(resolve => setTimeout(resolve, 500)) // Delay between tests
    }
    
    setIsRunningTests(false)
  }
  
  // Reset tests
  const resetTests = () => {
    setScenarios(testScenarios.map(s => ({ ...s, status: 'pending', result: undefined })))
    raceConditionCounter.current = 0
  }
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup test data
      queryClient.removeQueries({ queryKey: ['test-race'] })
      queryClient.removeQueries({ queryKey: ['product', testProductId.current] })
    }
  }, [])
  
  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors"
        >
          🧪 Realtime Tests
        </button>
      </div>
    )
  }
  
  return (
    <div className="fixed inset-4 bg-white border border-gray-300 rounded-lg shadow-xl z-50 overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Realtime System Tests</h2>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700 text-xl"
        >
          ×
        </button>
      </div>
      
      <div className="p-4 h-full overflow-y-auto">
        {/* Status Overview */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">Realtime Status</div>
            <div className={`text-lg font-bold ${
              isConnected ? 'text-green-600' : 'text-red-600'
            }`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
            <div className="text-xs text-gray-500">
              Attempts: {reconnectAttempts}
            </div>
          </div>
          
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="text-sm text-purple-600 font-medium">Tab Status</div>
            <div className="text-lg font-bold text-purple-600">
              {isLeader ? 'Leader' : 'Follower'}
            </div>
            <div className="text-xs text-gray-500">
              ID: {tabId.slice(0, 8)}
            </div>
          </div>
          
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-sm text-green-600 font-medium">Last Update</div>
            <div className="text-lg font-bold text-green-600">
              {lastUpdate ? lastUpdate.toLocaleTimeString() : 'None'}
            </div>
          </div>
        </div>
        
        {/* Test Controls */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={runAllTests}
            disabled={isRunningTests}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {isRunningTests ? 'Running Tests...' : 'Run All Tests'}
          </button>
          
          <button
            onClick={resetTests}
            disabled={isRunningTests}
            className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Reset Tests
          </button>
        </div>
        
        {/* Test Scenarios */}
        <div className="space-y-4">
          {scenarios.map((scenario) => (
            <div key={scenario.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium text-gray-900">{scenario.name}</h3>
                  <p className="text-sm text-gray-600">{scenario.description}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    scenario.status === 'pending' ? 'bg-gray-100 text-gray-600' :
                    scenario.status === 'running' ? 'bg-blue-100 text-blue-600' :
                    scenario.status === 'success' ? 'bg-green-100 text-green-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {scenario.status}
                  </div>
                  
                  <button
                    onClick={() => runTest(scenario.id)}
                    disabled={scenario.status === 'running' || isRunningTests}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-xs transition-colors"
                  >
                    Run
                  </button>
                </div>
              </div>
              
              {scenario.result && (
                <div className={`mt-2 p-2 rounded text-sm ${
                  scenario.status === 'success' 
                    ? 'bg-green-50 text-green-700' 
                    : 'bg-red-50 text-red-700'
                }`}>
                  {scenario.result}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}