'use client'

import { Heart, Calendar, MapPin, Plus } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

interface Pet {
  id: string
  name: string
  species: string
  breed: string
  birthDate: string
  description?: string
}

export function RecentPets() {
  const { data: session } = useSession()
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.id) {
      fetchPets()
    } else {
      setLoading(false)
    }
  }, [session])

  const fetchPets = async () => {
    try {
      const response = await fetch('/api/pets')
      if (response.ok) {
        const data = await response.json()
        setPets(data)
      } else {
        console.error('Failed to fetch pets:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching pets:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAgeInYears = (birthDate: string) => {
    if (!birthDate) return 0
    const today = new Date()
    const birth = new Date(birthDate)
    const age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return Math.max(0, age - 1)
    }
    return age
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(date)
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

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground mt-4">Loading your pets...</p>
      </div>
    )
  }

  if (pets.length === 0) {
    return (
      <div className="text-center py-8">
        <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No pets yet</h3>
        <p className="text-muted-foreground mb-4">
          Add your first pet to start tracking their care
        </p>
        <Link href="/pets/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Pet
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {pets.slice(0, 3).map((pet) => (
        <Link key={pet.id} href={`/pets/${pet.id}`}>
          <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getGradientColor(pet.species)} flex items-center justify-center`}>
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-foreground">{pet.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {pet.breed} • {getAgeInYears(pet.birthDate)} years old
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm">
                <p className="text-muted-foreground">Species</p>
                <p className="font-medium text-foreground capitalize">
                  {pet.species}
                </p>
              </div>
            </div>
          </div>
        </Link>
      ))}
      
      {pets.length > 3 && (
        <div className="text-center pt-4">
          <Link href="/pets">
            <Button variant="outline" size="sm">
              View All Pets ({pets.length})
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}