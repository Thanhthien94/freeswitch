'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { createSession, deleteSession, decrypt } from '@/lib/auth'
import { cookies } from 'next/headers'
import type { User } from '@/lib/auth'

// Validation schemas
const LoginSchema = z.object({
  emailOrUsername: z.string().min(1, 'Email hoặc tên đăng nhập là bắt buộc'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  rememberMe: z.boolean().optional(),
})

const SignupSchema = z.object({
  name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
})

// Form state type
export interface FormState {
  errors?: {
    name?: string[]
    emailOrUsername?: string[]
    email?: string[]
    password?: string[]
    rememberMe?: string[]
  }
  message?: string
  success?: boolean
}

// Login Server Action
export async function login(state: FormState, formData: FormData): Promise<FormState> {
  // 1. Validate form fields
  const validatedFields = LoginSchema.safeParse({
    emailOrUsername: formData.get('emailOrUsername'),
    password: formData.get('password'),
    rememberMe: formData.get('rememberMe') === 'on',
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Vui lòng kiểm tra lại thông tin đăng nhập.',
    }
  }

  const { emailOrUsername, password, rememberMe } = validatedFields.data

  try {
    console.log('🔍 Login attempt:', { emailOrUsername, password: '***', rememberMe })

    // 2. Call NestJS API directly from Server Action
    const apiUrl = process.env.BACKEND_API_URL || 'http://nestjs-api:3000/api/v1'
    console.log('🔍 API URL:', `${apiUrl}/auth/session-login`)
    console.log('🔍 Environment BACKEND_API_URL:', process.env.BACKEND_API_URL)

    const response = await fetch(`${apiUrl}/auth/session-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emailOrUsername,
        password,
        rememberMe
      }),
    })

    console.log('🔍 Response status:', response.status)
    console.log('🔍 Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
      console.log('🔍 Error response:', errorData)

      if (response.status === 401) {
        return {
          message: 'Email/tên đăng nhập hoặc mật khẩu không đúng.',
        }
      }

      return {
        message: errorData.message || 'Đã xảy ra lỗi khi đăng nhập.',
      }
    }

    const result = await response.json()
    console.log('🔍 Session login result:', {
      hasUser: !!result.user,
      user: result.user?.username,
      message: result.message
    })

    // 3. Forward Set-Cookie headers from backend to browser
    const setCookieHeaders = response.headers.get('set-cookie')
    if (setCookieHeaders) {
      console.log('🔍 Raw Set-Cookie headers:', setCookieHeaders)
      const cookieStore = await cookies()

      // Parse and set each cookie properly
      const cookieStrings = setCookieHeaders.includes(',')
        ? setCookieHeaders.split(',').map(s => s.trim())
        : [setCookieHeaders.trim()]

      cookieStrings.forEach(cookieStr => {
        const [nameValue, ...options] = cookieStr.split(';')
        const [name, value] = nameValue.split('=', 2) // Limit to 2 parts

        if (name && value) {
          // Decode the value to prevent double-encoding
          const decodedValue = decodeURIComponent(value)
          cookieStore.set(name.trim(), decodedValue, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
          })
          console.log('🔍 Set cookie:', name.trim(), '=', decodedValue.substring(0, 20) + '...')
        }
      })
    } else {
      console.log('🔍 No Set-Cookie headers from backend')
    }

    // 4. Validate response structure (session-login returns user, not token)
    if (!result.user) {
      return {
        message: 'Phản hồi từ server không hợp lệ.',
      }
    }

    // 5. Session cookies forwarded successfully
    console.log('✅ Backend session created and cookies forwarded')
    console.log('🔍 User logged in:', result.user.username)

    // 5. Redirect user
    redirect('/dashboard')
  } catch (error) {
    console.error('🔍 Login error:', error)

    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      // This is a redirect, not an error
      throw error
    }

    return {
      message: 'Đã xảy ra lỗi khi kết nối đến server.',
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
  } catch {
    return {
      message: 'An error occurred during signup.',
    }
  }
}

// Get Session Server Action
export async function getSession() {
  const cookieStore = await cookies()
  const cookie = cookieStore.get('session')?.value
  console.log('getSession - Cookie:', cookie ? 'exists' : 'not found');

  if (!cookie) {
    return null
  }

  const session = await decrypt(cookie)
  console.log('getSession - Decrypted session:', session);

  if (!session?.userId) {
    console.log('getSession - No userId in session');
    return null
  }

  return session
}

// Logout Server Action
export async function logout(): Promise<void> {
  try {
    console.log('🔍 Logout action called')

    // Call backend session logout
    const apiUrl = process.env.BACKEND_API_URL || 'http://nestjs-api:3000/api/v1'
    try {
      await fetch(`${apiUrl}/auth/session-logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include session cookies
      })
      console.log('✅ Backend session logout successful')
    } catch (backendError) {
      console.warn('⚠️ Backend logout failed, continuing with local logout:', backendError)
    }

    // No need to delete local session since we're using backend sessions
    console.log('✅ Backend session logout completed')

    // Redirect to login
    redirect('/login')
  } catch (error) {
    console.error('🔍 Logout error:', error)

    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      // This is a redirect, not an error
      throw error
    }

    // Even if there's an error, redirect to login
    redirect('/login')
  }
}
