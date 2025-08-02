'use client'

import { Plus, Calendar, DollarSign, Bell, Sparkles, Camera, Heart } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface QuickActionsProps {
  className?: string
}

export function QuickActions({ className }: QuickActionsProps) {
  const actions = [
    {
      href: '/pets/new',
      icon: Plus,
      label: 'Добавить питомца',
      color: 'text-blue-600',
      description: 'Зарегистрировать нового питомца'
    },
    {
      href: '/appointments/new',
      icon: Calendar,
      label: 'Записаться к врачу',
      color: 'text-green-600',
      description: 'Назначить визит к ветеринару'
    },
    {
      href: '/expenses/new',
      icon: DollarSign,
      label: 'Добавить расход',
      color: 'text-purple-600',
      description: 'Учесть новые расходы'
    },
    {
      href: '/reminders/new',
      icon: Bell,
      label: 'Создать напоминание',
      color: 'text-orange-600',
      description: 'Настроить напоминание'
    },
    {
      href: '/ai-vet',
      icon: Sparkles,
      label: 'AI Консультация',
      color: 'text-pink-600',
      description: 'Получить совет от AI ветеринара'
    },
    {
      href: '/social',
      icon: Camera,
      label: 'Социальная галерея',
      color: 'text-indigo-600',
      description: 'Поделиться фото питомца'
    }
  ]

  return (
    <div className={`card p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <Heart className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-semibold text-foreground">Быстрые действия</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Link key={action.href} href={action.href}>
              <Button 
                variant="outline" 
                className="w-full h-24 flex flex-col items-center justify-center space-y-2 hover:shadow-md transition-all group"
              >
                <Icon className={`h-6 w-6 ${action.color} group-hover:scale-110 transition-transform`} />
                <span className="text-xs font-medium text-center leading-tight">{action.label}</span>
              </Button>
            </Link>
          )
        })}
      </div>
    </div>
  )
}