/**
 * Iframe Theme Bridge
 *
 * Synchronizes theme from parent window to iframe (canvas editor)
 * This ensures the canvas editor respects the parent's theme settings
 */

import type { Theme } from './themes'

/**
 * Message type for theme synchronization
 */
interface ThemeSyncMessage {
  type: 'THEME_SYNC'
  theme: Theme
  mode: 'light' | 'dark'
  themeId: string
}

/**
 * Apply theme to iframe document
 */
export function applyThemeToIframe(iframe: HTMLIFrameElement, theme: Theme, mode: 'light' | 'dark'): void {
  try {
    const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document
    if (!iframeDocument) {
      console.warn('[IframeThemeBridge] Unable to access iframe document')
      return
    }

    const iframeRoot = iframeDocument.documentElement

    // Add transition class for smooth theme changes
    iframeRoot.classList.add('theme-transitioning')

    // Apply dark mode class
    if (mode === 'dark') {
      iframeRoot.classList.add('dark')
    } else {
      iframeRoot.classList.remove('dark')
    }

    // Apply all color CSS variables
    Object.entries(theme.colors).forEach(([key, value]) => {
      if (value !== undefined) {
        iframeRoot.style.setProperty(`--${key}`, value)
      }
    })

    // Apply radius
    if (theme.radius) {
      iframeRoot.style.setProperty('--radius', theme.radius)
    }

    // Apply fonts
    if (theme.fonts) {
      if (theme.fonts.sans) {
        iframeRoot.style.setProperty('--font-sans', theme.fonts.sans)
      }
      if (theme.fonts.serif) {
        iframeRoot.style.setProperty('--font-serif', theme.fonts.serif)
      }
      if (theme.fonts.mono) {
        iframeRoot.style.setProperty('--font-mono', theme.fonts.mono)
      }
    }

    // Apply shadows
    if (theme.shadows) {
      if (theme.shadows.color) {
        iframeRoot.style.setProperty('--shadow-color', theme.shadows.color)
      }
      if (theme.shadows.opacity) {
        iframeRoot.style.setProperty('--shadow-opacity', theme.shadows.opacity)
      }
      if (theme.shadows.blur) {
        iframeRoot.style.setProperty('--shadow-blur', theme.shadows.blur)
      }
      if (theme.shadows.spread) {
        iframeRoot.style.setProperty('--shadow-spread', theme.shadows.spread)
      }
      if (theme.shadows['offset-x']) {
        iframeRoot.style.setProperty('--shadow-offset-x', theme.shadows['offset-x'])
      }
      if (theme.shadows['offset-y']) {
        iframeRoot.style.setProperty('--shadow-offset-y', theme.shadows['offset-y'])
      }
    }

    // Remove transition class after animation completes
    setTimeout(() => {
      iframeRoot.classList.remove('theme-transitioning')
    }, 300)
  } catch (error) {
    console.error('[IframeThemeBridge] Error applying theme to iframe:', error)
  }
}

/**
 * Send theme sync message to iframe
 */
export function sendThemeToIframe(
  iframe: HTMLIFrameElement,
  theme: Theme,
  mode: 'light' | 'dark',
  themeId: string
): void {
  try {
    const message: ThemeSyncMessage = {
      type: 'THEME_SYNC',
      theme,
      mode,
      themeId,
    }

    iframe.contentWindow?.postMessage(message, '*')
  } catch (error) {
    console.error('[IframeThemeBridge] Error sending theme to iframe:', error)
  }
}

/**
 * Setup theme listener in iframe
 * Call this in the iframe's JavaScript to listen for theme updates
 */
export function setupIframeThemeListener(callback: (theme: Theme, mode: 'light' | 'dark') => void): () => void {
  const handleMessage = (event: MessageEvent) => {
    if (event.data?.type === 'THEME_SYNC') {
      const message = event.data as ThemeSyncMessage
      callback(message.theme, message.mode)
    }
  }

  window.addEventListener('message', handleMessage)

  // Return cleanup function
  return () => {
    window.removeEventListener('message', handleMessage)
  }
}

/**
 * Sync theme from parent window to iframe
 * Call this in the parent window when theme changes
 */
export function syncThemeToIframes(theme: Theme, mode: 'light' | 'dark', themeId: string): void {
  const iframes = document.querySelectorAll('iframe')

  iframes.forEach((iframe) => {
    if (iframe instanceof HTMLIFrameElement) {
      // Try both direct application and postMessage
      applyThemeToIframe(iframe, theme, mode)
      sendThemeToIframe(iframe, theme, mode, themeId)
    }
  })
}

/**
 * Get current theme from parent window
 * Call this from iframe to request current theme
 */
export function requestThemeFromParent(): void {
  try {
    window.parent.postMessage({ type: 'THEME_REQUEST' }, '*')
  } catch (error) {
    console.error('[IframeThemeBridge] Error requesting theme from parent:', error)
  }
}

/**
 * Setup theme request listener in parent window
 * Call this in parent window to respond to iframe theme requests
 */
export function setupThemeRequestHandler(
  getTheme: () => { theme: Theme; mode: 'light' | 'dark'; themeId: string }
): () => void {
  const handleMessage = (event: MessageEvent) => {
    if (event.data?.type === 'THEME_REQUEST') {
      const { theme, mode, themeId } = getTheme()

      // Find the source iframe and send theme
      const iframes = document.querySelectorAll('iframe')
      iframes.forEach((iframe) => {
        if (iframe instanceof HTMLIFrameElement && iframe.contentWindow === event.source) {
          sendThemeToIframe(iframe, theme, mode, themeId)
          applyThemeToIframe(iframe, theme, mode)
        }
      })
    }
  }

  window.addEventListener('message', handleMessage)

  // Return cleanup function
  return () => {
    window.removeEventListener('message', handleMessage)
  }
}

/**
 * Initialize automatic theme synchronization
 * Call this in parent window to keep all iframes in sync
 */
export function initializeIframeThemeSync(
  getTheme: () => { theme: Theme; mode: 'light' | 'dark'; themeId: string }
): () => void {
  // Setup request handler
  const cleanupHandler = setupThemeRequestHandler(getTheme)

  // Sync theme to all iframes immediately
  const { theme, mode, themeId } = getTheme()
  syncThemeToIframes(theme, mode, themeId)

  // Return combined cleanup function
  return () => {
    cleanupHandler()
  }
}
