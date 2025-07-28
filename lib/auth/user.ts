import { getCurrentUser } from "./session"

/**
 * User-specific operations and utilities
 * Pure functions for user-related operations
 * Following YAGNI principle - minimal implementation for current needs
 */

/**
 * Get user ID from current session
 * @returns User ID string or null if not authenticated
 */
export const getCurrentUserId = async (): Promise<string | null> => {
  const user = await getCurrentUser()
  return user?.id || null
}

/**
 * Get user email from current session
 * @returns User email string or null if not authenticated
 */
export const getCurrentUserEmail = async (): Promise<string | null> => {
  const user = await getCurrentUser()
  return user?.email || null
}

/**
 * Get user display name from current session
 * @returns User name string or null if not authenticated
 */
export const getCurrentUserName = async (): Promise<string | null> => {
  const user = await getCurrentUser()
  return user?.name || null
}