'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Heart, Home, Calendar, DollarSign, Settings, Bell, Shield, LogOut, User, Menu, X, Brain, Camera, ChevronDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFeatures } from '@/hooks/useFeatures'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { useState, useCallback, memo, useMemo, useEffect } from 'react'
import { t } from '@/lib/translations'
import { ThemeSelector } from '@/components/ThemeSelector'
import { Badge } from '@/components/ui/badge'
import { Logo } from './Logo'

// Memoized navigation item component with improved styling
const NavigationItem = memo(({ item, pathname, onClick }: {
  item: { name: string; href: string; icon: React.ComponentType<{ className?: string }>; feature: string; badge?: string }
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
        'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 relative overflow-hidden',
        isActive
          ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-sm'
      )}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg" />
      )}
      
      <div className="relative z-10 flex items-center gap-3 w-full">
        <Icon className={cn(
          "h-4 w-4 transition-transform duration-200",
          isActive ? "scale-110" : "group-hover:scale-105"
        )} />
        <span className="flex-1">{item.name}</span>
        {item.badge && (
          <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
            {item.badge}
          </Badge>
        )}
      </div>
    </Link>
  )
})

NavigationItem.displayName = 'NavigationItem'

// Memoized mobile menu button with improved animation
const MobileMenuButton = memo(({ isOpen, onClick }: {
  isOpen: boolean
  onClick: () => void
}) => (
  <Button
    variant="ghost"
    size="sm"
    className="md:hidden relative p-2 hover:bg-accent transition-all duration-200"
    onClick={onClick}
    aria-label={isOpen ? 'Закрыть меню' : 'Открыть меню'}
  >
    <div className="relative w-5 h-5">
      <span className={cn(
        "absolute inset-0 transform transition-all duration-200",
        isOpen ? "rotate-45 translate-y-0" : "-translate-y-1"
      )}>
        <Menu className="h-5 w-5" />
      </span>
      <span className={cn(
        "absolute inset-0 transform transition-all duration-200",
        isOpen ? "opacity-0" : "opacity-100"
      )}>
        <X className="h-5 w-5" />
      </span>
    </div>
  </Button>
))

MobileMenuButton.displayName = 'MobileMenuButton'

// Memoized user menu with improved design
const UserMenu = memo(({ user, onSignOut }: {
  user: { name?: string; email?: string; avatar?: string } | null
  onSignOut: () => void
}) => (
  <div className="border-t border-border/50 pt-4 mt-4">
    <div className="flex items-center gap-3 px-3 py-3 mb-3 bg-accent/50 rounded-lg">
      <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/40 rounded-full flex items-center justify-center ring-2 ring-primary/20">
        {user?.avatar ? (
          <Image
            src={user.avatar}
            alt={user.name || 'User'}
            width={40}
            height={40}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <User className="h-5 w-5 text-primary" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate text-foreground">{user?.name || 'Пользователь'}</p>
        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
      </div>
    </div>
    <Button
      variant="ghost"
      size="sm"
      onClick={onSignOut}
      className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
    >
      <LogOut className="h-4 w-4" />
      {t('auth.signOut')}
    </Button>
  </div>
))

UserMenu.displayName = 'UserMenu'

// Search component
const SearchBar = memo(() => {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div className="relative hidden lg:block">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2 text-muted-foreground hover:text-foreground"
      >
        <Search className="h-4 w-4" />
        <span className="hidden xl:inline">Поиск...</span>
      </Button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-card border rounded-lg shadow-lg z-50">
          <input
            type="text"
            placeholder="Поиск питомцев, записей..."
            className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            autoFocus
            onBlur={() => setIsOpen(false)}
          />
        </div>
      )}
    </div>
  )
})

SearchBar.displayName = 'SearchBar'

export const Navigation = memo(() => {
  const pathname = usePathname() || ''
  const { enabledFeatures, isAdmin, isAuthenticated, user } = useFeatures()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Memoize navigation items to prevent recreation on every render
  const navigationItems = useMemo(() => {
    // Base navigation items that are always available
    const baseNavigation = [
      { name: t('navigation.dashboard'), href: '/', icon: Home, feature: 'dashboard' },
      { name: t('navigation.myPets'), href: '/pets', icon: Heart, feature: 'pets', badge: 'Новое' },
    ]

    // Feature-dependent navigation items
    const featureNavigation = [
      { name: t('navigation.appointments'), href: '/appointments', icon: Calendar, feature: 'appointments' },
      { name: t('navigation.expenses'), href: '/expenses', icon: DollarSign, feature: 'expenses' },
      { name: t('navigation.reminders'), href: '/reminders', icon: Bell, feature: 'reminders' },
      { name: t('navigation.aiVet'), href: '/ai-vet', icon: Brain, feature: 'ai-vet', badge: 'ИИ' },
    ]

    // Core features that should always be visible
    const coreNavigation = [
      { name: t('navigation.social'), href: '/social', icon: Camera, feature: 'social-profile' },
    ]

    // Admin and settings (always available)
    const systemNavigation = [
      { name: t('navigation.settings'), href: '/settings', icon: Settings, feature: 'settings' },
      { name: t('navigation.admin'), href: '/admin', icon: Shield, feature: 'admin', adminOnly: true },
    ]

    // Build navigation based on enabled features
    const navigation = [...baseNavigation]
    
    // Add core navigation items (always visible)
    coreNavigation.forEach(item => {
      navigation.push(item)
    })
    
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
      if (typeof window !== 'undefined') {
        await signOut({ 
          callbackUrl: `${window.location.origin}/auth/signin`,
          redirect: true 
        })
      } else {
        await signOut({ redirect: true })
      }
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }, [])

  if (!isAuthenticated) {
    return null
  }

  return (
    <nav className={cn(
      "sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-200",
      isScrolled && "shadow-sm"
    )}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="group hover:opacity-80 transition-opacity duration-200">
            <Logo size="md" animated={true} />
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

          {/* Right side controls */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <SearchBar />
            
            {/* Theme Selector */}
            <div className="hidden md:block">
              <ThemeSelector />
            </div>
            
            {/* Desktop User Menu */}
            <div className="hidden md:flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/50 hover:bg-accent/70 transition-all duration-200">
                <div className="w-6 h-6 bg-gradient-to-br from-primary/20 to-primary/40 rounded-full flex items-center justify-center">
                  <User className="h-3 w-3 text-primary" />
                </div>
                <span className="text-sm font-medium">{user?.name || 'Пользователь'}</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
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
          <div className="md:hidden border-t border-border/50 py-4 slide-in-from-top">
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
            <UserMenu 
              user={user ? { 
                name: user.name || undefined, 
                email: user.email || undefined,
                avatar: user.image || undefined
              } : null} 
              onSignOut={handleSignOut} 
            />
            
            {/* Mobile Theme Selector */}
            <div className="md:hidden mt-4 px-3">
              <ThemeSelector />
            </div>
          </div>
        )}
      </div>
    </nav>
  )
})

Navigation.displayName = 'Navigation'