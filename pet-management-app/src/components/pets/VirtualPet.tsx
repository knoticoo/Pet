'use client'

import { useState, useEffect, useRef } from 'react'
import { Heart, Play, Utensils, Scissors, Zap, Sparkles, Star, Gift } from 'lucide-react'
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
  onInteraction: (type: string) => Promise<{ success: boolean; message: string; data?: unknown }>
}

interface PetAnimation {
  type: 'idle' | 'happy' | 'excited' | 'sleepy' | 'curious' | 'playful' | 'eating' | 'grooming'
  duration: number
  emoji: string
  color: string
  scale: number
  rotation: number
  bounce: boolean
  glow: boolean
}

interface FloatingParticle {
  id: number
  x: number
  y: number
  emoji: string
  life: number
  maxLife: number
  vx: number
  vy: number
}

export function VirtualPet({ pet, onInteraction }: VirtualPetProps) {
  const [currentAnimation, setCurrentAnimation] = useState<PetAnimation>({
    type: 'idle',
    duration: 2000,
    emoji: '🐾',
    color: 'text-gray-600',
    scale: 1,
    rotation: 0,
    bounce: false,
    glow: false
  })
  const [isInteracting, setIsInteracting] = useState(false)
  const [lastResponse, setLastResponse] = useState<{ success: boolean; message: string; data?: unknown } | null>(null)
  const [mood, setMood] = useState<'happy' | 'excited' | 'calm' | 'curious' | 'playful' | 'sleepy'>('happy')
  const [energy, setEnergy] = useState(75)
  const [happiness, setHappiness] = useState(80)
  const [hunger, setHunger] = useState(30)
  const [particles, setParticles] = useState<FloatingParticle[]>([])
  const [petLevel, setPetLevel] = useState(1)
  const [experience, setExperience] = useState(0)
  const animationRef = useRef<NodeJS.Timeout>()
  const particleRef = useRef<number>(0)

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
    idle: { 
      type: 'idle', 
      duration: 2000, 
      emoji: getSpeciesEmoji(pet.species), 
      color: 'text-gray-600',
      scale: 1,
      rotation: 0,
      bounce: false,
      glow: false
    },
    happy: { 
      type: 'happy', 
      duration: 1500, 
      emoji: '😊', 
      color: 'text-yellow-500',
      scale: 1.1,
      rotation: 5,
      bounce: true,
      glow: true
    },
    excited: { 
      type: 'excited', 
      duration: 1000, 
      emoji: '🤩', 
      color: 'text-orange-500',
      scale: 1.2,
      rotation: 10,
      bounce: true,
      glow: true
    },
    sleepy: { 
      type: 'sleepy', 
      duration: 3000, 
      emoji: '😴', 
      color: 'text-blue-500',
      scale: 0.9,
      rotation: -5,
      bounce: false,
      glow: false
    },
    curious: { 
      type: 'curious', 
      duration: 2000, 
      emoji: '🤔', 
      color: 'text-purple-500',
      scale: 1.05,
      rotation: 15,
      bounce: false,
      glow: false
    },
    playful: { 
      type: 'playful', 
      duration: 1200, 
      emoji: '🎾', 
      color: 'text-green-500',
      scale: 1.15,
      rotation: 20,
      bounce: true,
      glow: true
    },
    eating: {
      type: 'eating',
      duration: 2000,
      emoji: '😋',
      color: 'text-amber-500',
      scale: 1.1,
      rotation: 0,
      bounce: false,
      glow: true
    },
    grooming: {
      type: 'grooming',
      duration: 2500,
      emoji: '✨',
      color: 'text-pink-500',
      scale: 1.05,
      rotation: 0,
      bounce: false,
      glow: true
    }
  }

  // Create floating particles
  const createParticles = (type: string, count: number = 5) => {
    const newParticles: FloatingParticle[] = []
    const emojis = {
      happy: ['💖', '✨', '🌟'],
      excited: ['🎉', '🎊', '⭐'],
      playful: ['🎾', '🎯', '🎪'],
      eating: ['🍖', '🥕', '🍎'],
      grooming: ['✨', '💫', '🌸']
    }

    const particleEmojis = emojis[type as keyof typeof emojis] || ['✨']

    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: particleRef.current++,
        x: Math.random() * 200 - 100,
        y: Math.random() * 200 - 100,
        emoji: particleEmojis[Math.floor(Math.random() * particleEmojis.length)],
        life: 60,
        maxLife: 60,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4 - 2
      })
    }

    setParticles(prev => [...prev, ...newParticles])
  }

  // Update particles animation
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prev => 
        prev.map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          life: particle.life - 1,
          vy: particle.vy + 0.1 // gravity
        })).filter(particle => particle.life > 0)
      )
    }, 50)

    return () => clearInterval(interval)
  }, [])

  // Auto mood changes based on stats
  useEffect(() => {
    if (hunger > 80) {
      setMood('sleepy')
      setCurrentAnimation(animations.sleepy)
    } else if (happiness > 90) {
      setMood('excited')
    } else if (energy < 20) {
      setMood('sleepy')
    } else if (happiness > 70) {
      setMood('happy')
    }
  }, [energy, happiness, hunger])

  // Level up system
  useEffect(() => {
    const newLevel = Math.floor(experience / 100) + 1
    if (newLevel > petLevel) {
      setPetLevel(newLevel)
      createParticles('excited', 8)
      setCurrentAnimation(animations.excited)
    }
  }, [experience, petLevel])

  const handleInteraction = async (type: string) => {
    if (isInteracting) return

    setIsInteracting(true)
    setCurrentAnimation(animations.excited)
    createParticles(type, 3)

    // Update stats based on interaction
    switch (type) {
      case 'pet':
        setHappiness(prev => Math.min(100, prev + 10))
        setExperience(prev => prev + 5)
        break
      case 'play':
        setHappiness(prev => Math.min(100, prev + 15))
        setEnergy(prev => Math.max(0, prev - 10))
        setExperience(prev => prev + 10)
        break
      case 'feed':
        setHunger(prev => Math.max(0, prev - 20))
        setEnergy(prev => Math.min(100, prev + 15))
        setExperience(prev => prev + 8)
        setCurrentAnimation(animations.eating)
        break
      case 'groom':
        setHappiness(prev => Math.min(100, prev + 8))
        setExperience(prev => prev + 6)
        setCurrentAnimation(animations.grooming)
        break
      case 'walk':
        setEnergy(prev => Math.max(0, prev - 15))
        setHappiness(prev => Math.min(100, prev + 12))
        setExperience(prev => prev + 12)
        break
    }

    try {
      const response = await onInteraction(type)
      setLastResponse(response)
      setMood(response.data?.mood || 'happy') // Assuming response.data.mood is the new way to get mood
      
      // Set animation based on response
      const animation = animations[response.data?.mood || 'happy'] || animations.happy // Assuming response.data.mood is the new way to get mood
      setCurrentAnimation(animation)
      
      // Reset to idle after animation
      clearTimeout(animationRef.current)
      animationRef.current = setTimeout(() => {
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
      case 'dog': return 'w-40 h-40'
      case 'cat': return 'w-36 h-36'
      case 'bird': return 'w-32 h-32'
      case 'rabbit': return 'w-34 h-34'
      case 'fish': return 'w-28 h-28'
      default: return 'w-32 h-32'
    }
  }

  const getPetColor = () => {
    const species = pet.species.toLowerCase()
    switch (species) {
      case 'dog': return 'bg-gradient-to-br from-amber-400 via-orange-400 to-orange-500'
      case 'cat': return 'bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600'
      case 'bird': return 'bg-gradient-to-br from-blue-400 via-purple-400 to-purple-500'
      case 'rabbit': return 'bg-gradient-to-br from-white via-gray-200 to-gray-300'
      case 'fish': return 'bg-gradient-to-br from-blue-500 via-cyan-400 to-cyan-500'
      default: return 'bg-gradient-to-br from-pink-400 via-purple-400 to-purple-500'
    }
  }

  const getStatColor = (value: number) => {
    if (value >= 80) return 'text-green-500'
    if (value >= 50) return 'text-yellow-500'
    if (value >= 20) return 'text-orange-500'
    return 'text-red-500'
  }

  return (
    <div className="card p-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-blue-200 relative overflow-hidden">
      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute text-2xl transition-all duration-100 ease-out"
            style={{
              left: `50%`,
              top: `50%`,
              transform: `translate(${particle.x}px, ${particle.y}px)`,
              opacity: particle.life / particle.maxLife,
              fontSize: `${Math.max(0.5, particle.life / particle.maxLife)}rem`
            }}
          >
            {particle.emoji}
          </div>
        ))}
      </div>

      <div className="text-center space-y-6 relative z-10">
        {/* Pet Level Badge */}
        <div className="flex justify-center mb-4">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
            <Star className="h-3 w-3" />
            Level {petLevel}
          </div>
        </div>

        {/* Virtual Pet Display */}
        <div className="relative">
          <div 
            className={`${getPetSize()} ${getPetColor()} rounded-full mx-auto flex items-center justify-center shadow-2xl transition-all duration-500 relative ${
              currentAnimation.bounce ? 'animate-bounce' : ''
            } ${
              currentAnimation.glow ? 'ring-4 ring-yellow-300 ring-opacity-50' : ''
            }`}
            style={{
              transform: `scale(${currentAnimation.scale}) rotate(${currentAnimation.rotation}deg)`,
              filter: currentAnimation.glow ? 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.5))' : 'none'
            }}
          >
            <span className={`text-6xl ${currentAnimation.color} transition-all duration-300`}>
              {currentAnimation.emoji}
            </span>
            
            {/* Mood ring */}
            <div className="absolute inset-0 rounded-full border-4 border-dashed border-opacity-30 animate-spin-slow"
                 style={{ borderColor: currentAnimation.color.replace('text-', '') }}>
            </div>
          </div>
          
          {/* Status indicators */}
          <div className="absolute -top-2 -right-2 flex flex-col gap-1">
            <div className="bg-white rounded-full p-2 shadow-md">
              <Heart className={`h-4 w-4 ${
                mood === 'happy' ? 'text-red-500' :
                mood === 'excited' ? 'text-orange-500' :
                mood === 'playful' ? 'text-green-500' :
                mood === 'sleepy' ? 'text-blue-500' :
                'text-gray-400'
              }`} />
            </div>
            {experience > 0 && (
              <div className="bg-yellow-100 rounded-full p-1 shadow-md">
                <Sparkles className="h-3 w-3 text-yellow-600" />
              </div>
            )}
          </div>
        </div>

        {/* Pet Name and Status */}
        <div>
          <h3 className="text-2xl font-bold text-foreground mb-2">{pet.name}</h3>
          <p className="text-sm text-muted-foreground mb-3">
            {pet.breed || pet.species} • {currentAnimation.type} • Level {petLevel}
          </p>
          
          {/* Stats Bars */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Happiness</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-pink-400 to-red-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${happiness}%` }}
                ></div>
              </div>
              <div className={`text-xs font-medium ${getStatColor(happiness)}`}>{happiness}%</div>
            </div>
            
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Energy</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${energy}%` }}
                ></div>
              </div>
              <div className={`text-xs font-medium ${getStatColor(energy)}`}>{energy}%</div>
            </div>
            
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Hunger</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${hunger}%` }}
                ></div>
              </div>
              <div className={`text-xs font-medium ${getStatColor(100 - hunger)}`}>{hunger > 80 ? 'Very Hungry' : hunger > 50 ? 'Hungry' : hunger > 20 ? 'Satisfied' : 'Full'}</div>
            </div>
          </div>

          {/* Experience Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Experience</span>
              <span>{experience % 100}/100</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-400 to-pink-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(experience % 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Interaction Response */}
        {lastResponse && (
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-blue-200 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium text-purple-700">AI Response</span>
            </div>
            <p className="text-sm text-foreground mb-2">{lastResponse.message}</p>
            {lastResponse.healthTip && (
              <div className="bg-blue-50 rounded p-2 mb-2">
                <p className="text-xs text-blue-700">💡 {lastResponse.healthTip}</p>
              </div>
            )}
            {lastResponse.activitySuggestion && (
              <div className="bg-green-50 rounded p-2">
                <p className="text-xs text-green-700">🎯 {lastResponse.activitySuggestion}</p>
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
            className="flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <Heart className="h-4 w-4" />
            <span className="hidden sm:inline">Pet</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleInteraction('play')}
            disabled={isInteracting}
            className="flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <Play className="h-4 w-4" />
            <span className="hidden sm:inline">Play</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleInteraction('feed')}
            disabled={isInteracting}
            className="flex items-center gap-2 hover:scale-105 transition-transform"
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
              className="flex items-center gap-2 hover:scale-105 transition-transform"
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
            className="flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <Scissors className="h-4 w-4" />
            <span className="hidden sm:inline">Groom</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              createParticles('happy', 5)
              setHappiness(prev => Math.min(100, prev + 5))
              setExperience(prev => prev + 3)
            }}
            disabled={isInteracting}
            className="flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <Gift className="h-4 w-4" />
            <span className="hidden sm:inline">Treat</span>
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