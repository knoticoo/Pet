'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { AuthGuard } from '@/components/AuthGuard'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Edit, Calendar, Heart, MapPin, Phone, Mail, Trash2, Sparkles, Camera, Activity, TrendingUp, Bell, Share2, Star, Brain, Zap, Target, Users, Award, Clock, AlertCircle, CheckCircle, Info } from 'lucide-react'
import Link from 'next/link'
import { t } from '@/lib/translations'
import { VirtualPet } from '@/components/pets/VirtualPet'
import { PetPhotoGallery } from '@/components/pets/PetPhotoGallery'

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
  // New enhanced fields
  weight?: number
  height?: number
  color?: string
  personality?: string
  favoriteFood?: string
  favoriteToy?: string
  specialNeeds?: string
  temperament?: string
  trainingLevel?: string
  socialBehavior?: string
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

interface PetInsights {
  healthStatus: {
    status: string
    lastCheckup: string | null
    vaccinations: number
    recommendations: string[]
  }
  activityLevel: {
    level: string
    weeklyDuration: number
    recommendations: string[]
  }
  careRecommendations: string[]
  upcomingEvents: any[]
  funFacts: string[]
}

export default function PetDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [pet, setPet] = useState<Pet | null>(null)
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([])
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [insights, setInsights] = useState<PetInsights | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'photos' | 'health' | 'activities'>('overview')

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

      // Fetch AI insights
      const insightsResponse = await fetch(`/api/pets/${petId}/companion`)
      if (insightsResponse.ok) {
        const insightsData = await insightsResponse.json()
        setInsights(insightsData)
      }

    } catch (error) {
      console.error('Error fetching pet details:', error)
      setError('Failed to load pet details')
    } finally {
      setLoading(false)
    }
  }

  const handlePetInteraction = async (interactionType: string) => {
    try {
      const response = await fetch(`/api/pets/${petId}/companion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interactionType })
      })
      
      if (response.ok) {
        return await response.json()
      } else {
        throw new Error('Interaction failed')
      }
    } catch (error) {
      console.error('Error interacting with pet:', error)
      return {
        message: 'Hello! I love spending time with you!',
        mood: 'happy',
        action: 'looks at you with love'
      }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100'
      case 'monitoring': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
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
        {/* Modern Header with Hero Section */}
        <div className="relative">
          {/* Background gradient */}
          <div className={`absolute inset-0 bg-gradient-to-r ${getGradientColor(pet.species)} rounded-lg opacity-10`}></div>
          
          <div className="relative p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <Link href="/pets">
                <Button variant="outline" size="sm" className="bg-white/80 backdrop-blur-sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Pets
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" className="bg-white/80 backdrop-blur-sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Link href={`/pets/${pet.id}/edit`}>
                  <Button variant="outline" size="sm" className="bg-white/80 backdrop-blur-sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </Link>
                <Button variant="destructive" size="sm" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
              {/* Pet Avatar */}
              <div className="relative">
                <div className={`w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br ${getGradientColor(pet.species)} rounded-2xl flex items-center justify-center shadow-lg`}>
                  {pet.photo ? (
                    <img src={pet.photo} alt={pet.name} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <Heart className="h-12 w-12 md:h-16 md:w-16 text-white" />
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-lg">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                </div>
              </div>

              {/* Pet Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground">{pet.name}</h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium text-white bg-gradient-to-r ${getGradientColor(pet.species)}`}>
                    {pet.species}
                  </span>
                </div>
                <p className="text-lg text-muted-foreground mb-4">
                  {pet.breed} • {calculateAge(pet.birthDate)} years old • {pet.gender || 'Gender unknown'}
                </p>
                
                {/* Quick Stats */}
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Born {new Date(pet.birthDate).toLocaleDateString()}</span>
                  </div>
                  {pet.adoptionDate && (
                    <div className="flex items-center space-x-2">
                      <Heart className="h-4 w-4 text-red-500" />
                      <span>Adopted {new Date(pet.adoptionDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {pet.microchipNumber && (
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span>Chip: {pet.microchipNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: Heart },
              { id: 'photos', label: 'Photos', icon: Camera },
              { id: 'health', label: 'Health', icon: Activity },
              { id: 'activities', label: 'Activities', icon: TrendingUp }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* AI Pet Companion */}
            <VirtualPet pet={pet} onInteraction={handlePetInteraction} />

            {/* AI Insights */}
            {insights && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Health Status */}
                <div className="card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Activity className="h-6 w-6 text-green-600" />
                    <h3 className="text-lg font-semibold text-foreground">Health Status</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(insights.healthStatus.status)}`}>
                        {insights.healthStatus.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Vaccinations</span>
                      <span className="text-sm font-medium">{insights.healthStatus.vaccinations}</span>
                    </div>
                    {insights.healthStatus.lastCheckup && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Last Checkup</span>
                        <span className="text-sm">{new Date(insights.healthStatus.lastCheckup).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Activity Level */}
                <div className="card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                    <h3 className="text-lg font-semibold text-foreground">Activity Level</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Level</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(insights.activityLevel.level)}`}>
                        {insights.activityLevel.level}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Weekly Activity</span>
                      <span className="text-sm font-medium">{insights.activityLevel.weeklyDuration} min</span>
                    </div>
                  </div>
                </div>

                {/* Care Recommendations */}
                <div className="card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Brain className="h-6 w-6 text-purple-600" />
                    <h3 className="text-lg font-semibold text-foreground">AI Recommendations</h3>
                  </div>
                  <div className="space-y-2">
                    {insights.careRecommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-muted-foreground">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Pet Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Basic Info */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Basic Information
                </h3>
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

              {/* Enhanced Details */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Enhanced Details
                </h3>
                <div className="space-y-3">
                  {pet.weight && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Weight</label>
                      <p className="text-foreground">{pet.weight} kg</p>
                    </div>
                  )}
                  {pet.height && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Height</label>
                      <p className="text-foreground">{pet.height} cm</p>
                    </div>
                  )}
                  {pet.color && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Color</label>
                      <p className="text-foreground">{pet.color}</p>
                    </div>
                  )}
                  {pet.temperament && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Temperament</label>
                      <p className="text-foreground capitalize">{pet.temperament}</p>
                    </div>
                  )}
                  {pet.personality && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Personality</label>
                      <p className="text-foreground">{pet.personality}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Preferences */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Preferences
                </h3>
                <div className="space-y-3">
                  {pet.favoriteFood && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Favorite Food</label>
                      <p className="text-foreground">{pet.favoriteFood}</p>
                    </div>
                  )}
                  {pet.favoriteToy && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Favorite Toy</label>
                      <p className="text-foreground">{pet.favoriteToy}</p>
                    </div>
                  )}
                  {pet.trainingLevel && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Training Level</label>
                      <p className="text-foreground capitalize">{pet.trainingLevel}</p>
                    </div>
                  )}
                  {pet.socialBehavior && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Social Behavior</label>
                      <p className="text-foreground">{pet.socialBehavior}</p>
                    </div>
                  )}
                  {pet.specialNeeds && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Special Needs</label>
                      <p className="text-foreground">{pet.specialNeeds}</p>
                    </div>
                  )}
                </div>
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Link href={`/appointments/new?petId=${pet.id}`}>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Appointment
                  </Button>
                </Link>
                <Link href={`/reminders/new?petId=${pet.id}`}>
                  <Button variant="outline" className="w-full justify-start">
                    <Bell className="h-4 w-4 mr-2" />
                    Add Reminder
                  </Button>
                </Link>
                <Link href={`/ai-vet/consultation?petId=${pet.id}`}>
                  <Button variant="outline" className="w-full justify-start">
                    <Brain className="h-4 w-4 mr-2" />
                    AI Vet Consultation
                  </Button>
                </Link>
                <Link href={`/expenses/new?petId=${pet.id}`}>
                  <Button variant="outline" className="w-full justify-start">
                    <Activity className="h-4 w-4 mr-2" />
                    Add Expense
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'photos' && (
          <PetPhotoGallery petId={pet.id} petName={pet.name} />
        )}

        {activeTab === 'health' && (
          <div className="space-y-6">
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
        )}

        {activeTab === 'activities' && (
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Activities</h3>
            <p className="text-muted-foreground">Activity tracking coming soon...</p>
          </div>
        )}
      </div>
    </AuthGuard>
  )
}