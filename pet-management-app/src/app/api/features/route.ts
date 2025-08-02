import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from "@/lib/session-types"
import { featureManager } from '@/lib/features'

export async function GET(request: Request) {
  try {
    const session = await getAuthenticatedSession()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // Initialize features first
    await featureManager.initializeFeatures()

    let features
    if (userId && session?.user?.id === userId) {
      // Get user-specific features
      features = await featureManager.getUserEnabledFeatures()
    } else {
      // Get globally enabled features
      features = await featureManager.getEnabledFeatures()
    }

    return NextResponse.json({ features })
  } catch (error) {
    console.error('Failed to fetch features:', error)
    return NextResponse.json(
      { error: 'Failed to fetch features' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthenticatedSession()
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { featureName, userId, enabled } = await request.json()

    const success = enabled
      ? await featureManager.enableFeature(featureName, userId)
      : await featureManager.disableFeature(featureName, userId)

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: 'Failed to update feature' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Failed to update feature:', error)
    return NextResponse.json(
      { error: 'Failed to update feature' },
      { status: 500 }
    )
  }
}