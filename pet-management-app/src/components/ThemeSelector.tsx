'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Palette, Dog, Cat, Bird, Fish, Rabbit, Zap, Sparkles, Check, ChevronDown, Settings } from 'lucide-react'
import { useTheme, themes } from '@/lib/theme-provider'
import { cn } from '@/lib/utils'

const themeIcons = {
  dogs: Dog,
  cats: Cat,
  birds: Bird,
  fish: Fish,
  rabbits: Rabbit,
  hamsters: Zap,
  reptiles: Zap,
  default: Palette
}

const themeColors = {
  dogs: 'from-orange-500 to-amber-600',
  cats: 'from-purple-500 to-pink-600',
  birds: 'from-green-500 to-emerald-600',
  fish: 'from-blue-500 to-cyan-600',
  rabbits: 'from-pink-500 to-rose-600',
  hamsters: 'from-yellow-500 to-orange-600',
  reptiles: 'from-green-600 to-teal-700',
  default: 'from-primary to-purple-600'
}

export function ThemeSelector() {
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleThemeChange = async (newTheme: string) => {
    setIsAnimating(true)
    setTheme(newTheme as 'default' | 'dogs' | 'cats' | 'birds' | 'fish' | 'rabbits' | 'hamsters' | 'reptiles')
    
    // Add animation delay
    setTimeout(() => {
      setIsAnimating(false)
      setIsOpen(false)
    }, 300)
  }

  const currentTheme = themes[theme as keyof typeof themes]
  const currentIcon = themeIcons[theme as keyof typeof themeIcons]
  const currentColor = themeColors[theme as keyof typeof themeColors]

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Main Theme Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative group flex items-center gap-3 px-4 py-2 rounded-2xl hover:bg-white/10 backdrop-blur-sm border border-transparent hover:border-white/20 transition-all duration-300"
      >
        {/* Animated Background */}
        <div className={cn(
          "absolute inset-0 rounded-2xl transition-all duration-500",
          isOpen 
            ? "bg-gradient-to-r from-white/20 to-white/10" 
            : "group-hover:bg-gradient-to-r group-hover:from-white/5 group-hover:to-transparent"
        )} />
        
        <div className="relative z-10 flex items-center gap-3">
          {/* Theme Icon with Animation */}
          <div className={cn(
            "relative p-2 rounded-xl transition-all duration-300",
            isAnimating 
              ? "bg-gradient-to-br from-yellow-400 to-orange-500 scale-110 rotate-12" 
              : `bg-gradient-to-br ${currentColor}`
          )}>
            <currentIcon className="h-4 w-4 text-white transition-all duration-300" />
            {isAnimating && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-ping" />
            )}
          </div>
          
          <div className="flex flex-col items-start">
            <span className="text-sm font-semibold text-foreground">Тема</span>
            <span className="text-xs text-muted-foreground">{currentTheme?.name}</span>
          </div>
          
          <ChevronDown className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-300",
            isOpen && "rotate-180"
          )} />
        </div>
      </Button>

      {/* Advanced Dropdown */}
      {isOpen && (
        <div className="absolute top-full mt-3 right-0 z-50 animate-fade-in-up">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 shadow-2xl p-6 min-w-[280px]">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5" />
            
            {/* Header */}
            <div className="relative mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center">
                  <Settings className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  Выберите тему
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Персонализируйте интерфейс под ваших питомцев
              </p>
            </div>

            {/* Theme Grid */}
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(themes).map(([themeKey, themeConfig]) => {
                const Icon = themeIcons[themeKey as keyof typeof themeIcons]
                const color = themeColors[themeKey as keyof typeof themeColors]
                const isActive = theme === themeKey
                
                return (
                  <button
                    key={themeKey}
                    onClick={() => handleThemeChange(themeKey)}
                    className={cn(
                      "group relative overflow-hidden rounded-2xl p-4 transition-all duration-500 hover:scale-105",
                      isActive 
                        ? "bg-gradient-to-br from-white/20 to-white/10 border border-white/30 shadow-lg" 
                        : "bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/20"
                    )}
                  >
                    {/* Animated Background */}
                    <div className={cn(
                      "absolute inset-0 transition-all duration-500",
                      isActive 
                        ? "bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10" 
                        : "group-hover:bg-gradient-to-br group-hover:from-white/5 group-hover:to-transparent"
                    )} />
                    
                    <div className="relative flex flex-col items-center gap-3">
                      {/* Icon Container */}
                      <div className={cn(
                        "relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                        isActive 
                          ? `bg-gradient-to-br ${color} shadow-lg shadow-primary/25 scale-110` 
                          : `bg-gradient-to-br ${color} group-hover:scale-105`
                      )}>
                        <Icon className="h-6 w-6 text-white transition-all duration-300" />
                        {isActive && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-ping" />
                        )}
                        {isActive && (
                          <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-gradient-to-br from-green-400 to-green-600 rounded-full">
                            <Check className="h-2 w-2 text-white" />
                          </div>
                        )}
                      </div>
                      
                      {/* Theme Info */}
                      <div className="text-center">
                        <h4 className={cn(
                          "text-sm font-semibold transition-all duration-300",
                          isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                        )}>
                          {themeConfig.name}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {themeConfig.description || 'Классическая тема'}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-white/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-muted-foreground">Автосохранение</span>
                </div>
                <Sparkles className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}