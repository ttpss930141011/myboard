/**
 * CSRF Protection utilities
 * Implements Cross-Site Request Forgery protection beyond NextAuth.js defaults
 * Following SOLID principles: Single Responsibility for CSRF security
 */

import { NextRequest } from 'next/server'
import { headers } from 'next/headers'

/**
 * Validates request origin against allowed origins
 * Implements Same-Origin Policy enforcement
 * @param request - The incoming request
 * @returns boolean indicating if origin is valid
 */
export const isValidOrigin = (request: NextRequest): boolean => {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const host = request.headers.get('host')
  
  // For same-origin requests, origin might be null
  if (!origin && !referer) {
    return false
  }
  
  // Check origin header if present
  if (origin) {
    try {
      const originUrl = new URL(origin)
      return originUrl.host === host
    } catch {
      return false
    }
  }
  
  // Fallback to referer check
  if (referer) {
    try {
      const refererUrl = new URL(referer)
      return refererUrl.host === host
    } catch {
      return false
    }
  }
  
  return false
}

/**
 * Validates Content-Type header for JSON API requests
 * Helps prevent simple form-based CSRF attacks
 * @param request - The incoming request
 * @returns boolean indicating if content type is valid
 */
export const hasValidContentType = (request: NextRequest): boolean => {
  const contentType = request.headers.get('content-type')
  
  if (!contentType) {
    return false
  }
  
  // Accept JSON content types
  return contentType.includes('application/json')
}

/**
 * Validates HTTP method for state-changing operations
 * @param method - HTTP method
 * @returns boolean indicating if method is safe
 */
export const isSafeMethod = (method: string): boolean => {
  return ['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())
}

/**
 * Validates custom CSRF header presence
 * Many modern applications use custom headers as CSRF protection
 * @param request - The incoming request
 * @returns boolean indicating if custom header is present
 */
export const hasCustomCSRFHeader = (request: NextRequest): boolean => {
  // Check for common custom headers that indicate legitimate requests
  const customHeaders = [
    'x-requested-with',
    'x-csrf-token',
    'x-api-key'
  ]
  
  return customHeaders.some(header => request.headers.has(header))
}

/**
 * Comprehensive CSRF validation for API routes
 * Implements multiple layers of CSRF protection
 * @param request - The incoming request
 * @returns object with validation result and error message
 */
export const validateCSRFProtection = (request: NextRequest): { 
  isValid: boolean
  error?: string 
} => {
  // Safe methods don't need CSRF protection
  if (isSafeMethod(request.method)) {
    return { isValid: true }
  }
  
  // Check origin/referer for state-changing requests
  if (!isValidOrigin(request)) {
    return {
      isValid: false,
      error: 'Invalid origin: possible CSRF attack detected'
    }
  }
  
  // For JSON API requests, validate content type
  if (!hasValidContentType(request)) {
    return {
      isValid: false,
      error: 'Invalid content type: JSON required for API requests'
    }
  }
  
  // Additional protection: custom header check
  // This is a common modern CSRF protection technique
  const hasValidHeader = hasCustomCSRFHeader(request)
  
  if (!hasValidHeader) {
    return {
      isValid: false,
      error: 'Missing required headers: possible CSRF attack'
    }
  }
  
  return { isValid: true }
}

/**
 * Middleware-compatible CSRF check
 * Returns appropriate response for CSRF validation failures
 * @param request - The incoming request
 * @returns Response object if validation fails, null if valid
 */
export const checkCSRFAndReturnResponse = (request: NextRequest): Response | null => {
  const validation = validateCSRFProtection(request)
  
  if (!validation.isValid) {
    console.warn(`CSRF validation failed: ${validation.error}`, {
      method: request.method,
      url: request.url,
      origin: request.headers.get('origin'),
      referer: request.headers.get('referer'),
      userAgent: request.headers.get('user-agent')
    })
    
    return new Response('Forbidden: CSRF validation failed', { 
      status: 403,
      headers: {
        'Content-Type': 'text/plain'
      }
    })
  }
  
  return null
}

/**
 * Simple rate limiting based on IP address
 * Helps prevent CSRF attack amplification
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>()

/**
 * Basic rate limiting implementation
 * @param request - The incoming request
 * @param maxRequests - Maximum requests per window
 * @param windowMs - Time window in milliseconds
 * @returns boolean indicating if request is within rate limits
 */
export const isWithinRateLimit = (
  request: NextRequest, 
  maxRequests: number = 100, 
  windowMs: number = 60000
): boolean => {
  // Get client IP (simplified for demo)
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown'
  
  const now = Date.now()
  const existing = requestCounts.get(ip)
  
  if (!existing || now > existing.resetTime) {
    // First request or window expired
    requestCounts.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (existing.count >= maxRequests) {
    return false
  }
  
  existing.count++
  return true
}

/**
 * Enhanced CSRF protection with rate limiting
 * @param request - The incoming request
 * @returns Response object if validation fails, null if valid
 */
export const enhancedCSRFProtection = (request: NextRequest): Response | null => {
  // Check rate limits first
  if (!isWithinRateLimit(request, 100, 60000)) {
    console.warn('Rate limit exceeded', {
      method: request.method,
      url: request.url,
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    })
    
    return new Response('Too Many Requests', { 
      status: 429,
      headers: {
        'Retry-After': '60'
      }
    })
  }
  
  // Then check CSRF protection
  return checkCSRFAndReturnResponse(request)
}