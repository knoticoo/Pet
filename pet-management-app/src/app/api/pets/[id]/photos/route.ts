import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
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

    const petId = id
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Verify pet belongs to user
    const pet = await prisma.pet.findFirst({
      where: { id: petId, userId: session.user.id }
    })

    if (!pet) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 })
    }

    const photos = await prisma.petPhoto.findMany({
      where: { petId },
      orderBy: { date: 'desc' },
      skip: offset,
      take: limit,
      include: {
        album: {
          select: { name: true }
        }
      }
    })

    const total = await prisma.petPhoto.count({ where: { petId } })

    return NextResponse.json({
      photos,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching pet photos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pet photos' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const petId = id

    // Verify pet belongs to user
    const pet = await prisma.pet.findFirst({
      where: { id: petId, userId: session.user.id }
    })

    if (!pet) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('photo') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    const albumId = formData.get('albumId') as string

    if (!file) {
      return NextResponse.json({ error: 'Photo file is required' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    // Convert file to base64 for storage (in production, you'd upload to cloud storage)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    // Create photo record
    const photo = await prisma.petPhoto.create({
      data: {
        petId,
        userId: session.user.id,
        photoUrl: dataUrl,
        title: title || 'Untitled',
        description: description || null,
        category: category || 'general',
        albumId: albumId || null,
        date: new Date()
      }
    })

    return NextResponse.json(photo, { status: 201 })
  } catch (error) {
    console.error('Error uploading pet photo:', error)
    return NextResponse.json(
      { error: 'Failed to upload photo' },
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

    const petId = id
    const { searchParams } = new URL(request.url)
    const photoId = searchParams.get('photoId')

    if (!photoId) {
      return NextResponse.json({ error: 'Photo ID is required' }, { status: 400 })
    }

    // Verify photo belongs to user's pet
    const photo = await prisma.petPhoto.findFirst({
      where: {
        id: photoId,
        petId,
        userId: session.user.id
      }
    })

    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    await prisma.petPhoto.delete({
      where: { id: photoId }
    })

    return NextResponse.json({ message: 'Photo deleted successfully' })
  } catch (error) {
    console.error('Error deleting pet photo:', error)
    return NextResponse.json(
      { error: 'Failed to delete photo' },
      { status: 500 }
    )
  }
}