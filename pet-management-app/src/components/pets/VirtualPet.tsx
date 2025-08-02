'use client'

import { useState, useEffect } from 'react'
import { Heart, Play, Coffee, Utensils, Scissors, Zap, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface VirtualPetProps {
  pet: {
    id: string
    name: string
    species: string
    breed?: string
    temperament?: string
    personality?: string
  }
  onInteraction: (type: string) => Promise<any>
}

interface PetAnimation {
  type: 'idle' | 'happy' | 'excited' | 'sleepy' | 'curious' | 'playful'
  duration: number
  emoji: string
  color: string
}

export function VirtualPet({ pet, onInteraction }: VirtualPetProps) {
  const [currentAnimation, setCurrentAnimation] = useState<PetAnimation>({
    type: 'idle',
    duration: 2000,
    emoji: '🐾',
    color: 'text-gray-600'
  })
  const [isInteracting, setIsInteracting] = useState(false)
  const [lastResponse, setLastResponse] = useState<any>(null)
  const [mood, setMood] = useState<'happy' | 'excited' | 'calm' | 'curious' | 'playful' | 'sleepy'>('happy')

  const speciesEmojis = {
    dog: '🐕',
    cat: '🐱',
    bird: '🐦',
    rabbit: '🐰',
    fish: '🐠',
    hamster: '🐹',
    reptile: '🦎'
  }

  const getSpeciesEmoji = (species: string) => {
    return speciesEmojis[species.toLowerCase() as keyof typeof speciesEmojis] || '🐾'
  }

  const animations: Record<string, PetAnimation> = {
    idle: { type: 'idle', duration: 2000, emoji: getSpeciesEmoji(pet.species), color: 'text-gray-600' },
    happy: { type: 'happy', duration: 1500, emoji: '😊', color: 'text-yellow-500' },
    excited: { type: 'excited', duration: 1000, emoji: '🤩', color: 'text-orange-500' },
    sleepy: { type: 'sleepy', duration: 3000, emoji: '😴', color: 'text-blue-500' },
    curious: { type: 'curious', duration: 2000, emoji: '🤔', color: 'text-purple-500' },
    playful: { type: 'playful', duration: 1200, emoji: '🎾', color: 'text-green-500' }
  }

  const handleInteraction = async (type: string) => {
    if (isInteracting) return

    setIsInteracting(true)
    setCurrentAnimation(animations.excited)

    try {
      const response = await onInteraction(type)
      setLastResponse(response)
      setMood(response.mood)
      
      // Set animation based on response
      const animation = animations[response.mood] || animations.happy
      setCurrentAnimation(animation)
      
      // Reset to idle after animation
      setTimeout(() => {
        setCurrentAnimation(animations.idle)
      }, animation.duration)
    } catch (error) {
      console.error('Interaction failed:', error)
      setCurrentAnimation(animations.idle)
    } finally {
      setIsInteracting(false)
    }
  }

  const getPetSize = () => {
    const species = pet.species.toLowerCase()
    switch (species) {
      case 'dog': return 'w-32 h-32'
      case 'cat': return 'w-28 h-28'
      case 'bird': return 'w-24 h-24'
      case 'rabbit': return 'w-26 h-26'
      case 'fish': return 'w-20 h-20'
      default: return 'w-24 h-24'
    }
  }

  const getPetColor = () => {
    const species = pet.species.toLowerCase()
    switch (species) {
      case 'dog': return 'bg-gradient-to-br from-amber-400 to-orange-500'
      case 'cat': return 'bg-gradient-to-br from-gray-400 to-gray-600'
      case 'bird': return 'bg-gradient-to-br from-blue-400 to-purple-500'
      case 'rabbit': return 'bg-gradient-to-br from-white to-gray-300'
      case 'fish': return 'bg-gradient-to-br from-blue-500 to-cyan-400'
      default: return 'bg-gradient-to-br from-pink-400 to-purple-500'
    }
  }

  return (
    <div className="card p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
      <div className="text-center space-y-6">
        {/* Virtual Pet Display */}
        <div className="relative">
          <div className={`${getPetSize()} ${getPetColor()} rounded-full mx-auto flex items-center justify-center shadow-lg transform transition-all duration-500 ${
            currentAnimation.type === 'excited' ? 'scale-110 animate-bounce' :
            currentAnimation.type === 'playful' ? 'animate-pulse' :
            currentAnimation.type === 'sleepy' ? 'animate-pulse opacity-75' :
            'hover:scale-105'
          }`}>
          <span className={`text-6xl ${currentAnimation.color} transition-all duration-300`}>
            {currentAnimation.emoji}
          </span>
          </div>
          
          {/* Mood indicator */}
          <div className="absolute -top-2 -right-2 bg-white rounded-full p-2 shadow-md">
            <Heart className={`h-4 w-4 ${
              mood === 'happy' ? 'text-red-500' :
              mood === 'excited' ? 'text-orange-500' :
              mood === 'playful' ? 'text-green-500' :
              mood === 'sleepy' ? 'text-blue-500' :
              'text-gray-400'
            }`} />
          </div>
        </div>

        {/* Pet Name and Status */}
        <div>
          <h3 className="text-xl font-bold text-foreground mb-2">{pet.name}</h3>
          <p className="text-sm text-muted-foreground">
            {pet.breed || pet.species} • {currentAnimation.type}
          </p>
        </div>

        {/* Interaction Response */}
        {lastResponse && (
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium text-purple-700">AI Response</span>
            </div>
            <p className="text-sm text-foreground mb-2">{lastResponse.message}</p>
            {lastResponse.healthTip && (
              <div className="bg-blue-50 rounded p-2 mb-2">
                <p className="text-xs text-blue-700">{lastResponse.healthTip}</p>
              </div>
            )}
            {lastResponse.activitySuggestion && (
              <div className="bg-green-50 rounded p-2">
                <p className="text-xs text-green-700">💡 {lastResponse.activitySuggestion}</p>
              </div>
            )}
          </div>
        )}

        {/* Interaction Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleInteraction('pet')}
            disabled={isInteracting}
            className="flex items-center gap-2"
          >
            <Heart className="h-4 w-4" />
            <span className="hidden sm:inline">Pet</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleInteraction('play')}
            disabled={isInteracting}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            <span className="hidden sm:inline">Play</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleInteraction('feed')}
            disabled={isInteracting}
            className="flex items-center gap-2"
          >
            <Utensils className="h-4 w-4" />
            <span className="hidden sm:inline">Feed</span>
          </Button>
          
          {pet.species.toLowerCase() === 'dog' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleInteraction('walk')}
              disabled={isInteracting}
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Walk</span>
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleInteraction('groom')}
            disabled={isInteracting}
            className="flex items-center gap-2"
          >
            <Scissors className="h-4 w-4" />
            <span className="hidden sm:inline">Groom</span>
          </Button>
        </div>

        {/* Loading indicator */}
        {isInteracting && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span>Interacting with {pet.name}...</span>
          </div>
        )}
      </div>
    </div>
  )
}