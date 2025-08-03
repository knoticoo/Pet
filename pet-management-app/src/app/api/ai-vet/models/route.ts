import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSession } from "@/lib/session-types"
import { aiVetService } from '@/lib/ai-vet-service'

export async function GET() {
  try {
    const session = await getAuthenticatedSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get system status and model recommendations
    const systemStatus = await aiVetService.getSystemStatus()
    const modelRecommendations = aiVetService.getModelRecommendations()
    const optimalModel = await aiVetService.getOptimalModel()
    const memoryStatus = await aiVetService.getMemoryStatus()

    return NextResponse.json({
      systemStatus,
      modelRecommendations,
      optimalModel,
      memoryStatus,
      currentModel: aiVetService['ollamaModel'],
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Model management error:', error)
    return NextResponse.json({ 
      error: 'Failed to get model information' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, model } = body

    if (action === 'pull') {
      // This would require server-side Ollama management
      // For now, return instructions
      return NextResponse.json({
        message: 'Model pull initiated',
        instructions: [
          'Run: ollama pull ' + (model || 'llama3.1:70b'),
          'Restart the application after model is downloaded',
          'Check status at: /api/ai-vet/models'
        ]
      })
    }

    if (action === 'set') {
      // Update the model in environment or config
      return NextResponse.json({
        message: 'Model updated',
        newModel: model,
        instructions: [
          'Set environment variable: OLLAMA_MODEL=' + model,
          'Restart the application',
          'Ensure model is downloaded: ollama pull ' + model
        ]
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Model management error:', error)
    return NextResponse.json({ 
      error: 'Failed to manage models' 
    }, { status: 500 })
  }
}