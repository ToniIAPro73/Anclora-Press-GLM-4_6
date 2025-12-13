/**
 * Next.js Middleware
 * Protects API routes and enforces authentication
 */

import { withAuth } from 'next-auth/middleware'
import { NextRequest } from 'next/server'

export const middleware = withAuth(
  function middleware(request: NextRequest) {
    // Add custom middleware logic here if needed
    return null
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
)

// Configure which routes require authentication
export const config = {
  matcher: [
    // '/api/import/:path*', // Commented out for demo - import route handles auth internally
    '/api/books/:path*',
    '/api/chapters/:path*',
    '/api/collaborators/:path*'
    // Add other protected routes as needed
  ]
}
