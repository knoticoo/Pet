import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSession } from "@/lib/session-types"
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const breed = searchParams.get('breed')
    const isPublic = searchParams.get('isPublic')

    const where: Record<string, unknown> = {}
    if (breed) where.breed = breed
    if (isPublic !== null) where.isPublic = isPublic === 'true'

    const groups = await prisma.socialGroup.findMany({
      where,
      include: {
        _count: {
          select: {
            members: true,
            posts: true
          }
        }
      },
      orderBy: { memberCount: 'desc' }
    })

    return NextResponse.json(groups)
  } catch (error) {
    console.error('Error fetching social groups:', error)
    return NextResponse.json(
      { error: 'Failed to fetch social groups' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, description, breed, isPublic = true } = await request.json()

    const group = await prisma.socialGroup.create({
      data: {
        name,
        description,
        breed,
        isPublic,
        memberCount: 1,
        members: {
          create: {
            userId: session.user.id,
            role: 'admin'
          }
        }
      },
      include: {
        _count: {
          select: {
            members: true,
            posts: true
          }
        }
      }
    })

    return NextResponse.json(group)
  } catch (error) {
    console.error('Error creating social group:', error)
    return NextResponse.json(
      { error: 'Failed to create social group' },
      { status: 500 }
    )
  }
}