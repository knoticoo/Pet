'use client'

import { Heart, PawPrint, Sparkles, Activity, Star, Zap, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  animated?: boolean
  className?: string
  variant?: 'default' | 'heart' | 'paw' | 'advanced'
}

export const Logo = ({ 
  size = 'md', 
  showText = true, 
  animated = false, 
  className,
  variant = 'advanced'
}: LogoProps) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [currentIcon, setCurrentIcon] = useState(0)

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  }

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-10 w-10'
  }

  // Icon rotation for advanced variant
  useEffect(() => {
    if (animated && variant === 'advanced') {
      const interval = setInterval(() => {
        setCurrentIcon(prev => (prev + 1) % 4)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [animated, variant])

  const icons = [Heart, PawPrint, Star, Activity]

  const handleAnimation = () => {
    if (animated) {
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 600)
    }
  }

  const getCurrentIcon = () => {
    if (variant === 'advanced') {
      const Icon = icons[currentIcon]
      return <Icon className={cn("text-white transition-all duration-500", iconSizes[size])} />
    }
    if (variant === 'heart') {
      return <Heart className={cn("text-white fill-white transition-all duration-500", iconSizes[size])} />
    }
    if (variant === 'paw') {
      return <PawPrint className={cn("text-white transition-all duration-500", iconSizes[size])} />
    }
    // Default pet silhouette
    return (
      <div className="relative">
        <div className="w-3/4 h-3/4 bg-white/90 rounded-full flex items-center justify-center">
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-white/90 rounded-full"></div>
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-white/90 rounded-full"></div>
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-primary rounded-full"></div>
            <div className="w-1 h-1 bg-primary rounded-full"></div>
          </div>
          <div className="absolute bottom-1 w-0.5 h-0.5 bg-primary rounded-full"></div>
        </div>
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-1 bg-white/90 rounded-full"></div>
      </div>
    )
  }

  return (
    <div 
      className={cn("flex items-center gap-3 cursor-pointer group", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleAnimation}
    >
      {/* Advanced Logo Icon */}
      <div className="relative">
        {/* Main logo container with advanced styling */}
        <div className={cn(
          "relative overflow-hidden transition-all duration-500",
          sizeClasses[size],
          animated && "hover:scale-110 hover:rotate-3"
        )}>
          {/* Animated background */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-br from-primary via-purple-600 to-pink-600 rounded-2xl transition-all duration-500",
            isHovered && "bg-gradient-to-br from-primary via-pink-600 to-purple-600",
            isAnimating && "animate-pulse"
          )} />
          
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          
          {/* Icon container */}
          <div className={cn(
            "relative z-10 w-full h-full flex items-center justify-center transition-all duration-500",
            isHovered && "scale-110",
            isAnimating && "animate-bounce"
          )}>
            {getCurrentIcon()}
          </div>
        </div>
        
        {/* Status indicators */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-green-400 to-green-600 rounded-full border-2 border-white animate-pulse" />
        
        {/* Advanced sparkle effects */}
        {animated && (
          <>
            <div className={cn(
              "absolute -top-2 -left-2 transition-all duration-500",
              isHovered ? "animate-bounce" : "animate-ping"
            )}>
              <Sparkles className="h-3 w-3 text-yellow-400" />
            </div>
            <div className={cn(
              "absolute -bottom-2 -right-2 transition-all duration-500",
              isHovered ? "animate-bounce" : "animate-ping"
            )} style={{ animationDelay: '0.5s' }}>
              <Sparkles className="h-3 w-3 text-pink-400" />
            </div>
            <div className={cn(
              "absolute -top-1 -left-3 transition-all duration-500",
              isHovered ? "animate-bounce" : "animate-ping"
            )} style={{ animationDelay: '1s' }}>
              <Zap className="h-2 w-2 text-blue-400" />
            </div>
          </>
        )}

        {/* Hover glow effect */}
        {isHovered && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-2xl blur-xl animate-pulse" />
        )}
      </div>

      {/* Advanced Logo Text */}
      {showText && (
        <div className="flex flex-col">
          <span className={cn(
            "font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent transition-all duration-500",
            size === 'sm' && "text-lg",
            size === 'md' && "text-xl",
            size === 'lg' && "text-2xl",
            size === 'xl' && "text-3xl",
            isHovered && "animate-neon-pulse"
          )}>
            ПетКеа
          </span>
          <div className="flex items-center gap-1">
            <span className={cn(
              "text-muted-foreground transition-all duration-500",
              size === 'sm' && "text-xs",
              size === 'md' && "text-xs",
              size === 'lg' && "text-sm",
              size === 'xl' && "text-sm"
            )}>
              Уход за питомцами
            </span>
            {animated && (
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                <TrendingUp className="h-3 w-3 text-green-500" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Heart logo variant with advanced animations
export const HeartLogo = ({ size = 'md', showText = true, animated = false, className }: LogoProps) => {
  return <Logo size={size} showText={showText} animated={animated} className={className} variant="heart" />
}

// Paw logo variant with advanced animations
export const PawLogo = ({ size = 'md', showText = true, animated = false, className }: LogoProps) => {
  return <Logo size={size} showText={showText} animated={animated} className={className} variant="paw" />
}

// Advanced logo with morphing animations
export const AdvancedLogo = ({ size = 'md', showText = true, animated = false, className }: LogoProps) => {
  return <Logo size={size} showText={showText} animated={animated} className={className} variant="advanced" />
}

// Minimal logo for compact spaces
export const MinimalLogo = ({ size = 'md', animated = false, className }: Omit<LogoProps, 'showText'>) => {
  return <Logo size={size} showText={false} animated={animated} className={className} variant="advanced" />
}