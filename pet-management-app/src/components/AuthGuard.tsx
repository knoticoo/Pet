'use client'

import { useFeatures } from '@/hooks/useFeatures'
import { Heart } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, loading } = useFeatures()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Heart className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <Heart className="h-16 w-16 text-primary mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-foreground mb-4">Welcome to PetCare</h1>
          <p className="text-muted-foreground mb-8 text-lg">
            Your comprehensive pet management system. Sign in to manage your pets, track their health, and never miss an important appointment.
          </p>
          <div className="space-y-4">
            <Link href="/auth/signin">
              <Button size="lg" className="w-full">
                Sign In to Get Started
              </Button>
            </Link>
            <div className="text-sm text-muted-foreground">
              <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md">
                <strong>Demo Admin Account:</strong><br />
                Email: alinovskis@me.com<br />
                Password: Millie1991
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}