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
  private ollamaModel = process.env.OLLAMA_MODEL || 'llama3.1:3b-instruct'
  private freeLimit = parseInt(process.env.AI_VET_FREE_LIMIT || '3')
  private activeEndpoint: string | null = null
  private memoryOptimized = true // Flag for 4GB RAM optimization

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
      return `Ветеринарный анализ. Питомец: ${input.petSpecies} ${input.petBreed}, ${input.petAge} лет. Симптомы: ${input.symptoms} (${input.duration}).

КРИТИЧЕСКИЕ ПРИЗНАКИ:
- Температура >40°C = экстренная помощь
- Рвота >2 раз = к врачу
- Отказ от еды >24ч = к врачу
- Затрудненное дыхание = немедленно к врачу

ФОРМАТ ОТВЕТА:
ТЯЖЕСТЬ: [низкая/средняя/высокая/экстренная]
СРОЧНОСТЬ: [1-10]
НУЖЕН_ВРАЧ: [да/нет]
ПРИЧИНЫ: [причина1], [причина2]
РЕКОМЕНДАЦИИ: [рекомендация1], [рекомендация2]
СЛЕДУЮЩИЕ_ШАГИ: [шаг1], [шаг2]

КОНЕЦ`
    }

    // Memory-efficient English prompt
    return `Vet analysis. Pet: ${input.petSpecies} ${input.petBreed}, ${input.petAge} years. Symptoms: ${input.symptoms} (${input.duration}).

CRITICAL SIGNS:
- Temp >40°C = emergency
- Vomiting >2x = see vet
- No appetite >24h = see vet
- Breathing difficulty = immediate vet

FORMAT:
SEVERITY: [low/medium/high/emergency]
URGENCY: [1-10]
VET_NEEDED: [yes/no]
CAUSES: [cause1], [cause2]
CARE: [recommendation1], [recommendation2]
NEXT: [step1], [step2]

END`
  }

  private async getAIAnalysis(input: ConsultationInput, language: string = 'en'): Promise<SymptomAnalysis | null> {
    try {
      const endpoint = await this.findWorkingEndpoint()
      if (!endpoint) {
        console.log('No working Ollama endpoint found, using rule-based fallback')
        return null
      }

      const prompt = this.buildVetPrompt(input, language)
      
      // Try multiple endpoints with better error handling
      const endpoints = [endpoint, this.ollamaFallbackEndpoint]
      let lastError: Error | null = null
      
      for (const currentEndpoint of endpoints) {
        try {
          console.log(`Trying Ollama endpoint: ${currentEndpoint}`)
          
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 15000)
          
          const response = await fetch(`${currentEndpoint}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: this.ollamaModel,
              prompt: prompt,
              stream: false,
              options: {
                temperature: 0.1,
                top_p: 0.85,
                num_predict: language === 'ru' ? 200 : 150,
                num_ctx: 1024,
                num_thread: 2,
                repeat_penalty: 1.15,
                top_k: 30,
                tfs_z: 0.95,
                mirostat: 1,
                mirostat_tau: 4.0,
                mirostat_eta: 0.2,
                num_gpu: 0,
                num_gqa: 8,
                rope_freq_base: 10000,
                rope_freq_scale: 0.5,
              }
            }),
            signal: controller.signal
          })

          clearTimeout(timeoutId)

          if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status} - ${response.statusText}`)
          }

          const data = await response.json()
          const aiResponse = data.response || data.text || ''
          
          if (aiResponse.trim()) {
            console.log(`Successfully got AI response from ${currentEndpoint}`)
            this.activeEndpoint = currentEndpoint
            return this.parseAIResponse(aiResponse, language)
          } else {
            throw new Error('Empty response from Ollama')
          }
        } catch (error) {
          console.error(`Failed to get AI analysis from ${currentEndpoint}:`, error)
          lastError = error as Error
          this.activeEndpoint = null
          continue
        }
      }
      
      console.error('All Ollama endpoints failed:', lastError)
      return null
    } catch (error) {
      console.error('AI analysis failed:', error)
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
        recommendations: [
          'Наблюдайте за питомцем в течение 24 часов',
          'Обеспечьте доступ к чистой воде',
          'Предложите легкую пищу (курица с рисом)',
          'Измерьте температуру, если возможно',
          'Обратитесь к ветеринару при ухудшении состояния'
        ],
        nextSteps: [
          'Запишитесь к ветеринару в ближайшее время',
          'Ведите дневник симптомов и поведения',
          'Обеспечьте покой и комфорт питомцу',
          'Подготовьте информацию о рационе и активности'
        ],
        estimatedCause: ['Требуется профессиональная оценка для точного диагноза']
      }
    }
    
    return {
      recommendations: [
        'Monitor your pet for 24 hours',
        'Ensure access to clean water',
        'Offer bland food (chicken and rice)',
        'Check temperature if possible',
        'Contact veterinarian if condition worsens'
      ],
      nextSteps: [
        'Schedule vet appointment soon',
        'Keep symptom and behavior diary',
        'Ensure pet is comfortable and rested',
        'Prepare information about diet and activity'
      ],
      estimatedCause: ['Requires professional assessment for accurate diagnosis']
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
          
          // Provide language-specific recommendations
          let recommendations = data.recommendations
          let nextSteps = data.recommendations
          let causes = data.causes
          
          if (language === 'ru') {
            // Russian-specific recommendations
            const russianRecommendations: Record<string, string[]> = {
              'limping': [
                'Обеспечьте полный покой питомцу',
                'Не позволяйте прыгать и бегать',
                'Проверьте лапы на наличие инородных предметов',
                'Приложите холодный компресс на 10-15 минут',
                'Запишитесь к ветеринару в течение 24 часов'
              ],
              'vomiting': [
                'Не кормите питомца в течение 12 часов',
                'Предлагайте небольшие порции воды каждые 2 часа',
                'После 12 часов предложите легкую пищу (курица с рисом)',
                'Следите за частотой рвоты',
                'Обратитесь к ветеринару при повторной рвоте'
              ],
              'diarrhea': [
                'Предложите легкую диету (курица с рисом)',
                'Обеспечьте доступ к чистой воде',
                'Следите за цветом и консистенцией стула',
                'Соберите образец для анализа',
                'Обратитесь к ветеринару при кровавом поносе'
              ],
              'lethargy': [
                'Измерьте температуру питомца',
                'Следите за аппетитом и потреблением воды',
                'Отмечайте любые изменения в поведении',
                'Обеспечьте комфорт и покой',
                'Запишитесь к ветеринару при отсутствии улучшений'
              ],
              'scratching': [
                'Проверьте на наличие блох и клещей',
                'Используйте мягкий шампунь для животных',
                'Пересмотрите рацион на предмет аллергенов',
                'Обеспечьте достаточную физическую активность',
                'Обратитесь к ветеринару при сильном зуде'
              ]
            }
            
            recommendations = russianRecommendations[key] || data.recommendations
            nextSteps = [
              'Запишитесь к ветеринару в ближайшее время',
              'Ведите дневник симптомов и поведения',
              'Подготовьте информацию о рационе и активности',
              'Будьте готовы к возможным анализам'
            ]
            causes = data.causes.map(cause => {
              const russianCauses: Record<string, string> = {
                'injury': 'травма',
                'arthritis': 'артрит',
                'muscle strain': 'растяжение мышц',
                'paw pad injury': 'травма подушечки лапы',
                'dietary indiscretion': 'нарушение диеты',
                'stomach upset': 'расстройство желудка',
                'illness': 'заболевание',
                'dietary change': 'изменение рациона',
                'stress': 'стресс',
                'parasites': 'паразиты',
                'pain': 'боль',
                'depression': 'депрессия',
                'medication side effects': 'побочные эффекты лекарств',
                'allergies': 'аллергия',
                'fleas': 'блохи',
                'dry skin': 'сухая кожа',
                'boredom': 'скука'
              }
              return russianCauses[cause] || cause
            })
          }
          
          bestMatch = {
            severity: data.severity as 'low' | 'medium' | 'high' | 'emergency',
            urgency: data.urgency,
            shouldSeeVet: data.vetNeeded,
            recommendations,
            nextSteps,
            estimatedCause: causes
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
          language === 'ru' ? 'Внимательно наблюдайте за питомцем в течение 24 часов' : 'Monitor your pet closely for 24 hours',
          language === 'ru' ? 'Обеспечьте доступ к чистой воде' : 'Ensure access to clean water',
          language === 'ru' ? 'Предложите легкую пищу (курица с рисом)' : 'Offer bland food (chicken and rice)',
          language === 'ru' ? 'Измерьте температуру, если возможно' : 'Check temperature if possible',
          language === 'ru' ? 'Обратитесь к ветеринару при ухудшении состояния' : 'Contact veterinarian if condition worsens'
        ],
        nextSteps: [
          language === 'ru' ? 'Запишитесь к ветеринару в ближайшее время' : 'Schedule vet appointment soon',
          language === 'ru' ? 'Ведите дневник симптомов и поведения' : 'Keep a symptom diary',
          language === 'ru' ? 'Обеспечьте покой и комфорт питомцу' : 'Ensure pet is comfortable and rested',
          language === 'ru' ? 'Подготовьте информацию о рационе и активности' : 'Prepare information about diet and activity'
        ],
        estimatedCause: [language === 'ru' ? 'Требуется профессиональная оценка для точного диагноза' : 'Requires professional assessment for accurate diagnosis']
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

  // Enhanced system status with detailed monitoring
  async getSystemStatus(): Promise<{
    ollamaAvailable: boolean
    modelLoaded: boolean
    systemHealth: 'good' | 'degraded' | 'down'
    activeEndpoint: string | null
    modelInfo?: {
      name: string
      size: string
      modified: string
      digest: string
    }
    performance?: {
      responseTime: number
      tokensPerSecond: number
      memoryUsage: string
    }
  }> {
    try {
      // const startTime = Date.now() // Unused variable removed
      const endpoint = await this.findWorkingEndpoint()
      
      if (!endpoint) {
        return {
          ollamaAvailable: false,
          modelLoaded: false,
          systemHealth: 'down',
          activeEndpoint: null
        }
      }

      // Get detailed model information
      const modelResponse = await fetch(`${endpoint}/api/tags`, {
        method: 'GET',
        timeout: 5000
      } as RequestInit & { timeout: number })

      let modelInfo = undefined
      if (modelResponse.ok) {
        const models = await modelResponse.json()
        const targetModel = this.ollamaModel.split(':')[0]
        const loadedModel = models.models?.find((model: { name: string }) => 
          model.name.includes(targetModel)
        )
        
        if (loadedModel) {
          modelInfo = {
            name: loadedModel.name,
            size: `${Math.round(loadedModel.size / 1024 / 1024 / 1024)}GB`,
            modified: new Date(loadedModel.modified_at).toLocaleDateString(),
            digest: loadedModel.digest?.substring(0, 8) || 'N/A'
          }
        }
      }

      // Test performance with a simple prompt
      let performance = undefined
      let modelLoaded = false
      
      try {
        const testStart = Date.now()
        const testResponse = await fetch(`${endpoint}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: this.ollamaModel,
            prompt: 'Test response time',
            stream: false,
            options: {
              num_predict: 10,
              temperature: 0.1
            }
          }),
          timeout: 10000
        } as RequestInit & { timeout: number })

        if (testResponse.ok) {
          const testData = await testResponse.json()
          const responseTime = Date.now() - testStart
          const tokensPerSecond = testData.response?.length ? 
            Math.round(testData.response.length / (responseTime / 1000)) : 0

          modelLoaded = true
          performance = {
            responseTime,
            tokensPerSecond,
            memoryUsage: 'Available' // Could be enhanced with actual memory monitoring
          }
        }
      } catch (error) {
        console.log('Performance test failed:', error)
      }
      
      return {
        ollamaAvailable: true,
        modelLoaded,
        systemHealth: modelLoaded ? 'good' : 'degraded',
        activeEndpoint: endpoint,
        modelInfo,
        performance
      }
    } catch (error) {
      console.error('System status check failed:', error)
      return {
        ollamaAvailable: false,
        modelLoaded: false,
        systemHealth: 'down',
        activeEndpoint: null
      }
    }
  }

  // Memory monitoring for 4GB RAM systems
  async getMemoryStatus(): Promise<{
    available: boolean
    memoryUsage: string
    optimizationTips: string[]
    recommendedActions: string[]
  }> {
    try {
      const endpoint = await this.findWorkingEndpoint()
      if (!endpoint) {
        return {
          available: false,
          memoryUsage: 'Unknown',
          optimizationTips: [
            'Close unnecessary applications',
            'Restart Ollama service',
            'Use smaller models (3B instead of 8B)',
            'Reduce context window size'
          ],
          recommendedActions: [
            'Install llama3.1:3b-instruct model',
            'Set OLLAMA_MODEL=llama3.1:3b-instruct',
            'Restart the application'
          ]
        }
      }

      // Get system info from Ollama
      const response = await fetch(`${endpoint}/api/tags`, {
        method: 'GET',
        timeout: 5000
      } as RequestInit & { timeout: number })

      if (!response.ok) {
        return {
          available: true,
          memoryUsage: 'Limited',
          optimizationTips: [
            'Model may be too large for 4GB RAM',
            'Try llama3.1:3b-instruct instead',
            'Close browser tabs and other apps',
            'Restart Ollama with smaller model'
          ],
          recommendedActions: [
            'Pull smaller model: ollama pull llama3.1:3b-instruct',
            'Set environment: OLLAMA_MODEL=llama3.1:3b-instruct',
            'Restart application'
          ]
        }
      }

      const models = await response.json()
      const currentModel = models.models?.find((m: { name: string }) => 
        m.name.includes(this.ollamaModel.split(':')[0])
      )

      const modelSize = currentModel ? 
        Math.round(currentModel.size / 1024 / 1024 / 1024) : 0

      let memoryUsage = 'Good'
      let optimizationTips = []
      let recommendedActions = []

      if (modelSize > 8) {
        memoryUsage = 'High - Consider smaller model'
        optimizationTips = [
          'Current model requires too much RAM',
          'Switch to llama3.1:3b-instruct',
          'Close other applications',
          'Restart Ollama service'
        ]
        recommendedActions = [
          'Pull smaller model: ollama pull llama3.1:3b-instruct',
          'Set OLLAMA_MODEL=llama3.1:3b-instruct',
          'Restart application'
        ]
      } else if (modelSize > 4) {
        memoryUsage = 'Moderate - Monitor usage'
        optimizationTips = [
          'Model size is acceptable for 4GB RAM',
          'Close unnecessary browser tabs',
          'Monitor system memory usage',
          'Consider llama3.1:3b-instruct for better performance'
        ]
        recommendedActions = [
          'Monitor memory usage during AI consultations',
          'Close other applications when using AI vet',
          'Consider upgrading to 8GB RAM for better performance'
        ]
      } else {
        memoryUsage = 'Optimal for 4GB RAM'
        optimizationTips = [
          'Current model is well-optimized for 4GB RAM',
          'Good performance expected',
          'Monitor for any memory issues',
          'Consider closing other apps during AI use'
        ]
        recommendedActions = [
          'Current setup is optimal',
          'Monitor performance during use',
          'Report any issues to support'
        ]
      }

      return {
        available: true,
        memoryUsage,
        optimizationTips,
        recommendedActions
      }

    } catch (error) {
      console.error('Memory status check failed:', error)
      return {
        available: false,
        memoryUsage: 'Unknown',
        optimizationTips: [
          'Unable to check memory status',
          'Ensure Ollama is running',
          'Check system resources',
          'Restart Ollama service'
        ],
        recommendedActions: [
          'Restart Ollama: sudo systemctl restart ollama',
          'Check Ollama status: ollama ps',
          'Restart application'
        ]
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

  // Memory-optimized model recommendations for 4GB RAM
  getModelRecommendations(): {
    recommended: string[]
    alternatives: string[]
    setupInstructions: string[]
    performanceNotes: Record<string, string>
    memoryOptimized: boolean
  } {
    return {
      recommended: [
        'llama3.1:3b-instruct',
        'llama3.1:8b',
        'llama3.1:3b',
        'mistral:7b',
        'codellama:7b'
      ],
      alternatives: [
        'llama3.1:8b-instruct',
        'llama3.1:70b',
        'mistral:7b-instruct',
        'codellama:7b-instruct',
        'llama2:7b'
      ],
      setupInstructions: [
        '1. Install Ollama: curl -fsSL https://ollama.ai/install.sh | sh',
        '2. Pull 4GB-optimized model: ollama pull llama3.1:3b-instruct',
        '3. Set environment variable: OLLAMA_MODEL=llama3.1:3b-instruct',
        '4. For 4GB RAM: OLLAMA_HOST=0.0.0.0:11434',
        '5. Monitor memory: ollama list && ollama ps',
        '6. Optimize: Close other apps, use CPU-only mode'
      ],
      performanceNotes: {
        'llama3.1:3b-instruct': 'Best for 4GB RAM, fast responses, good accuracy',
        'llama3.1:8b': 'Good balance, requires 6GB+ RAM, better accuracy',
        'llama3.1:3b': 'Fastest, 4GB RAM, basic analysis',
        'mistral:7b': 'Good reasoning, requires 8GB+ RAM',
        'codellama:7b': 'Structured responses, requires 8GB+ RAM'
      },
      memoryOptimized: true
    }
  }

  // Enhanced model selection based on available resources
  async getOptimalModel(): Promise<string> {
    try {
      const endpoint = await this.findWorkingEndpoint()
      if (!endpoint) return this.ollamaModel

      const response = await fetch(`${endpoint}/api/tags`, {
        method: 'GET',
        timeout: 5000
      } as RequestInit & { timeout: number })

      if (!response.ok) return this.ollamaModel

      const models = await response.json()
      const availableModels = models.models?.map((m: { name: string }) => m.name) || []

      // Priority order for veterinary AI
      const priorityModels = [
        'llama3.1:70b',
        'llama3.1:8b-instruct', 
        'mistral:7b-instruct',
        'llama3.1:3b-instruct',
        'llama3.1:8b',
        'llama3.1:3b'
      ]

      for (const model of priorityModels) {
        if (availableModels.some((m: string) => m.includes(model))) {
          return model
        }
      }

      return this.ollamaModel
    } catch (error) {
      console.error('Failed to get optimal model:', error)
      return this.ollamaModel
    }
  }
}

export const aiVetService = AIVetService.getInstance()