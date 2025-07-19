import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Basic health check
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        frontend: 'up',
        api: 'checking...'
      }
    };

    // Check backend API connection
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://nestjs-api:3000';
      const response = await fetch(`${backendUrl}/api/v1/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        healthData.services.api = 'up';
      } else {
        healthData.services.api = 'down';
        healthData.status = 'degraded';
      }
    } catch (error) {
      healthData.services.api = 'down';
      healthData.status = 'degraded';
    }

    return NextResponse.json(healthData, { 
      status: healthData.status === 'healthy' ? 200 : 503 
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      },
      { status: 503 }
    );
  }
}
