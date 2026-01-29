/**
 * VS Code Extension-side Tool Integration
 * Handles system commands for tool detection and config management
 */

import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export type ToolFormat = 'claude' | 'gemini' | 'codex' | 'kiro' | 'cursor' | 'roo';

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
}

interface MCPConfig {
  servers: {
    id: string;
    name: string;
    command: string;
    args: string[];
    env?: Record<string, string>;
    disabled?: boolean;
  }[];
}

const TOOL_DEFINITIONS: Omit<CLITool, 'version' | 'isInstalled' | 'isRunning'>[] = [
  {
    id: 'claude',
    name: 'Claude Code',
    command: 'claude',
    configPath: '~/.claude/settings.json',
    mcpFormat: 'claude',
  },
  {
    id: 'gemini',
    name: 'Gemini CLI',
    command: 'gemini',
    configPath: '~/.gemini/config.json',
    mcpFormat: 'gemini',
  },
  {
    id: 'codex',
    name: 'Codex CLI',
    command: 'codex',
    configPath: '~/.config/codex/config.json',
    mcpFormat: 'codex',
  },
  {
    id: 'kiro',
    name: 'Kiro CLI',
    command: 'kiro',
    configPath: '~/.kiro/config.yaml',
    mcpFormat: 'kiro',
  },
  {
    id: 'cursor',
    name: 'Cursor',
    command: 'cursor',
    configPath: '.cursor/mcp.json',
    mcpFormat: 'cursor',
  },
  {
    id: 'roo',
    name: 'Roo Code',
    command: 'code',
    configPath: '.vscode/settings.json',
    mcpFormat: 'roo',
  },
];

export class ToolIntegrationService {
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  /**
   * Detect all installed coding CLI tools
   */
  async detectTools(): Promise<CLITool[]> {
    const tools: CLITool[] = [];

    for (const def of TOOL_DEFINITIONS) {
      const tool = await this.checkTool(def);
      if (tool.isInstalled) {
        tools.push(tool);
      }
    }

    return tools;
  }

  /**
   * Check if a specific tool is installed
   */
  private async checkTool(
    def: Omit<CLITool, 'version' | 'isInstalled' | 'isRunning'>
  ): Promise<CLITool> {
    try {
      // Check if command exists
      const { stdout } = await execAsync(`which ${def.command}`);
      
      if (!stdout.trim()) {
        return { ...def, isInstalled: false };
      }

      // Try to get version
      let version: string | undefined;
      try {
        const versionCommands = [
          `${def.command} --version`,
          `${def.command} -v`,
          `${def.command} version`,
        ];
        
        for (const cmd of versionCommands) {
          try {
            const { stdout: vOut } = await execAsync(cmd, { timeout: 5000 });
            const versionMatch = vOut.match(/(\d+\.\d+\.?\d*)/);
            if (versionMatch) {
              version = versionMatch[1];
              break;
            }
          } catch {
            continue;
          }
        }
      } catch {
        // Version detection failed
      }

      // Check if running
      const isRunning = await this.isToolRunning(def.command);

      return {
        ...def,
        version,
        isInstalled: true,
        isRunning,
        lastDetected: new Date(),
      };
    } catch {
      return { ...def, isInstalled: false };
    }
  }

  /**
   * Check if a tool process is running
   */
  private async isToolRunning(command: string): Promise<boolean> {
    try {
      const platform = os.platform();
      let cmd: string;

      if (platform === 'darwin' || platform === 'linux') {
        cmd = `pgrep -f "${command}"`;
      } else {
        cmd = `tasklist | findstr "${command}"`;
      }

      const { stdout } = await execAsync(cmd);
      return stdout.trim().length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Read MCP config for a tool
   */
  async readMCPConfig(toolId: string): Promise<MCPConfig | null> {
    const tool = TOOL_DEFINITIONS.find(t => t.id === toolId);
    if (!tool) return null;

    const configPath = this.expandPath(tool.configPath);

    try {
      const content = await fs.readFile(configPath, 'utf-8');
      const parsed = JSON.parse(content);
      
      // Convert from tool-specific format to unified format
      return this.parseToolConfig(parsed, tool.mcpFormat);
    } catch {
      return null;
    }
  }

  /**
   * Write MCP config for a tool
   */
  async writeMCPConfig(toolId: string, config: MCPConfig): Promise<boolean> {
    const tool = TOOL_DEFINITIONS.find(t => t.id === toolId);
    if (!tool) return false;

    const configPath = this.expandPath(tool.configPath);

    try {
      // Ensure directory exists
      await fs.mkdir(path.dirname(configPath), { recursive: true });

      // Convert to tool-specific format
      const toolConfig = this.convertToToolConfig(config, tool.mcpFormat);
      
      // Read existing config to preserve other settings
      let existingConfig: any = {};
      try {
        const existing = await fs.readFile(configPath, 'utf-8');
        existingConfig = JSON.parse(existing);
      } catch {
        // File doesn't exist or is invalid
      }

      // Merge MCP config with existing
      const mergedConfig = { ...existingConfig, ...toolConfig };

      await fs.writeFile(configPath, JSON.stringify(mergedConfig, null, 2));
      return true;
    } catch (error) {
      console.error('Failed to write MCP config:', error);
      return false;
    }
  }

  /**
   * Parse tool-specific config to unified format
   */
  private parseToolConfig(config: any, format: ToolFormat): MCPConfig {
    const servers: MCPConfig['servers'] = [];

    switch (format) {
      case 'claude':
        if (config.mcpServers) {
          for (const [id, server] of Object.entries<any>(config.mcpServers)) {
            servers.push({
              id,
              name: id,
              command: server.command,
              args: server.args || [],
              env: server.env,
              disabled: false,
            });
          }
        }
        break;

      case 'gemini':
        if (config.mcp?.servers) {
          for (const server of config.mcp.servers) {
            servers.push({
              id: server.name,
              name: server.name,
              command: server.command,
              args: server.args || [],
              env: server.env,
              disabled: false,
            });
          }
        }
        break;

      case 'cursor':
        if (config.servers) {
          for (const server of config.servers) {
            servers.push({
              id: server.name,
              name: server.name,
              command: server.command,
              args: server.args || [],
              env: server.env,
              disabled: false,
            });
          }
        }
        break;

      case 'codex':
        if (config.mcpServers) {
          for (const [id, server] of Object.entries<any>(config.mcpServers)) {
            servers.push({
              id,
              name: id,
              command: server.command,
              args: server.args || [],
              env: server.env,
              disabled: false,
            });
          }
        }
        break;

      // Add more formats as needed
    }

    return { servers };
  }

  /**
   * Convert unified config to tool-specific format
   */
  private convertToToolConfig(config: MCPConfig, format: ToolFormat): any {
    switch (format) {
      case 'claude':
        const claudeServers: Record<string, any> = {};
        for (const server of config.servers) {
          claudeServers[server.id] = {
            command: server.command,
            args: server.args,
            ...(server.env && { env: server.env }),
          };
        }
        return { mcpServers: claudeServers };

      case 'gemini':
        return {
          mcp: {
            servers: config.servers.map(s => ({
              name: s.id,
              transport: 'stdio',
              command: s.command,
              args: s.args,
              ...(s.env && { env: s.env }),
            })),
          },
        };

      case 'cursor':
        return {
          servers: config.servers.map(s => ({
            name: s.id,
            type: 'stdio',
            command: s.command,
            args: s.args,
            ...(s.env && { env: s.env }),
          })),
        };

      case 'codex':
        const codexServers: Record<string, any> = {};
        for (const server of config.servers) {
          codexServers[server.id] = {
            command: server.command,
            args: server.args,
            ...(server.env && { env: server.env }),
          };
        }
        return { mcpServers: codexServers };

      default:
        return {};
    }
  }

  /**
   * Expand ~ to home directory
   */
  private expandPath(filepath: string): string {
    if (filepath.startsWith('~/')) {
      return path.join(os.homedir(), filepath.slice(2));
    }
    return filepath;
  }

  /**
   * Handle incoming messages from webview
   */
  async handleMessage(message: any, webview: vscode.Webview): Promise<void> {
    switch (message.command) {
      case 'detectTools': {
        const tools = await this.detectTools();
        webview.postMessage({ 
          command: 'toolsDetected', 
          tools 
        });
        break;
      }

      case 'getToolStatus': {
        // TODO: Implement detailed status with MCP health
        webview.postMessage({
          command: 'toolStatus',
          toolId: message.toolId,
          status: null,
        });
        break;
      }

      case 'readMCPConfig': {
        const config = await this.readMCPConfig(message.toolId);
        webview.postMessage({
          command: 'mcpConfig',
          toolId: message.toolId,
          config,
        });
        break;
      }

      case 'writeMCPConfig': {
        const success = await this.writeMCPConfig(message.toolId, message.config);
        webview.postMessage({
          command: 'mcpConfigSaved',
          toolId: message.toolId,
          success,
        });
        break;
      }

      case 'openFile': {
        const filePath = this.expandPath(message.path);
        const uri = vscode.Uri.file(filePath);
        await vscode.commands.executeCommand('vscode.open', uri, {
          preview: false,
        });
        break;
      }

      case 'openExternal': {
        await vscode.env.openExternal(vscode.Uri.parse(message.url));
        break;
      }
    }
  }
}
