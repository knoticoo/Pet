'use client'

import { useState } from 'react'
import { Heart, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AuthGuard } from '@/components/AuthGuard'
import { useRouter } from 'next/navigation'

export default function NewPetPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    const formData = new FormData(e.currentTarget)
    const petData = {
      name: formData.get('name'),
      species: formData.get('species'),
      breed: formData.get('breed'),
      age: formData.get('age'),
      weight: formData.get('weight'),
      color: formData.get('color'),
      notes: formData.get('notes'),
    }
    
    // TODO: Implement actual pet creation API call
    // console.log('Creating pet:', petData)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setIsSubmitting(false)
    
    // Redirect back to pets page
    router.push('/pets')
  }

  return (
    <AuthGuard>
      <div className="space-y-8 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/pets">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Pets
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Add New Pet</h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              Enter your pet's information to start tracking their care.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                  Pet Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Enter pet's name"
                />
              </div>

              <div>
                <label htmlFor="species" className="block text-sm font-medium text-foreground mb-2">
                  Species *
                </label>
                <select
                  id="species"
                  name="species"
                  required
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select species</option>
                  <option value="dog">Dog</option>
                  <option value="cat">Cat</option>
                  <option value="bird">Bird</option>
                  <option value="rabbit">Rabbit</option>
                  <option value="hamster">Hamster</option>
                  <option value="fish">Fish</option>
                  <option value="reptile">Reptile</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="breed" className="block text-sm font-medium text-foreground mb-2">
                  Breed
                </label>
                <input
                  type="text"
                  id="breed"
                  name="breed"
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Enter breed (optional)"
                />
              </div>

              <div>
                <label htmlFor="age" className="block text-sm font-medium text-foreground mb-2">
                  Age
                </label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  min="0"
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Age in years"
                />
              </div>

              <div>
                <label htmlFor="weight" className="block text-sm font-medium text-foreground mb-2">
                  Weight
                </label>
                <input
                  type="number"
                  id="weight"
                  name="weight"
                  step="0.1"
                  min="0"
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Weight in lbs/kg"
                />
              </div>

              <div>
                <label htmlFor="color" className="block text-sm font-medium text-foreground mb-2">
                  Color/Markings
                </label>
                <input
                  type="text"
                  id="color"
                  name="color"
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Color and markings"
                />
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-foreground mb-2">
                Additional Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Any additional information about your pet..."
              />
            </div>

            <div className="flex space-x-4 pt-6">
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                <Heart className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Adding...' : 'Add Pet'}
              </Button>
              <Link href="/pets" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </AuthGuard>
  )
}