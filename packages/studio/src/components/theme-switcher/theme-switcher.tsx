import { useState, useMemo, useEffect } from 'react'
import { Search, Palette, Info } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getAllThemes, applyTheme, type Theme } from '@/lib/themes'
import { ThemePreviewCard } from './theme-preview-card'
import { useTheme } from 'next-themes'
import { isRunningInVSCode, saveThemeColor, onThemeChange } from '@/services/vscode'

export function ThemeSwitcher() {
  const { theme: mode, resolvedTheme } = useTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [currentThemeId, setCurrentThemeId] = useState<string>('default')
  const [mounted, setMounted] = useState(false)

  // Get the actual current mode (resolvedTheme is better than theme for system preference)
  const currentMode = (resolvedTheme || mode || 'light') === 'dark' ? 'dark' : 'light'

  const themes = useMemo(() => {
    if (!mounted) return []
    return getAllThemes(currentMode)
  }, [currentMode, mounted])

  const filteredThemes = useMemo(() => {
    if (!searchQuery) return themes
    return themes.filter(
      (theme) =>
        theme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        theme.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [themes, searchQuery])

  // Load saved theme on mount
  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem('selected-theme') || 'default'
    setCurrentThemeId(savedTheme)
  }, [])

  // Listen for theme changes from VS Code (from other webviews)
  useEffect(() => {
    console.log('[ThemeSwitcher] Setting up listeners')
    
    // Direct window message listener
    const handleWindowMessage = (event: MessageEvent) => {
      const message = event.data
      console.log('[ThemeSwitcher] Window message received:', message)
      
      if (message && message.command === 'themeChanged' && message.color) {
        console.log('[ThemeSwitcher] Direct handler - applying theme:', message.color)
        
        const isDark = document.documentElement.classList.contains('dark')
        const currentMode = isDark ? 'dark' : 'light'
        
        const newTheme = getAllThemes(currentMode).find(t => t.id === message.color)
        if (newTheme) {
          applyTheme(newTheme)
          setCurrentThemeId(message.color)
          localStorage.setItem('selected-theme', message.color)
          console.log('[ThemeSwitcher] Theme applied from direct handler!')
        }
      }
    }
    
    window.addEventListener('message', handleWindowMessage)
    
    // Also use the VS Code API service
    const unsubscribe = onThemeChange((message: any) => {
      console.log('[ThemeSwitcher] onThemeChange callback:', message)
    })

    return () => {
      window.removeEventListener('message', handleWindowMessage)
      unsubscribe()
    }
  }, [])

  const handleThemeSelect = (theme: Theme) => {
    console.log('[ThemeSwitcher] Selecting theme:', theme.id)
    
    // Apply theme with smooth transition
    applyTheme(theme)

    // Update state
    setCurrentThemeId(theme.id)

    // Store selected theme ID in localStorage
    localStorage.setItem('selected-theme', theme.id)

    // Save to VS Code for sync across webviews
    if (isRunningInVSCode()) {
      console.log('[ThemeSwitcher] Broadcasting to VS Code:', theme.id)
      saveThemeColor(theme.id)
    }

    // Close popover
    setOpen(false)

    // Announce theme change for accessibility
    const announcement = `Theme changed to ${theme.name}`
    const announcementElement = document.createElement('div')
    announcementElement.setAttribute('role', 'status')
    announcementElement.setAttribute('aria-live', 'polite')
    announcementElement.className = 'sr-only'
    announcementElement.textContent = announcement
    document.body.appendChild(announcementElement)
    setTimeout(() => document.body.removeChild(announcementElement), 1000)
  }

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <Button variant="outline" size="sm" className="gap-2" disabled>
        <Palette className="h-4 w-4" />
        <span>Theme</span>
      </Button>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" aria-label="Open theme switcher">
          <Palette className="h-4 w-4" />
          <span>Theme</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0 bg-popover text-popover-foreground" align="end">
        <div className="p-3 border-b">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm">Select Theme</h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Info className="h-3 w-3" />
              <span>{currentMode === 'dark' ? 'Dark' : 'Light'} Mode</span>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search themes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              aria-label="Search themes"
            />
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          <div className="p-3 space-y-2">
            {filteredThemes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm mb-2">No themes found</p>
                <p className="text-muted-foreground text-xs">Try a different search term</p>
              </div>
            ) : (
              filteredThemes.map((theme) => (
                <ThemePreviewCard
                  key={theme.id}
                  theme={theme}
                  isActive={currentThemeId === theme.id}
                  onClick={() => handleThemeSelect(theme)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
