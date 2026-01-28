
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from '@/components/theme-provider'
import { ErrorBoundary } from '@/components/error-boundary'
import { initAnalytics } from '@/lib/analytics'
import { initPerformanceObserver } from '@/lib/performance'
import { validateSecuritySettings } from '@/lib/security'
import { initializeTheme } from '@/lib/theme-init'

// Initialize theme FIRST before rendering
initializeTheme()

// Initialize analytics
initAnalytics()

// Initialize performance monitoring
if (import.meta.env.PROD) {
  initPerformanceObserver()
}

// Validate security settings in development
if (import.meta.env.DEV) {
  const warnings = validateSecuritySettings()
  if (warnings.length > 0) {
    console.group('[Security Warnings]')
    warnings.forEach(warning => console.warn(warning))
    console.groupEnd()
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system" storageKey="vite-shadcn-theme">
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
)

