import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export interface AuthenticatedUser {
  id: string
  email: string
  name?: string
  isAdmin: boolean
}

export interface AuthenticatedSession {
  user: AuthenticatedUser
}

export async function getAuthenticatedSession(): Promise<AuthenticatedSession | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user || !('id' in session.user)) {
    return null
  }
  return session as AuthenticatedSession
}