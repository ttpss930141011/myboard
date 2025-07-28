/**
 * API Client utilities with built-in security headers
 * Provides consistent API calling with CSRF protection
 * Following SOLID principles: Single Responsibility for API communication
 */

/**
 * Default headers for API requests including CSRF protection
 */
const getDefaultHeaders = (): Record<string, string> => {
  return {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest', // CSRF protection header
  }
}

/**
 * Enhanced fetch wrapper with built-in security headers
 * @param url - API endpoint URL
 * @param options - Fetch options
 * @returns Promise<Response>
 */
export const secureFetch = async (
  url: string, 
  options: RequestInit = {}
): Promise<Response> => {
  const defaultHeaders = getDefaultHeaders()
  
  const enhancedOptions: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  }
  
  return fetch(url, enhancedOptions)
}

/**
 * API client methods with built-in security
 */
export const apiClient = {
  /**
   * GET request with security headers
   */
  get: async (url: string, options: RequestInit = {}): Promise<Response> => {
    return secureFetch(url, {
      ...options,
      method: 'GET',
    })
  },

  /**
   * POST request with security headers and JSON body
   */
  post: async (url: string, data?: any, options: RequestInit = {}): Promise<Response> => {
    return secureFetch(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  },

  /**
   * PUT request with security headers and JSON body
   */
  put: async (url: string, data?: any, options: RequestInit = {}): Promise<Response> => {
    return secureFetch(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  },

  /**
   * PATCH request with security headers and JSON body
   */
  patch: async (url: string, data?: any, options: RequestInit = {}): Promise<Response> => {
    return secureFetch(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  },

  /**
   * DELETE request with security headers
   */
  delete: async (url: string, options: RequestInit = {}): Promise<Response> => {
    return secureFetch(url, {
      ...options,
      method: 'DELETE',
    })
  },
}

/**
 * Handles API errors in a consistent way
 * @param response - Fetch response
 * @returns Promise that throws on error or returns response
 */
export const handleAPIResponse = async (response: Response): Promise<Response> => {
  if (!response.ok) {
    // Handle different error types
    switch (response.status) {
      case 400:
        throw new Error('Bad Request: Invalid data provided')
      case 401:
        throw new Error('Unauthorized: Please sign in')
      case 403:
        throw new Error('Forbidden: Access denied')
      case 404:
        throw new Error('Not Found: Resource does not exist')
      case 429:
        throw new Error('Too Many Requests: Please slow down')
      case 500:
        throw new Error('Server Error: Please try again later')
      default:
        throw new Error(`Request failed with status ${response.status}`)
    }
  }
  
  return response
}

/**
 * Complete API client with error handling
 */
export const secureApiClient = {
  get: async (url: string, options: RequestInit = {}) => {
    const response = await apiClient.get(url, options)
    return handleAPIResponse(response)
  },

  post: async (url: string, data?: any, options: RequestInit = {}) => {
    const response = await apiClient.post(url, data, options)
    return handleAPIResponse(response)
  },

  put: async (url: string, data?: any, options: RequestInit = {}) => {
    const response = await apiClient.put(url, data, options)
    return handleAPIResponse(response)
  },

  patch: async (url: string, data?: any, options: RequestInit = {}) => {
    const response = await apiClient.patch(url, data, options)
    return handleAPIResponse(response)
  },

  delete: async (url: string, options: RequestInit = {}) => {
    const response = await apiClient.delete(url, options)
    return handleAPIResponse(response)
  },
}