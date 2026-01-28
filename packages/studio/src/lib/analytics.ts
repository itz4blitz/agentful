/**
 * Analytics utilities
 * Supports Google Analytics, Plausible, PostHog, or custom analytics
 */

type AnalyticsEvent = {
  category: string
  action: string
  label?: string
  value?: number
}

/**
 * Track page view
 */
export const trackPageView = (path?: string) => {
  const pagePath = path || window.location.pathname

  // Google Analytics
  if (typeof window !== 'undefined' && (window as any).gtag) {
    ;(window as any).gtag('event', 'page_view', {
      page_path: pagePath,
    })
  }

  // Plausible Analytics
  if (typeof window !== 'undefined' && (window as any).plausible) {
    ;(window as any).plausible('pageview', { u: pagePath })
  }

  // PostHog
  if (typeof window !== 'undefined' && (window as any).posthog) {
    ;(window as any).posthog.capture('$pageview', {
      $current_url: pagePath,
    })
  }

  // Development logging
  if (import.meta.env.DEV) {
    console.log('[Analytics] Page View:', pagePath)
  }
}

/**
 * Track custom event
 */
export const trackEvent = ({ category, action, label, value }: AnalyticsEvent) => {
  // Google Analytics
  if (typeof window !== 'undefined' && (window as any).gtag) {
    ;(window as any).gtag('event', action, {
      event_category: category,
      event_label: label,
      value,
    })
  }

  // Plausible Analytics
  if (typeof window !== 'undefined' && (window as any).plausible) {
    ;(window as any).plausible(action, { props: { category, label, value } })
  }

  // PostHog
  if (typeof window !== 'undefined' && (window as any).posthog) {
    ;(window as any).posthog.capture(action, {
      category,
      label,
      value,
    })
  }

  // Development logging
  if (import.meta.env.DEV) {
    console.log('[Analytics] Event:', { category, action, label, value })
  }
}

/**
 * Check if analytics is enabled
 */
export const isAnalyticsEnabled = (): boolean => {
  return import.meta.env.VITE_ENABLE_ANALYTICS === 'true'
}

/**
 * Initialize analytics
 */
export const initAnalytics = () => {
  if (!isAnalyticsEnabled()) {
    if (import.meta.env.DEV) {
      console.log('[Analytics] Disabled')
    }
    return
  }

  // Initialize Google Analytics
  const gaId = import.meta.env.VITE_GA_ID
  if (gaId) {
    // Google Analytics will be initialized via script tag
    if (import.meta.env.DEV) {
      console.log('[Analytics] Google Analytics initialized:', gaId)
    }
  }

  // Initialize Plausible
  if (import.meta.env.VITE_PLAUSIBLE_DOMAIN) {
    if (import.meta.env.DEV) {
      console.log('[Analytics] Plausible initialized')
    }
  }

  // Initialize PostHog
  const postHogKey = import.meta.env.VITE_POSTHOG_KEY
  if (postHogKey) {
    if (typeof window !== 'undefined' && (window as any).posthog) {
      ;(window as any).posthog.init(postHogKey, {
        api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com',
      })
    }
    if (import.meta.env.DEV) {
      console.log('[Analytics] PostHog initialized')
    }
  }

  // Track initial page view
  trackPageView()
}
