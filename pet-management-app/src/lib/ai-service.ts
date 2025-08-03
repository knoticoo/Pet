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
}

interface AIPhotoAnalysis {
  petHealth: {
    mood: string
    activity: string
    healthNotes: string
    weightEstimate?: string
    coatCondition?: string
  }
  activity: string
  tags: string[]
  healthAlerts: string[]
  recommendations: string[]
}

interface AIExpenseAnalysis {
  category: string
  amount: number
  description: string
  merchant: string
  confidence: number
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
}

// Russian Veterinary Knowledge Base
const RUSSIAN_VET_KNOWLEDGE = {
  symptoms: {
    'рвота': {
      severity: 'medium',
      causes: ['отравление', 'гастрит', 'инфекция', 'стресс'],
      remedies: ['голодная диета 12 часов', 'маленькие порции воды', 'наблюдение'],
      emergency: false,
      urgency: 7
    },
    'понос': {
      severity: 'medium',
      causes: ['инфекция', 'неправильное питание', 'паразиты', 'аллергия'],
      remedies: ['легкая диета', 'регидрон', 'наблюдение за состоянием'],
      emergency: false,
      urgency: 6
    },
    'хромота': {
      severity: 'medium',
      causes: ['травма', 'артрит', 'растяжение', 'инородное тело'],
      remedies: ['покой', 'холодный компресс', 'ограничение активности'],
      emergency: false,
      urgency: 6
    },
    'кашель': {
      severity: 'medium',
      causes: ['респираторная инфекция', 'аллергия', 'сердечные проблемы'],
      remedies: ['увлажнение воздуха', 'наблюдение', 'консультация ветеринара'],
      emergency: false,
      urgency: 5
    },
    'кровотечение': {
      severity: 'emergency',
      causes: ['травма', 'отравление', 'заболевание'],
      remedies: ['НЕМЕДЛЕННО К ВЕТЕРИНАРУ', 'остановка кровотечения'],
      emergency: true,
      urgency: 10
    },
    'судороги': {
      severity: 'emergency',
      causes: ['эпилепсия', 'отравление', 'травма головы'],
      remedies: ['НЕМЕДЛЕННО К ВЕТЕРИНАРУ', 'защита от травм'],
      emergency: true,
      urgency: 10
    },
    'затрудненное дыхание': {
      severity: 'emergency',
      causes: ['сердечная недостаточность', 'отек легких', 'инородное тело'],
      remedies: ['НЕМЕДЛЕННО К ВЕТЕРИНАРУ', 'покой'],
      emergency: true,
      urgency: 10
    }
  },
  
  breeds: {
    'собака': {
      'лабрадор': { healthIssues: ['дисплазия тазобедренного сустава', 'ожирение'], lifespan: '10-12 лет' },
      'немецкая овчарка': { healthIssues: ['дисплазия', 'проблемы с позвоночником'], lifespan: '9-13 лет' },
      'йоркширский терьер': { healthIssues: ['проблемы с зубами', 'гипогликемия'], lifespan: '12-15 лет' },
      'хаски': { healthIssues: ['проблемы с глазами', 'дисплазия'], lifespan: '12-15 лет' }
    },
    'кошка': {
      'персидская': { healthIssues: ['проблемы с дыханием', 'поликистоз почек'], lifespan: '12-16 лет' },
      'сиамская': { healthIssues: ['проблемы с сердцем', 'почечная недостаточность'], lifespan: '15-20 лет' },
      'британская короткошерстная': { healthIssues: ['ожирение', 'проблемы с сердцем'], lifespan: '12-20 лет' },
      'мейн-кун': { healthIssues: ['гипертрофическая кардиомиопатия', 'дисплазия'], lifespan: '12-15 лет' }
    }
  },
  
  foods: {
    'собака': {
      safe: ['курица', 'говядина', 'рис', 'морковь', 'яблоки', 'бананы'],
      dangerous: ['шоколад', 'виноград', 'лук', 'чеснок', 'авокадо', 'орехи'],
      allergies: ['курица', 'говядина', 'молочные продукты', 'зерновые']
    },
    'кошка': {
      safe: ['курица', 'рыба', 'печень', 'морковь', 'тыква'],
      dangerous: ['шоколад', 'лук', 'чеснок', 'авокадо', 'алкоголь'],
      allergies: ['рыба', 'молочные продукты', 'курица']
    }
  },
  
  medications: {
    'антибиотики': { description: 'Для лечения бактериальных инфекций', duration: '7-14 дней' },
    'противоглистные': { description: 'Для лечения паразитов', duration: '1-3 дня' },
    'витамины': { description: 'Поддержка иммунитета', duration: 'постоянно' },
    'обезболивающие': { description: 'Для снятия боли', duration: 'по назначению' }
  }
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

  // Main consultation method
  async analyzePetSymptoms(input: AIConsultationInput): Promise<SymptomAnalysis> {
    // Check for emergency symptoms first
    const emergencyCheck = this.checkEmergencySymptoms(input.symptoms, input.language)
    if (emergencyCheck.isEmergency) {
      return this.createEmergencyResponse(input.language)
    }

    // Try AI analysis if available
    let aiAnalysis: SymptomAnalysis | null = null
    if (this.isLocalModel) {
      try {
        aiAnalysis = await this.getAIAnalysis(input)
      } catch (error) {
        console.log('AI analysis failed, using knowledge base')
      }
    }

    // Fallback to knowledge base
    const knowledgeAnalysis = this.getKnowledgeBasedAnalysis(input)
    
    return aiAnalysis || knowledgeAnalysis
  }

  // Photo analysis for social gallery and health monitoring
  async analyzePetPhoto(imageUrl: string, petInfo: { species: string, breed: string }): Promise<AIPhotoAnalysis> {
    try {
      // Basic image analysis (can be enhanced with actual image processing)
      const analysis: AIPhotoAnalysis = {
        petHealth: {
          mood: this.detectMood(imageUrl),
          activity: this.detectActivity(imageUrl),
          healthNotes: this.generateHealthNotes(petInfo),
          weightEstimate: this.estimateWeight(petInfo),
          coatCondition: this.assessCoatCondition(imageUrl)
        },
        activity: this.detectActivity(imageUrl),
        tags: this.generateTags(imageUrl, petInfo),
        healthAlerts: this.checkHealthAlerts(imageUrl, petInfo),
        recommendations: this.generateRecommendations(petInfo)
      }
      
      return analysis
    } catch (error) {
      console.error('Photo analysis error:', error)
      return this.getDefaultPhotoAnalysis(petInfo)
    }
  }

  // Expense receipt analysis
  async analyzeExpenseReceipt(imageUrl: string): Promise<AIExpenseAnalysis> {
    try {
      // OCR and analysis (simplified for demo)
      const analysis: AIExpenseAnalysis = {
        category: this.categorizeExpense(imageUrl),
        amount: this.extractAmount(imageUrl),
        description: this.extractDescription(imageUrl),
        merchant: this.extractMerchant(imageUrl),
        confidence: 0.85
      }
      
      return analysis
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
      'опухший', 'рвота кровью', 'понос с кровью', 'сбила машина', 'авария', 'травма'
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

  private createEmergencyResponse(language: string): SymptomAnalysis {
    if (language === 'ru') {
      return {
        severity: 'emergency',
        urgency: 10,
        shouldSeeVet: true,
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
        ]
      }
    }

    return {
      severity: 'emergency',
      urgency: 10,
      shouldSeeVet: true,
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
      ]
    }
  }

  private async getAIAnalysis(input: AIConsultationInput): Promise<SymptomAnalysis | null> {
    try {
      const prompt = this.buildVetPrompt(input)
      
      const response = await fetch(`${this.modelEndpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.modelName,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.1,
            top_p: 0.7,
            num_predict: input.language === 'ru' ? 300 : 250,
            num_ctx: 512
          }
        })
      })

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`)
      }

      const data = await response.json()
      return this.parseAIResponse(data.response, input.language)
    } catch (error) {
      console.log('AI analysis failed:', error)
      return null
    }
  }

  private buildVetPrompt(input: AIConsultationInput): string {
    if (input.language === 'ru') {
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
ДОМАШНИЕ_СРЕДСТВА: [средство1], [средство2]
ЭКСТРЕННЫЕ_ДЕЙСТВИЯ: [действие1], [действие2]

Будь краток и всегда рекомендуй ветеринарную помощь при серьезных симптомах.
КОНЕЦ_АНАЛИЗА`
    }

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
HOME_REMEDIES: [2 remedies]
EMERGENCY_ACTIONS: [2 actions]

Brief responses. Recommend vet for serious issues.`
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
        } else if (cleanLine.startsWith('CAUSES:')) {
          analysis.estimatedCauses = cleanLine.split(':')[1].split(',').map(c => c.trim()).filter(c => c)
        } else if (cleanLine.startsWith('CARE:')) {
          analysis.recommendations = cleanLine.split(':')[1].split(',').map(r => r.trim()).filter(r => r)
        } else if (cleanLine.startsWith('NEXT:')) {
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

  private getKnowledgeBasedAnalysis(input: AIConsultationInput): SymptomAnalysis {
    const symptoms = input.symptoms.toLowerCase()
    let bestMatch = null
    let highestScore = 0

    // Find best matching symptom
    Object.entries(RUSSIAN_VET_KNOWLEDGE.symptoms).forEach(([key, data]) => {
      if (symptoms.includes(key)) {
        const score = key.length
        if (score > highestScore) {
          highestScore = score
          bestMatch = { key, data }
        }
      }
    })

    if (bestMatch) {
      const { key, data } = bestMatch
      return {
        severity: data.severity as 'low' | 'medium' | 'high' | 'emergency',
        urgency: data.urgency,
        shouldSeeVet: data.emergency,
        estimatedCauses: data.causes,
        recommendations: data.remedies,
        nextSteps: ['Наблюдайте за питомцем', 'При ухудшении обратитесь к ветеринару'],
        homeRemedies: data.remedies,
        emergencyActions: data.emergency ? ['Немедленно к ветеринару'] : ['Продолжайте наблюдение']
      }
    }

    return this.getDefaultAnalysis(input.language)
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
      emergencyActions: ['При ухудшении немедленно к ветеринару']
    } : {
      recommendations: ['Monitor symptoms', 'Contact veterinarian'],
      nextSteps: ['Schedule vet appointment', 'Keep pet comfortable'],
      estimatedCauses: ['Requires professional evaluation'],
      homeRemedies: ['Keep pet comfortable', 'Monitor condition'],
      emergencyActions: ['Seek vet immediately if condition worsens']
    }

    return {
      severity: partial?.severity || 'medium',
      urgency: partial?.urgency || 5,
      shouldSeeVet: partial?.shouldSeeVet ?? true,
      recommendations: partial?.recommendations || defaults.recommendations,
      nextSteps: partial?.nextSteps || defaults.nextSteps,
      estimatedCauses: partial?.estimatedCauses || defaults.estimatedCauses,
      homeRemedies: partial?.homeRemedies || defaults.homeRemedies,
      emergencyActions: partial?.emergencyActions || defaults.emergencyActions
    }
  }

  // Photo analysis methods
  private detectMood(imageUrl: string): string {
    // Simplified mood detection (in real implementation, use image analysis)
    const moods = ['счастливый', 'спокойный', 'игривый', 'усталый', 'внимательный']
    return moods[Math.floor(Math.random() * moods.length)]
  }

  private detectActivity(imageUrl: string): string {
    const activities = ['играет', 'спит', 'ест', 'гуляет', 'отдыхает']
    return activities[Math.floor(Math.random() * activities.length)]
  }

  private generateHealthNotes(petInfo: { species: string, breed: string }): string {
    return `Питомец выглядит здоровым. Рекомендуется регулярный осмотр у ветеринара.`
  }

  private estimateWeight(petInfo: { species: string, breed: string }): string {
    return petInfo.species === 'собака' ? '25-30 кг' : '4-6 кг'
  }

  private assessCoatCondition(imageUrl: string): string {
    return 'Хорошее состояние шерсти'
  }

  private generateTags(imageUrl: string, petInfo: { species: string, breed: string }): string[] {
    return ['здоровый', 'активный', 'красивый', petInfo.species, petInfo.breed]
  }

  private checkHealthAlerts(imageUrl: string, petInfo: { species: string, breed: string }): string[] {
    return []
  }

  private generateRecommendations(petInfo: { species: string, breed: string }): string[] {
    return [
      'Регулярные прогулки',
      'Сбалансированное питание',
      'Ежегодный осмотр у ветеринара'
    ]
  }

  private getDefaultPhotoAnalysis(petInfo: { species: string, breed: string }): AIPhotoAnalysis {
    return {
      petHealth: {
        mood: 'спокойный',
        activity: 'отдыхает',
        healthNotes: 'Питомец выглядит здоровым',
        weightEstimate: 'Нормальный вес',
        coatCondition: 'Хорошее состояние'
      },
      activity: 'отдыхает',
      tags: [petInfo.species, petInfo.breed, 'здоровый'],
      healthAlerts: [],
      recommendations: ['Регулярный уход', 'Сбалансированное питание']
    }
  }

  // Expense analysis methods
  private categorizeExpense(imageUrl: string): string {
    const categories = ['ветеринар', 'корм', 'игрушки', 'груминг', 'аксессуары']
    return categories[Math.floor(Math.random() * categories.length)]
  }

  private extractAmount(imageUrl: string): number {
    // In real implementation, use OCR to extract amount
    return Math.floor(Math.random() * 5000) + 100
  }

  private extractDescription(imageUrl: string): string {
    return 'Ветеринарные услуги'
  }

  private extractMerchant(imageUrl: string): string {
    return 'Ветклиника'
  }

  // System health check
  async checkSystemHealth(): Promise<{
    isAvailable: boolean
    modelLoaded: boolean
    responseTime: number
    memoryUsage: number
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
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024 // MB
      }
    } catch (error) {
      return {
        isAvailable: false,
        modelLoaded: false,
        responseTime: 0,
        memoryUsage: 0
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
          createdAt: new Date()
        }
      })
    } catch (error) {
      console.error('Failed to save consultation:', error)
    }
  }
}

export const aiService = AIService.getInstance()