'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'blue' | 'green' | 'purple' | 'system'

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  actualTheme: 'light' | 'dark' // The resolved theme (system becomes light/dark)
}

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
  actualTheme: 'light',
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'petcare-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    // Load theme from localStorage
    const storedTheme = localStorage.getItem(storageKey) as Theme
    if (storedTheme) {
      setTheme(storedTheme)
    }
  }, [storageKey])

  useEffect(() => {
    const root = window.document.documentElement
    
    // Remove all theme classes
    root.classList.remove('light', 'dark', 'theme-blue', 'theme-green', 'theme-purple')
    
    let resolvedTheme: 'light' | 'dark' = 'light'
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      resolvedTheme = systemTheme
      root.classList.add(systemTheme)
    } else if (theme === 'light' || theme === 'dark') {
      resolvedTheme = theme
      root.classList.add(theme)
    } else {
      // Colored themes (blue, green, purple) - determine if they should be light or dark base
      const coloredThemeIsDark = ['blue', 'purple'].includes(theme)
      resolvedTheme = coloredThemeIsDark ? 'dark' : 'light'
      root.classList.add(resolvedTheme, `theme-${theme}`)
    }
    
    setActualTheme(resolvedTheme)
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
    actualTheme,
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')

  return context
}

// Theme configurations
export const themes = {
  light: {
    name: 'Светлая',
    description: 'Светлая тема для дневного использования'
  },
  dark: {
    name: 'Темная',
    description: 'Темная тема для ночного использования'
  },
  blue: {
    name: 'Синяя',
    description: 'Синяя цветовая схема'
  },
  green: {
    name: 'Зеленая',
    description: 'Зеленая цветовая схема'
  },
  purple: {
    name: 'Фиолетовая',
    description: 'Фиолетовая цветовая схема'
  },
  system: {
    name: 'Системная',
    description: 'Использовать системные настройки'
  }
} as const