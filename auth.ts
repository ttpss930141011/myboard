import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import authConfig from "./auth.config"

/**
 * Main auth instance with database adapter
 * Following official Auth.js Edge compatibility pattern
 * https://authjs.dev/guides/edge-compatibility
 */
export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
        
        // Get fresh user data from database for profile info
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            createdAt: true,
            accounts: {
              select: {
                provider: true
              }
            }
          }
        })
        
        if (dbUser) {
          session.user.createdAt = dbUser.createdAt
          session.user.providers = dbUser.accounts.map(acc => acc.provider)
        }
      }
      return session
    },
  }
})