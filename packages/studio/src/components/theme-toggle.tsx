import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { getTheme, applyTheme } from '@/lib/themes'
import { useEffect, useState, useCallback } from 'react'
import { isRunningInVSCode, saveTheme, onThemeChange } from '@/services/vscode'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Handle hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Listen for theme changes from other webviews (VS Code sync)
  useEffect(() => {
    if (!isRunningInVSCode()) return

    const unsubscribe = onThemeChange((newTheme) => {
      console.log('[ThemeToggle] Received theme change from VS Code:', newTheme)
      
      // Update the theme mode
      if (newTheme === 'light' || newTheme === 'dark' || newTheme === 'system') {
        setTheme(newTheme)
        
        // Re-apply the selected theme with the new mode
        const selectedThemeId = localStorage.getItem('selected-theme') || 'default'
        const updatedTheme = getTheme(selectedThemeId, newTheme as 'light' | 'dark')
        applyTheme(updatedTheme)
        
        // Update dark class on html element
        const root = document.documentElement
        const resolvedMode = newTheme === 'system' 
          ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
          : newTheme
        
        if (resolvedMode === 'dark') {
          root.classList.add('dark')
        } else {
          root.classList.remove('dark')
        }
      }
    })

    return unsubscribe
  }, [setTheme])

  const handleToggle = useCallback(() => {
    // Determine current and new theme
    const currentTheme = resolvedTheme || theme || 'light'
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark'

    // Update the theme mode
    setTheme(newTheme)

    // Re-apply the selected theme with the new mode
    const selectedThemeId = localStorage.getItem('selected-theme') || 'default'
    const updatedTheme = getTheme(selectedThemeId, newTheme as 'light' | 'dark')

    // Apply theme with transition
    applyTheme(updatedTheme)

    // Update dark class on html element
    const root = document.documentElement
    if (newTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    // Save to VS Code state for sync across webviews
    if (isRunningInVSCode()) {
      saveTheme(newTheme as 'light' | 'dark')
    }
  }, [resolvedTheme, theme, setTheme])

  // Keyboard shortcut handler (Ctrl/Cmd + Shift + T)
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    // Check for Ctrl/Cmd + Shift + T
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'T') {
      event.preventDefault()
      handleToggle()
    }
  }, [handleToggle])

  // Add keyboard shortcut listener
  useEffect(() => {
    if (mounted) {
      document.addEventListener('keydown', handleKeyPress)
      return () => document.removeEventListener('keydown', handleKeyPress)
    }
  }, [mounted, handleKeyPress])

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  const currentTheme = resolvedTheme || theme || 'light'
  const isDark = currentTheme === 'dark'

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Toggle theme (Ctrl/Cmd + Shift + T)`}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
