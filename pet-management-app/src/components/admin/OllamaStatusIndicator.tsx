'use client'

import { useState, useEffect, useCallback } from 'react'

interface OllamaStatus {
  isRunning: boolean
  error?: string
}

export function OllamaStatusIndicator() {
  const [status, setStatus] = useState<OllamaStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const checkStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/ollama/status')
      if (response.ok) {
        const data = await response.json()
        setStatus(data.status)
      } else {
        setStatus({ isRunning: false, error: 'Failed to check status' })
      }
    } catch {
      setStatus({ isRunning: false, error: 'Connection error' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkStatus()
    
    // Check status every 30 seconds
    const interval = setInterval(checkStatus, 30000)
    
    return () => clearInterval(interval)
  }, []) // Remove checkStatus from dependencies to prevent infinite loop

  if (loading) {
    return (
      <div className="text-center p-4 bg-orange-50 rounded-lg">
        <div className="font-medium text-orange-800">Ollama AI</div>
        <div className="text-2xl font-bold text-orange-600">Checking...</div>
        <div className="text-sm text-orange-600">AI service status</div>
      </div>
    )
  }

  const isRunning = status?.isRunning || false
  const bgColor = isRunning ? 'bg-green-50' : 'bg-red-50'
  const textColor = isRunning ? 'text-green-800' : 'text-red-800'
  const statusColor = isRunning ? 'text-green-600' : 'text-red-600'
  const statusText = isRunning ? 'Running' : 'Stopped'
  const description = isRunning ? 'AI service active' : 'AI service inactive'

  return (
    <div className={`text-center p-4 ${bgColor} rounded-lg`}>
      <div className="font-medium text-orange-800">Ollama AI</div>
      <div className={`text-2xl font-bold ${statusColor}`}>{statusText}</div>
      <div className={`text-sm ${textColor}`}>{description}</div>
    </div>
  )
}