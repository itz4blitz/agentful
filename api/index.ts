/**
 * agentful API
 * Main entry point for the agent generation system
 */

import { CodebaseAnalyzer, AnalysisResult } from './core/analyzer';
import { AgentGenerator, GenerationOptions, GenerationResult } from './core/generator';
import { TemplateManager, TemplateCompiler } from './core/templates';
import { StorageManager } from './core/storage';
import * as path from 'path';

// Export types
export * from './core/analyzer';
export * from './core/generator';
export * from './core/templates';
export * from './core/storage';

// Configuration
export interface AgentfulConfig {
  projectPath?: string;
  autoAnalyze?: boolean;
  autoGenerate?: boolean;
  gitIntegration?: boolean;
  telemetry?: boolean;
  verbose?: boolean;
}

export interface InitOptions {
  preset?: 'default' | 'minimal' | 'custom';
  agents?: string[];
  skills?: string[];
  force?: boolean;
}

export interface UpdateOptions {
  regenerate?: boolean;
  preserveCustom?: boolean;
  version?: string;
}

export interface ValidateOptions {
  agent?: string;
  fix?: boolean;
  strict?: boolean;
}

/**
 * Main agentful API class
 */
export class Agentful {
  private config: Required<AgentfulConfig>;
  private analyzer: CodebaseAnalyzer;
  private generator: AgentGenerator;
  private templateManager: TemplateManager;
  private storageManager: StorageManager;
  private initialized: boolean = false;

  constructor(config: AgentfulConfig = {}) {
    const projectPath = config.projectPath || process.cwd();

    this.config = {
      projectPath,
      autoAnalyze: config.autoAnalyze ?? true,
      autoGenerate: config.autoGenerate ?? true,
      gitIntegration: config.gitIntegration ?? true,
      telemetry: config.telemetry ?? false,
      verbose: config.verbose ?? false
    };

    // Initialize components
    this.analyzer = new CodebaseAnalyzer(projectPath);
    this.generator = new AgentGenerator(projectPath);
    this.templateManager = new TemplateManager(projectPath);
    this.storageManager = new StorageManager({
      projectPath,
      gitEnabled: this.config.gitIntegration
    });
  }

  /**
   * Initialize agentful in a project
   */
  async initialize(options: InitOptions = {}): Promise<void> {
    if (this.initialized) {
      throw new Error('agentful is already initialized');
    }

    this.log('Initializing agentful...');

    // Initialize storage
    await this.storageManager.initialize();

    // Initialize templates
    await this.templateManager.initialize();

    // Auto-analyze if enabled
    if (this.config.autoAnalyze) {
      const analysis = await this.analyze();

      // Auto-generate if enabled
      if (this.config.autoGenerate && analysis.confidence > 0.3) {
        await this.generate();
      }
    }

    this.initialized = true;
    this.log('agentful initialized successfully');
  }

  /**
   * Analyze the codebase
   */
  async analyze(): Promise<AnalysisResult> {
    this.ensureInitialized();
    this.log('Analyzing codebase...');

    const analysis = await this.analyzer.analyze();

    // Save architecture
    await this.storageManager.saveArchitecture(analysis);

    this.log(`Analysis complete. Confidence: ${(analysis.confidence * 100).toFixed(1)}%`);

    // Re-analyze if low confidence
    if (analysis.confidence < 0.5 && analysis.projectType === 'new') {
      this.log('Low confidence detected. Project appears to be new.');
      this.log('Agents will be generated from best practices.');
      this.log('Re-analysis will occur after initial code is written.');
    }

    return analysis;
  }

  /**
   * Generate agents
   */
  async generate(options: GenerationOptions = {}): Promise<GenerationResult> {
    this.ensureInitialized();
    this.log('Generating agents...');

    // Load or create analysis
    let analysis = await this.storageManager.loadArchitecture();
    if (!analysis) {
      analysis = await this.analyze();
    }

    // Generate agents
    const result = await this.generator.generate(analysis, options);

    if (result.success) {
      // Save agents
      await this.storageManager.saveAgents(result.agents, {
        commit: this.config.gitIntegration
      });

      this.log(`Successfully generated ${result.agents.length} agents`);

      // List generated agents
      for (const agent of result.agents) {
        this.log(`  - ${agent.name} (confidence: ${(agent.confidence * 100).toFixed(0)}%)`);
      }
    } else {
      this.log('Agent generation failed:');
      result.errors?.forEach(err => this.log(`  - ${err}`));
    }

    return result;
  }

  /**
   * Update agents
   */
  async update(agentName?: string, options: UpdateOptions = {}): Promise<void> {
    this.ensureInitialized();

    if (agentName) {
      this.log(`Updating agent: ${agentName}`);

      if (options.regenerate) {
        // Re-generate specific agent
        const analysis = await this.analyze();
        await this.generator.generate(analysis, {
          templates: [agentName]
        });
      }
    } else {
      this.log('Updating all agents...');

      // Re-analyze and regenerate all
      const analysis = await this.analyze();
      const result = await this.generator.generate(analysis);

      if (result.success) {
        await this.storageManager.saveAgents(result.agents, {
          version: options.version
        });
      }
    }
  }

  /**
   * Validate agents
   */
  async validate(options: ValidateOptions = {}): Promise<any> {
    this.ensureInitialized();
    this.log('Validating agents...');

    const agents = await this.storageManager.listAgents();
    const results: any[] = [];

    for (const agent of agents) {
      if (options.agent && agent.name !== options.agent) continue;

      const agentData = await this.storageManager.loadAgent(agent.name);
      if (!agentData) continue;

      // Basic validation
      const issues: string[] = [];

      if (!agentData.content || agentData.content.length < 100) {
        issues.push('Agent content is too short');
      }

      if (!agentData.metadata?.version) {
        issues.push('Agent version is missing');
      }

      results.push({
        agent: agent.name,
        valid: issues.length === 0,
        issues
      });
    }

    // Report results
    const valid = results.every(r => r.valid);
    const total = results.length;
    const passed = results.filter(r => r.valid).length;

    this.log(`Validation complete: ${passed}/${total} agents valid`);

    if (!valid) {
      this.log('Issues found:');
      results.filter(r => !r.valid).forEach(r => {
        this.log(`  ${r.agent}:`);
        r.issues.forEach((issue: string) => this.log(`    - ${issue}`));
      });

      if (options.fix) {
        this.log('Attempting to fix issues...');
        // Fix logic would go here
      }
    }

    return {
      valid,
      results,
      summary: {
        total,
        passed,
        failed: total - passed
      }
    };
  }

  /**
   * Get agent by name
   */
  async getAgent(name: string): Promise<any> {
    this.ensureInitialized();
    return await this.storageManager.loadAgent(name);
  }

  /**
   * List all agents
   */
  async listAgents(): Promise<any[]> {
    this.ensureInitialized();
    return await this.storageManager.listAgents();
  }

  /**
   * Get architecture analysis
   */
  async getArchitecture(): Promise<any> {
    this.ensureInitialized();
    return await this.storageManager.loadArchitecture();
  }

  /**
   * Get system status
   */
  async getStatus(): Promise<any> {
    this.ensureInitialized();

    const agents = await this.storageManager.listAgents();
    const architecture = await this.storageManager.loadArchitecture();
    const templates = await this.templateManager.listTemplates();

    return {
      initialized: this.initialized,
      projectPath: this.config.projectPath,
      agents: {
        total: agents.length,
        generated: agents.filter(a => !a.customized).length,
        custom: agents.filter(a => a.customized).length
      },
      architecture: {
        analyzed: !!architecture,
        confidence: architecture?.confidence || 0,
        lastAnalysis: architecture?.timestamp
      },
      templates: {
        total: templates.length,
        categories: [...new Set(templates.map(t => t.type))]
      }
    };
  }

  /**
   * Regenerate agent
   */
  async regenerate(agentName: string): Promise<void> {
    await this.update(agentName, { regenerate: true });
  }

  /**
   * Clean generated files
   */
  async clean(): Promise<void> {
    this.ensureInitialized();
    this.log('Cleaning generated files...');

    // This would clean up generated agents but preserve custom ones
    const agents = await this.storageManager.listAgents();
    const generatedAgents = agents.filter(a => !a.customized);

    this.log(`Cleaning ${generatedAgents.length} generated agents...`);

    // Clean logic would go here
  }

  /**
   * Ensure system is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('agentful is not initialized. Call initialize() first.');
    }
  }

  /**
   * Log message
   */
  private log(message: string): void {
    if (this.config.verbose) {
      console.log(`[agentful] ${message}`);
    }
  }
}

/**
 * Default export - singleton instance
 */
let defaultInstance: Agentful | null = null;

export const agentful = {
  /**
   * Initialize agentful
   */
  init: async (projectPath?: string, options?: InitOptions) => {
    if (!defaultInstance) {
      defaultInstance = new Agentful({ projectPath });
      await defaultInstance.initialize(options);
    }
    return defaultInstance;
  },

  /**
   * Analyze codebase
   */
  analyze: async () => {
    if (!defaultInstance) {
      defaultInstance = new Agentful();
      await defaultInstance.initialize();
    }
    return defaultInstance.analyze();
  },

  /**
   * Generate agents
   */
  generateAgents: async (options?: GenerationOptions) => {
    if (!defaultInstance) {
      defaultInstance = new Agentful();
      await defaultInstance.initialize();
    }
    return defaultInstance.generate(options);
  },

  /**
   * Get agent
   */
  getAgent: async (name: string) => {
    if (!defaultInstance) {
      defaultInstance = new Agentful();
      await defaultInstance.initialize();
    }
    return defaultInstance.getAgent(name);
  },

  /**
   * List agents
   */
  listAgents: async () => {
    if (!defaultInstance) {
      defaultInstance = new Agentful();
      await defaultInstance.initialize();
    }
    return defaultInstance.listAgents();
  },

  /**
   * Get architecture
   */
  getArchitecture: async () => {
    if (!defaultInstance) {
      defaultInstance = new Agentful();
      await defaultInstance.initialize();
    }
    return defaultInstance.getArchitecture();
  },

  /**
   * Update agents
   */
  update: async (agentName?: string, options?: UpdateOptions) => {
    if (!defaultInstance) {
      defaultInstance = new Agentful();
      await defaultInstance.initialize();
    }
    return defaultInstance.update(agentName, options);
  },

  /**
   * Regenerate agent
   */
  regenerate: async (agentName: string) => {
    if (!defaultInstance) {
      defaultInstance = new Agentful();
      await defaultInstance.initialize();
    }
    return defaultInstance.regenerate(agentName);
  },

  /**
   * Validate agents
   */
  validate: async (options?: ValidateOptions) => {
    if (!defaultInstance) {
      defaultInstance = new Agentful();
      await defaultInstance.initialize();
    }
    return defaultInstance.validate(options);
  },

  /**
   * Get status
   */
  status: async () => {
    if (!defaultInstance) {
      defaultInstance = new Agentful();
      await defaultInstance.initialize();
    }
    return defaultInstance.getStatus();
  },

  /**
   * Clean generated files
   */
  clean: async () => {
    if (!defaultInstance) {
      defaultInstance = new Agentful();
      await defaultInstance.initialize();
    }
    return defaultInstance.clean();
  },

  /**
   * Get instance
   */
  getInstance: () => defaultInstance,

  /**
   * Create new instance
   */
  create: (config?: AgentfulConfig) => new Agentful(config)
};

// CLI exports
export { Agentful as AgentfulCore };
export default agentful;