import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Forward request to backend with cookies
    const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace('/api/v1', '')
    const fullUrl = `${backendUrl}/api/v1/audit/stats`
    const rawCookies = request.headers.get('cookie') || ''
    
    // Decode cookies to prevent double-encoding
    const cookies = decodeURIComponent(rawCookies)

    console.log('🔍 Frontend /api/audit-stats called')
    console.log('🔍 Backend URL:', fullUrl)

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies,
        'User-Agent': request.headers.get('user-agent') || '',
        'Accept': request.headers.get('accept') || 'application/json',
      },
    })

    console.log('🔍 Backend response status:', response.status)

    if (!response.ok) {
      console.error('❌ Backend error:', response.status, response.statusText)
      return NextResponse.json(
        { error: 'Backend request failed', status: response.status },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('✅ Audit stats data received from backend')

    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ Audit stats proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
