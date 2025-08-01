'use client'

import { useSession } from 'next-auth/react'
import { useFeatures } from '@/hooks/useFeatures'

export function DebugSession() {
  const { data: session, status } = useSession()
  const { isAdmin, isAuthenticated, loading } = useFeatures()

  return (
    <div className="card p-6 space-y-4">
      <h3 className="text-lg font-semibold">Debug Session Info</h3>
      
      <div className="space-y-2">
        <div><strong>Session Status:</strong> {status}</div>
        <div><strong>Session Data:</strong></div>
        <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>
      
      <div className="space-y-2">
        <div><strong>Features Hook:</strong></div>
        <div>Loading: {loading.toString()}</div>
        <div>Is Authenticated: {isAuthenticated.toString()}</div>
        <div>Is Admin: {isAdmin.toString()}</div>
      </div>
      
      <div className="space-y-2">
        <div><strong>User Info:</strong></div>
        <div>Email: {session?.user?.email}</div>
        <div>Name: {session?.user?.name}</div>
        <div>ID: {session?.user?.id}</div>
        <div>Is Admin (from session): {session?.user?.isAdmin?.toString()}</div>
      </div>
    </div>
  )
}