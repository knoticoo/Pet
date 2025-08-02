import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSession } from "@/lib/session-types"
import { prisma } from '@/lib/prisma'

interface AuthenticatedUser {
  id: string
  email: string
  name?: string
  isAdmin: boolean
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession() as { user?: AuthenticatedUser } | null
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isAdmin: true }
    })

    if (!adminUser?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Prevent self-deletion
    if (session.user.id === userId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    // Check if user exists
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Delete user and all related data
    await prisma.$transaction(async (tx) => {
      // Delete user's pets (which will cascade to other related data)
      await tx.pet.deleteMany({
        where: { userId: userId }
      })

      // Delete the user
      await tx.user.delete({
        where: { id: userId }
      })
    })

    return NextResponse.json({ 
      message: `User ${userToDelete.email} has been successfully deleted`,
      success: true 
    })

  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}