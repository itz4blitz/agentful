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
  installPath?: string;
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

const TOOL_DEFINITIONS: Omit<CLITool, 'version' | 'isInstalled' | 'isRunning' | 'installPath'>[] = [
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
  private outputChannel: vscode.OutputChannel;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.outputChannel = vscode.window.createOutputChannel('agentful Tools');
  }

  /**
   * Detect all installed coding CLI tools
   */
  async detectTools(): Promise<CLITool[]> {
    this.outputChannel.appendLine('=== Starting Tool Detection ===');
    const tools: CLITool[] = [];

    for (const def of TOOL_DEFINITIONS) {
      this.outputChannel.appendLine(`Checking ${def.name}...`);
      const tool = await this.checkTool(def);
      this.outputChannel.appendLine(`  Result: ${tool.isInstalled ? 'INSTALLED' : 'NOT FOUND'}${tool.version ? ` (v${tool.version})` : ''} at ${tool.installPath || 'unknown'}`);
      if (tool.isInstalled) {
        tools.push(tool);
      }
    }

    this.outputChannel.appendLine(`=== Found ${tools.length} tools ===`);
    return tools;
  }

  /**
   * Check if a specific tool is installed and get version
   */
  private async checkTool(
    def: Omit<CLITool, 'version' | 'isInstalled' | 'isRunning' | 'installPath'>
  ): Promise<CLITool> {
    try {
      // Method 1: Try to find command in PATH using 'which'
      let installPath: string | undefined;
      try {
        const { stdout } = await execAsync(`which ${def.command}`, {
          timeout: 5000,
          env: { ...process.env, PATH: this.getFullPath() }
        });
        installPath = stdout.trim();
        if (installPath) {
          this.outputChannel.appendLine(`  Found via which: ${installPath}`);
        }
      } catch {
        this.outputChannel.appendLine(`  'which ${def.command}' failed, trying common paths...`);
      }

      // Method 2: Check common installation paths
      if (!installPath) {
        installPath = await this.findInCommonPaths(def.command);
        if (installPath) {
          this.outputChannel.appendLine(`  Found in common paths: ${installPath}`);
        }
      }

      // Method 3: Check if config file exists (indicates tool was set up)
      if (!installPath) {
        const configExists = await this.configFileExists(def.configPath);
        if (configExists) {
          this.outputChannel.appendLine(`  Config file exists, assuming installed`);
          installPath = def.command; // Assume it's in PATH somewhere
        }
      }

      if (!installPath) {
        return { ...def, isInstalled: false };
      }

      // Try to get version
      let version: string | undefined;
      try {
        version = await this.getToolVersion(def.command, installPath);
      } catch (error) {
        this.outputChannel.appendLine(`  Could not get version: ${error}`);
      }

      // Check if running
      const isRunning = await this.isToolRunning(def.command);

      return {
        ...def,
        version,
        isInstalled: true,
        isRunning,
        installPath,
        lastDetected: new Date(),
      };
    } catch (error) {
      this.outputChannel.appendLine(`  Error checking tool: ${error}`);
      return { ...def, isInstalled: false };
    }
  }

  /**
   * Get full PATH including common locations
   */
  private getFullPath(): string {
    const platform = os.platform();
    const home = os.homedir();
    
    const commonPaths = [
      '/usr/local/bin',
      '/usr/bin',
      '/bin',
      '/opt/homebrew/bin', // macOS ARM Homebrew
      '/usr/local/homebrew/bin', // macOS Intel Homebrew
      `${home}/.local/bin`,
      `${home}/.npm-global/bin`,
      `${home}/.nvm/versions/node/*/bin`,
      `${home}/.volta/bin`,
      `${home}/.deno/bin`,
      `${home}/.cargo/bin`,
      '/snap/bin', // Linux snap
    ];

    if (platform === 'darwin') {
      commonPaths.push(
        '/opt/local/bin', // MacPorts
        `${home}/Library/pnpm`,
        `${home}/.pnpm-global/bin`
      );
    }

    if (platform === 'win32') {
      commonPaths.push(
        `${home}/AppData/Local/npm`,
        `${home}/AppData/Roaming/npm`,
        'C:/Program Files/nodejs',
        'C:/ProgramData/chocolatey/bin'
      );
    }

    // Add npm global prefix paths
    try {
      const npmPrefix = `${home}/.npm-global`;
      commonPaths.push(`${npmPrefix}/bin`);
    } catch {
      // Ignore
    }

    return `${commonPaths.join(':')}:${process.env.PATH || ''}`;
  }

  /**
   * Find tool in common installation paths
   */
  private async findInCommonPaths(command: string): Promise<string | undefined> {
    const platform = os.platform();
    const home = os.homedir();
    const pathsToCheck: string[] = [];

    // Common global installation locations
    const candidates = [
      `/usr/local/bin/${command}`,
      `/opt/homebrew/bin/${command}`,
      `${home}/.local/bin/${command}`,
      `${home}/.npm-global/bin/${command}`,
      `${home}/.volta/bin/${command}`,
      `${home}/.cargo/bin/${command}`,
      `${home}/.nvm/versions/node`, // Will check subdirs
    ];

    for (const candidate of candidates) {
      if (candidate.includes('*') || candidate.includes('versions/node')) {
        // Handle wildcards
        if (candidate.includes('nvm')) {
          // Check all Node versions in nvm
          try {
            const nvmDir = `${home}/.nvm/versions/node`;
            const entries = await fs.readdir(nvmDir).catch(() => []);
            for (const entry of entries) {
              pathsToCheck.push(`${nvmDir}/${entry}/bin/${command}`);
            }
          } catch {
            // Ignore
          }
        }
      } else {
        pathsToCheck.push(candidate);
      }
    }

    // Also check pnpm global
    pathsToCheck.push(`${home}/Library/pnpm/${command}`);
    pathsToCheck.push(`${home}/.pnpm-global/bin/${command}`);

    for (const p of pathsToCheck) {
      try {
        await fs.access(p, fs.constants.X_OK);
        return p;
      } catch {
        continue;
      }
    }

    return undefined;
  }

  /**
   * Check if config file exists
   */
  private async configFileExists(configPath: string): Promise<boolean> {
    try {
      const expanded = this.expandPath(configPath);
      await fs.access(expanded);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get tool version
   */
  private async getToolVersion(command: string, installPath: string): Promise<string | undefined> {
    const versionCommands = [
      `${installPath} --version`,
      `${installPath} -v`,
      `${installPath} version`,
    ];

    for (const cmd of versionCommands) {
      try {
        const { stdout } = await execAsync(cmd, { 
          timeout: 5000,
          env: { ...process.env, PATH: this.getFullPath() }
        });
        const versionMatch = stdout.match(/(\d+\.\d+\.?\d*)/);
        if (versionMatch) {
          return versionMatch[1];
        }
      } catch {
        continue;
      }
    }

    return undefined;
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
    } catch (error) {
      this.outputChannel.appendLine(`Error reading MCP config: ${error}`);
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
      
      // Show notification
      vscode.window.showInformationMessage(`MCP configuration updated for ${tool.name}`);
      
      return true;
    } catch (error) {
      this.outputChannel.appendLine(`Error writing MCP config: ${error}`);
      vscode.window.showErrorMessage(`Failed to update MCP configuration: ${error}`);
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
    this.outputChannel.appendLine(`Received message: ${message.command}`);
    
    switch (message.command) {
      case 'detectTools': {
        try {
          const tools = await this.detectTools();
          webview.postMessage({ 
            command: 'toolsDetected', 
            tools 
          });
        } catch (error) {
          this.outputChannel.appendLine(`Error detecting tools: ${error}`);
          webview.postMessage({ 
            command: 'toolsDetected', 
            tools: [],
            error: String(error)
          });
        }
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
        try {
          const config = await this.readMCPConfig(message.toolId);
          webview.postMessage({
            command: 'mcpConfig',
            toolId: message.toolId,
            config,
          });
        } catch (error) {
          this.outputChannel.appendLine(`Error reading MCP config: ${error}`);
          webview.postMessage({
            command: 'mcpConfig',
            toolId: message.toolId,
            config: null,
            error: String(error)
          });
        }
        break;
      }

      case 'writeMCPConfig': {
        try {
          const success = await this.writeMCPConfig(message.toolId, message.config);
          webview.postMessage({
            command: 'mcpConfigSaved',
            toolId: message.toolId,
            success,
          });
        } catch (error) {
          this.outputChannel.appendLine(`Error writing MCP config: ${error}`);
          webview.postMessage({
            command: 'mcpConfigSaved',
            toolId: message.toolId,
            success: false,
            error: String(error)
          });
        }
        break;
      }

      case 'openFile': {
        try {
          const filePath = this.expandPath(message.path);
          const uri = vscode.Uri.file(filePath);
          await vscode.commands.executeCommand('vscode.open', uri, {
            preview: false,
          });
        } catch (error) {
          this.outputChannel.appendLine(`Error opening file: ${error}`);
          vscode.window.showErrorMessage(`Failed to open file: ${error}`);
        }
        break;
      }

      case 'openExternal': {
        try {
          await vscode.env.openExternal(vscode.Uri.parse(message.url));
        } catch (error) {
          this.outputChannel.appendLine(`Error opening external: ${error}`);
        }
        break;
      }
    }
  }
}
