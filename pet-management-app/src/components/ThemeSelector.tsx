'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Palette, Dog, Cat, Bird, Fish, Rabbit, Zap } from 'lucide-react'
import { useTheme, themes } from '@/lib/theme-provider'

const themeIcons = {
  dogs: Dog,
  cats: Cat,
  birds: Bird,
  fish: Fish,
  rabbits: Rabbit,
  hamsters: Zap, // Using Zap as a replacement for Hamster
  reptiles: Zap,
  default: Palette
}

export function ThemeSelector() {
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme as any)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <Palette className="h-4 w-4" />
        <span>Тема</span>
      </Button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 bg-card border rounded-lg shadow-lg p-2 z-50 min-w-[200px]">
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(themes).map(([themeKey, themeConfig]) => {
              const Icon = themeIcons[themeKey as keyof typeof themeIcons]
              const isActive = theme === themeKey
              
              return (
                <button
                  key={themeKey}
                  onClick={() => handleThemeChange(themeKey)}
                  className={`flex items-center gap-2 p-2 rounded-md text-sm transition-colors ${
                    isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-accent text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{themeConfig.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}