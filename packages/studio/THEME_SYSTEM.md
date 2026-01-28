# Theme System Documentation

The Theme System provides a comprehensive theming solution with light/dark mode support, 18 built-in themes, and smooth transitions.

## Features

- **18 Built-in Themes**: Blue, Green, Orange, Red, Rose, Violet, Yellow, Default, Spotify, Claude, Slack, Twitter, Vercel, Valorant, Supabase, Cyberpunk, Catppuccin, Material Design, Neo Brutalism, Studio Ghibli
- **Light/Dark Mode**: Automatic system theme detection with manual override
- **Persistent Preferences**: Theme choice saved to localStorage
- **Smooth Transitions**: CSS transitions for seamless theme switching
- **Keyboard Shortcuts**: Ctrl/Cmd + Shift + T to toggle theme
- **Iframe Support**: Theme synchronization for canvas editor iframes
- **Fully Accessible**: ARIA labels, screen reader announcements, keyboard navigation
- **TypeScript**: Full type safety with comprehensive type definitions

## Components

### ThemeProvider

Wraps the application with next-themes provider.

```tsx
import { ThemeProvider } from '@/components/theme-provider'

<ThemeProvider defaultTheme="system" storageKey="vite-shadcn-theme">
  <App />
</ThemeProvider>
```

**Props:**
- `defaultTheme`: Initial theme (`'light' | 'dark' | 'system'`)
- `storageKey`: localStorage key for persistence

### ThemeToggle

Button to toggle between light and dark mode with keyboard shortcut support.

```tsx
import { ThemeToggle } from '@/components/theme-toggle'

<ThemeToggle />
```

**Features:**
- Sun icon in light mode, moon icon in dark mode
- Smooth icon transitions
- Keyboard shortcut: Ctrl/Cmd + Shift + T
- ARIA labels for accessibility

### ThemeSwitcher

Dropdown menu with all available themes and search functionality.

```tsx
import { ThemeSwitcher } from '@/components/theme-switcher'

<ThemeSwitcher />
```

**Features:**
- Visual theme previews with color palettes
- Search by name or description
- Current theme indicator with checkmark
- Mode indicator (Light/Dark)
- Screen reader announcements

## Theme Library

### Getting a Theme

```typescript
import { getTheme } from '@/lib/themes'

// Get theme in light mode
const lightTheme = getTheme('blue', 'light')

// Get theme in dark mode
const darkTheme = getTheme('blue', 'dark')
```

### Applying a Theme

```typescript
import { applyTheme } from '@/lib/themes'

applyTheme(theme)
```

### Getting All Themes

```typescript
import { getAllThemes } from '@/lib/themes'

const lightThemes = getAllThemes('light')
const darkThemes = getAllThemes('dark')
```

### HSL Color Conversion

```typescript
import { hslToCss, getThemeColorCss } from '@/lib/themes'

// Convert HSL to CSS format
const cssColor = hslToCss('221.2 83.2% 53.3%') // 'hsl(221.2, 83.2%, 53.3%)'

// Get theme color in CSS format
const backgroundColor = getThemeColorCss(theme, 'background')
```

## Iframe Theme Bridge

For canvas editor iframes, use the iframe theme bridge to synchronize themes.

### In Parent Window

```typescript
import { initializeIframeThemeSync } from '@/lib/iframe-theme-bridge'
import { getTheme } from '@/lib/themes'
import { useTheme } from 'next-themes'

function App() {
  const { theme, resolvedTheme } = useTheme()

  useEffect(() => {
    const cleanup = initializeIframeThemeSync(() => {
      const mode = (resolvedTheme || theme || 'light') === 'dark' ? 'dark' : 'light'
      const themeId = localStorage.getItem('selected-theme') || 'default'
      const currentTheme = getTheme(themeId, mode)

      return {
        theme: currentTheme,
        mode,
        themeId,
      }
    })

    return cleanup
  }, [theme, resolvedTheme])

  return <iframe src="/canvas.html" />
}
```

### In Iframe

```typescript
import { setupIframeThemeListener, applyTheme } from '@/lib/iframe-theme-bridge'

useEffect(() => {
  const cleanup = setupIframeThemeListener((theme, mode) => {
    applyTheme(theme)

    const root = document.documentElement
    if (mode === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  })

  // Request current theme from parent
  requestThemeFromParent()

  return cleanup
}, [])
```

## Theme Structure

Each theme has the following structure:

```typescript
interface Theme {
  id: string              // Unique identifier
  name: string            // Display name
  description: string     // Theme description
  mode: 'light' | 'dark'  // Mode
  colors: {
    background: string
    foreground: string
    primary: string
    'primary-foreground': string
    secondary: string
    'secondary-foreground': string
    accent: string
    'accent-foreground': string
    muted: string
    'muted-foreground': string
    destructive: string
    'destructive-foreground': string
    border: string
    input: string
    ring: string
    // ... optional colors
  }
  radius?: string          // Border radius
  fonts?: {               // Font families
    sans?: string
    serif?: string
    mono?: string
  }
  shadows?: {             // Shadow settings
    color?: string
    opacity?: string
    blur?: string
    spread?: string
    'offset-x'?: string
    'offset-y'?: string
  }
}
```

## Custom Themes

You can create custom themes by adding them to the theme library.

### 1. Define Theme Colors

```typescript
const customTheme: Theme = {
  id: 'custom',
  name: 'Custom Theme',
  description: 'My custom theme',
  mode: 'light',
  colors: {
    background: '0 0% 100%',
    foreground: '0 0% 3.9%',
    primary: '210 100% 50%',
    'primary-foreground': '0 0% 98%',
    // ... rest of colors
  },
  radius: '0.5rem',
}
```

### 2. Add to Theme Library

Edit `src/lib/themes.ts`:

```typescript
export const themes: Record<string, Theme> = {
  // ... existing themes
  custom: customTheme,
}

export const darkThemes: Record<string, Theme> = {
  // ... existing themes
  custom: customDarkTheme,
}
```

## CSS Variables

Themes use CSS variables in HSL format:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  --primary: 0 0% 9%;
  /* ... */
}
```

Use them in Tailwind:

```tsx
<div className="bg-background text-foreground">
  Content
</div>
```

## Dark Mode

Add the `dark` class to the `<html>` element:

```html
<html class="dark">
  <!-- Dark mode styles applied -->
</html>
```

Use the `dark:` prefix in Tailwind:

```tsx
<div className="bg-white dark:bg-gray-900">
  Adaptive content
</div>
```

## Transitions

Smooth transitions are applied automatically:

```css
* {
  transition-property: background-color, border-color, color, fill, stroke, opacity, box-shadow;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
```

Disable transitions during rapid theme changes:

```css
.theme-transitioning * {
  transition: none !important;
}
```

## Testing

The theme system includes comprehensive tests:

```bash
# Run theme tests
npm test src/lib/themes.test.ts
npm test src/components/theme-toggle.test.tsx
npm test src/components/theme-switcher/theme-switcher.test.tsx
npm test src/lib/iframe-theme-bridge.test.ts
```

## Accessibility

### Keyboard Shortcuts

- **Ctrl/Cmd + Shift + T**: Toggle light/dark mode

### Screen Reader Support

- Theme changes are announced via ARIA live regions
- All buttons have proper ARIA labels
- Theme names and descriptions are readable

### Focus Management

- All interactive elements are keyboard accessible
- Visible focus indicators
- Logical tab order

## Performance

### No Flash of Wrong Theme (FOUC)

Themes are applied before render:

```typescript
// In main.tsx
import { initializeTheme } from '@/lib/theme-init'

initializeTheme() // Apply theme immediately

createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
)
```

### Optimized Transitions

- Minimal CSS transition properties
- Transition disabling during rapid switches
- Efficient DOM updates

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Full support

## Troubleshooting

### Theme Not Applying

1. Check localStorage: `localStorage.getItem('vite-shadcn-theme')`
2. Check dark class: `document.documentElement.classList.contains('dark')`
3. Verify theme ID: `localStorage.getItem('selected-theme')`

### Iframe Theme Not Syncing

1. Check postMessage origin
2. Verify iframe is loaded
3. Check console for errors
4. Ensure cleanup functions are called

### Transitions Not Smooth

1. Check for `!important` CSS rules
2. Verify no conflicting transitions
3. Check `.theme-transitioning` class

## Best Practices

1. **Use semantic colors**: `bg-background`, `text-foreground`, `border-border`
2. **Respect user preference**: Default to `system` theme
3. **Test both modes**: Verify components in light and dark
4. **Provide contrast**: Ensure text is readable in all themes
5. **Announce changes**: Use ARIA live regions for theme switches
6. **Preserve choices**: Save theme preference to localStorage

## Examples

### Theme-aware Component

```tsx
function Card() {
  return (
    <div className="bg-card text-card-foreground border rounded-lg p-4">
      <h2 className="text-2xl font-bold text-primary">Title</h2>
      <p className="text-muted-foreground">Description</p>
    </div>
  )
}
```

### Theme Toggle with Custom Button

```tsx
function CustomThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      Switch to {theme === 'dark' ? 'light' : 'dark'}
    </button>
  )
}
```

### Monitor Theme Changes

```tsx
import { useTheme } from 'next-themes'

function ThemeMonitor() {
  const { theme, resolvedTheme } = useTheme()

  useEffect(() => {
    console.log('Theme changed:', theme, 'Resolved:', resolvedTheme)
  }, [theme, resolvedTheme])

  return null
}
```

## Resources

- [next-themes Documentation](https://github.com/pacocoursey/next-themes)
- [Tailwind CSS Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [HSL Color Picker](https://hslpicker.com/)

## License

MIT
