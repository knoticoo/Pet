'use client'

import Link from 'next/link'
import { Heart, Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-2">
            <Heart className="h-12 w-12 text-primary" />
            <span className="text-2xl font-bold text-foreground">PetCare</span>
          </div>
        </div>

        {/* 404 Error */}
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-foreground mb-4">Page Not Found</h2>
          <p className="text-muted-foreground mb-8">
            Oops! It looks like this page has wandered off like a curious pet. 
            Don't worry, we'll help you find your way back home.
          </p>
        </div>

        {/* Pet illustration placeholder */}
        <div className="mb-8">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-pink-200 to-purple-200 rounded-full flex items-center justify-center">
            <span className="text-4xl">🐕</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-4">
          <Link href="/" className="block">
            <Button className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </Link>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>

        {/* Help text */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Need help?</strong> If you think this page should exist, please check the URL or 
            contact support. Your pets are waiting for you on the dashboard!
          </p>
        </div>

        {/* Quick links */}
        <div className="mt-6">
          <p className="text-sm text-muted-foreground mb-3">Quick links:</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/pets" className="text-primary hover:text-primary/80">
              My Pets
            </Link>
            <Link href="/appointments" className="text-primary hover:text-primary/80">
              Appointments
            </Link>
            <Link href="/expenses" className="text-primary hover:text-primary/80">
              Expenses
            </Link>
            <Link href="/reminders" className="text-primary hover:text-primary/80">
              Reminders
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}