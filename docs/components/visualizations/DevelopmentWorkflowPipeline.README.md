# Development Workflow Pipeline Component

A beautiful, interactive React Flow visualization showing the development process pipeline from specification to deployment.

## Features

- **6 Pipeline Stages**: Spec → Implementation → Testing → Quality Gates → Review → Deploy
- **Decision Points**: Diamond-shaped decision nodes with Yes/No paths
- **Fixer Loop**: Automated remediation path from Quality Gates back to Implementation
- **Interactive Details**: Click any stage to see detailed breakdown with sub-steps
- **Status Indicators**: Visual badges showing Complete, In Progress, Pending, or Failed
- **Progress Tracking**: Progress bars for each stage and sub-step
- **Animated Flow**: Optional animated particles flowing along edges
- **Glassmorphism Design**: Beautiful backdrop blur effects and glow animations
- **Responsive**: Works on all screen sizes
- **Accessible**: Full ARIA labels and keyboard navigation support

## Installation

The component requires React Flow as a dependency (already included in the project):

```bash
npm install @xyflow/react
```

## Basic Usage

```tsx
import { DevelopmentWorkflowPipeline } from '@/components/visualizations/DevelopmentWorkflowPipeline'

export default function MyPage() {
  return (
    <DevelopmentWorkflowPipeline
      currentStage="implement"
      completedStages={['spec']}
      failedStages={[]}
      interactive={true}
      showControls={true}
      animatedFlow={true}
      orientation="horizontal"
      height="600px"
    />
  )
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `currentStage` | `StageId` | `undefined` | Highlight the currently active stage |
| `completedStages` | `StageId[]` | `[]` | Array of completed stage IDs |
| `failedStages` | `StageId[]` | `[]` | Array of failed stage IDs |
| `interactive` | `boolean` | `true` | Enable zoom, pan, and click interactions |
| `showControls` | `boolean` | `true` | Show zoom/pan controls |
| `animatedFlow` | `boolean` | `true` | Enable animated edges |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Pipeline flow direction |
| `height` | `string` | `'500px'` | Component height |

### StageId Type

```typescript
type StageId = 'spec' | 'implement' | 'test' | 'quality' | 'review' | 'deploy'
```

## Examples

### Example 1: Active Development

Shows the implementation stage in progress with spec completed:

```tsx
<DevelopmentWorkflowPipeline
  currentStage="implement"
  completedStages={['spec']}
  height="600px"
/>
```

### Example 2: Quality Gate Failure

Shows a failed quality gate triggering the fixer loop:

```tsx
<DevelopmentWorkflowPipeline
  currentStage="quality"
  completedStages={['spec', 'implement', 'test']}
  failedStages={['quality']}
  height="600px"
/>
```

### Example 3: Successful Deployment

Shows all stages complete through deployment:

```tsx
<DevelopmentWorkflowPipeline
  currentStage="deploy"
  completedStages={['spec', 'implement', 'test', 'quality', 'review']}
  height="600px"
/>
```

### Example 4: Vertical Orientation

Shows pipeline flowing vertically instead of horizontally:

```tsx
<DevelopmentWorkflowPipeline
  currentStage="test"
  completedStages={['spec', 'implement']}
  orientation="vertical"
  height="800px"
/>
```

### Example 5: Static (Non-Interactive)

For documentation or screenshots where interaction is not needed:

```tsx
import { DevelopmentWorkflowPipelineStatic } from '@/components/visualizations/DevelopmentWorkflowPipeline'

<DevelopmentWorkflowPipelineStatic
  currentStage="review"
  completedStages={['spec', 'implement', 'test', 'quality']}
  height="600px"
/>
```

## Pipeline Stages

### 1. Product Specification (spec)
- **Icon**: 📋
- **Color**: Blue (#3b82f6)
- **Agent**: Product Analyzer
- **Sub-steps**:
  - Write product spec
  - Analyze for gaps
  - Calculate readiness score

### 2. Implementation (implement)
- **Icon**: ⚙️
- **Color**: Purple (#8b5cf6)
- **Agent**: Architect, Backend, Frontend
- **Sub-steps**:
  - Architect designs system
  - Backend builds APIs
  - Frontend builds UI

### 3. Testing (test)
- **Icon**: 🧪
- **Color**: Amber (#f59e0b)
- **Agent**: Tester
- **Sub-steps**:
  - Write unit tests
  - Write integration tests
  - Write E2E tests

### 4. Quality Gates (quality)
- **Icon**: 🔍
- **Color**: Teal (#14b8a6)
- **Agent**: Reviewer
- **Sub-steps**:
  - Type checking
  - Linting
  - Coverage check
  - Security scan
  - Dead code detection

### 5. Final Review (review)
- **Icon**: ✅
- **Color**: Green (#10b981)
- **Agent**: Reviewer
- **Sub-steps**:
  - Code review
  - Manual testing
  - Documentation check

### 6. Deploy (deploy)
- **Icon**: 🚀
- **Color**: Emerald (#059669)
- **Agent**: Orchestrator
- **Sub-steps**:
  - Build production
  - Deploy to staging
  - Deploy to production

## Decision Points

### Quality Gates Decision
- **Position**: After Quality Gates stage
- **Question**: "All checks pass?"
- **Yes Path**: → Review (green edge)
- **No Path**: → Implementation (red dashed edge, labeled "🔧 Auto-fix")

### Review Decision
- **Position**: After Review stage
- **Question**: "Approved?"
- **Yes Path**: → Deploy (green edge)
- **No Path**: → Implementation (orange edge)

## Interactive Features

### Click Stage
Opens a detailed modal showing:
- Stage icon and name
- Responsible agent
- Current status (Complete, In Progress, Pending, Failed)
- Time spent
- Overall completion percentage
- All sub-steps with individual progress bars

### Hover Effects
- Stage nodes lift up with glow effect
- Decision diamonds glow
- Smooth transitions with cubic-bezier easing

### Keyboard Navigation
- **Tab**: Navigate between stages
- **Enter/Space**: Open stage details
- **Escape**: Close modal

### Zoom & Pan Controls
- **Mouse wheel**: Zoom in/out
- **Click + Drag**: Pan around
- **Control buttons**: Zoom in, zoom out, fit view, lock/unlock

## Animations

### Stage Pulse (Active Stages)
Active stages have a pulsing glow effect:
```css
@keyframes stagePulse {
  0%, 100% { box-shadow: 0 0 20px color-with-opacity; }
  50% { box-shadow: 0 0 40px color-with-opacity; }
}
```

### Checkmark (Completed Stages)
Status badges animate in when stage completes:
```css
@keyframes checkmark {
  0% { transform: scale(0) rotate(-45deg); opacity: 0; }
  50% { transform: scale(1.2) rotate(-45deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
```

### Shake (Failed Stages)
Failed stages shake to draw attention (when implemented):
```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}
```

## Styling

All styling uses inline styles with CSS variables for consistency:

- **Primary Color**: `#10b981` (Emerald green)
- **Surface Glass**: `rgba(30, 41, 59, 0.7)` with `backdrop-filter: blur(10px)`
- **Transition**: `all 0.2s cubic-bezier(0.4, 0, 0.2, 1)`
- **Glow Effect**: `box-shadow: 0 0 40px ${color}40`

## Accessibility

- **ARIA Labels**: All interactive elements have descriptive labels
- **Keyboard Support**: Full keyboard navigation
- **Focus Indicators**: Visible focus states
- **Screen Readers**: Meaningful announcements for stage transitions
- **Semantic HTML**: Proper use of roles and landmarks
- **Color Contrast**: High contrast text and borders

## MDX Usage

In MDX documentation files:

```mdx
import { DevelopmentWorkflowPipeline } from '@/components/visualizations/DevelopmentWorkflowPipeline'

# Development Workflow

Here's how agentful manages the development pipeline:

<DevelopmentWorkflowPipeline
  currentStage="implement"
  completedStages={['spec']}
  height="600px"
/>

The pipeline ensures quality at every stage...
```

## Troubleshooting

### Edges not showing
Make sure you've imported the React Flow styles:
```tsx
import '@xyflow/react/dist/style.css'
```

### Modal not closing
Check that you're handling the click event properly and not preventing propagation unexpectedly.

### Performance issues with animations
Disable animations for better performance:
```tsx
<DevelopmentWorkflowPipeline animatedFlow={false} />
```

### Layout issues on mobile
Reduce the height for mobile viewports:
```tsx
<DevelopmentWorkflowPipeline height="400px" />
```

## Related Components

- **AgentArchitectureFlow**: Shows agent hub-and-spoke architecture
- **ProductStructureVisualizer**: Shows product specification structure
- **Card Components**: Reusable glassmorphism card components

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (iOS 15.4+ for backdrop-filter)
- Mobile browsers: ✅ Touch-optimized

## License

MIT License - Part of the agentful project
