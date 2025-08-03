import { NextRequest, NextResponse } from 'next/server'
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

async function startOllama() {
  try {
    // Try to start Ollama service
    await execAsync('ollama serve')
    return { success: true, message: 'Ollama service started successfully' }
  } catch (error) {
    console.error('Error starting Ollama:', error)
    return { 
      success: false, 
      message: 'Failed to start Ollama service',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function stopOllama() {
  try {
    // Find and kill Ollama processes
    const { stdout } = await execAsync("pgrep -f 'ollama serve'")
    if (stdout.trim()) {
      await execAsync(`kill ${stdout.trim()}`)
      return { success: true, message: 'Ollama service stopped successfully' }
    } else {
      return { success: true, message: 'Ollama service was not running' }
    }
  } catch (error) {
    console.error('Error stopping Ollama:', error)
    return { 
      success: false, 
      message: 'Failed to stop Ollama service',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function restartOllama() {
  try {
    // Stop first
    const stopResult = await stopOllama()
    if (!stopResult.success) {
      return stopResult
    }

    // Wait a moment for the service to fully stop
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Start again
    const startResult = await startOllama()
    return {
      success: startResult.success,
      message: startResult.success ? 'Ollama service restarted successfully' : startResult.message,
      error: startResult.error
    }
  } catch (error) {
    console.error('Error restarting Ollama:', error)
    return { 
      success: false, 
      message: 'Failed to restart Ollama service',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function pullModel(modelName: string) {
  try {
    await execAsync(`ollama pull ${modelName}`)
    return { success: true, message: `Model ${modelName} pulled successfully` }
  } catch (error) {
    console.error(`Error pulling model ${modelName}:`, error)
    return { 
      success: false, 
      message: `Failed to pull model ${modelName}`,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function removeModel(modelName: string) {
  try {
    await execAsync(`ollama rm ${modelName}`)
    return { success: true, message: `Model ${modelName} removed successfully` }
  } catch (error) {
    console.error(`Error removing model ${modelName}:`, error)
    return { 
      success: false, 
      message: `Failed to remove model ${modelName}`,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { action, modelName } = body

    let result

    switch (action) {
      case 'start':
        result = await startOllama()
        break

      case 'stop':
        result = await stopOllama()
        break

      case 'restart':
        result = await restartOllama()
        break

      case 'pull':
        if (!modelName) {
          return NextResponse.json({ error: 'Model name is required for pull action' }, { status: 400 })
        }
        result = await pullModel(modelName)
        break

      case 'remove':
        if (!modelName) {
          return NextResponse.json({ error: 'Model name is required for remove action' }, { status: 400 })
        }
        result = await removeModel(modelName)
        break

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }

    if (result.success) {
      return NextResponse.json({ 
        message: result.message,
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json({ 
        error: result.message,
        details: result.error,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error performing Ollama action:', error)
    return NextResponse.json({ error: 'Failed to perform action' }, { status: 500 })
  }
}