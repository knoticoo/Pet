'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { AuthGuard } from '@/components/AuthGuard'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Edit, Calendar, Heart, MapPin, Phone, Mail, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { t } from '@/lib/translations'

interface Pet {
  id: string
  name: string
  species: string
  breed: string
  gender?: string
  birthDate: string
  adoptionDate?: string
  microchipNumber?: string
  photo?: string
  description?: string
  isActive: boolean
}

interface HealthRecord {
  id: string
  title: string
  description?: string
  date: string
  vetName?: string
  diagnosis?: string
  treatment?: string
  notes?: string
}

interface Vaccination {
  id: string
  vaccineName: string
  dateGiven: string
  nextDueDate?: string
  batchNumber?: string
  vetName?: string
  notes?: string
}

interface Appointment {
  id: string
  title: string
  description?: string
  date: string
  duration?: number
  location?: string
  vetName?: string
  appointmentType?: string
  status: string
}

export default function PetDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [pet, setPet] = useState<Pet | null>(null)
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([])
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const petId = params.id as string

  useEffect(() => {
    if (session?.user?.id && petId) {
      fetchPetDetails()
    }
  }, [session, petId])

  const fetchPetDetails = async () => {
    try {
      setLoading(true)
      
      // Fetch pet details
      const petResponse = await fetch(`/api/pets/${petId}`)
      if (petResponse.ok) {
        const petData = await petResponse.json()
        setPet(petData)
      } else if (petResponse.status === 404) {
        setError('Pet not found')
        return
      }

      // Fetch health records
      const healthResponse = await fetch(`/api/pets/${petId}/health`)
      if (healthResponse.ok) {
        const healthData = await healthResponse.json()
        setHealthRecords(healthData)
      }

      // Fetch vaccinations
      const vaccinationResponse = await fetch(`/api/pets/${petId}/vaccinations`)
      if (vaccinationResponse.ok) {
        const vaccinationData = await vaccinationResponse.json()
        setVaccinations(vaccinationData)
      }

      // Fetch appointments
      const appointmentResponse = await fetch(`/api/pets/${petId}/appointments`)
      if (appointmentResponse.ok) {
        const appointmentData = await appointmentResponse.json()
        setAppointments(appointmentData)
      }

    } catch (error) {
      console.error('Error fetching pet details:', error)
      setError('Failed to load pet details')
    } finally {
      setLoading(false)
    }
  }

  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    const age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return Math.max(0, age - 1)
    }
    return age
  }

  const getGradientColor = (species: string) => {
    switch (species?.toLowerCase()) {
      case 'dog':
        return 'from-blue-400 to-blue-600'
      case 'cat':
        return 'from-purple-400 to-purple-600'
      case 'bird':
        return 'from-green-400 to-green-600'
      case 'fish':
        return 'from-cyan-400 to-cyan-600'
      default:
        return 'from-pink-400 to-pink-600'
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this pet? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/pets/${petId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/pets')
      } else {
        setError('Failed to delete pet')
      }
    } catch (error) {
      console.error('Error deleting pet:', error)
      setError('Failed to delete pet')
    }
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading pet details...</p>
        </div>
      </AuthGuard>
    )
  }

  if (error || !pet) {
    return (
      <AuthGuard>
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <Heart className="h-16 w-16 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{error || 'Pet not found'}</h3>
            <p className="text-muted-foreground mb-6">
              The pet you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Link href="/pets">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Pets
              </Button>
            </Link>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/pets">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Pets
              </Button>
            </Link>
            <div className={`w-16 h-16 bg-gradient-to-br ${getGradientColor(pet.species)} rounded-full flex items-center justify-center`}>
              <Heart className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{pet.name}</h1>
              <p className="text-muted-foreground">
                {pet.breed} • {calculateAge(pet.birthDate)} years old
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Link href={`/pets/${pet.id}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Pet Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Basic Info */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Basic Information</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Species</label>
                <p className="text-foreground">{pet.species}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Breed</label>
                <p className="text-foreground">{pet.breed}</p>
              </div>
              {pet.gender && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Gender</label>
                  <p className="text-foreground capitalize">{pet.gender}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Birth Date</label>
                <p className="text-foreground">{new Date(pet.birthDate).toLocaleDateString()}</p>
              </div>
              {pet.adoptionDate && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Adoption Date</label>
                  <p className="text-foreground">{new Date(pet.adoptionDate).toLocaleDateString()}</p>
                </div>
              )}
              {pet.microchipNumber && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Microchip Number</label>
                  <p className="text-foreground">{pet.microchipNumber}</p>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {pet.description && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Description</h3>
              <p className="text-muted-foreground">{pet.description}</p>
            </div>
          )}

          {/* Quick Actions */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link href={`/appointments/new?petId=${pet.id}`}>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Appointment
                </Button>
              </Link>
              <Link href={`/reminders/new?petId=${pet.id}`}>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Add Reminder
                </Button>
              </Link>
              <Link href={`/ai-vet/consultation?petId=${pet.id}`}>
                <Button variant="outline" className="w-full justify-start">
                  <Heart className="h-4 w-4 mr-2" />
                  AI Vet Consultation
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Health Records */}
        {healthRecords.length > 0 && (
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Health Records</h3>
            <div className="space-y-4">
              {healthRecords.map((record) => (
                <div key={record.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-foreground">{record.title}</h4>
                    <span className="text-sm text-muted-foreground">
                      {new Date(record.date).toLocaleDateString()}
                    </span>
                  </div>
                  {record.description && (
                    <p className="text-muted-foreground text-sm mb-2">{record.description}</p>
                  )}
                  {record.vetName && (
                    <p className="text-sm text-muted-foreground">Vet: {record.vetName}</p>
                  )}
                  {record.diagnosis && (
                    <p className="text-sm text-muted-foreground">Diagnosis: {record.diagnosis}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vaccinations */}
        {vaccinations.length > 0 && (
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Vaccinations</h3>
            <div className="space-y-4">
              {vaccinations.map((vaccination) => (
                <div key={vaccination.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-foreground">{vaccination.vaccineName}</h4>
                    <span className="text-sm text-muted-foreground">
                      {new Date(vaccination.dateGiven).toLocaleDateString()}
                    </span>
                  </div>
                  {vaccination.nextDueDate && (
                    <p className="text-sm text-muted-foreground">
                      Next due: {new Date(vaccination.nextDueDate).toLocaleDateString()}
                    </p>
                  )}
                  {vaccination.vetName && (
                    <p className="text-sm text-muted-foreground">Vet: {vaccination.vetName}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Appointments */}
        {appointments.length > 0 && (
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Appointments</h3>
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div key={appointment.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-foreground">{appointment.title}</h4>
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {appointment.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {new Date(appointment.date).toLocaleDateString()} at {new Date(appointment.date).toLocaleTimeString()}
                  </p>
                  {appointment.description && (
                    <p className="text-sm text-muted-foreground mb-2">{appointment.description}</p>
                  )}
                  {appointment.vetName && (
                    <p className="text-sm text-muted-foreground">Vet: {appointment.vetName}</p>
                  )}
                  {appointment.location && (
                    <p className="text-sm text-muted-foreground">Location: {appointment.location}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  )
}