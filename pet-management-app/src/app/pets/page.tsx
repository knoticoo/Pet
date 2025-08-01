'use client'

import { Heart, Plus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AuthGuard } from '@/components/AuthGuard'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { t } from '@/lib/translations'

interface Pet {
  id: string
  name: string
  species: string
  breed: string
  birthDate: string
  description?: string
}

export default function PetsPage() {
  const { data: session } = useSession()
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.id) {
      fetchPets()
    }
  }, [session])

  // Also refresh when the page becomes visible (e.g., returning from add pet page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && session?.user?.id) {
        fetchPets()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [session])

  // Refresh when window gains focus
  useEffect(() => {
    const handleFocus = () => {
      if (session?.user?.id) {
        fetchPets()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [session])

  const fetchPets = async () => {
    try {
      const response = await fetch('/api/pets')
      if (response.ok) {
        const data = await response.json()
        setPets(data)
      }
    } catch (error) {
      console.error('Error fetching pets:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    const age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return Math.max(0, age - 1)
    }
    return age
  }

  const getGradientColor = (species: string) => {
    switch (species.toLowerCase()) {
      case 'dog':
        return 'from-blue-400 to-blue-600'
      case 'cat':
        return 'from-purple-400 to-purple-600'
      case 'bird':
        return 'from-green-400 to-green-600'
      case 'fish':
        return 'from-cyan-400 to-cyan-600'
      default:
        return 'from-pink-400 to-pink-600'
    }
  }

  return (
    <AuthGuard>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t('pets.title')}</h1>
            <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
              {t('pets.description') || 'Управляйте и отслеживайте всех ваших любимых питомцев.'}
            </p>
          </div>
          <Link href="/pets/new">
            <Button className="flex items-center space-x-2 w-full md:w-auto">
              <Plus className="h-4 w-4" />
              <span>{t('pets.addNew')}</span>
            </Button>
          </Link>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">{t('common.loading')}</p>
          </div>
        )}

        {/* Pets Grid */}
        {!loading && pets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pets.map((pet) => (
              <div key={pet.id} className="pet-card cursor-pointer hover:shadow-md transition-shadow">
                <Link href={`/pets/${pet.id}`}>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className={`w-16 h-16 bg-gradient-to-br ${getGradientColor(pet.species)} rounded-full flex items-center justify-center`}>
                      <Heart className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{pet.name}</h3>
                      <p className="text-muted-foreground text-sm">
                        {pet.breed} • {calculateAge(pet.birthDate)} {t('common.years') || 'лет'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>{t('pets.species')}: {pet.species}</p>
                    {pet.description && <p>{pet.description}</p>}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Empty state if no pets */}
        {!loading && pets.length === 0 && (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">{t('pets.noPets')}</h3>
            <p className="text-muted-foreground mb-6">
              {t('pets.addFirstPet')}
            </p>
            <Link href="/pets/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('pets.addFirstPet')}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </AuthGuard>
  )
}