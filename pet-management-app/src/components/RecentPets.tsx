'use client'

import { Heart, Calendar, MapPin, Plus } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

// Mock data - in a real app, this would come from your database
const mockPets = [
  {
    id: '1',
    name: 'Pet 1',
    species: 'dog',
    breed: 'Golden Retriever',
    age: 3,
    lastVisit: new Date('2024-01-15'),
    nextAppointment: new Date('2024-03-15')
  },
  {
    id: '2',
    name: 'Pet 2',
    species: 'cat',
    breed: 'Persian',
    age: 2,
    lastVisit: new Date('2024-01-10'),
    nextAppointment: new Date('2024-02-20')
  },
  {
    id: '3',
    name: 'Pet 3',
    species: 'dog',
    breed: 'Labrador Mix',
    age: 1,
    lastVisit: new Date('2024-01-05'),
    nextAppointment: new Date('2024-02-25')
  }
]

export function RecentPets() {
  const getAgeInYears = (pet: any) => {
    return pet.age
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  if (mockPets.length === 0) {
    return (
      <div className="text-center py-8">
        <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No pets yet</h3>
        <p className="text-muted-foreground mb-4">
          Add your first pet to start tracking their care
        </p>
        <Link href="/pets/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Pet
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {mockPets.slice(0, 3).map((pet) => (
        <Link key={pet.id} href={`/pets/${pet.id}`}>
          <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-foreground">{pet.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {pet.breed} • {getAgeInYears(pet)} years old
                </p>
              </div>
            </div>
            <div className="text-right">
              {pet.nextAppointment ? (
                <div className="text-sm">
                  <p className="text-muted-foreground">Next visit</p>
                  <p className="font-medium text-foreground">
                    {formatDate(pet.nextAppointment)}
                  </p>
                </div>
              ) : (
                <div className="text-sm">
                  <p className="text-muted-foreground">Last visit</p>
                  <p className="font-medium text-foreground">
                    {formatDate(pet.lastVisit)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Link>
      ))}
      
      {mockPets.length > 3 && (
        <div className="text-center pt-4">
          <Link href="/pets">
            <Button variant="outline" size="sm">
              View All Pets ({mockPets.length})
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}