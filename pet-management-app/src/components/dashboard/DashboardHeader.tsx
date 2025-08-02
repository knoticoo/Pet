'use client'

import { Plus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { t } from '@/lib/translations'
import { useTheme, themes } from '@/lib/theme-provider'

interface DashboardHeaderProps {
  className?: string
}

export function DashboardHeader({ className }: DashboardHeaderProps) {
  const { theme } = useTheme()

  const getThemeIcon = () => {
    switch (theme) {
      case 'dogs':
        return '🐕'
      case 'cats':
        return '🐱'
      case 'birds':
        return '🐦'
      case 'fish':
        return '🐠'
      case 'rabbits':
        return '🐰'
      case 'hamsters':
        return '🐹'
      case 'reptiles':
        return '🦎'
      default:
        return '🐾'
    }
  }

  const getThemeColor = () => {
    const themeConfig = themes[theme]
    return themeConfig.colors.primary
  }

  return (
    <div className={`flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 ${className}`}>
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{getThemeIcon()}</span>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t('dashboard.title')}</h1>
        </div>
        <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
          {t('dashboard.welcome')}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Текущая тема: <span style={{ color: getThemeColor() }}>{themes[theme].name}</span>
        </p>
      </div>
      <Link href="/pets/new">
        <Button className="flex items-center space-x-2 w-full md:w-auto">
          <Plus className="h-4 w-4" />
          <span>{t('dashboard.addPet')}</span>
        </Button>
      </Link>
    </div>
  )
}