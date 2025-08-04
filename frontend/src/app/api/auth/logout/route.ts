import { NextRequest, NextResponse } from 'next/server'
import { logout } from '@/app/actions/auth'

export async function POST(request: NextRequest) {
  try {
    await logout()
    // Use production domain for redirect URL
    const origin = request.nextUrl.origin
    return NextResponse.redirect(`${origin}/login`)
  } catch (error) {
    console.error('Logout error:', error)
    // Even if there's an error, redirect to login
    const origin = request.nextUrl.origin
    return NextResponse.redirect(`${origin}/login`)
  }
}
