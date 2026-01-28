/**
 * Component Types
 * Type definitions for the Component Palette system
 */

/**
 * Component categories for organizing the palette
 */
export type ComponentCategory =
  | 'layout'
  | 'typography'
  | 'forms'
  | 'navigation'
  | 'data-display'
  | 'feedback'
  | 'media'
  | 'overlays';

/**
 * Component template metadata and content
 */
export interface ComponentTemplate {
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

/**
 * Palette state management
 */
export interface PaletteState {
  components: ComponentTemplate[];
  expandedCategories: ComponentCategory[];
  selectedComponent: string | null;
  searchQuery: string;
  selectedTags: string[];
  viewMode: 'grid' | 'list';
}

/**
 * Filter options for components
 */
export interface ComponentFilter {
  query: string;
  categories: ComponentCategory[];
  tags: string[];
}

/**
 * Component palette props
 */
export interface ComponentPaletteProps {
  onComponentSelect?: (componentId: string) => void;
  className?: string;
}

/**
 * Component category props
 */
export interface ComponentCategoryProps {
  category: ComponentCategory;
  components: ComponentTemplate[];
  isExpanded: boolean;
  onToggle: () => void;
  onComponentSelect: (componentId: string) => void;
}

/**
 * Component card props
 */
export interface ComponentCardProps {
  component: ComponentTemplate;
  viewMode: 'grid' | 'list';
  onSelect: (componentId: string) => void;
  isDraggable?: boolean;
}

/**
 * Palette search props
 */
export interface PaletteSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  allTags: string[];
}

/**
 * Drag data for component palette
 */
export interface ComponentDragData {
  componentId: string;
  component: ComponentTemplate;
}

/**
 * Default palette state
 */
export const DEFAULT_PALETTE_STATE: PaletteState = {
  components: [],
  expandedCategories: ['layout', 'typography'],
  selectedComponent: null,
  searchQuery: '',
  selectedTags: [],
  viewMode: 'grid',
};

/**
 * Component category metadata
 */
export const CATEGORY_INFO: Record<
  ComponentCategory,
  { label: string; icon: string; description: string }
> = {
  layout: {
    label: 'Layout',
    icon: 'layout',
    description: 'Containers and layout structures',
  },
  typography: {
    label: 'Typography',
    icon: 'type',
    description: 'Text and heading components',
  },
  forms: {
    label: 'Forms',
    icon: 'file-input',
    description: 'Input and form controls',
  },
  navigation: {
    label: 'Navigation',
    icon: 'menu',
    description: 'Navigation and menu components',
  },
  'data-display': {
    label: 'Data Display',
    icon: 'table',
    description: 'Tables, lists, and cards',
  },
  feedback: {
    label: 'Feedback',
    icon: 'alert-circle',
    description: 'Alerts, toasts, and notifications',
  },
  media: {
    label: 'Media',
    icon: 'image',
    description: 'Images, videos, and galleries',
  },
  overlays: {
    label: 'Overlays',
    icon: 'layers',
    description: 'Modals, tooltips, and popovers',
  },
};
