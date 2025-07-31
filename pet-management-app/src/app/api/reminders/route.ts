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

    let where: any = {
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

    // Verify the pet belongs to the user
    const pet = await prisma.pet.findFirst({
      where: {
        id: petId,
        userId: session.user.id
      }
    })

    if (!pet) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 })
    }

    const reminder = await prisma.reminder.create({
      data: {
        title,
        description,
        dueDate: new Date(dueDate),
        reminderType,
        notifyBefore: parseInt(notifyBefore) || 24,
        petId
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
    return NextResponse.json({ error: 'Failed to create reminder' }, { status: 500 })
  }
}