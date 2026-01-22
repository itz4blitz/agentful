# Quick Start - Product Structure Visualizer

## 1. Import

```tsx
import { ProductStructureVisualizer } from '@/components/visualizations'
```

## 2. Use in MDX

```mdx
# Product Structure

<ProductStructureVisualizer />
```

## 3. Common Configurations

### Expanded by Default
```mdx
<ProductStructureVisualizer expandedByDefault={true} />
```

### Custom Height
```mdx
<ProductStructureVisualizer height="900px" />
```

### Taller for Large Products
```mdx
<ProductStructureVisualizer height="1000px" initialZoom={0.5} />
```

### Static (No Interaction)
```mdx
<ProductStructureVisualizerStatic height="600px" />
```

## 4. Custom Data

```tsx
import { ProductStructureVisualizer, type ProductStructure } from '@/components/visualizations'

const myData: ProductStructure = {
  product: {
    id: 'my-product',
    name: 'My Product',
    completion: 65,
    description: 'Product description here'
  },
  domains: [
    {
      id: 'domain-1',
      name: 'Core Features',
      completion: 80,
      description: 'Main functionality',
      features: [
        {
          id: 'feature-1',
          name: 'User Auth',
          completion: 100,
          priority: 'CRITICAL',
          status: 'complete',
          description: 'Authentication system',
          subtasks: [
            { id: 'sub-1', name: 'Login', completion: 100, status: 'complete' },
            { id: 'sub-2', name: 'Signup', completion: 100, status: 'complete' }
          ]
        }
      ]
    }
  ]
}

<ProductStructureVisualizer data={myData} />
```

## 5. All Props

```typescript
interface ProductStructureVisualizerProps {
  data?: ProductStructure           // Default: SAMPLE_DATA
  interactive?: boolean             // Default: true
  showControls?: boolean            // Default: true
  initialZoom?: number              // Default: 0.6
  height?: string                   // Default: '700px'
  expandedByDefault?: boolean       // Default: false
}
```

## 6. Data Structure

```typescript
interface ProductStructure {
  product: {
    id: string                      // Unique ID
    name: string                    // Display name
    completion: number              // 0-100
    description?: string            // Optional description
  }
  domains: Array<{
    id: string                      // Unique ID
    name: string                    // Display name
    completion: number              // 0-100 (average of features)
    description?: string            // Optional description
    features: Array<{
      id: string                    // Unique ID
      name: string                  // Display name
      completion: number            // 0-100 (average of subtasks)
      priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
      status: 'complete' | 'in-progress' | 'pending'
      description?: string          // Optional description
      dependencies?: string[]       // Optional feature IDs
      subtasks: Array<{
        id: string                  // Unique ID
        name: string                // Display name
        completion: number          // 0-100
        status: 'complete' | 'in-progress' | 'pending'
      }>
    }>
  }>
}
```

## 7. Interactive Features

### Expand/Collapse
- Click domain or feature nodes to show/hide children
- Visual indicator (▼) shows current state

### Filters
- **Search**: Type to filter by name
- **Status**: Show only Complete/In Progress/Pending
- **Priority**: Show only CRITICAL/HIGH/MEDIUM/LOW
- **Reset**: Clear all filters

### Details Modal
- Click any node to see full details
- Press ESC or click outside to close

### Zoom/Pan
- Use controls in bottom-right
- Scroll to zoom
- Drag to pan
- "Fit view" button to reset

## 8. Status Colors

| Status | Color | Code |
|--------|-------|------|
| Complete | Green | #10b981 |
| In Progress | Yellow | #f59e0b |
| Pending | Gray | #6b7280 |

## 9. Priority Colors

| Priority | Color | Code |
|----------|-------|------|
| CRITICAL | Red | #ef4444 |
| HIGH | Orange | #f97316 |
| MEDIUM | Blue | #3b82f6 |
| LOW | Gray | #6b7280 |

## 10. Accessibility

- Full keyboard navigation (Tab, Enter, Space)
- ARIA labels on all interactive elements
- Screen reader support
- ESC key closes modal
- Focus indicators
- Semantic HTML

## 11. Performance Tips

### For Large Products (100+ nodes)
```tsx
<ProductStructureVisualizer
  expandedByDefault={false}  // Start collapsed
  initialZoom={0.5}          // Zoom out to see more
  height="900px"             // More vertical space
/>
```

### For Small Products (< 20 nodes)
```tsx
<ProductStructureVisualizer
  expandedByDefault={true}   // Show everything
  initialZoom={0.8}          // Zoom in for detail
  height="600px"             // Less space needed
/>
```

## 12. Troubleshooting

**Nodes overlapping?**
- Decrease `initialZoom` to see more
- Increase `height` for more vertical space

**Can't see all nodes?**
- Set `expandedByDefault={true}`
- Use "Fit view" button (bottom-right)

**Filters not working?**
- Ensure `interactive={true}` (default)
- Check that data has correct status/priority values

**Layout looks weird?**
- Verify all IDs are unique
- Check parent-child relationships
- Ensure completion values are 0-100

## 13. Examples

See `ProductStructureVisualizer.example.mdx` for live examples.

See `ProductStructureVisualizer.README.md` for comprehensive documentation.
