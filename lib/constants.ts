/**
 * Application constants
 * Following KISS principle - centralized configuration
 */

export const AUTH_ROUTES = {
  SIGN_IN: '/auth/signin',
  ERROR: '/auth/error',
  CALLBACK_URL_PARAM: 'callbackUrl',
} as const

export const PUBLIC_ROUTES = {
  AUTH: '/auth',
  BOARD_SHARE: '/board/share',
  API_AUTH: '/api/auth',
} as const

export const APP_ROUTES = {
  HOME: '/',
  DASHBOARD: '/',
} as const