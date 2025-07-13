import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // 1. Verify authentication
    const session = await verifySession()
    
    if (!session) {
      return new Response(null, { status: 401 })
    }

    // 2. Get query parameters
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') || '1'
    const limit = searchParams.get('limit') || '20'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const callerNumber = searchParams.get('callerNumber')
    const destinationNumber = searchParams.get('destinationNumber')

    // 3. Build query string for backend API
    const queryParams = new URLSearchParams()
    queryParams.append('page', page)
    queryParams.append('limit', limit)
    if (startDate) queryParams.append('startDate', startDate)
    if (endDate) queryParams.append('endDate', endDate)
    if (callerNumber) queryParams.append('callerNumber', callerNumber)
    if (destinationNumber) queryParams.append('destinationNumber', destinationNumber)

    // 4. Call backend API
    const response = await fetch(
      `${process.env.BACKEND_API_URL}/api/v1/cdr?${queryParams.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${session.userId}`, // Use proper token
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch CDR data' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('CDR API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication
    const session = await verifySession()
    
    if (!session) {
      return new Response(null, { status: 401 })
    }

    // 2. Get request body
    const body = await request.json()

    // 3. Call backend API
    const response = await fetch(`${process.env.BACKEND_API_URL}/api/v1/cdr`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.userId}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to create CDR record' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('CDR Create Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
