import { NextRequest, NextResponse } from 'next/server'
import { featureManager } from '@/lib/features'

export async function POST(request: NextRequest) {
  try {
    const { featureName, enable, userId } = await request.json()

    if (!featureName) {
      return NextResponse.json(
        { error: 'Feature name is required' },
        { status: 400 }
      )
    }

    let success: boolean
    if (enable) {
      success = await featureManager.enableFeature(featureName, userId)
    } else {
      success = await featureManager.disableFeature(featureName, userId)
    }

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to toggle feature' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Feature ${featureName} ${enable ? 'enabled' : 'disabled'} successfully`
    })
  } catch (error) {
    console.error('Error toggling feature:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}