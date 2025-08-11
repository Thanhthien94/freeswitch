import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Forward export request to backend with cookies - use public domain
    // Remove /api/v1 from NEXT_PUBLIC_API_URL to avoid duplicate
    const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace('/api/v1', '')
    
    // Get query parameters from the request
    const { searchParams } = new URL(request.url)
    const queryString = searchParams.toString()
    
    const fullUrl = `${backendUrl}/api/v1/freeswitch/sip-profiles/export${queryString ? `?${queryString}` : ''}`
    const rawCookies = request.headers.get('cookie') || ''

    // Decode cookies to prevent double-encoding
    const cookies = decodeURIComponent(rawCookies)

    console.log('🔍 Frontend GET /api/freeswitch/sip-profiles/export called')
    console.log('🔍 Backend URL:', fullUrl)
    console.log('🔍 Query params:', queryString)

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies,
      },
    })

    if (!response.ok) {
      console.error('❌ Backend export request failed:', response.status, response.statusText)
      return NextResponse.json(
        { error: 'Failed to export SIP profiles', details: response.statusText },
        { status: response.status }
      )
    }

    // Handle blob response for file download
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/')) {
      const blob = await response.blob()
      return new NextResponse(blob, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': response.headers.get('content-disposition') || 'attachment; filename="sip-profiles.csv"',
        },
      })
    }

    const data = await response.json()
    console.log('✅ SIP Profiles export successful')
    return NextResponse.json(data)

  } catch (error) {
    console.error('❌ Frontend export proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
