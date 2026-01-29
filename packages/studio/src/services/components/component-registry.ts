/**
 * Component Registry
 * Registry of available components for the palette
 */

import type { ComponentTemplate, ComponentCategory } from '@/types/components';
import { CATEGORY_INFO } from '@/types/components';

// Re-export ComponentTemplate for use in other modules
export type { ComponentTemplate };

/**
 * Pre-defined component templates
 */
const COMPONENT_TEMPLATES: ComponentTemplate[] = [
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

  // Form Components
  {
    id: 'input-text',
    name: 'Text Input',
    description: 'Standard text input field',
    category: 'forms',
    tags: ['input', 'form', 'text'],
    icon: 'type',
    html: `<input type="text" placeholder="Enter text..." style="padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; width: 100%; box-sizing: border-box;" />`,
  },
  {
    id: 'input-email',
    name: 'Email Input',
    description: 'Email input field',
    category: 'forms',
    tags: ['input', 'form', 'email'],
    icon: 'mail',
    html: `<input type="email" placeholder="your@email.com" style="padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; width: 100%; box-sizing: border-box;" />`,
  },
  {
    id: 'textarea',
    name: 'Textarea',
    description: 'Multi-line text input',
    category: 'forms',
    tags: ['textarea', 'form', 'text'],
    icon: 'align-left',
    html: `<textarea placeholder="Enter your message..." rows="4" style="padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; width: 100%; box-sizing: border-box; font-family: inherit; resize: vertical;"></textarea>`,
  },
  {
    id: 'select',
    name: 'Select',
    description: 'Dropdown select field',
    category: 'forms',
    tags: ['select', 'dropdown', 'form'],
    icon: 'chevron-down',
    html: `<select style="padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; width: 100%; box-sizing: border-box;">
  <option>Option 1</option>
  <option>Option 2</option>
  <option>Option 3</option>
</select>`,
  },
  {
    id: 'checkbox',
    name: 'Checkbox',
    description: 'Checkbox input',
    category: 'forms',
    tags: ['checkbox', 'form', 'input'],
    icon: 'square',
    html: `<label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
  <input type="checkbox" style="width: 18px; height: 18px; cursor: pointer;" />
  <span>Check this option</span>
</label>`,
  },
  {
    id: 'radio',
    name: 'Radio Button',
    description: 'Radio button input',
    category: 'forms',
    tags: ['radio', 'form', 'input'],
    icon: 'circle',
    html: `<label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
  <input type="radio" name="radio-group" style="width: 18px; height: 18px; cursor: pointer;" />
  <span>Radio option</span>
</label>`,
  },
  {
    id: 'button-primary',
    name: 'Primary Button',
    description: 'Primary action button',
    category: 'forms',
    tags: ['button', 'form', 'action'],
    icon: 'mouse-pointer-2',
    html: `<button type="button" style="background-color: #0066cc; color: white; padding: 10px 20px; border: none; border-radius: 4px; font-size: 1rem; cursor: pointer; transition: background-color 0.2s;">
  Click Me
</button>`,
  },
  {
    id: 'button-secondary',
    name: 'Secondary Button',
    description: 'Secondary action button',
    category: 'forms',
    tags: ['button', 'form', 'action'],
    icon: 'mouse-pointer-2',
    html: `<button type="button" style="background-color: #f0f0f0; color: #333; padding: 10px 20px; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; cursor: pointer; transition: background-color 0.2s;">
  Cancel
</button>`,
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
  {
    id: 'tabs',
    name: 'Tabs',
    description: 'Tab navigation',
    category: 'navigation',
    tags: ['tabs', 'nav', 'navigation'],
    icon: 'columns',
    html: `<div>
  <div style="display: flex; gap: 4px; border-bottom: 1px solid #ddd;">
    <button style="padding: 10px 20px; border: none; background-color: #0066cc; color: white; cursor: pointer; border-radius: 4px 4px 0 0;">Tab 1</button>
    <button style="padding: 10px 20px; border: none; background-color: #f0f0f0; color: #333; cursor: pointer;">Tab 2</button>
    <button style="padding: 10px 20px; border: none; background-color: #f0f0f0; color: #333; cursor: pointer;">Tab 3</button>
  </div>
  <div style="padding: 20px;">
    Tab content goes here
  </div>
</div>`,
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
    id: 'card',
    name: 'Card',
    description: 'Content card with shadow',
    category: 'data-display',
    tags: ['card', 'container', 'box'],
    icon: 'square',
    html: `<div style="background-color: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
  <h3 style="margin: 0 0 10px 0; font-size: 1.2rem;">Card Title</h3>
  <p style="margin: 0; color: #666;">Card content goes here.</p>
</div>`,
  },
  {
    id: 'badge',
    name: 'Badge',
    description: 'Small status badge',
    category: 'data-display',
    tags: ['badge', 'tag', 'label'],
    icon: 'badge',
    html: `<span style="display: inline-block; padding: 4px 12px; background-color: #0066cc; color: white; border-radius: 12px; font-size: 0.85rem; font-weight: 500;">
  Badge
</span>`,
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

  // Feedback Components
  {
    id: 'alert-info',
    name: 'Info Alert',
    description: 'Informational alert',
    category: 'feedback',
    tags: ['alert', 'info', 'message'],
    icon: 'info',
    html: `<div style="padding: 16px; background-color: #e3f2fd; border-left: 4px solid #2196f3; border-radius: 4px; margin: 16px 0;">
  <p style="margin: 0; color: #0d47a1;">
    <strong>Info:</strong> This is an informational message.
  </p>
</div>`,
  },
  {
    id: 'alert-success',
    name: 'Success Alert',
    description: 'Success alert message',
    category: 'feedback',
    tags: ['alert', 'success', 'message'],
    icon: 'check-circle',
    html: `<div style="padding: 16px; background-color: #e8f5e9; border-left: 4px solid #4caf50; border-radius: 4px; margin: 16px 0;">
  <p style="margin: 0; color: #1b5e20;">
    <strong>Success:</strong> Your changes have been saved.
  </p>
</div>`,
  },
  {
    id: 'alert-warning',
    name: 'Warning Alert',
    description: 'Warning alert message',
    category: 'feedback',
    tags: ['alert', 'warning', 'message'],
    icon: 'alert-triangle',
    html: `<div style="padding: 16px; background-color: #fff3e0; border-left: 4px solid #ff9800; border-radius: 4px; margin: 16px 0;">
  <p style="margin: 0; color: #e65100;">
    <strong>Warning:</strong> Please review before proceeding.
  </p>
</div>`,
  },
  {
    id: 'alert-error',
    name: 'Error Alert',
    description: 'Error alert message',
    category: 'feedback',
    tags: ['alert', 'error', 'message'],
    icon: 'alert-circle',
    html: `<div style="padding: 16px; background-color: #ffebee; border-left: 4px solid #f44336; border-radius: 4px; margin: 16px 0;">
  <p style="margin: 0; color: #b71c1c;">
    <strong>Error:</strong> Something went wrong.
  </p>
</div>`,
  },
  {
    id: 'progress-bar',
    name: 'Progress Bar',
    description: 'Progress indicator',
    category: 'feedback',
    tags: ['progress', 'loading', 'bar'],
    icon: 'bar-chart',
    html: `<div style="width: 100%; height: 8px; background-color: #f0f0f0; border-radius: 4px; overflow: hidden; margin: 16px 0;">
  <div style="width: 60%; height: 100%; background-color: #0066cc; transition: width 0.3s;"></div>
</div>`,
  },
  {
    id: 'spinner',
    name: 'Spinner',
    description: 'Loading spinner',
    category: 'feedback',
    tags: ['spinner', 'loading', 'animation'],
    icon: 'loader',
    html: `<div style="display: inline-block; width: 24px; height: 24px; border: 3px solid #f3f3f3; border-top: 3px solid #0066cc; border-radius: 50%; animation: spin 1s linear infinite;"></div>
<style>
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>`,
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

  // Overlay Components
  {
    id: 'modal',
    name: 'Modal',
    description: 'Modal dialog overlay',
    category: 'overlays',
    tags: ['modal', 'dialog', 'overlay'],
    icon: 'square',
    html: `<div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
  <div style="background-color: white; padding: 24px; border-radius: 8px; max-width: 500px; width: 90%; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <h2 style="margin: 0 0 16px 0; font-size: 1.5rem;">Modal Title</h2>
    <p style="margin: 0 0 20px 0;">Modal content goes here.</p>
    <div style="display: flex; gap: 10px; justify-content: flex-end;">
      <button style="padding: 8px 16px; border: 1px solid #ccc; background-color: white; border-radius: 4px; cursor: pointer;">Cancel</button>
      <button style="padding: 8px 16px; border: none; background-color: #0066cc; color: white; border-radius: 4px; cursor: pointer;">Confirm</button>
    </div>
  </div>
</div>`,
  },
  {
    id: 'tooltip',
    name: 'Tooltip',
    description: 'Hover tooltip',
    category: 'overlays',
    tags: ['tooltip', 'popover', 'hint'],
    icon: 'help-circle',
    html: `<div style="display: inline-block; position: relative;">
  <button style="padding: 8px 16px; background-color: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer;">
    Hover me
  </button>
  <div style="position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); background-color: #333; color: white; padding: 6px 12px; border-radius: 4px; font-size: 0.85rem; white-space: nowrap; margin-bottom: 8px;">
    Tooltip text
    <div style="position: absolute; top: 100%; left: 50%; transform: translateX(-50%); border: 6px solid transparent; border-top-color: #333;"></div>
  </div>
</div>`,
  },
  {
    id: 'dropdown',
    name: 'Dropdown',
    description: 'Dropdown menu',
    category: 'overlays',
    tags: ['dropdown', 'menu', 'select'],
    icon: 'chevron-down',
    html: `<div style="display: inline-block; position: relative;">
  <button style="padding: 10px 16px; background-color: #f0f0f0; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 8px;">
    Options
    <svg width="12" height="12" viewBox="0 0 12 12">
      <path d="M2 4l4 4 4-4" stroke="currentColor" fill="none" stroke-width="2"/>
    </svg>
  </button>
  <div style="position: absolute; top: 100%; left: 0; margin-top: 4px; background-color: white; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); min-width: 150px; z-index: 100;">
    <a href="#" style="display: block; padding: 10px 16px; text-decoration: none; color: #333; transition: background-color 0.2s;">Option 1</a>
    <a href="#" style="display: block; padding: 10px 16px; text-decoration: none; color: #333; transition: background-color 0.2s;">Option 2</a>
    <a href="#" style="display: block; padding: 10px 16px; text-decoration: none; color: #333; transition: background-color 0.2s;">Option 3</a>
  </div>
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
