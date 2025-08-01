import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const pet = await prisma.pet.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
        isActive: true
      },
      include: {
        healthRecords: {
          orderBy: { date: 'desc' }
        },
        vaccinations: {
          orderBy: { dateGiven: 'desc' }
        },
        appointments: {
          where: {
            date: {
              gte: new Date()
            }
          },
          orderBy: { date: 'asc' }
        }
      }
    })

    if (!pet) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 })
    }

    return NextResponse.json(pet)
  } catch (error) {
    console.error('Error fetching pet:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, species, breed, gender, birthDate, adoptionDate, microchipNumber, description } = body

    // Verify the pet belongs to the user
    const existingPet = await prisma.pet.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!existingPet) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 })
    }

    const updatedPet = await prisma.pet.update({
      where: { id: params.id },
      data: {
        name,
        species,
        breed,
        gender,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        adoptionDate: adoptionDate ? new Date(adoptionDate) : undefined,
        microchipNumber,
        description,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(updatedPet)
  } catch (error) {
    console.error('Error updating pet:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the pet belongs to the user
    const existingPet = await prisma.pet.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!existingPet) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 })
    }

    // Soft delete by setting isActive to false
    await prisma.pet.update({
      where: { id: params.id },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ message: 'Pet deleted successfully' })
  } catch (error) {
    console.error('Error deleting pet:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}