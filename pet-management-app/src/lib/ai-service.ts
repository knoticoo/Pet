import { prisma } from '@/lib/prisma'

// AI Service Types
interface AIConsultationInput {
  petId: string
  symptoms: string
  duration: string
  photos?: string[]
  petAge: number
  petBreed: string
  petSpecies: string
  language: string
  context?: string // Additional context like recent changes, environment, etc.
}

interface SymptomAnalysis {
  severity: 'low' | 'medium' | 'high' | 'emergency'
  urgency: number // 1-10 scale
  shouldSeeVet: boolean
  estimatedCauses: string[]
  recommendations: string[]
  nextSteps: string[]
  homeRemedies: string[]
  emergencyActions: string[]
  confidence: number
  reasoning: string
}

interface AIPhotoAnalysis {
  petHealth: {
    mood: string
    activity: string
    healthNotes: string
    weightEstimate?: string
    coatCondition?: string
    bodyLanguage?: string
  }
  activity: string
  tags: string[]
  healthAlerts: string[]
  recommendations: string[]
  confidence: number
}

interface AIExpenseAnalysis {
  category: string
  amount: number
  description: string
  merchant: string
  confidence: number
  breakdown?: string
}

export class AIService {
  private static instance: AIService
  private modelEndpoint = process.env.AI_MODEL_ENDPOINT || 'http://localhost:11434'
  private modelName = process.env.AI_MODEL_NAME || 'llama3.1:8b'
  private isLocalModel = process.env.AI_USE_LOCAL === 'true'

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService()
    }
    return AIService.instance
  }

  // Main consultation method - generates unique AI responses
  async analyzePetSymptoms(input: AIConsultationInput): Promise<SymptomAnalysis> {
    // Check for emergency symptoms first
    const emergencyCheck = this.checkEmergencySymptoms(input.symptoms, input.language)
    if (emergencyCheck.isEmergency) {
      return this.createEmergencyResponse(input.language, emergencyCheck.symptoms)
    }

    // Generate AI analysis
    try {
      const aiAnalysis = await this.generateAIAnalysis(input)
      return aiAnalysis
    } catch (error) {
      console.error('AI analysis failed:', error)
      // Fallback to basic emergency response
      return this.createEmergencyResponse(input.language, ['Не удалось проанализировать'])
    }
  }

  // Photo analysis with AI
  async analyzePetPhoto(imageUrl: string, petInfo: { species: string, breed: string }): Promise<AIPhotoAnalysis> {
    try {
      const prompt = this.buildPhotoAnalysisPrompt(imageUrl, petInfo)
      const response = await this.callAIModel(prompt)
      
      return this.parsePhotoAnalysisResponse(response, petInfo)
    } catch (error) {
      console.error('Photo analysis error:', error)
      return this.getDefaultPhotoAnalysis(petInfo)
    }
  }

  // Expense analysis with AI
  async analyzeExpenseReceipt(imageUrl: string): Promise<AIExpenseAnalysis> {
    try {
      const prompt = this.buildExpenseAnalysisPrompt(imageUrl)
      const response = await this.callAIModel(prompt)
      
      return this.parseExpenseAnalysisResponse(response)
    } catch (error) {
      console.error('Expense analysis error:', error)
      return {
        category: 'other',
        amount: 0,
        description: 'Не удалось распознать',
        merchant: 'Неизвестно',
        confidence: 0
      }
    }
  }

  // Private methods
  private checkEmergencySymptoms(symptoms: string, language: string): { isEmergency: boolean, symptoms: string[] } {
    const emergencyKeywords = language === 'ru' ? [
      'кровотечение', 'кровь', 'судороги', 'без сознания', 'затрудненное дыхание',
      'удушье', 'отравление', 'токсичный', 'не может ходить', 'парализован',
      'опухший', 'рвота кровью', 'понос с кровью', 'сбила машина', 'авария', 'травма',
      'перелом', 'ожог', 'обморожение', 'тепловой удар', 'гипотермия'
    ] : [
      'bleeding', 'blood', 'seizure', 'unconscious', 'difficulty breathing',
      'choking', 'poisoning', 'toxic', 'can\'t walk', 'paralyzed', 'swollen'
    ]

    const foundEmergencies = emergencyKeywords.filter(keyword => 
      symptoms.toLowerCase().includes(keyword)
    )

    return {
      isEmergency: foundEmergencies.length > 0,
      symptoms: foundEmergencies
    }
  }

  private createEmergencyResponse(language: string, symptoms: string[]): SymptomAnalysis {
    const severity = 'emergency'
    const urgency = 10
    const shouldSeeVet = true

    if (language === 'ru') {
      return {
        severity,
        urgency,
        shouldSeeVet,
        estimatedCauses: ['Экстренная ситуация, требующая немедленной помощи'],
        recommendations: [
          '🚨 НЕМЕДЛЕННО ОБРАТИТЕСЬ К ВЕТЕРИНАРУ',
          'Звоните в экстренную ветклинику прямо сейчас',
          'Не ждите - это может угрожать жизни питомца'
        ],
        nextSteps: [
          'Немедленно свяжитесь с экстренным ветеринаром',
          'Подготовьтесь к безопасной транспортировке',
          'Возьмите с собой лекарства или информацию о недавних изменениях'
        ],
        homeRemedies: ['НЕ ПЫТАЙТЕСЬ ЛЕЧИТЬ САМОСТОЯТЕЛЬНО'],
        emergencyActions: [
          'Обеспечьте покой питомцу',
          'Не давайте еду и воду',
          'Подготовьте транспорт'
        ],
        confidence: 0.95,
        reasoning: `Обнаружены экстренные симптомы: ${symptoms.join(', ')}. Требуется немедленная профессиональная помощь.`
      }
    }

    return {
      severity,
      urgency,
      shouldSeeVet,
      estimatedCauses: ['Emergency situation requiring immediate care'],
      recommendations: [
        '🚨 SEEK IMMEDIATE VETERINARY CARE',
        'Call emergency vet clinic now',
        'Do not wait - this could be life-threatening'
      ],
      nextSteps: [
        'Contact emergency vet immediately',
        'Prepare for safe transportation',
        'Bring medications or recent change information'
      ],
      homeRemedies: ['DO NOT ATTEMPT SELF-TREATMENT'],
      emergencyActions: [
        'Keep pet calm and comfortable',
        'Do not give food or water',
        'Prepare for transport'
      ],
      confidence: 0.95,
      reasoning: `Emergency symptoms detected: ${symptoms.join(', ')}. Immediate professional care required.`
    }
  }

  private async generateAIAnalysis(input: AIConsultationInput): Promise<SymptomAnalysis> {
    const prompt = this.buildVetPrompt(input)
    const response = await this.callAIModel(prompt)
    return this.parseAIResponse(response, input.language)
  }

  private buildVetPrompt(input: AIConsultationInput): string {
    if (input.language === 'ru') {
      return `Ты опытный ветеринарный врач с 20-летним стажем. Проанализируй симптомы питомца и дай профессиональную консультацию.

ИНФОРМАЦИЯ О ПИТОМЦЕ:
- Вид: ${input.petSpecies}
- Порода: ${input.petBreed}
- Возраст: ${input.petAge} лет
- Симптомы: ${input.symptoms}
- Длительность: ${input.duration}
${input.context ? `- Дополнительная информация: ${input.context}` : ''}

ПРОАНАЛИЗИРУЙ И ОТВЕТЬ В СЛЕДУЮЩЕМ ФОРМАТЕ:

ТЯЖЕСТЬ: [низкая/средняя/высокая/экстренная]
СРОЧНОСТЬ: [1-10]
НУЖЕН_ВРАЧ: [да/нет]
УВЕРЕННОСТЬ: [0.1-1.0]
РАССУЖДЕНИЕ: [подробное объяснение твоего анализа]
ПРИЧИНЫ: [3-5 возможных причин, уникальных для данного случая]
РЕКОМЕНДАЦИИ: [3-5 конкретных рекомендаций для данного питомца]
СЛЕДУЮЩИЕ_ШАГИ: [3-5 следующих действий]
ДОМАШНИЕ_СРЕДСТВА: [2-3 безопасных домашних средства]
ЭКСТРЕННЫЕ_ДЕЙСТВИЯ: [2-3 действия при ухудшении]

ВАЖНО:
- Будь уникальным в каждом ответе
- Учитывай возраст, породу и индивидуальные особенности
- Всегда рекомендуй ветеринара при серьезных симптомах
- Давай практичные, конкретные советы
- Объясняй свое рассуждение

КОНЕЦ_АНАЛИЗА`
    }

    return `You are an experienced veterinarian with 20 years of practice. Analyze the pet's symptoms and provide professional consultation.

PET INFORMATION:
- Species: ${input.petSpecies}
- Breed: ${input.petBreed}
- Age: ${input.petAge} years
- Symptoms: ${input.symptoms}
- Duration: ${input.duration}
${input.context ? `- Additional context: ${input.context}` : ''}

ANALYZE AND RESPOND IN THE FOLLOWING FORMAT:

SEVERITY: [low/medium/high/emergency]
URGENCY: [1-10]
VET_NEEDED: [yes/no]
CONFIDENCE: [0.1-1.0]
REASONING: [detailed explanation of your analysis]
CAUSES: [3-5 possible causes, unique to this case]
RECOMMENDATIONS: [3-5 specific recommendations for this pet]
NEXT_STEPS: [3-5 next actions]
HOME_REMEDIES: [2-3 safe home remedies]
EMERGENCY_ACTIONS: [2-3 actions if condition worsens]

IMPORTANT:
- Be unique in each response
- Consider age, breed, and individual characteristics
- Always recommend vet for serious symptoms
- Give practical, specific advice
- Explain your reasoning

END_ANALYSIS`
  }

  private buildPhotoAnalysisPrompt(imageUrl: string, petInfo: { species: string, breed: string }): string {
    return `Ты ветеринарный специалист по анализу фотографий животных. Проанализируй фотографию питомца и дай оценку его состояния.

ИНФОРМАЦИЯ О ПИТОМЦЕ:
- Вид: ${petInfo.species}
- Порода: ${petInfo.breed}
- Фотография: ${imageUrl}

ПРОАНАЛИЗИРУЙ И ОТВЕТЬ В ФОРМАТЕ:

НАСТРОЕНИЕ: [описание настроения питомца]
АКТИВНОСТЬ: [что делает питомец]
СОСТОЯНИЕ_ЗДОРОВЬЯ: [оценка общего состояния здоровья]
ВЕС: [оценка веса питомца]
СОСТОЯНИЕ_ШЕРСТИ: [оценка состояния шерсти/кожи]
ЯЗЫК_ТЕЛА: [анализ языка тела]
ТЕГИ: [5-8 тегов для фотографии]
ЗДОРОВЬЕ_ПРЕДУПРЕЖДЕНИЯ: [если есть поводы для беспокойства]
РЕКОМЕНДАЦИИ: [3-5 рекомендаций по уходу]
УВЕРЕННОСТЬ: [0.1-1.0]

Будь уникальным и детальным в анализе.
КОНЕЦ_АНАЛИЗА`
  }

  private buildExpenseAnalysisPrompt(imageUrl: string): string {
    return `Ты специалист по анализу чеков и квитанций. Проанализируй изображение чека и извлеки информацию о расходах.

ИЗОБРАЖЕНИЕ ЧЕКА: ${imageUrl}

ПРОАНАЛИЗИРУЙ И ОТВЕТЬ В ФОРМАТЕ:

КАТЕГОРИЯ: [категория расхода для питомца]
СУММА: [сумма в рублях]
ОПИСАНИЕ: [описание товара/услуги]
МАГАЗИН: [название магазина/клиники]
РАЗБИВКА: [детализация расходов если есть]
УВЕРЕННОСТЬ: [0.1-1.0]

Категории: ветеринар, корм, игрушки, груминг, аксессуары, лекарства, другие
КОНЕЦ_АНАЛИЗА`
  }

  private async callAIModel(prompt: string): Promise<string> {
    if (!this.isLocalModel) {
      throw new Error('Local AI model not available')
    }

    // Get optimal configuration for unique responses
    const config = this.getOptimalConfig()
    
    // Add randomness to ensure unique responses
    const randomSeed = Date.now() + Math.random() * 1000
    const temperatureVariation = config.temperature + (Math.random() - 0.5) * 0.1
    const topPVariation = config.topP + (Math.random() - 0.5) * 0.05

    const response = await fetch(`${this.modelEndpoint}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.modelName,
        prompt: prompt,
        stream: false,
        options: {
          temperature: Math.max(0.7, Math.min(0.9, temperatureVariation)), // Ensure unique responses
          top_p: Math.max(0.85, Math.min(0.98, topPVariation)),
          num_predict: config.maxTokens,
          num_ctx: config.contextLength,
          repeat_penalty: config.repeatPenalty,
          seed: randomSeed, // Random seed for unique responses
          top_k: 40, // Add top_k for more diversity
          tfs_z: 1.0, // Tail free sampling
          typical_p: 1.0, // Typical sampling
          mirostat: 2, // Mirostat for better response quality
          mirostat_tau: 5.0,
          mirostat_eta: 0.1
        }
      })
    })

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`)
    }

    const data = await response.json()
    return data.response
  }

  private getOptimalConfig() {
    // Import configuration dynamically to avoid circular dependencies
    const { defaultAIConfig, MODEL_REQUIREMENTS } = require('./ai-config')
    
    const modelConfig = MODEL_REQUIREMENTS[this.modelName] || MODEL_REQUIREMENTS['llama3.1:3b']
    
    return {
      temperature: modelConfig.temperature || 0.85,
      topP: modelConfig.topP || 0.95,
      repeatPenalty: modelConfig.repeatPenalty || 1.3,
      maxTokens: modelConfig.maxTokens || 600,
      contextLength: modelConfig.contextLength || 1024
    }
  }

  private parseAIResponse(response: string, language: string): SymptomAnalysis {
    const lines = response.split('\n')
    const analysis: Partial<SymptomAnalysis> = {}

    lines.forEach(line => {
      const cleanLine = line.trim()
      
      if (language === 'ru') {
        if (cleanLine.startsWith('ТЯЖЕСТЬ:')) {
          const severity = cleanLine.split(':')[1].trim().toLowerCase()
          analysis.severity = this.mapRussianSeverity(severity)
        } else if (cleanLine.startsWith('СРОЧНОСТЬ:')) {
          analysis.urgency = parseInt(cleanLine.split(':')[1].trim()) || 5
        } else if (cleanLine.startsWith('НУЖЕН_ВРАЧ:')) {
          analysis.shouldSeeVet = cleanLine.split(':')[1].trim().toLowerCase() === 'да'
        } else if (cleanLine.startsWith('УВЕРЕННОСТЬ:')) {
          analysis.confidence = parseFloat(cleanLine.split(':')[1].trim()) || 0.5
        } else if (cleanLine.startsWith('РАССУЖДЕНИЕ:')) {
          analysis.reasoning = cleanLine.split(':')[1].trim()
        } else if (cleanLine.startsWith('ПРИЧИНЫ:')) {
          analysis.estimatedCauses = cleanLine.split(':')[1].split(',').map(c => c.trim()).filter(c => c)
        } else if (cleanLine.startsWith('РЕКОМЕНДАЦИИ:')) {
          analysis.recommendations = cleanLine.split(':')[1].split(',').map(r => r.trim()).filter(r => r)
        } else if (cleanLine.startsWith('СЛЕДУЮЩИЕ_ШАГИ:')) {
          analysis.nextSteps = cleanLine.split(':')[1].split(',').map(s => s.trim()).filter(s => s)
        } else if (cleanLine.startsWith('ДОМАШНИЕ_СРЕДСТВА:')) {
          analysis.homeRemedies = cleanLine.split(':')[1].split(',').map(r => r.trim()).filter(r => r)
        } else if (cleanLine.startsWith('ЭКСТРЕННЫЕ_ДЕЙСТВИЯ:')) {
          analysis.emergencyActions = cleanLine.split(':')[1].split(',').map(a => a.trim()).filter(a => a)
        }
      } else {
        // English parsing
        if (cleanLine.startsWith('SEVERITY:')) {
          analysis.severity = cleanLine.split(':')[1].trim() as 'low' | 'medium' | 'high' | 'emergency'
        } else if (cleanLine.startsWith('URGENCY:')) {
          analysis.urgency = parseInt(cleanLine.split(':')[1].trim()) || 5
        } else if (cleanLine.startsWith('VET_NEEDED:')) {
          analysis.shouldSeeVet = cleanLine.split(':')[1].trim().toLowerCase() === 'yes'
        } else if (cleanLine.startsWith('CONFIDENCE:')) {
          analysis.confidence = parseFloat(cleanLine.split(':')[1].trim()) || 0.5
        } else if (cleanLine.startsWith('REASONING:')) {
          analysis.reasoning = cleanLine.split(':')[1].trim()
        } else if (cleanLine.startsWith('CAUSES:')) {
          analysis.estimatedCauses = cleanLine.split(':')[1].split(',').map(c => c.trim()).filter(c => c)
        } else if (cleanLine.startsWith('RECOMMENDATIONS:')) {
          analysis.recommendations = cleanLine.split(':')[1].split(',').map(r => r.trim()).filter(r => r)
        } else if (cleanLine.startsWith('NEXT_STEPS:')) {
          analysis.nextSteps = cleanLine.split(':')[1].split(',').map(s => s.trim()).filter(s => s)
        } else if (cleanLine.startsWith('HOME_REMEDIES:')) {
          analysis.homeRemedies = cleanLine.split(':')[1].split(',').map(r => r.trim()).filter(r => r)
        } else if (cleanLine.startsWith('EMERGENCY_ACTIONS:')) {
          analysis.emergencyActions = cleanLine.split(':')[1].split(',').map(a => a.trim()).filter(a => a)
        }
      }
    })

    return this.getDefaultAnalysis(language, analysis)
  }

  private parsePhotoAnalysisResponse(response: string, petInfo: { species: string, breed: string }): AIPhotoAnalysis {
    const lines = response.split('\n')
    const analysis: Partial<AIPhotoAnalysis> = {
      petHealth: {},
      tags: [],
      healthAlerts: [],
      recommendations: []
    }

    lines.forEach(line => {
      const cleanLine = line.trim()
      
      if (cleanLine.startsWith('НАСТРОЕНИЕ:')) {
        analysis.petHealth!.mood = cleanLine.split(':')[1].trim()
      } else if (cleanLine.startsWith('АКТИВНОСТЬ:')) {
        analysis.petHealth!.activity = cleanLine.split(':')[1].trim()
        analysis.activity = cleanLine.split(':')[1].trim()
      } else if (cleanLine.startsWith('СОСТОЯНИЕ_ЗДОРОВЬЯ:')) {
        analysis.petHealth!.healthNotes = cleanLine.split(':')[1].trim()
      } else if (cleanLine.startsWith('ВЕС:')) {
        analysis.petHealth!.weightEstimate = cleanLine.split(':')[1].trim()
      } else if (cleanLine.startsWith('СОСТОЯНИЕ_ШЕРСТИ:')) {
        analysis.petHealth!.coatCondition = cleanLine.split(':')[1].trim()
      } else if (cleanLine.startsWith('ЯЗЫК_ТЕЛА:')) {
        analysis.petHealth!.bodyLanguage = cleanLine.split(':')[1].trim()
      } else if (cleanLine.startsWith('ТЕГИ:')) {
        analysis.tags = cleanLine.split(':')[1].split(',').map(t => t.trim()).filter(t => t)
      } else if (cleanLine.startsWith('ЗДОРОВЬЕ_ПРЕДУПРЕЖДЕНИЯ:')) {
        analysis.healthAlerts = cleanLine.split(':')[1].split(',').map(a => a.trim()).filter(a => a)
      } else if (cleanLine.startsWith('РЕКОМЕНДАЦИИ:')) {
        analysis.recommendations = cleanLine.split(':')[1].split(',').map(r => r.trim()).filter(r => r)
      } else if (cleanLine.startsWith('УВЕРЕННОСТЬ:')) {
        analysis.confidence = parseFloat(cleanLine.split(':')[1].trim()) || 0.5
      }
    })

    return this.getDefaultPhotoAnalysis(petInfo, analysis)
  }

  private parseExpenseAnalysisResponse(response: string): AIExpenseAnalysis {
    const lines = response.split('\n')
    const analysis: Partial<AIExpenseAnalysis> = {}

    lines.forEach(line => {
      const cleanLine = line.trim()
      
      if (cleanLine.startsWith('КАТЕГОРИЯ:')) {
        analysis.category = cleanLine.split(':')[1].trim()
      } else if (cleanLine.startsWith('СУММА:')) {
        analysis.amount = parseFloat(cleanLine.split(':')[1].trim()) || 0
      } else if (cleanLine.startsWith('ОПИСАНИЕ:')) {
        analysis.description = cleanLine.split(':')[1].trim()
      } else if (cleanLine.startsWith('МАГАЗИН:')) {
        analysis.merchant = cleanLine.split(':')[1].trim()
      } else if (cleanLine.startsWith('РАЗБИВКА:')) {
        analysis.breakdown = cleanLine.split(':')[1].trim()
      } else if (cleanLine.startsWith('УВЕРЕННОСТЬ:')) {
        analysis.confidence = parseFloat(cleanLine.split(':')[1].trim()) || 0.5
      }
    })

    return {
      category: analysis.category || 'other',
      amount: analysis.amount || 0,
      description: analysis.description || 'Не удалось распознать',
      merchant: analysis.merchant || 'Неизвестно',
      confidence: analysis.confidence || 0,
      breakdown: analysis.breakdown
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

  private getDefaultAnalysis(language: string, partial?: Partial<SymptomAnalysis>): SymptomAnalysis {
    const defaults = language === 'ru' ? {
      recommendations: ['Наблюдайте за питомцем', 'Обратитесь к ветеринару'],
      nextSteps: ['Запишитесь к ветеринару', 'Обеспечьте покой питомцу'],
      estimatedCauses: ['Требуется профессиональная оценка'],
      homeRemedies: ['Обеспечьте покой', 'Следите за состоянием'],
      emergencyActions: ['При ухудшении немедленно к ветеринару'],
      reasoning: 'Анализ на основе предоставленных симптомов'
    } : {
      recommendations: ['Monitor symptoms', 'Contact veterinarian'],
      nextSteps: ['Schedule vet appointment', 'Keep pet comfortable'],
      estimatedCauses: ['Requires professional evaluation'],
      homeRemedies: ['Keep pet comfortable', 'Monitor condition'],
      emergencyActions: ['Seek vet immediately if condition worsens'],
      reasoning: 'Analysis based on provided symptoms'
    }

    return {
      severity: partial?.severity || 'medium',
      urgency: partial?.urgency || 5,
      shouldSeeVet: partial?.shouldSeeVet ?? true,
      recommendations: partial?.recommendations || defaults.recommendations,
      nextSteps: partial?.nextSteps || defaults.nextSteps,
      estimatedCauses: partial?.estimatedCauses || defaults.estimatedCauses,
      homeRemedies: partial?.homeRemedies || defaults.homeRemedies,
      emergencyActions: partial?.emergencyActions || defaults.emergencyActions,
      confidence: partial?.confidence || 0.5,
      reasoning: partial?.reasoning || defaults.reasoning
    }
  }

  private getDefaultPhotoAnalysis(petInfo: { species: string, breed: string }, partial?: Partial<AIPhotoAnalysis>): AIPhotoAnalysis {
    return {
      petHealth: {
        mood: partial?.petHealth?.mood || 'спокойный',
        activity: partial?.petHealth?.activity || 'отдыхает',
        healthNotes: partial?.petHealth?.healthNotes || 'Питомец выглядит здоровым',
        weightEstimate: partial?.petHealth?.weightEstimate || 'Нормальный вес',
        coatCondition: partial?.petHealth?.coatCondition || 'Хорошее состояние',
        bodyLanguage: partial?.petHealth?.bodyLanguage || 'Расслабленное положение'
      },
      activity: partial?.activity || 'отдыхает',
      tags: partial?.tags || [petInfo.species, petInfo.breed, 'здоровый'],
      healthAlerts: partial?.healthAlerts || [],
      recommendations: partial?.recommendations || ['Регулярный уход', 'Сбалансированное питание'],
      confidence: partial?.confidence || 0.5
    }
  }

  // System health check
  async checkSystemHealth(): Promise<{
    isAvailable: boolean
    modelLoaded: boolean
    responseTime: number
    memoryUsage: number
    modelName: string
  }> {
    try {
      const startTime = Date.now()
      const response = await fetch(`${this.modelEndpoint}/api/tags`, {
        method: 'GET',
        timeout: 5000
      } as RequestInit & { timeout: number })

      const responseTime = Date.now() - startTime
      const isAvailable = response.ok
      
      return {
        isAvailable,
        modelLoaded: isAvailable,
        responseTime,
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
        modelName: this.modelName
      }
    } catch (error) {
      return {
        isAvailable: false,
        modelLoaded: false,
        responseTime: 0,
        memoryUsage: 0,
        modelName: this.modelName
      }
    }
  }

  // Save consultation to database
  async saveConsultation(userId: string, petId: string, input: AIConsultationInput, analysis: SymptomAnalysis) {
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
          confidence: analysis.confidence,
          reasoning: analysis.reasoning,
          createdAt: new Date()
        }
      })
    } catch (error) {
      console.error('Failed to save consultation:', error)
    }
  }
}

export const aiService = AIService.getInstance()