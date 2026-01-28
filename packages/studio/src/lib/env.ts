/**
 * Client-side environment variables
 * Vite only exposes variables prefixed with VITE_ to the client
 */

export const env = {
  get VITE_APP_TITLE() {
    return import.meta.env.VITE_APP_TITLE ?? 'Vite + React + shadcn/ui'
  },
  get VITE_APP_DESCRIPTION() {
    return import.meta.env.VITE_APP_DESCRIPTION ?? 'Modern React starter with shadcn/ui'
  },
  get VITE_APP_URL() {
    return import.meta.env.VITE_APP_URL ?? 'http://localhost:5173'
  },
  get VITE_APP_VERSION() {
    return import.meta.env.VITE_APP_VERSION ?? '1.0.0'
  },
  get VITE_ENABLE_ANALYTICS() {
    return import.meta.env.VITE_ENABLE_ANALYTICS ?? 'false'
  },
  get VITE_ENABLE_ERROR_REPORTING() {
    return import.meta.env.VITE_ENABLE_ERROR_REPORTING ?? 'false'
  },
} as const

/**
 * Type-safe environment variables for the app
 */
export type Env = typeof env

/**
 * Helper to check if analytics are enabled
 */
export const isAnalyticsEnabled = () => env.VITE_ENABLE_ANALYTICS === 'true'

/**
 * Helper to check if error reporting is enabled
 */
export const isErrorReportingEnabled = () => env.VITE_ENABLE_ERROR_REPORTING === 'true'
