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

  // 5. For protected routes, redirect to login if no session cookie
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route))
  const isPublicRoute = publicRoutes.some(route => path === route || path.startsWith(route))

  if (isProtectedRoute) {
    console.log('🔒 Protected route detected:', path)
    // Check for session cookie (server-side auth)
    const sessionCookie = req.cookies.get('session')?.value
    console.log('🍪 Session cookie:', sessionCookie ? 'exists' : 'missing')

    // If no session cookie, redirect to login
    if (!sessionCookie) {
      console.log('🚫 No session cookie, redirecting to login')
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('redirect', path)
      return NextResponse.redirect(loginUrl)
    }

    console.log('✅ Session cookie found, allowing access')
    // TODO: Verify session cookie validity here if needed
    // For now, we trust the presence of the cookie
  }

  // 6. If user is authenticated and tries to access login page, redirect to dashboard
  if (path === '/login') {
    const sessionCookie = req.cookies.get('session')?.value
    if (sessionCookie) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
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
