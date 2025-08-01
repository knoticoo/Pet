'use client'

import React from 'react'

interface ThemePreviewProps {
  theme: string
  isSelected: boolean
  onClick: () => void
  name: string
  description: string
}

export function ThemePreview({ theme, isSelected, onClick, name, description }: ThemePreviewProps) {
  const getThemeColors = (themeKey: string) => {
    switch (themeKey) {
      case 'light':
        return {
          bg: 'bg-white',
          card: 'bg-gray-50',
          text: 'text-gray-900',
          primary: 'bg-blue-600',
          secondary: 'bg-gray-200',
          border: 'border-gray-200'
        }
      case 'dark':
        return {
          bg: 'bg-gray-900',
          card: 'bg-gray-800',
          text: 'text-white',
          primary: 'bg-blue-500',
          secondary: 'bg-gray-700',
          border: 'border-gray-700'
        }
      case 'blue':
        return {
          bg: 'bg-slate-50',
          card: 'bg-blue-50',
          text: 'text-slate-900',
          primary: 'bg-blue-600',
          secondary: 'bg-blue-100',
          border: 'border-blue-200'
        }
      case 'green':
        return {
          bg: 'bg-emerald-50',
          card: 'bg-green-50',
          text: 'text-emerald-900',
          primary: 'bg-emerald-600',
          secondary: 'bg-emerald-100',
          border: 'border-emerald-200'
        }
      case 'purple':
        return {
          bg: 'bg-purple-900',
          card: 'bg-purple-800',
          text: 'text-purple-100',
          primary: 'bg-purple-500',
          secondary: 'bg-purple-700',
          border: 'border-purple-600'
        }
      case 'system':
        return {
          bg: 'bg-gradient-to-br from-blue-50 to-purple-50',
          card: 'bg-white',
          text: 'text-gray-900',
          primary: 'bg-gradient-to-r from-blue-600 to-purple-600',
          secondary: 'bg-gray-100',
          border: 'border-gray-200'
        }
      default:
        return {
          bg: 'bg-white',
          card: 'bg-gray-50',
          text: 'text-gray-900',
          primary: 'bg-blue-600',
          secondary: 'bg-gray-200',
          border: 'border-gray-200'
        }
    }
  }

  const colors = getThemeColors(theme)

  return (
    <div
      className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-lg ${
        isSelected
          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
          : 'border-gray-200 hover:border-primary/50'
      }`}
      onClick={onClick}
    >
      {/* Theme Preview */}
      <div className={`${colors.bg} ${colors.border} border rounded-md p-3 mb-3 relative overflow-hidden`}>
        <div className="space-y-2">
          {/* Header bar */}
          <div className={`${colors.card} ${colors.border} border rounded px-2 py-1 flex items-center space-x-1`}>
            <div className={`w-2 h-2 ${colors.primary} rounded-full`}></div>
            <div className={`w-1 h-1 ${colors.secondary} rounded-full`}></div>
            <div className={`w-1 h-1 ${colors.secondary} rounded-full`}></div>
          </div>
          
          {/* Content area */}
          <div className="space-y-1">
            <div className={`${colors.card} ${colors.border} border rounded px-2 py-1`}>
              <div className={`w-8 h-1 ${colors.primary} rounded`}></div>
            </div>
            <div className={`${colors.card} ${colors.border} border rounded px-2 py-1 flex space-x-1`}>
              <div className={`w-4 h-1 ${colors.secondary} rounded`}></div>
              <div className={`w-6 h-1 ${colors.secondary} rounded`}></div>
            </div>
          </div>
        </div>
        
        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute top-1 right-1">
            <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
        )}
      </div>

      {/* Theme info */}
      <div>
        <p className="font-medium text-sm text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  )
}