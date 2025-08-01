import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { pluginId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { settings } = await request.json()
    const { pluginId } = params

    // Update plugin settings in database
    const pluginSettings = await prisma.systemSetting.upsert({
      where: { key: `plugin.${pluginId}.settings` },
      update: { value: JSON.stringify(settings) },
      create: {
        key: `plugin.${pluginId}.settings`,
        value: JSON.stringify(settings),
        description: `Plugin ${pluginId} settings`,
        category: 'plugins'
      }
    })

    return NextResponse.json({ 
      id: pluginId,
      settings: settings,
      message: 'Plugin settings updated successfully'
    })
  } catch (error) {
    console.error('Error updating plugin settings:', error)
    return NextResponse.json(
      { error: 'Failed to update plugin settings' },
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

    // Get plugin settings from database
    const pluginSettings = await prisma.systemSetting.findUnique({
      where: { key: `plugin.${pluginId}.settings` }
    })

    const settings = pluginSettings ? JSON.parse(pluginSettings.value) : {}

    return NextResponse.json({ 
      id: pluginId,
      settings: settings
    })
  } catch (error) {
    console.error('Error getting plugin settings:', error)
    return NextResponse.json(
      { error: 'Failed to get plugin settings' },
      { status: 500 }
    )
  }
}