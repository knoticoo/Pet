'use client'

import { SessionProvider } from "next-auth/react"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      // Refetch session every 5 minutes to keep it fresh
      refetchInterval={5 * 60}
      // Refetch session when window gets focus (user comes back to tab)
      refetchOnWindowFocus={true}
      // Only refetch when session expires soon (within 5 minutes)
      refetchWhenOffline={false}
    >
      {children}
    </SessionProvider>
  )
}