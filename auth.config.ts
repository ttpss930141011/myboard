import type { NextAuthConfig } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import Resend from "next-auth/providers/resend"
import { AUTH_ROUTES, PUBLIC_ROUTES } from "@/lib/constants"

/**
 * Edge-compatible configuration
 * This can be imported in middleware and edge runtime
 */
export default {
  providers: [
    Resend({
      from: "MyBoard <noreply@justinxiao.app>"
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  pages: {
    signIn: AUTH_ROUTES.SIGN_IN,
    error: AUTH_ROUTES.ERROR,
  },
  callbacks: {
    authorized({ request, auth }) {
      const { pathname } = request.nextUrl
      
      // Public routes
      if (pathname.startsWith(PUBLIC_ROUTES.AUTH)) return true
      if (pathname.startsWith(PUBLIC_ROUTES.BOARD_SHARE)) return true
      if (pathname.startsWith(PUBLIC_ROUTES.API_AUTH)) return true
      
      // Protected routes
      return !!auth
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
      }
      return session
    },
  },
} satisfies NextAuthConfig