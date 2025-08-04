import { NextRequest, NextResponse } from 'next/server'
import { logout } from '@/app/actions/auth'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Logout API route called')
    await logout()
    // Use production domain for redirect URL
    const origin = request.nextUrl.origin
    console.log('🔍 Redirecting to:', `${origin}/login`)
    return NextResponse.redirect(`${origin}/login`)
  } catch (error) {
    console.error('🔍 Logout API error:', error)
    // Even if there's an error, redirect to login
    const origin = request.nextUrl.origin
    console.log('🔍 Error redirect to:', `${origin}/login`)
    return NextResponse.redirect(`${origin}/login`)
  }
}
