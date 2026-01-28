/**
 * Component Registry
 * Registry of available components for the palette
 */

import type { ComponentTemplate, ComponentCategory } from '@/types/components';
import { CATEGORY_INFO } from '@/types/components';
import { SHADCN_COMPONENTS } from './shadcn-registry';

/**
 * Pre-defined component templates
 */
const COMPONENT_TEMPLATES: ComponentTemplate[] = [
  // ShadCN UI Components
  ...SHADCN_COMPONENTS,

  // Layout Components
  {
    id: 'container',
    name: 'Container',
    description: 'Responsive container with max-width',
    category: 'layout',
    tags: ['container', 'wrapper', 'responsive'],
    icon: 'square',
    html: `<div class="container" style="max-width: 1200px; margin: 0 auto; padding: 0 20px;">
  <!-- Content goes here -->
</div>`,
    css: `.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}`,
  },
  {
    id: 'row',
    name: 'Row',
    description: 'Flex row with gap between items',
    category: 'layout',
    tags: ['flex', 'row', 'horizontal'],
    icon: 'columns',
    html: `<div class="row" style="display: flex; gap: 20px; align-items: stretch;">
  <div class="col">Column 1</div>
  <div class="col">Column 2</div>
  <div class="col">Column 3</div>
</div>`,
  },
  {
    id: 'column',
    name: 'Column',
    description: 'Flex column with gap between items',
    category: 'layout',
    tags: ['flex', 'column', 'vertical'],
    icon: 'rows',
    html: `<div class="column" style="display: flex; flex-direction: column; gap: 20px;">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>`,
  },
  {
    id: 'grid',
    name: 'Grid',
    description: 'CSS Grid layout with responsive columns',
    category: 'layout',
    tags: ['grid', 'layout', 'responsive'],
    icon: 'grid',
    html: `<div class="grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
  <div class="grid-item">Grid Item 1</div>
  <div class="grid-item">Grid Item 2</div>
  <div class="grid-item">Grid Item 3</div>
  <div class="grid-item">Grid Item 4</div>
</div>`,
  },
  {
    id: 'stack',
    name: 'Stack',
    description: 'Simple stacked layout',
    category: 'layout',
    tags: ['stack', 'vertical', 'simple'],
    icon: 'stack',
    html: `<div class="stack" style="display: flex; flex-direction: column; gap: 10px;">
  <div>Stack Item 1</div>
  <div>Stack Item 2</div>
</div>`,
  },

  // Typography Components
  {
    id: 'heading-1',
    name: 'Heading 1',
    description: 'Large heading for main titles',
    category: 'typography',
    tags: ['heading', 'h1', 'title', 'text'],
    icon: 'heading-1',
    html: `<h1 style="font-size: 2.5rem; font-weight: 700; margin: 0; line-height: 1.2;">
  Heading 1
</h1>`,
  },
  {
    id: 'heading-2',
    name: 'Heading 2',
    description: 'Medium heading for section titles',
    category: 'typography',
    tags: ['heading', 'h2', 'subtitle', 'text'],
    icon: 'heading-2',
    html: `<h2 style="font-size: 2rem; font-weight: 600; margin: 0; line-height: 1.3;">
  Heading 2
</h2>`,
  },
  {
    id: 'heading-3',
    name: 'Heading 3',
    description: 'Small heading for subsections',
    category: 'typography',
    tags: ['heading', 'h3', 'text'],
    icon: 'heading-3',
    html: `<h3 style="font-size: 1.5rem; font-weight: 600; margin: 0; line-height: 1.4;">
  Heading 3
</h3>`,
  },
  {
    id: 'paragraph',
    name: 'Paragraph',
    description: 'Standard paragraph text',
    category: 'typography',
    tags: ['text', 'paragraph', 'body'],
    icon: 'align-left',
    html: `<p style="font-size: 1rem; line-height: 1.6; margin: 0;">
  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
</p>`,
  },
  {
    id: 'text-link',
    name: 'Link',
    description: 'Text hyperlink',
    category: 'typography',
    tags: ['link', 'anchor', 'text'],
    icon: 'link',
    html: `<a href="#" style="color: #0066cc; text-decoration: underline;">
  Click here
</a>`,
  },
  {
    id: 'blockquote',
    name: 'Blockquote',
    description: 'Quoted text block',
    category: 'typography',
    tags: ['quote', 'blockquote', 'text'],
    icon: 'quote',
    html: `<blockquote style="border-left: 4px solid #ccc; padding-left: 20px; margin: 20px 0; font-style: italic; color: #555;">
  "This is a blockquote. Use it for quotes and testimonials."
</blockquote>`,
  },

  // Navigation Components
  {
    id: 'navbar',
    name: 'Navbar',
    description: 'Horizontal navigation bar',
    category: 'navigation',
    tags: ['nav', 'navbar', 'menu', 'header'],
    icon: 'menu',
    html: `<nav style="display: flex; justify-content: space-between; align-items: center; padding: 20px; background-color: #f8f8f8; border-bottom: 1px solid #ddd;">
  <div class="logo" style="font-weight: bold; font-size: 1.2rem;">Logo</div>
  <ul style="display: flex; gap: 20px; list-style: none; margin: 0; padding: 0;">
    <li><a href="#" style="text-decoration: none; color: #333;">Home</a></li>
    <li><a href="#" style="text-decoration: none; color: #333;">About</a></li>
    <li><a href="#" style="text-decoration: none; color: #333;">Contact</a></li>
  </ul>
</nav>`,
  },
  {
    id: 'sidebar',
    name: 'Sidebar',
    description: 'Vertical sidebar navigation',
    category: 'navigation',
    tags: ['sidebar', 'nav', 'menu'],
    icon: 'sidebar',
    html: `<aside style="width: 250px; padding: 20px; background-color: #f8f8f8; border-right: 1px solid #ddd;">
  <nav>
    <ul style="list-style: none; padding: 0; margin: 0;">
      <li style="margin-bottom: 10px;"><a href="#" style="text-decoration: none; color: #333; display: block; padding: 8px;">Dashboard</a></li>
      <li style="margin-bottom: 10px;"><a href="#" style="text-decoration: none; color: #333; display: block; padding: 8px;">Projects</a></li>
      <li style="margin-bottom: 10px;"><a href="#" style="text-decoration: none; color: #333; display: block; padding: 8px;">Settings</a></li>
    </ul>
  </nav>
</aside>`,
  },
  {
    id: 'breadcrumb',
    name: 'Breadcrumb',
    description: 'Breadcrumb navigation',
    category: 'navigation',
    tags: ['breadcrumb', 'nav', 'navigation'],
    icon: 'chevrons-right',
    html: `<nav style="padding: 10px 0;">
  <ol style="display: flex; gap: 8px; list-style: none; margin: 0; padding: 0; font-size: 0.9rem;">
    <li><a href="#" style="color: #0066cc; text-decoration: none;">Home</a></li>
    <li style="color: #999;">/</li>
    <li><a href="#" style="color: #0066cc; text-decoration: none;">Category</a></li>
    <li style="color: #999;">/</li>
    <li style="color: #666;">Current Page</li>
  </ol>
</nav>`,
  },

  // Data Display Components
  {
    id: 'table',
    name: 'Table',
    description: 'Data table with headers',
    category: 'data-display',
    tags: ['table', 'data', 'grid'],
    icon: 'table',
    html: `<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
  <thead>
    <tr style="background-color: #f8f8f8;">
      <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Column 1</th>
      <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Column 2</th>
      <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Column 3</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">Data 1</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">Data 2</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">Data 3</td>
    </tr>
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">Data 4</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">Data 5</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">Data 6</td>
    </tr>
  </tbody>
</table>`,
  },
  {
    id: 'list',
    name: 'List',
    description: 'Unordered list',
    category: 'data-display',
    tags: ['list', 'ul', 'items'],
    icon: 'list',
    html: `<ul style="list-style: disc; padding-left: 20px; margin: 20px 0;">
  <li style="margin-bottom: 8px;">List item 1</li>
  <li style="margin-bottom: 8px;">List item 2</li>
  <li style="margin-bottom: 8px;">List item 3</li>
</ul>`,
  },
  {
    id: 'avatar',
    name: 'Avatar',
    description: 'User avatar image',
    category: 'data-display',
    tags: ['avatar', 'image', 'user'],
    icon: 'user',
    html: `<div style="width: 40px; height: 40px; border-radius: 50%; background-color: #ddd; display: flex; align-items: center; justify-content: center; overflow: hidden;">
  <img src="https://via.placeholder.com/40" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover;" />
</div>`,
  },

  // Media Components
  {
    id: 'image',
    name: 'Image',
    description: 'Responsive image',
    category: 'media',
    tags: ['image', 'img', 'media'],
    icon: 'image',
    html: `<img src="https://via.placeholder.com/400x300" alt="Placeholder image" style="max-width: 100%; height: auto; border-radius: 4px;" />`,
  },
  {
    id: 'video',
    name: 'Video',
    description: 'HTML5 video player',
    category: 'media',
    tags: ['video', 'media', 'player'],
    icon: 'video',
    html: `<video controls style="max-width: 100%; border-radius: 4px;">
  <source src="video.mp4" type="video/mp4" />
  Your browser does not support the video tag.
</video>`,
  },
  {
    id: 'gallery',
    name: 'Image Gallery',
    description: 'Grid of images',
    category: 'media',
    tags: ['gallery', 'images', 'grid'],
    icon: 'image',
    html: `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
  <img src="https://via.placeholder.com/150" alt="Gallery 1" style="width: 100%; border-radius: 4px;" />
  <img src="https://via.placeholder.com/150" alt="Gallery 2" style="width: 100%; border-radius: 4px;" />
  <img src="https://via.placeholder.com/150" alt="Gallery 3" style="width: 100%; border-radius: 4px;" />
  <img src="https://via.placeholder.com/150" alt="Gallery 4" style="width: 100%; border-radius: 4px;" />
</div>`,
  },
];

/**
 * Component Registry Service
 */
class ComponentRegistryService {
  private components: Map<string, ComponentTemplate>;

  constructor() {
    this.components = new Map();
    this.loadComponents();
  }

  /**
   * Load all components into registry
   */
  private loadComponents(): void {
    COMPONENT_TEMPLATES.forEach((component) => {
      this.components.set(component.id, component);
    });
  }

  /**
   * Get all components
   */
  getAllComponents(): ComponentTemplate[] {
    return Array.from(this.components.values());
  }

  /**
   * Get component by ID
   */
  getComponent(id: string): ComponentTemplate | undefined {
    return this.components.get(id);
  }

  /**
   * Get components by category
   */
  getComponentsByCategory(category: ComponentCategory): ComponentTemplate[] {
    return this.getAllComponents().filter((c) => c.category === category);
  }

  /**
   * Search components by query
   */
  searchComponents(query: string): ComponentTemplate[] {
    const normalizedQuery = query.toLowerCase().trim();

    if (!normalizedQuery) {
      return this.getAllComponents();
    }

    return this.getAllComponents().filter(
      (component) =>
        component.name.toLowerCase().includes(normalizedQuery) ||
        component.description.toLowerCase().includes(normalizedQuery) ||
        component.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))
    );
  }

  /**
   * Filter components by tags
   */
  filterByTags(components: ComponentTemplate[], tags: string[]): ComponentTemplate[] {
    if (tags.length === 0) {
      return components;
    }

    return components.filter((component) =>
      tags.some((tag) => component.tags.includes(tag))
    );
  }

  /**
   * Get all unique tags
   */
  getAllTags(): string[] {
    const tags = new Set<string>();
    this.getAllComponents().forEach((component) => {
      component.tags.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }

  /**
   * Get all categories
   */
  getAllCategories(): ComponentCategory[] {
    return Object.keys(CATEGORY_INFO) as ComponentCategory[];
  }

  /**
   * Register a custom component
   */
  registerComponent(component: ComponentTemplate): void {
    this.components.set(component.id, component);
  }

  /**
   * Unregister a component
   */
  unregisterComponent(id: string): boolean {
    return this.components.delete(id);
  }
}

// Singleton instance
export const componentRegistry = new ComponentRegistryService();
