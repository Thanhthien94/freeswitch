import { NextRequest, NextResponse } from 'next/server'

// 1. Specify protected and public routes (for future use)
// const protectedRoutes = ['/dashboard']
// const publicRoutes = ['/login', '/signup', '/']

export default async function middleware(req: NextRequest) {
  // 2. Check if the current route is protected or public
  const path = req.nextUrl.pathname

  // 3. Check for auth token in Authorization header (for API calls)
  const authHeader = req.headers.get('authorization')
  const hasAuthToken = authHeader && authHeader.startsWith('Bearer ')

  // 4. For protected routes, check if we have authentication
  // Since we're using localStorage, we can't check it server-side
  // So we'll let the client-side handle authentication redirects
  // This middleware mainly handles API route protection

  // 5. For API routes, check authentication
  if (path.startsWith('/api') && !path.startsWith('/api/auth') && !hasAuthToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.next()
}

// Routes Middleware should not run on
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}
