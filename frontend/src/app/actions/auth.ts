'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { createSession, deleteSession } from '@/lib/auth'

// Validation schemas
const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const SignupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

// Form state type
export interface FormState {
  errors?: {
    name?: string[]
    email?: string[]
    password?: string[]
  }
  message?: string
}

// Login Server Action
export async function login(state: FormState, formData: FormData): Promise<FormState> {
  // 1. Validate form fields
  const validatedFields = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Login.',
    }
  }

  const { email, password } = validatedFields.data

  try {
    console.log('🔍 Login attempt:', { email, password: '***' })

    // 2. Call external API directly from Server Action (NextJS 15 official pattern)
    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL
    console.log('🔍 API URL:', `${apiUrl}/auth/login`)

    const response = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    console.log('🔍 Response status:', response.status)
    console.log('🔍 Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.log('🔍 Error response:', errorText)
      return {
        message: 'Invalid credentials.',
      }
    }

    const result = await response.json()
    console.log('🔍 Login result:', result)

    // 3. Create session - For now use email as user ID since API returns mock data
    await createSession(email)

    // 4. Redirect user
    redirect('/dashboard')
  } catch (error) {
    console.error('🔍 Login error:', error)
    return {
      message: 'An error occurred during login.',
    }
  }
}

// Signup Server Action
export async function signup(state: FormState, formData: FormData): Promise<FormState> {
  // 1. Validate form fields
  const validatedFields = SignupSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Account.',
    }
  }

  const { name, email, password } = validatedFields.data

  try {
    // 2. Call registration API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      return {
        message: error.message || 'Failed to create account.',
      }
    }

    const result = await response.json()

    // 3. Create session
    await createSession(result.data.user.id)

    // 4. Redirect user
    redirect('/dashboard')
  } catch (error) {
    return {
      message: 'An error occurred during signup.',
    }
  }
}

// Logout Server Action
export async function logout() {
  await deleteSession()
  redirect('/login')
}
