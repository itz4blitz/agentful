import { applyTheme, getTheme } from './themes'
import { type Theme } from './themes'
import { isRunningInVSCode, getSavedTheme, getSavedThemeColor, saveTheme, saveThemeColor, onThemeChange } from '@/services/vscode'

// Default theme settings - both webviews use these
const DEFAULT_THEME_ID = 'default'
const DEFAULT_MODE = 'system'
const THEME_VERSION = '1' // Bump this to force reset on updates

/**
 * Initialize theme on app startup
 */
export function initializeTheme() {
  const inVSCode = isRunningInVSCode()
  
  // Check if we need to reset (version mismatch or fresh install)
  const savedVersion = localStorage.getItem('agentful-theme-version')
  const needsReset = savedVersion !== THEME_VERSION
  
  if (needsReset) {
    console.log('[ThemeInit] Resetting to defaults (version mismatch or fresh install)')
    localStorage.setItem('agentful-theme-version', THEME_VERSION)
    localStorage.setItem('vite-shadcn-theme', DEFAULT_MODE)
    localStorage.setItem('selected-theme', DEFAULT_THEME_ID)
    
    if (inVSCode) {
      saveTheme(DEFAULT_MODE)
      saveThemeColor(DEFAULT_THEME_ID)
    }
  }
  
  // Get state - prefer VS Code state for sync
  let storedMode = localStorage.getItem('vite-shadcn-theme') || DEFAULT_MODE
  let storedThemeId = localStorage.getItem('selected-theme') || DEFAULT_THEME_ID
  
  if (inVSCode) {
    const vscodeTheme = getSavedTheme()
    const vscodeThemeColor = getSavedThemeColor()
    
    // If VS Code has state, use it (ensures sync between webviews)
    if (vscodeTheme) {
      storedMode = vscodeTheme
      localStorage.setItem('vite-shadcn-theme', vscodeTheme)
    }
    if (vscodeThemeColor) {
      storedThemeId = vscodeThemeColor
      localStorage.setItem('selected-theme', vscodeThemeColor)
    }
  }
  
  // Resolve mode
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const mode = storedMode === 'dark' || (storedMode === 'system' && systemDark) ? 'dark' : 'light'

  // Apply
  const root = document.documentElement
  if (mode === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }

  const theme = getTheme(storedThemeId, mode)
  applyTheme(theme)
  
  console.log('[ThemeInit] Initialized:', storedThemeId, mode)

  // In VS Code, setup sync
  if (inVSCode) {
    // Broadcast after a short delay to ensure other webview is ready
    setTimeout(() => {
      console.log('[ThemeInit] Broadcasting theme:', storedThemeId, storedMode)
      saveTheme(storedMode as 'light' | 'dark' | 'system')
      saveThemeColor(storedThemeId)
    }, 200)
    
    // Listen for changes from other webviews
    onThemeChange((message) => {
      console.log('[ThemeInit] Received:', message)
      
      if (typeof message === 'object') {
        const { theme, color, themeType } = message
        
        if (themeType === 'mode' && theme) {
          const resolvedMode = theme === 'system'
            ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
            : theme
          
          if (resolvedMode === 'dark') {
            root.classList.add('dark')
          } else {
            root.classList.remove('dark')
          }
          
          const currentThemeId = localStorage.getItem('selected-theme') || DEFAULT_THEME_ID
          applyTheme(getTheme(currentThemeId, resolvedMode))
          localStorage.setItem('vite-shadcn-theme', theme)
        }
        
        if (themeType === 'color' && color) {
          const currentMode = localStorage.getItem('vite-shadcn-theme') 
          const resolvedMode = currentMode === 'system'
            ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
            : (currentMode === 'dark' ? 'dark' : 'light')
          applyTheme(getTheme(color, resolvedMode))
          localStorage.setItem('selected-theme', color)
        }
      }
    })
  }

  // System theme change listener
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
    const setting = localStorage.getItem('vite-shadcn-theme')
    if (setting && setting !== 'system') return
    
    const newMode = e.matches ? 'dark' : 'light'
    if (newMode === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    const currentThemeId = localStorage.getItem('selected-theme') || DEFAULT_THEME_ID
    applyTheme(getTheme(currentThemeId, newMode))
  }

  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleChange)
  } else {
    mediaQuery.addListener(handleChange)
  }

  return () => {
    if (mediaQuery.removeEventListener) {
      mediaQuery.removeEventListener('change', handleChange)
    } else {
      mediaQuery.removeListener(handleChange)
    }
  }
}

export function applyThemeWithColors(theme: Theme) {
  const root = document.documentElement
  Object.entries(theme.colors).forEach(([key, value]) => {
    if (value !== undefined) root.style.setProperty(`--${key}`, value)
  })
  if (theme.radius) root.style.setProperty('--radius', theme.radius)
}

export function getCurrentThemeMode(): 'light' | 'dark' {
  if (isRunningInVSCode()) {
    const vscodeTheme = getSavedTheme()
    if (vscodeTheme && vscodeTheme !== 'system') return vscodeTheme
  }
  const stored = localStorage.getItem('vite-shadcn-theme')
  if (stored && stored !== 'system') return stored === 'dark' ? 'dark' : 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function getCurrentThemeId(): string {
  if (isRunningInVSCode()) {
    const vscodeColor = getSavedThemeColor()
    if (vscodeColor) return vscodeColor
  }
  return localStorage.getItem('selected-theme') || DEFAULT_THEME_ID
}

export function setTheme(themeId: string, mode?: 'light' | 'dark') {
  const currentMode = mode || getCurrentThemeMode()
  applyTheme(getTheme(themeId, currentMode))
  localStorage.setItem('selected-theme', themeId)

  if (mode) {
    const root = document.documentElement
    if (mode === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    if (isRunningInVSCode()) saveTheme(mode)
  }
  
  if (isRunningInVSCode()) saveThemeColor(themeId)
}
