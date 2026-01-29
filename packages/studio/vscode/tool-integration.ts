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
import * as TOML from '@iarna/toml';

const execAsync = promisify(exec);

export type ToolFormat = 'claude' | 'gemini' | 'codex' | 'kiro' | 'cursor' | 'cline' | 'roo';

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

interface MCPServer {
  id: string;
  name: string;
  transport?: 'stdio' | 'http' | 'sse';
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
  bearer_token_env_var?: string;
  disabled?: boolean;
  alwaysAllow?: string[];
  timeout?: number;
}

interface MCPConfig {
  servers: MCPServer[];
}

interface ClaudeConfig {
  mcpServers?: Record<string, {
    command: string;
    args: string[];
    env?: Record<string, string>;
    alwaysAllow?: string[];
  }>;
}

const TOOL_DEFINITIONS: Omit<CLITool, 'version' | 'isInstalled' | 'isRunning' | 'installPath'>[] = [
  {
    id: 'claude',
    name: 'Claude Code',
    command: 'claude',
    configPath: '~/.claude.json',
    mcpFormat: 'claude',
  },
  {
    id: 'gemini',
    name: 'Gemini CLI',
    command: 'gemini',
    configPath: '~/.gemini/settings.json',
    mcpFormat: 'gemini',
  },
  {
    id: 'codex',
    name: 'Codex CLI',
    command: 'codex',
    configPath: '~/.codex/config.toml',
    mcpFormat: 'codex',
  },
  {
    id: 'kiro',
    name: 'Kiro CLI',
    command: 'kiro',
    configPath: '~/.kiro/settings/mcp.json',
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
    id: 'cline',
    name: 'Cline',
    command: 'code',
    configPath: 'cline_mcp_settings.json',
    mcpFormat: 'cline',
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
   * Get Cline config path (OS-specific globalStorage location)
   */
  private getClineConfigPath(): string {
    const platform = os.platform();

    switch (platform) {
      case 'darwin':
        // macOS: ~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/
        return path.join(
          os.homedir(),
          'Library',
          'Application Support',
          'Code',
          'User',
          'globalStorage',
          'saoudrizwan.claude-dev',
          'cline_mcp_settings.json'
        );

      case 'win32':
        // Windows: %APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\
        return path.join(
          process.env.APPDATA || '',
          'Code',
          'User',
          'globalStorage',
          'saoudrizwan.claude-dev',
          'cline_mcp_settings.json'
        );

      case 'linux':
        // Linux: ~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/
        return path.join(
          os.homedir(),
          '.config',
          'Code',
          'User',
          'globalStorage',
          'saoudrizwan.claude-dev',
          'cline_mcp_settings.json'
        );

      default:
        // Fallback to Linux path
        return path.join(
          os.homedir(),
          '.config',
          'Code',
          'User',
          'globalStorage',
          'saoudrizwan.claude-dev',
          'cline_mcp_settings.json'
        );
    }
  }

  /**
   * Detect all installed coding CLI tools
   */
  async detectTools(): Promise<CLITool[]> {
    this.outputChannel.appendLine('=== Starting Tool Detection ===');
    const tools: CLITool[] = [];

    for (const def of TOOL_DEFINITIONS) {
      this.outputChannel.appendLine(`Checking ${def.name}...`);

      // Special handling for Cline: check for VS Code extension
      if (def.id === 'cline') {
        const clineExtension = vscode.extensions.getExtension('saoudrizwan.claude-dev');
        if (clineExtension) {
          this.outputChannel.appendLine(`  Cline extension found: ${clineExtension.id}`);

          // Check if config file exists
          const configPath = this.getClineConfigPath();
          const configExists = await this.configFileExists(configPath);

          tools.push({
            ...def,
            version: clineExtension.packageJSON.version,
            isInstalled: true,
            installPath: clineExtension.extensionPath,
            lastDetected: new Date(),
          });

          this.outputChannel.appendLine(`  Result: INSTALLED (extension v${clineExtension.packageJSON.version})`);
        } else {
          this.outputChannel.appendLine(`  Result: NOT FOUND (extension not installed)`);
        }
        continue;
      }

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

    // Special handling for Cline config path
    const configPath = toolId === 'cline'
      ? this.getClineConfigPath()
      : this.expandPath(tool.configPath);

    try {
      let content: string;
      let parsed: any;

      // Handle TOML files for tools like Codex
      if (configPath.endsWith('.toml')) {
        content = await fs.readFile(configPath, 'utf-8');
        parsed = TOML.parse(content);
      } else {
        content = await fs.readFile(configPath, 'utf-8');
        parsed = JSON.parse(content);
      }

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

    // Special handling for Cline config path
    const configPath = toolId === 'cline'
      ? this.getClineConfigPath()
      : this.expandPath(tool.configPath);

    try {
      // Ensure directory exists
      await fs.mkdir(path.dirname(configPath), { recursive: true });

      // Convert to tool-specific format
      const toolConfig = this.convertToToolConfig(config, tool.mcpFormat);
      
      // Read existing config to preserve other settings
      let existingConfig: any = {};
      try {
        const existing = await fs.readFile(configPath, 'utf-8');
        if (configPath.endsWith('.toml')) {
          existingConfig = TOML.parse(existing);
        } else {
          existingConfig = JSON.parse(existing);
        }
      } catch {
        // File doesn't exist or is invalid
      }

      // Merge MCP config with existing
      const mergedConfig = { ...existingConfig, ...toolConfig };

      // Write in appropriate format
      let content: string;
      if (configPath.endsWith('.toml')) {
        content = TOML.stringify(mergedConfig);
      } else {
        content = JSON.stringify(mergedConfig, null, 2);
      }

      await fs.writeFile(configPath, content);
      
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
        // Gemini uses mcpServers object with transport precedence
        // Format: { "mcpServers": { "server-id": { transport, command, args, url, httpUrl, ... } } }
        if (config.mcpServers) {
          for (const [id, server] of Object.entries<any>(config.mcpServers)) {
            // Transport precedence: httpUrl > url > command
            let transport: 'stdio' | 'http' | 'sse' = 'stdio';
            let command: string | undefined;
            let args: string[] = [];
            let url: string | undefined;

            if (server.httpUrl) {
              transport = 'http';
              url = server.httpUrl;
            } else if (server.url) {
              transport = 'sse';
              url = server.url;
            } else if (server.command) {
              transport = 'stdio';
              command = server.command;
              args = server.args || [];
            }

            servers.push({
              id,
              name: id,
              transport,
              command,
              args,
              url,
              env: server.env,
              timeout: server.timeout,
              disabled: false,
            });
          }
        }
        break;

      case 'cursor':
        // Cursor uses mcpServers object format with type field
        // Supports stdio (command/args) and sse/http (url)
        // Format: { "mcpServers": { "server-id": { type, command, args, url, env, headers, envFile } } }
        if (config.mcpServers) {
          for (const [id, serverConfig] of Object.entries<any>(config.mcpServers)) {
            // Handle different transport types
            const transport = serverConfig.type || 'stdio';

            if (transport === 'stdio') {
              // stdio transport: command + args
              servers.push({
                id,
                name: id,
                transport: 'stdio',
                command: this.interpolateEnvVars(serverConfig.command),
                args: (serverConfig.args || []).map((arg: string) => this.interpolateEnvVars(arg)),
                env: serverConfig.env,
                disabled: false,
              });
            } else if (transport === 'sse' || transport === 'http') {
              // SSE/HTTP transport: URL-based
              servers.push({
                id,
                name: id,
                transport: transport,
                command: this.interpolateEnvVars(serverConfig.url || serverConfig.httpUrl),
                args: [],
                url: this.interpolateEnvVars(serverConfig.url || serverConfig.httpUrl),
                env: serverConfig.headers ? { HEADERS: JSON.stringify(serverConfig.headers) } : undefined,
                disabled: false,
              });
            }
          }
        }
        break;

      case 'codex':
        // Codex CLI supports both stdio (command/args) and HTTP (url) servers
        // Format: { "mcpServers": { "server-id": { command, args, url, bearer_token_env_var, enabled, env } } }
        if (config.mcpServers) {
          for (const [id, server] of Object.entries<any>(config.mcpServers)) {
            // Skip disabled servers
            if (server.enabled === false) {
              continue;
            }

            // Determine transport type
            let transport: 'stdio' | 'http' = 'stdio';
            let command: string | undefined;
            let args: string[] = [];
            let url: string | undefined;
            let bearerTokenEnvVar: string | undefined;

            if (server.url) {
              // HTTP server configuration
              transport = 'http';
              url = server.url;
              bearerTokenEnvVar = server.bearer_token_env_var;
            } else if (server.command) {
              // stdio server configuration
              transport = 'stdio';
              command = server.command;
              args = server.args || [];
            }

            servers.push({
              id,
              name: id,
              transport,
              command,
              args,
              url,
              env: server.env,
              bearer_token_env_var: bearerTokenEnvVar,
              disabled: false,
            });
          }
        }
        break;

      case 'cline':
        // Cline format: { "mcpServers": { "server-id": { command, args, env, alwaysAllow, disabled } } }
        if (config.mcpServers) {
          for (const [id, server] of Object.entries<any>(config.mcpServers)) {
            servers.push({
              id,
              name: id,
              command: server.command,
              args: server.args || [],
              env: server.env,
              disabled: server.disabled || false,
              alwaysAllow: server.alwaysAllow,
            });
          }
        }
        break;

      // Add more formats as needed

      case 'kiro':
        // Kiro uses JSON format in ~/.kiro/settings/mcp.json
        // Format: { "mcpServers": { "server-id": { ... } } }
        if (config.mcpServers) {
          for (const [id, server] of Object.entries<any>(config.mcpServers)) {
            servers.push({
              id,
              name: id,
              command: server.command,
              args: server.args || [],
              env: server.env,
              disabled: false,
              alwaysAllow: server.alwaysAllow,
            });
          }
        }
        break;
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
        const geminiServers: Record<string, any> = {};
        for (const server of config.servers) {
          // Convert unified format to Gemini format
          // Transport precedence: httpUrl > url > command
          const serverConfig: any = {};

          if (server.transport === 'http' && server.url) {
            serverConfig.httpUrl = server.url;
          } else if (server.transport === 'sse' && server.url) {
            serverConfig.url = server.url;
          } else if (server.command) {
            serverConfig.transport = 'stdio';
            serverConfig.command = server.command;
            if (server.args && server.args.length > 0) {
              serverConfig.args = server.args;
            }
          }

          // Add optional fields
          if (server.env && Object.keys(server.env).length > 0) {
            serverConfig.env = server.env;
          }

          if (server.timeout) {
            serverConfig.timeout = server.timeout;
          }

          geminiServers[server.id] = serverConfig;
        }
        return { mcpServers: geminiServers };

      case 'cursor':
        // Convert unified format to Cursor mcpServers object format
        const cursorServers: Record<string, any> = {};
        for (const server of config.servers) {
          const serverConfig: any = {
            type: server.transport || 'stdio',
          };

          if (server.transport === 'http' && server.url) {
            serverConfig.url = server.url;
          } else if (server.transport === 'sse' && server.url) {
            serverConfig.url = server.url;
          } else if (server.command) {
            serverConfig.command = server.command;
            if (server.args && server.args.length > 0) {
              serverConfig.args = server.args;
            }
          }

          // Add optional fields
          if (server.env && Object.keys(server.env).length > 0) {
            serverConfig.env = server.env;
          }

          // Handle headers from env (stored as JSON string)
          if (server.env?.HEADERS) {
            try {
              serverConfig.headers = JSON.parse(server.env.HEADERS);
              delete serverConfig.env.HEADERS;
            } catch {
              // Invalid JSON, skip
            }
          }

          cursorServers[server.id] = serverConfig;
        }
        return { mcpServers: cursorServers };

      case 'codex':
        // Codex CLI supports both stdio and HTTP transports
        // Format: { "mcpServers": { "server-id": { enabled, command, args, url, bearer_token_env_var, env } } }
        const codexServers: Record<string, any> = {};
        for (const server of config.servers) {
          const serverConfig: any = {
            enabled: !server.disabled,
          };

          if (server.transport === 'http' && server.url) {
            // HTTP server configuration
            serverConfig.url = server.url;
            if (server.bearer_token_env_var) {
              serverConfig.bearer_token_env_var = server.bearer_token_env_var;
            }
          } else if (server.command) {
            // stdio server configuration
            serverConfig.command = server.command;
            if (server.args && server.args.length > 0) {
              serverConfig.args = server.args;
            }
          }

          // Add optional environment variables
          if (server.env && Object.keys(server.env).length > 0) {
            serverConfig.env = server.env;
          }

          codexServers[server.id] = serverConfig;
        }
        return { mcpServers: codexServers };

      case 'cline':
        // Cline format: { "mcpServers": { "server-id": { command, args, env, alwaysAllow, disabled } } }
        const clineServers: Record<string, any> = {};
        for (const server of config.servers) {
          clineServers[server.id] = {
            command: server.command,
            args: server.args,
            ...(server.env && { env: server.env }),
            ...(server.alwaysAllow && { alwaysAllow: server.alwaysAllow }),
            ...(server.disabled && { disabled: server.disabled }),
          };
        }
        return { mcpServers: clineServers };

      case 'kiro':
        // Kiro uses JSON format: { "mcpServers": { "server-id": { ... } } }
        const kiroServers: Record<string, any> = {};
        for (const server of config.servers) {
          kiroServers[server.id] = {
            command: server.command,
            args: server.args,
            ...(server.env && { env: server.env }),
            ...(server.alwaysAllow && { alwaysAllow: server.alwaysAllow }),
          };
        }
        return { mcpServers: kiroServers };
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
   * Interpolate environment variables in strings
   * Supports ${env:VAR_NAME} and ${workspaceFolder} syntax
   */
  private interpolateEnvVars(value: string): string {
    if (!value || typeof value !== 'string') {
      return value;
    }

    // Get workspace folder if available
    let workspaceFolder = '';
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
      workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
    }

    // Replace ${env:VAR_NAME} with actual environment variable
    return value.replace(/\$\{env:([^}]+)\}/g, (match, envVar) => {
      return process.env[envVar] || match;
    }).replace(/\$\{workspaceFolder\}/g, () => {
      return workspaceFolder || '${workspaceFolder}';
    });
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

      case 'validateConfigPath': {
        try {
          const toolId = message.toolId;
          const configPath = message.configPath;

          // Get the expanded path
          let expandedPath: string;
          if (toolId === 'cline') {
            expandedPath = this.getClineConfigPath();
          } else {
            expandedPath = this.expandPath(configPath);
          }

          // Check if file exists
          const exists = await this.configFileExists(configPath);

          webview.postMessage({
            command: 'configPathValidated',
            toolId,
            configPath,
            expandedPath,
            exists,
          });
        } catch (error) {
          this.outputChannel.appendLine(`Error validating config path: ${error}`);
          webview.postMessage({
            command: 'configPathValidated',
            toolId: message.toolId,
            configPath: message.configPath,
            expandedPath: message.configPath,
            exists: false,
            error: String(error)
          });
        }
        break;
      }

      case 'createConfigFile': {
        try {
          const toolId = message.toolId;
          const configPath = message.configPath;

          // Get the expanded path
          let expandedPath: string;
          if (toolId === 'cline') {
            expandedPath = this.getClineConfigPath();
          } else {
            expandedPath = this.expandPath(configPath);
          }

          // Create directory if it doesn't exist
          const dir = path.dirname(expandedPath);
          await fs.mkdir(dir, { recursive: true });

          // Create empty config file based on format
          let content = '{}';
          if (toolId === 'codex') {
            // TOML format for Codex
            content = '';
          } else if (toolId === 'cline') {
            // Cline format
            content = JSON.stringify({ mcpServers: {} }, null, 2);
          } else {
            // JSON format for most tools
            content = JSON.stringify({ mcpServers: {} }, null, 2);
          }

          await fs.writeFile(expandedPath, content, 'utf-8');

          webview.postMessage({
            command: 'configFileCreated',
            toolId,
            configPath,
            expandedPath,
            success: true,
          });
        } catch (error) {
          this.outputChannel.appendLine(`Error creating config file: ${error}`);
          webview.postMessage({
            command: 'configFileCreated',
            toolId: message.toolId,
            configPath: message.configPath,
            success: false,
            error: String(error)
          });
        }
        break;
      }
    }
  }
}
