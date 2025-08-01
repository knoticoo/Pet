'use client'

import { useState, useEffect } from 'react'
import { Calendar, ArrowLeft, Clock, MapPin, User } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AuthGuard } from '@/components/AuthGuard'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface Pet {
  id: string
  name: string
  species: string
}

export default function NewAppointmentPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.id) {
      fetchPets()
    }
  }, [session])

  const fetchPets = async () => {
    try {
      const response = await fetch('/api/pets')
      if (response.ok) {
        const data = await response.json()
        setPets(data)
      }
    } catch (error) {
      console.error('Error fetching pets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    const formData = new FormData(e.currentTarget)
    const date = formData.get('date') as string
    const time = formData.get('time') as string
    
    // Combine date and time into a single datetime
    const appointmentDateTime = new Date(`${date}T${time}`)
    
    const appointmentData = {
      petId: formData.get('petId'),
      title: formData.get('title'),
      appointmentDate: appointmentDateTime.toISOString(),
      duration: parseInt(formData.get('duration') as string) || 60,
      appointmentType: formData.get('appointmentType'),
      veterinarian: formData.get('vetName'),
      location: formData.get('location'),
      notes: formData.get('description'),
    }
    
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      })

      if (response.ok) {
        // Successfully created appointment, redirect to appointments page
        router.push('/appointments')
      } else {
        const errorData = await response.json()
        console.error('Error creating appointment:', errorData)
        alert('Failed to create appointment. Please try again.')
      }
    } catch (error) {
      console.error('Error creating appointment:', error)
      alert('Failed to create appointment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthGuard>
      <div className="space-y-8 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/appointments">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Appointments
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Schedule Appointment</h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              Book a veterinary appointment for your pet.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="pet" className="block text-sm font-medium text-foreground mb-2">
                  Select Pet *
                </label>
                <select
                  id="pet"
                  name="petId"
                  required
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Choose a pet</option>
                  {pets.map((pet) => (
                    <option key={pet.id} value={pet.id}>
                      {pet.name} ({pet.species})
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
                  Appointment Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g., Annual Checkup, Vaccination, Dental Cleaning"
                />
              </div>

              <div>
                <label htmlFor="date" className="block text-sm font-medium text-foreground mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label htmlFor="time" className="block text-sm font-medium text-foreground mb-2">
                  Time *
                </label>
                <input
                  type="time"
                  id="time"
                  name="time"
                  required
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-foreground mb-2">
                  Duration (minutes)
                </label>
                <select
                  id="duration"
                  name="duration"
                  defaultValue="60"
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="90">1.5 hours</option>
                  <option value="120">2 hours</option>
                </select>
              </div>

              <div>
                <label htmlFor="appointmentType" className="block text-sm font-medium text-foreground mb-2">
                  Appointment Type
                </label>
                <select
                  id="appointmentType"
                  name="appointmentType"
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select type</option>
                  <option value="checkup">General Checkup</option>
                  <option value="vaccination">Vaccination</option>
                  <option value="surgery">Surgery</option>
                  <option value="dental">Dental Care</option>
                  <option value="grooming">Grooming</option>
                  <option value="emergency">Emergency</option>
                  <option value="follow-up">Follow-up</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="vetName" className="block text-sm font-medium text-foreground mb-2">
                  Veterinarian Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    id="vetName"
                    name="vetName"
                    className="w-full pl-10 pr-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Dr. Smith"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="location" className="block text-sm font-medium text-foreground mb-2">
                  Location/Clinic
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    id="location"
                    name="location"
                    className="w-full pl-10 pr-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Clinic name and address"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
                  Notes/Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Any additional notes about the appointment..."
                />
              </div>
            </div>

            <div className="flex space-x-4 pt-6">
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                <Calendar className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Scheduling...' : 'Schedule Appointment'}
              </Button>
              <Link href="/appointments" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </div>

        {/* Quick Scheduling Tips */}
        <div className="card p-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Scheduling Tips</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start space-x-2">
              <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Book routine checkups 2-3 weeks in advance</span>
            </li>
            <li className="flex items-start space-x-2">
              <Calendar className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Most clinics are less busy on weekday mornings</span>
            </li>
            <li className="flex items-start space-x-2">
              <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Bring your pet's medical history and current medications</span>
            </li>
          </ul>
        </div>
      </div>
    </AuthGuard>
  )
}