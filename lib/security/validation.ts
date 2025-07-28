/**
 * Security validation utilities
 * Following SOLID principles: Single Responsibility for security validation
 */

import { prisma } from '@/lib/prisma'

/**
 * Validates share ID format and existence
 * @param shareId - The share ID to validate
 * @returns boolean indicating if shareId is valid format
 */
export const isValidShareId = (shareId: string | null | undefined): shareId is string => {
  if (!shareId || typeof shareId !== 'string') {
    return false
  }
  
  const trimmed = shareId.trim()
  
  // Basic format validation: non-empty, reasonable length
  if (trimmed.length === 0 || trimmed.length > 100) {
    return false
  }
  
  // Additional format checks can be added here
  return true
}

/**
 * Validates and retrieves a public board by shareId
 * Implements defense in depth principle
 * @param shareId - The share ID to lookup
 * @returns Promise<Board | null>
 */
export const validatePublicBoard = async (shareId: string) => {
  if (!isValidShareId(shareId)) {
    return null
  }
  
  try {
    const board = await prisma.board.findUnique({
      where: { 
        shareId,
        isPublic: true 
      },
      select: {
        id: true,
        title: true,
        shareId: true,
        isPublic: true,
        createdAt: true,
        userId: true
      }
    })
    
    // Double-check shareId matches (defense in depth)
    if (!board || !board.shareId || board.shareId !== shareId) {
      return null
    }
    
    return board
  } catch (error) {
    console.error('Error validating public board:', error)
    return null
  }
}

/**
 * Sanitizes user input to prevent XSS attacks
 * @param input - Raw user input
 * @returns Sanitized string
 */
export const sanitizeUserInput = (input: string | null | undefined): string => {
  if (!input || typeof input !== 'string') {
    return ''
  }
  
  // Basic HTML entity encoding to prevent XSS
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Validates text content length and format
 * @param text - Text to validate
 * @param maxLength - Maximum allowed length
 * @returns boolean indicating if text is valid
 */
export const isValidTextContent = (text: string | null | undefined, maxLength: number = 1000): boolean => {
  if (!text || typeof text !== 'string') {
    return false
  }
  
  const trimmed = text.trim()
  return trimmed.length > 0 && trimmed.length <= maxLength
}

/**
 * Sanitizes and validates layer text content
 * Implements defense-in-depth for user-generated content
 * @param text - Raw text input from user
 * @param maxLength - Maximum allowed length
 * @returns Sanitized and validated text
 */
export const sanitizeLayerText = (text: string | null | undefined, maxLength: number = 1000): string => {
  if (!text || typeof text !== 'string') {
    return ''
  }
  
  // First sanitize to prevent XSS
  let sanitized = sanitizeUserInput(text)
  
  // Then validate length and format
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength)
  }
  
  return sanitized
}

/**
 * Validates layer name/title input
 * @param name - Layer name to validate
 * @returns boolean indicating if name is valid
 */
export const isValidLayerName = (name: string | null | undefined): boolean => {
  if (!name || typeof name !== 'string') {
    return false
  }
  
  const trimmed = name.trim()
  
  // Layer names: 1-100 characters, no HTML tags
  if (trimmed.length === 0 || trimmed.length > 100) {
    return false
  }
  
  // Check for HTML tags (basic XSS prevention)
  if (/<[^>]*>/g.test(trimmed)) {
    return false
  }
  
  return true
}

/**
 * Sanitizes layer name input
 * @param name - Raw name input
 * @returns Sanitized layer name
 */
export const sanitizeLayerName = (name: string | null | undefined): string => {
  if (!name || typeof name !== 'string') {
    return ''
  }
  
  let sanitized = sanitizeUserInput(name.trim())
  
  // Limit length for layer names
  if (sanitized.length > 100) {
    sanitized = sanitized.substring(0, 100)
  }
  
  return sanitized
}