/**
 * Template Management System
 * Manages agent templates and their compilation
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { z } from 'zod';

// Template Schema Definitions
const TemplateMetaSchema = z.object({
  name: z.string(),
  version: z.string(),
  type: z.enum(['base', 'framework', 'pattern', 'custom']),
  category: z.string().optional(),
  description: z.string().optional(),
  author: z.string().optional(),
  tags: z.array(z.string()).optional(),
  extends: z.string().optional(),
  requires: z.array(z.string()).optional()
});

const AgentDefinitionSchema = z.object({
  name: z.string(),
  description: z.string(),
  model: z.enum(['opus', 'sonnet', 'haiku']),
  tools: z.array(z.string()),
  temperature: z.number().min(0).max(1).optional(),
  maxTokens: z.number().optional()
});

const TemplateSectionSchema = z.object({
  name: z.string(),
  title: z.string().optional(),
  template: z.string(),
  condition: z.string().optional(),
  source: z.enum(['static', 'analyzed_code', 'best_practices']).optional(),
  required: z.boolean().optional(),
  order: z.number().optional(),
  variables: z.array(z.string()).optional()
});

const TemplateSchema = z.object({
  meta: TemplateMetaSchema,
  agent: AgentDefinitionSchema,
  sections: z.array(TemplateSectionSchema),
  variables: z.record(z.any()).optional(),
  examples: z.array(z.any()).optional()
});

export type Template = z.infer<typeof TemplateSchema>;
export type TemplateMeta = z.infer<typeof TemplateMetaSchema>;
export type TemplateSection = z.infer<typeof TemplateSectionSchema>;

/**
 * Template Manager - Handles loading, validation, and inheritance
 */
export class TemplateManager {
  private templatesPath: string;
  private cache: Map<string, Template> = new Map();
  private registry: Map<string, TemplateMeta> = new Map();

  constructor(projectPath: string) {
    this.templatesPath = path.join(projectPath, '.agentful/templates');
  }

  /**
   * Initialize template system
   */
  async initialize(): Promise<void> {
    await this.ensureTemplateDirectories();
    await this.loadBuiltInTemplates();
    await this.scanTemplates();
  }

  /**
   * Load a template by name
   */
  async loadTemplate(name: string): Promise<Template> {
    // Check cache
    if (this.cache.has(name)) {
      return this.cache.get(name)!;
    }

    // Find template file
    const templatePath = await this.findTemplatePath(name);
    if (!templatePath) {
      throw new Error(`Template not found: ${name}`);
    }

    // Load and parse template
    const content = await fs.readFile(templatePath, 'utf-8');
    const rawTemplate = yaml.load(content) as any;

    // Validate template
    const template = await this.validateTemplate(rawTemplate);

    // Handle template inheritance
    if (template.meta.extends) {
      const baseTemplate = await this.loadTemplate(template.meta.extends);
      const mergedTemplate = this.mergeTemplates(baseTemplate, template);
      this.cache.set(name, mergedTemplate);
      return mergedTemplate;
    }

    this.cache.set(name, template);
    return template;
  }

  /**
   * Get all available templates
   */
  async listTemplates(): Promise<TemplateMeta[]> {
    return Array.from(this.registry.values());
  }

  /**
   * Find templates matching criteria
   */
  async findTemplates(criteria: {
    type?: string;
    category?: string;
    tags?: string[];
  }): Promise<Template[]> {
    const matching: Template[] = [];

    for (const [name, meta] of this.registry) {
      if (criteria.type && meta.type !== criteria.type) continue;
      if (criteria.category && meta.category !== criteria.category) continue;
      if (criteria.tags && !criteria.tags.some(tag => meta.tags?.includes(tag))) continue;

      const template = await this.loadTemplate(name);
      matching.push(template);
    }

    return matching;
  }

  /**
   * Create custom template
   */
  async createTemplate(name: string, template: Template): Promise<void> {
    // Validate template
    const validated = await this.validateTemplate(template);

    // Save to custom templates directory
    const customPath = path.join(this.templatesPath, 'custom', `${name}.yaml`);
    await fs.writeFile(customPath, yaml.dump(validated), 'utf-8');

    // Update registry
    this.registry.set(name, validated.meta);
    this.cache.set(name, validated);
  }

  /**
   * Scan and index all templates
   */
  private async scanTemplates(): Promise<void> {
    const directories = ['base', 'frameworks', 'patterns', 'custom'];

    for (const dir of directories) {
      const dirPath = path.join(this.templatesPath, dir);

      try {
        const files = await fs.readdir(dirPath);

        for (const file of files) {
          if (file.endsWith('.yaml') || file.endsWith('.yml')) {
            const name = path.basename(file, path.extname(file));
            const filePath = path.join(dirPath, file);

            try {
              const content = await fs.readFile(filePath, 'utf-8');
              const template = yaml.load(content) as any;

              if (template?.meta) {
                this.registry.set(name, template.meta);
              }
            } catch (error) {
              console.error(`Failed to load template ${file}:`, error);
            }
          }
        }
      } catch (error) {
        // Directory doesn't exist, skip
      }
    }
  }

  /**
   * Find template file path
   */
  private async findTemplatePath(name: string): Promise<string | null> {
    const searchPaths = [
      path.join(this.templatesPath, 'custom', `${name}.yaml`),
      path.join(this.templatesPath, 'custom', `${name}.yml`),
      path.join(this.templatesPath, 'frameworks', `${name}.yaml`),
      path.join(this.templatesPath, 'frameworks', `${name}.yml`),
      path.join(this.templatesPath, 'patterns', `${name}.yaml`),
      path.join(this.templatesPath, 'patterns', `${name}.yml`),
      path.join(this.templatesPath, 'base', `${name}.yaml`),
      path.join(this.templatesPath, 'base', `${name}.yml`)
    ];

    for (const searchPath of searchPaths) {
      try {
        await fs.access(searchPath);
        return searchPath;
      } catch {
        // File doesn't exist, continue
      }
    }

    return null;
  }

  /**
   * Validate template against schema
   */
  private async validateTemplate(template: any): Promise<Template> {
    try {
      return TemplateSchema.parse(template);
    } catch (error: any) {
      throw new Error(`Template validation failed: ${error.message}`);
    }
  }

  /**
   * Merge templates for inheritance
   */
  private mergeTemplates(base: Template, derived: Template): Template {
    return {
      meta: { ...base.meta, ...derived.meta },
      agent: { ...base.agent, ...derived.agent },
      sections: this.mergeSections(base.sections, derived.sections),
      variables: { ...base.variables, ...derived.variables },
      examples: [...(base.examples || []), ...(derived.examples || [])]
    };
  }

  /**
   * Merge template sections
   */
  private mergeSections(base: TemplateSection[], derived: TemplateSection[]): TemplateSection[] {
    const merged = [...base];
    const baseNames = new Set(base.map(s => s.name));

    for (const section of derived) {
      if (baseNames.has(section.name)) {
        // Override existing section
        const index = merged.findIndex(s => s.name === section.name);
        merged[index] = section;
      } else {
        // Add new section
        merged.push(section);
      }
    }

    // Sort by order if specified
    return merged.sort((a, b) => (a.order || 999) - (b.order || 999));
  }

  /**
   * Ensure template directories exist
   */
  private async ensureTemplateDirectories(): Promise<void> {
    const dirs = [
      this.templatesPath,
      path.join(this.templatesPath, 'base'),
      path.join(this.templatesPath, 'frameworks'),
      path.join(this.templatesPath, 'patterns'),
      path.join(this.templatesPath, 'custom')
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /**
   * Load built-in templates
   */
  private async loadBuiltInTemplates(): Promise<void> {
    // This would be expanded to include all built-in templates
    const builtInTemplates = await this.getBuiltInTemplates();

    for (const [name, template] of Object.entries(builtInTemplates)) {
      const templatePath = path.join(this.templatesPath, 'base', `${name}.yaml`);

      // Only write if doesn't exist (don't overwrite user modifications)
      try {
        await fs.access(templatePath);
      } catch {
        await fs.writeFile(templatePath, yaml.dump(template), 'utf-8');
      }
    }
  }

  /**
   * Get built-in template definitions
   */
  private async getBuiltInTemplates(): Promise<Record<string, Template>> {
    return {
      'orchestrator': {
        meta: {
          name: 'orchestrator',
          version: '1.0.0',
          type: 'base',
          description: 'Coordinates all development activities'
        },
        agent: {
          name: 'orchestrator',
          description: 'Orchestrates autonomous product development',
          model: 'sonnet',
          tools: ['Task', 'Read', 'Write', 'Edit']
        },
        sections: [
          {
            name: 'introduction',
            template: `# Orchestrator Agent

You orchestrate autonomous product development for {{projectName}}.

## Your Role

You coordinate all development activities, delegating work to specialized agents and ensuring quality gates are met.`,
            order: 1
          },
          {
            name: 'tech_stack',
            template: `## Tech Stack

{{#each techStack}}
- **{{role}}**: {{name}}
{{/each}}`,
            condition: 'context.techStack && context.techStack.length > 0',
            order: 2
          },
          {
            name: 'workflow',
            template: `## Development Workflow

1. Analyze product requirements
2. Create architecture with @architect
3. Implement features with specialized agents
4. Validate with @reviewer
5. Fix issues with @fixer
6. Track progress in state.json`,
            order: 3
          }
        ]
      },

      'architect': {
        meta: {
          name: 'architect',
          version: '1.0.0',
          type: 'base',
          description: 'Analyzes and generates specialized agents'
        },
        agent: {
          name: 'architect',
          description: 'Architect agent for codebase analysis',
          model: 'sonnet',
          tools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash']
        },
        sections: [
          {
            name: 'introduction',
            template: `# Architect Agent

You analyze the project's patterns and create specialized agents that match how THIS SPECIFIC PROJECT works.`,
            order: 1
          },
          {
            name: 'analysis',
            template: `## Analysis Process

1. Detect project state (new vs existing)
2. Identify tech stack and frameworks
3. Extract patterns and conventions
4. Generate specialized agents
5. Update architecture.json`,
            order: 2
          }
        ]
      },

      'reviewer': {
        meta: {
          name: 'reviewer',
          version: '1.0.0',
          type: 'base',
          description: 'Reviews code quality and runs validation'
        },
        agent: {
          name: 'reviewer',
          description: 'Code review and quality validation',
          model: 'sonnet',
          tools: ['Read', 'Bash', 'Grep']
        },
        sections: [
          {
            name: 'introduction',
            template: `# Code Reviewer

You ensure code quality for {{projectName}}.`,
            order: 1
          },
          {
            name: 'quality_gates',
            template: `## Quality Gates

- Type checking
- Linting
- Tests passing
- Coverage > 80%
- Security scan
- No dead code`,
            order: 2
          }
        ]
      },

      'fixer': {
        meta: {
          name: 'fixer',
          version: '1.0.0',
          type: 'base',
          description: 'Fixes validation failures and issues'
        },
        agent: {
          name: 'fixer',
          description: 'Fixes issues found during validation',
          model: 'sonnet',
          tools: ['Read', 'Write', 'Edit', 'Bash']
        },
        sections: [
          {
            name: 'introduction',
            template: `# Fixer Agent

You fix issues found during code validation.`,
            order: 1
          }
        ]
      }
    };
  }
}

/**
 * Template Compiler - Handles variable substitution and compilation
 */
export class TemplateCompiler {
  private variables: Map<string, any> = new Map();

  /**
   * Set compilation variables
   */
  setVariables(vars: Record<string, any>): void {
    Object.entries(vars).forEach(([key, value]) => {
      this.variables.set(key, value);
    });
  }

  /**
   * Compile template with variables
   */
  compile(template: Template): string {
    const sections: string[] = [];

    for (const section of template.sections) {
      if (this.shouldInclude(section)) {
        const compiled = this.compileSection(section);
        if (compiled) {
          sections.push(compiled);
        }
      }
    }

    return sections.join('\n\n');
  }

  /**
   * Check if section should be included
   */
  private shouldInclude(section: TemplateSection): boolean {
    if (!section.condition) return true;

    try {
      // Simple condition evaluation
      const condition = section.condition
        .replace(/context\./g, '')
        .replace(/&&/g, ' && ')
        .replace(/\|\|/g, ' || ');

      const evalContext = Object.fromEntries(this.variables);
      const func = new Function(...Object.keys(evalContext), `return ${condition}`);
      return func(...Object.values(evalContext));
    } catch {
      return true; // Include on error
    }
  }

  /**
   * Compile individual section
   */
  private compileSection(section: TemplateSection): string {
    let content = section.template;

    // Replace variables
    for (const [key, value] of this.variables) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      content = content.replace(regex, String(value));
    }

    // Handle loops
    content = this.processLoops(content);

    // Handle conditionals
    content = this.processConditionals(content);

    // Add section title if specified
    if (section.title) {
      content = `## ${section.title}\n\n${content}`;
    }

    return content;
  }

  /**
   * Process template loops
   */
  private processLoops(content: string): string {
    const loopRegex = /{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g;

    return content.replace(loopRegex, (match, varName, loopContent) => {
      const items = this.variables.get(varName);
      if (!Array.isArray(items)) return '';

      return items.map(item => {
        let itemContent = loopContent;

        // Replace item properties
        Object.entries(item).forEach(([key, value]) => {
          const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
          itemContent = itemContent.replace(regex, String(value));
        });

        return itemContent.trim();
      }).join('\n');
    });
  }

  /**
   * Process template conditionals
   */
  private processConditionals(content: string): string {
    const ifRegex = /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g;

    return content.replace(ifRegex, (match, varName, ifContent) => {
      const value = this.variables.get(varName);
      return value ? ifContent.trim() : '';
    });
  }
}