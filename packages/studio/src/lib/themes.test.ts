import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getTheme, applyTheme, getAllThemes, getThemeIds, hslToCss, getThemeColorCss } from './themes'

// Mock document.documentElement
const mockStyle = {
  setProperty: vi.fn(),
  removeProperty: vi.fn(),
}

Object.defineProperty(document.documentElement, 'style', {
  value: mockStyle,
  writable: true,
})

// Mock document.documentElement classList
const mockClassList = {
  add: vi.fn(),
  remove: vi.fn(),
  contains: vi.fn(),
}

Object.defineProperty(document.documentElement, 'classList', {
  value: mockClassList,
  writable: true,
})

describe('Theme Library', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getTheme', () => {
    it('should return default theme when id is not found', () => {
      const theme = getTheme('nonexistent')
      expect(theme.id).toBe('default')
    })

    it('should return correct theme in light mode', () => {
      const theme = getTheme('blue', 'light')
      expect(theme.id).toBe('blue')
      expect(theme.mode).toBe('light')
    })

    it('should return correct theme in dark mode', () => {
      const theme = getTheme('blue', 'dark')
      expect(theme.id).toBe('blue')
      expect(theme.mode).toBe('dark')
    })

    it('should return all expected theme properties', () => {
      const theme = getTheme('default')

      expect(theme).toHaveProperty('id')
      expect(theme).toHaveProperty('name')
      expect(theme).toHaveProperty('description')
      expect(theme).toHaveProperty('mode')
      expect(theme).toHaveProperty('colors')
      expect(theme.colors).toHaveProperty('background')
      expect(theme.colors).toHaveProperty('foreground')
      expect(theme.colors).toHaveProperty('primary')
      expect(theme.colors).toHaveProperty('border')
    })

    it('should have sidebar colors in default theme', () => {
      const theme = getTheme('default')

      expect(theme.colors).toHaveProperty('sidebar-background')
      expect(theme.colors).toHaveProperty('sidebar-foreground')
      expect(theme.colors).toHaveProperty('sidebar-primary')
    })
  })

  describe('getAllThemes', () => {
    it('should return array of themes in light mode', () => {
      const themes = getAllThemes('light')
      expect(Array.isArray(themes)).toBe(true)
      expect(themes.length).toBeGreaterThan(0)
    })

    it('should return array of themes in dark mode', () => {
      const themes = getAllThemes('dark')
      expect(Array.isArray(themes)).toBe(true)
      expect(themes.length).toBeGreaterThan(0)
    })

    it('should have same number of themes for both modes', () => {
      const lightThemes = getAllThemes('light')
      const darkThemes = getAllThemes('dark')

      expect(lightThemes.length).toBe(darkThemes.length)
    })

    it('should return theme objects with required properties', () => {
      const themes = getAllThemes('light')

      themes.forEach((theme) => {
        expect(theme).toHaveProperty('id')
        expect(theme).toHaveProperty('name')
        expect(theme).toHaveProperty('description')
        expect(theme).toHaveProperty('mode')
        expect(theme).toHaveProperty('colors')
      })
    })
  })

  describe('getThemeIds', () => {
    it('should return array of theme IDs', () => {
      const ids = getThemeIds('light')
      expect(Array.isArray(ids)).toBe(true)
      expect(ids.length).toBeGreaterThan(0)
      expect(ids).toContain('default')
      expect(ids).toContain('blue')
    })

    it('should return unique IDs', () => {
      const ids = getThemeIds('light')
      const uniqueIds = new Set(ids)
      expect(ids.length).toBe(uniqueIds.size)
    })
  })

  describe('applyTheme', () => {
    it('should apply theme colors to CSS variables', () => {
      const theme = getTheme('default')
      applyTheme(theme)

      expect(mockStyle.setProperty).toHaveBeenCalledWith('--background', theme.colors.background)
      expect(mockStyle.setProperty).toHaveBeenCalledWith('--foreground', theme.colors.foreground)
      expect(mockStyle.setProperty).toHaveBeenCalledWith('--primary', theme.colors.primary)
    })

    it('should apply radius CSS variable', () => {
      const theme = getTheme('default')
      applyTheme(theme)

      if (theme.radius) {
        expect(mockStyle.setProperty).toHaveBeenCalledWith('--radius', theme.radius)
      }
    })

    it('should apply font CSS variables if present', () => {
      const theme = getTheme('spotify')
      applyTheme(theme)

      if (theme.fonts?.sans) {
        expect(mockStyle.setProperty).toHaveBeenCalledWith('--font-sans', theme.fonts.sans)
      }
    })

    it('should apply shadow CSS variables if present', () => {
      const theme = getTheme('cyberpunk')
      applyTheme(theme)

      if (theme.shadows?.color) {
        expect(mockStyle.setProperty).toHaveBeenCalledWith('--shadow-color', theme.shadows.color)
      }
    })

    it('should add theme-transitioning class', () => {
      const theme = getTheme('default')
      applyTheme(theme)

      expect(mockClassList.add).toHaveBeenCalledWith('theme-transitioning')
    })

    it('should remove theme-transitioning class after timeout', async () => {
      vi.useFakeTimers()

      const theme = getTheme('default')
      applyTheme(theme)

      // Fast-forward time
      vi.advanceTimersByTime(300)

      expect(mockClassList.remove).toHaveBeenCalledWith('theme-transitioning')

      vi.useRealTimers()
    })
  })

  describe('hslToCss', () => {
    it('should convert HSL string to CSS format', () => {
      const hslString = '221.2 83.2% 53.3%'
      const cssString = hslToCss(hslString)

      expect(cssString).toBe('hsl(221.2, 83.2%, 53.3%)')
    })

    it('should handle whole numbers', () => {
      const hslString = '0 0% 100%'
      const cssString = hslToCss(hslString)

      expect(cssString).toBe('hsl(0, 0%, 100%)')
    })

    it('should handle decimal values', () => {
      const hslString = '123.456 67.89% 45.123%'
      const cssString = hslToCss(hslString)

      expect(cssString).toBe('hsl(123.456, 67.89%, 45.123%)')
    })
  })

  describe('getThemeColorCss', () => {
    it('should return CSS color string for valid color key', () => {
      const theme = getTheme('default')
      const cssColor = getThemeColorCss(theme, 'background')

      expect(cssColor).toBe('hsl(0, 0%, 100%)')
    })

    it('should return null for missing color key', () => {
      const theme = getTheme('default')
      const cssColor = getThemeColorCss(theme, 'nonexistent' as any)

      expect(cssColor).toBeNull()
    })

    it('should handle all standard color keys', () => {
      const theme = getTheme('default')

      const colorKeys: Array<keyof typeof theme.colors> = [
        'background',
        'foreground',
        'primary',
        'secondary',
        'accent',
        'muted',
        'destructive',
        'border',
        'input',
        'ring',
      ]

      colorKeys.forEach((key) => {
        const cssColor = getThemeColorCss(theme, key)
        expect(cssColor).toBeTruthy()
        expect(cssColor).toMatch(/^hsl\(/)
      })
    })
  })

  describe('Theme completeness', () => {
    it('should have all required color properties', () => {
      const theme = getTheme('default')

      const requiredColors = [
        'background',
        'foreground',
        'primary',
        'primary-foreground',
        'secondary',
        'secondary-foreground',
        'accent',
        'accent-foreground',
        'muted',
        'muted-foreground',
        'destructive',
        'destructive-foreground',
        'border',
        'input',
        'ring',
      ]

      requiredColors.forEach((color) => {
        expect(theme.colors).toHaveProperty(color)
      })
    })

    it('should have valid HSL color format', () => {
      const theme = getTheme('default')

      Object.values(theme.colors).forEach((color) => {
        if (color) {
          // HSL format: "H S% L%"
          expect(color).toMatch(/^\d+(\.\d+)?\s+\d+%\s+\d+%$/)
        }
      })
    })
  })

  describe('Special themes', () => {
    it('should have spotify theme with custom fonts', () => {
      const theme = getTheme('spotify')

      expect(theme.fonts).toBeTruthy()
      expect(theme.fonts?.sans).toContain('Lato')
    })

    it('should have cyberpunk theme with custom shadows', () => {
      const theme = getTheme('cyberpunk')

      expect(theme.shadows).toBeTruthy()
      expect(theme.shadows?.blur).toBe('15px')
    })

    it('should have vercel theme with zero radius', () => {
      const theme = getTheme('vercel')
      expect(theme.radius).toBe('0rem')
    })

    it('should have catppuccin theme with rounded corners', () => {
      const theme = getTheme('catppuccin')
      expect(theme.radius).toBe('0.75rem')
    })
  })

  describe('Dark mode themes', () => {
    it('should have dark mode version of default theme', () => {
      const theme = getTheme('default', 'dark')
      expect(theme.mode).toBe('dark')
      expect(theme.colors.background).toBe('240 10% 3.9%')
    })

    it('should have dark mode version of blue theme', () => {
      const theme = getTheme('blue', 'dark')
      expect(theme.mode).toBe('dark')
    })

    it('should have dark mode colors darker than light mode', () => {
      const lightTheme = getTheme('default', 'light')
      const darkTheme = getTheme('default', 'dark')

      // Extract lightness values (third number in HSL)
      const lightBgLightness = parseFloat(lightTheme.colors.background.split(' ')[2])
      const darkBgLightness = parseFloat(darkTheme.colors.background.split(' ')[2])

      expect(darkBgLightness).toBeLessThan(lightBgLightness)
    })
  })
})
