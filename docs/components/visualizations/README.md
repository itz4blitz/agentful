# Visualizations Components

Interactive React Flow visualizations for agentful documentation.

## Components

### AgentArchitectureFlow

Interactive diagram showing agentful's hub-and-spoke agent architecture.

**Features**:
- 8 nodes (1 orchestrator + 7 specialists) in hexagonal formation
- Bidirectional animated edges showing delegation flow
- Click nodes to view agent details, skills, and responsibilities
- Zoom, pan, and drag controls
- Mini-map for navigation
- Glassmorphism styling with emerald green theme
- Fully accessible (ARIA labels, keyboard navigation)
- Responsive design

**Usage**:

```tsx
import { AgentArchitectureFlow } from '@/components/visualizations'

// Default interactive version
<AgentArchitectureFlow />

// Custom configuration
<AgentArchitectureFlow
  interactive={true}
  showControls={true}
  initialZoom={0.8}
  height="600px"
/>

// Static version for documentation
import { AgentArchitectureFlowStatic } from '@/components/visualizations'

<AgentArchitectureFlowStatic height="500px" />
```

**Props**:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `interactive` | `boolean` | `true` | Enable zoom, pan, drag, and click interactions |
| `showControls` | `boolean` | `true` | Show zoom/pan controls |
| `initialZoom` | `number` | `0.8` | Initial zoom level (0.5 - 1.5) |
| `height` | `string` | `'600px'` | Component height |

**Agent Details**:

Each node displays:
- Icon (emoji)
- Agent name
- Color-coded connections
- On click: Modal with description and skills

**Styling**:

The component uses inline styles with CSS variables for consistency:
- `--color-primary`: #10b981 (emerald green)
- Glassmorphism: `backdrop-filter: blur(10px)`
- Animations: 200ms cubic-bezier(0.4, 0, 0.2, 1)
- Glow effects: `box-shadow` with agent color + opacity

**Accessibility**:

- ARIA labels on all interactive elements
- Keyboard navigation support (Tab, Enter, Space)
- Screen reader announcements
- Semantic HTML structure
- Focus indicators

**Performance**:

- React Flow handles virtualization automatically
- Nodes only re-render on state changes
- Animations use CSS for 60fps performance
- Tooltips rendered on demand

## Development

### Adding New Visualizations

1. Create new component in this directory
2. Export from `index.ts`
3. Follow existing patterns:
   - Use inline styles with CSS variables
   - Include accessibility features
   - Support responsive design
   - Add TypeScript interfaces
   - Include examples in MDX

### Testing

```bash
# Build docs to verify component
npm run docs:build

# View locally
npm run docs:dev
```

### Dependencies

- `@xyflow/react` - React Flow library for interactive diagrams
- `react` - UI library

## Examples

See `AgentArchitectureFlow.example.mdx` for comprehensive examples and usage patterns.

## File Structure

```
visualizations/
├── README.md                                    # This file
├── index.ts                                     # Barrel exports
├── IMPLEMENTATION.md                            # Implementation guide
├── AgentArchitectureFlow.tsx                    # Agent architecture diagram
├── AgentArchitectureFlow.example.mdx            # Agent architecture examples
├── ProductStructureVisualizer.tsx               # Product hierarchy tree
├── ProductStructureVisualizer.example.mdx       # Product structure examples
└── ProductStructureVisualizer.README.md         # Comprehensive documentation
```

### ProductStructureVisualizer

Interactive hierarchical tree showing Product → Domains → Features → Subtasks with completion tracking.

**Features**:
- 4-level hierarchy with expand/collapse
- Real-time progress bars on all nodes
- Status badges (Complete/In Progress/Pending)
- Priority indicators (CRITICAL/HIGH/MEDIUM/LOW)
- Advanced filtering (status, priority, search)
- Detail modal with full information
- Custom tree layout algorithm
- Animated edges for in-progress items
- Glassmorphism design with emerald green theme
- Full keyboard navigation and accessibility

**Usage**:

```tsx
import { ProductStructureVisualizer } from '@/components/visualizations'

// Default interactive version
<ProductStructureVisualizer />

// Expanded by default
<ProductStructureVisualizer expandedByDefault={true} />

// Custom configuration
<ProductStructureVisualizer
  interactive={true}
  showControls={true}
  initialZoom={0.6}
  height="700px"
/>

// Static version for documentation
import { ProductStructureVisualizerStatic } from '@/components/visualizations'

<ProductStructureVisualizerStatic height="600px" />
```

**Props**:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `ProductStructure` | Sample data | Product hierarchy data |
| `interactive` | `boolean` | `true` | Enable expand, filter, and click |
| `showControls` | `boolean` | `true` | Show zoom/pan controls |
| `initialZoom` | `number` | `0.6` | Initial zoom level (0.3 - 1.5) |
| `height` | `string` | `'700px'` | Component height |
| `expandedByDefault` | `boolean` | `false` | Expand all nodes on mount |

**Node Types**:

- **Product**: Top-level node (220x110px) with emerald gradient
- **Domain**: Second-level (200x100px) with blue gradient
- **Feature**: Third-level (180x90px) with purple gradient, status + priority badges
- **Subtask**: Fourth-level (160x70px) with teal gradient, status badge

**Filtering**:

- **Search**: Filter by node name (case-insensitive)
- **Status**: Show only Complete/In Progress/Pending items
- **Priority**: Show only CRITICAL/HIGH/MEDIUM/LOW features
- **Reset**: Clear all filters at once

**Data Structure**:

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
    completion: number
    description?: string
    features: Array<{
      id: string
      name: string
      completion: number
      priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
      status: 'complete' | 'in-progress' | 'pending'
      description?: string
      dependencies?: string[]
      subtasks: Array<{
        id: string
        name: string
        completion: number
        status: 'complete' | 'in-progress' | 'pending'
      }>
    }>
  }>
}
```

**Layout Algorithm**:

Custom hierarchical tree layout with:
- Top-to-bottom structure
- Parent centered over children
- Horizontal spacing: 280px between siblings
- Vertical spacing: 140px between levels
- Automatic recalculation on expand/filter

See `ProductStructureVisualizer.README.md` for comprehensive documentation.

## Future Visualizations

Planned additions:
- Workflow state machine diagram
- Quality gates pipeline visualization
- Feature completion timeline
- Decision tree explorer
- Tech stack analyzer output
