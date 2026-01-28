/**
 * Security utilities and configurations
 */

/**
 * Content Security Policy configuration
 * Add this to your server or hosting platform headers
 */
export const cspHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.github.com",
    "media-src 'self' https:",
    "object-src 'none'",
    "frame-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
}

/**
 * Security-related environment variable validation
 */
export const validateSecuritySettings = () => {
  const warnings: string[] = []

  // Check if running on HTTPS in production
  if (import.meta.env.PROD && import.meta.env.VITE_APP_URL?.startsWith('http:')) {
    warnings.push('⚠️  Production app should use HTTPS')
  }

  // Check for exposed API keys
  const envVars = Object.keys(import.meta.env)
  const apiKeyPatterns = ['API_KEY', 'SECRET', 'PASSWORD', 'TOKEN']

  envVars.forEach(envVar => {
    if (apiKeyPatterns.some(pattern => envVar.includes(pattern))) {
      warnings.push(`⚠️  Potential secret exposed: ${envVar}`)
    }
  })

  return warnings
}

/**
 * Sanitize HTML content (basic implementation)
 * For production, consider using DOMPurify
 */
export const sanitizeHTML = (html: string): string => {
  // Basic HTML sanitization
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}
