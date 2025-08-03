'use client'

import { useEffect, useState, useRef } from 'react'
import { Heart, Sparkles, Activity, Zap, Star, TrendingUp, Play, Pause } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingScreenProps {
  isVisible: boolean
  onComplete?: () => void
}

export const LoadingScreen = ({ isVisible, onComplete }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)
  const [showParticles, setShowParticles] = useState(true)
  const [isPlaying, setIsPlaying] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)

  const steps = [
    { name: 'Инициализация системы', icon: Activity, color: 'from-blue-500 to-blue-600' },
    { name: 'Загрузка данных', icon: TrendingUp, color: 'from-green-500 to-green-600' },
    { name: 'Подключение к базе', icon: Zap, color: 'from-yellow-500 to-yellow-600' },
    { name: 'Готово!', icon: Star, color: 'from-purple-500 to-purple-600' }
  ]

  // Particle animation system
  useEffect(() => {
    if (!canvasRef.current || !showParticles) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      size: number
      opacity: number
      color: string
      life: number
      maxLife: number
    }> = []

    // Create particles
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 4 + 1,
        opacity: Math.random() * 0.8 + 0.2,
        color: `hsl(${Math.random() * 360}, 70%, 60%)`,
        life: Math.random() * 100,
        maxLife: 100
      })
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      particles.forEach((particle) => {
        particle.x += particle.vx
        particle.y += particle.vy
        particle.life -= 1
        
        if (particle.life <= 0) {
          particle.x = Math.random() * canvas.width
          particle.y = Math.random() * canvas.height
          particle.life = particle.maxLife
        }
        
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1
        
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = particle.color
        ctx.globalAlpha = particle.opacity * (particle.life / particle.maxLife)
        ctx.fill()
      })
      
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [showParticles])

  // Progress simulation
  useEffect(() => {
    if (!isVisible) return

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            onComplete?.()
          }, 1000)
          return 100
        }
        return prev + Math.random() * 15
      })
    }, 200)

    return () => clearInterval(interval)
  }, [isVisible, onComplete])

  // Step progression
  useEffect(() => {
    if (!isVisible) return

    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= steps.length - 1) {
          clearInterval(stepInterval)
          return prev
        }
        return prev + 1
      })
    }, 1500)

    return () => clearInterval(stepInterval)
  }, [isVisible, steps.length])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 backdrop-blur-xl">
      {/* Particle Background */}
      {showParticles && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{ background: 'transparent' }}
        />
      )}

      {/* Main Loading Container */}
      <div className="relative z-10 max-w-md w-full mx-4">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-primary via-purple-600 to-pink-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/30 animate-pulse">
              <Heart className="h-12 w-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-bounce">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center animate-ping">
              <Activity className="h-3 w-3 text-white" />
            </div>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            ПетКеа
          </h1>
          <p className="text-lg text-muted-foreground">
            Загрузка приложения...
          </p>
        </div>

        {/* Progress Steps */}
        <div className="space-y-4 mb-8">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = index === currentStep
            const isCompleted = index < currentStep
            
            return (
              <div
                key={index}
                className={cn(
                  "relative flex items-center gap-4 p-4 rounded-2xl transition-all duration-500",
                  isActive 
                    ? "bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-sm border border-white/30 shadow-lg" 
                    : isCompleted
                    ? "bg-gradient-to-r from-green-500/20 to-green-600/20 backdrop-blur-sm border border-green-300/30"
                    : "bg-white/5 backdrop-blur-sm border border-white/10"
                )}
              >
                {/* Step Icon */}
                <div className={cn(
                  "relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                  isActive 
                    ? `bg-gradient-to-br ${step.color} shadow-lg shadow-primary/25` 
                    : isCompleted
                    ? "bg-gradient-to-br from-green-500 to-green-600 shadow-lg"
                    : "bg-white/10"
                )}>
                  <Icon className={cn(
                    "h-6 w-6 transition-all duration-500",
                    isActive || isCompleted ? "text-white scale-110" : "text-muted-foreground"
                  )} />
                  {isActive && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-ping" />
                  )}
                  {isCompleted && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-green-400 to-green-600 rounded-full" />
                  )}
                </div>

                {/* Step Content */}
                <div className="flex-1">
                  <h3 className={cn(
                    "font-semibold transition-all duration-500",
                    isActive ? "text-foreground" : isCompleted ? "text-green-600" : "text-muted-foreground"
                  )}>
                    {step.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isActive ? "Выполняется..." : isCompleted ? "Завершено" : "Ожидание"}
                  </p>
                </div>

                {/* Animated Indicator */}
                {isActive && (
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Прогресс загрузки</span>
            <span className="text-sm font-semibold text-foreground">{Math.round(progress)}%</span>
          </div>
          <div className="relative h-3 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
            <div 
              className="h-full bg-gradient-to-r from-primary via-purple-600 to-pink-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>
          <button
            onClick={() => setShowParticles(!showParticles)}
            className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300"
          >
            <Sparkles className="h-5 w-5" />
          </button>
        </div>

        {/* Floating Elements */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-pink-500/20 to-yellow-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
    </div>
  )
}