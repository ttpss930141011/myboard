import NextAuth from "next-auth"
import authConfig from "./auth.config"

/**
 * Edge-compatible auth instance for middleware
 * Following official Auth.js Edge compatibility pattern
 * https://authjs.dev/guides/edge-compatibility
 * Does not use PrismaAdapter to avoid Edge Runtime issues
 */
export const { auth: middleware } = NextAuth(authConfig)