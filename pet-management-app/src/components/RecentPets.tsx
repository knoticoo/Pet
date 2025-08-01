'use client'

import { Heart, Plus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useSession } from 'next-auth/react'
import { useEffect, useState, useCallback, memo } from 'react'
import { t } from '@/lib/translations'

interface Pet {
  id: string
  name: string
  species: string
  breed: string
  birthDate: string
  description?: string
}

// Cache for pets data
const petsCache = new Map<string, { pets: Pet[], timestamp: number }>()
const CACHE_DURATION = 2 * 60 * 1000 // 2 minutes for pets data

const PetCard = memo(({ pet }: { pet: Pet }) => {
  const age = getAgeInYears(pet.birthDate)
  
  return (
    <Link href={`/pets/${pet.id}`} className="block">
      <div className="pet-card">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Heart className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{pet.name}</h3>
            <p className="text-sm text-muted-foreground">
              {pet.species} • {pet.breed}
            </p>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('pets.age')}:</span>
            <span>{age} {age === 1 ? t('pets.year') : t('pets.years')}</span>
          </div>
          
          {pet.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {pet.description}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
})

PetCard.displayName = 'PetCard'

export const RecentPets = memo(() => {
  const { data: session } = useSession()
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPets = useCallback(async () => {
    if (!session?.user?.id) {
      setLoading(false)
      return
    }

    const cacheKey = session.user.id
    
    // Check cache first
    const cached = petsCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setPets(cached.pets)
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/pets', {
        headers: {
          'Cache-Control': 'max-age=120', // 2 minutes client-side cache
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        // Limit to recent pets for performance
        const recentPets = data.slice(0, 4)
        
        // Update cache
        petsCache.set(cacheKey, { pets: recentPets, timestamp: Date.now() })
        setPets(recentPets)
      } else {
        console.error('Failed to fetch pets:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching pets:', error)
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id])

  useEffect(() => {
    fetchPets()
  }, [fetchPets])

  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{t('dashboard.recentPets')}</h2>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="card p-6">
        <div className="text-center py-8">
          <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">{t('auth.signInRequired')}</h3>
          <p className="text-muted-foreground mb-4">{t('dashboard.signInToViewPets')}</p>
          <Button asChild>
            <Link href="/auth/signin">{t('auth.signIn')}</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{t('dashboard.recentPets')}</h2>
        <Button asChild size="sm" variant="outline">
          <Link href="/pets">
            {t('dashboard.viewAll')}
          </Link>
        </Button>
      </div>
      
      {pets.length === 0 ? (
        <div className="text-center py-8">
          <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">{t('pets.noPets')}</h3>
          <p className="text-muted-foreground mb-4">{t('pets.addFirstPet')}</p>
          <Button asChild>
            <Link href="/pets/new">
              <Plus className="w-4 h-4 mr-2" />
              {t('pets.addPet')}
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {pets.map((pet) => (
            <PetCard key={pet.id} pet={pet} />
          ))}
          
          {pets.length >= 4 && (
            <div className="pt-4 border-t">
              <Button asChild variant="outline" className="w-full">
                <Link href="/pets">{t('dashboard.viewAllPets')}</Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
})

RecentPets.displayName = 'RecentPets'

function getAgeInYears(birthDate: string): number {
  if (!birthDate) return 0
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  
  return Math.max(0, age)
}