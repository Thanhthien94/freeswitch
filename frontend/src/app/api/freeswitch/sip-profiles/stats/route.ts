import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.finstar.vn/api/v1'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Frontend /api/freeswitch/sip-profiles/stats called')
    
    const backendUrl = `${BACKEND_URL}/freeswitch/sip-profiles/stats`
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
    console.log('✅ FreeSWITCH SIP profiles stats received from backend')

    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ FreeSWITCH SIP profiles stats proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
