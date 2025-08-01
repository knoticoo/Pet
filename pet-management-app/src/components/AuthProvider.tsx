'use client'

import { SessionProvider } from "next-auth/react"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      // Refetch session every 10 minutes to keep it fresh but not too frequent
      refetchInterval={10 * 60}
      // Refetch session when window gets focus (user comes back to tab)
      refetchOnWindowFocus={true}
      // Don't refetch when offline to avoid errors
      refetchWhenOffline={false}
      // Keep session in localStorage for better persistence
      basePath="/api/auth"
    >
      {children}
    </SessionProvider>
  )
}