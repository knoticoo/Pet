'use client'

import { useState, useEffect } from 'react'
import { useAuthenticatedSession } from '@/hooks/useAuthenticatedSession'

import { AuthGuard } from '@/components/AuthGuard'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft,
  Brain, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Stethoscope,
  Heart,
  Loader2,
  Crown,
  Zap,
  Target
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
  recommendations: (string | {
    title: string
    description?: string
    priority?: 'low' | 'medium' | 'high'
  })[]
  nextSteps: string[]
  urgency: number
  shouldSeeVet: boolean
  estimatedCause: string[]
  confidence?: number
  assessment?: string
  urgencyLevel?: string
  urgencyExplanation?: string
  possibleConditions?: Array<{
    name: string
    description?: string
    likelihood?: number
  }>
  followUpTimeline?: string
  followUpReason?: string
}

export default function ConsultationPage() {
  const { session } = useAuthenticatedSession()

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
    if (session?.user) {
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
      // Enhanced AI analysis with Ollama
      const response = await fetch('/api/ai/vet-consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petId: selectedPet,
          symptoms: symptoms,
          urgency: 0, // Placeholder, will be calculated by backend
          duration: duration,
          additionalInfo: '', // Placeholder
          enhancedAnalysis: true // Request enhanced Ollama analysis
        })
      })

      if (response.ok) {
        const result = await response.json()
        setAnalysis(result)
      } else {
        const error = await response.json()
        setError(error.message || (language === 'ru' ? 'Не удалось проанализировать симптомы' : 'Failed to analyze symptoms'))
      }
    } catch (error) {
      console.error('Error during consultation:', error)
      setError(language === 'ru' ? 'Ошибка сети. Попробуйте еще раз.' : 'Network error. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
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
                  Our AI is processing your pet&apos;s symptoms...
                </p>
              </div>
            )}

            {analysis && (
              <div className="space-y-6">
                {/* AI Confidence Score */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
                  <div className="flex items-center gap-3 mb-4">
                    <Brain className="h-6 w-6 text-purple-600" />
                    <h3 className="text-lg font-semibold text-purple-900">AI Analysis Results</h3>
                    {analysis.confidence && (
                      <div className="ml-auto">
                        <span className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                          {Math.round(analysis.confidence * 100)}% Confidence
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Primary Assessment */}
                  <div className="bg-white rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-600" />
                      Primary Assessment
                    </h4>
                    <p className="text-gray-700">{analysis.assessment}</p>
                  </div>

                  {/* Urgency Level */}
                  {analysis.urgencyLevel && (
                    <div className={`rounded-lg p-4 mb-4 ${
                      analysis.urgencyLevel === 'emergency' ? 'bg-red-50 border border-red-200' :
                      analysis.urgencyLevel === 'urgent' ? 'bg-orange-50 border border-orange-200' :
                      analysis.urgencyLevel === 'moderate' ? 'bg-yellow-50 border border-yellow-200' :
                      'bg-green-50 border border-green-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {analysis.urgencyLevel === 'emergency' && <AlertTriangle className="h-5 w-5 text-red-600" />}
                        {analysis.urgencyLevel === 'urgent' && <Clock className="h-5 w-5 text-orange-600" />}
                        {analysis.urgencyLevel === 'moderate' && <Zap className="h-5 w-5 text-yellow-600" />}
                        {analysis.urgencyLevel === 'low' && <CheckCircle className="h-5 w-5 text-green-600" />}
                        <h4 className={`font-semibold ${
                          analysis.urgencyLevel === 'emergency' ? 'text-red-800' :
                          analysis.urgencyLevel === 'urgent' ? 'text-orange-800' :
                          analysis.urgencyLevel === 'moderate' ? 'text-yellow-800' :
                          'text-green-800'
                        }`}>
                          {analysis.urgencyLevel.charAt(0).toUpperCase() + analysis.urgencyLevel.slice(1)} Priority
                        </h4>
                      </div>
                      <p className={`text-sm ${
                        analysis.urgencyLevel === 'emergency' ? 'text-red-700' :
                        analysis.urgencyLevel === 'urgent' ? 'text-orange-700' :
                        analysis.urgencyLevel === 'moderate' ? 'text-yellow-700' :
                        'text-green-700'
                      }`}>
                        {analysis.urgencyExplanation || 'Based on the symptoms described, this appears to be a routine concern.'}
                      </p>
                    </div>
                  )}

                  {/* Possible Conditions */}
                  {analysis.possibleConditions && analysis.possibleConditions.length > 0 && (
                    <div className="bg-white rounded-lg p-4 mb-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Possible Conditions</h4>
                      <div className="space-y-2">
                        {analysis.possibleConditions.map((condition: {name: string, description?: string, likelihood?: number}, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                            <div>
                              <span className="font-medium text-gray-900">{condition.name}</span>
                              {condition.description && (
                                <p className="text-sm text-gray-600 mt-1">{condition.description}</p>
                              )}
                            </div>
                            {condition.likelihood && (
                              <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                {Math.round(condition.likelihood * 100)}%
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Enhanced Recommendations */}
                  {analysis.recommendations && analysis.recommendations.length > 0 && (
                    <div className="bg-white rounded-lg p-4 mb-4">
                      <h4 className="font-semibold text-gray-900 mb-3">AI Recommendations</h4>
                      <div className="space-y-3">
                        {analysis.recommendations.map((rec: string | {title: string, description?: string, priority?: 'low' | 'medium' | 'high'}, index: number) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-md">
                            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-blue-900 font-medium">{typeof rec === 'string' ? rec : rec.title}</p>
                              {typeof rec === 'object' && rec.description && (
                                <p className="text-blue-700 text-sm mt-1">{rec.description}</p>
                              )}
                              {typeof rec === 'object' && rec.priority && (
                                <span className={`inline-block mt-2 px-2 py-1 text-xs rounded ${
                                  rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                                  rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-green-100 text-green-700'
                                }`}>
                                  {rec.priority} priority
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Follow-up Timeline */}
                  {analysis.followUpTimeline && (
                    <div className="bg-white rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Recommended Follow-up</h4>
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-md">
                        <Clock className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-green-900 font-medium">{analysis.followUpTimeline}</p>
                          {analysis.followUpReason && (
                            <p className="text-green-700 text-sm mt-1">{analysis.followUpReason}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Disclaimer */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-yellow-800 mb-1">Important Disclaimer</h4>
                      <p className="text-yellow-700 text-sm">
                        This AI analysis is for informational purposes only and should not replace professional veterinary care. 
                        Always consult with a qualified veterinarian for proper diagnosis and treatment, especially for urgent symptoms.
                      </p>
                    </div>
                  </div>
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