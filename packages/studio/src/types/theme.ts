/**
 * Theme system type definitions
 * Provides comprehensive type safety for the theme system
 */

/**
 * Available theme modes
 * - 'light': Light mode theme
 * - 'dark': Dark mode theme
 * - 'system': Follows system preference
 */
export type ThemeMode = 'light' | 'dark' | 'system'

/**
 * Resolved theme is always either light or dark
 * (system gets resolved to the actual mode)
 */
export type ResolvedThemeMode = 'light' | 'dark'

/**
 * Theme color palette using HSL format
 * All colors are stored as HSL strings: "H S% L%"
 */
export interface ThemeColors {
  /** Main background color */
  background: string
  /** Main foreground/text color */
  foreground: string
  /** Primary brand color */
  primary: string
  /** Text color on primary background */
  'primary-foreground': string
  /** Secondary color */
  secondary: string
  /** Text color on secondary background */
  'secondary-foreground': string
  /** Accent color */
  accent: string
  /** Text color on accent background */
  'accent-foreground': string
  /** Muted color */
  muted: string
  /** Text color on muted background */
  'muted-foreground': string
  /** Destructive/error color */
  destructive: string
  /** Text color on destructive background */
  'destructive-foreground': string
  /** Border color */
  border: string
  /** Input border/background */
  input: string
  /** Focus ring color */
  ring: string
  /** Optional: Card background */
  card?: string
  /** Optional: Card foreground */
  'card-foreground'?: string
  /** Optional: Popover background */
  popover?: string
  /** Optional: Popover foreground */
  'popover-foreground'?: string
  /** Optional: Chart color 1 */
  'chart-1'?: string
  /** Optional: Chart color 2 */
  'chart-2'?: string
  /** Optional: Chart color 3 */
  'chart-3'?: string
  /** Optional: Chart color 4 */
  'chart-4'?: string
  /** Optional: Chart color 5 */
  'chart-5'?: string
  /** Optional: Sidebar background */
  'sidebar-background'?: string
  /** Optional: Sidebar foreground */
  'sidebar-foreground'?: string
  /** Optional: Sidebar primary */
  'sidebar-primary'?: string
  /** Optional: Sidebar primary foreground */
  'sidebar-primary-foreground'?: string
  /** Optional: Sidebar accent */
  'sidebar-accent'?: string
  /** Optional: Sidebar accent foreground */
  'sidebar-accent-foreground'?: string
  /** Optional: Sidebar border */
  'sidebar-border'?: string
  /** Optional: Sidebar ring */
  'sidebar-ring'?: string
}

/**
 * Theme typography settings
 */
export interface ThemeFonts {
  /** Sans-serif font family */
  sans?: string
  /** Serif font family */
  serif?: string
  /** Monospace font family */
  mono?: string
}

/**
 * Theme shadow settings
 */
export interface ThemeShadows {
  /** Shadow color in HSL */
  color?: string
  /** Shadow opacity (0-1) */
  opacity?: string
  /** Shadow blur radius */
  blur?: string
  /** Shadow spread */
  spread?: string
  /** Shadow X offset */
  'offset-x'?: string
  /** Shadow Y offset */
  'offset-y'?: string
}

/**
 * Complete theme definition
 */
export interface Theme {
  /** Unique theme identifier */
  id: string
  /** Human-readable theme name */
  name: string
  /** Theme description */
  description: string
  /** Theme mode (light or dark) */
  mode: 'light' | 'dark'
  /** Color palette */
  colors: ThemeColors
  /** Border radius */
  radius?: string
  /** Optional font families */
  fonts?: ThemeFonts
  /** Optional shadow settings */
  shadows?: ThemeShadows
}

/**
 * Theme state for Zustand store or next-themes
 */
export interface ThemeState {
  /** Current theme mode */
  theme: ThemeMode
  /** Resolved theme (light or dark) */
  resolvedTheme: ResolvedThemeMode
  /** Selected theme ID (e.g., 'blue', 'green', 'default') */
  themeId: string
  /** Set theme mode */
  setTheme: (theme: ThemeMode) => void
  /** Set theme ID */
  setThemeId: (themeId: string) => void
}

/**
 * Theme context value (used by ThemeProvider)
 */
export interface ThemeContextValue {
  /** Current theme mode */
  theme: ThemeMode
  /** Resolved theme (light or dark) */
  resolvedTheme: ResolvedThemeMode
  /** Set theme mode */
  setTheme: (theme: ThemeMode) => void
}

/**
 * Theme initialization options
 */
export interface ThemeInitOptions {
  /** Default theme mode */
  defaultTheme?: ThemeMode
  /** Local storage key */
  storageKey?: string
  /** Enable system theme detection */
  enableSystem?: boolean
}

/**
 * Theme transition options
 */
export interface ThemeTransitionOptions {
  /** Transition duration in milliseconds */
  duration?: number
  /** Disable transitions during theme change */
  disableTransitions?: boolean
}

/**
 * CSS variable name
 */
export type CSSVariable =
  | `--${ keyof ThemeColors }`
  | '--radius'
  | '--font-sans'
  | '--font-serif'
  | '--font-mono'
  | '--shadow-color'
  | '--shadow-opacity'
  | '--shadow-blur'
  | '--shadow-spread'
  | '--shadow-offset-x'
  | '--shadow-offset-y'

/**
 * HSL color string format: "H S% L%"
 */
export type HSLString = `${number} ${number}% ${number}%`

/**
 * Theme validation result
 */
export interface ThemeValidationResult {
  /** Whether theme is valid */
  valid: boolean
  /** Validation errors */
  errors: string[]
  /** Missing required colors */
  missingColors: (keyof ThemeColors)[]
}

/**
 * Theme metadata
 */
export interface ThemeMetadata {
  /** Theme ID */
  id: string
  /** Theme name */
  name: string
  /** Whether theme is built-in */
  builtin: boolean
  /** Theme tags */
  tags: string[]
  /** Theme popularity (0-1) */
  popularity?: number
}

/**
 * Theme export format
 */
export interface ThemeExport {
  /** Theme data */
  theme: Theme
  /** Export timestamp */
  exportedAt: string
  /** Export version */
  version: string
}
