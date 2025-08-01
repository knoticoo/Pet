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

  async analyzeSymptoms(input: ConsultationInput): Promise<SymptomAnalysis> {
    // First check for emergency keywords
    const isEmergency = this.checkForEmergency(input.symptoms)
    if (isEmergency) {
      return this.createEmergencyResponse()
    }

    // Try AI analysis first (if available)
    let aiAnalysis: SymptomAnalysis | null = null
    try {
      aiAnalysis = await this.getAIAnalysis(input)
    } catch (error) {
      console.log('AI analysis unavailable, using rule-based fallback')
    }

    // Fallback to rule-based analysis
    const ruleBasedAnalysis = this.getRuleBasedAnalysis(input)

    // Combine AI and rule-based if both available
    return aiAnalysis || ruleBasedAnalysis
  }

  private checkForEmergency(symptoms: string): boolean {
    const lowerSymptoms = symptoms.toLowerCase()
    return this.emergencyKeywords.some(keyword => 
      lowerSymptoms.includes(keyword)
    )
  }

  private createEmergencyResponse(): SymptomAnalysis {
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

  private buildVetPrompt(input: ConsultationInput): string {
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

  private async getAIAnalysis(input: ConsultationInput): Promise<SymptomAnalysis | null> {
    try {
      const endpoint = await this.findWorkingEndpoint()
      if (!endpoint) {
        console.log('No working Ollama endpoint found, using rule-based fallback')
        return null
      }

      const prompt = this.buildVetPrompt(input)
      
      const response = await fetch(`${endpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.ollamaModel,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.1, // Very low for consistent medical advice
            top_p: 0.7,
            num_predict: 200, // Short responses for small model
            // Optimized for phi3:mini
            num_ctx: 512, // Small context window
            num_thread: 1, // Single thread to save memory
            repeat_penalty: 1.1,
          }
        }),
        timeout: 15000 // Shorter timeout
      } as any)

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`)
      }

      const data = await response.json()
      return this.parseAIResponse(data.response)
    } catch (error) {
      console.log('AI analysis failed:', error)
      this.activeEndpoint = null
      return null
    }
  }

  private parseAIResponse(response: string): SymptomAnalysis {
    // Parse the structured AI response
    const lines = response.split('\n')
    const analysis: Partial<SymptomAnalysis> = {}

    lines.forEach(line => {
      const cleanLine = line.trim()
      if (cleanLine.startsWith('SEVERITY:')) {
        analysis.severity = cleanLine.split(':')[1].trim() as any
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
    })

    // Provide defaults if parsing failed
    return {
      severity: analysis.severity || 'medium',
      urgency: analysis.urgency || 5,
      shouldSeeVet: analysis.shouldSeeVet ?? true,
      recommendations: analysis.recommendations || ['Monitor symptoms', 'Contact veterinarian'],
      nextSteps: analysis.nextSteps || ['Schedule vet appointment', 'Keep pet comfortable'],
      estimatedCause: analysis.estimatedCause || ['Requires professional assessment']
    }
  }

  private getRuleBasedAnalysis(input: ConsultationInput): SymptomAnalysis {
    const symptoms = input.symptoms.toLowerCase()
    let bestMatch: any = null
    let highestScore = 0

    // Find best matching symptom in database
    Object.entries(this.symptomDatabase).forEach(([key, data]) => {
      if (symptoms.includes(key)) {
        const score = key.length // Longer matches get higher priority
        if (score > highestScore) {
          highestScore = score
          bestMatch = data
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
          'Monitor your pet closely',
          'Note any changes in behavior',
          'Consider consulting with a veterinarian'
        ],
        nextSteps: [
          'Keep a symptom diary',
          'Schedule vet appointment if symptoms persist',
          'Ensure pet is comfortable and hydrated'
        ],
        estimatedCause: ['Unknown - requires professional evaluation']
      }
    }

    return {
      severity: bestMatch.severity,
      urgency: bestMatch.urgency,
      shouldSeeVet: bestMatch.vetNeeded,
      recommendations: bestMatch.recommendations,
      nextSteps: [
        bestMatch.vetNeeded ? 'Schedule veterinary appointment' : 'Continue monitoring',
        'Keep pet comfortable',
        'Document any changes'
      ],
      estimatedCause: bestMatch.causes
    }
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
        } as any)
        
        if (response.ok) {
          this.activeEndpoint = endpoint
          console.log(`Found working Ollama at: ${endpoint}`)
          return endpoint
        }
      } catch (error) {
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
      } as any)
      
      if (response.ok) {
        const data = await response.json()
        return data.models?.some((model: any) => model.name.includes(this.ollamaModel.split(':')[0]))
      }
      return false
    } catch (error) {
      console.log('Ollama not available:', error)
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
      } as any)

      const modelLoaded = testResponse.ok
      
      return {
        ollamaAvailable: true,
        modelLoaded,
        systemHealth: modelLoaded ? 'good' : 'degraded',
        activeEndpoint: endpoint
      }
    } catch (error) {
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