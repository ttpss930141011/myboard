/**
 * API Security middleware utilities
 * Centralized security middleware for API routes
 * Following SOLID principles: Single Responsibility for API security
 */

import { NextRequest } from 'next/server'
import { enhancedCSRFProtection } from './csrf-protection'

/**
 * Security middleware for API routes
 * Applies multiple security checks in sequence
 * @param request - The incoming request
 * @returns Response object if security check fails, null if all checks pass
 */
export const applyAPISecurityMiddleware = (request: NextRequest): Response | null => {
  // Apply CSRF protection with rate limiting
  const csrfCheck = enhancedCSRFProtection(request)
  if (csrfCheck) {
    return csrfCheck
  }
  
  // Additional security checks can be added here
  // For example: API key validation, request size limits, etc.
  
  return null
}

/**
 * Wrapper for API route handlers that applies security middleware
 * @param handler - The original API route handler
 * @returns Enhanced handler with security middleware
 */
export const withAPISecurity = (
  handler: (request: NextRequest, context: any) => Promise<Response>
) => {
  return async (request: NextRequest, context: any): Promise<Response> => {
    // Apply security middleware
    const securityCheck = applyAPISecurityMiddleware(request)
    if (securityCheck) {
      return securityCheck
    }
    
    // If security checks pass, call the original handler
    return handler(request, context)
  }
}

/**
 * Security headers for API responses
 * Implements security best practices for API responses
 */
export const getSecurityHeaders = (): Record<string, string> => {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  }
}

/**
 * Adds security headers to a Response
 * @param response - The response to enhance
 * @returns Response with security headers added
 */
export const addSecurityHeaders = (response: Response): Response => {
  const headers = getSecurityHeaders()
  
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  return response
}