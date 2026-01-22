import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import Handlebars from 'handlebars';
import { TemplateManager } from './templates.js';
import { StorageManager } from './storage.js';

const require = createRequire(import.meta.url);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Agent Generator
 *
 * Converts architecture analysis into specialized agents using templates.
 * Supports Handlebars templating with custom helpers for code injection.
 *
 * @example
 * const generator = new AgentGenerator('/path/to/project');
 * await generator.initialize();
 * const agents = await generator.generateAgents();
 */
export class AgentGenerator {
  constructor(projectPath, options = {}) {
    this.projectPath = projectPath;
    this.options = {
      templateDir: options.templateDir || path.join(__dirname, '../../templates'),
      agentsDir: options.agentsDir || '.agentful/agents',
      preserveCustom: options.preserveCustom !== false,
      validateOutput: options.validateOutput !== false,
      ...options
    };

    this.templateManager = null;
    this.storageManager = null;
    this.architecture = null;
    this.handlebars = Handlebars.create();

    this._registerHelpers();
  }

  /**
   * Initialize generator
   */
  async initialize() {
    // Initialize template manager
    this.templateManager = new TemplateManager(this.projectPath, this.options.templateDir);
    await this.templateManager.initialize();

    // Initialize storage manager
    this.storageManager = new StorageManager(this.projectPath, {
      agentsDir: this.options.agentsDir,
      preserveCustom: this.options.preserveCustom
    });
    await this.storageManager.initialize();

    // Load architecture analysis
    this.architecture = await this._loadArchitecture();

    if (!this.architecture) {
      throw new Error('Architecture analysis not found. Run /agentful-analyze first.');
    }
  }

  /**
   * Generate agents from architecture analysis
   *
   * @returns {Promise<{agents: Array, duration: number, generated: number}>}
   */
  async generateAgents() {
    const startTime = Date.now();
    const agents = [];

    // Determine which agents to generate based on architecture
    const agentSpecs = this._determineAgentsToGenerate();

    // Generate each agent
    for (const spec of agentSpecs) {
      try {
        const agent = await this._generateAgent(spec);
        agents.push(agent);
      } catch (error) {
        console.error(`Failed to generate ${spec.name} agent:`, error.message);
        // Continue with other agents
      }
    }

    // Validate generated agents
    if (this.options.validateOutput) {
      await this._validateAgents(agents);
    }

    // Save agents to storage
    await this.storageManager.saveAgents(agents);

    const duration = Date.now() - startTime;

    return {
      agents,
      generated: agents.length,
      duration,
      performance: duration < 5000 ? 'PASS' : 'SLOW'
    };
  }

  /**
   * Generate a single agent
   *
   * @param {Object} spec - Agent specification
   * @returns {Promise<Object>} Generated agent
   * @private
   */
  async _generateAgent(spec) {
    // Load appropriate template
    const template = await this.templateManager.loadTemplate(spec.template);

    // Prepare context for template compilation
    const context = await this._buildContext(spec);

    // Compile template
    const content = this._compileTemplate(template, context);

    // Extract code examples from codebase
    const examples = await this._extractCodeExamples(spec);

    // Inject examples into content
    const enhancedContent = this._injectExamples(content, examples);

    // Create agent metadata
    const metadata = {
      name: spec.name,
      version: '1.0.0',
      template: spec.template,
      generated: new Date().toISOString(),
      customized: false,
      checksum: this._calculateChecksum(enhancedContent),
      architecture: {
        framework: spec.framework,
        language: spec.language,
        patterns: spec.patterns || []
      }
    };

    return {
      metadata,
      content: enhancedContent,
      configuration: spec.configuration || {}
    };
  }

  /**
   * Determine which agents to generate based on architecture
   *
   * @returns {Array} Agent specifications
   * @private
   */
  _determineAgentsToGenerate() {
    const specs = [];
    const { techStack, patterns, projectType } = this.architecture;

    // Always generate core agents
    specs.push(
      { name: 'orchestrator', template: 'base/orchestrator' },
      { name: 'architect', template: 'base/architect' },
      { name: 'reviewer', template: 'base/reviewer' },
      { name: 'fixer', template: 'base/fixer' },
      { name: 'tester', template: 'base/tester' }
    );

    // Generate backend agent if server-side code detected
    if (techStack.backend || patterns.includes('backend')) {
      specs.push({
        name: 'backend',
        template: this._selectBackendTemplate(),
        framework: techStack.backend?.framework,
        language: techStack.backend?.language || techStack.language,
        patterns: patterns.filter(p => p.includes('backend') || p.includes('api'))
      });
    }

    // Generate frontend agent if client-side code detected
    if (techStack.frontend || patterns.includes('frontend')) {
      specs.push({
        name: 'frontend',
        template: this._selectFrontendTemplate(),
        framework: techStack.frontend?.framework,
        language: techStack.frontend?.language || techStack.language,
        patterns: patterns.filter(p => p.includes('frontend') || p.includes('ui'))
      });
    }

    // Generate database agent if database detected
    if (techStack.database) {
      specs.push({
        name: 'database',
        template: this._selectDatabaseTemplate(),
        database: techStack.database
      });
    }

    // Generate framework-specific agents
    if (techStack.framework) {
      const frameworkAgent = this._createFrameworkAgent(techStack.framework);
      if (frameworkAgent) {
        specs.push(frameworkAgent);
      }
    }

    return specs;
  }

  /**
   * Select backend template based on framework
   *
   * @returns {string} Template path
   * @private
   */
  _selectBackendTemplate() {
    const framework = this.architecture.techStack.backend?.framework;

    const frameworkTemplates = {
      'express': 'frameworks/express-backend',
      'fastify': 'frameworks/fastify-backend',
      'nestjs': 'frameworks/nestjs-backend',
      'koa': 'frameworks/koa-backend',
      'django': 'frameworks/django-backend',
      'flask': 'frameworks/flask-backend',
      'spring': 'frameworks/spring-backend'
    };

    return frameworkTemplates[framework] || 'base/backend';
  }

  /**
   * Select frontend template based on framework
   *
   * @returns {string} Template path
   * @private
   */
  _selectFrontendTemplate() {
    const framework = this.architecture.techStack.frontend?.framework;

    const frameworkTemplates = {
      'react': 'frameworks/react-frontend',
      'vue': 'frameworks/vue-frontend',
      'angular': 'frameworks/angular-frontend',
      'svelte': 'frameworks/svelte-frontend',
      'nextjs': 'frameworks/nextjs-frontend',
      'nuxt': 'frameworks/nuxt-frontend'
    };

    return frameworkTemplates[framework] || 'base/frontend';
  }

  /**
   * Select database template based on database type
   *
   * @returns {string} Template path
   * @private
   */
  _selectDatabaseTemplate() {
    const dbType = this.architecture.techStack.database?.type;

    const dbTemplates = {
      'postgresql': 'patterns/postgresql',
      'mysql': 'patterns/mysql',
      'mongodb': 'patterns/mongodb',
      'sqlite': 'patterns/sqlite',
      'redis': 'patterns/redis'
    };

    return dbTemplates[dbType] || 'patterns/database';
  }

  /**
   * Create framework-specific agent
   *
   * @param {string} framework - Framework name
   * @returns {Object|null} Agent spec or null
   * @private
   */
  _createFrameworkAgent(framework) {
    const frameworkAgents = {
      'nextjs': {
        name: 'nextjs-specialist',
        template: 'frameworks/nextjs',
        framework: 'nextjs'
      },
      'nestjs': {
        name: 'nestjs-specialist',
        template: 'frameworks/nestjs',
        framework: 'nestjs'
      }
    };

    return frameworkAgents[framework] || null;
  }

  /**
   * Build context for template compilation
   *
   * @param {Object} spec - Agent specification
   * @returns {Promise<Object>} Template context
   * @private
   */
  async _buildContext(spec) {
    const context = {
      projectName: this.architecture.projectName || path.basename(this.projectPath),
      language: spec.language || this.architecture.techStack.language,
      framework: spec.framework,
      projectType: this.architecture.projectType,
      techStack: this.architecture.techStack,
      patterns: spec.patterns || [],
      conventions: this.architecture.conventions || {},
      timestamp: new Date().toISOString()
    };

    // Add framework-specific context
    if (spec.framework) {
      context.frameworkConfig = await this._extractFrameworkConfig(spec.framework);
    }

    // Add database context
    if (spec.database) {
      context.database = spec.database;
      context.orm = this.architecture.techStack.orm;
    }

    return context;
  }

  /**
   * Compile template with Handlebars
   *
   * @param {string} template - Template content
   * @param {Object} context - Template context
   * @returns {string} Compiled content
   * @private
   */
  _compileTemplate(template, context) {
    try {
      const compiled = this.handlebars.compile(template);
      return compiled(context);
    } catch (error) {
      throw new Error(`Template compilation failed: ${error.message}`);
    }
  }

  /**
   * Extract code examples from analyzed codebase
   *
   * @param {Object} spec - Agent specification
   * @returns {Promise<Object>} Code examples
   * @private
   */
  async _extractCodeExamples(spec) {
    const examples = {
      patterns: [],
      conventions: [],
      bestPractices: []
    };

    // Extract patterns from architecture analysis
    if (this.architecture.codeExamples) {
      const relevantExamples = this.architecture.codeExamples.filter(ex => {
        return ex.category === spec.name || ex.tags?.includes(spec.name);
      });

      examples.patterns = relevantExamples.slice(0, 3); // Limit to 3 examples
    }

    // Extract conventions
    if (this.architecture.conventions) {
      const conventions = this.architecture.conventions[spec.name];
      if (conventions) {
        examples.conventions = Array.isArray(conventions)
          ? conventions
          : [conventions];
      }
    }

    return examples;
  }

  /**
   * Inject code examples into agent content
   *
   * @param {string} content - Agent content
   * @param {Object} examples - Code examples
   * @returns {string} Enhanced content
   * @private
   */
  _injectExamples(content, examples) {
    let enhanced = content;

    // Add examples section if we have examples
    if (examples.patterns.length > 0) {
      const examplesSection = this._buildExamplesSection(examples);

      // Inject before the last section (usually "Rules" or similar)
      const lastHeadingIndex = enhanced.lastIndexOf('\n## ');
      if (lastHeadingIndex !== -1) {
        enhanced =
          enhanced.slice(0, lastHeadingIndex) +
          '\n\n' + examplesSection +
          enhanced.slice(lastHeadingIndex);
      } else {
        enhanced += '\n\n' + examplesSection;
      }
    }

    return enhanced;
  }

  /**
   * Build examples section
   *
   * @param {Object} examples - Code examples
   * @returns {string} Examples markdown
   * @private
   */
  _buildExamplesSection(examples) {
    const sections = [];

    sections.push('## Code Examples from This Project\n');
    sections.push('These examples show how THIS specific project implements patterns:\n');

    for (const example of examples.patterns) {
      sections.push(`### ${example.title || 'Example'}\n`);
      sections.push(`**File**: \`${example.file}\`\n`);

      if (example.description) {
        sections.push(`${example.description}\n`);
      }

      sections.push('```' + (example.language || '') + '\n');
      sections.push(example.code + '\n');
      sections.push('```\n');
    }

    if (examples.conventions.length > 0) {
      sections.push('### Project Conventions\n');
      for (const convention of examples.conventions) {
        sections.push(`- ${convention}\n`);
      }
    }

    return sections.join('\n');
  }

  /**
   * Validate generated agents
   *
   * @param {Array} agents - Generated agents
   * @returns {Promise<void>}
   * @private
   */
  async _validateAgents(agents) {
    const errors = [];

    for (const agent of agents) {
      // Validate frontmatter
      const frontmatterMatch = agent.content.match(/^---\n([\s\S]*?)\n---/);
      if (!frontmatterMatch) {
        errors.push(`${agent.metadata.name}: Missing frontmatter`);
        continue;
      }

      // Validate required frontmatter fields
      const frontmatter = frontmatterMatch[1];
      const requiredFields = ['name', 'description', 'model', 'tools'];

      for (const field of requiredFields) {
        if (!frontmatter.includes(`${field}:`)) {
          errors.push(`${agent.metadata.name}: Missing required field '${field}' in frontmatter`);
        }
      }

      // Validate structure (should have at least one heading)
      if (!agent.content.includes('# ')) {
        errors.push(`${agent.metadata.name}: No main heading found`);
      }

      // Validate no broken references
      const references = agent.content.match(/@\w+/g) || [];
      for (const ref of references) {
        const agentName = ref.slice(1);
        // Check if referenced agent exists in generated set or is a known agent
        const exists = agents.some(a => a.metadata.name === agentName) ||
          ['orchestrator', 'architect', 'backend', 'frontend', 'reviewer', 'fixer', 'tester'].includes(agentName);

        if (!exists) {
          console.warn(`${agent.metadata.name}: Reference to unknown agent: ${ref}`);
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(`Agent validation failed:\n${errors.join('\n')}`);
    }
  }

  /**
   * Load architecture analysis
   *
   * @returns {Promise<Object|null>} Architecture data
   * @private
   */
  async _loadArchitecture() {
    const architecturePath = path.join(this.projectPath, '.agentful', 'architecture.json');

    try {
      const content = await fs.readFile(architecturePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Extract framework configuration
   *
   * @param {string} framework - Framework name
   * @returns {Promise<Object>} Framework config
   * @private
   */
  async _extractFrameworkConfig(framework) {
    const config = {};

    // Try to load framework config files
    const configFiles = {
      'nextjs': 'next.config.js',
      'nestjs': 'nest-cli.json',
      'vue': 'vue.config.js',
      'react': 'react-app-env.d.ts'
    };

    const configFile = configFiles[framework];
    if (configFile) {
      const configPath = path.join(this.projectPath, configFile);
      try {
        await fs.access(configPath);
        config.configFile = configFile;
        config.hasConfig = true;
      } catch {
        config.hasConfig = false;
      }
    }

    return config;
  }

  /**
   * Calculate checksum for content
   *
   * @param {string} content - Content to hash
   * @returns {string} Checksum
   * @private
   */
  _calculateChecksum(content) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
  }

  /**
   * Register Handlebars helpers
   *
   * @private
   */
  _registerHelpers() {
    // Helper: Capitalize first letter
    this.handlebars.registerHelper('capitalize', (str) => {
      return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
    });

    // Helper: Uppercase
    this.handlebars.registerHelper('uppercase', (str) => {
      return str ? str.toUpperCase() : '';
    });

    // Helper: Code block
    this.handlebars.registerHelper('codeBlock', (code, language) => {
      return `\`\`\`${language || ''}\n${code}\n\`\`\``;
    });

    // Helper: List items
    this.handlebars.registerHelper('list', (items) => {
      if (!Array.isArray(items)) return '';
      return items.map(item => `- ${item}`).join('\n');
    });

    // Helper: Join array
    this.handlebars.registerHelper('join', (arr, separator) => {
      if (!Array.isArray(arr)) return '';
      return arr.join(separator || ', ');
    });

    // Helper: Conditional equality
    this.handlebars.registerHelper('eq', (a, b) => {
      return a === b;
    });

    // Helper: Conditional includes
    this.handlebars.registerHelper('includes', (arr, item) => {
      return Array.isArray(arr) && arr.includes(item);
    });

    // Helper: Format date
    this.handlebars.registerHelper('formatDate', (date) => {
      return new Date(date).toISOString().split('T')[0];
    });

    // Helper: JSON stringify
    this.handlebars.registerHelper('json', (obj) => {
      return JSON.stringify(obj, null, 2);
    });
  }
}

export default AgentGenerator;
