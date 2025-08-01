'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/AuthGuard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft,
  Brain, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Stethoscope,
  Heart,
  Upload,
  Loader2,
  Crown
} from 'lucide-react'
import Link from 'next/link'

interface Pet {
  id: string
  name: string
  species: string
  breed: string
  birthDate: string
}

interface AnalysisResult {
  severity: 'low' | 'medium' | 'high' | 'emergency'
  recommendations: string[]
  nextSteps: string[]
  urgency: number
  shouldSeeVet: boolean
  estimatedCause: string[]
}

export default function ConsultationPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [pets, setPets] = useState<Pet[]>([])
  const [selectedPet, setSelectedPet] = useState('')
  const [symptoms, setSymptoms] = useState('')
  const [duration, setDuration] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (session?.user?.id) {
      loadPets()
    }
  }, [session])

  const loadPets = async () => {
    try {
      const response = await fetch('/api/pets')
      if (response.ok) {
        const data = await response.json()
        setPets(data)
      }
    } catch (error) {
      console.error('Error loading pets:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPet || !symptoms || !duration) {
      setError('Please fill in all required fields')
      return
    }

    setIsAnalyzing(true)
    setError('')
    setAnalysis(null)

    try {
      const response = await fetch('/api/ai-vet/consultation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          petId: selectedPet,
          symptoms,
          duration,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setAnalysis(data.analysis)
      } else {
        if (response.status === 429) {
          setError(data.error + ' Consider upgrading to premium for unlimited consultations.')
        } else {
          setError(data.error || 'Failed to analyze symptoms')
        }
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'emergency': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getUrgencyColor = (urgency: number) => {
    if (urgency >= 8) return 'text-red-600'
    if (urgency >= 6) return 'text-orange-600'
    if (urgency >= 4) return 'text-yellow-600'
    return 'text-green-600'
  }

  const selectedPetData = pets.find(p => p.id === selectedPet)

  return (
    <AuthGuard>
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/ai-vet">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center space-x-2">
              <Brain className="h-6 w-6 text-blue-500" />
              <span>AI Vet Consultation</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Describe your pet's symptoms for AI analysis
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="card p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="pet" className="block text-sm font-medium text-foreground mb-2">
                  Select Pet *
                </label>
                <select
                  id="pet"
                  value={selectedPet}
                  onChange={(e) => setSelectedPet(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                >
                  <option value="">Choose a pet</option>
                  {pets.map((pet) => (
                    <option key={pet.id} value={pet.id}>
                      {pet.name} ({pet.species} - {pet.breed})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="symptoms" className="block text-sm font-medium text-foreground mb-2">
                  Describe Symptoms *
                </label>
                <textarea
                  id="symptoms"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Describe what you've observed... (e.g., limping, vomiting, lethargy, loss of appetite)"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Be as detailed as possible. Include behavior changes, eating habits, and any visible symptoms.
                </p>
              </div>

              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-foreground mb-2">
                  How long have you noticed these symptoms? *
                </label>
                <select
                  id="duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                >
                  <option value="">Select duration</option>
                  <option value="less than 1 hour">Less than 1 hour</option>
                  <option value="1-6 hours">1-6 hours</option>
                  <option value="6-24 hours">6-24 hours</option>
                  <option value="1-2 days">1-2 days</option>
                  <option value="3-7 days">3-7 days</option>
                  <option value="1-2 weeks">1-2 weeks</option>
                  <option value="more than 2 weeks">More than 2 weeks</option>
                </select>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {error}
                  {error.includes('limit') && (
                    <div className="mt-2">
                      <Link href="/subscription/upgrade">
                        <Button size="sm" variant="outline">
                          <Crown className="h-4 w-4 mr-2" />
                          Upgrade Now
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isAnalyzing}>
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing Symptoms...
                  </>
                ) : (
                  <>
                    <Stethoscope className="h-4 w-4 mr-2" />
                    Analyze Symptoms
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Results */}
          <div className="card p-6">
            {selectedPetData && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Selected Pet</h3>
                <div className="flex items-center space-x-3">
                  <Heart className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">{selectedPetData.name}</p>
                    <p className="text-sm text-blue-700">
                      {selectedPetData.species} • {selectedPetData.breed}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isAnalyzing && (
              <div className="text-center py-8">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
                <h3 className="font-medium text-foreground mb-2">Analyzing Symptoms</h3>
                <p className="text-sm text-muted-foreground">
                  Our AI is processing your pet's symptoms...
                </p>
              </div>
            )}

            {analysis && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">AI Analysis Results</h3>
                  <Badge className={getSeverityColor(analysis.severity)}>
                    {analysis.severity.toUpperCase()}
                  </Badge>
                </div>

                {/* Urgency Score */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium">Urgency Score</span>
                  <span className={`text-2xl font-bold ${getUrgencyColor(analysis.urgency)}`}>
                    {analysis.urgency}/10
                  </span>
                </div>

                {/* Emergency Warning */}
                {analysis.severity === 'emergency' && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-red-900">Emergency Situation</h4>
                        <p className="text-sm text-red-800 mt-1">
                          This appears to be an emergency. Contact your veterinarian or emergency clinic immediately.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Possible Causes */}
                <div>
                  <h4 className="font-medium mb-3">Possible Causes</h4>
                  <ul className="space-y-2">
                    {analysis.estimatedCause.map((cause, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-sm">{cause}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommendations */}
                <div>
                  <h4 className="font-medium mb-3">Care Recommendations</h4>
                  <ul className="space-y-2">
                    {analysis.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Next Steps */}
                <div>
                  <h4 className="font-medium mb-3">Next Steps</h4>
                  <ul className="space-y-2">
                    {analysis.nextSteps.map((step, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
                          {index + 1}
                        </span>
                        <span className="text-sm">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Vet Recommendation */}
                {analysis.shouldSeeVet && (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <Stethoscope className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-amber-900">Veterinary Care Recommended</h4>
                        <p className="text-sm text-amber-800 mt-1">
                          Based on the symptoms, we recommend scheduling a veterinary appointment for proper diagnosis and treatment.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-3 pt-4 border-t">
                  <Link href="/appointments/new" className="flex-1">
                    <Button variant="outline" className="w-full">
                      <Clock className="h-4 w-4 mr-2" />
                      Schedule Appointment
                    </Button>
                  </Link>
                  <Button 
                    onClick={() => {
                      setAnalysis(null)
                      setSymptoms('')
                      setDuration('')
                      setSelectedPet('')
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    New Consultation
                  </Button>
                </div>
              </div>
            )}

            {!analysis && !isAnalyzing && (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Fill out the form to get AI analysis of your pet's symptoms</p>
              </div>
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Medical Disclaimer</p>
              <p>
                This AI analysis is for informational purposes only and should not replace professional veterinary advice. 
                Always consult with a qualified veterinarian for proper diagnosis and treatment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}