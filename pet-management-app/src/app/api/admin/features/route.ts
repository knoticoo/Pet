import { NextRequest, NextResponse } from 'next/server'
import { featureManager } from '@/lib/features'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get all features from database
    const features = await prisma.feature.findMany({
      orderBy: [
        { category: 'asc' },
        { displayName: 'asc' }
      ]
    })

    return NextResponse.json({ features })
  } catch (error) {
    console.error('Error fetching features:', error)
    return NextResponse.json(
      { error: 'Failed to fetch features' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, featureNames } = await request.json()

    switch (action) {
      case 'enable-all':
        for (const featureName of featureNames) {
          await featureManager.enableFeature(featureName)
        }
        break
      
      case 'disable-all':
        for (const featureName of featureNames) {
          await featureManager.disableFeature(featureName)
        }
        break
      
      case 'reset-defaults':
        // Reset all features to their default state
        await featureManager.initializeFeatures()
        break
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      message: `Bulk action '${action}' completed successfully`
    })
  } catch (error) {
    console.error('Error performing bulk action:', error)
    return NextResponse.json(
      { error: 'Failed to perform bulk action' },
      { status: 500 }
    )
  }
}