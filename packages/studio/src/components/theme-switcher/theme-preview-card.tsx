import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Theme } from '@/lib/themes'
import { hslToCss } from '@/lib/themes'

interface ThemePreviewCardProps {
  theme: Theme
  isActive: boolean
  onClick: () => void
}

export function ThemePreviewCard({ theme, isActive, onClick }: ThemePreviewCardProps) {
  const colorKeys: (keyof Theme['colors'])[] = [
    'background',
    'foreground',
    'primary',
    'secondary',
    'accent',
    'muted',
    'destructive',
  ]

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative w-full rounded-lg border bg-card p-3 text-left transition-all duration-300 hover:shadow-md hover:border-primary/50',
        isActive && 'ring-2 ring-ring ring-offset-2 ring-offset-background'
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-semibold text-sm">{theme.name}</h3>
        {isActive && <Check className="h-4 w-4 text-primary" />}
      </div>

      <p className="text-muted-foreground mb-3 text-xs">{theme.description}</p>

      {/* Color Palette Preview */}
      <div className="mb-3 flex gap-1">
        {colorKeys.map((colorKey) => {
          const colorValue = theme.colors[colorKey]
          if (!colorValue) return null
          return (
            <div
              key={colorKey}
              className="h-6 flex-1 rounded-sm shadow-sm transition-colors duration-300"
              style={{ backgroundColor: hslToCss(colorValue) }}
              title={colorKey}
            />
          )
        })}
      </div>

      {/* Typography Preview */}
      <div
        className="rounded border p-2 text-xs transition-all duration-300"
        style={{
          backgroundColor: hslToCss(theme.colors.background),
          color: hslToCss(theme.colors.foreground),
          borderColor: hslToCss(theme.colors.border),
        }}
      >
        <p className="font-bold">Aa Bb Cc</p>
        <p className="text-muted-foreground">The quick brown fox</p>
      </div>
    </button>
  )
}
