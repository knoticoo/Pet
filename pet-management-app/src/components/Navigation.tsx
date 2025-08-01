'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Heart, Home, Calendar, DollarSign, FileText, Settings, Bell, Shield, LogOut, User, Menu, X, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFeatures } from '@/hooks/useFeatures'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { t } from '@/lib/translations'

export function Navigation() {
  const pathname = usePathname()
  const { enabledFeatures, isAdmin, isAuthenticated, user } = useFeatures()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Base navigation items that are always available
  const baseNavigation = [
    { name: t('navigation.dashboard'), href: '/', icon: Home, feature: 'dashboard' },
    { name: t('navigation.myPets'), href: '/pets', icon: Heart, feature: 'pets' },
  ]

  // Feature-dependent navigation items
  const featureNavigation = [
    { name: t('navigation.appointments'), href: '/appointments', icon: Calendar, feature: 'appointments' },
    { name: t('navigation.expenses'), href: '/expenses', icon: DollarSign, feature: 'expenses' },
    { name: t('navigation.documents'), href: '/documents', icon: FileText, feature: 'documents' },
    { name: t('navigation.reminders'), href: '/reminders', icon: Bell, feature: 'reminders' },
    { name: t('navigation.aiVet'), href: '/ai-vet', icon: Brain, feature: 'ai-vet' },
  ]

  // Admin and settings (always available)
  const systemNavigation = [
    { name: t('navigation.settings'), href: '/settings', icon: Settings, feature: 'settings' },
    { name: t('navigation.admin'), href: '/admin', icon: Shield, feature: 'admin', adminOnly: true },
  ]

  // Build navigation based on enabled features
  const getVisibleNavigation = () => {
    const navigation = [...baseNavigation]
    
    // Add feature-dependent items if enabled
    featureNavigation.forEach(item => {
      if (enabledFeatures.has(item.feature)) {
        navigation.push(item)
      }
    })
    
    // Add system navigation
    systemNavigation.forEach(item => {
      if (item.adminOnly && !isAdmin) return
      navigation.push(item)
    })
    
    return navigation
  }

  const visibleNavigation = getVisibleNavigation()

  if (!isAuthenticated) {
    return (
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">ПетКеа</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/signin">
                <Button variant="outline" size="sm">
                  {t('auth.signIn')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <Heart className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">ПетКеа</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            {visibleNavigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{user?.name || user?.email}</span>
              {isAdmin && (
                <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                  {t('navigation.admin')}
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut()}
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">{t('auth.signOut')}</span>
            </Button>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <div className="container mx-auto px-4 py-4 max-w-7xl">
              <div className="space-y-2">
                {visibleNavigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
                
                <div className="pt-4 mt-4 border-t">
                  <div className="flex items-center space-x-3 px-4 py-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>{user?.name || user?.email}</span>
                    {isAdmin && (
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                        {t('navigation.admin')}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      signOut()
                    }}
                    className="w-full justify-start mt-2 text-muted-foreground hover:text-foreground"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    {t('auth.signOut')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}