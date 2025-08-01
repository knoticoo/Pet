'use client'

import { Suspense, useState } from 'react'
import { AdminFeatureManager } from '@/components/admin/AdminFeatureManager'
import { AdminStats } from '@/components/admin/AdminStats'
import { AdminGuard } from '@/components/admin/AdminGuard'
import { AdminSystemSettings } from '@/components/admin/AdminSystemSettings'
import { AdminUserManagement } from '@/components/admin/AdminUserManagement'
import { AdminPluginManager } from '@/components/admin/AdminPluginManager'
import { Shield, Settings, Users, Puzzle, Database, LogIn, Trash2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AdminPanel() {
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Shield },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'settings', label: 'System Settings', icon: Settings },
    { id: 'features', label: 'Features', icon: Puzzle },
    { id: 'plugins', label: 'Plugins', icon: Sparkles },
  ]

  return (
    <AdminGuard>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-muted-foreground mt-1">
              Manage users, features, settings, and system operations
            </p>
          </div>
        </div>

        {message && (
          <div className="bg-blue-50 border border-blue-200 text-blue-600 px-4 py-3 rounded-md">
            {message}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="border-b border-border">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <Suspense fallback={<div>Loading stats...</div>}>
                <AdminStats />
              </Suspense>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
          )}

          {activeTab === 'users' && (
            <Suspense fallback={<div>Loading user management...</div>}>
              <AdminUserManagement />
            </Suspense>
          )}

          {activeTab === 'settings' && (
            <Suspense fallback={<div>Loading system settings...</div>}>
              <AdminSystemSettings />
            </Suspense>
          )}

          {activeTab === 'features' && (
            <div className="card p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Puzzle className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Feature Management</h2>
              </div>
              <Suspense fallback={<div>Loading features...</div>}>
                <AdminFeatureManager />
              </Suspense>
            </div>
          )}

          {activeTab === 'plugins' && (
            <div className="card p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Sparkles className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Plugin Management</h2>
              </div>
              <Suspense fallback={<div>Loading plugins...</div>}>
                <AdminPluginManager />
              </Suspense>
            </div>
          )}
        </div>
      </div>
    </AdminGuard>
  )
}