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
  const [language, setLanguage] = useState('en')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState('')

  // Language-specific text
  const getText = (key: string) => {
    const texts: Record<string, Record<string, string>> = {
      en: {
        title: 'AI Vet Consultation',
        subtitle: 'Describe your pet\'s symptoms for AI analysis',
        selectPet: 'Select Pet *',
        choosePet: 'Choose a pet',
        describeSymptoms: 'Describe Symptoms *',
        symptomsPlaceholder: 'Describe what you\'ve observed... (e.g., limping, vomiting, lethargy, loss of appetite)',
        symptomsHelp: 'Be as detailed as possible. Include behavior changes, eating habits, and any visible symptoms.',
        duration: 'How long have you noticed these symptoms? *',
        selectDuration: 'Select duration',
        analyzing: 'Analyzing Symptoms...',
        analyze: 'Analyze Symptoms',
        language: 'Language',
        fillForm: 'Fill out the form to get AI analysis of your pet\'s symptoms',
        results: 'AI Analysis Results',
        urgencyScore: 'Urgency Score',
        emergency: 'Emergency Situation',
        emergencyText: 'This appears to be an emergency. Contact your veterinarian or emergency clinic immediately.',
        possibleCauses: 'Possible Causes',
        careRecommendations: 'Care Recommendations',
        nextSteps: 'Next Steps',
        vetRecommended: 'Veterinary Care Recommended',
        vetRecommendedText: 'Based on the symptoms, we recommend scheduling a veterinary appointment for proper diagnosis and treatment.',
        scheduleAppointment: 'Schedule Appointment',
        newConsultation: 'New Consultation',
        disclaimer: 'Medical Disclaimer',
        disclaimerText: 'This AI analysis is for informational purposes only and should not replace professional veterinary advice. Always consult with a qualified veterinarian for proper diagnosis and treatment.'
      },
      ru: {
        title: 'ИИ Ветеринарная Консультация',
        subtitle: 'Опишите симптомы вашего питомца для анализа ИИ',
        selectPet: 'Выберите питомца *',
        choosePet: 'Выберите питомца',
        describeSymptoms: 'Опишите симптомы *',
        symptomsPlaceholder: 'Опишите что вы наблюдали... (например, хромота, рвота, вялость, потеря аппетита)',
        symptomsHelp: 'Будьте максимально подробными. Включите изменения в поведении, привычки питания и любые видимые симптомы.',
        duration: 'Как долго вы замечаете эти симптомы? *',
        selectDuration: 'Выберите длительность',
        analyzing: 'Анализ симптомов...',
        analyze: 'Анализировать симптомы',
        language: 'Язык',
        fillForm: 'Заполните форму, чтобы получить анализ симптомов вашего питомца от ИИ',
        results: 'Результаты анализа ИИ',
        urgencyScore: 'Оценка срочности',
        emergency: 'Экстренная ситуация',
        emergencyText: 'Это похоже на экстренную ситуацию. Немедленно обратитесь к ветеринару или в экстренную клинику.',
        possibleCauses: 'Возможные причины',
        careRecommendations: 'Рекомендации по уходу',
        nextSteps: 'Следующие шаги',
        vetRecommended: 'Рекомендуется ветеринарная помощь',
        vetRecommendedText: 'На основании симптомов мы рекомендуем записаться к ветеринару для правильной диагностики и лечения.',
        scheduleAppointment: 'Записаться на прием',
        newConsultation: 'Новая консультация',
        disclaimer: 'Медицинский отказ от ответственности',
        disclaimerText: 'Этот анализ ИИ предназначен только для информационных целей и не должен заменять профессиональную ветеринарную консультацию. Всегда консультируйтесь с квалифицированным ветеринаром для правильной диагностики и лечения.'
      }
    }
    return texts[language]?.[key] || texts.en[key] || key
  }

  const getDurationOptions = () => {
    if (language === 'ru') {
      return [
        { value: '', label: 'Выберите длительность' },
        { value: 'менее 1 часа', label: 'Менее 1 часа' },
        { value: '1-6 часов', label: '1-6 часов' },
        { value: '6-24 часа', label: '6-24 часа' },
        { value: '1-2 дня', label: '1-2 дня' },
        { value: '3-7 дней', label: '3-7 дней' },
        { value: '1-2 недели', label: '1-2 недели' },
        { value: 'более 2 недель', label: 'Более 2 недель' }
      ]
    }
    return [
      { value: '', label: 'Select duration' },
      { value: 'less than 1 hour', label: 'Less than 1 hour' },
      { value: '1-6 hours', label: '1-6 hours' },
      { value: '6-24 hours', label: '6-24 hours' },
      { value: '1-2 days', label: '1-2 days' },
      { value: '3-7 days', label: '3-7 days' },
      { value: '1-2 weeks', label: '1-2 weeks' },
      { value: 'more than 2 weeks', label: 'More than 2 weeks' }
    ]
  }

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
      setError(language === 'ru' ? 'Пожалуйста, заполните все обязательные поля' : 'Please fill in all required fields')
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
          language,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setAnalysis(data.analysis)
      } else {
        if (response.status === 429) {
          const upgradeText = language === 'ru' 
            ? ' Рассмотрите возможность обновления до премиума для неограниченных консультаций.'
            : ' Consider upgrading to premium for unlimited consultations.'
          setError(data.error + upgradeText)
        } else {
          setError(data.error || (language === 'ru' ? 'Не удалось проанализировать симптомы' : 'Failed to analyze symptoms'))
        }
      }
    } catch (error) {
      setError(language === 'ru' ? 'Ошибка сети. Попробуйте еще раз.' : 'Network error. Please try again.')
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
              <span>{getText('title')}</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              {getText('subtitle')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="card p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="language" className="block text-sm font-medium text-foreground mb-2">
                  {getText('language')}
                </label>
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="en">🇺🇸 English</option>
                  <option value="ru">🇷🇺 Русский</option>
                </select>
              </div>

              <div>
                <label htmlFor="pet" className="block text-sm font-medium text-foreground mb-2">
                  {getText('selectPet')}
                </label>
                <select
                  id="pet"
                  value={selectedPet}
                  onChange={(e) => setSelectedPet(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                >
                  <option value="">{getText('choosePet')}</option>
                  {pets.map((pet) => (
                    <option key={pet.id} value={pet.id}>
                      {pet.name} ({pet.species} - {pet.breed})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="symptoms" className="block text-sm font-medium text-foreground mb-2">
                  {getText('describeSymptoms')}
                </label>
                <textarea
                  id="symptoms"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder={getText('symptomsPlaceholder')}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {getText('symptomsHelp')}
                </p>
              </div>

              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-foreground mb-2">
                  {getText('duration')}
                </label>
                <select
                  id="duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                >
                  {getDurationOptions().map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
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
                          {t('subscription.upgradeNow')}
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
                    {getText('analyzing')}
                  </>
                ) : (
                  <>
                    <Stethoscope className="h-4 w-4 mr-2" />
                    {getText('analyze')}
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
                  <h3 className="text-lg font-semibold">{getText('results')}</h3>
                  <Badge className={getSeverityColor(analysis.severity)}>
                    {analysis.severity.toUpperCase()}
                  </Badge>
                </div>

                {/* Urgency Score */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium">{getText('urgencyScore')}</span>
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
                        <h4 className="font-medium text-red-900">{getText('emergency')}</h4>
                        <p className="text-sm text-red-800 mt-1">
                          {getText('emergencyText')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Possible Causes */}
                <div>
                  <h4 className="font-medium mb-3">{getText('possibleCauses')}</h4>
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
                  <h4 className="font-medium mb-3">{getText('careRecommendations')}</h4>
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
                  <h4 className="font-medium mb-3">{getText('nextSteps')}</h4>
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
                        <h4 className="font-medium text-amber-900">{getText('vetRecommended')}</h4>
                        <p className="text-sm text-amber-800 mt-1">
                          {getText('vetRecommendedText')}
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
                      {getText('scheduleAppointment')}
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
                    {getText('newConsultation')}
                  </Button>
                </div>
              </div>
            )}

            {!analysis && !isAnalyzing && (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{getText('fillForm')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">{getText('disclaimer')}</p>
              <p>
                {getText('disclaimerText')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}