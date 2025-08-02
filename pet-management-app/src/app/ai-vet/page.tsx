'use client'

import { useState, useEffect } from 'react'
import { useAuthenticatedSession } from '@/hooks/useAuthenticatedSession'
import { AuthGuard } from '@/components/AuthGuard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Stethoscope, 
  Brain, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Heart,
  Sparkles,
  Crown,
  Zap
} from 'lucide-react'
import Link from 'next/link'
import { t } from '@/lib/translations'

interface ConsultationStatus {
  canConsult: boolean
  remaining: number
  systemStatus: string
  systemHealth: {
    ollamaAvailable: boolean
    modelLoaded: boolean
    systemHealth: 'good' | 'degraded' | 'down'
    activeEndpoint: string | null
  }
  freeLimit: number
  premiumPrice: string
}

interface Pet {
  id: string
  name: string
  species: string
  breed: string
}

export default function AIVetPage() {
  const { session } = useAuthenticatedSession()
  const [status, setStatus] = useState<ConsultationStatus | null>(null)
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.id) {
      loadData()
    }
  }, [session])

  const loadData = async () => {
    try {
      const [statusRes, petsRes] = await Promise.all([
        fetch('/api/ai-vet/consultation'),
        fetch('/api/pets')
      ])

      if (statusRes.ok) {
        const statusData = await statusRes.json()
        setStatus(statusData)
      }

      if (petsRes.ok) {
        const petsData = await petsRes.json()
        setPets(petsData)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSystemHealthColor = (health: string) => {
    switch (health) {
      case 'good': return 'text-green-600 bg-green-100'
      case 'degraded': return 'text-yellow-600 bg-yellow-100'
      case 'down': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t('aiVet.title')}
            </h1>
            <Sparkles className="h-6 w-6 text-purple-500" />
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('aiVet.subtitle')}
            <span className="font-semibold text-red-600"> Не является заменой профессиональной ветеринарной помощи.</span>
          </p>
        </div>

        {/* System Status */}
        {status && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-4">
              <div className="flex items-center space-x-3">
                <Zap className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">AI System</p>
                  <Badge className={getSystemHealthColor(status.systemHealth.systemHealth)}>
                    {status.systemHealth.systemHealth.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">{t('subscription.consultationsLeft')}</p>
                  <p className="text-2xl font-bold text-green-600">
                    {status.remaining === 999 ? '∞' : status.remaining}
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center space-x-3">
                <Crown className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="font-medium">Plan</p>
                  <Badge variant={status.remaining === 999 ? "default" : "secondary"}>
                    {status.remaining === 999 ? t('subscription.premium') : t('subscription.free')}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Start Consultation */}
          <div className="card p-6">
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <Stethoscope className="h-6 w-6 text-blue-500" />
                <h2 className="text-xl font-semibold">Start New Consultation</h2>
              </div>

              {pets.length === 0 ? (
                <div className="text-center py-8 space-y-4">
                  <Heart className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div>
                    <h3 className="font-medium text-foreground mb-2">No pets found</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add a pet first to start using AI consultations
                    </p>
                    <Link href="/pets/new">
                      <Button>Add Your First Pet</Button>
                    </Link>
                  </div>
                </div>
              ) : status?.canConsult ? (
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Select a pet and describe their symptoms to get AI-powered health insights.
                  </p>
                  <Link href="/ai-vet/consultation">
                    <Button className="w-full" size="lg">
                      <Brain className="h-4 w-4 mr-2" />
                      Start AI Consultation
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
                  <div>
                    <h3 className="font-medium text-foreground mb-2">{t('subscription.consultationLimit')}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t('subscription.consultationLimitDescription')}
                    </p>
                    <Link href="/subscription/upgrade">
                      <Button>
                        <Crown className="h-4 w-4 mr-2" />
                        {t('subscription.upgradeToPremium')}
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Features & Benefits */}
          <div className="card p-6">
            <div className="space-y-6">
              <h2 className="text-xl font-semibold flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <span>AI Features</span>
              </h2>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Instant Analysis</h4>
                    <p className="text-sm text-muted-foreground">
                      Get immediate preliminary assessments of your pet&apos;s symptoms
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Emergency Detection</h4>
                    <p className="text-sm text-muted-foreground">
                      AI automatically identifies urgent situations requiring immediate care
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Breed-Specific Insights</h4>
                    <p className="text-sm text-muted-foreground">
                      Recommendations tailored to your pet&apos;s breed and age
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Care Recommendations</h4>
                    <p className="text-sm text-muted-foreground">
                      Practical home care tips and next steps
                    </p>
                  </div>
                </div>
              </div>

              {status?.remaining !== 999 && (
                <div className="border-t pt-4">
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-purple-900 mb-2">{t('subscription.upgradeToPremium')}</h4>
                    <ul className="text-sm text-purple-800 space-y-1 mb-3">
                      <li>• {t('subscription.unlimitedConsultations')}</li>
                      <li>• {t('subscription.photoAnalysis')}</li>
                      <li>• {t('subscription.prioritySupport')}</li>
                      <li>• {t('subscription.advancedReports')}</li>
                    </ul>
                    <Link href="/subscription/upgrade">
                      <Button size="sm" className="w-full">
                        <Crown className="h-4 w-4 mr-2" />
                        {t('subscription.upgrade')} - ${status?.premiumPrice}/{t('subscription.monthlyPrice')}
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Consultations */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-500" />
            <span>Recent Consultations</span>
          </h2>
          
          <div className="text-center py-8 text-muted-foreground">
            <p>Your consultation history will appear here</p>
            <Link href="/ai-vet/history" className="text-primary hover:underline text-sm">
              View full history →
            </Link>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Important Disclaimer</p>
              <p>
                This AI consultation tool provides preliminary guidance only and is not a substitute 
                for professional veterinary care. Always consult with a qualified veterinarian for 
                proper diagnosis and treatment. In case of emergency, contact your emergency vet immediately.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}