'use client'

import { useState, useEffect } from 'react'
import { VirtualPet } from '@/components/pets/VirtualPet'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Gamepad2, Heart } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface Pet {
  id: string
  name: string
  species: string
  breed?: string
  temperament?: string
  personality?: string
}

export default function VirtualPetPage() {
  const { t } = useTranslation()
  const [pets, setPets] = useState<Pet[]>([])
  const [currentPetIndex, setCurrentPetIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPets()
  }, [])

  const fetchPets = async () => {
    try {
      const response = await fetch('/api/pets')
      if (response.ok) {
        const data = await response.json()
        setPets(data)
        if (data.length === 0) {
          setError('No pets found. Add a pet first to play with virtual pets!')
        }
      } else {
        setError('Failed to load pets')
      }
    } catch (error) {
      console.error('Error fetching pets:', error)
      setError('Failed to load pets')
    } finally {
      setLoading(false)
    }
  }

  const handlePetInteraction = async (type: string) => {
    const currentPet = pets[currentPetIndex]
    if (!currentPet) return { success: false, message: 'No pet selected' }

    try {
      const response = await fetch(`/api/pets/${currentPet.id}/interact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ interactionType: type }),
      })

      if (response.ok) {
        const data = await response.json()
        return {
          success: true,
          message: data.message || `${currentPet.name} enjoyed the ${type}!`,
          data: data
        }
      } else {
        return {
          success: false,
          message: `Failed to interact with ${currentPet.name}`
        }
      }
    } catch (error) {
      console.error('Interaction error:', error)
      return {
        success: false,
        message: `Error interacting with ${currentPet.name}`
      }
    }
  }

  const nextPet = () => {
    setCurrentPetIndex((prev) => (prev + 1) % pets.length)
  }

  const prevPet = () => {
    setCurrentPetIndex((prev) => (prev - 1 + pets.length) % pets.length)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (error || pets.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Gamepad2 className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-4">Virtual Pet Playground</h1>
          <p className="text-muted-foreground mb-6">
            {error || 'No pets available for virtual interaction'}
          </p>
          <Button asChild>
            <a href="/pets/new">
              <Heart className="h-4 w-4 mr-2" />
              Add Your First Pet
            </a>
          </Button>
        </div>
      </div>
    )
  }

  const currentPet = pets[currentPetIndex]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
          <Gamepad2 className="h-8 w-8" />
          Virtual Pet Playground
        </h1>
        <p className="text-muted-foreground">
          Interact with your pets in a fun, virtual environment
        </p>
      </div>

      {pets.length > 1 && (
        <div className="flex items-center justify-center gap-4 mb-6">
          <Button variant="outline" size="sm" onClick={prevPet}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Pet {currentPetIndex + 1} of {pets.length}
            </p>
            <p className="font-semibold">{currentPet.name}</p>
          </div>
          <Button variant="outline" size="sm" onClick={nextPet}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        <VirtualPet 
          pet={currentPet} 
          onInteraction={handlePetInteraction}
        />
      </div>

      <div className="mt-8 text-center">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How to Play</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">🎮 Interactions</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Pet your companion to show love</li>
                  <li>• Play games to boost happiness</li>
                  <li>• Feed when hungry</li>
                  <li>• Groom for cleanliness</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">📊 Stats</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Happiness affects mood</li>
                  <li>• Energy decreases with play</li>
                  <li>• Hunger increases over time</li>
                  <li>• Level up through experience</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}