'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Server, 
  Cpu, 
  HardDrive, 
  Wifi, 
  WifiOff, 
  Play, 
  Square, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface OllamaStatus {
  isRunning: boolean
  version?: string
  models?: string[]
  systemInfo?: {
    cpu: string
    memory: string
    disk: string
  }
  lastCheck: string
  error?: string
}

interface OllamaModel {
  name: string
  size: string
  modified: string
  digest: string
}

export function AdminOllamaStatus() {
  const [status, setStatus] = useState<OllamaStatus | null>(null)
  const [models, setModels] = useState<OllamaModel[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const checkOllamaStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/ollama/status')
      if (response.ok) {
        const data = await response.json()
        setStatus(data.status)
        setModels(data.models || [])
      } else {
        setStatus({
          isRunning: false,
          lastCheck: new Date().toISOString(),
          error: 'Failed to connect to Ollama'
        })
      }
    } catch {
      setStatus({
        isRunning: false,
        lastCheck: new Date().toISOString(),
        error: 'Connection error'
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  const performOllamaAction = useCallback(async (action: string) => {
    setActionLoading(action)
    try {
      const response = await fetch('/api/admin/ollama/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        // Refresh status after action
        await checkOllamaStatus()
      }
    } catch {
      console.error('Error performing Ollama action')
    } finally {
      setActionLoading(null)
    }
  }, [checkOllamaStatus])

  useEffect(() => {
    checkOllamaStatus()
    
    // Set up periodic status check every 30 seconds
    const interval = setInterval(checkOllamaStatus, 30000)
    
    return () => clearInterval(interval)
  }, [checkOllamaStatus])

  const getStatusColor = (isRunning: boolean) => {
    return isRunning ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }

  const getStatusIcon = (isRunning: boolean) => {
    return isRunning ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Ollama AI Status</h3>
          <p className="text-sm text-muted-foreground">
            Monitor Ollama AI service status and manage models
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setRefreshing(true)
            checkOllamaStatus()
          }}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Service Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Service Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(status?.isRunning || false)}>
                  {getStatusIcon(status?.isRunning || false)}
                  <span className="ml-1">
                    {status?.isRunning ? 'Running' : 'Stopped'}
                  </span>
                </Badge>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Version</div>
                <div className="text-sm font-medium">
                  {status?.version || 'Unknown'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Resources */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">System Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {status?.systemInfo ? (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Cpu className="h-4 w-4 text-blue-500" />
                      <span className="text-xs text-muted-foreground">CPU</span>
                    </div>
                    <span className="text-sm font-medium">{status.systemInfo.cpu}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <HardDrive className="h-4 w-4 text-green-500" />
                      <span className="text-xs text-muted-foreground">Memory</span>
                    </div>
                    <span className="text-sm font-medium">{status.systemInfo.memory}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <HardDrive className="h-4 w-4 text-purple-500" />
                      <span className="text-xs text-muted-foreground">Disk</span>
                    </div>
                    <span className="text-sm font-medium">{status.systemInfo.disk}</span>
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">System info unavailable</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Connection Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Connection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {status?.isRunning ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm">
                  {status?.isRunning ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Last Check</div>
                <div className="text-xs">
                  {status?.lastCheck ? new Date(status.lastCheck).toLocaleTimeString() : 'Never'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {status?.error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Error: {status.error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Service Actions</CardTitle>
          <CardDescription>
            Start, stop, or restart the Ollama service
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => performOllamaAction('start')}
              disabled={actionLoading === 'start' || status?.isRunning}
            >
              {actionLoading === 'start' ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Start Service
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => performOllamaAction('stop')}
              disabled={actionLoading === 'stop' || !status?.isRunning}
            >
              {actionLoading === 'stop' ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
              ) : (
                <Square className="h-4 w-4 mr-2" />
              )}
              Stop Service
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => performOllamaAction('restart')}
              disabled={actionLoading === 'restart'}
            >
              {actionLoading === 'restart' ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Restart Service
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Models List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Installed Models</CardTitle>
          <CardDescription>
            {models.length} model{models.length !== 1 ? 's' : ''} installed
          </CardDescription>
        </CardHeader>
        <CardContent>
          {models.length > 0 ? (
            <div className="space-y-3">
              {models.map((model) => (
                <div key={model.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{model.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Size: {model.size} • Modified: {new Date(model.modified).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-xs">
                      {model.digest.slice(0, 8)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Server className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No models installed</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}