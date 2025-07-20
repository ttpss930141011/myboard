import { auth } from "@/auth"
import { redirect } from "next/navigation"

/**
 * Authentication service following Single Responsibility Principle
 * Handles all auth-related operations
 */
export class AuthService {
  /**
   * Get current authenticated user
   * Redirects to sign in if not authenticated
   */
  static async requireAuth() {
    const session = await auth()
    if (!session?.user?.id) {
      redirect("/auth/signin")
    }
    return session.user
  }

  /**
   * Get current session without requiring auth
   */
  static async getSession() {
    const session = await auth()
    return session
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated() {
    const session = await auth()
    return !!session?.user?.id
  }
}