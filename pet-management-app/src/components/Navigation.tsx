'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Heart, Home, Calendar, DollarSign, FileText, Settings, Bell, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFeatures } from '@/hooks/useFeatures'

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
  const { enabledFeatures, isAdmin } = useFeatures()

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

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
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
          
          <div className="md:hidden">
            <button className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}