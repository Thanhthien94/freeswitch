import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Forward POST request to backend with cookies
    const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace('/api/v1', '')
    const fullUrl = `${backendUrl}/api/v1/freeswitch/network-config/reset`
    const rawCookies = request.headers.get('cookie') || ''
    const cookies = decodeURIComponent(rawCookies)
    
    // Get request body if any
    let body = null
    try {
      body = await request.json()
    } catch (e) {
      // No body or invalid JSON, that's fine for this endpoint
    }

    console.log('🔍 Frontend POST /api/freeswitch/network-config/reset called')
    console.log('🔍 Backend URL:', fullUrl)

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies,
        'User-Agent': request.headers.get('user-agent') || '',
        'Accept': request.headers.get('accept') || 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
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
    console.log('✅ FreeSWITCH network config reset completed successfully')

    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ FreeSWITCH network config reset proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
