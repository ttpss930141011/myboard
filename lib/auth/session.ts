import { auth } from "@/auth"

/**
 * Session management utilities
 * Pure functions for session-related operations
 * Following Single Responsibility Principle
 */

/**
 * Get current session without requiring authentication
 * @returns Current session or null if not authenticated
 */
export const getCurrentSession = async () => {
  const session = await auth()
  return session
}

/**
 * Check if user is currently authenticated
 * @returns boolean indicating authentication status
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const session = await getCurrentSession()
  return !!session?.user?.id
}

/**
 * Get current user from session if available
 * @returns User object or null if not authenticated
 */
export const getCurrentUser = async () => {
  const session = await getCurrentSession()
  return session?.user || null
}