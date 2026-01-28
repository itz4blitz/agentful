/**
 * Performance monitoring utilities
 */

/**
 * Report Web Vitals to analytics service
 */
export const reportWebVitals = (metric: any) => {
  const { name, value, id } = metric

  // Send to analytics (implement with your analytics service)
  if (typeof window !== 'undefined' && (window as any).gtag) {
    ;(window as any).gtag('event', name, {
      event_category: 'Web Vitals',
      event_label: id,
      value: Math.round(name === 'CLS' ? value * 1000 : value),
      non_interaction: true,
    })
  }

  // Log in development
  if (import.meta.env.DEV) {
    console.log(`[Web Vitals] ${name}:`, value)
  }
}

/**
 * Measure component render time
 */
export const usePerformanceMeasure = (componentName: string) => {
  if (import.meta.env.DEV) {
    const start = performance.now()

    return () => {
      const end = performance.now()
      const duration = end - start

      if (duration > 16) { // Log if render takes more than one frame
        console.warn(`[Performance] ${componentName} render took ${duration.toFixed(2)}ms`)
      }
    }
  }

  return () => {}
}

/**
 * Performance observer for Long Tasks
 */
export const initPerformanceObserver = () => {
  if (typeof window === 'undefined') return

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.warn('[Long Task]', entry)
      }
    })

    observer.observe({ entryTypes: ['longtask'] })
  } catch (e) {
    // PerformanceObserver might not be available
  }
}
