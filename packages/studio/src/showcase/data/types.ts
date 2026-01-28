/**
 * Type definitions for the component showcase system
 */

import type { ComponentType, ReactNode } from 'react'

/**
 * Available component categories
 */
export type ComponentCategory =
  | 'navigation'
  | 'forms'
  | 'overlays'
  | 'data-display'
  | 'feedback'
  | 'layout'

/**
 * Component metadata structure
 */
export interface ComponentMeta {
  /** Display name of the component */
  name: string
  /** URL-safe slug for routing */
  slug: string
  /** Category this component belongs to */
  category: ComponentCategory
  /** Brief description of the component's purpose */
  description: string
  /** Link to official documentation */
  documentation: string
  /** List of component props */
  props: PropDefinition[]
  /** Usage examples for this component */
  examples: ComponentExample[]
  /** Related component slugs */
  relatedComponents: string[]
}

/**
 * Individual component example
 */
export interface ComponentExample {
  /** Unique identifier for this example */
  id: string
  /** Display title */
  title: string
  /** Brief description of what this example demonstrates */
  description: string
  /** Source code for this example */
  code: string
  /** React component that renders the example */
  preview: ComponentType
  /** Optional props passed to the preview */
  props?: Record<string, any>
}

/**
 * Component prop definition
 */
export interface PropDefinition {
  /** Prop name */
  name: string
  /** TypeScript type signature */
  type: string
  /** Whether this prop is required */
  required: boolean
  /** Default value (if optional) */
  default?: string
  /** Description of what this prop does */
  description: string
}

/**
 * Category metadata
 */
export interface CategoryMeta {
  /** Category identifier */
  id: ComponentCategory
  /** Display name */
  name: string
  /** Category description */
  description: string
  /** Icon name from lucide-react */
  icon: string
  /** Number of components in this category */
  count: number
}

/**
 * Component search result
 */
export interface ComponentSearchResult {
  /** Component metadata */
  component: ComponentMeta
  /** Matching score (for sorting) */
  score: number
  /** Matched field (name, description, or props) */
  matchedField: 'name' | 'description' | 'props'
}

/**
 * Showcase page state
 */
export interface ShowcaseState {
  /** Currently selected category */
  selectedCategory: ComponentCategory | 'all'
  /** Currently selected component */
  selectedComponent: string | null
  /** Currently selected variant */
  selectedVariant: string | null
  /** Search query */
  searchQuery: string
}

/**
 * Theme variant for component previews
 */
export type ThemeVariant = 'light' | 'dark' | 'system'

/**
 * Component preview configuration
 */
export interface PreviewConfig {
  /** Whether to show border around preview */
  showBorder: boolean
  /** Background color variant */
  background: 'default' | 'muted' | 'card' | 'transparent'
  /** Padding size */
  padding: 'none' | 'sm' | 'md' | 'lg'
  /** Theme for this preview */
  theme: ThemeVariant
}
