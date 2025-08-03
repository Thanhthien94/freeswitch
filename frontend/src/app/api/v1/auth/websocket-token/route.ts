import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Forward request to backend with cookies
    const backendUrl = process.env.BACKEND_API_URL || 'http://nestjs-api:3000/api/v1'
    const fullUrl = `${backendUrl}/auth/websocket-token`
    const rawCookies = request.headers.get('cookie') || ''
    
    // Decode cookies to prevent double-encoding
    const cookies = decodeURIComponent(rawCookies)

    console.log('🔍 Frontend /api/v1/auth/websocket-token called')
    console.log('🔍 Backend URL:', fullUrl)
    console.log('🔍 Raw cookies:', rawCookies)
    console.log('🔍 Decoded cookies to forward:', cookies)

    // Get request body if any
    let body = null
    try {
      body = await request.json()
    } catch {
      // No body or invalid JSON, that's fine
    }

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Cookie': cookies,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    console.log('🔍 Backend response status:', response.status)

    if (!response.ok) {
      console.log('🔍 Backend websocket-token failed with status:', response.status)
      const errorText = await response.text()
      console.log('🔍 Backend error response:', errorText)
      return NextResponse.json({ error: 'Failed to get WebSocket token' }, { status: response.status })
    }

    const result = await response.json()
    console.log('🔍 Backend websocket-token success')
    return NextResponse.json(result)
  } catch (error) {
    console.error('🔍 Error forwarding websocket-token request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
