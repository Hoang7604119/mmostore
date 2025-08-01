import { NextRequest, NextResponse } from 'next/server'

// Simple JWT decode without verification for middleware
function decodeJWT(token: string) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    const payload = JSON.parse(atob(parts[1]))
    return payload
  } catch {
    return null
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the path requires authentication
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
    const token = request.cookies.get('token')?.value
    
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    try {
      const payload = decodeJWT(token)
      
      if (!payload || !payload.userId) {
        return NextResponse.redirect(new URL('/auth/login', request.url))
      }

      // Check admin access
      if ((pathname.startsWith('/admin') || pathname.startsWith('/dashboard/admin')) && payload.role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }

    } catch (error) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/dashboard/admin/:path*'
  ],
  runtime: 'nodejs'
}