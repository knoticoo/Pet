import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface Pet {
  id: string
  name: string
  species: string
  breed?: string
  birthDate?: string
  gender?: string
  healthRecords?: Array<{
    title: string
    date: string
  }>
  vaccinations?: Array<{
    vaccineName: string
    dateGiven: string
  }>
}

interface VetConsultationRequest {
  petId: string
  symptoms: string
  urgency?: number
  duration?: string
  additionalInfo?: string
  enhancedAnalysis?: boolean
}

interface VetConsultationResponse {
  assessment: string
  confidence: number
  urgencyLevel: 'low' | 'moderate' | 'urgent' | 'emergency'
  urgencyExplanation: string
  possibleConditions: Array<{
    name: string
    description: string
    likelihood: number
  }>
  recommendations: Array<{
    title: string
    description: string
    priority: 'low' | 'medium' | 'high'
  }>
  followUpTimeline: string
  followUpReason: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { petId, symptoms, duration, additionalInfo, enhancedAnalysis }: VetConsultationRequest = await request.json()

    if (!petId || !symptoms) {
      return NextResponse.json({ error: 'Pet ID and symptoms are required' }, { status: 400 })
    }

    // Get pet details
    const pet = await prisma.pet.findFirst({
      where: { id: petId, userId: session.user.id },
      include: {
        healthRecords: { orderBy: { date: 'desc' }, take: 5 },
        vaccinations: { orderBy: { dateGiven: 'desc' }, take: 5 }
      }
    })

    if (!pet) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 })
    }

    // Try enhanced AI analysis first
    if (enhancedAnalysis) {
      const aiResult = await analyzeWithOllama(pet, symptoms, duration, additionalInfo)
      if (aiResult) {
        return NextResponse.json(aiResult)
      }
    }

    // Fallback to rule-based analysis
    const ruleBasedResult = analyzeWithRules(pet, symptoms, duration, additionalInfo)
    return NextResponse.json(ruleBasedResult)

  } catch (error) {
    console.error('Error in vet consultation:', error)
    return NextResponse.json(
      { error: 'Failed to analyze symptoms' },
      { status: 500 }
    )
  }
}

async function analyzeWithOllama(pet: Pet, symptoms: string, duration?: string, additionalInfo?: string): Promise<VetConsultationResponse | null> {
  try {
    const ollamaEndpoint = process.env.OLLAMA_ENDPOINT || 'http://localhost:11434'
    const ollamaModel = process.env.OLLAMA_MODEL || 'llama3.1:8b'

    const prompt = buildVetConsultationPrompt(pet, symptoms, duration, additionalInfo)

    const response = await fetch(`${ollamaEndpoint}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ollamaModel,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.3,
          top_p: 0.9,
          num_predict: 500
        }
      })
    })

    if (!response.ok) {
      console.error('Ollama request failed:', response.status)
      return null
    }

    const data = await response.json()
    return parseOllamaVetResponse(data.response)

  } catch (error) {
    console.error('Error calling Ollama for vet consultation:', error)
    return null
  }
}

function buildVetConsultationPrompt(pet: Pet, symptoms: string, duration?: string, additionalInfo?: string): string {
  const age = pet.birthDate ? Math.floor((Date.now() - new Date(pet.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 'unknown'
  
  return `You are an experienced veterinary AI assistant. Analyze the following pet health case and provide a comprehensive assessment.

Pet Information:
- Name: ${pet.name}
- Species: ${pet.species}
- Breed: ${pet.breed || 'Mixed/Unknown'}
- Age: ${age} years old
- Gender: ${pet.gender || 'Unknown'}

Current Symptoms: "${symptoms}"
${duration ? `Duration: ${duration}` : ''}
${additionalInfo ? `Additional Information: ${additionalInfo}` : ''}

Recent Health History:
${pet.healthRecords?.length > 0 ? pet.healthRecords.map((record) => `- ${record.title} (${new Date(record.date).toLocaleDateString()})`).join('\n') : 'No recent health records'}

Recent Vaccinations:
${pet.vaccinations?.length > 0 ? pet.vaccinations.map((vacc) => `- ${vacc.vaccineName} (${new Date(vacc.dateGiven).toLocaleDateString()})`).join('\n') : 'No recent vaccinations'}

Please provide a detailed analysis in EXACTLY this JSON format:
{
  "assessment": "Primary assessment of the symptoms and likely causes",
  "confidence": 0.85,
  "urgencyLevel": "low|moderate|urgent|emergency",
  "urgencyExplanation": "Explanation of urgency level",
  "possibleConditions": [
    {
      "name": "Condition name",
      "description": "Brief description",
      "likelihood": 0.7
    }
  ],
  "recommendations": [
    {
      "title": "Recommendation title",
      "description": "Detailed recommendation",
      "priority": "low|medium|high"
    }
  ],
  "followUpTimeline": "When to follow up (e.g., '24-48 hours', 'within a week')",
  "followUpReason": "Why follow-up is needed"
}

Important guidelines:
- Be thorough but not alarmist
- Consider the pet's species, age, and breed
- Prioritize safety - when in doubt, recommend veterinary consultation
- Provide actionable, specific recommendations
- Include both immediate care and monitoring advice

Analyze the case now:`
}

function parseOllamaVetResponse(response: string): VetConsultationResponse | null {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('No JSON found in Ollama vet response')
      return null
    }

    const parsed = JSON.parse(jsonMatch[0])
    
    // Validate required fields
    if (!parsed.assessment || !parsed.urgencyLevel) {
      console.error('Invalid Ollama vet response structure')
      return null
    }

    return {
      assessment: parsed.assessment,
      confidence: Math.max(0, Math.min(1, parsed.confidence || 0.7)),
      urgencyLevel: ['low', 'moderate', 'urgent', 'emergency'].includes(parsed.urgencyLevel) 
        ? parsed.urgencyLevel 
        : 'moderate',
      urgencyExplanation: parsed.urgencyExplanation || 'Standard monitoring recommended',
      possibleConditions: Array.isArray(parsed.possibleConditions) 
        ? parsed.possibleConditions.map((condition) => ({
            name: condition.name || 'Unknown condition',
            description: condition.description || '',
            likelihood: Math.max(0, Math.min(1, condition.likelihood || 0.5))
          }))
        : [],
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations.map((rec) => ({
            title: rec.title || rec,
            description: rec.description || '',
            priority: ['low', 'medium', 'high'].includes(rec.priority) ? rec.priority : 'medium'
          }))
        : [],
      followUpTimeline: parsed.followUpTimeline || 'Within 1-2 weeks',
      followUpReason: parsed.followUpReason || 'Monitor symptoms and ensure improvement'
    }

  } catch (error) {
    console.error('Error parsing Ollama vet response:', error)
    return null
  }
}

function analyzeWithRules(pet: Pet, symptoms: string): VetConsultationResponse {
  const symptomsLower = symptoms.toLowerCase()
  
  // Emergency keywords
  const emergencyKeywords = ['bleeding', 'blood', 'seizure', 'unconscious', 'difficulty breathing', 'choking', 'poisoned', 'hit by car', 'broken bone']
  const urgentKeywords = ['vomiting', 'diarrhea', 'fever', 'pain', 'limping', 'not eating', 'lethargic']
  const moderateKeywords = ['scratching', 'sneezing', 'coughing', 'discharge', 'appetite change']
  
  let urgencyLevel: 'low' | 'moderate' | 'urgent' | 'emergency' = 'low'
  let urgencyExplanation = 'Symptoms appear mild and can likely be monitored at home.'
  
  if (emergencyKeywords.some(keyword => symptomsLower.includes(keyword))) {
    urgencyLevel = 'emergency'
    urgencyExplanation = 'These symptoms require immediate veterinary attention.'
  } else if (urgentKeywords.some(keyword => symptomsLower.includes(keyword))) {
    urgencyLevel = 'urgent'
    urgencyExplanation = 'These symptoms should be evaluated by a veterinarian within 24 hours.'
  } else if (moderateKeywords.some(keyword => symptomsLower.includes(keyword))) {
    urgencyLevel = 'moderate'
    urgencyExplanation = 'Monitor symptoms and consider veterinary consultation if they persist or worsen.'
  }

  // Generate species-specific recommendations
  const speciesRecommendations = getSpeciesRecommendations(pet.species, symptomsLower)
  
  return {
    assessment: `Based on the described symptoms for ${pet.name}, a ${pet.species}, this appears to be a ${urgencyLevel} priority case. The symptoms suggest possible ${getGeneralCondition(symptomsLower)} that should be monitored closely.`,
    confidence: 0.7,
    urgencyLevel,
    urgencyExplanation,
    possibleConditions: getPossibleConditions(symptomsLower, pet.species),
    recommendations: [
      ...speciesRecommendations,
      {
        title: 'Monitor Symptoms',
        description: 'Keep a detailed log of symptoms, including frequency, severity, and any changes.',
        priority: 'medium' as const
      },
      {
        title: 'Ensure Comfort',
        description: 'Provide a quiet, comfortable environment and ensure access to fresh water.',
        priority: 'low' as const
      }
    ],
    followUpTimeline: urgencyLevel === 'emergency' ? 'Immediately' : 
                     urgencyLevel === 'urgent' ? 'Within 24 hours' :
                     urgencyLevel === 'moderate' ? 'Within 2-3 days' : 'Within a week',
    followUpReason: 'To ensure symptoms are improving and no complications develop.'
  }
}

function getSpeciesRecommendations() {
  const speciesLower = species.toLowerCase()
  
  const recommendations = []
  
  if (speciesLower === 'dog') {
    recommendations.push({
      title: 'Check for Dehydration',
      description: 'Gently pinch the skin on the back of the neck. It should snap back quickly if properly hydrated.',
      priority: 'medium' as const
    })
  } else if (speciesLower === 'cat') {
    recommendations.push({
      title: 'Monitor Litter Box Usage',
      description: 'Changes in urination or defecation patterns can indicate health issues in cats.',
      priority: 'medium' as const
    })
  } else if (speciesLower === 'bird') {
    recommendations.push({
      title: 'Maintain Proper Temperature',
      description: 'Birds are sensitive to temperature changes. Ensure a warm, draft-free environment.',
      priority: 'high' as const
    })
  }
  
  return recommendations
}

function getPossibleConditions() {
  const conditions = []
  
  if (symptoms.includes('vomiting') || symptoms.includes('diarrhea')) {
    conditions.push({
      name: 'Gastrointestinal Upset',
      description: 'Digestive system irritation, possibly from dietary changes or stress',
      likelihood: 0.8
    })
  }
  
  if (symptoms.includes('scratching') || symptoms.includes('itching')) {
    conditions.push({
      name: 'Skin Irritation/Allergies',
      description: 'Possible allergic reaction or skin condition',
      likelihood: 0.7
    })
  }
  
  if (symptoms.includes('coughing') || symptoms.includes('sneezing')) {
    conditions.push({
      name: 'Upper Respiratory Issue',
      description: 'Possible cold, allergies, or respiratory infection',
      likelihood: 0.6
    })
  }
  
  return conditions
}

function getGeneralCondition(symptoms: string): string {
  if (symptoms.includes('vomiting') || symptoms.includes('diarrhea')) return 'digestive issues'
  if (symptoms.includes('scratching') || symptoms.includes('itching')) return 'skin irritation'
  if (symptoms.includes('coughing') || symptoms.includes('sneezing')) return 'respiratory symptoms'
  if (symptoms.includes('limping') || symptoms.includes('pain')) return 'discomfort or injury'
  return 'general health concerns'
}