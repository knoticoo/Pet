'use client'

import { Heart, Calendar, MapPin } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

// Mock data - in a real app, this would come from your database
const mockPets = [
  {
    id: '1',
    name: 'Buddy',
    breed: 'Golden Retriever',
    species: 'Dog',
    photo: null,
    birthDate: new Date('2020-05-15'),
    nextAppointment: new Date('2024-02-15')
  },
  {
    id: '2',
    name: 'Whiskers',
    breed: 'Persian',
    species: 'Cat',
    photo: null,
    birthDate: new Date('2019-08-22'),
    nextAppointment: new Date('2024-02-20')
  },
  {
    id: '3',
    name: 'Charlie',
    breed: 'Beagle',
    species: 'Dog',
    photo: null,
    birthDate: new Date('2021-03-10'),
    nextAppointment: null
  }
]

export function RecentPets() {
  const getAge = (birthDate: Date) => {
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1
    }
    return age
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  if (mockPets.length === 0) {
    return (
      <div className="text-center py-8">
        <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No pets added yet</p>
        <Link 
          href="/pets/new"
          className="text-primary hover:underline text-sm mt-2 inline-block"
        >
          Add your first pet
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {mockPets.map((pet) => (
        <Link key={pet.id} href={`/pets/${pet.id}`}>
          <div className="flex items-center space-x-4 p-4 rounded-lg border hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex-shrink-0">
              {pet.photo ? (
                <Image
                  src={pet.photo}
                  alt={pet.name}
                  width={48}
                  height={48}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-medium text-foreground truncate">{pet.name}</h3>
                <span className="text-xs px-2 py-1 bg-secondary rounded-full text-secondary-foreground">
                  {pet.species}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {pet.breed} • {getAge(pet.birthDate)} years old
              </p>
              {pet.nextAppointment && (
                <div className="flex items-center space-x-1 mt-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Next: {formatDate(pet.nextAppointment)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}