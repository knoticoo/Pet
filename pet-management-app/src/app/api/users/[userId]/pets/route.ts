import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSession } from "@/lib/session-types"
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getAuthenticatedSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const userId = params.userId

    // Fetch user's pets
    const pets = await prisma.pet.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        species: true,
        breed: true,
        photo: true,
        birthDate: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate age for each pet
    const petsWithAge = pets.map(pet => ({
      ...pet,
      age: pet.birthDate ? calculateAge(pet.birthDate) : null
    }))

    return NextResponse.json(petsWithAge)

  } catch (error) {
    console.error('Error fetching user pets:', error)
    return NextResponse.json({ error: 'Failed to fetch pets' }, { status: 500 })
  }
}

function calculateAge(birthDate: Date): number {
  const today = new Date()
  const birth = new Date(birthDate)
  const age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    return age - 1
  }
  return age
}