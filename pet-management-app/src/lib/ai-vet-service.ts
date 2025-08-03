import { prisma } from '@/lib/prisma'

interface SymptomAnalysis {
  severity: 'low' | 'medium' | 'high' | 'emergency'
  recommendations: string[]
  nextSteps: string[]
  urgency: number // 1-10 scale
  shouldSeeVet: boolean
  estimatedCause: string[]
}

interface ConsultationInput {
  petId: string
  symptoms: string
  duration: string
  photos?: string[]
  petAge: number
  petBreed: string
  petSpecies: string
}

export class AIVetService {
  private static instance: AIVetService
  private ollamaEndpoint = process.env.OLLAMA_ENDPOINT || 'http://localhost:11434'
  private ollamaFallbackEndpoint = process.env.OLLAMA_FALLBACK_ENDPOINT || 'http://localhost:11435'
  private ollamaModel = process.env.OLLAMA_MODEL || 'llama3.1:8b'
  private freeLimit = parseInt(process.env.AI_VET_FREE_LIMIT || '3')
  private activeEndpoint: string | null = null

  static getInstance(): AIVetService {
    if (!AIVetService.instance) {
      AIVetService.instance = new AIVetService()
    }
    return AIVetService.instance
  }

  // Emergency keywords that require immediate vet attention
  private emergencyKeywords = [
    'bleeding', 'blood', 'seizure', 'unconscious', 'difficulty breathing',
    'choking', 'poisoning', 'toxic', 'can\'t walk', 'paralyzed', 'swollen',
    'vomiting blood', 'diarrhea blood', 'hit by car', 'accident', 'trauma'
  ]

  // Common symptoms database (rule-based)
  private symptomDatabase = {
    'limping': {
      severity: 'medium',
      causes: ['injury', 'arthritis', 'muscle strain', 'paw pad injury'],
      recommendations: ['Rest', 'Limit activity', 'Check paws for foreign objects'],
      vetNeeded: true,
      urgency: 6
    },
    'vomiting': {
      severity: 'medium',
      causes: ['dietary indiscretion', 'stomach upset', 'illness'],
      recommendations: ['Withhold food for 12 hours', 'Provide small amounts of water'],
      vetNeeded: true,
      urgency: 7
    },
    'diarrhea': {
      severity: 'medium',
      causes: ['dietary change', 'stress', 'illness', 'parasites'],
      recommendations: ['Bland diet', 'Monitor hydration', 'Collect sample for vet'],
      vetNeeded: true,
      urgency: 6
    },
    'lethargy': {
      severity: 'medium',
      causes: ['illness', 'pain', 'depression', 'medication side effects'],
      recommendations: ['Monitor appetite', 'Check temperature', 'Note other symptoms'],
      vetNeeded: true,
      urgency: 5
    },
    'scratching': {
      severity: 'low',
      causes: ['allergies', 'fleas', 'dry skin', 'boredom'],
      recommendations: ['Check for fleas', 'Review diet', 'Use gentle shampoo'],
      vetNeeded: false,
      urgency: 3
    }
  }

  async analyzeSymptoms(input: ConsultationInput, language: string = 'en'): Promise<SymptomAnalysis> {
    // First check for emergency keywords (multilingual)
    const isEmergency = this.checkForEmergency(input.symptoms, language)
    if (isEmergency) {
      return this.createEmergencyResponse(language)
    }

    // Try AI analysis first (if available)
    let aiAnalysis: SymptomAnalysis | null = null
    try {
      aiAnalysis = await this.getAIAnalysis(input, language)
    } catch {
      console.log('AI analysis unavailable, using rule-based fallback')
    }

    // Fallback to rule-based analysis
    const ruleBasedAnalysis = this.getRuleBasedAnalysis(input, language)

    // Combine AI and rule-based if both available
    return aiAnalysis || ruleBasedAnalysis
  }

  private checkForEmergency(symptoms: string, language: string = 'en'): boolean {
    const lowerSymptoms = symptoms.toLowerCase()
    
    let emergencyKeywords = this.emergencyKeywords
    
    if (language === 'ru') {
      emergencyKeywords = [
        ...this.emergencyKeywords,
        'кровотечение', 'кровь', 'судороги', 'без сознания', 'затрудненное дыхание',
        'удушье', 'отравление', 'токсичный', 'не может ходить', 'парализован',
        'опухший', 'рвота кровью', 'понос с кровью', 'сбила машина', 'авария', 'травма'
      ]
    }
    
    return emergencyKeywords.some(keyword => 
      lowerSymptoms.includes(keyword)
    )
  }

  private createEmergencyResponse(language: string = 'en'): SymptomAnalysis {
    if (language === 'ru') {
      return {
        severity: 'emergency',
        urgency: 10,
        shouldSeeVet: true,
        recommendations: [
          '🚨 НЕМЕДЛЕННО ОБРАТИТЕСЬ К ВЕТЕРИНАРУ',
          'Звоните в экстренную ветклинику прямо сейчас',
          'Не ждите - это может угрожать жизни'
        ],
        nextSteps: [
          'Немедленно свяжитесь с экстренным ветеринаром',
          'Подготовьтесь к безопасной транспортировке питомца',
          'Возьмите с собой лекарства или информацию о недавних изменениях в питании'
        ],
        estimatedCause: ['Экстренная ситуация, требующая немедленной профессиональной помощи']
      }
    }

    return {
      severity: 'emergency',
      urgency: 10,
      shouldSeeVet: true,
      recommendations: [
        '🚨 SEEK IMMEDIATE VETERINARY CARE',
        'Call your emergency vet clinic now',
        'Do not wait - this could be life-threatening'
      ],
      nextSteps: [
        'Contact emergency vet immediately',
        'Prepare to transport pet safely',
        'Bring any medications or recent food changes'
      ],
      estimatedCause: ['Emergency situation requiring immediate professional care']
    }
  }

  private buildVetPrompt(input: ConsultationInput, language: string = 'en'): string {
    if (language === 'ru') {
      return `Ты ветеринарный AI-помощник. Это НЕ заменяет профессиональную ветеринарную помощь.

Питомец: ${input.petSpecies} ${input.petBreed} ${input.petAge} лет
Симптомы: ${input.symptoms}
Длительность: ${input.duration}

Проанализируй и ответь в точном формате:
ТЯЖЕСТЬ: [низкая/средняя/высокая/экстренная]
СРОЧНОСТЬ: [1-10]
НУЖЕН_ВРАЧ: [да/нет]
ПРИЧИНЫ: [причина1], [причина2], [причина3]
РЕКОМЕНДАЦИИ: [рекомендация1], [рекомендация2], [рекомендация3]
СЛЕДУЮЩИЕ_ШАГИ: [шаг1], [шаг2], [шаг3]

Будь краток и всегда рекомендуй ветеринарную помощь при серьезных симптомах.
КОНЕЦ_АНАЛИЗА`
    }

    // English prompt (default)
    return `Vet AI: Analyze pet symptoms. NOT medical diagnosis.

Pet: ${input.petSpecies} ${input.petBreed} ${input.petAge}yo
Issue: ${input.symptoms} (${input.duration})

Format:
SEVERITY: [low/medium/high/emergency]
URGENCY: [1-10]  
VET_NEEDED: [yes/no]
CAUSES: [3 causes]
CARE: [3 tips]
NEXT: [3 steps]

Brief responses. Recommend vet for serious issues.`
  }

  private async getAIAnalysis(input: ConsultationInput, language: string = 'en'): Promise<SymptomAnalysis | null> {
    try {
      const endpoint = await this.findWorkingEndpoint()
      if (!endpoint) {
        console.log('No working Ollama endpoint found, using rule-based fallback')
        return null
      }

      const prompt = this.buildVetPrompt(input, language)
      
      const response = await fetch(`${endpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.ollamaModel,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.1,
            top_p: 0.7,
            num_predict: language === 'ru' ? 250 : 200, // More tokens for Russian
            num_ctx: 512,
            num_thread: 1,
            repeat_penalty: 1.1,
          }
        }),
        timeout: 15000
      } as RequestInit & { timeout: number })

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`)
      }

      const data = await response.json()
      return this.parseAIResponse(data.response, language)
    } catch (error) {
      console.log('AI analysis failed:', error)
      this.activeEndpoint = null
      return null
    }
  }

  private parseAIResponse(response: string, language: string = 'en'): SymptomAnalysis {
    const lines = response.split('\n')
    const analysis: Partial<SymptomAnalysis> = {}

    lines.forEach(line => {
      const cleanLine = line.trim()
      
      if (language === 'ru') {
        // Russian parsing
        if (cleanLine.startsWith('ТЯЖЕСТЬ:')) {
          const severity = cleanLine.split(':')[1].trim().toLowerCase()
          analysis.severity = this.mapRussianSeverity(severity)
        } else if (cleanLine.startsWith('СРОЧНОСТЬ:')) {
          analysis.urgency = parseInt(cleanLine.split(':')[1].trim()) || 5
        } else if (cleanLine.startsWith('НУЖЕН_ВРАЧ:')) {
          analysis.shouldSeeVet = cleanLine.split(':')[1].trim().toLowerCase() === 'да'
        } else if (cleanLine.startsWith('ПРИЧИНЫ:')) {
          analysis.estimatedCause = cleanLine.split(':')[1].split(',').map(c => c.trim()).filter(c => c)
        } else if (cleanLine.startsWith('РЕКОМЕНДАЦИИ:')) {
          analysis.recommendations = cleanLine.split(':')[1].split(',').map(r => r.trim()).filter(r => r)
        } else if (cleanLine.startsWith('СЛЕДУЮЩИЕ_ШАГИ:')) {
          analysis.nextSteps = cleanLine.split(':')[1].split(',').map(s => s.trim()).filter(s => s)
        }
      } else {
        // English parsing (existing code)
        if (cleanLine.startsWith('SEVERITY:')) {
          analysis.severity = cleanLine.split(':')[1].trim() as 'low' | 'medium' | 'high' | 'emergency'
        } else if (cleanLine.startsWith('URGENCY:')) {
          analysis.urgency = parseInt(cleanLine.split(':')[1].trim()) || 5
        } else if (cleanLine.startsWith('VET_NEEDED:')) {
          analysis.shouldSeeVet = cleanLine.split(':')[1].trim().toLowerCase() === 'yes'
        } else if (cleanLine.startsWith('CAUSES:')) {
          analysis.estimatedCause = cleanLine.split(':')[1].split(',').map(c => c.trim()).filter(c => c)
        } else if (cleanLine.startsWith('CARE:')) {
          analysis.recommendations = cleanLine.split(':')[1].split(',').map(r => r.trim()).filter(r => r)
        } else if (cleanLine.startsWith('NEXT:')) {
          analysis.nextSteps = cleanLine.split(':')[1].split(',').map(s => s.trim()).filter(s => s)
        }
      }
    })

    // Provide defaults with appropriate language
    const defaultResponses = this.getDefaultResponses(language)
    
    return {
      severity: analysis.severity || 'medium',
      urgency: analysis.urgency || 5,
      shouldSeeVet: analysis.shouldSeeVet ?? true,
      recommendations: analysis.recommendations || defaultResponses.recommendations,
      nextSteps: analysis.nextSteps || defaultResponses.nextSteps,
      estimatedCause: analysis.estimatedCause || defaultResponses.estimatedCause
    }
  }

  private mapRussianSeverity(severity: string): 'low' | 'medium' | 'high' | 'emergency' {
    switch (severity) {
      case 'низкая': return 'low'
      case 'средняя': return 'medium'
      case 'высокая': return 'high'
      case 'экстренная': return 'emergency'
      default: return 'medium'
    }
  }

  private getDefaultResponses(language: string) {
    if (language === 'ru') {
      return {
        recommendations: ['Наблюдайте за питомцем', 'Обратитесь к ветеринару'],
        nextSteps: ['Запишитесь к ветеринару', 'Обеспечьте покой питомцу'],
        estimatedCause: ['Требуется профессиональная оценка']
      }
    }
    
    return {
      recommendations: ['Monitor symptoms', 'Contact veterinarian'],
      nextSteps: ['Schedule vet appointment', 'Keep pet comfortable'],
      estimatedCause: ['Requires professional assessment']
    }
  }

  private getRuleBasedAnalysis(input: ConsultationInput, language: string = 'en'): SymptomAnalysis {
    const symptoms = input.symptoms.toLowerCase()
    let bestMatch: { severity: 'low' | 'medium' | 'high' | 'emergency'; urgency: number; shouldSeeVet: boolean; recommendations: string[]; nextSteps: string[]; estimatedCause: string[] } | null = null
    let highestScore = 0

    // Find best matching symptom in database (works with both languages)
    Object.entries(this.symptomDatabase).forEach(([key, data]) => {
      if (symptoms.includes(key) || (language === 'ru' && this.containsRussianSymptom(symptoms, key))) {
        const score = key.length
        if (score > highestScore) {
          highestScore = score
          bestMatch = {
            severity: data.severity as 'low' | 'medium' | 'high' | 'emergency',
            urgency: data.urgency,
            shouldSeeVet: data.vetNeeded,
            recommendations: data.recommendations,
            nextSteps: data.recommendations, // Using recommendations as nextSteps
            estimatedCause: data.causes
          }
        }
      }
    })

    // Default analysis if no match found
    if (!bestMatch) {
      return {
        severity: 'medium',
        urgency: 5,
        shouldSeeVet: true,
        recommendations: [
          language === 'ru' ? 'Внимательно наблюдайте за питомцем' : 'Monitor your pet closely',
          language === 'ru' ? 'Отмечайте любые изменения в поведении' : 'Note any changes in behavior',
          language === 'ru' ? 'Рассмотрите консультацию с ветеринаром' : 'Consider consulting with a veterinarian'
        ],
        nextSteps: [
          language === 'ru' ? 'Ведите дневник симптомов' : 'Keep a symptom diary',
          language === 'ru' ? 'Запишитесь к ветеринару, если симптомы сохраняются' : 'Schedule vet appointment if symptoms persist',
          language === 'ru' ? 'Обеспечьте комфорт и увлажнение питомца' : 'Ensure pet is comfortable and hydrated'
        ],
        estimatedCause: [language === 'ru' ? 'Неизвестно - требуется профессиональная оценка' : 'Unknown - requires professional evaluation']
      }
    }

    return bestMatch!
  }

  private containsRussianSymptom(symptoms: string, englishKey: string): boolean {
    const russianTranslations: Record<string, string[]> = {
      'limping': ['хромает', 'хромота', 'прихрамывает'],
      'vomiting': ['рвота', 'тошнота', 'рвет'],
      'diarrhea': ['понос', 'диарея', 'жидкий стул'],
      'lethargy': ['вялость', 'апатия', 'слабость'],
      'scratching': ['чешется', 'зуд', 'расчесывает']
    }

    const translations = russianTranslations[englishKey] || []
    return translations.some(translation => symptoms.includes(translation))
  }

  async saveConsultation(userId: string, petId: string, input: ConsultationInput, analysis: SymptomAnalysis) {
    try {
      await prisma.aiConsultation.create({
        data: {
          userId,
          petId,
          symptoms: input.symptoms,
          duration: input.duration,
          analysis: JSON.stringify(analysis),
          severity: analysis.severity,
          urgency: analysis.urgency,
          createdAt: new Date()
        }
      })
    } catch (error) {
      console.error('Failed to save consultation:', error)
    }
  }

  async getUserConsultationCount(userId: string, month: Date): Promise<number> {
    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1)
    const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0)

    const count = await prisma.aiConsultation.count({
      where: {
        userId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    })

    return count
  }

  // Find working Ollama endpoint
  async findWorkingEndpoint(): Promise<string | null> {
    if (this.activeEndpoint) {
      return this.activeEndpoint
    }

    const endpoints = [this.ollamaEndpoint, this.ollamaFallbackEndpoint]
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${endpoint}/api/tags`, {
          method: 'GET',
          timeout: 3000
        } as RequestInit & { timeout: number })
        
        if (response.ok) {
          this.activeEndpoint = endpoint
          console.log(`Found working Ollama at: ${endpoint}`)
          return endpoint
        }
      } catch {
        console.log(`Ollama not available at ${endpoint}`)
      }
    }
    
    return null
  }

  // Test if Ollama is available
  async isOllamaAvailable(): Promise<boolean> {
    try {
      const endpoint = await this.findWorkingEndpoint()
      if (!endpoint) return false

      const response = await fetch(`${endpoint}/api/tags`, {
        method: 'GET',
        timeout: 5000
      } as RequestInit & { timeout: number })
      
      if (response.ok) {
        const data = await response.json()
        return data.models?.some((model: { name: string }) => model.name.includes(this.ollamaModel.split(':')[0]))
      }
      return false
    } catch {
      console.log('Ollama not available')
      return false
    }
  }

  // Add method to check system status
  async getSystemStatus(): Promise<{
    ollamaAvailable: boolean
    modelLoaded: boolean
    systemHealth: 'good' | 'degraded' | 'down'
    activeEndpoint: string | null
  }> {
    try {
      const endpoint = await this.findWorkingEndpoint()
      
      if (!endpoint) {
        return {
          ollamaAvailable: false,
          modelLoaded: false,
          systemHealth: 'down',
          activeEndpoint: null
        }
      }

      // Test model with simple query
      const testResponse = await fetch(`${endpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.ollamaModel,
          prompt: 'Test: Say "OK"',
          stream: false,
          options: { num_predict: 5 }
        }),
        timeout: 10000
      } as RequestInit & { timeout: number })

      const modelLoaded = testResponse.ok
      
      return {
        ollamaAvailable: true,
        modelLoaded,
        systemHealth: modelLoaded ? 'good' : 'degraded',
        activeEndpoint: endpoint
      }
    } catch {
      return {
        ollamaAvailable: false,
        modelLoaded: false,
        systemHealth: 'down',
        activeEndpoint: null
      }
    }
  }

  async canUserConsult(userId: string): Promise<{ canConsult: boolean; remaining: number; systemStatus: string }> {
    const currentMonth = new Date()
    const consultationCount = await this.getUserConsultationCount(userId, currentMonth)

    // Check if user has premium subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true }
    })

    const isPremium = user?.subscriptionTier === 'premium'
    const canConsult = isPremium || consultationCount < this.freeLimit
    const remaining = isPremium ? 999 : Math.max(0, this.freeLimit - consultationCount)

    // Check system status
    const status = await this.getSystemStatus()
    let systemStatus = 'available'
    
    if (status.systemHealth === 'down') {
      systemStatus = 'AI temporarily unavailable - using rule-based analysis'
    } else if (status.systemHealth === 'degraded') {
      systemStatus = 'AI partially available'
    }

    return { canConsult, remaining, systemStatus }
  }
}

export const aiVetService = AIVetService.getInstance()