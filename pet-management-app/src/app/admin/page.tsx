'use client'

import { Suspense, useState } from 'react'
import { AdminFeatureManager } from '@/components/admin/AdminFeatureManager'
import { AdminStats } from '@/components/admin/AdminStats'
import { AdminGuard } from '@/components/admin/AdminGuard'
import { AdminSystemSettings } from '@/components/admin/AdminSystemSettings'
import { AdminUserManagement } from '@/components/admin/AdminUserManagement'
import { AdminPluginManager } from '@/components/admin/AdminPluginManager'
import { Shield, Settings, Users, Puzzle, Database, LogIn, Trash2, Sparkles, Menu, X, CheckCircle, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

export default function AdminPanel() {
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showActionModal, setShowActionModal] = useState<string | null>(null)

  const handleSystemAction = async (action: string) => {
    setActionLoading(action)
    setMessage('')
    setShowActionModal(null)

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
    { id: 'overview', label: 'Overview', icon: Shield, description: 'System overview and quick actions' },
    { id: 'users', label: 'Users', icon: Users, description: 'Manage user accounts and permissions' },
    { id: 'settings', label: 'Settings', icon: Settings, description: 'System configuration and preferences' },
    { id: 'features', label: 'Features', icon: Puzzle, description: 'Enable/disable application features' },
    { id: 'plugins', label: 'Plugins', icon: Sparkles, description: 'Manage plugins and extensions' },
  ]

  const systemActions = [
    {
      id: 'backup',
      title: 'Database Backup',
      description: 'Create a complete system backup',
      icon: Database,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      confirmTitle: 'Create Database Backup?',
      confirmMessage: 'This will create a complete backup of your database. This may take a few minutes.',
      buttonText: 'Create Backup'
    },
    {
      id: 'cache',
      title: 'Clear Cache',
      description: 'Clear all application caches',
      icon: Trash2,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      confirmTitle: 'Clear Application Cache?',
      confirmMessage: 'This will clear all cached data. Users may experience slower performance until caches are rebuilt.',
      buttonText: 'Clear Cache'
    },
    {
      id: 'logs',
      title: 'View System Logs',
      description: 'Access system logs and diagnostics',
      icon: LogIn,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      confirmTitle: 'Open Log Viewer?',
      confirmMessage: 'This will open the system log viewer in a new window.',
      buttonText: 'View Logs'
    }
  ]

  const ActionConfirmModal = ({ action }: { action: typeof systemActions[0] }) => (
    <Dialog open={showActionModal === action.id} onOpenChange={() => setShowActionModal(null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${action.bgColor}`}>
              <action.icon className={`h-5 w-5 ${action.color}`} />
            </div>
            {action.confirmTitle}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {action.confirmMessage}
          </p>
          <div className="flex gap-3">
            <Button
              onClick={() => handleSystemAction(action.id)}
              disabled={actionLoading === action.id}
              className="flex-1"
            >
              {actionLoading === action.id ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                action.buttonText
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowActionModal(null)}
              disabled={actionLoading === action.id}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white shadow-sm border-b">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="text-lg font-semibold text-foreground">Admin Panel</h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className={`
            fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out
            lg:relative lg:translate-x-0 lg:z-0
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}>
            {/* Desktop Header */}
            <div className="hidden lg:flex items-center space-x-3 p-6 border-b">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
                <p className="text-sm text-muted-foreground">System Management</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="p-4 space-y-2 h-full overflow-y-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id)
                      setIsMobileMenuOpen(false)
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{tab.label}</div>
                      <div className="text-xs opacity-80 truncate">{tab.description}</div>
                    </div>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Mobile Overlay */}
          {isMobileMenuOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}

          {/* Main Content */}
          <div className="flex-1 lg:ml-0">
            <div className="p-4 lg:p-8 max-w-7xl mx-auto">
              {/* Message Banner */}
              {message && (
                <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 flex-shrink-0" />
                  <p className="flex-1">{message}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMessage('')}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Desktop Header */}
              <div className="hidden lg:block mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {tabs.find(tab => tab.id === activeTab)?.label}
                </h2>
                <p className="text-muted-foreground">
                  {tabs.find(tab => tab.id === activeTab)?.description}
                </p>
              </div>

              {/* Tab Content */}
              <div className="space-y-6">
                {activeTab === 'overview' && (
                  <>
                    {/* Stats Grid */}
                    <Suspense fallback={
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                          </div>
                        ))}
                      </div>
                    }>
                      <AdminStats />
                    </Suspense>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {systemActions.map((action) => (
                        <div key={action.id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                          <div className="flex items-start space-x-4">
                            <div className={`p-3 rounded-full ${action.bgColor} flex-shrink-0`}>
                              <action.icon className={`h-6 w-6 ${action.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground mb-2">{action.title}</h3>
                              <p className="text-sm text-muted-foreground mb-4">{action.description}</p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowActionModal(action.id)}
                                disabled={actionLoading === action.id}
                                className="w-full sm:w-auto"
                              >
                                {actionLoading === action.id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <action.icon className="h-4 w-4 mr-2" />
                                    {action.title}
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* System Status */}
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Activity className="h-5 w-5 text-green-600" />
                        System Status
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="font-medium text-green-800">Database</div>
                          <div className="text-2xl font-bold text-green-600">Online</div>
                          <div className="text-sm text-green-600">All connections healthy</div>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="font-medium text-blue-800">API Services</div>
                          <div className="text-2xl font-bold text-blue-600">Active</div>
                          <div className="text-sm text-blue-600">All endpoints responding</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <div className="font-medium text-purple-800">Background Jobs</div>
                          <div className="text-2xl font-bold text-purple-600">Running</div>
                          <div className="text-sm text-purple-600">Queue processing normally</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'users' && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-foreground">User Management</h3>
                      <p className="text-sm text-muted-foreground mt-1">Manage user accounts, roles, and permissions</p>
                    </div>
                    <div className="p-6">
                      <Suspense fallback={<div className="text-center py-8">Loading user management...</div>}>
                        <AdminUserManagement />
                      </Suspense>
                    </div>
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-foreground">System Settings</h3>
                      <p className="text-sm text-muted-foreground mt-1">Configure system preferences and behavior</p>
                    </div>
                    <div className="p-6">
                      <Suspense fallback={<div className="text-center py-8">Loading system settings...</div>}>
                        <AdminSystemSettings />
                      </Suspense>
                    </div>
                  </div>
                )}

                {activeTab === 'features' && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-foreground">Feature Management</h3>
                      <p className="text-sm text-muted-foreground mt-1">Enable or disable application features and modules</p>
                    </div>
                    <div className="p-6">
                      <Suspense fallback={<div className="text-center py-8">Loading features...</div>}>
                        <AdminFeatureManager />
                      </Suspense>
                    </div>
                  </div>
                )}

                {activeTab === 'plugins' && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-foreground">Plugin Management</h3>
                      <p className="text-sm text-muted-foreground mt-1">Install, configure, and manage plugins and extensions</p>
                    </div>
                    <div className="p-6">
                      <Suspense fallback={<div className="text-center py-8">Loading plugins...</div>}>
                        <AdminPluginManager />
                      </Suspense>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Confirmation Modals */}
        {systemActions.map(action => (
          <ActionConfirmModal key={action.id} action={action} />
        ))}
      </div>
    </AdminGuard>
  )
}