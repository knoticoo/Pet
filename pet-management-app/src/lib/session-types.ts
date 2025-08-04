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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = await getServerSession(authOptions as any) as { user?: { id?: string } } | null
  if (!session?.user?.id) {
    return null
  }
  return session as AuthenticatedSession
}