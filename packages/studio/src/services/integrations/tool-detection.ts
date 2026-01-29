/**
 * Coding CLI Tool Detection Service
 * Detects installed AI coding CLI tools (Claude Code, Gemini CLI, etc.)
 */

import { postMessage, onMessage, isRunningInVSCode } from '@/services/vscode';

export type ToolFormat = 'claude' | 'gemini' | 'codex' | 'aider' | 'kiro' | 'cursor' | 'roo' | 'cline' | 'kilo';

export interface CLITool {
  id: ToolFormat;
  name: string;
  command: string;
  configPath: string;
  mcpFormat: ToolFormat;
  version?: string;
  isInstalled: boolean;
  isRunning?: boolean;
  lastDetected?: Date;
  installPath?: string;
  description: string;
  website: string;
  supports: {
    mcp: boolean;
    skills: boolean;
    agents: boolean;
    hooks: boolean;
  };
}

export interface ToolStatus {
  isRunning: boolean;
  pid?: number;
  uptime?: number;
  mcpServers: MCPServerStatus[];
}

export interface MCPServerStatus {
  id: string;
  name: string;
  status: 'active' | 'error' | 'connecting' | 'stopped';
  lastError?: string;
  uptime?: number;
  requestCount?: number;
}

// Major AI-powered CLI tools with MCP support
const TOOL_DEFINITIONS: Omit<CLITool, 'version' | 'isInstalled' | 'isRunning' | 'installPath'>[] = [
  {
    id: 'claude',
    name: 'Claude Code',
    command: 'claude',
    configPath: '~/.claude/settings.json',
    mcpFormat: 'claude',
    description: 'Anthropic\'s official CLI coding assistant',
    website: 'https://docs.anthropic.com/en/docs/agents-and-tools/claude-code',
    supports: { mcp: true, skills: true, agents: true, hooks: false },
  },
  {
    id: 'gemini',
    name: 'Gemini CLI',
    command: 'gemini',
    configPath: '~/.gemini/config.json',
    mcpFormat: 'gemini',
    description: 'Google\'s AI coding agent with hooks support',
    website: 'https://ai.google.dev/gemini-api/docs/cli',
    supports: { mcp: true, skills: true, agents: true, hooks: true },
  },
  {
    id: 'codex',
    name: 'Codex CLI',
    command: 'codex',
    configPath: '~/.config/codex/config.json',
    mcpFormat: 'codex',
    description: 'OpenAI\'s coding agent',
    website: 'https://platform.openai.com/docs/codex',
    supports: { mcp: true, skills: false, agents: true, hooks: false },
  },
  {
    id: 'aider',
    name: 'Aider',
    command: 'aider',
    configPath: '~/.aider/config.yml',
    mcpFormat: 'aider',
    description: 'AI pair programming with git integration',
    website: 'https://aider.chat/',
    supports: { mcp: true, skills: false, agents: true, hooks: false },
  },
  {
    id: 'kiro',
    name: 'Kiro',
    command: 'kiro',
    configPath: '~/.kiro/config.yaml',
    mcpFormat: 'kiro',
    description: 'AI coding assistant',
    website: 'https://kiro.dev/',
    supports: { mcp: false, skills: false, agents: true, hooks: false },
  },
  // IDE-based tools (for completeness)
  {
    id: 'cursor',
    name: 'Cursor',
    command: 'cursor',
    configPath: '.cursor/mcp.json',
    mcpFormat: 'cursor',
    description: 'AI-first code editor',
    website: 'https://cursor.com/',
    supports: { mcp: true, skills: true, agents: true, hooks: false },
  },
  {
    id: 'roo',
    name: 'Roo Code',
    command: 'code',
    configPath: '.vscode/settings.json',
    mcpFormat: 'roo',
    description: 'VS Code extension for AI coding',
    website: 'https://github.com/RooVetGit/Roo-Code',
    supports: { mcp: true, skills: true, agents: true, hooks: false },
  },
  {
    id: 'cline',
    name: 'Cline',
    command: 'code',
    configPath: '.vscode/settings.json',
    mcpFormat: 'cline',
    description: 'VS Code extension with autonomous coding',
    website: 'https://cline.bot/',
    supports: { mcp: true, skills: false, agents: true, hooks: false },
  },
  {
    id: 'kilo',
    name: 'Kilo Code',
    command: 'code',
    configPath: '.vscode/settings.json',
    mcpFormat: 'kilo',
    description: 'VS Code extension with MCP marketplace',
    website: 'https://kilo.ai/',
    supports: { mcp: true, skills: true, agents: true, hooks: false },
  },
];

export class ToolDetectionService {
  private cachedTools: Map<string, CLITool> = new Map();
  private lastScan: Date | null = null;

  /**
   * Detect all installed coding CLI tools
   * Uses VS Code extension API to run system commands
   */
  async detectInstalledTools(): Promise<CLITool[]> {
    if (!isRunningInVSCode()) {
      console.log('[ToolDetection] Not running in VS Code, returning cached/mock tools');
      // Return mock data for development
      return [];
    }

    console.log('[ToolDetection] Requesting tool detection from extension...');
    
    return new Promise((resolve, reject) => {
      // Set up one-time handler for response
      const unsubscribe = onMessage('toolsDetected', (message) => {
        console.log('[ToolDetection] Received toolsDetected response:', message);
        unsubscribe();
        
        if (message.error) {
          reject(new Error(message.error));
          return;
        }
        
        const tools = message.tools || [];
        this.setCachedTools(tools);
        resolve(tools);
      });

      // Set timeout
      setTimeout(() => {
        unsubscribe();
        reject(new Error('Tool detection timed out after 10 seconds'));
      }, 10000);

      // Send request
      postMessage('detectTools', {});
    });
  }

  /**
   * Get detailed status of a tool including MCP health
   */
  async getToolStatus(toolId: string): Promise<ToolStatus | null> {
    if (!isRunningInVSCode()) {
      return null;
    }
    
    return new Promise((resolve) => {
      const unsubscribe = onMessage('toolStatus', (message) => {
        if (message.toolId === toolId) {
          unsubscribe();
          resolve(message.status);
        }
      });

      setTimeout(() => {
        unsubscribe();
        resolve(null);
      }, 5000);

      postMessage('getToolStatus', { toolId });
    });
  }

  /**
   * Get cached tools without rescanning
   */
  getCachedTools(): CLITool[] {
    return Array.from(this.cachedTools.values());
  }

  /**
   * Get a specific tool by ID
   */
  getTool(id: string): CLITool | undefined {
    return this.cachedTools.get(id);
  }

  /**
   * Update cached tools (called from extension)
   */
  setCachedTools(tools: CLITool[]): void {
    this.cachedTools.clear();
    for (const tool of tools) {
      this.cachedTools.set(tool.id, tool);
    }
    this.lastScan = new Date();
  }

  /**
   * Get tool definitions (for manual setup)
   */
  getToolDefinitions(): typeof TOOL_DEFINITIONS {
    return TOOL_DEFINITIONS;
  }

  /**
   * Get all tools with MCP support
   */
  getToolsWithMCPSupport(): typeof TOOL_DEFINITIONS {
    return TOOL_DEFINITIONS.filter(t => t.supports.mcp);
  }

  /**
   * Get all tools with hooks support
   */
  getToolsWithHooksSupport(): typeof TOOL_DEFINITIONS {
    return TOOL_DEFINITIONS.filter(t => t.supports.hooks);
  }
}

// Singleton instance
export const toolDetection = new ToolDetectionService();
