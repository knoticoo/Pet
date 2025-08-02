'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Settings, Save, RefreshCw } from 'lucide-react'

interface SystemSetting {
  id: string
  key: string
  value: string
  description: string
  category: string
}

interface AdminSystemSettingsProps {
  className?: string
}

export function AdminSystemSettings({ className }: AdminSystemSettingsProps) {
  const [settings, setSettings] = useState<SystemSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const initializeSettings = useCallback(async () => {
    try {
      setLoading(true)
      
      // First, initialize default settings
      const initResponse = await fetch('/api/admin/settings', {
        method: 'PUT',
      })

      if (initResponse.ok) {
        const data = await initResponse.json()
        setSettings(data.settings || [])
      } else {
        // If initialization fails, try to fetch existing settings
        await fetchSettings()
      }
    } catch (error) {
      console.error('Error initializing settings:', error)
      setMessage('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    initializeSettings()
  }, [initializeSettings])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      } else {
        setMessage('Failed to fetch settings')
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      setMessage('Failed to fetch settings')
    }
  }

  const handleSettingChange = (key: string, value: string) => {
    setSettings(prevSettings =>
      prevSettings.map(setting =>
        setting.key === key ? { ...setting, value } : setting
      )
    )
  }

  const handleSaveSettings = async () => {
    try {
      setSaving(true)
      setMessage('')

      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      })

      if (response.ok) {
        setMessage('Settings saved successfully!')
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage('Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const groupedSettings = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = []
    }
    acc[setting.category].push(setting)
    return acc
  }, {} as Record<string, SystemSetting[]>)

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'ai_vet':
        return 'AI Vet Consultations'
      case 'subscription':
        return 'Subscription Settings'
      case 'limits':
        return 'User Limits'
      default:
        return category.charAt(0).toUpperCase() + category.slice(1)
    }
  }

  const getInputType = (key: string) => {
    if (key.includes('price') || key.includes('limit') || key.includes('max')) {
      return 'number'
    }
    if (key.includes('enabled')) {
      return 'select'
    }
    return 'text'
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground mt-4">Loading settings...</p>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Settings className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">System Settings</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={fetchSettings}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={handleSaveSettings}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-md ${
          message.includes('success') 
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message}
        </div>
      )}

      <div className="space-y-6">
        {Object.entries(groupedSettings).map(([category, categorySettings]) => (
          <div key={category} className="card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {getCategoryTitle(category)}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categorySettings.map((setting) => (
                <div key={setting.key} className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {setting.description}
                  </label>
                  {getInputType(setting.key) === 'select' ? (
                    <select
                      value={setting.value}
                      onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                    >
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  ) : (
                    <input
                      type={getInputType(setting.key)}
                      value={setting.value}
                      onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                      min={getInputType(setting.key) === 'number' ? '0' : undefined}
                      step={setting.key.includes('price') ? '0.01' : '1'}
                    />
                  )}
                  <p className="text-xs text-muted-foreground">
                    Key: {setting.key}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {Object.keys(groupedSettings).length === 0 && (
        <div className="text-center py-8">
          <Settings className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Settings Found</h3>
          <p className="text-muted-foreground">
            Click &quot;Refresh&quot; to initialize default settings.
          </p>
        </div>
      )}
    </div>
  )
}