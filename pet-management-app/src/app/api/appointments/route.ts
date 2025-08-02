import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
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
        date: 'asc'
      }
    })

    // Transform the data to match the frontend interface
    const transformedAppointments = appointments.map(appointment => ({
      id: appointment.id,
      title: appointment.title || `${appointment.appointmentType} for ${appointment.pet.name}`,
      date: appointment.date.toISOString(),
      duration: appointment.duration || 60,
      location: appointment.location,
      vetName: appointment.vetName,
      appointmentType: appointment.appointmentType,
      status: appointment.status,
      notes: appointment.description,
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
      date,
      appointmentType, 
      duration, 
      location, 
      veterinarian,
      vetName, 
      notes,
      description 
    } = body

    // Use either appointmentDate or date field
    const finalDate = appointmentDate || date
    const finalVetName = veterinarian || vetName
    const finalNotes = notes || description

    // Validate required fields
    if (!petId || !finalDate || !appointmentType) {
      return NextResponse.json({ 
        error: 'Pet, date, and appointment type are required' 
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

    const appointment = await prisma.appointment.create({
      data: {
        title: title?.toString() || `${appointmentType} for ${pet.name}`,
        description: finalNotes?.toString() || null,
        date: new Date(finalDate),
        duration: parseInt(duration) || 60,
        location: location?.toString() || null,
        vetName: finalVetName?.toString() || null,
        appointmentType: appointmentType.toString(),
        status: 'scheduled',
        petId: petId.toString(),
        userId: session.user.id
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
      title: appointment.title,
      date: appointment.date.toISOString(),
      duration: appointment.duration || 60,
      location: appointment.location,
      vetName: appointment.vetName,
      appointmentType: appointment.appointmentType,
      status: appointment.status,
      notes: appointment.description,
      petId: appointment.petId,
      pet: appointment.pet
    }

    return NextResponse.json(transformedAppointment, { status: 201 })
  } catch (error) {
    console.error('Error creating appointment:', error)
    return NextResponse.json({ 
      error: 'Failed to create appointment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}