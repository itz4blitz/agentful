import { applyTheme, getTheme } from './themes'
import { type Theme } from './themes'

/**
 * Initialize theme on app startup
 * This ensures the selected theme is applied immediately when the app loads
 */
export function initializeTheme() {
  // Get the current mode (light/dark) from localStorage or system preference
  const storedMode = localStorage.getItem('vite-shadcn-theme')
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const mode = storedMode === 'dark' || (!storedMode && systemDark) ? 'dark' : 'light'

  // Apply the dark class to html if in dark mode
  const root = document.documentElement
  if (mode === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }

  // Get the selected theme ID from localStorage
  const selectedThemeId = localStorage.getItem('selected-theme') || 'default'

  // Apply the theme
  const theme = getTheme(selectedThemeId, mode)
  applyTheme(theme)

  // Listen for system theme changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const handleThemeChange = (e: MediaQueryListEvent | MediaQueryList) => {
    const newMode = e.matches ? 'dark' : 'light'

    // Update dark class on html element
    if (newMode === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    // Re-apply the current theme with the new mode
    const currentThemeId = localStorage.getItem('selected-theme') || 'default'
    const updatedTheme = getTheme(currentThemeId, newMode)
    applyTheme(updatedTheme)
  }

  // Use addEventListener with backwards compatibility
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleThemeChange)
  } else {
    // Fallback for older browsers
    mediaQuery.addListener(handleThemeChange)
  }

  // Return cleanup function
  return () => {
    if (mediaQuery.removeEventListener) {
      mediaQuery.removeEventListener('change', handleThemeChange)
    } else {
      mediaQuery.removeListener(handleThemeChange)
    }
  }
}

/**
 * Apply theme with proper HSL to CSS variable conversion
 * This is an enhanced version that handles the color conversion properly
 */
export function applyThemeWithColors(theme: Theme) {
  const root = document.documentElement

  // Convert HSL values to proper CSS HSL format
  const formatColor = (value: string | undefined): string | undefined => {
    if (!value) return undefined
    // Value is already in "H S% L%" format, just return it
    return value
  }

  // Apply all color variables
  Object.entries(theme.colors).forEach(([key, value]) => {
    if (value !== undefined) {
      const colorValue = formatColor(value)
      if (colorValue) {
        root.style.setProperty(`--${key}`, colorValue)
      }
    }
  })

  // Apply radius
  if (theme.radius) {
    root.style.setProperty('--radius', theme.radius)
  }

  // Apply fonts
  if (theme.fonts) {
    if (theme.fonts.sans) {
      root.style.setProperty('--font-sans', theme.fonts.sans)
    }
    if (theme.fonts.serif) {
      root.style.setProperty('--font-serif', theme.fonts.serif)
    }
    if (theme.fonts.mono) {
      root.style.setProperty('--font-mono', theme.fonts.mono)
    }
  }

  // Apply shadows
  if (theme.shadows) {
    if (theme.shadows.color) {
      root.style.setProperty('--shadow-color', theme.shadows.color)
    }
    if (theme.shadows.opacity) {
      root.style.setProperty('--shadow-opacity', theme.shadows.opacity)
    }
    if (theme.shadows.blur) {
      root.style.setProperty('--shadow-blur', theme.shadows.blur)
    }
    if (theme.shadows.spread) {
      root.style.setProperty('--shadow-spread', theme.shadows.spread)
    }
    if (theme.shadows['offset-x']) {
      root.style.setProperty('--shadow-offset-x', theme.shadows['offset-x'])
    }
    if (theme.shadows['offset-y']) {
      root.style.setProperty('--shadow-offset-y', theme.shadows['offset-y'])
    }
  }
}

/**
 * Get current theme mode (light/dark)
 */
export function getCurrentThemeMode(): 'light' | 'dark' {
  const storedMode = localStorage.getItem('vite-shadcn-theme')
  if (storedMode) {
    return storedMode === 'dark' ? 'dark' : 'light'
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Get current theme ID
 */
export function getCurrentThemeId(): string {
  return localStorage.getItem('selected-theme') || 'default'
}

/**
 * Set theme and persist to localStorage
 */
export function setTheme(themeId: string, mode?: 'light' | 'dark') {
  const currentMode = mode || getCurrentThemeMode()
  const theme = getTheme(themeId, currentMode)

  // Apply theme
  applyTheme(theme)

  // Save to localStorage
  localStorage.setItem('selected-theme', themeId)

  // Update dark class if mode is provided
  if (mode) {
    const root = document.documentElement
    if (mode === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }

  return theme
}
