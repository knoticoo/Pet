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

    const documents = await prisma.document.findMany({
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
        createdAt: 'desc'
      }
    })

    // Transform the data to match the frontend interface
    const transformedDocuments = documents.map(document => ({
      id: document.id,
      name: document.fileName,
      type: document.fileType,
      size: 'Unknown', // fileSize field doesn't exist in schema
      uploadDate: document.createdAt.toISOString(),
      petId: document.petId,
      petName: document.pet.name,
      url: document.fileUrl // using fileUrl instead of filePath
    }))

    return NextResponse.json(transformedDocuments)
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, fileName, fileUrl, fileType, category, petId } = body

    // Validate required fields
    if (!title || !fileName || !fileUrl || !petId) {
      return NextResponse.json({ 
        error: 'Title, file name, file URL, and pet are required' 
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

    const document = await prisma.document.create({
      data: {
        title: title.toString(),
        description: description?.toString() || null,
        fileName: fileName.toString(),
        fileUrl: fileUrl.toString(),
        fileType: fileType?.toString() || 'unknown',
        category: category?.toString() || 'other',
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
    const transformedDocument = {
      id: document.id,
      title: document.title,
      description: document.description,
      fileName: document.fileName,
      fileType: document.fileType,
      category: document.category,
      fileUrl: document.fileUrl,
      createdAt: document.createdAt.toISOString(),
      petId: document.petId,
      pet: document.pet
    }

    return NextResponse.json(transformedDocument, { status: 201 })
  } catch (error) {
    console.error('Error creating document:', error)
    return NextResponse.json({ 
      error: 'Failed to create document',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}