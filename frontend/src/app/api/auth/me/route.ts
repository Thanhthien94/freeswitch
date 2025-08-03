import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Forward request to backend with cookies
    const backendUrl = process.env.BACKEND_API_URL || 'http://nestjs-api:3000/api/v1'
    const fullUrl = `${backendUrl}/auth/me`
    const rawCookies = request.headers.get('cookie') || ''

    // Decode cookies to prevent double-encoding
    const cookies = decodeURIComponent(rawCookies)

    console.log('🔍 Frontend /api/auth/me called')
    console.log('🔍 Backend URL:', fullUrl)
    console.log('🔍 Raw cookies:', rawCookies)
    console.log('🔍 Decoded cookies to forward:', cookies)
    console.log('🔍 Environment BACKEND_API_URL:', process.env.BACKEND_API_URL)

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Cookie': cookies,
        'Content-Type': 'application/json',
      },
    })

    console.log('🔍 Backend response status:', response.status)

    if (!response.ok) {
      console.log('🔍 Backend auth failed with status:', response.status)
      const errorText = await response.text()
      console.log('🔍 Backend error response:', errorText)
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const result = await response.json()
    console.log('🔍 Backend auth success, user:', result.user?.username)
    return NextResponse.json(result)
  } catch (error) {
    console.error('🔍 Error forwarding auth request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
