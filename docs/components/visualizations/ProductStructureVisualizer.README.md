# Product Structure Visualizer

A beautiful, interactive React Flow visualization for hierarchical product structures showing Product → Domains → Features → Subtasks with real-time completion tracking.

## Quick Start

```tsx
import { ProductStructureVisualizer } from '@/components/visualizations'

// Basic usage with sample data
<ProductStructureVisualizer />

// Expanded by default
<ProductStructureVisualizer expandedByDefault={true} />

// Custom height
<ProductStructureVisualizer height="900px" />

// Static (non-interactive) version
<ProductStructureVisualizerStatic />
```

## Features

### 🌳 Hierarchical Structure
- **4 Levels**: Product → Domains → Features → Subtasks
- **Expand/Collapse**: Click domains and features to show/hide children
- **Auto-Layout**: Custom tree layout algorithm with smart spacing

### 🎨 Visual Design
- **Emerald Green Theme**: Matches agentful brand
- **Glassmorphism**: Backdrop blur effects on all cards
- **Progress Bars**: Visual completion tracking on every node
- **Color Coding**:
  - Complete (100%): Green
  - In Progress (1-99%): Yellow with pulse animation
  - Pending (0%): Gray

### 🏷️ Status & Priority Tracking
- **Status Badges**: Complete, In Progress, Pending
- **Priority Badges**: CRITICAL (Red), HIGH (Orange), MEDIUM (Blue), LOW (Gray)
- **Animated Edges**: In-progress items have animated connections

### 🔍 Filtering & Search
- **Search**: Filter by node name (case-insensitive)
- **Status Filter**: Show only Complete/In Progress/Pending
- **Priority Filter**: Show only Critical/High/Medium/Low features
- **Reset Button**: Clear all filters at once

### 💡 Interactive Details
- **Click to Expand**: Domains and features are collapsible
- **Details Modal**: Click any node to see:
  - Full description
  - All subtasks (for features)
  - Dependencies (if any)
  - Quality gate status
  - Progress breakdown

### ⌨️ Accessibility
- Full keyboard navigation
- ARIA labels on all interactive elements
- Screen reader support
- ESC key closes modal
- Focus indicators
- Semantic HTML

## Component Props

```typescript
interface ProductStructureVisualizerProps {
  // Product data structure (defaults to sample data)
  data?: ProductStructure

  // Enable user interactions (expand, filter, click)
  interactive?: boolean // default: true

  // Show zoom/pan controls
  showControls?: boolean // default: true

  // Initial zoom level (0.3 to 1.5)
  initialZoom?: number // default: 0.6

  // Container height
  height?: string // default: '700px'

  // Expand all nodes on mount
  expandedByDefault?: boolean // default: false
}
```

## Data Structure

```typescript
interface ProductStructure {
  product: {
    id: string
    name: string
    completion: number // 0-100
    description?: string
  }
  domains: Array<{
    id: string
    name: string
    completion: number // 0-100
    description?: string
    features: Array<{
      id: string
      name: string
      completion: number // 0-100
      priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
      status: 'complete' | 'in-progress' | 'pending'
      description?: string
      dependencies?: string[]
      subtasks: Array<{
        id: string
        name: string
        completion: number // 0-100
        status: 'complete' | 'in-progress' | 'pending'
      }>
    }>
  }>
}
```

## Custom Data Example

```tsx
import { ProductStructureVisualizer } from '@/components/visualizations'
import type { ProductStructure } from '@/components/visualizations/ProductStructureVisualizer'

const myProduct: ProductStructure = {
  product: {
    id: 'my-saas',
    name: 'My SaaS Platform',
    completion: 65,
    description: 'Cloud-based platform for team collaboration',
  },
  domains: [
    {
      id: 'auth',
      name: 'Authentication',
      completion: 90,
      description: 'User authentication and authorization',
      features: [
        {
          id: 'login',
          name: 'Login System',
          completion: 100,
          priority: 'CRITICAL',
          status: 'complete',
          description: 'Email/password and OAuth login',
          subtasks: [
            { id: 'email-login', name: 'Email login', completion: 100, status: 'complete' },
            { id: 'oauth', name: 'OAuth providers', completion: 100, status: 'complete' },
            { id: '2fa', name: 'Two-factor auth', completion: 100, status: 'complete' },
          ],
        },
        {
          id: 'rbac',
          name: 'Role-Based Access',
          completion: 80,
          priority: 'HIGH',
          status: 'in-progress',
          description: 'Permissions and role management',
          dependencies: ['login'],
          subtasks: [
            { id: 'roles', name: 'Define roles', completion: 100, status: 'complete' },
            { id: 'permissions', name: 'Permission system', completion: 90, status: 'in-progress' },
            { id: 'ui', name: 'Admin UI', completion: 50, status: 'in-progress' },
          ],
        },
      ],
    },
    {
      id: 'collab',
      name: 'Collaboration',
      completion: 40,
      description: 'Real-time collaboration features',
      features: [
        {
          id: 'chat',
          name: 'Team Chat',
          completion: 60,
          priority: 'HIGH',
          status: 'in-progress',
          description: 'Real-time messaging',
          subtasks: [
            { id: 'websocket', name: 'WebSocket setup', completion: 100, status: 'complete' },
            { id: 'ui-chat', name: 'Chat UI', completion: 70, status: 'in-progress' },
            { id: 'notifications', name: 'Notifications', completion: 10, status: 'pending' },
          ],
        },
        {
          id: 'sharing',
          name: 'File Sharing',
          completion: 20,
          priority: 'MEDIUM',
          status: 'in-progress',
          description: 'Upload and share files',
          subtasks: [
            { id: 's3', name: 'S3 integration', completion: 80, status: 'in-progress' },
            { id: 'upload-ui', name: 'Upload UI', completion: 0, status: 'pending' },
          ],
        },
      ],
    },
  ],
}

export default function ProductPage() {
  return <ProductStructureVisualizer data={myProduct} expandedByDefault={true} height="800px" />
}
```

## Layout Algorithm

The component uses a custom hierarchical tree layout:

### How It Works
1. **Tree Structure**: Product at top, domains spread horizontally, features below domains, subtasks below features
2. **Centering**: Each parent is centered over its subtree
3. **Spacing**:
   - Horizontal: 280px between siblings
   - Vertical: 140px between levels
4. **Expand/Collapse**: Recalculates layout when nodes are toggled
5. **Filtering**: Hides filtered nodes and reflows layout

### Layout Calculation
```typescript
// Pseudocode for layout algorithm
function calculateLayout(node, x, y) {
  // Calculate total width needed for all children
  const subtreeWidth = sum(node.children.map(calculateWidth))

  // Center parent over children
  const nodeX = x + (subtreeWidth - node.width) / 2

  // Position node
  setPosition(node, nodeX, y)

  // Layout children left-to-right
  let currentX = x
  for (const child of node.children) {
    calculateLayout(child, currentX, y + VERTICAL_SPACING)
    currentX += childWidth + HORIZONTAL_SPACING
  }
}
```

## Styling & Theming

### CSS Variables Used
```css
--color-primary: #10b981 (Emerald green)
--color-surface-glass: rgba(30, 41, 59, 0.8)
--color-border: rgba(148, 163, 184, 0.2)
```

### Node Styles by Level

**Product Node** (220x110px):
- Gradient: `linear-gradient(135deg, #10b981, #059669)`
- Icon: 🎯
- Font size: 1rem

**Domain Node** (200x100px):
- Gradient: `linear-gradient(135deg, #3b82f6, #2563eb)`
- Icon: 📦
- Font size: 0.9375rem

**Feature Node** (180x90px):
- Gradient: `linear-gradient(135deg, #8b5cf6, #7c3aed)`
- Icon: ✨
- Font size: 0.875rem

**Subtask Node** (160x70px):
- Gradient: `linear-gradient(135deg, #14b8a6, #0d9488)`
- Icon: 📝
- Font size: 0.8125rem

### Animations

```css
/* Progress bar pulse (for in-progress items) */
@keyframes progressPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* Modal fade in */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Modal slide up */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

## Performance Considerations

### Optimizations
- **Memoized Layout**: Layout recalculates only when structure or expand state changes
- **CSS Animations**: All animations use CSS (GPU-accelerated)
- **React Hooks**: `useMemo` for expensive calculations
- **Conditional Rendering**: Collapsed nodes are not rendered
- **Efficient Filters**: Filter logic runs once, cached in useMemo

### Scalability
- **Tested with**: 100+ total nodes (1 product, 5 domains, 20 features, 80 subtasks)
- **Recommended max**: 200 total nodes for smooth performance
- **Large datasets**: Consider pagination or lazy loading for features/subtasks

## Browser Support

| Browser | Minimum Version |
|---------|----------------|
| Chrome  | 90+            |
| Firefox | 88+            |
| Safari  | 14+            |
| Edge    | 90+            |

### Required Features
- CSS `backdrop-filter` (glassmorphism)
- CSS Grid & Flexbox
- ES6+ JavaScript
- React 18+
- React Flow 12+

## Troubleshooting

### Nodes overlapping
- Increase `HORIZONTAL_SPACING` or `VERTICAL_SPACING` constants
- Reduce node sizes in `LEVEL_STYLES`
- Decrease `initialZoom` prop

### Layout looks wrong
- Ensure all IDs are unique across all levels
- Check that parent-child relationships are correct
- Verify completion values are 0-100

### Performance issues
- Reduce total number of nodes
- Set `expandedByDefault={false}`
- Disable animations by removing `animated={true}` from edges
- Increase `initialZoom` to show less detail

### Filters not working
- Check that `interactive={true}` (default)
- Verify status/priority values match expected types
- Ensure search query is case-insensitive

## Testing

### Unit Tests
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { ProductStructureVisualizer } from './ProductStructureVisualizer'

test('renders product node', () => {
  render(<ProductStructureVisualizer />)
  expect(screen.getByText('agentful')).toBeInTheDocument()
})

test('expands domain on click', () => {
  render(<ProductStructureVisualizer />)
  const domainNode = screen.getByText('Agent System')
  fireEvent.click(domainNode)
  // Assert features are now visible
})

test('filters by status', () => {
  render(<ProductStructureVisualizer />)
  const completeButton = screen.getByText('Complete')
  fireEvent.click(completeButton)
  // Assert only complete items visible
})
```

### Integration Tests
```typescript
test('detail modal shows feature info', async () => {
  render(<ProductStructureVisualizer />)

  // Expand domain
  fireEvent.click(screen.getByText('Agent System'))

  // Click feature
  fireEvent.click(screen.getByText('Orchestrator Agent'))

  // Check modal content
  expect(screen.getByText('Central coordinator managing all specialist agents')).toBeInTheDocument()
  expect(screen.getByText('Task delegation (100%)')).toBeInTheDocument()
})

test('search filters nodes', () => {
  render(<ProductStructureVisualizer />)

  const searchInput = screen.getByPlaceholderText('Filter by name...')
  fireEvent.change(searchInput, { target: { value: 'orchestrator' } })

  // Only matching nodes should be visible
  expect(screen.queryByText('Documentation')).not.toBeInTheDocument()
})
```

## Implementation Notes

### Why Custom Layout?
We use a custom layout algorithm instead of dagre/elk because:
1. **Simplicity**: Hierarchical tree is straightforward
2. **Control**: Fine-tuned spacing and centering logic
3. **Performance**: No external library overhead
4. **Dependencies**: Keeps bundle size small

### State Management
```typescript
// Expand/collapse state
const [expandedNodes, setExpandedNodes] = useState<Set<string>>()

// Filters
const [statusFilter, setStatusFilter] = useState<'all' | NodeStatus>('all')
const [priorityFilter, setPriorityFilter] = useState<'all' | Priority>('all')
const [searchQuery, setSearchQuery] = useState('')

// Selected node for modal
const [selectedNode, setSelectedNode] = useState<string | null>(null)
```

### React Flow Integration
```typescript
// Custom node type
const nodeTypes = {
  hierarchyNode: HierarchyNode,
}

// Node/edge state from React Flow
const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

// Recalculate on filter/expand changes
useEffect(() => {
  setNodes(recalculateNodes())
  setEdges(recalculateEdges())
}, [expandedNodes, statusFilter, priorityFilter, searchQuery])
```

## Future Enhancements

Potential features for future versions:

- [ ] Export to PNG/SVG
- [ ] Drag-and-drop to reorder
- [ ] Inline editing of completion %
- [ ] Quality gate visualization on feature nodes
- [ ] Dependency arrows between features
- [ ] Time-based filtering (recent changes)
- [ ] Compare view (before/after)
- [ ] Heatmap mode (color by completion %)
- [ ] Collapsible sidebar with statistics
- [ ] Undo/redo for expand/collapse
- [ ] Saved filter presets
- [ ] Animated transitions on data changes

## License

MIT - Part of the agentful project

## Contributing

See the main agentful repository for contribution guidelines.
