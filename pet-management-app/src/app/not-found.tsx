'use client'

import Link from 'next/link'
import { Heart, Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { t } from '@/lib/translations'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-2">
            <Heart className="h-12 w-12 text-primary" />
            <span className="text-2xl font-bold text-foreground">ПетКеа</span>
          </div>
        </div>

        {/* 404 Error */}
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-foreground mb-4">Страница не найдена</h2>
          <p className="text-muted-foreground mb-8">
            Упс! Похоже, эта страница убежала, как любопытный питомец. 
            Не волнуйтесь, мы поможем вам найти дорогу домой.
          </p>
        </div>

        {/* Pet illustration placeholder */}
        <div className="mb-8">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-pink-200 to-purple-200 rounded-full flex items-center justify-center">
            <span className="text-4xl">🐕</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-4">
          <Link href="/" className="block">
            <Button className="w-full">
              <Home className="h-4 w-4 mr-2" />
              На главную
            </Button>
          </Link>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
        </div>

        {/* Help text */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Нужна помощь?</strong> Если вы считаете, что эта страница должна существовать, проверьте URL или 
            обратитесь в поддержку. Ваши питомцы ждут вас на панели управления!
          </p>
        </div>

        {/* Quick links */}
        <div className="mt-6">
          <p className="text-sm text-muted-foreground mb-3">Быстрые ссылки:</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/pets" className="text-primary hover:text-primary/80">
              {t('navigation.myPets')}
            </Link>
            <Link href="/appointments" className="text-primary hover:text-primary/80">
              {t('navigation.appointments')}
            </Link>
            <Link href="/expenses" className="text-primary hover:text-primary/80">
              {t('navigation.expenses')}
            </Link>
            <Link href="/reminders" className="text-primary hover:text-primary/80">
              {t('navigation.reminders')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}