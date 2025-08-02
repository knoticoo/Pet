'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

type PetTheme = 'dogs' | 'cats' | 'birds' | 'fish' | 'rabbits' | 'hamsters' | 'reptiles' | 'default'

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: PetTheme
  storageKey?: string
}

type ThemeProviderState = {
  theme: PetTheme
  setTheme: (theme: PetTheme) => void
  currentPage: string
  setCurrentPage: (page: string) => void
}

const initialState: ThemeProviderState = {
  theme: 'default',
  setTheme: () => null,
  currentPage: '/',
  setCurrentPage: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = 'default',
  storageKey = 'petcare-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<PetTheme>(defaultTheme)
  const [currentPage, setCurrentPageState] = useState<string>('/')
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Load theme from localStorage on mount
    const storedTheme = localStorage.getItem(storageKey) as PetTheme
    if (storedTheme) {
      setThemeState(storedTheme)
    } else {
      // Set default white theme if no stored theme
      setThemeState('default')
      localStorage.setItem(storageKey, 'default')
    }
    setIsLoaded(true)
  }, [storageKey])

  useEffect(() => {
    if (!isLoaded) return

    const root = window.document.documentElement
    
    // Remove all pet theme classes
    root.classList.remove('theme-dogs', 'theme-cats', 'theme-birds', 'theme-fish', 'theme-rabbits', 'theme-hamsters', 'theme-reptiles', 'theme-default')
    
    // Add current theme class
    root.classList.add(`theme-${theme}`)
    
    // Add page-specific classes
    root.classList.remove('page-dashboard', 'page-pets', 'page-appointments', 'page-expenses', 'page-documents', 'page-reminders', 'page-settings', 'page-admin')
    root.classList.add(`page-${currentPage.replace('/', '').split('/')[0] || 'dashboard'}`)
  }, [theme, currentPage, isLoaded])

  const setTheme = (newTheme: PetTheme) => {
    localStorage.setItem(storageKey, newTheme)
    setThemeState(newTheme)
  }

  const setCurrentPage = (page: string) => {
    setCurrentPageState(page)
  }

  const value = {
    theme,
    setTheme,
    currentPage,
    setCurrentPage,
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

// Pet theme configurations
export const themes = {
  dogs: {
    name: 'Собаки',
    description: 'Тема для любителей собак',
    colors: {
      primary: '#8B4513', // Saddle Brown
      secondary: '#DEB887', // Burlywood
      accent: '#F4A460', // Sandy Brown
      background: '#FFF8DC', // Cornsilk
      card: '#FAF0E6', // Linen
      text: '#2F2F2F',
      muted: '#8B7355'
    }
  },
  cats: {
    name: 'Кошки',
    description: 'Тема для любителей кошек',
    colors: {
      primary: '#9370DB', // Medium Purple
      secondary: '#DDA0DD', // Plum
      accent: '#E6E6FA', // Lavender
      background: '#F8F8FF', // Ghost White
      card: '#F0F8FF', // Alice Blue
      text: '#2F2F2F',
      muted: '#8A7C8A'
    }
  },
  birds: {
    name: 'Птицы',
    description: 'Тема для любителей птиц',
    colors: {
      primary: '#32CD32', // Lime Green
      secondary: '#90EE90', // Light Green
      accent: '#98FB98', // Pale Green
      background: '#F0FFF0', // Honeydew
      card: '#F5FFFA', // Mint Cream
      text: '#2F2F2F',
      muted: '#6B8E6B'
    }
  },
  fish: {
    name: 'Рыбки',
    description: 'Тема для любителей рыб',
    colors: {
      primary: '#4169E1', // Royal Blue
      secondary: '#87CEEB', // Sky Blue
      accent: '#B0E0E6', // Powder Blue
      background: '#F0F8FF', // Alice Blue
      card: '#F5F5F5', // White Smoke
      text: '#2F2F2F',
      muted: '#6B7B8B'
    }
  },
  rabbits: {
    name: 'Кролики',
    description: 'Тема для любителей кроликов',
    colors: {
      primary: '#FFB6C1', // Light Pink
      secondary: '#FFC0CB', // Pink
      accent: '#FFE4E1', // Misty Rose
      background: '#FFF0F5', // Lavender Blush
      card: '#FFF5EE', // Seashell
      text: '#2F2F2F',
      muted: '#B8868B'
    }
  },
  hamsters: {
    name: 'Хомяки',
    description: 'Тема для любителей хомяков',
    colors: {
      primary: '#D2691E', // Chocolate
      secondary: '#F4A460', // Sandy Brown
      accent: '#DEB887', // Burlywood
      background: '#FFF8DC', // Cornsilk
      card: '#FAF0E6', // Linen
      text: '#2F2F2F',
      muted: '#A0522D'
    }
  },
  reptiles: {
    name: 'Рептилии',
    description: 'Тема для любителей рептилий',
    colors: {
      primary: '#228B22', // Forest Green
      secondary: '#90EE90', // Light Green
      accent: '#98FB98', // Pale Green
      background: '#F0FFF0', // Honeydew
      card: '#F5FFFA', // Mint Cream
      text: '#2F2F2F',
      muted: '#556B55'
    }
  },
  default: {
    name: 'Классическая',
    description: 'Стандартная тема',
    colors: {
      primary: '#3B82F6',
      secondary: '#60A5FA',
      accent: '#93C5FD',
      background: '#FFFFFF',
      card: '#F9FAFB',
      text: '#1F2937',
      muted: '#6B7280'
    }
  }
} as const