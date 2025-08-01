'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Heart, Home, Calendar, DollarSign, FileText, Settings, Bell, Shield, LogOut, User, Menu, X, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFeatures } from '@/hooks/useFeatures'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { useState, useCallback, memo, useMemo } from 'react'
import { t } from '@/lib/translations'
import { ThemeSelector } from '@/components/ThemeSelector'

// Memoized navigation item component
const NavigationItem = memo(({ item, pathname, onClick }: {
  item: { name: string; href: string; icon: any; feature: string }
  pathname: string
  onClick?: () => void
}) => {
  const isActive = pathname === item.href
  const Icon = item.icon
  
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}
    >
      <Icon className="h-4 w-4" />
      {item.name}
    </Link>
  )
})

NavigationItem.displayName = 'NavigationItem'

// Memoized mobile menu button
const MobileMenuButton = memo(({ isOpen, onClick }: {
  isOpen: boolean
  onClick: () => void
}) => (
  <Button
    variant="ghost"
    size="sm"
    className="md:hidden"
    onClick={onClick}
    aria-label={isOpen ? 'Close menu' : 'Open menu'}
  >
    {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
  </Button>
))

MobileMenuButton.displayName = 'MobileMenuButton'

// Memoized user menu
const UserMenu = memo(({ user, onSignOut }: {
  user: any
  onSignOut: () => void
}) => (
  <div className="border-t pt-4 mt-4">
    <div className="flex items-center gap-3 px-3 py-2 mb-2">
      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
        <User className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{user?.name}</p>
        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
      </div>
    </div>
    <Button
      variant="ghost"
      size="sm"
      onClick={onSignOut}
      className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
    >
      <LogOut className="h-4 w-4" />
      {t('auth.signOut')}
    </Button>
  </div>
))

UserMenu.displayName = 'UserMenu'

export const Navigation = memo(() => {
  const pathname = usePathname()
  const { enabledFeatures, isAdmin, isAuthenticated, user } = useFeatures()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Memoize navigation items to prevent recreation on every render
  const navigationItems = useMemo(() => {
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
  }, [enabledFeatures, isAdmin])

  // Memoized callbacks to prevent unnecessary re-renders
  const handleMobileMenuToggle = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev)
  }, [])

  const handleMobileMenuClose = useCallback(() => {
    setIsMobileMenuOpen(false)
  }, [])

  const handleSignOut = useCallback(async () => {
    try {
      await signOut({ 
        callbackUrl: `${window.location.origin}/auth/signin`,
        redirect: true 
      })
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }, [])

  if (!isAuthenticated) {
    return null
  }

  return (
    <nav className="bg-card border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">ПетКеа</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navigationItems.map((item) => (
              <NavigationItem
                key={item.href}
                item={item}
                pathname={pathname}
              />
            ))}
          </div>

          {/* User Menu & Mobile Toggle */}
          <div className="flex items-center gap-2">
            {/* Theme Selector */}
            <div className="hidden md:block">
              <ThemeSelector />
            </div>
            
            {/* Desktop User Menu */}
            <div className="hidden md:flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/50">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="h-3 w-3 text-primary" />
                </div>
                <span className="text-sm font-medium">{user?.name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <MobileMenuButton
              isOpen={isMobileMenuOpen}
              onClick={handleMobileMenuToggle}
            />
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t py-4">
            <div className="space-y-1">
              {navigationItems.map((item) => (
                <NavigationItem
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  onClick={handleMobileMenuClose}
                />
              ))}
            </div>
            
            {/* Mobile User Menu */}
            <UserMenu user={user} onSignOut={handleSignOut} />
          </div>
        )}
      </div>
    </nav>
  )
})

Navigation.displayName = 'Navigation'