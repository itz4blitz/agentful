/**
 * Data access adapters for MCP resources
 * Provides consistent interface for reading agentful state files
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Base adapter with common functionality
 */
class BaseAdapter {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.cache = new Map();
    this.cacheTTL = 5000; // 5 seconds
  }

  /**
   * Read JSON file with caching
   * @param {string} filePath - Absolute file path
   * @returns {Promise<Object>}
   */
  async readJSON(filePath) {
    const cacheKey = filePath;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw new Error(`Failed to read ${filePath}: ${error.message}`);
    }
  }

  /**
   * Read markdown file
   * @param {string} filePath - Absolute file path
   * @returns {Promise<string|null>}
   */
  async readMarkdown(filePath) {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw new Error(`Failed to read ${filePath}: ${error.message}`);
    }
  }

  /**
   * List directory contents
   * @param {string} dirPath - Directory path
   * @returns {Promise<string[]>}
   */
  async readdir(dirPath) {
    try {
      return await fs.readdir(dirPath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw new Error(`Failed to read directory ${dirPath}: ${error.message}`);
    }
  }

  /**
   * Check if file exists
   * @param {string} filePath - File path
   * @returns {Promise<boolean>}
   */
  async exists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Invalidate cache for a specific file or all files
   * @param {string} [filePath] - Optional file path to invalidate
   */
  invalidateCache(filePath) {
    if (filePath) {
      this.cache.delete(filePath);
    } else {
      this.cache.clear();
    }
  }
}

/**
 * State adapter - reads .agentful/state.json
 */
export class StateAdapter extends BaseAdapter {
  async readState() {
    const statePath = path.join(this.projectRoot, '.agentful', 'state.json');
    const state = await this.readJSON(statePath);

    if (!state) {
      return {
        initialized: null,
        version: null,
        agents: [],
        skills: [],
        error: 'State file not found. Run agentful init to initialize.'
      };
    }

    return state;
  }
}

/**
 * Completion adapter - reads .agentful/completion.json
 */
export class CompletionAdapter extends BaseAdapter {
  async readCompletion() {
    const completionPath = path.join(this.projectRoot, '.agentful', 'completion.json');
    const completion = await this.readJSON(completionPath);

    if (!completion) {
      return {
        domains: {},
        features: {},
        subtasks: {},
        validationGates: {},
        overallProgress: 0,
        error: 'Completion file not found.'
      };
    }

    return completion;
  }
}

/**
 * Decisions adapter - reads .agentful/decisions.json
 */
export class DecisionsAdapter extends BaseAdapter {
  async readDecisions() {
    const decisionsPath = path.join(this.projectRoot, '.agentful', 'decisions.json');
    const decisions = await this.readJSON(decisionsPath);

    if (!decisions) {
      return {
        decisions: [],
        lastUpdated: null,
        error: 'Decisions file not found.'
      };
    }

    return decisions;
  }
}

/**
 * Architecture adapter - reads .agentful/architecture.json
 */
export class ArchitectureAdapter extends BaseAdapter {
  async readArchitecture() {
    const archPath = path.join(this.projectRoot, '.agentful', 'architecture.json');
    const arch = await this.readJSON(archPath);

    if (!arch) {
      return {
        version: null,
        techStack: null,
        domains: [],
        generatedAgents: [],
        generatedSkills: [],
        error: 'Architecture not analyzed. Run /agentful-generate to analyze your codebase.'
      };
    }

    return arch;
  }
}

/**
 * Product spec adapter - reads .claude/product/
 */
export class ProductAdapter extends BaseAdapter {
  async readProductSpec() {
    const productDir = path.join(this.projectRoot, '.claude', 'product');
    const flatSpecPath = path.join(productDir, 'index.md');

    // Check for flat structure first
    const flatSpec = await this.readMarkdown(flatSpecPath);
    if (flatSpec) {
      return {
        structure: 'flat',
        content: flatSpec,
        path: flatSpecPath
      };
    }

    // Check for hierarchical structure
    const domainsDir = path.join(productDir, 'domains');
    const hasDomains = await this.exists(domainsDir);

    if (hasDomains) {
      const domains = await this.readdir(domainsDir);
      const domainSpecs = {};

      for (const domain of domains) {
        const domainIndexPath = path.join(domainsDir, domain, 'index.md');
        const domainContent = await this.readMarkdown(domainIndexPath);
        if (domainContent) {
          domainSpecs[domain] = {
            path: domainIndexPath,
            content: domainContent
          };
        }
      }

      if (Object.keys(domainSpecs).length > 0) {
        return {
          structure: 'hierarchical',
          domains: domainSpecs
        };
      }
    }

    return {
      structure: null,
      error: 'No product specification found. Create .claude/product/index.md to define your product.'
    };
  }
}

/**
 * Agents adapter - reads .claude/agents/
 */
export class AgentsAdapter extends BaseAdapter {
  async listAgents() {
    const agentsDir = path.join(this.projectRoot, '.claude', 'agents');
    const exists = await this.exists(agentsDir);

    if (!exists) {
      return {
        agents: [],
        count: 0,
        error: 'Agents directory not found. Run agentful init to initialize.'
      };
    }

    const files = await this.readdir(agentsDir);
    const agents = files
      .filter(file => file.endsWith('.md'))
      .map(file => file.replace('.md', ''));

    return {
      agents,
      count: agents.length
    };
  }

  async getAgent(name) {
    const agentPath = path.join(this.projectRoot, '.claude', 'agents', `${name}.md`);
    const content = await this.readMarkdown(agentPath);

    if (!content) {
      return {
        name,
        error: `Agent "${name}" not found.`
      };
    }

    return {
      name,
      content,
      path: agentPath
    };
  }
}

/**
 * Create all adapters with shared project root
 * @param {string} projectRoot - Project root directory
 * @returns {Object} Object containing all adapters
 */
export function createAdapters(projectRoot = process.cwd()) {
  return {
    state: new StateAdapter(projectRoot),
    completion: new CompletionAdapter(projectRoot),
    decisions: new DecisionsAdapter(projectRoot),
    architecture: new ArchitectureAdapter(projectRoot),
    product: new ProductAdapter(projectRoot),
    agents: new AgentsAdapter(projectRoot)
  };
}
