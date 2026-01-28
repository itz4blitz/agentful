import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ThemeProvider } from 'next-themes'
import { ThemeToggle } from './theme-toggle'
import { applyTheme, getTheme } from '@/lib/themes'

// Mock the themes library
vi.mock('@/lib/themes', () => ({
  getTheme: vi.fn(),
  applyTheme: vi.fn(),
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock document.documentElement classList
const classListMock = {
  add: vi.fn(),
  remove: vi.fn(),
  contains: vi.fn(),
}
Object.defineProperty(document.documentElement, 'classList', {
  value: classListMock,
})

function renderWithThemeProvider(component: React.ReactElement) {
  return render(
    <ThemeProvider defaultTheme="system" storageKey="test-theme">
      {component}
    </ThemeProvider>
  )
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue('default')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render successfully', () => {
    renderWithThemeProvider(<ThemeToggle />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should show sun icon in light mode', async () => {
    renderWithThemeProvider(<ThemeToggle />)

    // Wait for component to mount
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeEnabled()
    })

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Switch to dark mode')
  })

  it('should show moon icon in dark mode', async () => {
    renderWithThemeProvider(<ThemeToggle />)

    // Wait for component to mount
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeEnabled()
    })

    // Mock dark mode
    const button = screen.getByRole('button')
    fireEvent.click(button)

    await waitFor(() => {
      expect(button).toHaveAttribute('aria-label', 'Switch to light mode')
    })
  })

  it('should toggle theme on click', async () => {
    const mockTheme = {
      id: 'default',
      name: 'Default',
      description: 'Test theme',
      mode: 'dark' as const,
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
    }

    vi.mocked(getTheme).mockReturnValue(mockTheme)

    renderWithThemeProvider(<ThemeToggle />)

    const button = screen.getByRole('button')

    // Click to toggle
    fireEvent.click(button)

    await waitFor(() => {
      expect(applyTheme).toHaveBeenCalledWith(mockTheme)
      expect(classListMock.add).toHaveBeenCalledWith('dark')
    })
  })

  it('should have proper accessibility attributes', async () => {
    renderWithThemeProvider(<ThemeToggle />)

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeEnabled()
    })

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label')
    expect(button).toHaveAttribute('title')
  })

  it('should show keyboard shortcut in title', async () => {
    renderWithThemeProvider(<ThemeToggle />)

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeEnabled()
    })

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('title', 'Toggle theme (Ctrl/Cmd + Shift + T)')
  })

  it('should handle keyboard shortcut Ctrl+Shift+T', async () => {
    const mockTheme = {
      id: 'default',
      name: 'Default',
      description: 'Test theme',
      mode: 'dark' as const,
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
    }

    vi.mocked(getTheme).mockReturnValue(mockTheme)

    renderWithThemeProvider(<ThemeToggle />)

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeEnabled()
    })

    // Simulate Ctrl+Shift+T keyboard event
    const keyboardEvent = new KeyboardEvent('keydown', {
      key: 'T',
      ctrlKey: true,
      shiftKey: true,
    })

    document.dispatchEvent(keyboardEvent)

    await waitFor(() => {
      expect(applyTheme).toHaveBeenCalled()
    })
  })

  it('should handle keyboard shortcut Cmd+Shift+T (Mac)', async () => {
    const mockTheme = {
      id: 'default',
      name: 'Default',
      description: 'Test theme',
      mode: 'dark' as const,
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
    }

    vi.mocked(getTheme).mockReturnValue(mockTheme)

    renderWithThemeProvider(<ThemeToggle />)

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeEnabled()
    })

    // Simulate Cmd+Shift+T keyboard event (Mac)
    const keyboardEvent = new KeyboardEvent('keydown', {
      key: 'T',
      metaKey: true,
      shiftKey: true,
    })

    document.dispatchEvent(keyboardEvent)

    await waitFor(() => {
      expect(applyTheme).toHaveBeenCalled()
    })
  })

  it('should not trigger on other keyboard shortcuts', async () => {
    renderWithThemeProvider(<ThemeToggle />)

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeEnabled()
    })

    // Simulate different keyboard event
    const keyboardEvent = new KeyboardEvent('keydown', {
      key: 'A',
      ctrlKey: true,
      shiftKey: true,
    })

    document.dispatchEvent(keyboardEvent)

    await waitFor(() => {
      expect(applyTheme).not.toHaveBeenCalled()
    })
  })

  it('should be disabled while not mounted', () => {
    const { container } = renderWithThemeProvider(<ThemeToggle />)

    // Immediately check - should be disabled initially
    const button = container.querySelector('[disabled]')
    expect(button).toBeInTheDocument()
  })
})
