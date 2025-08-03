'use client'

import { useState, useEffect } from 'react'
import { Heart, PawPrint, Sparkles, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from './Logo'

interface LoadingScreenProps {
  onComplete: () => void
  isVisible: boolean
}

export const LoadingScreen = ({ onComplete, isVisible }: LoadingScreenProps) => {
  const [loadingStep, setLoadingStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [showCheckmarks, setShowCheckmarks] = useState(false)

  const loadingSteps = [
    { text: 'Инициализация системы...', icon: Sparkles },
    { text: 'Загрузка данных питомцев...', icon: PawPrint },
    { text: 'Подключение к базе данных...', icon: Heart },
    { text: 'Настройка интерфейса...', icon: Sparkles },
    { text: 'Готово!', icon: CheckCircle }
  ]

  useEffect(() => {
    if (!isVisible) return

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer)
          setShowCheckmarks(true)
          setTimeout(() => {
            onComplete()
          }, 1000)
          return 100
        }
        return prev + 2
      })
    }, 50)

    const stepTimer = setInterval(() => {
      setLoadingStep(prev => {
        if (prev >= loadingSteps.length - 1) {
          clearInterval(stepTimer)
          return prev
        }
        return prev + 1
      })
    }, 800)

    return () => {
      clearInterval(timer)
      clearInterval(stepTimer)
    }
  }, [isVisible, onComplete])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating hearts */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          >
            <Heart className="h-4 w-4 text-pink-300 opacity-60" />
          </div>
        ))}
        
        {/* Floating paw prints */}
        {[...Array(4)].map((_, i) => (
          <div
            key={i + 6}
            className="absolute animate-float-reverse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.7}s`,
              animationDuration: `${4 + Math.random() * 2}s`
            }}
          >
            <PawPrint className="h-5 w-5 text-blue-300 opacity-50" />
          </div>
        ))}
      </div>

      {/* Main loading content */}
      <div className="relative z-10 text-center space-y-8">
        {/* Logo and title */}
        <div className="space-y-4">
          <div className="flex justify-center">
            <Logo size="xl" animated={true} />
          </div>
          
          <div className="space-y-2">
            <p className="text-lg text-muted-foreground animate-fade-in" style={{ animationDelay: '0.3s' }}>
              Загружаем ваше приложение...
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-80 mx-auto space-y-4">
          <div className="relative">
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-medium text-primary-foreground">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
          
          {/* Loading steps */}
          <div className="space-y-2">
            {loadingSteps.map((step, index) => {
              const Icon = step.icon
              const isActive = index === loadingStep
              const isCompleted = index < loadingStep
              
              return (
                <div
                  key={index}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-300",
                    isActive && "bg-primary/10 text-primary",
                    isCompleted && "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300",
                    !isActive && !isCompleted && "text-muted-foreground"
                  )}
                >
                  <div className="relative">
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5 text-green-600 animate-scale-in" />
                    ) : (
                      <Icon className={cn(
                        "h-5 w-5",
                        isActive && "animate-pulse"
                      )} />
                    )}
                  </div>
                  <span className="text-sm font-medium">{step.text}</span>
                  {isActive && (
                    <div className="ml-auto">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Loading animation */}
        <div className="flex justify-center space-x-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 bg-primary rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>

        {/* Fun fact */}
        <div className="max-w-md mx-auto p-4 bg-card/50 backdrop-blur-sm rounded-lg border">
          <p className="text-sm text-muted-foreground">
            💡 Знаете ли вы? Кошки проводят 70% своей жизни во сне!
          </p>
        </div>
      </div>

      {/* Completion overlay */}
      {showCheckmarks && (
        <div className="absolute inset-0 bg-green-500/20 backdrop-blur-sm flex items-center justify-center animate-fade-in">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto animate-scale-in">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-green-700 dark:text-green-300">
              Готово!
            </h2>
            <p className="text-green-600 dark:text-green-400">
              Добро пожаловать в ПетКеа
            </p>
          </div>
        </div>
      )}
    </div>
  )
}