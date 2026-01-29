import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  applyThemeToIframe,
  sendThemeToIframe,
  setupIframeThemeListener,
  syncThemeToIframes,
  requestThemeFromParent,
  setupThemeRequestHandler,
  initializeIframeThemeSync,
} from './iframe-theme-bridge'
import type { Theme } from './themes'

// Mock iframe
const mockIframe = {
  contentDocument: {
    documentElement: {
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
      },
      style: {
        setProperty: vi.fn(),
      },
    },
  },
  contentWindow: {
    postMessage: vi.fn(),
    document: {
      documentElement: {
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
        },
        style: {
          setProperty: vi.fn(),
        },
      },
    },
  },
}

// Mock window.parent
const mockParentPostMessage = vi.fn()
Object.defineProperty(window, 'parent', {
  value: {
    postMessage: mockParentPostMessage,
  },
  writable: true,
})

// Mock document.querySelectorAll
const mockQuerySelectorAll = vi.fn()
Object.defineProperty(document, 'querySelectorAll', {
  value: mockQuerySelectorAll,
  writable: true,
})

describe('Iframe Theme Bridge', () => {
  const mockTheme: Theme = {
    id: 'default',
    name: 'Default',
    description: 'Test theme',
    mode: 'light',
    colors: {
      background: '0 0% 100%',
      foreground: '0 0% 3.9%',
      primary: '0 0% 9%',
      'primary-foreground': '0 0% 98%',
      secondary: '0 0% 96.1%',
      'secondary-foreground': '0 0% 9%',
      accent: '0 0% 96.1%',
      'accent-foreground': '0 0% 9%',
      muted: '0 0% 96.1%',
      'muted-foreground': '0 0% 45.1%',
      destructive: '0 84.2% 60.2%',
      'destructive-foreground': '0 0% 98%',
      border: '0 0% 89.8%',
      input: '0 0% 89.8%',
      ring: '0 0% 3.9%',
    },
    radius: '0.5rem',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('applyThemeToIframe', () => {
    it('should apply theme colors to iframe', () => {
      applyThemeToIframe(mockIframe as any, mockTheme, 'light')

      expect(mockIframe.contentDocument.documentElement.style.setProperty).toHaveBeenCalledWith(
        '--background',
        mockTheme.colors.background
      )
    })

    it('should add dark class to iframe in dark mode', () => {
      applyThemeToIframe(mockIframe as any, mockTheme, 'dark')

      expect(mockIframe.contentDocument.documentElement.classList.add).toHaveBeenCalledWith('dark')
    })

    it('should remove dark class in light mode', () => {
      applyThemeToIframe(mockIframe as any, mockTheme, 'light')

      expect(mockIframe.contentDocument.documentElement.classList.remove).toHaveBeenCalledWith('dark')
    })

    it('should apply radius to iframe', () => {
      applyThemeToIframe(mockIframe as any, mockTheme, 'light')

      expect(mockIframe.contentDocument.documentElement.style.setProperty).toHaveBeenCalledWith(
        '--radius',
        mockTheme.radius
      )
    })

    it('should add transition class', () => {
      applyThemeToIframe(mockIframe as any, mockTheme, 'light')

      expect(mockIframe.contentDocument.documentElement.classList.add).toHaveBeenCalledWith(
        'theme-transitioning'
      )
    })

    it('should remove transition class after timeout', () => {
      applyThemeToIframe(mockIframe as any, mockTheme, 'light')

      vi.advanceTimersByTime(300)

      expect(mockIframe.contentDocument.documentElement.classList.remove).toHaveBeenCalledWith(
        'theme-transitioning'
      )
    })

    it('should handle missing iframe document gracefully', () => {
      const invalidIframe = {}

      expect(() => {
        applyThemeToIframe(invalidIframe as any, mockTheme, 'light')
      }).not.toThrow()
    })

    it('should apply fonts if present', () => {
      const themeWithFonts: Theme = {
        ...mockTheme,
        fonts: {
          sans: 'Inter, sans-serif',
          mono: 'Fira Code, monospace',
        },
      }

      applyThemeToIframe(mockIframe as any, themeWithFonts, 'light')

      expect(mockIframe.contentDocument.documentElement.style.setProperty).toHaveBeenCalledWith(
        '--font-sans',
        themeWithFonts.fonts?.sans
      )
    })

    it('should apply shadows if present', () => {
      const themeWithShadows: Theme = {
        ...mockTheme,
        shadows: {
          color: '0 0% 0%',
          blur: '10px',
        },
      }

      applyThemeToIframe(mockIframe as any, themeWithShadows, 'light')

      expect(mockIframe.contentDocument.documentElement.style.setProperty).toHaveBeenCalledWith(
        '--shadow-color',
        themeWithShadows.shadows?.color
      )
    })
  })

  describe('sendThemeToIframe', () => {
    it('should send theme sync message via postMessage', () => {
      sendThemeToIframe(mockIframe as any, mockTheme, 'light', 'default')

      expect(mockIframe.contentWindow.postMessage).toHaveBeenCalledWith(
        {
          type: 'THEME_SYNC',
          theme: mockTheme,
          mode: 'light',
          themeId: 'default',
        },
        '*'
      )
    })

    it('should handle missing contentWindow gracefully', () => {
      const invalidIframe = {}

      expect(() => {
        sendThemeToIframe(invalidIframe as any, mockTheme, 'light', 'default')
      }).not.toThrow()
    })
  })

  describe('setupIframeThemeListener', () => {
    it('should call callback when receiving theme sync message', () => {
      const callback = vi.fn()
      const cleanup = setupIframeThemeListener(callback)

      const message = {
        type: 'THEME_SYNC',
        theme: mockTheme,
        mode: 'light' as const,
        themeId: 'default',
      }

      window.postMessage(message, '*')

      expect(callback).toHaveBeenCalledWith(mockTheme, 'light')

      cleanup()
    })

    it('should ignore non-theme messages', () => {
      const callback = vi.fn()
      const cleanup = setupIframeThemeListener(callback)

      window.postMessage({ type: 'OTHER_MESSAGE' }, '*')

      expect(callback).not.toHaveBeenCalled()

      cleanup()
    })

    it('should return cleanup function', () => {
      const callback = vi.fn()
      const cleanup = setupIframeThemeListener(callback)

      expect(typeof cleanup).toBe('function')

      cleanup()
    })

    it('should stop listening after cleanup', () => {
      const callback = vi.fn()
      const cleanup = setupIframeThemeListener(callback)

      cleanup()

      const message = {
        type: 'THEME_SYNC',
        theme: mockTheme,
        mode: 'light' as const,
        themeId: 'default',
      }

      window.postMessage(message, '*')

      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('syncThemeToIframes', () => {
    it('should apply theme to all iframes', () => {
      const iframes = [mockIframe, mockIframe]
      mockQuerySelectorAll.mockReturnValue(iframes as any)

      syncThemeToIframes(mockTheme, 'light', 'default')

      expect(mockIframe.contentDocument.documentElement.style.setProperty).toHaveBeenCalled()
    })

    it('should send theme via postMessage to all iframes', () => {
      const iframes = [mockIframe, mockIframe]
      mockQuerySelectorAll.mockReturnValue(iframes as any)

      syncThemeToIframes(mockTheme, 'light', 'default')

      expect(mockIframe.contentWindow.postMessage).toHaveBeenCalledTimes(2)
    })
  })

  describe('requestThemeFromParent', () => {
    it('should send theme request to parent', () => {
      requestThemeFromParent()

      expect(mockParentPostMessage).toHaveBeenCalledWith({ type: 'THEME_REQUEST' }, '*')
    })

    it('should handle errors gracefully', () => {
      Object.defineProperty(window, 'parent', {
        get: () => {
          throw new Error('Cross-origin error')
        },
      })

      expect(() => {
        requestThemeFromParent()
      }).not.toThrow()
    })
  })

  describe('setupThemeRequestHandler', () => {
    it('should respond to theme requests', () => {
      const getTheme = vi.fn().mockReturnValue({
        theme: mockTheme,
        mode: 'light' as const,
        themeId: 'default',
      })

      const cleanup = setupThemeRequestHandler(getTheme)

      const event = new MessageEvent('message', {
        data: { type: 'THEME_REQUEST' },
        source: mockIframe.contentWindow as any,
      })

      window.dispatchEvent(event)

      expect(mockIframe.contentWindow.postMessage).toHaveBeenCalled()

      cleanup()
    })

    it('should return cleanup function', () => {
      const getTheme = vi.fn()
      const cleanup = setupThemeRequestHandler(getTheme)

      expect(typeof cleanup).toBe('function')

      cleanup()
    })

    it('should ignore non-request messages', () => {
      const getTheme = vi.fn()
      const cleanup = setupThemeRequestHandler(getTheme)

      const event = new MessageEvent('message', {
        data: { type: 'OTHER_MESSAGE' },
      })

      window.dispatchEvent(event)

      expect(getTheme).not.toHaveBeenCalled()

      cleanup()
    })
  })

  describe('initializeIframeThemeSync', () => {
    it('should sync theme to all iframes on init', () => {
      const iframes = [mockIframe]
      mockQuerySelectorAll.mockReturnValue(iframes as any)

      const getTheme = vi.fn().mockReturnValue({
        theme: mockTheme,
        mode: 'light' as const,
        themeId: 'default',
      })

      initializeIframeThemeSync(getTheme)

      expect(mockIframe.contentDocument.documentElement.style.setProperty).toHaveBeenCalled()
    })

    it('should setup request handler', () => {
      mockQuerySelectorAll.mockReturnValue([])

      const getTheme = vi.fn().mockReturnValue({
        theme: mockTheme,
        mode: 'light' as const,
        themeId: 'default',
      })

      const cleanup = initializeIframeThemeSync(getTheme)

      // Send a request message
      const event = new MessageEvent('message', {
        data: { type: 'THEME_REQUEST' },
        source: mockIframe.contentWindow as any,
      })

      window.dispatchEvent(event)

      expect(getTheme).toHaveBeenCalled()

      cleanup()
    })

    it('should return cleanup function', () => {
      mockQuerySelectorAll.mockReturnValue([])

      const getTheme = vi.fn()
      const cleanup = initializeIframeThemeSync(getTheme)

      expect(typeof cleanup).toBe('function')
    })
  })
})
