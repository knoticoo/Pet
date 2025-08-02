import { useSession } from 'next-auth/react'

export interface AuthenticatedUser {
  id: string
  email: string
  name?: string | null
  isAdmin?: boolean
}

export interface AuthenticatedSession {
  user: AuthenticatedUser
}

export function useAuthenticatedSession() {
  const { data: session, status } = useSession()
  
  const authenticatedSession: AuthenticatedSession | null = session?.user && (session.user as { id?: string }).id 
    ? {
        user: {
          id: (session.user as { id: string }).id,
          email: session.user.email || '',
          name: session.user.name || undefined,
          isAdmin: (session.user as { isAdmin?: boolean }).isAdmin || false
        }
      }
    : null

  return {
    session: authenticatedSession,
    status,
    isLoading: status === 'loading',
    isAuthenticated: !!authenticatedSession
  }
}