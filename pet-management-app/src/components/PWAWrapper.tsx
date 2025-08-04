'use client'

import { useEffect, useState } from 'react'

interface PWAWrapperProps {
  children: React.ReactNode
}

export function PWAWrapper({ children }: PWAWrapperProps) {
  const [isPWA, setIsPWA] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if running as PWA
    const checkPWA = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
      const isInWebApp = window.navigator.standalone === true
      const isPWA = isStandaloneMode || isInWebApp
      
      setIsPWA(isPWA)
      setIsStandalone(isStandaloneMode)
      
      // Add PWA-specific classes to body
      if (isPWA) {
        document.body.classList.add('pwa-mode')
        document.documentElement.classList.add('pwa-mode')
      } else {
        document.body.classList.remove('pwa-mode')
        document.documentElement.classList.remove('pwa-mode')
      }
    }

    checkPWA()

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    const handleChange = () => checkPWA()
    
    mediaQuery.addEventListener('change', handleChange)
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  // Add safe area insets for PWA
  useEffect(() => {
    if (isPWA) {
      const style = document.createElement('style')
      style.textContent = `
        :root {
          --sat: env(safe-area-inset-top);
          --sab: env(safe-area-inset-bottom);
          --sal: env(safe-area-inset-left);
          --sar: env(safe-area-inset-right);
        }
        
        .pwa-mode {
          padding-top: var(--sat);
          padding-bottom: var(--sab);
          padding-left: var(--sal);
          padding-right: var(--sar);
        }
        
        .pwa-mode nav {
          padding-top: calc(var(--sat) + 0.5rem);
        }
        
        .pwa-mode .fixed {
          bottom: calc(2rem + var(--sab));
        }
      `
      document.head.appendChild(style)
      
      return () => {
        document.head.removeChild(style)
      }
    }
  }, [isPWA])

  return (
    <div className={`pwa-wrapper ${isPWA ? 'pwa-mode' : ''}`}>
      {children}
    </div>
  )
}