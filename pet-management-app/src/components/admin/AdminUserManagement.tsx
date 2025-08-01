'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Users, Crown, Shield, RefreshCw, Search } from 'lucide-react'

interface User {
  id: string
  email: string
  name?: string
  subscriptionTier?: string
  subscriptionStatus?: string
  isAdmin: boolean
  createdAt: string
}

interface AdminUserManagementProps {
  className?: string
}

export function AdminUserManagement({ className }: AdminUserManagementProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      } else {
        setMessage('Failed to fetch users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setMessage('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const updateUser = async (userId: string, updates: Partial<User>) => {
    try {
      setUpdating(userId)
      setMessage('')

      const response = await fetch('/api/admin/update-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...updates,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setMessage(`User ${data.user.email} updated successfully!`)
        await fetchUsers() // Refresh the list
        setTimeout(() => setMessage(''), 3000)
      } else {
        const error = await response.json()
        setMessage(error.error || 'Failed to update user')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      setMessage('Failed to update user')
    } finally {
      setUpdating(null)
    }
  }

  const makeLifetimeAdmin = async (userId: string) => {
    await updateUser(userId, {
      subscriptionTier: 'lifetime',
      subscriptionStatus: 'active',
      isAdmin: true,
    })
  }

  const makeLifetimePremium = async (userId: string) => {
    await updateUser(userId, {
      subscriptionTier: 'lifetime',
      subscriptionStatus: 'active',
      isAdmin: false,
    })
  }

  const makePremium = async (userId: string) => {
    await updateUser(userId, {
      subscriptionTier: 'premium',
      subscriptionStatus: 'active',
      isAdmin: false,
    })
  }

  const makeFree = async (userId: string) => {
    await updateUser(userId, {
      subscriptionTier: 'free',
      subscriptionStatus: 'inactive',
      isAdmin: false,
    })
  }

  const toggleAdmin = async (userId: string, currentAdminStatus: boolean) => {
    await updateUser(userId, {
      isAdmin: !currentAdminStatus,
    })
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getSubscriptionBadge = (tier?: string, status?: string) => {
    if (tier === 'lifetime') {
      return <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">Lifetime</span>
    }
    if (tier === 'premium' && status === 'active') {
      return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Premium</span>
    }
    return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Free</span>
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground mt-4">Loading users...</p>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Users className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">User Management</h2>
        </div>
        <Button
          variant="outline"
          onClick={fetchUsers}
          disabled={loading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-md ${
          message.includes('success') 
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message}
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search users by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-foreground"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Subscription
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Admin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-muted/30">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-foreground">{user.email}</div>
                      {user.name && (
                        <div className="text-sm text-muted-foreground">{user.name}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getSubscriptionBadge(user.subscriptionTier, user.subscriptionStatus)}
                  </td>
                  <td className="px-6 py-4">
                    {user.isAdmin ? (
                      <span className="flex items-center text-sm font-medium text-purple-600">
                        <Shield className="h-4 w-4 mr-1" />
                        Admin
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">User</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => makeLifetimeAdmin(user.id)}
                        disabled={updating === user.id}
                        className="text-xs"
                      >
                        <Crown className="h-3 w-3 mr-1" />
                        Lifetime Admin
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => makeLifetimePremium(user.id)}
                        disabled={updating === user.id}
                        className="text-xs"
                      >
                        Lifetime Premium
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => makePremium(user.id)}
                        disabled={updating === user.id}
                        className="text-xs"
                      >
                        Premium
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => makeFree(user.id)}
                        disabled={updating === user.id}
                        className="text-xs"
                      >
                        Free
                      </Button>
                      <Button
                        size="sm"
                        variant={user.isAdmin ? "destructive" : "default"}
                        onClick={() => toggleAdmin(user.id, user.isAdmin)}
                        disabled={updating === user.id}
                        className="text-xs"
                      >
                        <Shield className="h-3 w-3 mr-1" />
                        {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-8">
          <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Users Found</h3>
          <p className="text-muted-foreground">
            {searchTerm ? 'No users match your search criteria.' : 'No users registered yet.'}
          </p>
        </div>
      )}
    </div>
  )
}