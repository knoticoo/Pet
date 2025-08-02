import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reminder = await prisma.reminder.findFirst({
      where: {
        id,
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

    if (!reminder) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 })
    }

    return NextResponse.json(reminder)
  } catch (error) {
    console.error('Error fetching reminder:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      title, 
      description, 
      dueDate, 
      reminderType, 
      isCompleted, 
      isRecurring, 
      recurringInterval 
    } = body

    // Verify the reminder belongs to the user
    const existingReminder = await prisma.reminder.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!existingReminder) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 })
    }

    const updatedReminder = await prisma.reminder.update({
      where: { id },
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        reminderType,
        isCompleted,
        isRecurring,
        recurringInterval,
        updatedAt: new Date()
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

    return NextResponse.json(updatedReminder)
  } catch (error) {
    console.error('Error updating reminder:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the reminder belongs to the user
    const existingReminder = await prisma.reminder.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!existingReminder) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 })
    }

    await prisma.reminder.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Reminder deleted successfully' })
  } catch (error) {
    console.error('Error deleting reminder:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH route for marking reminders as complete/incomplete
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { isCompleted } = body

    // Verify the reminder belongs to the user
    const existingReminder = await prisma.reminder.findFirst({
      where: {
        id,
        pet: {
          userId: session.user.id
        }
      }
    })

    if (!existingReminder) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 })
    }

    const reminder = await prisma.reminder.update({
      where: { id },
      data: { isCompleted },
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

    return NextResponse.json(reminder)
  } catch (error) {
    console.error('Error updating reminder status:', error)
    return NextResponse.json({ error: 'Failed to update reminder status' }, { status: 500 })
  }
}