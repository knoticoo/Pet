import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { pluginId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { isEnabled } = await request.json()
    const { pluginId } = params

    // Update plugin status in database
    const plugin = await prisma.systemSetting.upsert({
      where: { key: `plugin.${pluginId}.enabled` },
      update: { value: isEnabled.toString() },
      create: {
        key: `plugin.${pluginId}.enabled`,
        value: isEnabled.toString(),
        description: `Plugin ${pluginId} enabled status`,
        category: 'plugins'
      }
    })

    return NextResponse.json({ 
      id: pluginId,
      isEnabled: isEnabled,
      message: `Plugin ${isEnabled ? 'enabled' : 'disabled'} successfully`
    })
  } catch (error) {
    console.error('Error updating plugin status:', error)
    return NextResponse.json(
      { error: 'Failed to update plugin status' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { pluginId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { pluginId } = params

    // Get plugin status from database
    const pluginStatus = await prisma.systemSetting.findUnique({
      where: { key: `plugin.${pluginId}.enabled` }
    })

    const isEnabled = pluginStatus ? pluginStatus.value === 'true' : false

    return NextResponse.json({ 
      id: pluginId,
      enabled: isEnabled
    })
  } catch (error) {
    console.error('Error getting plugin status:', error)
    return NextResponse.json(
      { error: 'Failed to get plugin status' },
      { status: 500 }
    )
  }
}