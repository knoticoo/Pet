'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Heart, Home, Calendar, DollarSign, Settings, Bell, Shield, LogOut, User, Menu, X, Brain, Camera, ChevronDown, Search, Sparkles, Activity, Zap, Star, Plus, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFeatures } from '@/hooks/useFeatures'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { useState, useCallback, memo, useMemo, useEffect, useRef } from 'react'
import { t } from '@/lib/translations'
import { ThemeSelector } from '@/components/ThemeSelector'
import { Badge } from '@/components/ui/badge'
import { Logo } from './Logo'

// Advanced Navigation Item with 2025 Design
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
        'group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-500 hover:scale-105',
        isActive
          ? 'bg-gradient-to-r from-primary/20 to-purple-500/20 text-primary border border-primary/30 shadow-lg shadow-primary/25 backdrop-blur-sm'
          : 'text-muted-foreground hover:bg-white/10 hover:text-foreground hover:shadow-lg backdrop-blur-sm border border-transparent hover:border-white/20'
      )}
    >
      {/* Animated background */}
      <div className={cn(
        "absolute inset-0 rounded-2xl transition-all duration-500",
        isActive 
          ? "bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 animate-pulse" 
          : "group-hover:bg-gradient-to-r group-hover:from-white/5 group-hover:to-transparent"
      )} />
      
      {/* Glow effect for active items */}
      {isActive && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/20 to-purple-500/20 animate-pulse" />
      )}
      
      <div className="relative z-10 flex items-center gap-3 w-full">
        <div className={cn(
          "relative p-2 rounded-xl transition-all duration-300",
          isActive 
            ? "bg-gradient-to-br from-primary to-purple-600 shadow-lg shadow-primary/25" 
            : "group-hover:bg-gradient-to-br group-hover:from-primary/20 group-hover:to-purple-500/20"
        )}>
          <Icon className={cn(
            "h-4 w-4 transition-all duration-300",
            isActive ? "text-white scale-110" : "text-muted-foreground group-hover:text-primary group-hover:scale-105"
          )} />
          {isActive && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-ping" />
          )}
        </div>
        <span className="flex-1 font-medium">{item.name}</span>
        {item.badge && (
          <Badge className={cn(
            "text-xs px-2 py-1 font-medium transition-all duration-300",
            isActive 
              ? "bg-white/20 text-white border-white/30" 
              : "bg-primary/10 text-primary border-primary/20 group-hover:bg-primary/20"
          )}>
            {item.badge}
          </Badge>
        )}
      </div>
    </Link>
  )
})

NavigationItem.displayName = 'NavigationItem'

// Advanced Mobile Menu Button with Morphing Animation
const MobileMenuButton = memo(({ isOpen, onClick }: {
  isOpen: boolean
  onClick: () => void
}) => (
  <Button
    variant="ghost"
    size="sm"
    className="md:hidden relative p-3 rounded-2xl hover:bg-white/10 backdrop-blur-sm border border-white/20 transition-all duration-300 hover:shadow-lg"
    onClick={onClick}
    aria-label={isOpen ? 'Закрыть меню' : 'Открыть меню'}
  >
    <div className="relative w-6 h-6">
      <div className={cn(
        "absolute inset-0 transform transition-all duration-300 ease-out",
        isOpen ? "rotate-45" : "rotate-0"
      )}>
        <div className={cn(
          "absolute top-1/2 left-1/2 w-5 h-0.5 bg-foreground transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300",
          isOpen ? "rotate-90" : "rotate-0"
        )} />
        <div className={cn(
          "absolute top-1/2 left-1/2 w-5 h-0.5 bg-foreground transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300",
          isOpen ? "opacity-0" : "opacity-100"
        )} />
      </div>
    </div>
  </Button>
))

MobileMenuButton.displayName = 'MobileMenuButton'

// Advanced User Menu with Glassmorphism
const UserMenu = memo(({ user, onSignOut }: {
  user: { name?: string; email?: string; avatar?: string } | null
  onSignOut: () => void
}) => (
  <div className="border-t border-white/20 pt-6 mt-6">
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-4 mb-4 hover:shadow-xl transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 opacity-0 hover:opacity-100 transition-opacity duration-300" />
      <div className="relative flex items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-2xl flex items-center justify-center ring-2 ring-primary/30 shadow-lg">
            {user?.avatar ? (
              <Image
                src={user.avatar}
                alt={user.name || 'User'}
                width={48}
                height={48}
                className="w-full h-full rounded-xl object-cover"
              />
            ) : (
              <User className="h-6 w-6 text-primary" />
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-green-400 to-green-600 rounded-full border-2 border-white animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate text-foreground">{user?.name || 'Пользователь'}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          <div className="flex items-center gap-1 mt-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-green-500">Онлайн</span>
          </div>
        </div>
      </div>
    </div>
    <Button
      variant="ghost"
      size="sm"
      onClick={onSignOut}
      className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-2xl transition-all duration-300 backdrop-blur-sm"
    >
      <LogOut className="h-4 w-4" />
      {t('auth.signOut')}
    </Button>
  </div>
))

UserMenu.displayName = 'UserMenu'

// Advanced Search Component with Floating Design
const SearchBar = memo(() => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const searchRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  return (
    <div className="relative hidden lg:block" ref={searchRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-3 text-muted-foreground hover:text-foreground rounded-2xl hover:bg-white/10 backdrop-blur-sm border border-transparent hover:border-white/20 transition-all duration-300"
      >
        <div className="relative">
          <Search className="h-4 w-4" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse" />
        </div>
        <span className="hidden xl:inline">Поиск...</span>
      </Button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-3 p-4 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl z-50 animate-fade-in-up">
          <div className="relative">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Поиск питомцев, записей..."
              className="w-full px-4 py-3 text-sm bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300 placeholder:text-muted-foreground"
              autoFocus
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          
          {searchValue && (
            <div className="mt-3 space-y-2">
              <div className="p-2 rounded-lg hover:bg-white/10 transition-all duration-200 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-primary" />
                  <span className="text-sm">Питомцы</span>
                </div>
              </div>
              <div className="p-2 rounded-lg hover:bg-white/10 transition-all duration-200 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Записи</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
})

SearchBar.displayName = 'SearchBar'

// Advanced Stats Display
const StatsDisplay = memo(() => {
  const [stats, setStats] = useState({
    pets: 3,
    appointments: 2,
    expenses: 150,
    reminders: 5
  })

  return (
    <div className="hidden xl:flex items-center gap-4 px-4 py-2 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-xs text-muted-foreground">Активность</span>
      </div>
      <div className="flex items-center gap-1">
        <TrendingUp className="h-3 w-3 text-green-500" />
        <span className="text-xs text-green-500">+12%</span>
      </div>
    </div>
  )
})

StatsDisplay.displayName = 'StatsDisplay'

export const Navigation = memo(() => {
  const pathname = usePathname() || ''
  const { enabledFeatures, isAdmin, isAuthenticated, user } = useFeatures()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [showFloatingElements, setShowFloatingElements] = useState(true)

  // Handle scroll effect with advanced styling
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
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-8 left-8 z-50">
        <Button
          size="lg"
          className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 transition-all duration-300"
          onClick={() => setShowFloatingElements(!showFloatingElements)}
        >
          <Plus className="h-6 w-6" />
        </Button>
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-ping" />
      </div>

      {/* Advanced Navigation Bar */}
      <nav className={cn(
        "sticky top-0 z-40 w-full transition-all duration-500",
        isScrolled 
          ? "bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-2xl" 
          : "bg-transparent"
      )}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo with Advanced Animation */}
            <Link href="/" className="group hover:scale-105 transition-all duration-300">
              <div className="relative">
                <Logo size="lg" animated={true} />
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-bounce" />
              </div>
            </Link>

            {/* Desktop Navigation with Advanced Styling */}
            <div className="hidden md:flex items-center gap-2">
              {navigationItems.map((item) => (
                <NavigationItem
                  key={item.href}
                  item={item}
                  pathname={pathname}
                />
              ))}
            </div>

            {/* Right side controls with Advanced Design */}
            <div className="flex items-center gap-3">
              {/* Stats Display */}
              <StatsDisplay />
              
              {/* Search */}
              <SearchBar />
              
              {/* Theme Selector */}
              <div className="hidden md:block">
                <ThemeSelector />
              </div>
              
              {/* Desktop User Menu with Glassmorphism */}
              <div className="hidden md:flex items-center gap-3">
                <div className="relative group">
                  <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 hover:shadow-xl transition-all duration-300 cursor-pointer">
                    <div className="relative">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-xl flex items-center justify-center ring-2 ring-primary/30">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-gradient-to-br from-green-400 to-green-600 rounded-full border-2 border-white animate-pulse" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">{user?.name || 'Пользователь'}</span>
                      <span className="text-xs text-muted-foreground">Онлайн</span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors duration-300" />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="p-3 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-white/10 backdrop-blur-sm border border-transparent hover:border-white/20 transition-all duration-300"
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

          {/* Advanced Mobile Navigation with Glassmorphism */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-white/20 py-6 animate-fade-in-up">
              <div className="space-y-3">
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
              <div className="md:hidden mt-6 px-4">
                <ThemeSelector />
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  )
})

Navigation.displayName = 'Navigation'