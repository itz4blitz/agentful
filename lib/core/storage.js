import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { atomicWrite } from '../atomic.js';

/**
 * Storage Manager
 *
 * Handles persistence of generated and custom agents with:
 * - Separation of generated vs custom agents
 * - Version control integration
 * - Metadata tracking
 * - Checksum validation
 * - User modification preservation
 */
export class StorageManager {
  constructor(projectPath, options = {}) {
    this.projectPath = projectPath;
    this.options = {
      agentsDir: options.agentsDir || '.agentful/agents',
      preserveCustom: options.preserveCustom !== false,
      gitEnabled: options.gitEnabled !== false,
      ...options
    };

    this.agentsPath = path.join(projectPath, this.options.agentsDir);
    this.generatedPath = path.join(this.agentsPath, 'generated');
    this.customPath = path.join(this.agentsPath, 'custom');
    this.metadataPath = path.join(projectPath, '.agentful', 'metadata.json');

    this.metadata = null;
  }

  /**
   * Initialize storage system
   */
  async initialize() {
    await this._createDirectoryStructure();
    await this._loadMetadata();
    await this._updateGitignore();
  }

  /**
   * Save generated agents
   *
   * @param {Array} agents - Generated agents
   * @param {Object} options - Save options
   * @returns {Promise<void>}
   */
  async saveAgents(agents, options = {}) {
    // Preserve custom agents before clearing
    await this._preserveCustomAgents();

    // Clear generated directory
    await this._clearGeneratedDirectory();

    // Save each agent
    const savedAgents = [];
    for (const agent of agents) {
      const saved = await this._saveAgent(agent);
      savedAgents.push(saved);
    }

    // Update metadata
    await this._updateMetadata({
      lastGeneration: new Date().toISOString(),
      generatedAgents: savedAgents.map(a => a.name),
      customAgents: await this._listCustomAgents()
    });

    return savedAgents;
  }

  /**
   * Load agent by name
   *
   * @param {string} name - Agent name
   * @returns {Promise<Object|null>} Agent or null if not found
   */
  async loadAgent(name) {
    // Check custom first (takes precedence)
    const customAgent = await this._loadAgentFromPath(
      path.join(this.customPath, `${name}.md`)
    );
    if (customAgent) {
      return { ...customAgent, customized: true };
    }

    // Check generated
    const generatedAgent = await this._loadAgentFromPath(
      path.join(this.generatedPath, `${name}.md`)
    );
    if (generatedAgent) {
      return { ...generatedAgent, customized: false };
    }

    return null;
  }

  /**
   * List all agents (custom and generated)
   *
   * @returns {Promise<Array>} Agent list
   */
  async listAgents() {
    const agents = [];

    // List custom agents
    const customAgents = await this._listAgentsInDirectory(this.customPath, true);
    agents.push(...customAgents);

    // List generated agents (exclude if custom version exists)
    const generatedAgents = await this._listAgentsInDirectory(this.generatedPath, false);
    const customNames = new Set(customAgents.map(a => a.name));

    for (const agent of generatedAgents) {
      if (!customNames.has(agent.name)) {
        agents.push(agent);
      }
    }

    return agents;
  }

  /**
   * Check if agent has been customized
   *
   * @param {string} name - Agent name
   * @returns {Promise<boolean>} True if customized
   */
  async isCustomized(name) {
    const customPath = path.join(this.customPath, `${name}.md`);

    try {
      await fs.access(customPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Move agent to custom (mark as user-modified)
   *
   * @param {string} name - Agent name
   * @returns {Promise<void>}
   */
  async markAsCustom(name) {
    const generatedFile = path.join(this.generatedPath, `${name}.md`);
    const customFile = path.join(this.customPath, `${name}.md`);

    // Copy generated to custom
    try {
      const content = await fs.readFile(generatedFile, 'utf-8');
      await fs.writeFile(customFile, content, 'utf-8');

      // Update metadata
      await this._updateMetadata({
        customAgents: await this._listCustomAgents()
      });
    } catch (error) {
      throw new Error(`Failed to mark ${name} as custom: ${error.message}`);
    }
  }

  /**
   * Get agent statistics
   *
   * @returns {Promise<Object>} Statistics
   */
  async getStatistics() {
    const customAgents = await this._listCustomAgents();
    const generatedAgents = await this._listGeneratedAgents();

    return {
      total: customAgents.length + generatedAgents.length,
      custom: customAgents.length,
      generated: generatedAgents.length,
      customNames: customAgents,
      generatedNames: generatedAgents
    };
  }

  /**
   * Save individual agent
   *
   * @param {Object} agent - Agent data
   * @returns {Promise<Object>} Saved agent metadata
   * @private
   */
  async _saveAgent(agent) {
    const agentFile = path.join(this.generatedPath, `${agent.metadata.name}.md`);
    const metadataFile = path.join(this.generatedPath, `${agent.metadata.name}.json`);

    // Ensure directory exists
    await fs.mkdir(this.generatedPath, { recursive: true });

    // Write agent content
    await atomicWrite(agentFile, agent.content);

    // Write metadata
    const metadata = {
      ...agent.metadata,
      savedAt: new Date().toISOString(),
      checksum: this._calculateChecksum(agent.content)
    };

    await atomicWrite(metadataFile, JSON.stringify(metadata, null, 2));

    return metadata;
  }

  /**
   * Load agent from path
   *
   * @param {string} agentPath - Agent file path
   * @returns {Promise<Object|null>} Agent or null
   * @private
   */
  async _loadAgentFromPath(agentPath) {
    try {
      const content = await fs.readFile(agentPath, 'utf-8');
      const metadataPath = agentPath.replace('.md', '.json');

      let metadata = {};
      try {
        const metadataContent = await fs.readFile(metadataPath, 'utf-8');
        metadata = JSON.parse(metadataContent);
      } catch {
        // Metadata file doesn't exist, extract from frontmatter
        metadata = this._extractMetadataFromContent(content);
      }

      return {
        name: metadata.name || path.basename(agentPath, '.md'),
        content,
        metadata,
        path: agentPath
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * List agents in directory
   *
   * @param {string} directory - Directory path
   * @param {boolean} customized - Whether agents are customized
   * @returns {Promise<Array>} Agent list
   * @private
   */
  async _listAgentsInDirectory(directory, customized) {
    const agents = [];

    try {
      const files = await fs.readdir(directory);

      for (const file of files) {
        if (file.endsWith('.md')) {
          const name = path.basename(file, '.md');
          const filePath = path.join(directory, file);
          const metadataPath = path.join(directory, `${name}.json`);

          let metadata = {};
          try {
            const content = await fs.readFile(metadataPath, 'utf-8');
            metadata = JSON.parse(content);
          } catch {
            // Metadata file doesn't exist
          }

          const stats = await fs.stat(filePath);

          agents.push({
            name,
            customized,
            path: filePath,
            lastModified: stats.mtime,
            ...metadata
          });
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      // Directory doesn't exist, return empty array
    }

    return agents;
  }

  /**
   * Preserve custom agents before regeneration
   *
   * @private
   */
  async _preserveCustomAgents() {
    if (!this.options.preserveCustom) {
      return;
    }

    // Check if any generated agents have been modified
    try {
      const generatedAgents = await this._listAgentsInDirectory(this.generatedPath, false);

      for (const agent of generatedAgents) {
        const content = await fs.readFile(agent.path, 'utf-8');
        const currentChecksum = this._calculateChecksum(content);

        // Check if checksum differs from metadata (agent was modified)
        if (agent.checksum && currentChecksum !== agent.checksum) {
          // Move to custom directory
          const customFile = path.join(this.customPath, path.basename(agent.path));
          await fs.copyFile(agent.path, customFile);

          console.log(`Preserved modified agent: ${agent.name}`);
        }
      }
    } catch (error) {
      // Directory doesn't exist or other error, skip preservation
    }
  }

  /**
   * Clear generated directory
   *
   * @private
   */
  async _clearGeneratedDirectory() {
    try {
      const files = await fs.readdir(this.generatedPath);

      for (const file of files) {
        await fs.unlink(path.join(this.generatedPath, file));
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      // Directory doesn't exist, create it
      await fs.mkdir(this.generatedPath, { recursive: true });
    }
  }

  /**
   * List custom agent names
   *
   * @returns {Promise<Array>} Custom agent names
   * @private
   */
  async _listCustomAgents() {
    try {
      const files = await fs.readdir(this.customPath);
      return files.filter(f => f.endsWith('.md')).map(f => path.basename(f, '.md'));
    } catch {
      return [];
    }
  }

  /**
   * List generated agent names
   *
   * @returns {Promise<Array>} Generated agent names
   * @private
   */
  async _listGeneratedAgents() {
    try {
      const files = await fs.readdir(this.generatedPath);
      return files.filter(f => f.endsWith('.md')).map(f => path.basename(f, '.md'));
    } catch {
      return [];
    }
  }

  /**
   * Create directory structure
   *
   * @private
   */
  async _createDirectoryStructure() {
    const directories = [
      this.agentsPath,
      this.generatedPath,
      this.customPath,
      path.dirname(this.metadataPath)
    ];

    for (const dir of directories) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /**
   * Load metadata
   *
   * @private
   */
  async _loadMetadata() {
    try {
      const content = await fs.readFile(this.metadataPath, 'utf-8');
      this.metadata = JSON.parse(content);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Initialize with defaults
        this.metadata = {
          version: '1.0.0',
          created: new Date().toISOString(),
          lastGeneration: null,
          generatedAgents: [],
          customAgents: []
        };
      } else {
        throw error;
      }
    }
  }

  /**
   * Update metadata
   *
   * @param {Object} updates - Metadata updates
   * @private
   */
  async _updateMetadata(updates) {
    this.metadata = {
      ...this.metadata,
      ...updates,
      lastUpdated: new Date().toISOString()
    };

    await atomicWrite(this.metadataPath, JSON.stringify(this.metadata, null, 2));
  }

  /**
   * Update .gitignore
   *
   * @private
   */
  async _updateGitignore() {
    if (!this.options.gitEnabled) {
      return;
    }

    const gitignorePath = path.join(this.projectPath, '.gitignore');
    const ignorePatterns = [
      '',
      '# agentful generated agents',
      '.agentful/agents/generated/',
      '.agentful/metadata.json'
    ];

    try {
      let content = '';
      try {
        content = await fs.readFile(gitignorePath, 'utf-8');
      } catch {
        // .gitignore doesn't exist
      }

      // Only add if not already present
      if (!content.includes('# agentful generated agents')) {
        content += '\n' + ignorePatterns.join('\n') + '\n';
        await fs.writeFile(gitignorePath, content, 'utf-8');
      }
    } catch (error) {
      // Ignore errors (non-git project, permissions, etc.)
    }
  }

  /**
   * Calculate checksum for content
   *
   * @param {string} content - Content to hash
   * @returns {string} Checksum
   * @private
   */
  _calculateChecksum(content) {
    return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
  }

  /**
   * Extract metadata from agent frontmatter
   *
   * @param {string} content - Agent content
   * @returns {Object} Metadata
   * @private
   */
  _extractMetadataFromContent(content) {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      return {};
    }

    const frontmatter = frontmatterMatch[1];
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
}

export default StorageManager;
