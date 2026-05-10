import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl
  const hostname = request.headers.get('host')
  const forceLogin = url.pathname.startsWith('/login') && url.searchParams.get('force') === '1'

  // --- Authentication Protection ---
  const token = request.cookies.get('auth_token')?.value
  const isAuthPage = url.pathname.startsWith('/login') || url.pathname.startsWith('/register')
  const isPublicPage = url.pathname === '/' || isAuthPage || url.pathname.startsWith('/accounts')

  if (forceLogin) {
    const response = NextResponse.next()
    response.cookies.delete('auth_token')
    response.cookies.delete('cm_portal')
    return response
  }

  if (!token && !isPublicPage) {
    // Redirect to login if no token and trying to access protected route
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (token && isAuthPage) {
    const portalPath = request.cookies.get('cm_portal')?.value || '/admin-console'
    return NextResponse.redirect(new URL(portalPath, request.url))
  }

  if (token && url.pathname === '/') {
    const portalPath = request.cookies.get('cm_portal')?.value || '/admin-console'
    return NextResponse.redirect(new URL(portalPath, request.url))
  }

  // --- Subdomain Logic (Preserved for future use) ---
  const subdomains = {
    admin: '(admin)',
    ops: '(ops)',
    merchant: '(merchant)',
    captain: '(captain)',
    www: '(consumer)',
  }

  const hostnameParts = hostname?.split('.') || []
  let subdomain = hostnameParts.length > 1 ? hostnameParts[0] : null
  if (hostname?.includes('localhost') && hostnameParts.length === 1) {
    subdomain = null
  }

  return NextResponse.next()
}

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
