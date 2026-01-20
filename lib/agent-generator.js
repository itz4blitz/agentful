/**
 * Smart Agent Generation System
 *
 * Analyzes codebase and generates contextually-aware agents
 * that understand the project's tech stack, patterns, and conventions.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import TemplateEngine from './template-engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Default core agent types registry
 * Users can extend this by passing custom agent types to the constructor
 */
const DEFAULT_CORE_AGENT_TYPES = ['backend', 'frontend', 'tester', 'reviewer', 'fixer'];

/**
 * Default agent patterns configuration
 * Defines how each agent type should extract patterns from the codebase
 */
const DEFAULT_AGENT_PATTERNS = {
  backend: {
    directories: ['src/repositories', 'src/services', 'src/controllers', 'src/routes', 'api'],
    keywords: ['repository', 'service', 'controller', 'route', 'handler'],
  },
  frontend: {
    directories: ['src/components', 'src/pages', 'src/app', 'components', 'pages'],
    keywords: ['component', 'hook', 'page', 'view'],
  },
  tester: {
    directories: ['tests', 'test', '__tests__', '__tests__', 'spec'],
    keywords: ['describe', 'test', 'it', 'expect', 'mock'],
  },
  reviewer: {
    directories: ['src'],
    keywords: ['export', 'function', 'class', 'interface'],
  },
  fixer: {
    directories: ['src'],
    keywords: ['error', 'bug', 'fix', 'throw'],
  },
};

class AgentGenerator {
  /**
   * @param {string} projectPath - Path to the project
   * @param {object} analysis - Project analysis results
   * @param {object} options - Configuration options
   * @param {string[]} options.customAgentTypes - Additional core agent types to generate
   * @param {object} options.customAgentPatterns - Pattern configurations for custom agent types
   */
  constructor(projectPath, analysis, options = {}) {
    this.projectPath = projectPath;
    this.analysis = analysis;
    this.templatesDir = path.join(__dirname, '../templates/agents');
    this.agentsDir = path.join(projectPath, '.claude/agents/auto-generated');

    // Extensible agent type registry
    this.coreAgentTypes = [...DEFAULT_CORE_AGENT_TYPES];
    this.agentPatterns = { ...DEFAULT_AGENT_PATTERNS };

    // Apply custom agent types if provided
    if (options.customAgentTypes && Array.isArray(options.customAgentTypes)) {
      this.coreAgentTypes.push(...options.customAgentTypes);
    }

    // Apply custom agent patterns if provided
    if (options.customAgentPatterns && typeof options.customAgentPatterns === 'object') {
      Object.assign(this.agentPatterns, options.customAgentPatterns);
    }
  }

  /**
   * Register a custom agent type at runtime
   * @param {string} type - Agent type name
   * @param {object} pattern - Pattern configuration for the agent type
   * @param {string[]} pattern.directories - Directories to scan for this agent type
   * @param {string[]} pattern.keywords - Keywords to look for in code
   */
  registerAgentType(type, pattern) {
    if (!this.coreAgentTypes.includes(type)) {
      this.coreAgentTypes.push(type);
    }

    if (pattern) {
      this.agentPatterns[type] = pattern;
    }
  }

  /**
   * Get all registered core agent types
   * @returns {string[]} List of core agent types
   */
  getCoreAgentTypes() {
    return [...this.coreAgentTypes];
  }

  /**
   * Get pattern configuration for a specific agent type
   * @param {string} type - Agent type name
   * @returns {object|null} Pattern configuration or null if not found
   */
  getAgentPattern(type) {
    return this.agentPatterns[type] || null;
  }

  /**
   * Load custom agent types from a configuration file
   * @param {string} configPath - Path to the configuration file (JSON)
   * @returns {Promise<void>}
   */
  async loadCustomAgentTypesFromConfig(configPath) {
    try {
      const content = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(content);

      if (config.customAgentTypes && Array.isArray(config.customAgentTypes)) {
        for (const agentConfig of config.customAgentTypes) {
          if (agentConfig.type && agentConfig.pattern) {
            this.registerAgentType(agentConfig.type, agentConfig.pattern);
          }
        }
      }

      console.log(`✅ Loaded custom agent types from ${configPath}`);
    } catch (error) {
      console.warn(`⚠️  Could not load custom agent types from ${configPath}: ${error.message}`);
    }
  }

  /**
   * Main entry point - generates all agents based on analysis
   */
  async generateAgents() {
    console.log('🤖 Generating agents...');

    // Ensure agents directory exists
    await fs.mkdir(this.agentsDir, { recursive: true });

    // Generate core agents (always)
    const coreAgents = await this.generateCoreAgents();

    // Generate domain agents (conditional based on detected domains)
    const domainAgents = await this.generateDomainAgents();

    // Generate tech-specific agents (conditional based on tech stack)
    const techAgents = await this.generateTechAgents();

    // Update architecture.json with generated agent info
    await this.updateArchitectureConfig({
      core: coreAgents,
      domains: domainAgents,
      tech: techAgents,
    });

    console.log(`✅ Generated ${coreAgents.length + domainAgents.length + techAgents.length} agents`);

    return {
      core: coreAgents,
      domains: domainAgents,
      tech: techAgents,
    };
  }

  /**
   * Generate core agents (always needed)
   */
  async generateCoreAgents() {
    const agents = [];

    for (const type of this.coreAgentTypes) {
      const agentPath = path.join(this.agentsDir, `${type}.md`);
      const template = await this.loadTemplate(`${type}-agent.template.md`);

      if (!template) {
        console.warn(`⚠️  No template found for ${type}, skipping`);
        continue;
      }

      // Extract patterns from actual code
      const patterns = await this.extractPatterns(type);

      // Interpolate template with project-specific data
      const content = TemplateEngine.render(template, {
        language: this.analysis.primaryLanguage || 'javascript',
        framework: this.analysis.primaryFramework || 'custom',
        patterns: patterns.code,
        conventions: patterns.conventions,
        samples: patterns.samples,
        generated_at: new Date().toISOString(),
      });

      await fs.writeFile(agentPath, content);
      agents.push({ type, path: agentPath });
    }

    return agents;
  }

  /**
   * Generate domain-specific agents (auth, billing, etc.)
   */
  async generateDomainAgents() {
    const domains = this.analysis.domains || [];
    const agents = [];

    for (const domain of domains) {
      const agentPath = path.join(this.agentsDir, `${domain.name}-agent.md`);

      // Extract domain-specific code samples
      const samples = await this.extractDomainSamples(domain);

      // Generate domain context
      const domainContext = {
        domain: domain.name,
        features: domain.features || [],
        language: this.analysis.primaryLanguage || 'javascript',
        framework: this.analysis.primaryFramework || 'custom',
        confidence: domain.confidence || 0.5,
        codeSamples: samples.code,
        patterns: samples.patterns,
        endpoints: samples.endpoints,
        models: samples.models,
        generated_at: new Date().toISOString(),
      };

      const template = await this.loadTemplate('domain-agent.template.md');
      const content = TemplateEngine.render(template, domainContext);

      await fs.writeFile(agentPath, content);
      agents.push({ type: domain.name, path: agentPath });
    }

    return agents;
  }

  /**
   * Generate tech-specific agents (Next.js, Prisma, etc.)
   */
  async generateTechAgents() {
    const techStack = this.analysis.techStack || {};
    const agents = [];

    // Framework-specific agents
    if (techStack.framework) {
      const framework = techStack.framework.toLowerCase();
      if (['nextjs', 'nuxt', 'remix'].includes(framework)) {
        const agent = await this.generateFrameworkAgent(framework);
        if (agent) agents.push(agent);
      }
    }

    // ORM-specific agents
    if (techStack.orm) {
      const orm = techStack.orm.toLowerCase();
      if (['prisma', 'drizzle', 'typeorm', 'mongoose'].includes(orm)) {
        const agent = await this.generateORMAgent(orm);
        if (agent) agents.push(agent);
      }
    }

    // Database-specific agents
    if (techStack.database) {
      const db = techStack.database.toLowerCase();
      if (['postgresql', 'mongodb', 'mysql', 'sqlite'].includes(db)) {
        const agent = await this.generateDatabaseAgent(db);
        if (agent) agents.push(agent);
      }
    }

    return agents;
  }

  /**
   * Generate framework-specific agent
   */
  async generateFrameworkAgent(framework) {
    const agentPath = path.join(this.agentsDir, `${framework}-agent.md`);
    const template = await this.loadTemplate('tech-agent.template.md');

    if (!template) return null;

    const samples = await this.extractFrameworkSamples(framework);

    const content = TemplateEngine.render(template, {
      tech: framework,
      techType: 'framework',
      language: this.analysis.primaryLanguage || 'javascript',
      framework: framework,
      patterns: samples.patterns,
      conventions: samples.conventions,
      samples: samples.code,
      generated_at: new Date().toISOString(),
    });

    await fs.writeFile(agentPath, content);
    return { type: framework, path: agentPath };
  }

  /**
   * Generate ORM-specific agent
   */
  async generateORMAgent(orm) {
    const agentPath = path.join(this.agentsDir, `${orm}-agent.md`);
    const template = await this.loadTemplate('tech-agent.template.md');

    if (!template) return null;

    const samples = await this.extractORMSamples(orm);

    const content = TemplateEngine.render(template, {
      tech: orm,
      techType: 'orm',
      language: this.analysis.primaryLanguage || 'javascript',
      framework: this.analysis.primaryFramework || 'custom',
      patterns: samples.patterns,
      conventions: samples.conventions,
      samples: samples.code,
      generated_at: new Date().toISOString(),
    });

    await fs.writeFile(agentPath, content);
    return { type: orm, path: agentPath };
  }

  /**
   * Generate database-specific agent
   */
  async generateDatabaseAgent(database) {
    const agentPath = path.join(this.agentsDir, `${database}-agent.md`);
    const template = await this.loadTemplate('tech-agent.template.md');

    if (!template) return null;

    const samples = await this.extractDatabaseSamples(database);

    const content = TemplateEngine.render(template, {
      tech: database,
      techType: 'database',
      language: this.analysis.primaryLanguage || 'javascript',
      framework: this.analysis.primaryFramework || 'custom',
      patterns: samples.patterns,
      conventions: samples.conventions,
      samples: samples.code,
      generated_at: new Date().toISOString(),
    });

    await fs.writeFile(agentPath, content);
    return { type: database, path: agentPath };
  }

  /**
   * Extract code patterns for a specific agent type
   */
  async extractPatterns(agentType) {
    const patterns = {
      code: [],
      conventions: [],
      samples: [],
    };

    // Get pattern configuration from registry
    const config = this.agentPatterns[agentType];
    if (!config) {
      console.warn(`⚠️  No pattern configuration found for agent type: ${agentType}`);
      return patterns;
    }

    // Scan directories for patterns
    for (const dir of config.directories) {
      const dirPath = path.join(this.projectPath, dir);
      try {
        const files = await this.scanDirectory(dirPath, 10); // Sample up to 10 files

        for (const file of files) {
          const content = await fs.readFile(file, 'utf-8');
          const relativePath = path.relative(this.projectPath, file);

          // Extract code samples
          if (content.length > 0 && content.length < 2000) {
            patterns.samples.push({
              path: relativePath,
              content: content,
            });
          }

          // Identify patterns
          for (const keyword of config.keywords) {
            if (content.toLowerCase().includes(keyword)) {
              patterns.code.push({
                keyword,
                context: this.extractContext(content, keyword),
              });
            }
          }
        }
      } catch (error) {
        // Directory doesn't exist, skip
      }
    }

    // Detect naming conventions
    patterns.conventions = await this.detectConventions(agentType);

    return patterns;
  }

  /**
   * Extract domain-specific code samples
   */
  async extractDomainSamples(domain) {
    const samples = {
      code: [],
      patterns: [],
      endpoints: [],
      models: [],
    };

    // Find domain-specific files
    const domainPatterns = {
      'auth-agent': ['auth', 'user', 'login', 'register', 'session', 'token'],
      'billing-agent': ['billing', 'payment', 'subscription', 'invoice', 'stripe'],
      'content-agent': ['content', 'post', 'article', 'blog', 'page'],
      'notification-agent': ['notification', 'email', 'sms', 'push'],
    };

    const keywords = domainPatterns[domain.name] || [domain.name];

    // Scan for domain files
    const files = await this.findFilesByKeywords(keywords, 5);

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      const relativePath = path.relative(this.projectPath, file);

      samples.code.push({
        path: relativePath,
        content: content.substring(0, 1500), // Limit size
      });

      // Extract API endpoints
      if (content.includes('router.') || content.includes('app.') || content.includes('@Get')) {
        samples.endpoints.push(...this.extractEndpoints(content, relativePath));
      }

      // Extract data models
      if (content.includes('model') || content.includes('schema') || content.includes('interface')) {
        samples.models.push(...this.extractModels(content, relativePath));
      }
    }

    return samples;
  }

  /**
   * Extract framework-specific samples
   */
  async extractFrameworkSamples(framework) {
    const samples = {
      code: [],
      patterns: [],
      conventions: [],
    };

    const frameworkPatterns = {
      nextjs: ['app/', 'pages/', 'middleware.ts', 'next.config'],
      nuxt: ['pages/', 'components/', 'nuxt.config'],
      remix: ['routes/', 'app/routes/', 'loader', 'action'],
    };

    const patterns = frameworkPatterns[framework] || [];

    for (const pattern of patterns) {
      const files = await this.findFilesByPattern(pattern, 3);

      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        const relativePath = path.relative(this.projectPath, file);

        samples.code.push({
          path: relativePath,
          content: content.substring(0, 1000),
        });
      }
    }

    return samples;
  }

  /**
   * Extract ORM-specific samples
   */
  async extractORMSamples(orm) {
    const samples = {
      code: [],
      patterns: [],
      conventions: [],
    };

    const ormFiles = {
      prisma: ['schema.prisma', 'client.ts'],
      drizzle: ['schema.ts', 'db.ts'],
      typeorm: ['entity.ts', 'repository.ts'],
      mongoose: ['model.ts', 'schema.ts'],
    };

    const files = ormFiles[orm] || [];

    for (const file of files) {
      const foundFiles = await this.findFilesByPattern(file, 2);

      for (const foundFile of foundFiles) {
        const content = await fs.readFile(foundFile, 'utf-8');
        const relativePath = path.relative(this.projectPath, foundFile);

        samples.code.push({
          path: relativePath,
          content: content.substring(0, 1000),
        });
      }
    }

    return samples;
  }

  /**
   * Extract database-specific samples
   */
  async extractDatabaseSamples(database) {
    const samples = {
      code: [],
      patterns: [],
      conventions: [],
    };

    // Look for migration files, SQL files, etc.
    const patterns = ['migrations/', '*.sql', 'schema.sql', 'seeds/'];

    for (const pattern of patterns) {
      const files = await this.findFilesByPattern(pattern, 3);

      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        const relativePath = path.relative(this.projectPath, file);

        samples.code.push({
          path: relativePath,
          content: content.substring(0, 1000),
        });
      }
    }

    return samples;
  }

  /**
   * Scan directory for files
   */
  async scanDirectory(dirPath, maxFiles = 10) {
    const files = [];

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        if (files.length >= maxFiles) break;

        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          const subFiles = await this.scanDirectory(fullPath, maxFiles - files.length);
          files.push(...subFiles);
        } else if (entry.isFile() && this.isSourceFile(entry.name)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read
    }

    return files;
  }

  /**
   * Find files by keywords in name
   */
  async findFilesByKeywords(keywords, maxFiles = 5) {
    const allFiles = [];

    for (const keyword of keywords) {
      const files = await this.findFilesByPattern(keyword, maxFiles);
      allFiles.push(...files);
    }

    return allFiles.slice(0, maxFiles);
  }

  /**
   * Find files by pattern
   */
  async findFilesByPattern(pattern, maxFiles = 5) {
    const files = [];

    const scanDir = async (dirPath) => {
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
          if (files.length >= maxFiles) return;

          const fullPath = path.join(dirPath, entry.name);

          if (entry.isDirectory()) {
            // Skip node_modules and similar
            if (!['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
              await scanDir(fullPath);
            }
          } else if (entry.isFile()) {
            if (entry.name.toLowerCase().includes(pattern.toLowerCase()) ||
                fullPath.toLowerCase().includes(pattern.toLowerCase())) {
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        // Can't read directory
      }
    };

    await scanDir(this.projectPath);
    return files;
  }

  /**
   * Check if file is a source file
   */
  isSourceFile(filename) {
    const extensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.go', '.rs'];
    return extensions.some(ext => filename.endsWith(ext));
  }

  /**
   * Extract context around a keyword
   */
  extractContext(content, keyword) {
    const lines = content.split('\n');
    const context = [];

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(keyword.toLowerCase())) {
        const start = Math.max(0, i - 2);
        const end = Math.min(lines.length, i + 3);
        context.push(lines.slice(start, end).join('\n'));
      }
    }

    return context.slice(0, 3); // Max 3 contexts
  }

  /**
   * Detect naming conventions
   */
  async detectConventions(agentType) {
    const conventions = [];

    // Sample some files to detect conventions
    const files = await this.findFilesByPattern('.ts', 5);

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');

      // Detect import style
      if (content.includes('@/')) {
        conventions.push('Uses @ alias for imports');
      }

      // Detect naming patterns
      if (content.match(/class \w+/)) {
        conventions.push('Uses class-based components');
      }

      if (content.match(/export (const|function) \w+/)) {
        conventions.push('Uses functional exports');
      }
    }

    return [...new Set(conventions)]; // Deduplicate
  }

  /**
   * Extract API endpoints from code
   */
  extractEndpoints(content, filePath) {
    const endpoints = [];
    const lines = content.split('\n');

    for (const line of lines) {
      if (line.includes('router.') || line.includes('app.')) {
        endpoints.push({
          file: filePath,
          code: line.trim(),
        });
      }
    }

    return endpoints.slice(0, 5);
  }

  /**
   * Extract data models from code
   */
  extractModels(content, filePath) {
    const models = [];
    const lines = content.split('\n');

    for (const line of lines) {
      if (line.includes('model ') || line.includes('schema ') || line.includes('interface ')) {
        models.push({
          file: filePath,
          code: line.trim(),
        });
      }
    }

    return models.slice(0, 5);
  }

  /**
   * Load template file
   */
  async loadTemplate(templateName) {
    const templatePath = path.join(this.templatesDir, templateName);

    try {
      return await fs.readFile(templatePath, 'utf-8');
    } catch (error) {
      console.warn(`Template not found: ${templateName}`);
      return null;
    }
  }

  /**
   * Update architecture.json with agent info
   */
  async updateArchitectureConfig(agents) {
    const configPath = path.join(this.projectPath, '.agentful/architecture.json');

    let config = {};

    try {
      const content = await fs.readFile(configPath, 'utf-8');
      config = JSON.parse(content);
    } catch (error) {
      // Config doesn't exist yet
    }

    config.agents = {
      generated: {
        core: agents.core.map(a => a.type),
        domains: agents.domains.map(a => a.type),
        tech: agents.tech.map(a => a.type),
      },
      generatedAt: new Date().toISOString(),
    };

    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
  }
}

export default AgentGenerator;

// Export default configurations for use by consumers
export { DEFAULT_CORE_AGENT_TYPES, DEFAULT_AGENT_PATTERNS };
