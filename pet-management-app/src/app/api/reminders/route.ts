import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'active', 'completed', 'all'

    const where: Record<string, unknown> = {
      pet: {
        userId: session.user.id
      }
    }

    if (status === 'active') {
      where.isCompleted = false
    } else if (status === 'completed') {
      where.isCompleted = true
    }

    const reminders = await prisma.reminder.findMany({
      where,
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            species: true
          }
        }
      },
      orderBy: {
        dueDate: 'asc'
      }
    })

    return NextResponse.json(reminders)
  } catch (error) {
    console.error('Error fetching reminders:', error)
    return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { petId, title, description, dueDate, reminderType, notifyBefore } = body

    // Validate required fields
    if (!petId || !title || !dueDate || !reminderType) {
      return NextResponse.json({ 
        error: 'Pet, title, due date, and reminder type are required' 
      }, { status: 400 })
    }

    // Verify the pet belongs to the user
    const pet = await prisma.pet.findFirst({
      where: {
        id: petId.toString(),
        userId: session.user.id
      }
    })

    if (!pet) {
      return NextResponse.json({ error: 'Pet not found or access denied' }, { status: 404 })
    }

    const reminder = await prisma.reminder.create({
      data: {
        title: title.toString(),
        description: description?.toString() || null,
        dueDate: new Date(dueDate),
        reminderType: reminderType.toString(),
        notifyBefore: parseInt(notifyBefore) || 24,
        petId: petId.toString(),
        userId: session.user.id
      },
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            species: true
          }
        }
      }
    })

    return NextResponse.json(reminder, { status: 201 })
  } catch (error) {
    console.error('Error creating reminder:', error)
    return NextResponse.json({ 
      error: 'Failed to create reminder',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}