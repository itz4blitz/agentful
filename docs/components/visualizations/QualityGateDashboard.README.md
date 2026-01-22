# Quality Gate Dashboard

A beautiful, interactive dashboard component for displaying agentful's 6 core quality gates with real-time status, metrics, and animations.

## Features

- **6 Core Quality Gates**: Type Checking, Linting, Tests, Coverage, Security, Dead Code
- **CSS Grid Layout**: Responsive, auto-fitting cards (2 columns on desktop, 1 on mobile)
- **Pure CSS Animations**: Smooth transitions, glow effects, shake animations, fade-ins
- **Circular Progress**: Visual coverage percentage with animated SVG
- **Overall Score**: Large summary card showing total passing gates
- **Interactive Details**: Click cards to expand and see detailed information
- **Glassmorphism Design**: Beautiful backdrop blur and gradient effects
- **Status Badges**: Animated checkmark/X indicators
- **Accessibility**: Full ARIA labels, keyboard navigation, semantic HTML

## Architecture

Built with:
- **Layout**: CSS Grid (no React Flow as per architect recommendation)
- **Animations**: Pure CSS (no Framer Motion)
- **Styling**: Inline styles with CSS variables
- **State**: React hooks (useState, useMemo)
- **TypeScript**: Full type safety

## Usage

### Basic Usage

```tsx
import { QualityGateDashboard } from '@/components/visualizations/QualityGateDashboard'

export default function Page() {
  return <QualityGateDashboard />
}
```

### Custom Gates

```tsx
import { QualityGateDashboard, QualityGate } from '@/components/visualizations/QualityGateDashboard'

const myGates: QualityGate[] = [
  {
    id: 'types',
    name: 'Type Checking',
    icon: '📘',
    color: '#3b82f6',
    status: 'pass',
    metric: { value: 0, unit: 'errors' },
    description: 'No type errors in codebase',
    details: 'TypeScript compilation completed successfully.',
    lastChecked: new Date(),
  },
  {
    id: 'coverage',
    name: 'Coverage',
    icon: '📊',
    color: '#14b8a6',
    status: 'fail',
    metric: { value: 65, unit: '%' },
    description: 'Minimum 80% coverage required',
    details: 'Coverage is below the required threshold.',
    lastChecked: new Date(),
  },
  // ... more gates
]

export default function Page() {
  return <QualityGateDashboard gates={myGates} />
}
```

### Compact Mode

```tsx
<QualityGateDashboard compact />
```

### Without Overall Score

```tsx
<QualityGateDashboard showOverallScore={false} />
```

### Non-Interactive

```tsx
<QualityGateDashboard interactive={false} />
```

### In MDX Files

```mdx
import { QualityGateDashboard } from '@/components/visualizations/QualityGateDashboard'

# Quality Gates

<QualityGateDashboard />

Or with custom props:

<QualityGateDashboard compact interactive={false} />
```

## Props

### `QualityGateDashboardProps`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `gates` | `QualityGate[]` | Sample data | Array of quality gate objects |
| `showOverallScore` | `boolean` | `true` | Show/hide the overall score card |
| `interactive` | `boolean` | `true` | Enable/disable click interactions |
| `compact` | `boolean` | `false` | Use smaller card sizes and spacing |

### `QualityGate`

```typescript
interface QualityGate {
  id: 'types' | 'lint' | 'tests' | 'coverage' | 'security' | 'deadcode'
  name: string              // Display name
  icon: string              // Emoji or icon
  color: string             // Hex color for theme
  status: 'pass' | 'fail'   // Gate status
  metric: {
    value: number           // Primary metric value
    unit: string            // Unit label (e.g., "errors", "%")
    total?: number          // For ratios like "24/24"
  }
  description: string       // Short description
  details?: string          // Expanded details (shown on click)
  lastChecked?: Date        // Last check timestamp
}
```

## Gate Types

### 1. Type Checking
- **Icon**: 📘 (blue)
- **Metric**: Error count
- **Pass Criteria**: 0 errors

### 2. Linting
- **Icon**: ✨ (purple)
- **Metric**: Violation count
- **Pass Criteria**: 0 violations

### 3. Tests
- **Icon**: 🧪 (amber)
- **Metric**: Passing/Total ratio
- **Pass Criteria**: All tests passing

### 4. Coverage
- **Icon**: 📊 (teal)
- **Metric**: Percentage with circular progress
- **Pass Criteria**: ≥80%

### 5. Security
- **Icon**: 🔒 (red)
- **Metric**: Vulnerability count
- **Pass Criteria**: 0 vulnerabilities

### 6. Dead Code
- **Icon**: 🗑️ (gray)
- **Metric**: Unused export count
- **Pass Criteria**: 0 unused exports

## Visual Design

### Card Structure

Each quality gate card contains:

1. **Header**:
   - Icon (48x48px, gate color with glow)
   - Gate name (1.25rem, semibold)
   - Status badge (32x32px circle with ✓/✗)

2. **Metric Display**:
   - Large number or circular progress (for coverage)
   - Unit label
   - Centered, prominent

3. **Description**:
   - Light gray text
   - 1-2 sentences explaining the gate

4. **Footer**:
   - Last checked timestamp ("2m ago")
   - "View details" link (if interactive)

5. **Expanded Details** (on click):
   - Dark overlay with detailed information
   - Fade-in animation

### Overall Score Card

Top card showing:
- Circular progress (150x150px)
- Percentage (e.g., "83%")
- "Quality Gates" title
- "5/6 passing" subtitle
- Mini status list for all gates

### Animations

| Animation | Trigger | Effect |
|-----------|---------|--------|
| `fadeIn` | On mount | Fade in + slide up |
| `passGlow` | Pass state | Pulsing glow effect |
| `failShake` | Fail state | Shake left/right |
| `statusAppear` | Badge mount | Scale up with bounce |
| `statusShake` | Fail badge | Rotate shake |

### Color Palette

- **Background**: `#0f172a` to `#1e293b` gradient
- **Glass Surface**: `rgba(30, 41, 59, 0.7)` with `blur(10px)`
- **Border**: Gate-specific color
- **Text Primary**: `#f1f5f9`
- **Text Secondary**: `#cbd5e1`
- **Text Muted**: `#64748b`

## Accessibility

### ARIA Labels

- Dashboard: `role="region"`, `aria-label="Quality gates"`
- Cards: `role="article"`, `aria-label="[Gate name] quality gate: [status]"`
- Badges: `role="status"`, `aria-label="Passed/Failed"`
- Progress: `role="img"`, `aria-label="[value]% coverage"`

### Keyboard Navigation

- **Tab**: Focus cards
- **Enter/Space**: Expand card details
- **Escape**: Close expanded details (if implemented)

### Screen Readers

- All interactive elements have descriptive labels
- Status changes are announced
- Progress values are readable
- Timestamp formatting is human-friendly

## Performance

- **Memoization**: Overall score calculation memoized
- **CSS Animations**: Hardware-accelerated (transform, opacity)
- **Lazy Rendering**: Details only render when expanded
- **No External Libraries**: Pure React + CSS

## Responsive Design

```css
/* Desktop: 2-3 columns */
grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));

/* Tablet: 2 columns */
/* Automatic based on container width */

/* Mobile: 1 column */
/* Automatic based on container width */
```

## Integration with agentful

This component is designed to visualize data from:

- `.agentful/last-validation.json` - Validation results
- `.agentful/completion.json` - Feature completion metrics
- CLI output from `/agentful-validate` command

Example integration:

```tsx
import { useState, useEffect } from 'react'
import { QualityGateDashboard, QualityGate } from '@/components/visualizations/QualityGateDashboard'

export default function QualityPage() {
  const [gates, setGates] = useState<QualityGate[]>([])

  useEffect(() => {
    // Fetch from API or read from .agentful/last-validation.json
    fetch('/api/quality-gates')
      .then(res => res.json())
      .then(data => setGates(data))
  }, [])

  return <QualityGateDashboard gates={gates} />
}
```

## Customization

### Custom Gate Colors

```tsx
const customGate: QualityGate = {
  id: 'custom',
  name: 'Custom Check',
  icon: '🎨',
  color: '#ec4899', // Custom pink color
  status: 'pass',
  metric: { value: 100, unit: 'score' },
  description: 'Custom quality metric',
}
```

### Custom Animations

Override CSS animations by injecting custom styles:

```tsx
<style>
{`
  @keyframes customGlow {
    0%, 100% { box-shadow: 0 0 30px rgba(236, 72, 153, 0.3); }
    50% { box-shadow: 0 0 50px rgba(236, 72, 153, 0.6); }
  }
`}
</style>
```

## Examples

### All Gates Passing

```tsx
<QualityGateDashboard />
// Shows 100% with green theme
```

### Some Gates Failing

```tsx
const gates = [
  // ... 5 passing gates
  { ...coverageGate, status: 'fail', metric: { value: 65, unit: '%' } }
]

<QualityGateDashboard gates={gates} />
// Shows 83% with amber theme
```

### Real-time Updates

```tsx
function LiveDashboard() {
  const [gates, setGates] = useState(sampleGates)

  useEffect(() => {
    const interval = setInterval(() => {
      // Fetch latest gate statuses
      fetchGates().then(setGates)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return <QualityGateDashboard gates={gates} />
}
```

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (backdrop-filter requires -webkit- prefix)
- Mobile browsers: Full support

## License

Part of the agentful project. See main LICENSE file.
