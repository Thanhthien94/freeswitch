import { NextResponse } from 'next/server';
import { getSession } from '@/app/actions/auth';

export async function GET() {
  try {
    // Get session from Server Action
    const session = await getSession();

    if (!session || !session.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Call backend to get WebSocket token
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const response = await fetch(`${backendUrl}/auth/websocket-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        userId: session.userId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get WebSocket token');
    }

    const data = await response.json();
    
    return NextResponse.json({
      token: data.token,
      expiresIn: data.expiresIn || 3600, // 1 hour default
    });

  } catch (error) {
    console.error('WebSocket token error:', error);
    return NextResponse.json(
      { error: 'Failed to generate WebSocket token' },
      { status: 500 }
    );
  }
}
