'use client'

import { User, Bell, Shield, Palette, Database, Crown, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AuthGuard } from '@/components/AuthGuard'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { t } from '@/lib/translations'
import { ThemeSelector } from '@/components/ThemeSelector'

export default function SettingsPage() {
  const { data: session } = useSession()
  const [activeSection, setActiveSection] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [userSubscription, setUserSubscription] = useState<{
    tier: string
    status: string
    isAdmin: boolean
  } | null>(null)
  const [settings, setSettings] = useState({
    language: 'ru',
    name: '',
    email: '',
    phone: '',
    timezone: 'Europe/Moscow',
    emailNotifications: true,
    appointmentReminders: true,
    medicationReminders: true,
    weeklyReports: false
  })

  useEffect(() => {
    // Initialize settings from session
    if (session?.user) {
      setSettings(prev => ({
        ...prev,
        name: session.user.name || '',
        email: session.user.email || ''
      }))
    }
    
    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem('petcare-settings')
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings)
      setSettings(prev => ({ ...prev, ...parsed }))
    }
    
    // Fetch user subscription info
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('/api/ai-vet/status')
        if (response.ok) {
          const data = await response.json()
          setUserSubscription({
            tier: data.subscriptionTier || 'free',
            status: data.subscriptionStatus || 'active',
            isAdmin: session?.user?.isAdmin || false
          })
        }
      } catch (error) {
        console.error('Failed to fetch user info:', error)
        setUserSubscription({
          tier: 'free',
          status: 'active',
          isAdmin: session?.user?.isAdmin || false
        })
      }
    }

    if (session) {
      fetchUserInfo()
    }
  }, [session])

  const handleSettingChange = (key: string, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      // Save to localStorage
      localStorage.setItem('petcare-settings', JSON.stringify(settings))
      
      // Here you could also save to your API if needed
      // await fetch('/api/settings', { method: 'POST', body: JSON.stringify(settings) })
      
      alert('Настройки сохранены успешно!')
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert('Ошибка при сохранении настроек')
    } finally {
      setSaving(false)
    }
  }

  const sections = [
    { id: 'profile', name: t('settings.profile'), icon: User },
    { id: 'notifications', name: t('settings.notifications'), icon: Bell },
    { id: 'appearance', name: t('settings.appearance'), icon: Palette },
    { id: 'privacy', name: t('settings.privacy'), icon: Shield },
    { id: 'subscription', name: t('settings.subscription'), icon: Crown },
    { id: 'data', name: t('settings.dataExport'), icon: Database },
  ]

  const getSubscriptionDisplay = () => {
    if (!userSubscription) return { tier: 'free', price: '$0', period: t('settings.perMonth') }
    
    // For admins, show lifetime if they have it
    if (userSubscription.isAdmin && userSubscription.tier === 'lifetime') {
      return { 
        tier: 'lifetime', 
        price: t('settings.lifetimeFeaturesIncluded'), 
        period: '' 
      }
    }
    
    // For regular users, never show lifetime - convert to premium
    if (userSubscription.tier === 'lifetime') {
      return { 
        tier: 'premium', 
        price: '$9.99', 
        period: t('settings.perMonth') 
      }
    }
    
    if (userSubscription.tier === 'premium') {
      return { 
        tier: 'premium', 
        price: '$9.99', 
        period: t('settings.perMonth') 
      }
    }
    
    return { 
      tier: 'free', 
      price: '$0', 
      period: t('settings.perMonth') 
    }
  }

  const subscriptionDisplay = getSubscriptionDisplay()

  return (
    <AuthGuard>
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t('settings.title')}</h1>
          <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
            {t('settings.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Settings Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                    activeSection === section.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <section.icon className="h-5 w-5" />
                    <span>{section.name}</span>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Settings */}
            {activeSection === 'profile' && (
              <div className="card p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <User className="h-6 w-6 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">{t('settings.profileSettings')}</h2>
                </div>

                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                        {t('settings.fullName')}
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={settings.name}
                        onChange={(e) => handleSettingChange('name', e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                        {t('settings.emailAddress')}
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={settings.email}
                        onChange={(e) => handleSettingChange('email', e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                        {t('settings.phoneNumber')}
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={settings.phone}
                        onChange={(e) => handleSettingChange('phone', e.target.value)}
                        placeholder="+7 (999) 123-4567"
                        className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    <div>
                      <label htmlFor="timezone" className="block text-sm font-medium text-foreground mb-2">
                        {t('settings.timezone')}
                      </label>
                      <select
                        id="timezone"
                        name="timezone"
                        value={settings.timezone}
                        onChange={(e) => handleSettingChange('timezone', e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="Europe/Moscow">Московское время (MSK)</option>
                        <option value="Europe/Samara">Самарское время (SAMT)</option>
                        <option value="Asia/Yekaterinburg">Екатеринбургское время (YEKT)</option>
                        <option value="Asia/Novosibirsk">Новосибирское время (NOVT)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button variant="outline">{t('settings.cancel')}</Button>
                    <Button onClick={saveSettings} disabled={saving}>
                      {saving ? 'Сохраняем...' : t('settings.saveChanges')}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Notification Preferences */}
            {activeSection === 'notifications' && (
              <div className="card p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <Bell className="h-6 w-6 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">{t('settings.notificationPreferences')}</h2>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-foreground">{t('settings.emailNotifications')}</h3>
                      <p className="text-sm text-muted-foreground">{t('settings.emailNotificationsDesc')}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-foreground">{t('settings.appointmentReminders')}</h3>
                      <p className="text-sm text-muted-foreground">{t('settings.appointmentRemindersDesc')}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-foreground">{t('settings.medicationReminders')}</h3>
                      <p className="text-sm text-muted-foreground">{t('settings.medicationRemindersDesc')}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-foreground">{t('settings.weeklyReports')}</h3>
                      <p className="text-sm text-muted-foreground">{t('settings.weeklyReportsDesc')}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Feature Management */}
            {activeSection === 'appearance' && (
              <div className="card p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <Palette className="h-6 w-6 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">{t('settings.appearance')}</h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium text-foreground mb-3">{t('settings.theme')}</h3>
                    <p className="text-sm text-muted-foreground mb-4">Выберите тему для ваших любимых питомцев</p>
                    
                    <ThemeSelector />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-foreground">{t('settings.language')}</h3>
                      <p className="text-sm text-muted-foreground">Выберите язык интерфейса</p>
                    </div>
                    <select 
                      value={settings.language}
                      onChange={(e) => handleSettingChange('language', e.target.value)}
                      className="px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="ru">Русский</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>
                  
                <div className="flex justify-end mt-6">
                  <Button onClick={saveSettings} disabled={saving}>
                    {saving ? 'Сохраняем...' : t('settings.saveChanges')}
                  </Button>
                </div>
              </div>
            )}

            {/* Privacy Settings */}
            {activeSection === 'privacy' && (
              <div className="card p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <Shield className="h-6 w-6 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">{t('settings.privacy')}</h2>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-foreground">Профиль виден другим</h3>
                      <p className="text-sm text-muted-foreground">Разрешить другим пользователям видеть ваш профиль</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-foreground">Сбор аналитики</h3>
                      <p className="text-sm text-muted-foreground">Разрешить сбор анонимных данных для улучшения сервиса</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Subscription Settings */}
            {activeSection === 'subscription' && (
              <div className="card p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <Crown className="h-6 w-6 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">{t('settings.subscriptionPremiumFeatures')}</h2>
                </div>

                <div className="space-y-6">
                  {/* Current Plan */}
                  <div className={`p-4 border rounded-lg ${
                    subscriptionDisplay.tier === 'lifetime' 
                      ? 'bg-gradient-to-r from-purple-50 to-yellow-50 border-purple-200'
                      : subscriptionDisplay.tier === 'premium'
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200'
                      : 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className={`font-semibold ${
                          subscriptionDisplay.tier === 'lifetime' 
                            ? 'text-purple-900'
                            : subscriptionDisplay.tier === 'premium'
                            ? 'text-blue-900'
                            : 'text-blue-900'
                        }`}>
                          {subscriptionDisplay.tier === 'lifetime' 
                            ? t('settings.currentPlanLifetime')
                            : subscriptionDisplay.tier === 'premium'
                            ? t('settings.currentPlanPremium')
                            : t('settings.currentPlanFree')
                          }
                        </h3>
                        <p className={`text-sm ${
                          subscriptionDisplay.tier === 'lifetime' 
                            ? 'text-purple-700'
                            : subscriptionDisplay.tier === 'premium'
                            ? 'text-blue-700'
                            : 'text-blue-700'
                        }`}>
                          {subscriptionDisplay.tier === 'lifetime' 
                            ? t('settings.lifetimeFeaturesIncluded')
                            : subscriptionDisplay.tier === 'premium'
                            ? t('settings.premiumFeaturesIncluded')
                            : t('settings.basicFeaturesIncluded')
                          }
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${
                          subscriptionDisplay.tier === 'lifetime' 
                            ? 'text-purple-900'
                            : subscriptionDisplay.tier === 'premium'
                            ? 'text-blue-900'
                            : 'text-blue-900'
                        }`}>
                          {subscriptionDisplay.tier === 'lifetime' ? '∞' : subscriptionDisplay.price}
                        </p>
                        {subscriptionDisplay.period && (
                          <p className={`text-sm ${
                            subscriptionDisplay.tier === 'lifetime' 
                              ? 'text-purple-700'
                              : subscriptionDisplay.tier === 'premium'
                              ? 'text-blue-700'
                              : 'text-blue-700'
                          }`}>
                            {subscriptionDisplay.period}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Premium Features - only show upgrade if not premium/lifetime */}
                  {subscriptionDisplay.tier === 'free' && (
                    <>
                      <div>
                        <h4 className="font-medium text-foreground mb-3">{t('settings.upgradeToPremium')}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <Crown className="h-4 w-4 text-purple-500" />
                              <h5 className="font-medium">{t('settings.unlimitedAiConsultations')}</h5>
                            </div>
                            <p className="text-sm text-muted-foreground">{t('settings.unlimitedAiConsultationsDesc')}</p>
                          </div>
                          
                          <div className="p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <CreditCard className="h-4 w-4 text-green-500" />
                              <h5 className="font-medium">{t('settings.advancedAnalytics')}</h5>
                            </div>
                            <p className="text-sm text-muted-foreground">{t('settings.advancedAnalyticsDesc')}</p>
                          </div>
                          
                          <div className="p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <Bell className="h-4 w-4 text-blue-500" />
                              <h5 className="font-medium">{t('settings.prioritySupport')}</h5>
                            </div>
                            <p className="text-sm text-muted-foreground">{t('settings.prioritySupportDesc')}</p>
                          </div>
                          
                          <div className="p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <Database className="h-4 w-4 text-orange-500" />
                              <h5 className="font-medium">{t('settings.cloudStorage')}</h5>
                            </div>
                            <p className="text-sm text-muted-foreground">{t('settings.cloudStorageDesc')}</p>
                          </div>
                        </div>
                      </div>

                      {/* Upgrade Button */}
                      <div className="text-center pt-4">
                        <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                          <Crown className="h-4 w-4 mr-2" />
                          {t('settings.upgradeToPremiumButton')}
                        </Button>
                        <p className="text-sm text-muted-foreground mt-2">
                          {t('settings.cancelAnytime')}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Data & Export */}
            {activeSection === 'data' && (
              <div className="card p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <Database className="h-6 w-6 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">{t('settings.dataExport')}</h2>
                </div>

                <div className="space-y-4">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="font-medium text-foreground mb-2">Экспорт данных</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Скачайте все ваши данные в формате JSON для резервного копирования или переноса.
                    </p>
                    <Button variant="outline">
                      <Database className="h-4 w-4 mr-2" />
                      Экспортировать данные
                    </Button>
                  </div>

                  <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                    <h3 className="font-medium text-red-900 mb-2">Удаление аккаунта</h3>
                    <p className="text-sm text-red-700 mb-4">
                      Безвозвратно удалить ваш аккаунт и все связанные данные. Это действие нельзя отменить.
                    </p>
                    <Button variant="destructive">
                      Удалить аккаунт
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}