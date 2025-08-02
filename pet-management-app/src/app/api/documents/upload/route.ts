import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSession } from "@/lib/session-types"
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const petId = formData.get('petId') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const fileName = `document_${timestamp}.${fileExtension}`

    // For now, we'll store the file info in the database
    // In a real app, you'd upload to cloud storage (AWS S3, etc.)
    const document = await prisma.document.create({
      data: {
        title: file.name,
        description: `Uploaded document: ${file.name}`,
        fileName: fileName,
        fileUrl: `/uploads/${fileName}`, // This would be the actual URL in production
        fileType: fileExtension || 'unknown',
        category: 'other',
        userId: session.user.id,
        petId: petId || null,
      },
      include: {
        pet: true
      }
    })

    return NextResponse.json({
      id: document.id,
      name: document.title,
      type: document.fileType,
      size: file.size,
      uploadDate: document.createdAt,
      petId: document.petId,
      petName: document.pet?.name,
      url: document.fileUrl
    })

  } catch (error) {
    console.error('Error uploading document:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}