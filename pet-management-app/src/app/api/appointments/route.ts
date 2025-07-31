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

    const appointments = await prisma.appointment.findMany({
      where: {
        pet: {
          userId: session.user.id
        }
      },
      include: {
        pet: {
          select: {
            name: true,
            species: true
          }
        }
      },
      orderBy: {
        appointmentDate: 'asc'
      }
    })

    // Transform the data to match the frontend interface
    const transformedAppointments = appointments.map(appointment => ({
      id: appointment.id,
      title: appointment.title || `${appointment.appointmentType} for ${appointment.pet.name}`,
      date: appointment.appointmentDate.toISOString(),
      duration: appointment.duration || 60,
      location: appointment.location,
      vetName: appointment.veterinarian,
      appointmentType: appointment.appointmentType,
      status: appointment.status,
      notes: appointment.notes,
      petId: appointment.petId,
      pet: appointment.pet
    }))

    return NextResponse.json(transformedAppointments)
  } catch (error) {
    console.error('Error fetching appointments:', error)
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      title, 
      petId, 
      appointmentDate, 
      appointmentType, 
      duration, 
      location, 
      veterinarian, 
      notes 
    } = body

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

    const appointment = await prisma.appointment.create({
      data: {
        title,
        petId,
        appointmentDate: new Date(appointmentDate),
        appointmentType,
        duration: duration || 60,
        location,
        veterinarian,
        notes,
        status: 'scheduled'
      },
      include: {
        pet: {
          select: {
            name: true,
            species: true
          }
        }
      }
    })

    // Transform the response
    const transformedAppointment = {
      id: appointment.id,
      title: appointment.title || `${appointment.appointmentType} for ${appointment.pet.name}`,
      date: appointment.appointmentDate.toISOString(),
      duration: appointment.duration || 60,
      location: appointment.location,
      vetName: appointment.veterinarian,
      appointmentType: appointment.appointmentType,
      status: appointment.status,
      notes: appointment.notes,
      petId: appointment.petId,
      pet: appointment.pet
    }

    return NextResponse.json(transformedAppointment, { status: 201 })
  } catch (error) {
    console.error('Error creating appointment:', error)
    return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 })
  }
}