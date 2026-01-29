import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from 'next-themes'
import { ThemeSwitcher } from './theme-switcher'
import * as themes from '@/lib/themes'

// Mock the themes library
vi.mock('@/lib/themes', async () => {
  const actual = await vi.importActual('@/lib/themes')
  return {
    ...actual,
    getAllThemes: vi.fn(),
    applyTheme: vi.fn(),
  }
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(() => 'default'),
  setItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

function renderWithThemeProvider(component: React.ReactElement) {
  return render(
    <ThemeProvider defaultTheme="system" storageKey="test-theme">
      {component}
    </ThemeProvider>
  )
}

describe('ThemeSwitcher', () => {
  const mockThemes = [
    {
      id: 'default',
      name: 'Default',
      description: 'The classic zinc theme',
      mode: 'light' as const,
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
    },
    {
      id: 'blue',
      name: 'Blue',
      description: 'A clean blue theme',
      mode: 'light' as const,
      colors: {
        background: '0 0% 100%',
        foreground: '222.2 84% 4.9%',
        primary: '221.2 83.2% 53.3%',
        'primary-foreground': '210 40% 98%',
        secondary: '210 40% 96.1%',
        'secondary-foreground': '222.2 47.4% 11.2%',
        accent: '210 40% 96.1%',
        'accent-foreground': '222.2 47.4% 11.2%',
        muted: '210 40% 96.1%',
        'muted-foreground': '215.4 16.3% 46.9%',
        destructive: '0 84.2% 60.2%',
        'destructive-foreground': '210 40% 98%',
        border: '214.3 31.8% 91.4%',
        input: '214.3 31.8% 91.4%',
        ring: '221.2 83.2% 53.3%',
      },
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(themes.getAllThemes).mockReturnValue(mockThemes)
  })

  it('should render successfully', () => {
    renderWithThemeProvider(<ThemeSwitcher />)

    expect(screen.getByRole('button')).toBeInTheDocument()
    expect(screen.getByText('Theme')).toBeInTheDocument()
  })

  it('should open popover on click', async () => {
    const user = userEvent.setup()
    renderWithThemeProvider(<ThemeSwitcher />)

    const button = screen.getByRole('button')
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByText('Select Theme')).toBeInTheDocument()
    })
  })

  it('should display all themes', async () => {
    const user = userEvent.setup()
    renderWithThemeProvider(<ThemeSwitcher />)

    const button = screen.getByRole('button')
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByText('Default')).toBeInTheDocument()
      expect(screen.getByText('Blue')).toBeInTheDocument()
    })
  })

  it('should display current mode indicator', async () => {
    const user = userEvent.setup()
    renderWithThemeProvider(<ThemeSwitcher />)

    const button = screen.getByRole('button')
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByText(/Light Mode|Dark Mode/)).toBeInTheDocument()
    })
  })

  it('should filter themes by search query', async () => {
    const user = userEvent.setup()
    renderWithThemeProvider(<ThemeSwitcher />)

    const button = screen.getByRole('button')
    await user.click(button)

    const searchInput = screen.getByPlaceholderText('Search themes...')
    await user.type(searchInput, 'blue')

    await waitFor(() => {
      expect(screen.getByText('Blue')).toBeInTheDocument()
      expect(screen.queryByText('Default')).not.toBeInTheDocument()
    })
  })

  it('should show "No themes found" when search matches nothing', async () => {
    const user = userEvent.setup()
    renderWithThemeProvider(<ThemeSwitcher />)

    const button = screen.getByRole('button')
    await user.click(button)

    const searchInput = screen.getByPlaceholderText('Search themes...')
    await user.type(searchInput, 'nonexistent')

    await waitFor(() => {
      expect(screen.getByText('No themes found')).toBeInTheDocument()
    })
  })

  it('should select theme on click', async () => {
    const user = userEvent.setup()
    renderWithThemeProvider(<ThemeSwitcher />)

    const button = screen.getByRole('button')
    await user.click(button)

    // Find the Default theme button
    const defaultThemeButton = screen.getByText('Default').closest('button')
    await user.click(defaultThemeButton!)

    await waitFor(() => {
      expect(themes.applyTheme).toHaveBeenCalledWith(mockThemes[0])
      expect(localStorageMock.setItem).toHaveBeenCalledWith('selected-theme', 'default')
    })
  })

  it('should mark active theme', async () => {
    const user = userEvent.setup()
    renderWithThemeProvider(<ThemeSwitcher />)

    const button = screen.getByRole('button')
    await user.click(button)

    await waitFor(() => {
      // Default theme should have checkmark icon (it's the active theme)
      const defaultThemeButton = screen.getByText('Default').closest('button')
      expect(defaultThemeButton).toHaveClass('ring-2')
    })
  })

  it('should announce theme change for accessibility', async () => {
    const user = userEvent.setup()
    renderWithThemeProvider(<ThemeSwitcher />)

    const button = screen.getByRole('button')
    await user.click(button)

    const themeButton = screen.getByText('Blue').closest('button')
    await user.click(themeButton!)

    await waitFor(() => {
      const announcement = screen.getByText('Theme changed to Blue')
      expect(announcement).toBeInTheDocument()
    })
  })

  it('should close popover after selecting theme', async () => {
    const user = userEvent.setup()
    renderWithThemeProvider(<ThemeSwitcher />)

    const button = screen.getByRole('button')
    await user.click(button)

    const themeButton = screen.getByText('Default').closest('button')
    await user.click(themeButton!)

    await waitFor(() => {
      expect(screen.queryByText('Select Theme')).not.toBeInTheDocument()
    })
  })

  it('should have proper accessibility attributes', () => {
    renderWithThemeProvider(<ThemeSwitcher />)

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Open theme switcher')
  })

  it('should display theme descriptions', async () => {
    const user = userEvent.setup()
    renderWithThemeProvider(<ThemeSwitcher />)

    const button = screen.getByRole('button')
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByText('The classic zinc theme')).toBeInTheDocument()
      expect(screen.getByText('A clean blue theme')).toBeInTheDocument()
    })
  })

  it('should filter by description text', async () => {
    const user = userEvent.setup()
    renderWithThemeProvider(<ThemeSwitcher />)

    const button = screen.getByRole('button')
    await user.click(button)

    const searchInput = screen.getByPlaceholderText('Search themes...')
    await user.type(searchInput, 'zinc')

    await waitFor(() => {
      expect(screen.getByText('Default')).toBeInTheDocument()
      expect(screen.queryByText('Blue')).not.toBeInTheDocument()
    })
  })
})
