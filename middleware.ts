import { middleware } from "./auth-edge"
import { NextResponse } from "next/server"
import { AUTH_ROUTES, PUBLIC_ROUTES } from "@/lib/constants"

export default middleware((req) => {
  const isLoggedIn = !!req.auth
  const pathname = req.nextUrl.pathname
  
  // Public routes
  const isAuthPage = pathname.startsWith(PUBLIC_ROUTES.AUTH)
  const isPublicShare = pathname.startsWith(PUBLIC_ROUTES.BOARD_SHARE)
  const isPublicAsset = pathname.includes(".")
  const isApiAuth = pathname.startsWith(PUBLIC_ROUTES.API_AUTH)
  
  // Allow public access
  if (isAuthPage || isPublicShare || isPublicAsset || isApiAuth) {
    return NextResponse.next()
  }
  
  // Protect all other routes
  if (!isLoggedIn) {
    const signInUrl = new URL(AUTH_ROUTES.SIGN_IN, req.url)
    signInUrl.searchParams.set(AUTH_ROUTES.CALLBACK_URL_PARAM, pathname)
    return NextResponse.redirect(signInUrl)
  }
  
  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}