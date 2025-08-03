'use client'

import { Heart, PawPrint, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  animated?: boolean
  className?: string
}

export const Logo = ({ size = 'md', showText = true, animated = false, className }: LogoProps) => {
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

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Logo Icon */}
      <div className="relative">
        {/* Main logo container */}
        <div className={cn(
          "bg-gradient-to-br from-primary via-primary/90 to-primary/80 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25 transition-all duration-300",
          sizeClasses[size],
          animated && "hover:shadow-xl hover:shadow-primary/30 hover:scale-105"
        )}>
          {/* Pet silhouette */}
          <div className="relative">
            {/* Pet head */}
            <div className="w-3/4 h-3/4 bg-white/90 rounded-full flex items-center justify-center">
              {/* Pet ears */}
              <div className="absolute -top-1 -left-1 w-2 h-2 bg-white/90 rounded-full"></div>
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-white/90 rounded-full"></div>
              
              {/* Pet eyes */}
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-primary rounded-full"></div>
                <div className="w-1 h-1 bg-primary rounded-full"></div>
              </div>
              
              {/* Pet nose */}
              <div className="absolute bottom-1 w-0.5 h-0.5 bg-primary rounded-full"></div>
            </div>
            
            {/* Pet body */}
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-1 bg-white/90 rounded-full"></div>
          </div>
        </div>
        
        {/* Status indicator */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
        
        {/* Sparkle effects */}
        {animated && (
          <>
            <div className="absolute -top-2 -left-2 animate-ping">
              <Sparkles className="h-3 w-3 text-yellow-400" />
            </div>
            <div className="absolute -bottom-2 -right-2 animate-ping" style={{ animationDelay: '0.5s' }}>
              <Sparkles className="h-3 w-3 text-pink-400" />
            </div>
          </>
        )}
      </div>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col">
          <span className={cn(
            "font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent",
            size === 'sm' && "text-lg",
            size === 'md' && "text-xl",
            size === 'lg' && "text-2xl",
            size === 'xl' && "text-3xl"
          )}>
            ПетКеа
          </span>
          <span className={cn(
            "text-muted-foreground",
            size === 'sm' && "text-xs",
            size === 'md' && "text-xs",
            size === 'lg' && "text-sm",
            size === 'xl' && "text-sm"
          )}>
            Уход за питомцами
          </span>
        </div>
      )}
    </div>
  )
}

// Alternative logo with paw print design
export const PawLogo = ({ size = 'md', showText = true, animated = false, className }: LogoProps) => {
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

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Logo Icon */}
      <div className="relative">
        <div className={cn(
          "bg-gradient-to-br from-primary via-primary/90 to-primary/80 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25 transition-all duration-300",
          sizeClasses[size],
          animated && "hover:shadow-xl hover:shadow-primary/30 hover:scale-105"
        )}>
          <PawPrint className={cn("text-white", iconSizes[size])} />
        </div>
        
        {/* Status indicator */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
        
        {/* Sparkle effects */}
        {animated && (
          <>
            <div className="absolute -top-2 -left-2 animate-ping">
              <Sparkles className="h-3 w-3 text-yellow-400" />
            </div>
            <div className="absolute -bottom-2 -right-2 animate-ping" style={{ animationDelay: '0.5s' }}>
              <Sparkles className="h-3 w-3 text-pink-400" />
            </div>
          </>
        )}
      </div>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col">
          <span className={cn(
            "font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent",
            size === 'sm' && "text-lg",
            size === 'md' && "text-xl",
            size === 'lg' && "text-2xl",
            size === 'xl' && "text-3xl"
          )}>
            ПетКеа
          </span>
          <span className={cn(
            "text-muted-foreground",
            size === 'sm' && "text-xs",
            size === 'md' && "text-xs",
            size === 'lg' && "text-sm",
            size === 'xl' && "text-sm"
          )}>
            Уход за питомцами
          </span>
        </div>
      )}
    </div>
  )
}

// Heart logo variant
export const HeartLogo = ({ size = 'md', showText = true, animated = false, className }: LogoProps) => {
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

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Logo Icon */}
      <div className="relative">
        <div className={cn(
          "bg-gradient-to-br from-primary via-primary/90 to-primary/80 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25 transition-all duration-300",
          sizeClasses[size],
          animated && "hover:shadow-xl hover:shadow-primary/30 hover:scale-105"
        )}>
          <Heart className={cn("text-white fill-white", iconSizes[size])} />
        </div>
        
        {/* Status indicator */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
        
        {/* Sparkle effects */}
        {animated && (
          <>
            <div className="absolute -top-2 -left-2 animate-ping">
              <Sparkles className="h-3 w-3 text-yellow-400" />
            </div>
            <div className="absolute -bottom-2 -right-2 animate-ping" style={{ animationDelay: '0.5s' }}>
              <Sparkles className="h-3 w-3 text-pink-400" />
            </div>
          </>
        )}
      </div>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col">
          <span className={cn(
            "font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent",
            size === 'sm' && "text-lg",
            size === 'md' && "text-xl",
            size === 'lg' && "text-2xl",
            size === 'xl' && "text-3xl"
          )}>
            ПетКеа
          </span>
          <span className={cn(
            "text-muted-foreground",
            size === 'sm' && "text-xs",
            size === 'md' && "text-xs",
            size === 'lg' && "text-sm",
            size === 'xl' && "text-sm"
          )}>
            Уход за питомцами
          </span>
        </div>
      )}
    </div>
  )
}