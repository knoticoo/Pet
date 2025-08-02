export interface PluginConfig {
  id: string
  name: string
  description: string
  version: string
  category: 'social' | 'health' | 'analytics' | 'photography' | 'ai'
  isEnabled: boolean
  isCore: boolean
  dependencies?: string[]
  settings?: Record<string, unknown>
  permissions?: string[]
}

export interface Plugin {
  config: PluginConfig
  initialize: () => Promise<void>
  enable: () => Promise<void>
  disable: () => Promise<void>
  getSettings: () => Record<string, unknown>
  updateSettings: (settings: Record<string, unknown>) => Promise<void>
}

class PluginManager {
  private plugins: Map<string, Plugin> = new Map()
  private enabledPlugins: Set<string> = new Set()

  async registerPlugin(plugin: Plugin): Promise<void> {
    this.plugins.set(plugin.config.id, plugin)
    
    // Load enabled state from database
    const isEnabled = await this.getPluginEnabledState(plugin.config.id)
    if (isEnabled) {
      this.enabledPlugins.add(plugin.config.id)
      await plugin.enable()
    }
  }

  async enablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`)
    }

    // Check dependencies
    if (plugin.config.dependencies) {
      for (const dep of plugin.config.dependencies) {
        if (!this.enabledPlugins.has(dep)) {
          throw new Error(`Dependency ${dep} not enabled for plugin ${pluginId}`)
        }
      }
    }

    await plugin.enable()
    this.enabledPlugins.add(pluginId)
    await this.setPluginEnabledState(pluginId, true)
  }

  async disablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`)
    }

    await plugin.disable()
    this.enabledPlugins.delete(pluginId)
    await this.setPluginEnabledState(pluginId, false)
  }

  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId)
  }

  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values())
  }

  getEnabledPlugins(): Plugin[] {
    return Array.from(this.enabledPlugins).map(id => this.plugins.get(id)!)
  }

  isPluginEnabled(pluginId: string): boolean {
    return this.enabledPlugins.has(pluginId)
  }

  private async getPluginEnabledState(pluginId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/admin/plugins/${pluginId}/status`)
      if (response.ok) {
        const data = await response.json()
        return data.enabled
      }
    } catch (error) {
      console.warn(`Failed to get plugin status for ${pluginId}:`, error)
    }
    return false
  }

  private async setPluginEnabledState(pluginId: string, enabled: boolean): Promise<void> {
    try {
      await fetch(`/api/admin/plugins/${pluginId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      })
    } catch (error) {
      console.error(`Failed to set plugin status for ${pluginId}:`, error)
    }
  }
}

export const pluginManager = new PluginManager()