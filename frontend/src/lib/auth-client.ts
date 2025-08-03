'use client';

import { User } from '@/types/auth';

// Client-side getCurrentUser (calls API)
export async function getCurrentUserClient(): Promise<User | null> {
  try {
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include', // Include cookies
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.user || null
  } catch (error) {
    console.error('Error getting current user (client):', error)
    return null
  }
}
