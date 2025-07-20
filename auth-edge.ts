import NextAuth from "next-auth"
import { authConfigBase } from "@/lib/auth/config"

/**
 * Edge-compatible auth instance for middleware
 * Does not use PrismaAdapter to avoid Edge Runtime issues
 */
export const { auth, handlers, signIn, signOut } = NextAuth(authConfigBase)