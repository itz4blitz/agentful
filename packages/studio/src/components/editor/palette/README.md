# Component Palette

A draggable, searchable component library for the Visual Website Builder with categorization and filtering capabilities.

## Features

- **50+ Pre-built Components**: Organized across 8 categories (Layout, Typography, Forms, Navigation, Data Display, Feedback, Media, Overlays)
- **Drag & Drop**: Built with @dnd-kit for smooth drag and drop to canvas
- **Advanced Search**: Real-time search with debouncing
- **Tag Filtering**: Filter components by tags
- **Collapsible Categories**: Expand/collapse component categories
- **View Modes**: Toggle between grid and list views
- **State Management**: Zustand store with persistence
- **Accessibility**: Keyboard navigation and ARIA labels
- **Responsive Design**: Works on all screen sizes

## Components

### ComponentPalette
Main container component that orchestrates the entire palette system.

```tsx
import { ComponentPalette } from '@/components/editor/palette';

<ComponentPalette onComponentSelect={(componentId) => {
  console.log('Selected:', componentId);
}} />
```

### ComponentCategory
Collapsible category section with component cards.

```tsx
import { ComponentCategory } from '@/components/editor/palette';

<ComponentCategory
  category="layout"
  components={components}
  isExpanded={true}
  onToggle={() => {}}
  onComponentSelect={(id) => {}}
  viewMode="grid"
/>
```

### ComponentCard
Individual draggable component card with preview and metadata.

```tsx
import { ComponentCard } from '@/components/editor/palette';

<ComponentCard
  component={componentTemplate}
  viewMode="grid"
  onSelect={(id) => {}}
  isDraggable={true}
/>
```

### PaletteSearch
Search and filter components with debounced input and tag selection.

```tsx
import { PaletteSearch } from '@/components/editor/palette';

<PaletteSearch
  query={searchQuery}
  onQueryChange={setQuery}
  selectedTags={tags}
  onTagsChange={setTags}
  allTags={allTags}
/>
```

## Store

### usePaletteStore

```tsx
import { usePaletteStore } from '@/stores/palette-store';

function MyComponent() {
  const {
    components,
    searchQuery,
    selectedTags,
    viewMode,
    expandedCategories,
    setSearchQuery,
    setSelectedTags,
    setViewMode,
    toggleCategory,
    getFilteredComponents,
  } = usePaletteStore();

  // Use state and actions
}
```

#### State

- `components: ComponentTemplate[]` - All available components
- `expandedCategories: ComponentCategory[]` - Currently expanded categories
- `selectedComponent: string | null` - Currently selected component ID
- `searchQuery: string` - Current search query
- `selectedTags: string[]` - Selected filter tags
- `viewMode: 'grid' | 'list'` - Current view mode

#### Actions

- `setComponents(components)` - Set components list
- `toggleCategory(category)` - Toggle category expansion
- `expandAllCategories()` - Expand all categories
- `collapseAllCategories()` - Collapse all categories
- `setSelectedComponent(id)` - Set selected component
- `setSearchQuery(query)` - Set search query
- `setSelectedTags(tags)` - Set selected tags
- `addTag(tag)` - Add a tag
- `removeTag(tag)` - Remove a tag
- `setViewMode(mode)` - Set view mode
- `reset()` - Reset to initial state

#### Computed

- `getFilteredComponents()` - Get filtered components
- `getAllTags()` - Get all unique tags
- `getComponentsByCategory(category)` - Get components by category

## Component Registry

### ComponentTemplate

```tsx
interface ComponentTemplate {
  id: string;
  name: string;
  description: string;
  category: ComponentCategory;
  tags: string[];
  icon: string;
  thumbnail?: string;
  html: string;
  react?: string;
  css?: string;
  dependencies?: string[];
}
```

### Register Custom Components

```tsx
import { componentRegistry } from '@/services/components/component-registry';

componentRegistry.registerComponent({
  id: 'my-component',
  name: 'My Component',
  description: 'A custom component',
  category: 'layout',
  tags: ['custom', 'my-tag'],
  icon: 'square',
  html: '<div>My HTML</div>',
  css: '.my-class { color: red; }',
});
```

## Categories

- `layout` - Containers and layout structures
- `typography` - Text and heading components
- `forms` - Input and form controls
- `navigation` - Navigation and menu components
- `data-display` - Tables, lists, and cards
- `feedback` - Alerts, toasts, and notifications
- `media` - Images, videos, and galleries
- `overlays` - Modals, tooltips, and popovers

## Usage Example

```tsx
import { ComponentPalette } from '@/components/editor/palette';
import { DndContext } from '@dnd-kit/core';

function Editor() {
  const handleComponentSelect = (componentId: string) => {
    console.log('Selected component:', componentId);
  };

  return (
    <DndContext>
      <ComponentPalette onComponentSelect={handleComponentSelect} />
    </DndContext>
  );
}
```

## Testing

```bash
# Run palette tests
npm test palette

# Run specific test file
npm test component-palette.test.tsx
```

## Performance

- Memoized components prevent unnecessary re-renders
- Debounced search input (300ms)
- Virtual scrolling for large lists (future enhancement)
- Optimized drag and drop with @dnd-kit

## Accessibility

- Full keyboard navigation
- ARIA labels on all interactive elements
- Semantic HTML structure
- Focus indicators
- Screen reader support

## Future Enhancements

- [ ] Component thumbnails/previews
- [ ] Custom component registration UI
- [ ] Component favorites
- [ ] Recently used components
- [ ] Component templates
- [ ] Export/import custom components
- [ ] Component versioning
- [ ] Component dependencies resolution
