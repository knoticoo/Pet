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

  private async getAIAnalysis(input: ConsultationInput): Promise<SymptomAnalysis | null> {
    try {
      // Use Ollama (free, self-hosted)
      const prompt = this.buildVetPrompt(input)
      
      const response = await fetch(`${this.ollamaEndpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.1:8b', // Free model
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.3, // Lower temperature for medical advice
            top_p: 0.9
          }
        })
      })

      if (!response.ok) {
        throw new Error('Ollama not available')
      }

      const data = await response.json()
      return this.parseAIResponse(data.response)
    } catch (error) {
      return null // Fallback to rule-based
    }
  }

  private buildVetPrompt(input: ConsultationInput): string {
    return `You are a veterinary AI assistant. Analyze these pet symptoms and provide guidance.

Pet Information:
- Species: ${input.petSpecies}
- Breed: ${input.petBreed}
- Age: ${input.petAge} years
- Symptoms: ${input.symptoms}
- Duration: ${input.duration}

Please provide:
1. Severity level (low/medium/high/emergency)
2. Possible causes (3-5 most likely)
3. Home care recommendations
4. Whether vet visit is needed
5. Urgency score (1-10)

IMPORTANT: Always recommend professional veterinary care for serious symptoms. This is preliminary guidance only.

Response format:
SEVERITY: [level]
URGENCY: [1-10]
VET_NEEDED: [yes/no]
CAUSES: [cause1, cause2, cause3]
RECOMMENDATIONS: [rec1, rec2, rec3]
NEXT_STEPS: [step1, step2, step3]`
  }

  private parseAIResponse(response: string): SymptomAnalysis {
    // Parse the structured AI response
    const lines = response.split('\n')
    const analysis: Partial<SymptomAnalysis> = {}

    lines.forEach(line => {
      if (line.startsWith('SEVERITY:')) {
        analysis.severity = line.split(':')[1].trim() as any
      } else if (line.startsWith('URGENCY:')) {
        analysis.urgency = parseInt(line.split(':')[1].trim())
      } else if (line.startsWith('VET_NEEDED:')) {
        analysis.shouldSeeVet = line.split(':')[1].trim().toLowerCase() === 'yes'
      } else if (line.startsWith('CAUSES:')) {
        analysis.estimatedCause = line.split(':')[1].split(',').map(c => c.trim())
      } else if (line.startsWith('RECOMMENDATIONS:')) {
        analysis.recommendations = line.split(':')[1].split(',').map(r => r.trim())
      } else if (line.startsWith('NEXT_STEPS:')) {
        analysis.nextSteps = line.split(':')[1].split(',').map(s => s.trim())
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

  async canUserConsult(userId: string): Promise<{ canConsult: boolean; remaining: number }> {
    const currentMonth = new Date()
    const consultationCount = await this.getUserConsultationCount(userId, currentMonth)
    const freeLimit = 3 // Free tier limit

    // Check if user has premium subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true }
    })

    const isPremium = user?.subscriptionTier === 'premium'
    const canConsult = isPremium || consultationCount < freeLimit
    const remaining = isPremium ? 999 : Math.max(0, freeLimit - consultationCount)

    return { canConsult, remaining }
  }
}

export const aiVetService = AIVetService.getInstance()