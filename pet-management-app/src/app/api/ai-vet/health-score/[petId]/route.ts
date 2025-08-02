import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ petId: string }> }
) {
  const { petId } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Simulate health score calculation (in a real app, this would analyze pet data)
    const healthScore = {
      petId,
      overallScore: Math.floor(Math.random() * 30) + 70, // 70-100
      categories: {
        weight: {
          score: Math.floor(Math.random() * 20) + 80,
          status: 'Good',
          trend: 'Stable'
        },
        activity: {
          score: Math.floor(Math.random() * 25) + 75,
          status: 'Good',
          trend: 'Increasing'
        },
        nutrition: {
          score: Math.floor(Math.random() * 15) + 85,
          status: 'Excellent',
          trend: 'Stable'
        },
        behavior: {
          score: Math.floor(Math.random() * 20) + 80,
          status: 'Good',
          trend: 'Stable'
        }
      },
      recommendations: [
        'Continue current exercise routine',
        'Monitor weight monthly',
        'Consider dental checkup in 3 months',
        'Maintain current diet'
      ],
      lastUpdated: new Date().toISOString()
    }

    return NextResponse.json(healthScore)
  } catch (error) {
    console.error('Error calculating health score:', error)
    return NextResponse.json(
      { error: 'Failed to calculate health score' },
      { status: 500 }
    )
  }
}