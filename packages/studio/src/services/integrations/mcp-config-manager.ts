/**
 * MCP Configuration Manager
 * Handles different config formats for various coding CLI tools
 */

import { postMessage, onMessage, isRunningInVSCode } from '@/services/vscode';
import type { ToolFormat, CLITool } from './tool-detection';

export interface MCPConfig {
  servers: MCPServerDefinition[];
}

export interface MCPServerDefinition {
  id: string;
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  disabled?: boolean;
}

export interface MCPRegistryEntry {
  id: string;
  name: string;
  description: string;
  publisher: string;
  npmPackage?: string;
  githubUrl?: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  requirements?: string[];
  tags: string[];
  icon?: string;
}

// Universal MCP Registry
export const UNIVERSAL_MCP_REGISTRY: MCPRegistryEntry[] = [
  {
    id: 'filesystem',
    name: 'File System',
    description: 'Secure file system access with configurable allowed directories',
    publisher: 'Anthropic',
    npmPackage: '@modelcontextprotocol/server-filesystem',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem'],
    requirements: ['allowedDirectories'],
    tags: ['filesystem', 'core', 'official'],
    icon: '📁',
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Repository management, PRs, issues, and file operations',
    publisher: 'Anthropic',
    npmPackage: '@modelcontextprotocol/server-github',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    env: { GITHUB_PERSONAL_ACCESS_TOKEN: '' },
    tags: ['github', 'git', 'official'],
    icon: '🔗',
  },
  {
    id: 'postgres',
    name: 'PostgreSQL',
    description: 'Read-only database access with schema inspection',
    publisher: 'Anthropic',
    npmPackage: '@modelcontextprotocol/server-postgres',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-postgres'],
    requirements: ['databaseUrl'],
    tags: ['database', 'postgres', 'sql', 'official'],
    icon: '🐘',
  },
  {
    id: 'sqlite',
    name: 'SQLite',
    description: 'SQLite database operations',
    publisher: 'Anthropic',
    npmPackage: '@modelcontextprotocol/server-sqlite',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-sqlite'],
    requirements: ['dbPath'],
    tags: ['database', 'sqlite', 'sql', 'official'],
    icon: '🗄️',
  },
  {
    id: 'puppeteer',
    name: 'Puppeteer',
    description: 'Browser automation and web scraping',
    publisher: 'Anthropic',
    npmPackage: '@modelcontextprotocol/server-puppeteer',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-puppeteer'],
    tags: ['browser', 'automation', 'scraping', 'official'],
    icon: '🎭',
  },
  {
    id: 'fetch',
    name: 'Fetch',
    description: 'Web content fetching and conversion for LLM usage',
    publisher: 'Anthropic',
    npmPackage: '@modelcontextprotocol/server-fetch',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-fetch'],
    tags: ['http', 'api', 'fetch', 'official'],
    icon: '🌐',
  },
  {
    id: 'brave-search',
    name: 'Brave Search',
    description: 'Web search capabilities via Brave Search API',
    publisher: 'Anthropic',
    npmPackage: '@modelcontextprotocol/server-brave-search',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-brave-search'],
    env: { BRAVE_API_KEY: '' },
    tags: ['search', 'web', 'brave', 'official'],
    icon: '🔍',
  },
  {
    id: 'google-maps',
    name: 'Google Maps',
    description: 'Location services, directions, and place details',
    publisher: 'Anthropic',
    npmPackage: '@modelcontextprotocol/server-google-maps',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-google-maps'],
    env: { GOOGLE_MAPS_API_KEY: '' },
    tags: ['maps', 'location', 'google', 'official'],
    icon: '🗺️',
  },
  {
    id: 'sentry',
    name: 'Sentry',
    description: 'Error tracking and performance monitoring',
    publisher: 'Anthropic',
    npmPackage: '@modelcontextprotocol/server-sentry',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-sentry'],
    env: { SENTRY_AUTH_TOKEN: '' },
    tags: ['monitoring', 'errors', 'sentry', 'official'],
    icon: '🐛',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Channel management and messaging',
    publisher: 'Anthropic',
    npmPackage: '@modelcontextprotocol/server-slack',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-slack'],
    env: { SLACK_BOT_TOKEN: '', SLACK_TEAM_ID: '' },
    tags: ['messaging', 'slack', 'communication', 'official'],
    icon: '💬',
  },
];

export class MCPConfigManager {
  /**
   * Read MCP config for a tool
   */
  async readConfig(tool: CLITool): Promise<MCPConfig | null> {
    if (!isRunningInVSCode()) {
      return null;
    }
    
    return new Promise((resolve) => {
      const unsubscribe = onMessage('mcpConfig', (message) => {
        if (message.toolId === tool.id) {
          unsubscribe();
          resolve(message.config);
        }
      });

      setTimeout(() => {
        unsubscribe();
        resolve(null);
      }, 5000);

      postMessage('readMCPConfig', { toolId: tool.id });
    });
  }

  /**
   * Write MCP config for a tool
   */
  async writeConfig(tool: CLITool, config: MCPConfig): Promise<boolean> {
    if (!isRunningInVSCode()) {
      return false;
    }
    
    return new Promise((resolve) => {
      const unsubscribe = onMessage('mcpConfigSaved', (message) => {
        if (message.toolId === tool.id) {
          unsubscribe();
          resolve(message.success);
        }
      });

      setTimeout(() => {
        unsubscribe();
        resolve(false);
      }, 5000);

      postMessage('writeMCPConfig', { 
        toolId: tool.id,
        config 
      });
    });
  }

  /**
   * Add MCP server to a tool
   */
  async addServer(tool: CLITool, server: MCPRegistryEntry, config: Record<string, string>): Promise<boolean> {
    const args = [...server.args];
    
    // Replace template variables in args
    for (let i = 0; i < args.length; i++) {
      for (const [key, value] of Object.entries(config)) {
        args[i] = args[i].replace(`{{${key}}}`, value);
      }
    }
    
    // Handle filesystem special case - add allowed directories to args
    if (server.id === 'filesystem' && config.allowedDirectories) {
      args.push(config.allowedDirectories);
    }
    
    // Handle postgres special case - add connection string to args
    if (server.id === 'postgres' && config.databaseUrl) {
      args.push(config.databaseUrl);
    }
    
    // Handle sqlite special case - add db path to args
    if (server.id === 'sqlite' && config.dbPath) {
      args.push(config.dbPath);
    }
    
    const serverDef: MCPServerDefinition = {
      id: server.id,
      name: server.name,
      command: server.command,
      args,
      env: server.env ? Object.fromEntries(
        Object.entries(server.env).map(([key]) => [key, config[key] || ''])
      ) : undefined,
    };

    const currentConfig = await this.readConfig(tool);
    const servers = currentConfig?.servers || [];
    
    // Remove existing if present
    const filtered = servers.filter(s => s.id !== server.id);
    filtered.push(serverDef);
    
    return this.writeConfig(tool, { servers: filtered });
  }

  /**
   * Remove MCP server from a tool
   */
  async removeServer(tool: CLITool, serverId: string): Promise<boolean> {
    const currentConfig = await this.readConfig(tool);
    if (!currentConfig) return false;
    
    const servers = currentConfig.servers.filter(s => s.id !== serverId);
    return this.writeConfig(tool, { servers });
  }

  /**
   * Toggle MCP server enabled/disabled
   */
  async toggleServer(tool: CLITool, serverId: string, enabled: boolean): Promise<boolean> {
    const currentConfig = await this.readConfig(tool);
    if (!currentConfig) return false;
    
    const servers = currentConfig.servers.map(s => {
      if (s.id === serverId) {
        return { ...s, disabled: !enabled };
      }
      return s;
    });
    
    return this.writeConfig(tool, { servers });
  }

  /**
   * Search MCP registry
   */
  searchRegistry(query: string): MCPRegistryEntry[] {
    const lower = query.toLowerCase();
    return UNIVERSAL_MCP_REGISTRY.filter(entry => 
      entry.name.toLowerCase().includes(lower) ||
      entry.description.toLowerCase().includes(lower) ||
      entry.tags.some(t => t.toLowerCase().includes(lower))
    );
  }

  /**
   * Get MCP by ID
   */
  getMCPById(id: string): MCPRegistryEntry | undefined {
    return UNIVERSAL_MCP_REGISTRY.find(e => e.id === id);
  }

  /**
   * Get all MCPs by tag
   */
  getMCPsByTag(tag: string): MCPRegistryEntry[] {
    return UNIVERSAL_MCP_REGISTRY.filter(e => 
      e.tags.includes(tag)
    );
  }
}

// Singleton instance
export const mcpConfigManager = new MCPConfigManager();
