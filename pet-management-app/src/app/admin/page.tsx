import { Suspense } from 'react'
import { AdminFeatureManager } from '@/components/admin/AdminFeatureManager'
import { AdminStats } from '@/components/admin/AdminStats'
import { Shield, Settings, Users, Puzzle } from 'lucide-react'

export default function AdminPanel() {
  return (
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
              <button className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors">
                <div className="font-medium">Database Backup</div>
                <div className="text-sm text-muted-foreground">Create system backup</div>
              </button>
              <button className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors">
                <div className="font-medium">Cache Management</div>
                <div className="text-sm text-muted-foreground">Clear application cache</div>
              </button>
              <button className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors">
                <div className="font-medium">Log Viewer</div>
                <div className="text-sm text-muted-foreground">View system logs</div>
              </button>
            </div>
          </div>

          {/* User Management */}
          <div className="card p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">User Management</h3>
            </div>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-muted">
                <div className="font-medium">Total Users</div>
                <div className="text-2xl font-bold text-primary">1,234</div>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <div className="font-medium">Active Today</div>
                <div className="text-2xl font-bold text-green-600">89</div>
              </div>
              <button className="w-full p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                Manage Users
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}