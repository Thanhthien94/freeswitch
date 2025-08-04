import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.finstar.vn/api/v1'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 Frontend GET /api/freeswitch/sip-profiles/[id] called')
    console.log('🔍 SIP Profile ID:', params.id)
    
    const backendUrl = `${BACKEND_URL}/freeswitch/sip-profiles/${params.id}`
    console.log('🔍 Backend URL:', backendUrl)

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Cookie': request.headers.get('cookie') || '',
        'Content-Type': 'application/json',
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
    console.log('🔍 Frontend PUT /api/freeswitch/sip-profiles/[id] called')
    console.log('🔍 SIP Profile ID:', params.id)
    
    const body = await request.json()
    console.log('🔍 Request body:', body)

    const backendUrl = `${BACKEND_URL}/freeswitch/sip-profiles/${params.id}`
    console.log('🔍 Backend URL:', backendUrl)

    const response = await fetch(backendUrl, {
      method: 'PUT',
      headers: {
        'Cookie': request.headers.get('cookie') || '',
        'Content-Type': 'application/json',
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
    console.log('🔍 Frontend DELETE /api/freeswitch/sip-profiles/[id] called')
    console.log('🔍 SIP Profile ID:', params.id)
    
    const backendUrl = `${BACKEND_URL}/freeswitch/sip-profiles/${params.id}`
    console.log('🔍 Backend URL:', backendUrl)

    const response = await fetch(backendUrl, {
      method: 'DELETE',
      headers: {
        'Cookie': request.headers.get('cookie') || '',
        'Content-Type': 'application/json',
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
