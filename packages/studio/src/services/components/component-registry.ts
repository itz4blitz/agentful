import { SHADCN_COMPONENTS } from './shadcn-registry'

/**
 * Component template interface
 * Defines the structure for all component templates in the registry
 */
export interface ComponentTemplate {
  /** Unique identifier for the component */
  id: string

  /** Display name of the component */
  name: string

  /** Category for organizing components (forms, layout, navigation, etc.) */
  category: string

  /** Human-readable description of what the component does */
  description: string

  /** Searchable tags for filtering and discovery */
  tags: string[]

  /** Icon name (lucide-react icon) for visual identification */
  icon: string

  /** HTML/JSX template code for the component */
  html: string
}

/**
 * Master component registry
 * Aggregates all component templates from different sources
 */
export const COMPONENT_TEMPLATES: ComponentTemplate[] = [
  // ShadCN UI components
  ...SHADCN_COMPONENTS,

  // Future component sources can be added here:
  // ...CUSTOM_COMPONENTS,
  // ...THIRD_PARTY_COMPONENTS,
]

/**
 * Get components by category
 */
export function getComponentsByCategory(category: string): ComponentTemplate[] {
  return COMPONENT_TEMPLATES.filter((component) => component.category === category)
}

/**
 * Get component by ID
 */
export function getComponentById(id: string): ComponentTemplate | undefined {
  return COMPONENT_TEMPLATES.find((component) => component.id === id)
}

/**
 * Search components by query (searches name, description, and tags)
 */
export function searchComponents(query: string): ComponentTemplate[] {
  const lowerQuery = query.toLowerCase()
  return COMPONENT_TEMPLATES.filter(
    (component) =>
      component.name.toLowerCase().includes(lowerQuery) ||
      component.description.toLowerCase().includes(lowerQuery) ||
      component.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  )
}

/**
 * Get all unique categories
 */
export function getCategories(): string[] {
  return Array.from(new Set(COMPONENT_TEMPLATES.map((component) => component.category))).sort()
}
