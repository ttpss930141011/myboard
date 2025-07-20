import { middleware } from "./auth-edge"
import { NextResponse } from "next/server"

export default middleware((req) => {
  const isLoggedIn = !!req.auth
  const pathname = req.nextUrl.pathname
  
  // Public routes
  const isAuthPage = pathname.startsWith("/auth")
  const isPublicShare = pathname.startsWith("/board/share")
  const isPublicAsset = pathname.includes(".")
  const isApiAuth = pathname.startsWith("/api/auth")
  
  // Allow public access
  if (isAuthPage || isPublicShare || isPublicAsset || isApiAuth) {
    return NextResponse.next()
  }
  
  // Protect all other routes
  if (!isLoggedIn) {
    const signInUrl = new URL("/auth/signin", req.url)
    signInUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(signInUrl)
  }
  
  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}