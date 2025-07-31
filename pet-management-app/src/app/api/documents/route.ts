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
        uploadDate: 'desc'
      }
    })

    // Transform the data to match the frontend interface
    const transformedDocuments = documents.map(document => ({
      id: document.id,
      name: document.fileName,
      type: document.fileType,
      size: document.fileSize ? `${(document.fileSize / 1024 / 1024).toFixed(2)} MB` : 'Unknown',
      uploadDate: document.uploadDate.toISOString(),
      petId: document.petId,
      petName: document.pet.name,
      url: document.filePath
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
    const { fileName, fileType, fileSize, filePath, petId, documentType } = body

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

    const document = await prisma.document.create({
      data: {
        fileName,
        fileType,
        fileSize: parseInt(fileSize),
        filePath,
        documentType: documentType || 'other',
        petId,
        uploadDate: new Date()
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
      name: document.fileName,
      type: document.fileType,
      size: document.fileSize ? `${(document.fileSize / 1024 / 1024).toFixed(2)} MB` : 'Unknown',
      uploadDate: document.uploadDate.toISOString(),
      petId: document.petId,
      petName: document.pet.name,
      url: document.filePath
    }

    return NextResponse.json(transformedDocument, { status: 201 })
  } catch (error) {
    console.error('Error creating document:', error)
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
  }
}