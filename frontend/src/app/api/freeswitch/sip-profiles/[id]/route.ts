import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Forward request to backend with cookies - use public domain
    // Remove /api/v1 from NEXT_PUBLIC_API_URL to avoid duplicate
    const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace('/api/v1', '')
    const fullUrl = `${backendUrl}/api/v1/freeswitch/sip-profiles/${params.id}`
    const rawCookies = request.headers.get('cookie') || ''

    // Decode cookies to prevent double-encoding
    const cookies = decodeURIComponent(rawCookies)

    console.log('🔍 Frontend GET /api/freeswitch/sip-profiles/[id] called')
    console.log('🔍 SIP Profile ID:', params.id)
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
    console.log('✅ FreeSWITCH SIP profile data received from backend')

    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ FreeSWITCH SIP profile GET proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Forward PUT request to backend with cookies - use public domain
    // Remove /api/v1 from NEXT_PUBLIC_API_URL to avoid duplicate
    const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace('/api/v1', '')
    const fullUrl = `${backendUrl}/api/v1/freeswitch/sip-profiles/${params.id}`
    const rawCookies = request.headers.get('cookie') || ''

    // Decode cookies to prevent double-encoding
    const cookies = decodeURIComponent(rawCookies)

    const body = await request.json()

    console.log('🔍 Frontend PUT /api/freeswitch/sip-profiles/[id] called')
    console.log('🔍 SIP Profile ID:', params.id)
    console.log('🔍 Backend URL:', fullUrl)
    console.log('🔍 Request body:', body)

    const response = await fetch(fullUrl, {
      method: 'PUT',
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
    console.log('✅ FreeSWITCH SIP profile updated successfully')

    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ FreeSWITCH SIP profile UPDATE proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Forward DELETE request to backend with cookies - use public domain
    // Remove /api/v1 from NEXT_PUBLIC_API_URL to avoid duplicate
    const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace('/api/v1', '')
    const fullUrl = `${backendUrl}/api/v1/freeswitch/sip-profiles/${params.id}`
    const rawCookies = request.headers.get('cookie') || ''

    // Decode cookies to prevent double-encoding
    const cookies = decodeURIComponent(rawCookies)

    console.log('🔍 Frontend DELETE /api/freeswitch/sip-profiles/[id] called')
    console.log('🔍 SIP Profile ID:', params.id)
    console.log('🔍 Backend URL:', fullUrl)

    const response = await fetch(fullUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies,
        'User-Agent': request.headers.get('user-agent') || '',
        'Accept': request.headers.get('accept') || 'application/json',
      },
    })

    console.log('🔍 Backend response status:', response.status)

    // DELETE typically returns 204 No Content
    if (response.status === 204) {
      console.log('✅ FreeSWITCH SIP profile deleted successfully (204)')
      return new NextResponse(null, { status: 204 })
    }

    if (!response.ok) {
      console.error('❌ Backend error:', response.status, response.statusText)
      // Try to get error message from response
      try {
        const errorData = await response.json()
        return NextResponse.json(errorData, { status: response.status })
      } catch {
        return NextResponse.json(
          { error: 'Backend request failed', status: response.status },
          { status: response.status }
        )
      }
    }

    const data = await response.json()
    console.log('✅ FreeSWITCH SIP profile deleted successfully')

    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ FreeSWITCH SIP profile DELETE proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
