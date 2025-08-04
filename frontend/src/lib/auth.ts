// NextJS 15 Authentication - Official Pattern
import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'

// Types
export interface SessionPayload {
  userId: string
  username: string
  email: string
  domainId: string
  roles: string[]
  permissions: string[]
  primaryRole: string
  expiresAt: Date
}

export interface User {
  id: number
  username: string
  email: string
  displayName: string
  domainId: string
  roles: string[]
  permissions: string[]
  primaryRole: string
  isActive: boolean
}

// Session Management - Use same secret as backend for consistency
const secretKey = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'dev-jwt-secret-change-in-production'
const encodedKey = new TextEncoder().encode(secretKey)

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey)
}

export async function decrypt(session: string | undefined = '') {
  try {
    if (!session) {
      return null
    }

    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    })
    return payload as SessionPayload
  } catch (error) {
    return null
  }
}

// Session CRUD
export async function createSession(user: User) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const sessionPayload: SessionPayload = {
    userId: user.id.toString(),
    username: user.username,
    email: user.email,
    domainId: user.domainId,
    roles: user.roles,
    permissions: user.permissions,
    primaryRole: user.primaryRole,
    expiresAt,
  }

  const session = await encrypt(sessionPayload)
  const cookieStore = await cookies()

  cookieStore.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
}

export async function updateSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  const payload = await decrypt(session)

  if (!session || !payload) {
    return null
  }

  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  cookieStore.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expires,
    sameSite: 'lax',
    path: '/',
  })
}

export async function deleteSession() {
  const cookieStore = await cookies()

  // Delete the cookie
  cookieStore.delete('session')

  // Also set empty value with past expiry for safety
  cookieStore.set('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(0),
    sameSite: 'lax',
    path: '/',
  })
}

// Data Access Layer (DAL) - Official NextJS Pattern
export const verifySession = cache(async () => {
  try {
    // Check backend session via /auth/me endpoint - use public domain
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    console.log('🔍 verifySession: Using API URL:', apiUrl)
    console.log('🔍 Environment NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL)
    const cookieStore = await cookies()

    // Get all cookies to forward to backend
    const cookies = cookieStore.getAll()
    const cookieHeader = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ')

    console.log('🔍 Forwarding cookies to backend:', cookieHeader)
    console.log('🔍 Full URL:', `${apiUrl}/api/v1/auth/me`)

    const response = await fetch(`${apiUrl}/api/v1/auth/me`, {
      method: 'GET',
      headers: {
        'Cookie': cookieHeader,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      redirect('/login')
    }

    const result = await response.json()
    const user = result.user

    if (!user) {
      redirect('/login')
    }

    return {
      isAuth: true,
      userId: user.id.toString(),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName || user.username,
        domainId: user.domainId,
        roles: user.roles || [],
        permissions: user.permissions || [],
        primaryRole: user.primaryRole || 'user',
        isActive: true,
      } as User
    }
  } catch (error) {
    console.error('Session verification failed:', error)
    redirect('/login')
  }
})

// Get current user (server-side only)
export const getCurrentUser = cache(async (): Promise<User | null> => {
  try {
    // Check backend session via /auth/me endpoint - use public domain
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    const cookieStore = await cookies()

    // Get all cookies to forward to backend
    const cookies = cookieStore.getAll()
    const cookieHeader = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ')

    const response = await fetch(`${apiUrl}/api/v1/auth/me`, {
      method: 'GET',
      headers: {
        'Cookie': cookieHeader,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return null
    }

    const result = await response.json()
    const user = result.user

    if (!user) {
      return null
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName || user.username,
      domainId: user.domainId,
      roles: user.roles || [],
      permissions: user.permissions || [],
      primaryRole: user.primaryRole || 'user',
      isActive: true,
    } as User
  } catch {
    return null
  }
})



// Check if user has specific permission
export const hasPermission = cache(async (permission: string): Promise<boolean> => {
  try {
    const user = await getCurrentUser()
    if (!user) return false

    // SuperAdmin has all permissions
    if (user.permissions.includes('*:manage')) return true

    // Check specific permission
    return user.permissions.includes(permission)
  } catch {
    return false
  }
})

// Check if user has any of the specified roles
export const hasRole = cache(async (roles: string[]): Promise<boolean> => {
  try {
    const user = await getCurrentUser()
    if (!user) return false

    return roles.some(role => user.roles.includes(role))
  } catch {
    return false
  }
})

// Note: getUser function removed - use getCurrentUser instead
