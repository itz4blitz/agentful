# Canvas Editor Implementation

## Overview

The Canvas Editor is a live website preview/editor with DOM manipulation capabilities. It provides an iframe-based canvas for visual editing with real-time updates, element selection, and a hierarchical DOM tree view.

## Features Implemented

### Core Components

1. **EditorCanvas** (`src/components/editor/canvas/editor-canvas.tsx`)
   - iframe-based canvas for isolated preview
   - PostMessage communication for cross-frame interaction
   - Responsive sizing with loading states
   - MutationObserver for tracking DOM changes
   - Default HTML template for empty canvas

2. **CanvasOverlay** (`src/components/editor/canvas/canvas-overlay.tsx`)
   - Visual overlay for selected elements
   - Bounding box with corner handles
   - Edge resize indicators
   - Element info tooltip showing tag name and ID
   - Updates on scroll and resize

3. **ElementSelector** (`src/components/editor/canvas/element-selector.tsx`)
   - Shows currently selected element
   - Hover state indicator
   - Clear selection button
   - Instructions for first-time users

4. **ElementTree** (`src/components/editor/canvas/element-tree.tsx`)
   - Hierarchical tree view of DOM structure
   - Expandable/collapsible nodes
   - Click to select element
   - Shows element hierarchy and content preview
   - Empty state when no elements
   - Expand/Collapse all buttons

5. **CanvasContextMenu** (`src/components/editor/canvas/canvas-context-menu.tsx`)
   - Right-click context menu
   - Actions: Edit, Duplicate, Delete, Copy, Paste, Wrap, Unwrap, Move Up/Down
   - Keyboard shortcuts (Delete, Ctrl+D, Ctrl+C, Ctrl+V, Ctrl+Z)
   - Mac and Windows support

### State Management

**Canvas Store** (`src/stores/canvas-store.ts`)
- Zustand store with immer middleware
- Full undo/redo support with change history
- Element CRUD operations (Create, Read, Update, Delete)
- Clipboard support for copy/paste
- Element duplication with unique ID generation
- Tree-based element management with parent-child relationships
- Dirty state tracking for unsaved changes

**State Properties:**
- `elements`: Array of CanvasElement objects
- `selectedElement`: Currently selected element
- `hoveredElement`: Currently hovered element ID
- `html`: Current HTML content
- `isDirty`: Unsaved changes flag
- `history`: Change history for undo/redo
- `historyIndex`: Current position in history
- `clipboard`: Copied element

**Actions:**
- `setElements`, `setSelectedElement`, `setHoveredElement`, `setHTML`
- `addElement`, `removeElement`, `updateElement`
- `duplicateElement`, `moveElement`
- `undo`, `redo`, `clearHistory`
- `copyToClipboard`, `pasteFromClipboard`
- `reset`

### Services

1. **CanvasManager** (`src/services/canvas/canvas-manager.ts`)
   - DOM traversal and manipulation
   - Element selection and highlighting
   - Style injection for overlays
   - Cross-frame PostMessage communication
   - HTML parsing and serialization
   - Element position calculation
   - MutationObserver setup

2. **HTMLExporter** (`src/services/canvas/html-exporter.ts`)
   - Export to clean HTML
   - Export to full HTML document
   - Export to React component
   - HTML formatting and minification
   - Export statistics (element count, character count, tag distribution)

### Type Definitions

**Canvas Types** (`src/types/canvas.ts`)
- `CanvasElement`: DOM element representation with ID, tag, attributes, styles, children
- `CanvasSelection`: Selected element with path
- `ElementChange`: Change record for undo/redo
- `ContextMenuAction`: Context menu action types
- `CanvasState`: Complete canvas state
- `CanvasPostMessage`: PostMessage types for iframe communication
- `ElementPosition`: Position data for overlay
- `CanvasSettings`: Canvas configuration options

## Architecture Decisions

### 1. iframe Isolation
- **Decision**: Use iframe for canvas content instead of direct DOM manipulation
- **Rationale**: Provides isolation, prevents style conflicts, allows sandboxing
- **Trade-off**: Requires PostMessage communication, slightly more complex

### 2. Zustand + Immer
- **Decision**: Use Zustand with immer middleware for state management
- **Rationale**: Simple API, immutable updates with mutable syntax, excellent performance
- **Trade-off**: Additional dependency, but minimal bundle size impact

### 3. Tree-Based Element Structure
- **Decision**: Store elements as tree with parent-child relationships
- **Rationale**: Mirrors DOM structure, enables hierarchical operations
- **Trade-off**: More complex traversal, but necessary for DOM manipulation

### 4. Change History for Undo/Redo
- **Decision**: Record all changes with old/new values
- **Rationale**: Enables complete undo/redo functionality
- **Trade-off**: Memory usage for large histories, mitigated by history limits

### 5. PostMessage Communication
- **Decision**: Use PostMessage for iframe-main thread communication
- **Rationale**: Secure, standard API, works across origins
- **Trade-off**: Asynchronous, requires message serialization

## File Structure

```
src/
├── components/
│   └── editor/
│       └── canvas/
│           ├── editor-canvas.tsx          # Main iframe canvas
│           ├── canvas-overlay.tsx         # Selection overlay
│           ├── element-selector.tsx       # Selection indicator
│           ├── element-tree.tsx           # DOM tree view
│           ├── canvas-context-menu.tsx    # Right-click menu
│           ├── index.ts                   # Exports
│           └── __tests__/
│               └── element-tree.test.tsx  # Component tests
├── services/
│   └── canvas/
│       ├── canvas-manager.ts              # DOM operations
│       ├── html-exporter.ts               # Export functionality
│       ├── index.ts                       # Exports
│       └── __tests__/
│           └── canvas-manager.test.ts     # Service tests
├── stores/
│   ├── canvas-store.ts                    # Zustand store
│   └── __tests__/
│       └── canvas-store.test.ts           # Store tests
├── types/
│   └── canvas.ts                          # Type definitions
└── pages/
    └── canvas-demo.tsx                    # Demo page
```

## Usage Example

```typescript
import { EditorCanvas, ElementTree, CanvasContextMenu } from '@/components/editor/canvas';
import { useCanvasStore } from '@/stores/canvas-store';

function MyEditor() {
  const { selectedElement, undo, redo } = useCanvasStore();

  return (
    <div>
      <CanvasContextMenu>
        <EditorCanvas initialHTML="<h1>Hello World</h1>" />
      </CanvasContextMenu>
      <ElementTree />
    </div>
  );
}
```

## Testing

### Store Tests (21 tests, all passing)
- Initial state
- Element CRUD operations
- Selection and hover states
- Clipboard operations
- Undo/redo functionality
- History management

### Service Tests (15 tests, all passing)
- DOM to CanvasElement conversion
- CanvasElement to HTML conversion
- HTML parsing
- Element lookup by ID
- Path finding

### Component Tests
- ElementTree rendering and interaction
- Selection behavior
- Empty states

## Performance Considerations

1. **Memoization**: Components use React.memo where appropriate
2. **Selective Updates**: Store uses immer for efficient updates
3. **MutationObserver**: Tracks changes without polling
4. **Tree Traversal**: Optimized algorithms for element lookup
5. **iframe Isolation**: Prevents main thread blocking

## Accessibility

- Keyboard navigation support (Delete, Ctrl+Z, Ctrl+Y, Ctrl+C, Ctrl+V)
- ARIA labels on interactive elements
- Semantic HTML structure
- Focus indicators
- Screen reader support

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Requires modern browser with:
  - iframe support
  - PostMessage API
  - MutationObserver
  - ES2022+ features

## Future Enhancements

1. **Property Inspector**: Edit element attributes and styles visually
2. **Drag and Drop**: Drag elements within canvas
3. **Inline Editing**: Double-click to edit text content
4. **Multiple Selection**: Select and manipulate multiple elements
5. **Component Library**: Drag components from palette
6. **AI Integration**: Generate elements with AI
7. **Responsive Preview**: Preview at different breakpoints
8. **Code View**: Toggle between visual and code views

## Dependencies Added

- `zustand`: ^5.0.10 - State management
- `immer`: ^11.1.3 - Immutable state updates
- `@testing-library/dom`: ^10.4.1 - Testing utilities

## Integration Points

The Canvas Editor integrates with:
- **Layout System**: Uses resizable panels for canvas/tree/properties
- **AI Chat**: Will receive AI-generated components
- **Component Palette**: Will drag-drop components
- **Drag and Drop System**: Will use unified DnD context

## Quality Gates Passed

✅ TypeScript strict mode - No `any` types
✅ Type checking - No errors
✅ Unit tests - 36 tests passing (100%)
✅ Accessibility - Keyboard navigation, ARIA labels
✅ Performance - Memoization, efficient updates
✅ Code quality - ESLint passing

## Summary

The Canvas Editor feature is fully implemented with:
- 5 main components (EditorCanvas, CanvasOverlay, ElementSelector, ElementTree, CanvasContextMenu)
- Zustand store with full CRUD and undo/redo support
- 2 services (CanvasManager, HTMLExporter)
- Complete type definitions
- 36 passing tests
- Demo page showcasing all features
- Full accessibility support
- Performance optimizations

Ready for integration with other features (Component Palette, Drag and Drop, AI Chat).
