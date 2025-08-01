'use client'

import { Suspense, useState } from 'react'
import { AdminFeatureManager } from '@/components/admin/AdminFeatureManager'
import { AdminStats } from '@/components/admin/AdminStats'
import { AdminGuard } from '@/components/admin/AdminGuard'
import { Shield, Settings, Users, Puzzle, Database, LogIn, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AdminPanel() {
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  const handleSystemAction = async (action: string) => {
    setActionLoading(action)
    setMessage('')

    try {
      const response = await fetch('/api/admin/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message)
        
        // Handle special actions
        if (data.action === 'redirect_to_logs') {
          // In a real app, you might redirect to a log viewer
          setMessage(data.message + ' (Log viewer would open in a real implementation)')
        }
      } else {
        setMessage(data.error || 'An error occurred while performing the action')
      }
    } catch (error) {
      console.error('Error performing admin action:', error)
      setMessage('An error occurred while performing the action')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <AdminGuard>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-muted-foreground mt-1">
              Manage features, plugins, and system settings
            </p>
          </div>
        </div>

        {message && (
          <div className="bg-blue-50 border border-blue-200 text-blue-600 px-4 py-3 rounded-md">
            {message}
          </div>
        )}

        {/* Stats Grid */}
        <Suspense fallback={<div>Loading stats...</div>}>
          <AdminStats />
        </Suspense>

        {/* Main Admin Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Feature Management */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Puzzle className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Feature Management</h2>
              </div>
              <Suspense fallback={<div>Loading features...</div>}>
                <AdminFeatureManager />
              </Suspense>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            {/* System Settings */}
            <div className="card p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Settings className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">System Settings</h3>
              </div>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start text-left p-3 h-auto"
                  onClick={() => handleSystemAction('backup')}
                  disabled={actionLoading === 'backup'}
                >
                  <div className="flex items-center space-x-3">
                    <Database className="h-5 w-5" />
                    <div>
                      <div className="font-medium">
                        {actionLoading === 'backup' ? 'Creating Backup...' : 'Database Backup'}
                      </div>
                      <div className="text-sm text-muted-foreground">Create system backup</div>
                    </div>
                  </div>
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start text-left p-3 h-auto"
                  onClick={() => handleSystemAction('cache')}
                  disabled={actionLoading === 'cache'}
                >
                  <div className="flex items-center space-x-3">
                    <Trash2 className="h-5 w-5" />
                    <div>
                      <div className="font-medium">
                        {actionLoading === 'cache' ? 'Clearing Cache...' : 'Cache Management'}
                      </div>
                      <div className="text-sm text-muted-foreground">Clear application cache</div>
                    </div>
                  </div>
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start text-left p-3 h-auto"
                  onClick={() => handleSystemAction('logs')}
                  disabled={actionLoading === 'logs'}
                >
                  <div className="flex items-center space-x-3">
                    <LogIn className="h-5 w-5" />
                    <div>
                      <div className="font-medium">Log Viewer</div>
                      <div className="text-sm text-muted-foreground">View system logs</div>
                    </div>
                  </div>
                </Button>
              </div>
            </div>

            {/* Quick Stats Summary */}
            <div className="card p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Quick Overview</h3>
              </div>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-muted">
                  <div className="font-medium">System Status</div>
                  <div className="text-2xl font-bold text-green-600">Operational</div>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <div className="font-medium">Last Backup</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <div className="font-medium">Server Uptime</div>
                  <div className="text-sm text-muted-foreground">99.9% this month</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminGuard>
  )
}