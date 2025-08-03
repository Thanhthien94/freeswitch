import { NextRequest, NextResponse } from 'next/server'
import { logout } from '@/app/actions/auth'

export async function POST(request: NextRequest) {
  try {
    await logout()
    // Use localhost for redirect URL
    return NextResponse.redirect('http://localhost:3002/login')
  } catch (error) {
    console.error('Logout error:', error)
    // Even if there's an error, redirect to login
    return NextResponse.redirect('http://localhost:3002/login')
  }
}
