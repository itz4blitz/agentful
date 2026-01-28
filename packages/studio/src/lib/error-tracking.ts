/**
 * Error tracking utilities
 * Integrates with Sentry or similar services
 */

interface ErrorContext {
  [key: string]: any
}

/**
 * Capture and report errors
 */
export const captureError = (error: Error | string, context?: ErrorContext) => {
  const errorObj = typeof error === 'string' ? new Error(error) : error

  // Log to console in development
  if (import.meta.env.DEV) {
    console.error('[Error Tracking]', errorObj, context)
  }

  // Send to error tracking service (uncomment when configured)
  // if (window.Sentry && isErrorReportingEnabled()) {
  //   window.Sentry.captureException(errorObj, {
  //     contexts: { custom: context },
  //   })
  // }

  // Fallback: send to your own error endpoint
  if (import.meta.env.PROD && isErrorReportingEnabled()) {
    sendToErrorEndpoint(errorObj, context)
  }
}

/**
 * Capture user feedback
 */
export const captureFeedback = (feedback: string, context?: ErrorContext) => {
  if (import.meta.env.DEV) {
    console.log('[User Feedback]', feedback, context)
  }

  // Send to feedback service
  if (import.meta.env.PROD) {
    sendToFeedbackEndpoint(feedback, context)
  }
}

/**
 * Add breadcrumbs for error context
 */
export const addBreadcrumb = (message: string, category: string = 'custom') => {
  if (import.meta.env.DEV) {
    console.log(`[Breadcrumb] ${category}:`, message)
  }

  // Send to error tracking service
  // if (window.Sentry) {
  //   window.Sentry.addBreadcrumb({
  //     message,
  //     category,
  //     level: 'info',
  //   })
  // }
}

/**
 * Check if error reporting is enabled
 */
const isErrorReportingEnabled = () => {
  return import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true'
}

/**
 * Send error to custom endpoint
 */
const sendToErrorEndpoint = async (error: Error, context?: ErrorContext) => {
  try {
    await fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      }),
    })
  } catch (e) {
    console.error('Failed to send error report:', e)
  }
}

/**
 * Send feedback to custom endpoint
 */
const sendToFeedbackEndpoint = async (feedback: string, context?: ErrorContext) => {
  try {
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        feedback,
        context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      }),
    })
  } catch (e) {
    console.error('Failed to send feedback:', e)
  }
}
