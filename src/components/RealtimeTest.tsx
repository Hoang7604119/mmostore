'use client'

import { useState, useEffect } from 'react'
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime'
import { useAuth } from '@/hooks/useAuth'

export default function RealtimeTest() {
  const [testMessage, setTestMessage] = useState('')
  const [receivedMessages, setReceivedMessages] = useState<any[]>([])
  const { user } = useAuth()
  
  const { isConnected } = useSupabaseRealtime()
  
  // Mock broadcast function for testing
  const broadcastNewMessage = async (message: any) => {
    console.log('Test component broadcasting message:', message)
    // Simulate receiving the message for testing
    setReceivedMessages(prev => [...prev, {
      ...message,
      timestamp: new Date().toLocaleTimeString()
    }])
  }

  const sendTestMessage = async () => {
    if (!testMessage.trim() || !user) return
    
    const message = {
      _id: `test_${Date.now()}`,
      content: testMessage,
      senderId: {
        _id: user._id,
        username: user.username
      },
      conversationId: 'test_conversation',
      messageType: 'text',
      createdAt: new Date().toISOString()
    }
    
    await broadcastNewMessage(message)
    setTestMessage('')
  }

  if (!user) {
    return (
      <div className="p-4 bg-yellow-100 border border-yellow-400 rounded">
        <p>Vui lòng đăng nhập để test Supabase Realtime</p>
      </div>
    )
  }

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Supabase Realtime Test</h3>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">User: {user.username} ({user._id})</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Nhập tin nhắn test..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && sendTestMessage()}
          />
          <button
            onClick={sendTestMessage}
            disabled={!testMessage.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Gửi Test
          </button>
        </div>
      </div>

      <div className="border-t pt-4">
        <h4 className="font-medium mb-2">Tin nhắn nhận được:</h4>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {receivedMessages.length === 0 ? (
            <p className="text-gray-500 text-sm">Chưa có tin nhắn nào...</p>
          ) : (
            receivedMessages.map((msg, index) => (
              <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                <div className="font-medium">{msg.senderId?.username || 'Unknown'}</div>
                <div>{msg.content}</div>
                <div className="text-xs text-gray-500">{msg.timestamp}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}