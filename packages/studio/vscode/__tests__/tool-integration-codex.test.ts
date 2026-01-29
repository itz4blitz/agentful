/**
 * Tool Integration Service Tests - Codex CLI (TOML)
 * Tests Codex TOML config parsing and conversion
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

// Mock vscode module
vi.mock('vscode', () => ({
  window: {
    createOutputChannel: vi.fn(() => ({
      appendLine: vi.fn(),
    })),
    showInformationMessage: vi.fn(),
    showErrorMessage: vi.fn(),
  },
  Uri: {
    file: (p: string) => ({ fsPath: p }),
  },
  commands: {
    executeCommand: vi.fn(),
  },
  env: {
    openExternal: vi.fn(),
  },
}));

// Mock child_process
vi.mock('child_process', () => ({
  exec: vi.fn((cmd, options, callback) => {
    if (cmd.includes('which codex')) {
      (callback as any)(null, { stdout: '/usr/local/bin/codex' });
    } else if (cmd.includes('--version')) {
      (callback as any)(null, { stdout: 'codex version 1.0.0' });
    } else {
      (callback as any)(new Error('Command not found'), { stdout: '' });
    }
  }),
}));

// Import after mocking
import { ToolIntegrationService } from '../tool-integration';
import * as vscode from 'vscode';

describe('ToolIntegrationService - Codex CLI (TOML)', () => {
  let service: ToolIntegrationService;
  let mockContext: any;
  let testConfigDir: string;
  let testConfigPath: string;

  beforeEach(async () => {
    // Create mock extension context
    mockContext = {
      globalState: {
        get: vi.fn(),
        update: vi.fn(),
      },
      workspaceState: {
        get: vi.fn(),
        update: vi.fn(),
      },
    };

    // Create temporary config directory
    testConfigDir = path.join(os.tmpdir(), `codex-test-${Date.now()}`);
    await fs.mkdir(testConfigDir, { recursive: true });
    testConfigPath = path.join(testConfigDir, 'config.toml');

    // Create service instance
    service = new ToolIntegrationService(mockContext);
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testConfigDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('parseCodexConfig (TOML)', () => {
    it('should parse Codex TOML config with stdio servers', () => {
      const codexToml = `
[mcpServers.filesystem]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem", "/Users/test/documents"]
env = { NODE_ENV = "production" }

[mcpServers.github]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-github"]
`;

      // Mock TOML.parse
      vi.doMock('@iarna/toml', () => ({
        parse: () => ({
          mcpServers: {
            filesystem: {
              command: 'npx',
              args: ['-y', '@modelcontextprotocol/server-filesystem', '/Users/test/documents'],
              env: { NODE_ENV: 'production' },
            },
            github: {
              command: 'npx',
              args: ['-y', '@modelcontextprotocol/server-github'],
            },
          },
        }),
      }));

      const TOML = require('@iarna/toml');
      const parsed = TOML.parse(codexToml);
      const result = (service as any).parseToolConfig(parsed, 'codex');

      expect(result.servers).toHaveLength(2);
      expect(result.servers[0]).toMatchObject({
        id: 'filesystem',
        name: 'filesystem',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/Users/test/documents'],
        env: { NODE_ENV: 'production' },
        disabled: false,
      });
      expect(result.servers[1]).toMatchObject({
        id: 'github',
        name: 'github',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
        disabled: false,
      });
    });

    it('should parse Codex TOML with URL-based (HTTP) servers', () => {
      const codexToml = `
[mcpServers.http-server]
url = "https://example.com/mcp"
bearer_token_env_var = "MCP_TOKEN"
`;

      vi.doMock('@iarna/toml', () => ({
        parse: () => ({
          mcpServers: {
            'http-server': {
              url: 'https://example.com/mcp',
              bearer_token_env_var: 'MCP_TOKEN',
            },
          },
        }),
      }));

      const TOML = require('@iarna/toml');
      const parsed = TOML.parse(codexToml);
      const result = (service as any).parseToolConfig(parsed, 'codex');

      expect(result.servers).toHaveLength(1);
      expect(result.servers[0]).toMatchObject({
        id: 'http-server',
        name: 'http-server',
        transport: 'http',
        url: 'https://example.com/mcp',
        bearer_token_env_var: 'MCP_TOKEN',
      });
    });

    it('should skip disabled servers', () => {
      const codexToml = `
[mcpServers.enabled-server]
command = "npx"
args = ["-y", "@test/server"]

[mcpServers.disabled-server]
command = "npx"
args = ["-y", "@test/server2"]
enabled = false
`;

      vi.doMock('@iarna/toml', () => ({
        parse: () => ({
          mcpServers: {
            'enabled-server': {
              command: 'npx',
              args: ['-y', '@test/server'],
            },
            'disabled-server': {
              command: 'npx',
              args: ['-y', '@test/server2'],
              enabled: false,
            },
          },
        }),
      }));

      const TOML = require('@iarna/toml');
      const parsed = TOML.parse(codexToml);
      const result = (service as any).parseToolConfig(parsed, 'codex');

      expect(result.servers).toHaveLength(1);
      expect(result.servers[0].id).toBe('enabled-server');
    });

    it('should handle mixed stdio and HTTP servers', () => {
      const codexToml = `
[mcpServers.stdio-server]
command = "npx"
args = ["-y", "@test/server"]

[mcpServers.http-server]
url = "https://example.com/mcp"
`;

      vi.doMock('@iarna/toml', () => ({
        parse: () => ({
          mcpServers: {
            'stdio-server': {
              command: 'npx',
              args: ['-y', '@test/server'],
            },
            'http-server': {
              url: 'https://example.com/mcp',
            },
          },
        }),
      }));

      const TOML = require('@iarna/toml');
      const parsed = TOML.parse(codexToml);
      const result = (service as any).parseToolConfig(parsed, 'codex');

      expect(result.servers).toHaveLength(2);
      expect(result.servers[0].transport).toBe('stdio');
      expect(result.servers[1].transport).toBe('http');
    });

    it('should handle empty mcpServers section', () => {
      const codexToml = `
[mcpServers]
`;

      vi.doMock('@iarna/toml', () => ({
        parse: () => ({
          mcpServers: {},
        }),
      }));

      const TOML = require('@iarna/toml');
      const parsed = TOML.parse(codexToml);
      const result = (service as any).parseToolConfig(parsed, 'codex');

      expect(result.servers).toHaveLength(0);
    });

    it('should handle missing mcpServers', () => {
      const codexToml = `
[other_section]
setting = "value"
`;

      vi.doMock('@iarna/toml', () => ({
        parse: () => ({
          other_section: {
            setting: 'value',
          },
        }),
      }));

      const TOML = require('@iarna/toml');
      const parsed = TOML.parse(codexToml);
      const result = (service as any).parseToolConfig(parsed, 'codex');

      expect(result.servers).toHaveLength(0);
    });

    it('should handle server with environment variables', () => {
      const codexToml = `
[mcpServers.env-server]
command = "python"
args = ["-m", "server"]
env = { API_KEY = "secret", CUSTOM_VAR = "complex value" }
`;

      vi.doMock('@iarna/toml', () => ({
        parse: () => ({
          mcpServers: {
            'env-server': {
              command: 'python',
              args: ['-m', 'server'],
              env: {
                API_KEY: 'secret',
                CUSTOM_VAR: 'complex value',
              },
            },
          },
        }),
      }));

      const TOML = require('@iarna/toml');
      const parsed = TOML.parse(codexToml);
      const result = (service as any).parseToolConfig(parsed, 'codex');

      expect(result.servers[0].env).toMatchObject({
        API_KEY: 'secret',
        CUSTOM_VAR: 'complex value',
      });
    });
  });

  describe('convertToCodexConfig (TOML)', () => {
    it('should convert unified config to Codex TOML format (stdio)', () => {
      const unifiedConfig = {
        servers: [
          {
            id: 'filesystem',
            name: 'filesystem',
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-filesystem', '/Users/test/documents'],
            env: { NODE_ENV: 'production' },
          },
        ],
      };

      const result = (service as any).convertToToolConfig(unifiedConfig, 'codex');

      expect(result).toMatchObject({
        mcpServers: {
          filesystem: {
            enabled: true,
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-filesystem', '/Users/test/documents'],
            env: { NODE_ENV: 'production' },
          },
        },
      });
    });

    it('should convert unified config to Codex TOML format (HTTP)', () => {
      const unifiedConfig = {
        servers: [
          {
            id: 'http-server',
            name: 'http-server',
            transport: 'http',
            url: 'https://example.com/mcp',
            bearer_token_env_var: 'MCP_TOKEN',
          },
        ],
      };

      const result = (service as any).convertToToolConfig(unifiedConfig, 'codex');

      expect(result).toMatchObject({
        mcpServers: {
          'http-server': {
            enabled: true,
            url: 'https://example.com/mcp',
            bearer_token_env_var: 'MCP_TOKEN',
          },
        },
      });
    });

    it('should handle disabled servers', () => {
      const unifiedConfig = {
        servers: [
          {
            id: 'disabled-server',
            name: 'disabled-server',
            command: 'npx',
            args: ['-y', '@test/server'],
            disabled: true,
          },
        ],
      };

      const result = (service as any).convertToToolConfig(unifiedConfig, 'codex');

      expect(result.mcpServers['disabled-server']).toMatchObject({
        enabled: false,
        command: 'npx',
        args: ['-y', '@test/server'],
      });
    });

    it('should handle server without env', () => {
      const unifiedConfig = {
        servers: [
          {
            id: 'simple-server',
            name: 'simple-server',
            command: '/usr/local/bin/simple-server',
            args: [],
          },
        ],
      };

      const result = (service as any).convertToToolConfig(unifiedConfig, 'codex');

      expect(result.mcpServers['simple-server']).not.toHaveProperty('env');
    });

    it('should handle empty servers list', () => {
      const unifiedConfig = {
        servers: [],
      };

      const result = (service as any).convertToToolConfig(unifiedConfig, 'codex');

      expect(result).toMatchObject({
        mcpServers: {},
      });
    });
  });

  describe('readMCPConfig - Codex (TOML)', () => {
    it('should read and parse Codex TOML config file', async () => {
      const codexToml = `
[mcpServers.test-server]
command = "npx"
args = ["-y", "@test/server"]
`;

      // Need to write actual TOML file
      await fs.writeFile(testConfigPath, codexToml, 'utf-8');

      vi.spyOn(service as any, 'expandPath').mockReturnValue(testConfigPath);

      const result = await service.readMCPConfig('codex');

      expect(result).not.toBeNull();
      expect(result!.servers).toHaveLength(1);
      expect(result!.servers[0]).toMatchObject({
        id: 'test-server',
        command: 'npx',
        args: ['-y', '@test/server'],
      });
    });

    it('should parse HTTP server from TOML', async () => {
      const codexToml = `
[mcpServers.http-server]
url = "https://example.com/mcp"
bearer_token_env_var = "API_TOKEN"
`;

      await fs.writeFile(testConfigPath, codexToml, 'utf-8');

      vi.spyOn(service as any, 'expandPath').mockReturnValue(testConfigPath);

      const result = await service.readMCPConfig('codex');

      expect(result).not.toBeNull();
      expect(result!.servers).toHaveLength(1);
      expect(result!.servers[0]).toMatchObject({
        id: 'http-server',
        url: 'https://example.com/mcp',
        bearer_token_env_var: 'API_TOKEN',
        transport: 'http',
      });
    });

    it('should return null for malformed TOML', async () => {
      await fs.writeFile(testConfigPath, '[[invalid toml syntax', 'utf-8');

      vi.spyOn(service as any, 'expandPath').mockReturnValue(testConfigPath);

      const result = await service.readMCPConfig('codex');

      expect(result).toBeNull();
    });

    it('should return null for non-existent file', async () => {
      const nonExistentPath = path.join(testConfigDir, 'non-existent.toml');

      vi.spyOn(service as any, 'expandPath').mockReturnValue(nonExistentPath);

      const result = await service.readMCPConfig('codex');

      expect(result).toBeNull();
    });
  });

  describe('writeMCPConfig - Codex (TOML)', () => {
    it('should write Codex TOML config file (stdio)', async () => {
      const config = {
        servers: [
          {
            id: 'test-server',
            name: 'test-server',
            command: 'npx',
            args: ['-y', '@test/server'],
            env: { TEST: 'value' },
          },
        ],
      };

      vi.spyOn(service as any, 'expandPath').mockReturnValue(testConfigPath);

      const result = await service.writeMCPConfig('codex', config);

      expect(result).toBe(true);

      // Verify file was written and contains valid TOML
      const content = await fs.readFile(testConfigPath, 'utf-8');
      expect(content).toContain('[mcpServers.test-server]');
      expect(content).toContain('command = "npx"');
      expect(content).toContain('TEST = "value"');
    });

    it('should write Codex TOML config file (HTTP)', async () => {
      const config = {
        servers: [
          {
            id: 'http-server',
            name: 'http-server',
            transport: 'http',
            url: 'https://example.com/mcp',
            bearer_token_env_var: 'TOKEN',
          },
        ],
      };

      vi.spyOn(service as any, 'expandPath').mockReturnValue(testConfigPath);

      const result = await service.writeMCPConfig('codex', config);

      expect(result).toBe(true);

      // Verify file was written
      const content = await fs.readFile(testConfigPath, 'utf-8');
      expect(content).toContain('[mcpServers.http-server]');
      expect(content).toContain('url = "https://example.com/mcp"');
      expect(content).toContain('bearer_token_env_var = "TOKEN"');
    });

    it('should preserve existing TOML settings', async () => {
      // Write existing config with extra settings
      const existingToml = `
existing_setting = "value"
another_setting = 123

[mcpServers.old-server]
command = "old-command"
args = []
`;

      await fs.writeFile(testConfigPath, existingToml, 'utf-8');

      const newConfig = {
        servers: [
          {
            id: 'new-server',
            name: 'new-server',
            command: 'npx',
            args: ['-y', '@new/server'],
          },
        ],
      };

      vi.spyOn(service as any, 'expandPath').mockReturnValue(testConfigPath);

      await service.writeMCPConfig('codex', newConfig);

      // Verify existing settings were preserved
      const content = await fs.readFile(testConfigPath, 'utf-8');
      expect(content).toContain('existing_setting = "value"');
      expect(content).toContain('another_setting = 123');
      expect(content).toContain('[mcpServers.new-server]');
    });

    it('should create directory if it does not exist', async () => {
      const newDir = path.join(testConfigDir, 'new-dir');
      const newPath = path.join(newDir, 'config.toml');

      const config = {
        servers: [],
      };

      vi.spyOn(service as any, 'expandPath').mockReturnValue(newPath);

      const result = await service.writeMCPConfig('codex', config);

      expect(result).toBe(true);

      // Verify directory was created
      const stat = await fs.stat(newDir);
      expect(stat.isDirectory()).toBe(true);
    });
  });

  describe('Codex edge cases', () => {
    it('should handle server with only URL (no command)', () => {
      const codexToml = `
[mcpServers.url-only-server]
url = "wss://example.com/mcp"
`;

      vi.doMock('@iarna/toml', () => ({
        parse: () => ({
          mcpServers: {
            'url-only-server': {
              url: 'wss://example.com/mcp',
            },
          },
        }),
      }));

      const TOML = require('@iarna/toml');
      const parsed = TOML.parse(codexToml);
      const result = (service as any).parseToolConfig(parsed, 'codex');

      expect(result.servers[0]).toMatchObject({
        id: 'url-only-server',
        url: 'wss://example.com/mcp',
        transport: 'http',
      });
    });

    it('should handle complex environment variables in TOML', () => {
      const codexToml = `
[mcpServers.complex-env]
command = "python"
args = ["-m", "server"]
env = { PATH = "/usr/bin:/bin", HOME = "/Users/test", API_KEY = "secret-123" }
`;

      vi.doMock('@iarna/toml', () => ({
        parse: () => ({
          mcpServers: {
            'complex-env': {
              command: 'python',
              args: ['-m', 'server'],
              env: {
                PATH: '/usr/bin:/bin',
                HOME: '/Users/test',
                API_KEY: 'secret-123',
              },
            },
          },
        }),
      }));

      const TOML = require('@iarna/toml');
      const parsed = TOML.parse(codexToml);
      const result = (service as any).parseToolConfig(parsed, 'codex');

      expect(result.servers[0].env).toMatchObject({
        PATH: '/usr/bin:/bin',
        HOME: '/Users/test',
        API_KEY: 'secret-123',
      });
    });

    it('should handle mixed enabled and disabled servers', () => {
      const codexToml = `
[mcpServers.server1]
command = "npx"
args = ["-y", "@test/server1"]
enabled = true

[mcpServers.server2]
command = "npx"
args = ["-y", "@test/server2"]
enabled = false

[mcpServers.server3]
command = "npx"
args = ["-y", "@test/server3"]
`;

      vi.doMock('@iarna/toml', () => ({
        parse: () => ({
          mcpServers: {
            server1: {
              command: 'npx',
              args: ['-y', '@test/server1'],
              enabled: true,
            },
            server2: {
              command: 'npx',
              args: ['-y', '@test/server2'],
              enabled: false,
            },
            server3: {
              command: 'npx',
              args: ['-y', '@test/server3'],
            },
          },
        }),
      }));

      const TOML = require('@iarna/toml');
      const parsed = TOML.parse(codexToml);
      const result = (service as any).parseToolConfig(parsed, 'codex');

      expect(result.servers).toHaveLength(2);
      expect(result.servers.map(s => s.id)).toEqual(['server1', 'server3']);
    });
  });
});
