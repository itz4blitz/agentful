/**
 * Agent Generator
 * Generates specialized AI agents based on codebase analysis
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import Handlebars from 'handlebars';
import { createHash } from 'crypto';
import { AnalysisResult, CodeExample, Pattern } from './analyzer';

// Types
export interface GeneratedAgent {
  metadata: AgentMetadata;
  content: string;
  examples: CodeExample[];
  configuration: AgentConfig;
}

export interface AgentMetadata {
  name: string;
  version: string;
  generatedAt: Date;
  generatedFrom: string;
  confidence: number;
  techStack: string[];
  patternsDetected: string[];
  filePath: string;
  checksum: string;
  template: string;
  customized: boolean;
}

export interface AgentConfig {
  model: 'opus' | 'sonnet' | 'haiku';
  tools: string[];
  permissions: {
    read: string[];
    write: string[];
    execute: string[];
  };
  triggers: {
    commands?: string[];
    events?: string[];
    patterns?: string[];
  };
  dependencies: string[];
  priority: number;
  maxTokens?: number;
  temperature?: number;
}

export interface AgentTemplate {
  meta: TemplateMeta;
  agent: AgentDefinition;
  sections: TemplateSection[];
  variables: TemplateVariables;
}

interface TemplateMeta {
  name: string;
  version: string;
  type: 'base' | 'framework' | 'pattern' | 'custom';
  category?: string;
  description?: string;
  author?: string;
  tags?: string[];
}

interface AgentDefinition {
  name: string;
  description: string;
  model: string;
  tools: string[];
}

interface TemplateSection {
  name: string;
  template: string;
  condition?: string;
  source?: 'static' | 'analyzed_code' | 'best_practices';
  required?: boolean;
  order?: number;
}

interface TemplateVariables {
  projectName?: string;
  projectType?: string;
  primaryLanguage?: string;
  primaryFramework?: string;
  techStack?: any[];
  patterns?: any[];
  conventions?: any;
  examples?: CodeExample[];
}

export interface GenerationOptions {
  force?: boolean;
  templates?: string[];
  skipValidation?: boolean;
  outputPath?: string;
  verbose?: boolean;
}

export interface GenerationResult {
  success: boolean;
  agents: AgentMetadata[];
  analysis: AnalysisResult;
  errors?: string[];
  warnings?: string[];
  duration: number;
}

// Main Generator Class
export class AgentGenerator {
  private projectPath: string;
  private templatesPath: string;
  private outputPath: string;
  private handlebars: typeof Handlebars;

  constructor(projectPath: string) {
    this.projectPath = path.resolve(projectPath);
    this.templatesPath = path.join(this.projectPath, '.agentful/templates');
    this.outputPath = path.join(this.projectPath, '.agentful/agents/generated');
    this.handlebars = Handlebars.create();
    this.registerHelpers();
  }

  /**
   * Generate agents based on analysis
   */
  async generate(
    analysis: AnalysisResult,
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Ensure output directory exists
      await this.ensureOutputDirectory();

      // Select appropriate templates
      const templates = await this.selectTemplates(analysis, options.templates);

      // Generate context from analysis
      const context = this.buildContext(analysis);

      // Generate each agent
      const agents: GeneratedAgent[] = [];
      for (const template of templates) {
        try {
          const agent = await this.generateAgent(template, context);

          if (!options.skipValidation) {
            await this.validateAgent(agent);
          }

          agents.push(agent);
        } catch (error: any) {
          errors.push(`Failed to generate ${template.meta.name}: ${error.message}`);
        }
      }

      // Save agents to disk
      await this.saveAgents(agents, options.outputPath);

      // Generate metadata summary
      const metadata = agents.map(a => a.metadata);

      return {
        success: errors.length === 0,
        agents: metadata,
        analysis,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
        duration: Date.now() - startTime
      };
    } catch (error: any) {
      return {
        success: false,
        agents: [],
        analysis,
        errors: [error.message],
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Select templates based on analysis
   */
  private async selectTemplates(
    analysis: AnalysisResult,
    requestedTemplates?: string[]
  ): Promise<AgentTemplate[]> {
    const templates: AgentTemplate[] = [];

    // If specific templates requested, use those
    if (requestedTemplates?.length) {
      for (const templateName of requestedTemplates) {
        const template = await this.loadTemplate(templateName);
        if (template) {
          templates.push(template);
        }
      }
      return templates;
    }

    // Auto-select based on analysis
    // Always include core agents
    templates.push(
      await this.loadTemplate('orchestrator'),
      await this.loadTemplate('architect')
    );

    // Framework-specific agents
    const { frameworks } = analysis.techStack;

    if (frameworks.frontend?.length) {
      for (const framework of frameworks.frontend) {
        const template = await this.findFrameworkTemplate(framework, 'frontend');
        if (template) templates.push(template);
      }
    }

    if (frameworks.backend?.length) {
      for (const framework of frameworks.backend) {
        const template = await this.findFrameworkTemplate(framework, 'backend');
        if (template) templates.push(template);
      }
    }

    // Database/ORM agents
    if (analysis.techStack.orm) {
      const template = await this.findTemplate('orm', analysis.techStack.orm);
      if (template) templates.push(template);
    }

    // Testing agents
    if (frameworks.testing?.length) {
      templates.push(await this.loadTemplate('tester'));
    }

    // Always include quality agents
    templates.push(
      await this.loadTemplate('reviewer'),
      await this.loadTemplate('fixer')
    );

    return templates;
  }

  /**
   * Generate a single agent from template
   */
  private async generateAgent(
    template: AgentTemplate,
    context: TemplateVariables
  ): Promise<GeneratedAgent> {
    // Compile template sections
    const sections: string[] = [];

    for (const section of template.sections) {
      if (this.shouldIncludeSection(section, context)) {
        const compiled = this.compileSection(section, context);
        sections.push(compiled);
      }
    }

    // Generate agent content
    const content = this.assembleAgent(template, sections, context);

    // Extract examples from context
    const examples = context.examples || [];

    // Generate configuration
    const config = this.generateConfig(template, context);

    // Generate metadata
    const metadata = await this.generateMetadata(template, content, context);

    return {
      metadata,
      content,
      examples,
      configuration: config
    };
  }

  /**
   * Build context from analysis
   */
  private buildContext(analysis: AnalysisResult): TemplateVariables {
    const context: TemplateVariables = {
      projectName: path.basename(this.projectPath),
      projectType: analysis.projectType,
      primaryLanguage: analysis.techStack.primaryLanguage,
      primaryFramework: this.getPrimaryFramework(analysis.techStack),
      techStack: this.formatTechStack(analysis.techStack),
      patterns: this.formatPatterns(analysis.patterns),
      conventions: this.formatConventions(analysis.conventions),
      examples: analysis.examples
    };

    return context;
  }

  /**
   * Compile a template section
   */
  private compileSection(section: TemplateSection, context: TemplateVariables): string {
    try {
      const template = this.handlebars.compile(section.template);
      return template(context);
    } catch (error: any) {
      throw new Error(`Failed to compile section ${section.name}: ${error.message}`);
    }
  }

  /**
   * Check if section should be included
   */
  private shouldIncludeSection(section: TemplateSection, context: TemplateVariables): boolean {
    if (!section.condition) return true;

    // Evaluate condition
    try {
      const conditionFn = new Function('context', `return ${section.condition}`);
      return conditionFn(context);
    } catch {
      return true; // Include by default if condition fails
    }
  }

  /**
   * Assemble final agent content
   */
  private assembleAgent(
    template: AgentTemplate,
    sections: string[],
    context: TemplateVariables
  ): string {
    const header = this.generateHeader(template, context);
    const body = sections.join('\n\n');
    const footer = this.generateFooter(template);

    return `${header}\n\n${body}\n\n${footer}`;
  }

  /**
   * Generate agent header
   */
  private generateHeader(template: AgentTemplate, context: TemplateVariables): string {
    return `---
name: ${template.agent.name}
description: ${template.agent.description}
model: ${template.agent.model}
tools: ${template.agent.tools.join(', ')}
generated: ${new Date().toISOString()}
version: ${template.meta.version}
---`;
  }

  /**
   * Generate agent footer
   */
  private generateFooter(template: AgentTemplate): string {
    return `
## Agent Information

This agent was auto-generated by agentful.
Template: ${template.meta.name}
Version: ${template.meta.version}

To customize this agent, copy it to .agentful/agents/custom/ and modify as needed.`;
  }

  /**
   * Generate agent configuration
   */
  private generateConfig(template: AgentTemplate, context: TemplateVariables): AgentConfig {
    return {
      model: (template.agent.model as 'opus' | 'sonnet' | 'haiku') || 'sonnet',
      tools: template.agent.tools || ['Read', 'Write', 'Edit', 'Bash'],
      permissions: {
        read: ['**/*'],
        write: this.determineWritePermissions(template, context),
        execute: this.determineExecutePermissions(template, context)
      },
      triggers: {
        commands: [`/${template.agent.name}`],
        patterns: this.determineTriggerPatterns(template, context)
      },
      dependencies: this.determineDependencies(template, context),
      priority: this.calculatePriority(template, context)
    };
  }

  /**
   * Generate agent metadata
   */
  private async generateMetadata(
    template: AgentTemplate,
    content: string,
    context: TemplateVariables
  ): Promise<AgentMetadata> {
    const hash = createHash('sha256').update(content).digest('hex');

    return {
      name: template.agent.name,
      version: '1.0.0',
      generatedAt: new Date(),
      generatedFrom: template.meta.name,
      confidence: this.calculateAgentConfidence(template, context),
      techStack: context.techStack?.map(t => t.name) || [],
      patternsDetected: context.patterns?.map(p => p.name) || [],
      filePath: path.join(this.outputPath, `${template.agent.name}.md`),
      checksum: hash,
      template: template.meta.name,
      customized: false
    };
  }

  /**
   * Save agents to disk
   */
  private async saveAgents(agents: GeneratedAgent[], customPath?: string): Promise<void> {
    const outputPath = customPath || this.outputPath;

    for (const agent of agents) {
      // Save agent content
      const agentPath = path.join(outputPath, `${agent.metadata.name}.md`);
      await fs.writeFile(agentPath, agent.content, 'utf-8');

      // Save agent metadata
      const metadataPath = path.join(outputPath, `${agent.metadata.name}.json`);
      await fs.writeFile(metadataPath, JSON.stringify(agent.metadata, null, 2), 'utf-8');

      // Save agent config
      const configPath = path.join(outputPath, `${agent.metadata.name}.config.json`);
      await fs.writeFile(configPath, JSON.stringify(agent.configuration, null, 2), 'utf-8');
    }
  }

  /**
   * Validate generated agent
   */
  private async validateAgent(agent: GeneratedAgent): Promise<void> {
    const validator = new AgentValidator();
    const result = await validator.validate(agent);

    if (!result.valid) {
      throw new Error(`Agent validation failed: ${result.errors.join(', ')}`);
    }
  }

  /**
   * Load template from disk
   */
  private async loadTemplate(name: string): Promise<AgentTemplate> {
    const templatePath = path.join(this.templatesPath, `${name}.yaml`);

    // For now, return a mock template
    // In production, this would parse YAML/JSON template files
    return {
      meta: {
        name,
        version: '1.0.0',
        type: 'base'
      },
      agent: {
        name,
        description: `${name} agent for this project`,
        model: 'sonnet',
        tools: ['Read', 'Write', 'Edit', 'Bash', 'Grep', 'Glob']
      },
      sections: [],
      variables: {}
    };
  }

  /**
   * Find framework-specific template
   */
  private async findFrameworkTemplate(
    framework: string,
    category: string
  ): Promise<AgentTemplate | null> {
    const normalizedName = framework.toLowerCase().replace(/\s+/g, '-');
    const templateName = `${normalizedName}-specialist`;

    try {
      return await this.loadTemplate(templateName);
    } catch {
      return null;
    }
  }

  /**
   * Find template by category and name
   */
  private async findTemplate(category: string, name: string): Promise<AgentTemplate | null> {
    const normalizedName = name.toLowerCase().replace(/\s+/g, '-');
    const templateName = `${normalizedName}-${category}`;

    try {
      return await this.loadTemplate(templateName);
    } catch {
      return null;
    }
  }

  /**
   * Register Handlebars helpers
   */
  private registerHelpers(): void {
    this.handlebars.registerHelper('lowercase', (str: string) => str?.toLowerCase());
    this.handlebars.registerHelper('uppercase', (str: string) => str?.toUpperCase());
    this.handlebars.registerHelper('capitalize', (str: string) =>
      str?.charAt(0).toUpperCase() + str?.slice(1)
    );
    this.handlebars.registerHelper('json', (obj: any) => JSON.stringify(obj, null, 2));
    this.handlebars.registerHelper('join', (arr: any[], sep: string) => arr?.join(sep));
    this.handlebars.registerHelper('if_eq', function(a: any, b: any, options: any) {
      return a === b ? options.fn(this) : options.inverse(this);
    });
  }

  // Helper methods
  private ensureOutputDirectory(): Promise<void> {
    return fs.mkdir(this.outputPath, { recursive: true });
  }

  private getPrimaryFramework(techStack: any): string {
    return techStack.frameworks?.frontend?.[0] ||
           techStack.frameworks?.backend?.[0] ||
           'unknown';
  }

  private formatTechStack(techStack: any): any[] {
    const items: any[] = [];

    if (techStack.primaryLanguage) {
      items.push({ name: techStack.primaryLanguage, role: 'language' });
    }

    Object.entries(techStack.frameworks || {}).forEach(([category, frameworks]: [string, any]) => {
      if (Array.isArray(frameworks)) {
        frameworks.forEach((framework: string) => {
          items.push({ name: framework, role: category });
        });
      }
    });

    return items;
  }

  private formatPatterns(patterns: Map<string, Pattern[]>): any[] {
    const formatted: any[] = [];

    patterns.forEach((patternList, category) => {
      patternList.forEach(pattern => {
        formatted.push({
          name: pattern.name,
          category,
          confidence: pattern.confidence,
          examples: pattern.examples.length
        });
      });
    });

    return formatted;
  }

  private formatConventions(conventions: any): any {
    return {
      ...conventions,
      formatted: true
    };
  }

  private determineWritePermissions(template: AgentTemplate, context: TemplateVariables): string[] {
    // Determine based on agent type
    const agentName = template.agent.name;

    if (agentName === 'orchestrator' || agentName === 'architect') {
      return ['.agentful/**', '.claude/**'];
    }

    if (agentName.includes('frontend')) {
      return ['src/**/*.{tsx,ts,jsx,js,css,scss}', 'app/**', 'pages/**', 'components/**'];
    }

    if (agentName.includes('backend')) {
      return ['src/**/*.{ts,js,py,go,rs,java}', 'api/**', 'server/**', 'lib/**'];
    }

    return ['src/**', 'tests/**'];
  }

  private determineExecutePermissions(template: AgentTemplate, context: TemplateVariables): string[] {
    const commands: string[] = [];

    // Package manager commands
    if (context.techStack?.some(t => t.name === 'npm')) {
      commands.push('npm', 'npx');
    }

    if (context.techStack?.some(t => t.name === 'yarn')) {
      commands.push('yarn');
    }

    if (context.techStack?.some(t => t.name === 'pnpm')) {
      commands.push('pnpm', 'pnpx');
    }

    // Language-specific commands
    if (context.primaryLanguage === 'Python') {
      commands.push('python', 'pip', 'pytest');
    }

    if (context.primaryLanguage === 'Go') {
      commands.push('go');
    }

    // Always include git
    commands.push('git');

    return commands;
  }

  private determineTriggerPatterns(template: AgentTemplate, context: TemplateVariables): string[] {
    const patterns: string[] = [];
    const agentName = template.agent.name;

    if (agentName.includes('frontend')) {
      patterns.push('*.tsx', '*.jsx', '*.css', '*.scss');
    }

    if (agentName.includes('backend')) {
      patterns.push('*.ts', '*.js', '*.py', '*.go', '*.java');
    }

    if (agentName.includes('test')) {
      patterns.push('*.test.*', '*.spec.*', '*_test.*');
    }

    return patterns;
  }

  private determineDependencies(template: AgentTemplate, context: TemplateVariables): string[] {
    const deps: string[] = [];
    const agentName = template.agent.name;

    if (agentName === 'frontend-specialist') {
      deps.push('architect');
    }

    if (agentName === 'backend-specialist') {
      deps.push('architect');
    }

    if (agentName === 'tester') {
      deps.push('frontend-specialist', 'backend-specialist');
    }

    return deps;
  }

  private calculatePriority(template: AgentTemplate, context: TemplateVariables): number {
    const agentName = template.agent.name;

    const priorities: Record<string, number> = {
      'orchestrator': 100,
      'architect': 90,
      'product-analyzer': 85,
      'backend-specialist': 70,
      'frontend-specialist': 70,
      'database-specialist': 65,
      'tester': 50,
      'reviewer': 40,
      'fixer': 30
    };

    return priorities[agentName] || 50;
  }

  private calculateAgentConfidence(template: AgentTemplate, context: TemplateVariables): number {
    // Calculate based on how well the template matches the project
    let confidence = 0.5;

    // Increase confidence if we have examples
    if (context.examples && context.examples.length > 5) {
      confidence += 0.2;
    }

    // Increase confidence if we have clear patterns
    if (context.patterns && context.patterns.length > 3) {
      confidence += 0.15;
    }

    // Increase confidence if project type is existing
    if (context.projectType === 'existing') {
      confidence += 0.15;
    }

    return Math.min(confidence, 1.0);
  }
}

// Agent Validator
class AgentValidator {
  async validate(agent: GeneratedAgent): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check required metadata
    if (!agent.metadata.name) {
      errors.push('Agent name is required');
    }

    if (!agent.metadata.version) {
      errors.push('Agent version is required');
    }

    // Check content
    if (!agent.content || agent.content.length < 100) {
      errors.push('Agent content is too short or missing');
    }

    // Check configuration
    if (!agent.configuration.model) {
      errors.push('Agent model is required');
    }

    if (!agent.configuration.tools || agent.configuration.tools.length === 0) {
      errors.push('Agent must have at least one tool');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}