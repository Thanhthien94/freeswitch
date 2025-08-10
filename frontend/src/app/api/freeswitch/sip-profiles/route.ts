import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Forward request to backend with cookies - use public domain
    // Remove /api/v1 from NEXT_PUBLIC_API_URL to avoid duplicate
    const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace('/api/v1', '')

    // Get query parameters from the request
    const { searchParams } = new URL(request.url)
    const queryString = searchParams.toString()

    const fullUrl = `${backendUrl}/api/v1/freeswitch/sip-profiles${queryString ? `?${queryString}` : ''}`
    const rawCookies = request.headers.get('cookie') || ''

    // Decode cookies to prevent double-encoding
    const cookies = decodeURIComponent(rawCookies)

    console.log('🔍 Frontend /api/freeswitch/sip-profiles called')
    console.log('🔍 Backend URL:', fullUrl)
    console.log('🔍 Query params:', queryString)

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
    console.log('✅ FreeSWITCH SIP profiles data received from backend')

    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ FreeSWITCH SIP profiles proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Forward POST request to backend with cookies - use public domain
    // Remove /api/v1 from NEXT_PUBLIC_API_URL to avoid duplicate
    const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace('/api/v1', '')
    const fullUrl = `${backendUrl}/api/v1/freeswitch/sip-profiles`
    const rawCookies = request.headers.get('cookie') || ''

    // Decode cookies to prevent double-encoding
    const cookies = decodeURIComponent(rawCookies)

    const body = await request.json()

    console.log('🔍 Frontend POST /api/freeswitch/sip-profiles called')
    console.log('🔍 Backend URL:', fullUrl)
    console.log('🔍 Request body:', body)

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies,
        'User-Agent': request.headers.get('user-agent') || '',
        'Accept': request.headers.get('accept') || 'application/json',
      },
      body: JSON.stringify(body),
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
    console.log('✅ FreeSWITCH SIP profile created successfully')

    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ FreeSWITCH SIP profile CREATE proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
