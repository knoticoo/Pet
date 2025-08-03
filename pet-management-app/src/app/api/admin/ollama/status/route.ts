import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from "@/lib/session-types"
import { prisma } from '@/lib/prisma'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

interface AuthenticatedUser {
  id: string
  email: string
  name?: string
  isAdmin: boolean
}

async function checkOllamaStatus() {
  try {
    // Check if Ollama is running by trying to connect to it
    const { stdout } = await execAsync('ollama list')
    return { isRunning: true, output: stdout }
  } catch (error) {
    return { isRunning: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

async function getOllamaVersion() {
  try {
    const { stdout } = await execAsync('ollama --version')
    return stdout.trim()
  } catch (error) {
    return null
  }
}

async function getSystemInfo() {
  try {
    // Get CPU info
    const { stdout: cpuInfo } = await execAsync("lscpu | grep 'Model name' | cut -d: -f2 | xargs")
    
    // Get memory info
    const { stdout: memInfo } = await execAsync("free -h | grep '^Mem:' | awk '{print $2}'")
    
    // Get disk usage
    const { stdout: diskInfo } = await execAsync("df -h / | tail -1 | awk '{print $4}'")
    
    return {
      cpu: cpuInfo.trim(),
      memory: memInfo.trim(),
      disk: diskInfo.trim()
    }
  } catch (error) {
    console.error('Error getting system info:', error)
    return null
  }
}

async function getOllamaModels() {
  try {
    const { stdout } = await execAsync('ollama list --format json')
    const models = JSON.parse(stdout)
    return models.map((model: any) => ({
      name: model.name,
      size: model.size || 'Unknown',
      modified: model.modified_at || new Date().toISOString(),
      digest: model.digest || 'Unknown'
    }))
  } catch (error) {
    console.error('Error getting Ollama models:', error)
    return []
  }
}

export async function GET() {
  try {
    const session = await getAuthenticatedSession() as { user?: AuthenticatedUser } | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true }
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Check Ollama status
    const status = await checkOllamaStatus()
    const version = status.isRunning ? await getOllamaVersion() : null
    const systemInfo = status.isRunning ? await getSystemInfo() : null
    const models = status.isRunning ? await getOllamaModels() : []

    const ollamaStatus = {
      isRunning: status.isRunning,
      version: version,
      systemInfo: systemInfo,
      lastCheck: new Date().toISOString(),
      error: status.error
    }

    return NextResponse.json({
      status: ollamaStatus,
      models: models
    })

  } catch (error) {
    console.error('Error checking Ollama status:', error)
    return NextResponse.json(
      { 
        status: {
          isRunning: false,
          lastCheck: new Date().toISOString(),
          error: 'Failed to check Ollama status'
        },
        models: []
      },
      { status: 500 }
    )
  }
}