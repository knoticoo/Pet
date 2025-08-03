'use client'

import { useState } from 'react'
import { Heart, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AuthGuard } from '@/components/AuthGuard'
import { useRouter } from 'next/navigation'
import { t } from '@/lib/translations'

export default function NewPetPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    
    const formData = new FormData(e.currentTarget)
    const petData = {
      name: formData.get('name'),
      species: formData.get('species'),
      breed: formData.get('breed'),
      age: formData.get('age'),
      weight: formData.get('weight'),
      color: formData.get('color'),
      notes: formData.get('notes'),
    }
    
    try {
      const response = await fetch('/api/pets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(petData),
      })

      if (response.ok) {
        // Successfully created pet, redirect to pets page
        router.push('/pets')
      } else {
        const errorData = await response.json()
        console.error('Error creating pet:', errorData)
        setError(errorData.error || 'Failed to create pet. Please try again.')
      }
    } catch (error) {
      console.error('Error creating pet:', error)
      setError('Failed to create pet. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthGuard>
      <div className="space-y-8 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/pets">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common.back')} к питомцам
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t('pets.addNew')}</h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              Введите информацию о вашем питомце, чтобы начать отслеживать уход за ним.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="card p-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                  {t('pets.name')} *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                  placeholder="Введите имя питомца"
                />
              </div>

              <div>
                <label htmlFor="species" className="block text-sm font-medium text-foreground mb-2">
                  {t('pets.species')} *
                </label>
                <select
                  id="species"
                  name="species"
                  required
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                >
                  <option value="">Выберите вид</option>
                  <option value="dog">{t('pets.dog')}</option>
                  <option value="cat">{t('pets.cat')}</option>
                  <option value="bird">{t('pets.bird')}</option>
                  <option value="rabbit">{t('pets.rabbit')}</option>
                  <option value="hamster">{t('pets.hamster')}</option>
                  <option value="fish">{t('pets.fish')}</option>
                  <option value="reptile">{t('pets.reptile')}</option>
                  <option value="other">{t('pets.other')}</option>
                </select>
              </div>

              <div>
                <label htmlFor="breed" className="block text-sm font-medium text-foreground mb-2">
                  {t('pets.breed')}
                </label>
                <input
                  type="text"
                  id="breed"
                  name="breed"
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                  placeholder="Введите породу (необязательно)"
                />
              </div>

              <div>
                <label htmlFor="age" className="block text-sm font-medium text-foreground mb-2">
                  Возраст
                </label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  min="0"
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                  placeholder="Возраст в годах"
                />
              </div>

              <div>
                <label htmlFor="weight" className="block text-sm font-medium text-foreground mb-2">
                  Вес
                </label>
                <input
                  type="number"
                  id="weight"
                  name="weight"
                  step="0.1"
                  min="0"
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                  placeholder="Вес в кг"
                />
              </div>

              <div>
                <label htmlFor="color" className="block text-sm font-medium text-foreground mb-2">
                  Окрас/Отметины
                </label>
                <input
                  type="text"
                  id="color"
                  name="color"
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                  placeholder="Окрас и отметины"
                />
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-foreground mb-2">
                Дополнительные заметки
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                placeholder="Любая дополнительная информация о вашем питомце..."
              />
            </div>

            <div className="flex space-x-4 pt-6">
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                <Heart className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Добавляем...' : t('pets.addNew')}
              </Button>
              <Link href="/pets" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  {t('common.cancel')}
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </AuthGuard>
  )
}