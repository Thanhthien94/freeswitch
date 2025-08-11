import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Forward test request to backend with cookies - use public domain
    // Remove /api/v1 from NEXT_PUBLIC_API_URL to avoid duplicate
    const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace('/api/v1', '')
    const fullUrl = `${backendUrl}/api/v1/freeswitch/sip-profiles/${params.id}/test`
    const rawCookies = request.headers.get('cookie') || ''

    // Decode cookies to prevent double-encoding
    const cookies = decodeURIComponent(rawCookies)

    console.log('🔍 Frontend POST /api/freeswitch/sip-profiles/[id]/test called')
    console.log('🔍 SIP Profile ID:', params.id)
    console.log('🔍 Backend URL:', fullUrl)

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies,
      },
    })

    if (!response.ok) {
      console.error('❌ Backend test request failed:', response.status, response.statusText)
      return NextResponse.json(
        { error: 'Failed to test SIP profile', details: response.statusText },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('✅ SIP Profile test successful:', data)
    return NextResponse.json(data)

  } catch (error) {
    console.error('❌ Frontend test proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
