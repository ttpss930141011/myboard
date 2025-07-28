import { middleware } from "./auth-edge"
import { NextResponse } from "next/server"
import { AUTH_ROUTES, PUBLIC_ROUTES } from "@/lib/constants"

export default middleware((req) => {
  const isLoggedIn = !!req.auth
  const pathname = req.nextUrl.pathname
  
  // Security logging for suspicious patterns
  const suspiciousPatterns = [
    /\.\./,  // Path traversal
    /<script/i,  // XSS attempts
    /union.*select/i,  // SQL injection attempts
    /javascript:/i,  // JavaScript protocol
  ]
  
  const hasSuspiciousPattern = suspiciousPatterns.some(pattern => 
    pattern.test(pathname) || pattern.test(req.nextUrl.search)
  )
  
  if (hasSuspiciousPattern) {
    console.warn('Suspicious request detected:', {
      pathname,
      search: req.nextUrl.search,
      ip: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent')
    })
  }
  
  // Public routes
  const isAuthPage = pathname.startsWith(PUBLIC_ROUTES.AUTH)
  const isPublicShare = pathname.startsWith(PUBLIC_ROUTES.BOARD_SHARE)
  const isPublicAsset = pathname.includes(".")
  const isApiAuth = pathname.startsWith(PUBLIC_ROUTES.API_AUTH)
  
  // Allow public access
  if (isAuthPage || isPublicShare || isPublicAsset || isApiAuth) {
    const response = NextResponse.next()
    
    // Add security headers for public routes
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
    
    return response
  }
  
  // Protect all other routes
  if (!isLoggedIn) {
    const signInUrl = new URL(AUTH_ROUTES.SIGN_IN, req.url)
    signInUrl.searchParams.set(AUTH_ROUTES.CALLBACK_URL_PARAM, pathname)
    return NextResponse.redirect(signInUrl)
  }
  
  // Additional security for authenticated routes
  const response = NextResponse.next()
  
  // Add cache control for sensitive pages
  if (!isPublicAsset) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  }
  
  return response
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}