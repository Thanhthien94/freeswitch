'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@/lib/auth'

interface UserContextType {
  user: User | null
  isLoading: boolean
  refreshUser: () => Promise<void>
  clearUser: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ 
  children, 
  initialUser 
}: { 
  children: React.ReactNode
  initialUser: User | null 
}) {
  const [user, setUser] = useState<User | null>(initialUser)
  const [isLoading, setIsLoading] = useState(false)

  const refreshUser = async () => {
    setIsLoading(true)
    try {
      // Call API to get current user from session
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Failed to refresh user:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const clearUser = () => {
    console.log('🔍 Clearing user state')
    setUser(null)
  }

  return (
    <UserContext.Provider value={{ user, isLoading, refreshUser, clearUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

// Permission checking hooks
export function usePermissions() {
  const { user } = useUser()
  
  const hasPermission = (permission: string): boolean => {
    if (!user || !user.permissions) return false

    // SuperAdmin has all permissions
    if (user.permissions.includes('*:manage')) return true

    // Check specific permission
    return user.permissions.includes(permission)
  }

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission))
  }

  const hasRole = (role: string): boolean => {
    if (!user || !user.roles) return false
    return user.roles.includes(role)
  }

  const hasAnyRole = (roles: string[]): boolean => {
    if (!user || !user.roles) return false
    return roles.some(role => user.roles.includes(role))
  }

  return {
    hasPermission,
    hasAnyPermission,
    hasRole,
    hasAnyRole,
    permissions: user?.permissions || [],
    roles: user?.roles || [],
    primaryRole: user?.primaryRole || null,
  }
}
