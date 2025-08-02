import { prisma } from '@/lib/prisma'

interface PetCompanionResponse {
  message: string
  mood: 'happy' | 'excited' | 'calm' | 'curious' | 'playful' | 'sleepy'
  action: string
  healthTip?: string
  activitySuggestion?: string
  careReminder?: string
}

export class AIPetCompanion {
  private static instance: AIPetCompanion
  private ollamaEndpoint = process.env.OLLAMA_ENDPOINT || 'http://localhost:11434'
  private ollamaModel = process.env.OLLAMA_MODEL || 'llama3.1:8b'

  static getInstance(): AIPetCompanion {
    if (!AIPetCompanion.instance) {
      AIPetCompanion.instance = new AIPetCompanion()
    }
    return AIPetCompanion.instance
  }

  // Species-specific behaviors and responses
  private speciesBehaviors = {
    dog: {
      greetings: ['Woof!', 'Hello!', 'Hi there!', 'Hey!'],
      actions: ['wags tail', 'jumps excitedly', 'brings favorite toy', 'gives paw'],
      moods: ['excited', 'happy', 'playful'],
      activities: ['play fetch', 'go for walk', 'training session', 'cuddle time']
    },
    cat: {
      greetings: ['Meow!', 'Purr...', 'Hello human', 'Hey there'],
      actions: ['purrs softly', 'stretches lazily', 'curls up', 'rubs against you'],
      moods: ['calm', 'curious', 'sleepy', 'playful'],
      activities: ['play with laser', 'climbing time', 'sunbathing', 'grooming session']
    },
    bird: {
      greetings: ['Tweet!', 'Hello!', 'Chirp chirp!', 'Hi there!'],
      actions: ['sings a song', 'fluffs feathers', 'hops around', 'tilts head'],
      moods: ['happy', 'curious', 'excited'],
      activities: ['singing time', 'flying exercise', 'toy play', 'social time']
    },
    rabbit: {
      greetings: ['*nuzzles*', 'Hello!', 'Hi there!', 'Hey!'],
      actions: ['hops around', 'nuzzles hand', 'stretches', 'binkies'],
      moods: ['happy', 'calm', 'curious'],
      activities: ['hopping exercise', 'treat time', 'grooming', 'exploration']
    }
  }

  async interactWithPet(petId: string, interactionType: string, userId: string): Promise<PetCompanionResponse> {
    try {
      // Get pet details
      const pet = await prisma.pet.findFirst({
        where: { id: petId, userId },
        include: {
          healthRecords: { orderBy: { date: 'desc' }, take: 5 },
          vaccinations: { orderBy: { dateGiven: 'desc' }, take: 5 },
          appointments: { where: { status: 'scheduled' }, orderBy: { date: 'asc' }, take: 3 }
        }
      })

      if (!pet) {
        throw new Error('Pet not found')
      }

      // Generate AI response
      const aiResponse = await this.generateAIResponse(pet, interactionType)
      
      // Fallback to rule-based response if AI fails
      if (!aiResponse) {
        return this.getRuleBasedResponse(pet, interactionType)
      }

      return aiResponse
    } catch (error) {
      console.error('Error in pet interaction:', error)
      return this.getDefaultResponse()
    }
  }

  private async generateAIResponse(pet: {
    id: string;
    name: string;
    species: string;
    breed?: string;
    birthDate?: Date;
    healthRecords: Array<{ date: Date; title: string; diagnosis?: string }>;
    vaccinations: Array<{ dateGiven: Date; vaccineName: string }>;
    appointments: Array<{ date: Date; title: string; status: string }>;
  }, interactionType: string): Promise<PetCompanionResponse | null> {
    try {
      const prompt = this.buildPetPrompt(pet, interactionType)
      
      const response = await fetch(`${this.ollamaEndpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.ollamaModel,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            max_tokens: 200
          }
        })
      })

      if (!response.ok) {
        throw new Error('Ollama API error')
      }

      const data = await response.json()
      return this.parseAIResponse(data.response, pet.species)
    } catch {
      console.log('AI response generation failed, using fallback')
      return null
    }
  }

  private buildPetPrompt(pet: {
    id: string;
    name: string;
    species: string;
    breed?: string;
    birthDate?: Date;
    healthRecords: Array<{ date: Date; title: string; diagnosis?: string }>;
    vaccinations: Array<{ dateGiven: Date; vaccineName: string }>;
    appointments: Array<{ date: Date; title: string; status: string }>;
  }, interactionType: string): string {
    const species = pet.species.toLowerCase()
    const behaviors = this.speciesBehaviors[species as keyof typeof this.speciesBehaviors] || this.speciesBehaviors.dog
    
    return `You are ${pet.name}, a ${pet.age || 'young'} ${pet.breed || species} ${species}. 
    
Pet details:
- Name: ${pet.name}
- Breed: ${pet.breed || 'Unknown'}
- Age: ${this.calculateAge(pet.birthDate)} years
- Personality: ${pet.personality || 'friendly'}
- Temperament: ${pet.temperament || 'calm'}
- Favorite food: ${pet.favoriteFood || 'treats'}
- Favorite toy: ${pet.favoriteToy || 'any toy'}

Interaction type: ${interactionType}

Respond as ${pet.name} would, using ${species} behaviors. Include:
1. A greeting or response (${behaviors.greetings.join(', ')})
2. An action (${behaviors.actions.join(', ')})
3. Current mood (${behaviors.moods.join(', ')})
4. A health tip or care reminder if relevant
5. An activity suggestion (${behaviors.activities.join(', ')})

Keep it short, friendly, and in character. Format as JSON:
{
  "message": "response text",
  "mood": "mood",
  "action": "action description",
  "healthTip": "optional health tip",
  "activitySuggestion": "activity suggestion"
}`
  }

  private parseAIResponse(response: string, species: string): PetCompanionResponse {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          message: parsed.message || this.getDefaultGreeting(species),
          mood: parsed.mood || 'happy',
          action: parsed.action || 'looks at you curiously',
          healthTip: parsed.healthTip,
          activitySuggestion: parsed.activitySuggestion,
          careReminder: parsed.careReminder
        }
      }
    } catch {
      console.log('Failed to parse AI response')
    }

    return this.getDefaultResponse()
  }

  private getRuleBasedResponse(pet: {
    id: string;
    name: string;
    species: string;
    breed?: string;
    birthDate?: Date;
    healthRecords: Array<{ date: Date; title: string; diagnosis?: string }>;
    vaccinations: Array<{ dateGiven: Date; vaccineName: string }>;
    appointments: Array<{ date: Date; title: string; status: string }>;
  }, interactionType: string): PetCompanionResponse {
    const species = pet.species.toLowerCase()
    const behaviors = this.speciesBehaviors[species as keyof typeof this.speciesBehaviors] || this.speciesBehaviors.dog
    
    const greeting = behaviors.greetings[Math.floor(Math.random() * behaviors.greetings.length)]
    const action = behaviors.actions[Math.floor(Math.random() * behaviors.actions.length)]
    const mood = behaviors.moods[Math.floor(Math.random() * behaviors.moods.length)]
    const activity = behaviors.activities[Math.floor(Math.random() * behaviors.activities.length)]

    let message = greeting
    let healthTip: string | undefined
    let careReminder: string | undefined

    switch (interactionType) {
      case 'pet':
        message = `${greeting} ${action}`
        break
      case 'play':
        message = `${greeting} Ready for ${activity}!`
        break
      case 'feed':
        message = `${greeting} ${pet.favoriteFood ? `I love ${pet.favoriteFood}!` : 'Yummy!'}`
        healthTip = 'Remember to provide fresh water daily'
        break
      case 'walk':
        if (species === 'dog') {
          message = `${greeting} Let's go for a walk!`
          healthTip = 'Regular exercise helps maintain healthy weight and behavior'
        }
        break
      case 'groom':
        message = `${greeting} I love being pampered!`
        careReminder = 'Regular grooming keeps me healthy and happy'
        break
    }

    return {
      message,
      mood: mood as 'happy' | 'excited' | 'calm' | 'curious' | 'playful' | 'sleepy',
      action,
      healthTip,
      activitySuggestion: activity,
      careReminder
    }
  }

  private getDefaultResponse(): PetCompanionResponse {
    return {
      message: 'Hello! I love spending time with you!',
      mood: 'happy',
      action: 'looks at you with love'
    }
  }

  private getDefaultGreeting(species: string): string {
    const greetings = {
      dog: 'Woof! Hello!',
      cat: 'Meow! Hi there!',
      bird: 'Tweet! Hello!',
      rabbit: '*nuzzles* Hello!'
    }
    return greetings[species as keyof typeof greetings] || 'Hello!'
  }

  private calculateAge(birthDate: Date | null): number {
    if (!birthDate) return 1
    const today = new Date()
    const birth = new Date(birthDate)
    const age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return Math.max(0, age - 1)
    }
    return age
  }

  async getPetInsights(petId: string, userId: string): Promise<{
    healthStatus: {
      status: string;
      lastCheckup: string | null;
      vaccinations: number;
      recommendations: string[];
    };
    activityLevel: {
      level: string;
      weeklyDuration: number;
      recommendations: string[];
    };
    careRecommendations: string[];
    upcomingEvents: Array<{ id: string; title: string; date: string; type: string }>;
    funFacts: string[];
  }> {
    try {
      const pet = await prisma.pet.findFirst({
        where: { id: petId, userId },
        include: {
          healthRecords: { orderBy: { date: 'desc' }, take: 10 },
          vaccinations: { orderBy: { dateGiven: 'desc' }, take: 10 },
          appointments: { orderBy: { date: 'asc' }, take: 5 },
          activities: { orderBy: { date: 'desc' }, take: 10 },
          expenses: { orderBy: { date: 'desc' }, take: 10 }
        }
      })

      if (!pet) return null

      const insights = {
        healthStatus: this.analyzeHealthStatus(pet),
        activityLevel: this.analyzeActivityLevel(pet),
        careRecommendations: this.generateCareRecommendations(pet),
        upcomingEvents: this.getUpcomingEvents(pet),
        funFacts: this.generateFunFacts(pet)
      }

      return insights
    } catch (error) {
      console.error('Error getting pet insights:', error)
      return {
        healthStatus: { status: 'unknown', lastCheckup: null, vaccinations: 0, recommendations: [] },
        activityLevel: { level: 'unknown', weeklyDuration: 0, recommendations: [] },
        careRecommendations: [],
        upcomingEvents: [],
        funFacts: []
      }
    }
  }

  private analyzeHealthStatus(pet: {
    id: string;
    name: string;
    species: string;
    breed?: string;
    birthDate?: Date;
    healthRecords: Array<{ date: Date; title: string; diagnosis?: string }>;
    vaccinations: Array<{ dateGiven: Date; vaccineName: string }>;
    appointments: Array<{ date: Date; title: string; status: string }>;
  }): {
    status: string;
    lastCheckup: string | null;
    vaccinations: number;
    recommendations: string[];
  } {
    const recentHealthRecords = pet.healthRecords.slice(0, 3)
    const recentVaccinations = pet.vaccinations.slice(0, 3)
    
    return {
      status: recentHealthRecords.length === 0 ? 'healthy' : 'monitoring',
      lastCheckup: recentHealthRecords[0]?.date || null,
      vaccinations: recentVaccinations.length,
      recommendations: this.getHealthRecommendations(pet)
    }
  }

  private analyzeActivityLevel(pet: {
    id: string;
    name: string;
    species: string;
    breed?: string;
    birthDate?: Date;
    healthRecords: Array<{ date: Date; title: string; diagnosis?: string }>;
    vaccinations: Array<{ dateGiven: Date; vaccineName: string }>;
    appointments: Array<{ date: Date; title: string; status: string }>;
  }): {
    level: string;
    weeklyDuration: number;
    recommendations: string[];
  } {
    const recentActivities = pet.activities?.slice(0, 7) || []
    const totalDuration = recentActivities.reduce((sum: number, activity: { duration?: number }) => sum + (activity.duration || 0), 0)
    
    return {
      level: totalDuration > 300 ? 'high' : totalDuration > 150 ? 'medium' : 'low',
      weeklyDuration: totalDuration,
      recommendations: this.getActivityRecommendations(pet)
    }
  }

  private generateCareRecommendations(pet: {
    id: string;
    name: string;
    species: string;
    breed?: string;
    birthDate?: Date;
    healthRecords: Array<{ date: Date; title: string; diagnosis?: string }>;
    vaccinations: Array<{ dateGiven: Date; vaccineName: string }>;
    appointments: Array<{ date: Date; title: string; status: string }>;
  }): string[] {
    const recommendations = []
    const age = this.calculateAge(pet.birthDate)
    
    if (age > 7) {
      recommendations.push('Consider senior pet care and more frequent vet checkups')
    }
    
    if (pet.species === 'dog') {
      recommendations.push('Regular exercise and training sessions recommended')
    } else if (pet.species === 'cat') {
      recommendations.push('Provide scratching posts and climbing opportunities')
    }
    
    return recommendations
  }

  private getUpcomingEvents(pet: {
    id: string;
    name: string;
    species: string;
    breed?: string;
    birthDate?: Date;
    healthRecords: Array<{ date: Date; title: string; diagnosis?: string }>;
    vaccinations: Array<{ dateGiven: Date; vaccineName: string }>;
    appointments: Array<{ date: Date; title: string; status: string }>;
  }): Array<{ id: string; title: string; date: string; type: string }> {
    const events = []
    
    pet.appointments.forEach((appointment: { id: string; date: Date; title: string; status: string }) => {
      events.push({
        id: appointment.id,
        title: appointment.title,
        date: appointment.date.toISOString(),
        type: 'appointment'
      })
    })
    
    return events
  }

  private generateFunFacts(pet: {
    id: string;
    name: string;
    species: string;
    breed?: string;
    birthDate?: Date;
    healthRecords: Array<{ date: Date; title: string; diagnosis?: string }>;
    vaccinations: Array<{ dateGiven: Date; vaccineName: string }>;
    appointments: Array<{ date: Date; title: string; status: string }>;
  }): string[] {
    const facts = []
    const species = pet.species.toLowerCase()
    
    if (species === 'dog') {
      facts.push('Dogs can understand up to 250 words and gestures')
      facts.push('A dog\'s sense of smell is 40 times greater than humans')
    } else if (species === 'cat') {
      facts.push('Cats spend 70% of their lives sleeping')
      facts.push('A cat\'s purr can help heal bones and reduce pain')
    }
    
    return facts
  }

  private getHealthRecommendations(pet: {
    id: string;
    name: string;
    species: string;
    breed?: string;
    birthDate?: Date;
    healthRecords: Array<{ date: Date; title: string; diagnosis?: string }>;
    vaccinations: Array<{ dateGiven: Date; vaccineName: string }>;
    appointments: Array<{ date: Date; title: string; status: string }>;
  }): string[] {
    const recommendations = []
    const age = this.calculateAge(pet.birthDate)
    
    if (age > 7) {
      recommendations.push('Schedule senior wellness exam')
    }
    
    if (pet.species === 'dog') {
      recommendations.push('Keep up with flea and tick prevention')
    }
    
    return recommendations
  }

  private getActivityRecommendations(pet: {
    id: string;
    name: string;
    species: string;
    breed?: string;
    birthDate?: Date;
    healthRecords: Array<{ date: Date; title: string; diagnosis?: string }>;
    vaccinations: Array<{ dateGiven: Date; vaccineName: string }>;
    appointments: Array<{ date: Date; title: string; status: string }>;
  }): string[] {
    const recommendations = []
    const species = pet.species.toLowerCase()
    
    if (species === 'dog') {
      recommendations.push('Aim for 30-60 minutes of exercise daily')
    } else if (species === 'cat') {
      recommendations.push('Provide interactive toys and climbing structures')
    }
    
    return recommendations
  }
}