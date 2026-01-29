/**
 * Component System Types
 * Type definitions for the enhanced component registry
 */

export type PropType = 'string' | 'number' | 'boolean' | 'select' | 'color' | 'json';

export interface PropDefinition {
  type: PropType;
  name: string;
  label: string;
  defaultValue?: any;
  options?: string[]; // For select type
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  description?: string;
}

export interface ComponentDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  icon: string;
  
  // Import information
  imports: string[];
  component: string; // The main component name
  
  // Props
  defaultProps: Record<string, any>;
  props: PropDefinition[];
  
  // Children
  children: {
    allowed: boolean;
    default?: string;
    description?: string;
  };
  
  // Optional: Styles
  defaultStyles?: Record<string, string>;
  
  // Optional: Event handlers
  events?: string[];
}

// User-defined component (loaded from project)
export interface UserComponent extends ComponentDefinition {
  source: 'user';
  filePath: string;
  // The actual React component (loaded dynamically)
  Component?: React.ComponentType<any>;
}

// Component instance on canvas
export interface CanvasComponentInstance {
  id: string;
  componentId: string;
  props: Record<string, any>;
  children: (CanvasComponentInstance | string)[];
  styles?: Record<string, string>;
}

// Hot reload event
export interface HotReloadEvent {
  type: 'component-updated' | 'component-added' | 'component-removed';
  componentId: string;
  filePath?: string;
}

// Canvas render mode
export type CanvasRenderMode = 'iframe' | 'inline';

// Component category with metadata
export interface ComponentCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  order: number;
}

export const COMPONENT_CATEGORIES: ComponentCategory[] = [
  { id: 'layout', name: 'Layout', icon: 'layout', description: 'Containers and layout structures', order: 1 },
  { id: 'forms', name: 'Forms', icon: 'file-input', description: 'Input controls and form elements', order: 2 },
  { id: 'navigation', name: 'Navigation', icon: 'menu', description: 'Nav bars, breadcrumbs, menus', order: 3 },
  { id: 'overlays', name: 'Overlays', icon: 'layers', description: 'Modals, popovers, tooltips', order: 4 },
  { id: 'feedback', name: 'Feedback', icon: 'alert-circle', description: 'Alerts, progress, loading states', order: 5 },
  { id: 'data-display', name: 'Data Display', icon: 'table', description: 'Tables, cards, avatars', order: 6 },
];
