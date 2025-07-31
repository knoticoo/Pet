'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Heart, Home, Calendar, DollarSign, FileText, Settings, Bell, Shield, LogOut, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFeatures } from '@/hooks/useFeatures'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'

// Base navigation items that are always available
const baseNavigation = [
  { name: 'Dashboard', href: '/', icon: Home, feature: 'dashboard' },
  { name: 'My Pets', href: '/pets', icon: Heart, feature: 'pets' },
]

// Feature-dependent navigation items
const featureNavigation = [
  { name: 'Appointments', href: '/appointments', icon: Calendar, feature: 'appointments' },
  { name: 'Expenses', href: '/expenses', icon: DollarSign, feature: 'expenses' },
  { name: 'Documents', href: '/documents', icon: FileText, feature: 'documents' },
  { name: 'Reminders', href: '/reminders', icon: Bell, feature: 'reminders' },
]

// Admin and settings (always available)
const systemNavigation = [
  { name: 'Settings', href: '/settings', icon: Settings, feature: 'settings' },
  { name: 'Admin', href: '/admin', icon: Shield, feature: 'admin', adminOnly: true },
]

export function Navigation() {
  const pathname = usePathname()
  const { enabledFeatures, isAdmin, isAuthenticated, user } = useFeatures()

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
              <span className="text-xl font-bold text-foreground">PetCare</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/signin">
                <Button variant="outline" size="sm">
                  Sign In
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
            <span className="text-xl font-bold text-foreground">PetCare</span>
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
                  Admin
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
              <span className="hidden md:inline">Sign Out</span>
            </Button>
          </div>
          
          {/* Mobile menu button - simplified for now */}
          <div className="md:hidden">
            <div className="flex flex-col space-y-1">
              {visibleNavigation.slice(0, 4).map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center space-x-2 px-2 py-1 rounded text-xs',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <item.icon className="h-3 w-3" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}