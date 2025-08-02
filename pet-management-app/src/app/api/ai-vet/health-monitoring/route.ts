import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSession } from "@/lib/session-types"
import { prisma } from '@/lib/prisma'
import { aiVetService } from '@/lib/ai-vet-service'

interface Pet {
  id: string
  name: string
  species: string
  breed?: string
  birthDate: Date
}

interface Appointment {
  id: string
  title: string
  appointmentType?: string
  date: Date
}

interface Expense {
  id: string
  title: string
  amount: number
  category: string
  date: Date
}

interface Consultation {
  id: string
  symptoms: string
  date: Date
}

interface HealthAnalysis {
  healthScore: number
  riskLevel: 'low' | 'medium' | 'high'
  trends: string[]
  predictions: string[]
  recommendations: string[]
  alerts: string[]
  prevention: string[]
  lastUpdated: string
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const petId = searchParams.get('petId')

    if (!petId) {
      return NextResponse.json({ error: 'Pet ID is required' }, { status: 400 })
    }

    // Get pet information
    const pet = await prisma.pet.findFirst({
      where: {
        id: petId,
        userId: session.user.id
      }
    })

    if (!pet) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 })
    }

    // Get recent health data
    const [appointments, expenses, consultations] = await Promise.all([
      // Recent appointments
      prisma.appointment.findMany({
        where: { petId, date: { gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) } },
        orderBy: { date: 'desc' },
        take: 10
      }),
      // Recent health-related expenses
      prisma.expense.findMany({
        where: { 
          petId, 
          category: { in: ['vet', 'medication', 'insurance'] },
          date: { gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) }
        },
        orderBy: { date: 'desc' },
        take: 20
      }),
      // Recent AI consultations
      prisma.aiConsultation.findMany({
        where: { petId, createdAt: { gte: new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000) } },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ])

    // Use AI to analyze health trends
    const healthAnalysis = await analyzeHealthTrendsWithAI({
      id: pet.id,
      name: pet.name,
      species: pet.species,
      breed: pet.breed || undefined,
      birthDate: pet.birthDate || new Date()
    }, appointments as never[], expenses as never[], consultations as never[])

    return NextResponse.json({
      pet: {
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        age: calculateAge(pet.birthDate || new Date())
      },
      healthAnalysis,
      dataPoints: {
        appointments: appointments.length,
        expenses: expenses.length,
        consultations: consultations.length
      }
    })

  } catch (error) {
    console.error('Error generating health monitoring:', error)
    return NextResponse.json({ error: 'Failed to generate health analysis' }, { status: 500 })
  }
}

function calculateAge(birthDate: Date): number {
  return Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
}

async function analyzeHealthTrendsWithAI(pet: Pet, appointments: Appointment[], expenses: Expense[], consultations: Consultation[]): Promise<HealthAnalysis> {
  try {
    const endpoint = await aiVetService.findWorkingEndpoint()
    if (!endpoint) {
      return getFallbackHealthAnalysis(pet, appointments, expenses, consultations)
    }

    const petAge = calculateAge(pet.birthDate)
    const totalHealthSpending = expenses.reduce((sum, exp) => sum + exp.amount, 0)
    
    // Prepare data summary for AI
    const recentSymptoms = consultations.map(c => c.symptoms).join('; ')
    const recentAppointments = appointments.map(a => `${a.title} - ${a.appointmentType || 'general'}`).join('; ')
    const healthExpenses = expenses.map(e => `$${e.amount} - ${e.category} - ${e.title}`).join('; ')

    const prompt = `Pet Health Monitoring Analysis - Veterinary AI Assistant

Pet: ${pet.species} ${pet.breed} "${pet.name}" Age: ${petAge} years
Recent symptoms (3 months): ${recentSymptoms || 'None reported'}
Recent appointments (6 months): ${recentAppointments || 'None scheduled'}
Health expenses (6 months): $${totalHealthSpending} - ${healthExpenses || 'None recorded'}

Analyze health trends and respond in exact format:
HEALTH_SCORE: [1-10 overall health score]
RISK_LEVEL: [low/medium/high]
TRENDS: [trend1], [trend2], [trend3]
PREDICTIONS: [prediction1], [prediction2]
RECOMMENDATIONS: [recommendation1], [recommendation2], [recommendation3]
ALERTS: [alert1], [alert2]
PREVENTION: [prevention tip1], [prevention tip2]

Focus on preventive care, early detection, and breed-specific health considerations.`

    const response = await fetch(`${endpoint}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || 'llama3.1:8b',
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.2,
          top_p: 0.8,
          num_predict: 350,
          num_ctx: 1024
        }
      })
    })

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`)
    }

    const data = await response.json()
    return parseHealthAnalysis(data.response)
  } catch (error) {
    console.error('AI health analysis failed:', error)
    return getFallbackHealthAnalysis(pet, appointments, expenses, consultations)
  }
}

function parseHealthAnalysis(response: string): HealthAnalysis {
  const lines = response.split('\n')
  const analysis: Partial<HealthAnalysis> = {}

  lines.forEach(line => {
    const cleanLine = line.trim()
    
    if (cleanLine.startsWith('HEALTH_SCORE:')) {
      analysis.healthScore = parseInt(cleanLine.split(':')[1].trim()) || 7
    } else if (cleanLine.startsWith('RISK_LEVEL:')) {
      const risk = cleanLine.split(':')[1].trim().toLowerCase()
      analysis.riskLevel = (['low', 'medium', 'high'].includes(risk) ? risk : 'low') as 'low' | 'medium' | 'high'
    } else if (cleanLine.startsWith('TRENDS:')) {
      analysis.trends = cleanLine.split(':')[1].split(',').map(t => t.trim()).filter(t => t)
    } else if (cleanLine.startsWith('PREDICTIONS:')) {
      analysis.predictions = cleanLine.split(':')[1].split(',').map(p => p.trim()).filter(p => p)
    } else if (cleanLine.startsWith('RECOMMENDATIONS:')) {
      analysis.recommendations = cleanLine.split(':')[1].split(',').map(r => r.trim()).filter(r => r)
    } else if (cleanLine.startsWith('ALERTS:')) {
      analysis.alerts = cleanLine.split(':')[1].split(',').map(a => a.trim()).filter(a => a && a !== 'None')
    } else if (cleanLine.startsWith('PREVENTION:')) {
      analysis.prevention = cleanLine.split(':')[1].split(',').map(p => p.trim()).filter(p => p)
    }
  })

  return {
    healthScore: analysis.healthScore || 7,
    riskLevel: analysis.riskLevel || 'low',
    trends: analysis.trends || ['Stable health pattern'],
    predictions: analysis.predictions || ['Continue regular wellness checks'],
    recommendations: analysis.recommendations || ['Maintain current care routine', 'Schedule annual checkup'],
    alerts: analysis.alerts || [],
    prevention: analysis.prevention || ['Regular exercise', 'Balanced nutrition'],
    lastUpdated: new Date().toISOString()
  }
}

function getFallbackHealthAnalysis(pet: Pet, appointments: Appointment[], expenses: Expense[], consultations: Consultation[]): HealthAnalysis {
  const petAge = calculateAge(pet.birthDate)
  const hasRecentConsultations = consultations.length > 0
  const hasRecentVetVisits = appointments.length > 0
  const healthSpending = expenses.reduce((sum, exp) => sum + exp.amount, 0)

  // Basic health scoring based on available data
  let healthScore = 8
  let riskLevel: 'low' | 'medium' | 'high' = 'low'
  const alerts: string[] = []

  if (petAge > 8) {
    healthScore -= 1
    riskLevel = 'medium'
  }

  if (hasRecentConsultations && consultations.some(c => (c as {severity?: string}).severity === 'high')) {
    healthScore -= 2
    riskLevel = 'high'
    alerts.push('Recent high-severity symptoms reported')
  }

  if (healthSpending > 500) {
    alerts.push('Higher than average health expenses detected')
  }

  return {
    healthScore: Math.max(1, healthScore),
    riskLevel,
    trends: [
      hasRecentVetVisits ? 'Regular veterinary care maintained' : 'Limited recent veterinary visits',
      petAge > 7 ? 'Senior pet - increased monitoring recommended' : 'Active adult pet',
      healthSpending > 0 ? 'Health expenses tracked' : 'No recent health expenses'
    ],
    predictions: [
      petAge > 8 ? 'May require more frequent health monitoring' : 'Likely to maintain good health',
      'Regular preventive care recommended'
    ],
    recommendations: [
      'Schedule regular wellness checkups',
      petAge > 7 ? 'Consider senior pet health screening' : 'Maintain current preventive care',
      'Monitor for breed-specific health conditions'
    ],
    alerts,
    prevention: [
      'Regular exercise appropriate for age',
      'Balanced nutrition',
      'Routine dental care'
    ],
    lastUpdated: new Date().toISOString()
  }
}