# Quality Gate Dashboard - Quick Start

## 🎯 What It Does

Visualizes agentful's 6 core quality gates with real-time status, beautiful animations, and interactive details.

## 🚀 Basic Usage

```tsx
import { QualityGateDashboard } from '@/components/visualizations/QualityGateDashboard'

export default function Page() {
  return <QualityGateDashboard />
}
```

That's it! Shows sample data with all 6 gates.

## 📊 The 6 Quality Gates

1. **Type Checking** 📘 - TypeScript/Flow errors
2. **Linting** ✨ - ESLint violations
3. **Tests** 🧪 - Test pass/fail
4. **Coverage** 📊 - Code coverage % (circular progress)
5. **Security** 🔒 - Vulnerabilities
6. **Dead Code** 🗑️ - Unused exports

## 🎨 Visual Features

- **Glassmorphism cards** with backdrop blur
- **Gate-specific colors** (blue, purple, amber, teal, red, gray)
- **Circular progress** for coverage (animated SVG)
- **Status badges** (checkmark/X)
- **Animations**:
  - Pass: Pulsing glow
  - Fail: Shake animation
  - Mount: Fade in
  - Click: Expand details
  - Hover: Lift + enhanced glow

## 🎛️ Props

```typescript
<QualityGateDashboard
  gates={customGates}        // Your gate data (optional)
  showOverallScore={true}    // Show summary card (default: true)
  interactive={true}         // Enable click/hover (default: true)
  compact={false}            // Smaller cards (default: false)
/>
```

## 📝 Custom Data

```tsx
import { QualityGate } from '@/components/visualizations/QualityGateDashboard'

const gates: QualityGate[] = [
  {
    id: 'coverage',
    name: 'Code Coverage',
    icon: '📊',
    color: '#14b8a6',
    status: 'fail',  // 'pass' | 'fail'
    metric: {
      value: 65,     // Percentage or count
      unit: '%',     // Display unit
      total: 100     // Optional: for ratios
    },
    description: 'Below 80% threshold',
    details: 'Coverage details here',  // Optional: shown on click
    lastChecked: new Date()            // Optional: timestamp
  },
  // ... 5 more gates
]

<QualityGateDashboard gates={gates} />
```

## 🔌 Integration with agentful

Connect to validation results:

```tsx
import { useEffect, useState } from 'react'

function QualityPage() {
  const [gates, setGates] = useState([])

  useEffect(() => {
    // Option 1: Fetch from API
    fetch('/api/quality-gates').then(res => res.json()).then(setGates)

    // Option 2: Read from file system
    // const data = fs.readFileSync('.agentful/last-validation.json')
    // setGates(JSON.parse(data).gates)
  }, [])

  return <QualityGateDashboard gates={gates} />
}
```

## 📱 Responsive

- **Desktop**: 2-3 columns
- **Tablet**: 2 columns
- **Mobile**: 1 column (stacked)
- Touch-friendly (44px+ targets)

## ♿ Accessibility

- Full ARIA labels
- Keyboard navigation (Tab, Enter, Space)
- Screen reader support
- Focus indicators
- Semantic HTML

## 🎯 Common Patterns

### Compact Embedded View
```tsx
<QualityGateDashboard compact showOverallScore={false} />
```

### Real-time Updates
```tsx
useEffect(() => {
  const interval = setInterval(() => {
    fetchGates().then(setGates)
  }, 30000) // Update every 30s

  return () => clearInterval(interval)
}, [])
```

### Single Gate Focus
```tsx
const coverageOnly = [gates.find(g => g.id === 'coverage')]
<QualityGateDashboard gates={coverageOnly} showOverallScore={false} />
```

## 🎨 Customization

### Custom Colors
```tsx
{
  id: 'custom',
  icon: '🎨',
  color: '#ec4899',  // Any hex color
  // ...
}
```

### Hide Overall Score
```tsx
<QualityGateDashboard showOverallScore={false} />
```

### Disable Interactions
```tsx
<QualityGateDashboard interactive={false} />
```

## 📦 Files

- `QualityGateDashboard.tsx` - Main component (16KB)
- `QualityGateDashboard.README.md` - Full documentation
- `QualityGateDashboard.example.mdx` - Usage examples
- `QualityGateDashboard.test.mdx` - Visual tests
- `QualityGateDashboard.SUMMARY.md` - Implementation details

## 🧪 Testing

Import test data:

```tsx
import { QualityGateDashboard } from './QualityGateDashboard'

// Included sample data shows all passing gates
<QualityGateDashboard />

// Override with failures
const failingGates = [...gates]
failingGates[0].status = 'fail'
failingGates[0].metric.value = 47

<QualityGateDashboard gates={failingGates} />
```

## 🚨 Troubleshooting

**Cards not displaying?**
→ Check gates array is not empty

**Animations not smooth?**
→ Verify CSS animations supported (not disabled in preferences)

**Circular progress not animating?**
→ Check coverage gate exists and has valid percentage (0-100)

**Hover effects not working?**
→ Ensure `interactive={true}` (default)

**Layout broken on mobile?**
→ Verify container has no width constraints

## 📚 Learn More

- **Full API**: See `QualityGateDashboard.README.md`
- **Examples**: See `QualityGateDashboard.example.mdx`
- **Testing**: See `QualityGateDashboard.test.mdx`
- **Architecture**: See `QualityGateDashboard.SUMMARY.md`

## 💡 Tips

1. **Use memoization** for computed gate data
2. **Debounce real-time updates** (30s recommended)
3. **Provide meaningful details** for expanded view
4. **Keep gate colors distinct** for accessibility
5. **Test on mobile devices** for touch interactions

## ✅ Production Ready

- ✅ TypeScript types
- ✅ Zero dependencies
- ✅ CSS Grid layout
- ✅ Pure CSS animations
- ✅ Full accessibility
- ✅ Responsive design
- ✅ Build passing
- ✅ Linting clean

---

**Quick Links**:
- [Full Documentation](./QualityGateDashboard.README.md)
- [Examples](./QualityGateDashboard.example.mdx)
- [Visual Tests](./QualityGateDashboard.test.mdx)
- [Implementation Details](./QualityGateDashboard.SUMMARY.md)
