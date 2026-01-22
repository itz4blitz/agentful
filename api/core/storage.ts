/**
 * Storage Management System
 * Handles persistence of agents, metadata, and version control
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';
import { execSync } from 'child_process';

// Types
export interface StorageConfig {
  projectPath: string;
  agentsPath?: string;
  metadataPath?: string;
  versionsPath?: string;
  gitEnabled?: boolean;
  autoCommit?: boolean;
}

export interface Version {
  version: string;
  timestamp: Date;
  agents: string[];
  metadata: any;
  changes: Change[];
  checksum: string;
}

export interface Change {
  type: 'added' | 'modified' | 'deleted';
  path: string;
  description?: string;
}

export interface StorageMetadata {
  version: string;
  lastModified: Date;
  agents: AgentEntry[];
  architecture?: any;
  generations: GenerationEntry[];
}

export interface AgentEntry {
  name: string;
  path: string;
  version: string;
  template: string;
  customized: boolean;
  lastModified: Date;
  checksum: string;
}

export interface GenerationEntry {
  timestamp: Date;
  agentsGenerated: string[];
  success: boolean;
  duration: number;
  analysisChecksum: string;
}

/**
 * Storage Manager - Handles all file system operations
 */
export class StorageManager {
  private config: Required<StorageConfig>;
  private metadata: StorageMetadata | null = null;

  constructor(config: StorageConfig) {
    this.config = {
      projectPath: config.projectPath,
      agentsPath: config.agentsPath || path.join(config.projectPath, '.agentful/agents'),
      metadataPath: config.metadataPath || path.join(config.projectPath, '.agentful'),
      versionsPath: config.versionsPath || path.join(config.projectPath, '.agentful/versions'),
      gitEnabled: config.gitEnabled ?? true,
      autoCommit: config.autoCommit ?? false
    };
  }

  /**
   * Initialize storage system
   */
  async initialize(): Promise<void> {
    await this.createDirectoryStructure();
    await this.loadMetadata();
    await this.updateGitignore();
  }

  /**
   * Save agents to storage
   */
  async saveAgents(agents: any[], options?: { version?: string; commit?: boolean }): Promise<void> {
    const version = options?.version || await this.generateVersion();
    const generatedPath = path.join(this.config.agentsPath, 'generated');

    // Clear generated directory
    await this.clearDirectory(generatedPath);

    // Save each agent
    const agentEntries: AgentEntry[] = [];
    for (const agent of agents) {
      const entry = await this.saveAgent(agent, generatedPath);
      agentEntries.push(entry);
    }

    // Update metadata
    await this.updateMetadata({
      agents: agentEntries,
      lastModified: new Date(),
      version
    });

    // Create version snapshot
    await this.createVersion(version, agents);

    // Commit if requested
    if (options?.commit || this.config.autoCommit) {
      await this.commitChanges(version, agentEntries);
    }
  }

  /**
   * Load agent by name
   */
  async loadAgent(name: string): Promise<any | null> {
    const paths = [
      path.join(this.config.agentsPath, 'custom', `${name}.md`),
      path.join(this.config.agentsPath, 'generated', `${name}.md`)
    ];

    for (const agentPath of paths) {
      try {
        const content = await fs.readFile(agentPath, 'utf-8');
        const metadataPath = agentPath.replace('.md', '.json');

        let metadata = {};
        try {
          metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
        } catch {
          // Metadata file might not exist
        }

        return {
          name,
          content,
          metadata,
          path: agentPath
        };
      } catch {
        // File doesn't exist, continue
      }
    }

    return null;
  }

  /**
   * List all agents
   */
  async listAgents(): Promise<AgentEntry[]> {
    const agents: AgentEntry[] = [];

    // List generated agents
    const generatedPath = path.join(this.config.agentsPath, 'generated');
    const generatedAgents = await this.listAgentsInDirectory(generatedPath, 'generated');
    agents.push(...generatedAgents);

    // List custom agents
    const customPath = path.join(this.config.agentsPath, 'custom');
    const customAgents = await this.listAgentsInDirectory(customPath, 'custom');
    agents.push(...customAgents);

    return agents;
  }

  /**
   * Save architecture analysis
   */
  async saveArchitecture(architecture: any): Promise<void> {
    const architecturePath = path.join(this.config.metadataPath, 'architecture.json');
    await fs.writeFile(architecturePath, JSON.stringify(architecture, null, 2), 'utf-8');

    await this.updateMetadata({
      architecture,
      lastModified: new Date()
    });
  }

  /**
   * Load architecture analysis
   */
  async loadArchitecture(): Promise<any | null> {
    const architecturePath = path.join(this.config.metadataPath, 'architecture.json');

    try {
      const content = await fs.readFile(architecturePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  /**
   * Create version snapshot
   */
  private async createVersion(version: string, agents: any[]): Promise<void> {
    const versionPath = path.join(this.config.versionsPath, version);
    await fs.mkdir(versionPath, { recursive: true });

    // Copy agents
    const agentsVersionPath = path.join(versionPath, 'agents');
    await fs.mkdir(agentsVersionPath, { recursive: true });

    for (const agent of agents) {
      const sourcePath = agent.metadata.filePath;
      const destPath = path.join(agentsVersionPath, path.basename(sourcePath));
      await fs.copyFile(sourcePath, destPath);

      // Copy metadata
      const metadataSourcePath = sourcePath.replace('.md', '.json');
      const metadataDestPath = destPath.replace('.md', '.json');
      try {
        await fs.copyFile(metadataSourcePath, metadataDestPath);
      } catch {
        // Metadata might not exist
      }
    }

    // Copy architecture
    const architectureSource = path.join(this.config.metadataPath, 'architecture.json');
    const architectureDest = path.join(versionPath, 'architecture.json');
    try {
      await fs.copyFile(architectureSource, architectureDest);
    } catch {
      // Architecture might not exist
    }

    // Create version metadata
    const versionMetadata: Version = {
      version,
      timestamp: new Date(),
      agents: agents.map(a => a.metadata.name),
      metadata: this.metadata,
      changes: await this.detectChanges(version),
      checksum: await this.calculateVersionChecksum(versionPath)
    };

    await fs.writeFile(
      path.join(versionPath, 'version.json'),
      JSON.stringify(versionMetadata, null, 2),
      'utf-8'
    );
  }

  /**
   * List versions
   */
  async listVersions(): Promise<Version[]> {
    const versions: Version[] = [];

    try {
      const versionDirs = await fs.readdir(this.config.versionsPath);

      for (const dir of versionDirs) {
        const versionPath = path.join(this.config.versionsPath, dir);
        const metadataPath = path.join(versionPath, 'version.json');

        try {
          const content = await fs.readFile(metadataPath, 'utf-8');
          versions.push(JSON.parse(content));
        } catch {
          // Invalid version directory
        }
      }
    } catch {
      // Versions directory doesn't exist
    }

    return versions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Restore from version
   */
  async restoreVersion(version: string): Promise<void> {
    const versionPath = path.join(this.config.versionsPath, version);

    // Verify version exists
    try {
      await fs.access(versionPath);
    } catch {
      throw new Error(`Version ${version} not found`);
    }

    // Backup current state
    const backupVersion = `backup-${Date.now()}`;
    await this.createVersion(backupVersion, await this.listAgents());

    // Clear current generated agents
    const generatedPath = path.join(this.config.agentsPath, 'generated');
    await this.clearDirectory(generatedPath);

    // Restore agents
    const agentsVersionPath = path.join(versionPath, 'agents');
    const agentFiles = await fs.readdir(agentsVersionPath);

    for (const file of agentFiles) {
      const sourcePath = path.join(agentsVersionPath, file);
      const destPath = path.join(generatedPath, file);
      await fs.copyFile(sourcePath, destPath);
    }

    // Restore architecture
    const architectureSource = path.join(versionPath, 'architecture.json');
    const architectureDest = path.join(this.config.metadataPath, 'architecture.json');
    try {
      await fs.copyFile(architectureSource, architectureDest);
    } catch {
      // Architecture might not exist
    }

    // Update metadata
    const versionMetadata = JSON.parse(
      await fs.readFile(path.join(versionPath, 'version.json'), 'utf-8')
    );

    await this.updateMetadata({
      version,
      lastModified: new Date(),
      restoredFrom: version,
      previousBackup: backupVersion
    });
  }

  /**
   * Save individual agent
   */
  private async saveAgent(agent: any, directory: string): Promise<AgentEntry> {
    const agentPath = path.join(directory, `${agent.metadata.name}.md`);
    const metadataPath = path.join(directory, `${agent.metadata.name}.json`);
    const configPath = path.join(directory, `${agent.metadata.name}.config.json`);

    // Ensure directory exists
    await fs.mkdir(directory, { recursive: true });

    // Save agent content
    await fs.writeFile(agentPath, agent.content, 'utf-8');

    // Save metadata
    await fs.writeFile(metadataPath, JSON.stringify(agent.metadata, null, 2), 'utf-8');

    // Save configuration if exists
    if (agent.configuration) {
      await fs.writeFile(configPath, JSON.stringify(agent.configuration, null, 2), 'utf-8');
    }

    return {
      name: agent.metadata.name,
      path: agentPath,
      version: agent.metadata.version,
      template: agent.metadata.template,
      customized: agent.metadata.customized || false,
      lastModified: new Date(),
      checksum: agent.metadata.checksum
    };
  }

  /**
   * List agents in directory
   */
  private async listAgentsInDirectory(directory: string, type: string): Promise<AgentEntry[]> {
    const agents: AgentEntry[] = [];

    try {
      const files = await fs.readdir(directory);

      for (const file of files) {
        if (file.endsWith('.md')) {
          const name = path.basename(file, '.md');
          const agentPath = path.join(directory, file);
          const metadataPath = path.join(directory, `${name}.json`);

          let metadata: any = {};
          try {
            metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
          } catch {
            // Metadata might not exist
          }

          const stats = await fs.stat(agentPath);

          agents.push({
            name,
            path: agentPath,
            version: metadata.version || '1.0.0',
            template: metadata.template || type,
            customized: type === 'custom',
            lastModified: stats.mtime,
            checksum: metadata.checksum || ''
          });
        }
      }
    } catch {
      // Directory doesn't exist
    }

    return agents;
  }

  /**
   * Create directory structure
   */
  private async createDirectoryStructure(): Promise<void> {
    const directories = [
      this.config.metadataPath,
      this.config.agentsPath,
      path.join(this.config.agentsPath, 'generated'),
      path.join(this.config.agentsPath, 'custom'),
      this.config.versionsPath
    ];

    for (const dir of directories) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /**
   * Load metadata
   */
  private async loadMetadata(): Promise<void> {
    const metadataPath = path.join(this.config.metadataPath, 'metadata.json');

    try {
      const content = await fs.readFile(metadataPath, 'utf-8');
      this.metadata = JSON.parse(content);
    } catch {
      // Initialize with defaults
      this.metadata = {
        version: '1.0.0',
        lastModified: new Date(),
        agents: [],
        generations: []
      };
    }
  }

  /**
   * Update metadata
   */
  private async updateMetadata(updates: Partial<StorageMetadata>): Promise<void> {
    this.metadata = {
      ...this.metadata!,
      ...updates
    };

    const metadataPath = path.join(this.config.metadataPath, 'metadata.json');
    await fs.writeFile(metadataPath, JSON.stringify(this.metadata, null, 2), 'utf-8');
  }

  /**
   * Clear directory
   */
  private async clearDirectory(directory: string): Promise<void> {
    try {
      const files = await fs.readdir(directory);
      for (const file of files) {
        await fs.unlink(path.join(directory, file));
      }
    } catch {
      // Directory doesn't exist
      await fs.mkdir(directory, { recursive: true });
    }
  }

  /**
   * Update .gitignore
   */
  private async updateGitignore(): Promise<void> {
    if (!this.config.gitEnabled) return;

    const gitignorePath = path.join(this.config.projectPath, '.gitignore');
    const ignorePatterns = [
      '# agentful generated files',
      '.agentful/agents/generated/',
      '.agentful/metadata.json',
      '.agentful/generation.log',
      '.agentful/versions/',
      '.agentful/cache/',
      ''
    ];

    try {
      const content = await fs.readFile(gitignorePath, 'utf-8');

      if (!content.includes('# agentful')) {
        await fs.appendFile(gitignorePath, '\n' + ignorePatterns.join('\n'));
      }
    } catch {
      // .gitignore doesn't exist, create it
      await fs.writeFile(gitignorePath, ignorePatterns.join('\n'));
    }
  }

  /**
   * Commit changes to git
   */
  private async commitChanges(version: string, agents: AgentEntry[]): Promise<void> {
    if (!this.config.gitEnabled || !this.config.autoCommit) return;

    try {
      // Check if git repo
      execSync('git rev-parse --git-dir', { cwd: this.config.projectPath });

      // Add files
      execSync('git add .agentful/', { cwd: this.config.projectPath });

      // Create commit message
      const message = `agentful: Generated ${agents.length} agents (v${version})

Agents generated:
${agents.map(a => `- ${a.name}`).join('\n')}

Generated by agentful agent generation system`;

      // Commit
      execSync(`git commit -m "${message}"`, { cwd: this.config.projectPath });
    } catch (error) {
      // Not a git repo or commit failed, skip
      console.warn('Failed to commit changes:', error);
    }
  }

  /**
   * Generate version string
   */
  private async generateVersion(): Promise<string> {
    const versions = await this.listVersions();

    if (versions.length === 0) {
      return '1.0.0';
    }

    const latest = versions[0];
    const [major, minor, patch] = latest.version.split('.').map(Number);

    return `${major}.${minor}.${patch + 1}`;
  }

  /**
   * Detect changes for version
   */
  private async detectChanges(version: string): Promise<Change[]> {
    const changes: Change[] = [];
    const versions = await this.listVersions();

    if (versions.length === 0) {
      // First version, all agents are new
      const agents = await this.listAgents();
      for (const agent of agents) {
        changes.push({
          type: 'added',
          path: agent.path,
          description: `Added ${agent.name} agent`
        });
      }
    } else {
      // Compare with previous version
      const previous = versions[0];
      const currentAgents = new Set((await this.listAgents()).map(a => a.name));
      const previousAgents = new Set(previous.agents);

      // Find added agents
      for (const agent of currentAgents) {
        if (!previousAgents.has(agent)) {
          changes.push({
            type: 'added',
            path: `${agent}.md`,
            description: `Added ${agent} agent`
          });
        }
      }

      // Find deleted agents
      for (const agent of previousAgents) {
        if (!currentAgents.has(agent)) {
          changes.push({
            type: 'deleted',
            path: `${agent}.md`,
            description: `Removed ${agent} agent`
          });
        }
      }

      // Find modified agents (simplified - would need checksum comparison)
      for (const agent of currentAgents) {
        if (previousAgents.has(agent)) {
          // In production, would compare checksums
          changes.push({
            type: 'modified',
            path: `${agent}.md`,
            description: `Updated ${agent} agent`
          });
        }
      }
    }

    return changes;
  }

  /**
   * Calculate version checksum
   */
  private async calculateVersionChecksum(versionPath: string): Promise<string> {
    const hash = createHash('sha256');
    const files = await this.getAllFiles(versionPath);

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      hash.update(content);
    }

    return hash.digest('hex');
  }

  /**
   * Get all files recursively
   */
  private async getAllFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        files.push(...await this.getAllFiles(fullPath));
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }
}