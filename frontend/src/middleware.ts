import { NextRequest, NextResponse } from 'next/server'

// 1. Specify protected and public routes
const protectedRoutes = ['/dashboard']
const publicRoutes = ['/login', '/signup', '/', '/api/auth']

export default async function middleware(req: NextRequest) {
  // 2. Check if the current route is protected or public
  const path = req.nextUrl.pathname
  console.log('🔍 Middleware running for path:', path)

  // 3. Check for auth token in Authorization header (for API calls)
  const authHeader = req.headers.get('authorization')
  const hasAuthToken = authHeader && authHeader.startsWith('Bearer ')

  // 4. For API routes, check authentication
  if (path.startsWith('/api') && !path.startsWith('/api/auth') && !hasAuthToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 5. For protected routes - let client-side handle authentication
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route))
  const isPublicRoute = publicRoutes.some(route => path === route || path.startsWith(route))

  if (isProtectedRoute) {
    console.log('🔒 Protected route detected:', path)
    console.log('✅ Allowing access - client-side will handle authentication')
    // Let the request proceed - ProtectedRoute component will handle auth check
    // This prevents server-side redirect loops with localStorage tokens
  }

  // 6. For login page - let client-side handle redirect logic
  if (path === '/login') {
    console.log('🔑 Login page accessed - client-side will handle redirect if authenticated')
    // Let the request proceed - client-side will redirect if already authenticated
  }

  return NextResponse.next()
}

// Routes Middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
