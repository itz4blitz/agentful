import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Template Manager
 *
 * Manages agent templates with support for:
 * - Base templates (orchestrator, backend, frontend, etc.)
 * - Framework-specific templates (Next.js, NestJS, etc.)
 * - Pattern templates (database, auth, etc.)
 * - Custom user templates
 * - Template inheritance
 *
 * Templates are organized in:
 * - templates/base/ - Core agent templates
 * - templates/frameworks/ - Framework-specific templates
 * - templates/patterns/ - Pattern-based templates
 * - .agentful/templates/custom/ - User custom templates
 */
export class TemplateManager {
  constructor(projectPath, templateBaseDir = null) {
    this.projectPath = projectPath;
    this.templateBaseDir = templateBaseDir || path.join(__dirname, '../../templates');
    this.customTemplateDir = path.join(projectPath, '.agentful', 'templates', 'custom');
    this.cache = new Map();
    this.registry = new Map();
  }

  /**
   * Initialize template system
   */
  async initialize() {
    await this._ensureDirectories();
    await this._loadBuiltInTemplates();
    await this._scanTemplates();
  }

  /**
   * Load template by name or path
   *
   * @param {string} nameOrPath - Template name (e.g., 'base/backend') or path
   * @returns {Promise<string>} Template content
   */
  async loadTemplate(nameOrPath) {
    // Check cache first
    if (this.cache.has(nameOrPath)) {
      return this.cache.get(nameOrPath);
    }

    // Find template file
    const templatePath = await this._findTemplatePath(nameOrPath);
    if (!templatePath) {
      throw new Error(`Template not found: ${nameOrPath}`);
    }

    // Load template content
    const content = await fs.readFile(templatePath, 'utf-8');

    // Handle template inheritance (if template has "extends" directive)
    const extendedContent = await this._processInheritance(content);

    // Cache the template
    this.cache.set(nameOrPath, extendedContent);

    return extendedContent;
  }

  /**
   * List all available templates
   *
   * @returns {Promise<Array>} Template metadata
   */
  async listTemplates() {
    return Array.from(this.registry.values());
  }

  /**
   * Find templates by criteria
   *
   * @param {Object} criteria - Search criteria
   * @param {string} criteria.type - Template type (base, framework, pattern)
   * @param {string} criteria.category - Template category
   * @param {Array} criteria.tags - Template tags
   * @returns {Promise<Array>} Matching templates
   */
  async findTemplates(criteria = {}) {
    const matching = [];

    for (const [name, meta] of this.registry) {
      let matches = true;

      if (criteria.type && meta.type !== criteria.type) {
        matches = false;
      }

      if (criteria.category && meta.category !== criteria.category) {
        matches = false;
      }

      if (criteria.tags && criteria.tags.length > 0) {
        const hasTag = criteria.tags.some(tag => meta.tags?.includes(tag));
        if (!hasTag) {
          matches = false;
        }
      }

      if (matches) {
        matching.push({ name, ...meta });
      }
    }

    return matching;
  }

  /**
   * Create custom template
   *
   * @param {string} name - Template name
   * @param {string} content - Template content
   * @param {Object} metadata - Template metadata
   */
  async createTemplate(name, content, metadata = {}) {
    const templatePath = path.join(this.customTemplateDir, `${name}.md`);

    // Ensure custom template directory exists
    await fs.mkdir(this.customTemplateDir, { recursive: true });

    // Write template
    await fs.writeFile(templatePath, content, 'utf-8');

    // Update registry
    this.registry.set(name, {
      type: 'custom',
      category: metadata.category || 'custom',
      tags: metadata.tags || [],
      path: templatePath,
      ...metadata
    });

    // Invalidate cache
    this.cache.delete(name);
  }

  /**
   * Find template file path
   *
   * @param {string} nameOrPath - Template name or path
   * @returns {Promise<string|null>} Template path or null
   * @private
   */
  async _findTemplatePath(nameOrPath) {
    // If it's a relative path with slashes, search in that category
    if (nameOrPath.includes('/')) {
      const [category, name] = nameOrPath.split('/');
      const searchPaths = [
        path.join(this.templateBaseDir, category, `${name}.md`),
        path.join(this.customTemplateDir, nameOrPath, `${name}.md`)
      ];

      for (const searchPath of searchPaths) {
        try {
          await fs.access(searchPath);
          return searchPath;
        } catch {
          // Continue searching
        }
      }
    }

    // Search in all template directories
    const searchPaths = [
      path.join(this.customTemplateDir, `${nameOrPath}.md`),
      path.join(this.templateBaseDir, 'frameworks', `${nameOrPath}.md`),
      path.join(this.templateBaseDir, 'patterns', `${nameOrPath}.md`),
      path.join(this.templateBaseDir, 'base', `${nameOrPath}.md`)
    ];

    for (const searchPath of searchPaths) {
      try {
        await fs.access(searchPath);
        return searchPath;
      } catch {
        // Continue searching
      }
    }

    return null;
  }

  /**
   * Process template inheritance
   *
   * @param {string} content - Template content
   * @returns {Promise<string>} Extended content
   * @private
   */
  async _processInheritance(content) {
    // Check for extends directive in frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      return content;
    }

    const frontmatter = frontmatterMatch[1];
    const extendsMatch = frontmatter.match(/extends:\s*(.+)/);

    if (!extendsMatch) {
      return content;
    }

    const parentTemplate = extendsMatch[1].trim();

    // Load parent template
    const parentContent = await this.loadTemplate(parentTemplate);

    // Merge templates (simple approach: parent + child sections)
    return this._mergeTemplates(parentContent, content);
  }

  /**
   * Merge parent and child templates
   *
   * @param {string} parent - Parent template content
   * @param {string} child - Child template content
   * @returns {string} Merged content
   * @private
   */
  _mergeTemplates(parent, child) {
    // Extract frontmatter from both
    const parentFrontmatter = parent.match(/^---\n([\s\S]*?)\n---/)?.[1] || '';
    const childFrontmatter = child.match(/^---\n([\s\S]*?)\n---/)?.[1] || '';

    // Extract body (everything after frontmatter)
    const parentBody = parent.replace(/^---\n[\s\S]*?\n---\n?/, '');
    const childBody = child.replace(/^---\n[\s\S]*?\n---\n?/, '');

    // Merge frontmatter (child overrides parent)
    const mergedFrontmatter = this._mergeFrontmatter(parentFrontmatter, childFrontmatter);

    // Merge body (append child sections to parent)
    const mergedBody = parentBody + '\n\n' + childBody;

    return `---\n${mergedFrontmatter}\n---\n\n${mergedBody}`;
  }

  /**
   * Merge frontmatter YAML
   *
   * @param {string} parent - Parent frontmatter
   * @param {string} child - Child frontmatter
   * @returns {string} Merged frontmatter
   * @private
   */
  _mergeFrontmatter(parent, child) {
    const parseYaml = (yaml) => {
      const obj = {};
      const lines = yaml.split('\n');

      for (const line of lines) {
        const match = line.match(/^(\w+):\s*(.+)$/);
        if (match) {
          const [, key, value] = match;
          obj[key] = value.trim();
        }
      }

      return obj;
    };

    const parentObj = parseYaml(parent);
    const childObj = parseYaml(child);

    // Merge objects (child overrides parent)
    const merged = { ...parentObj, ...childObj };

    // Convert back to YAML
    return Object.entries(merged)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
  }

  /**
   * Ensure template directories exist
   *
   * @private
   */
  async _ensureDirectories() {
    const dirs = [
      path.join(this.templateBaseDir, 'base'),
      path.join(this.templateBaseDir, 'frameworks'),
      path.join(this.templateBaseDir, 'patterns'),
      this.customTemplateDir
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /**
   * Load built-in templates
   *
   * @private
   */
  async _loadBuiltInTemplates() {
    // Create base templates if they don't exist
    const baseTemplates = this._getBuiltInTemplates();

    for (const [name, content] of Object.entries(baseTemplates)) {
      const templatePath = path.join(this.templateBaseDir, 'base', `${name}.md`);

      try {
        await fs.access(templatePath);
        // Template exists, don't overwrite
      } catch {
        // Template doesn't exist, create it
        await fs.writeFile(templatePath, content, 'utf-8');
      }
    }
  }

  /**
   * Scan all templates and build registry
   *
   * @private
   */
  async _scanTemplates() {
    const categories = [
      { dir: path.join(this.templateBaseDir, 'base'), type: 'base' },
      { dir: path.join(this.templateBaseDir, 'frameworks'), type: 'framework' },
      { dir: path.join(this.templateBaseDir, 'patterns'), type: 'pattern' },
      { dir: this.customTemplateDir, type: 'custom' }
    ];

    for (const { dir, type } of categories) {
      try {
        const files = await fs.readdir(dir);

        for (const file of files) {
          if (file.endsWith('.md')) {
            const name = path.basename(file, '.md');
            const filePath = path.join(dir, file);

            // Extract metadata from frontmatter
            const content = await fs.readFile(filePath, 'utf-8');
            const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

            if (frontmatterMatch) {
              const frontmatter = frontmatterMatch[1];
              const metadata = this._parseFrontmatter(frontmatter);

              this.registry.set(name, {
                type,
                category: metadata.category || type,
                tags: metadata.tags || [],
                description: metadata.description,
                path: filePath
              });
            }
          }
        }
      } catch (error) {
        // Directory doesn't exist, skip
      }
    }
  }

  /**
   * Parse frontmatter YAML
   *
   * @param {string} frontmatter - Frontmatter content
   * @returns {Object} Parsed metadata
   * @private
   */
  _parseFrontmatter(frontmatter) {
    const metadata = {};
    const lines = frontmatter.split('\n');

    for (const line of lines) {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        const [, key, value] = match;
        metadata[key] = value.trim();
      }
    }

    return metadata;
  }

  /**
   * Get built-in template content
   *
   * @returns {Object} Template name -> content mapping
   * @private
   */
  _getBuiltInTemplates() {
    return {
      orchestrator: `---
name: orchestrator
description: Coordinates structured product development with human checkpoints
model: opus
tools: Read, Write, Edit, Glob, Grep, Task
category: base
tags: core, orchestration
---

# {{projectName}} Orchestrator

You coordinate autonomous product development for **{{projectName}}**.

## Tech Stack

{{#if techStack}}
{{#each techStack}}
- **{{@key}}**: {{this}}
{{/each}}
{{/if}}

## Your Role

You orchestrate all development activities by delegating to specialized agents.

## Workflow

1. Analyze requirements from product spec
2. Delegate architecture to @architect
3. Delegate implementation to specialist agents
4. Coordinate validation with @reviewer
5. Delegate fixes to @fixer
6. Track progress in state.json
`,

      backend: `---
name: backend
description: Implements backend services, APIs, databases, and business logic
model: sonnet
tools: Read, Write, Edit, Glob, Grep, Bash
category: base
tags: backend, api, database
---

# {{projectName}} Backend Agent

You implement server-side code for **{{projectName}}** using {{#if framework}}{{framework}}{{else}}best practices{{/if}}.

## Tech Stack

- **Language**: {{language}}
{{#if framework}}- **Framework**: {{framework}}{{/if}}
{{#if database}}- **Database**: {{database.type}}{{/if}}
{{#if orm}}- **ORM**: {{orm}}{{/if}}

## Your Scope

- API Routes & Controllers
- Service Layer (business logic)
- Repository Layer (data access)
- Database schemas and migrations
- Authentication & Authorization
- Input validation
- Error handling
- Caching strategies

## Architecture Pattern

Follow clean architecture with three layers:

1. **Controllers** - Handle HTTP requests/responses
2. **Services** - Business logic and orchestration
3. **Repositories** - Data access and external services

## Best Practices

- Validate all inputs
- Use transactions for multi-step operations
- Implement proper error handling
- Cache frequently accessed data
- Follow RESTful API conventions
`,

      frontend: `---
name: frontend
description: Implements UI components, pages, and client-side logic
model: sonnet
tools: Read, Write, Edit, Glob, Grep, Bash
category: base
tags: frontend, ui, components
---

# {{projectName}} Frontend Agent

You implement client-side code for **{{projectName}}** using {{#if framework}}{{framework}}{{else}}modern web standards{{/if}}.

## Tech Stack

- **Language**: {{language}}
{{#if framework}}- **Framework**: {{framework}}{{/if}}
- **Styling**: {{#if styling}}{{styling}}{{else}}CSS{{/if}}

## Your Scope

- UI Components
- Pages and Routes
- State Management
- API Integration
- Form Validation
- Client-side Routing
- Responsive Design
- Accessibility

## Component Structure

Follow these conventions:
- One component per file
- Use functional components
- Implement proper prop types
- Handle loading and error states

## Best Practices

- Write semantic HTML
- Ensure accessibility (a11y)
- Optimize for performance
- Follow responsive design principles
- Implement proper error boundaries
`
    };
  }
}

export default TemplateManager;
