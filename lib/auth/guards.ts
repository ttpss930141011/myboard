import { redirect } from "next/navigation"
import { AUTH_ROUTES } from "@/lib/constants"
import { getCurrentSession } from "./session"

/**
 * Authentication guards and validation
 * Pure functions for auth requirements and checks
 * Following Single Responsibility Principle
 */

/**
 * Require authentication, redirect to sign in if not authenticated
 * @returns Authenticated user object
 * @throws Redirects to sign in page if not authenticated
 */
export const requireAuth = async () => {
  const session = await getCurrentSession()
  if (!session?.user?.id) {
    redirect(AUTH_ROUTES.SIGN_IN)
  }
  return session.user
}

/**
 * Validate user session and return user if valid
 * @returns User object or null if invalid session
 */
export const validateUserSession = async () => {
  const session = await getCurrentSession()
  return session?.user?.id ? session.user : null
}

/**
 * Check if current user owns a resource
 * @param resourceUserId - The user ID that owns the resource
 * @returns boolean indicating ownership
 */
export const verifyResourceOwnership = async (resourceUserId: string): Promise<boolean> => {
  const user = await validateUserSession()
  return user?.id === resourceUserId
}

/**
 * Require resource ownership, redirect if not owner or not authenticated
 * @param resourceUserId - The user ID that owns the resource
 * @returns Authenticated user object if owns resource
 * @throws Redirects to sign in or throws error if not owner
 */
export const requireResourceOwnership = async (resourceUserId: string) => {
  const user = await requireAuth()
  
  if (user.id !== resourceUserId) {
    throw new Error('Forbidden: You do not own this resource')
  }
  
  return user
}