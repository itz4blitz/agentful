/**
 * Tool Integration Service Tests - Claude Code (JSON)
 * Tests Claude JSON config parsing and conversion
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ToolIntegrationService } from '../tool-integration';
import * as vscode from 'vscode';

// Mock vscode module
vi.mock('vscode', () => ({
  window: {
    createOutputChannel: vi.fn(() => ({
      appendLine: vi.fn(),
    })),
    showInformationMessage: vi.fn(),
    showErrorMessage: vi.fn(),
  },
  workspace: {
    workspaceFolders: [
      {
        uri: {
          fsPath: '/test/workspace',
        },
      },
    ],
  },
  env: {
    openExternal: vi.fn(),
  },
  commands: {
    executeCommand: vi.fn(),
  },
  Uri: {
    file: vi.fn((path: string) => ({ fsPath: path })),
    parse: vi.fn((url: string) => url),
  },
}));

// Mock fs/promises
vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
  access: vi.fn(),
  readdir: vi.fn(),
}));

// Mock child_process
vi.mock('child_process', () => ({
  exec: vi.fn(),
}));

describe('ToolIntegrationService - Claude Code (JSON)', () => {
  let service: ToolIntegrationService;
  let mockExtensionContext: any;

  beforeEach(() => {
    mockExtensionContext = {
      subscriptions: [],
    };
    service = new ToolIntegrationService(mockExtensionContext);

    // Set up environment variables for testing
    process.env.TEST_VAR = 'test-value';
    process.env.API_KEY = 'secret-key';
  });

  describe('parseToolConfig - Claude format', () => {
    it('should parse Claude stdio MCP servers from mcpServers object', async () => {
      const claudeConfig = {
        mcpServers: {
          'test-server': {
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-filesystem', '/Users/test/documents'],
            env: {
              NODE_ENV: 'production',
            },
          },
        },
      };

      const result = (service as any).parseToolConfig(claudeConfig, 'claude');

      expect(result.servers).toHaveLength(1);
      expect(result.servers[0]).toMatchObject({
        id: 'test-server',
        name: 'test-server',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/Users/test/documents'],
        env: {
          NODE_ENV: 'production',
        },
        disabled: false,
      });
    });

    it('should parse Claude MCP servers with alwaysAllow field', () => {
      const claudeConfig = {
        mcpServers: {
          'permissive-server': {
            command: 'npx',
            args: ['-y', '@test/server'],
            env: {
              API_KEY: 'secret',
            },
            alwaysAllow: ['read', 'write'],
          },
        },
      };

      const result = (service as any).parseToolConfig(claudeConfig, 'claude');

      // Note: Claude format parser stores alwaysAllow but doesn't include it in the output
      // The field is preserved in the config but not exposed in the unified MCPServer interface
      expect(result.servers[0]).toMatchObject({
        id: 'permissive-server',
        name: 'permissive-server',
        command: 'npx',
        args: ['-y', '@test/server'],
        env: {
          API_KEY: 'secret',
        },
        disabled: false,
      });
    });

    it('should handle multiple Claude MCP servers', () => {
      const claudeConfig = {
        mcpServers: {
          'filesystem': {
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-filesystem', '/Users/test/documents'],
          },
          'github': {
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-github'],
            env: {
              GITHUB_TOKEN: 'token123',
            },
          },
        },
      };

      const result = (service as any).parseToolConfig(claudeConfig, 'claude');

      expect(result.servers).toHaveLength(2);
      expect(result.servers[0].id).toBe('filesystem');
      expect(result.servers[1].id).toBe('github');
      expect(result.servers[1].env).toEqual({
        GITHUB_TOKEN: 'token123',
      });
    });

    it('should handle server without env field', () => {
      const claudeConfig = {
        mcpServers: {
          'simple-server': {
            command: 'node',
            args: ['server.js'],
          },
        },
      };

      const result = (service as any).parseToolConfig(claudeConfig, 'claude');

      expect(result.servers[0]).toMatchObject({
        id: 'simple-server',
        name: 'simple-server',
        command: 'node',
        args: ['server.js'],
        disabled: false,
      });
      expect(result.servers[0].env).toBeUndefined();
    });

    it('should handle server with empty args', () => {
      const claudeConfig = {
        mcpServers: {
          'no-args-server': {
            command: 'python',
            args: [],
          },
        },
      };

      const result = (service as any).parseToolConfig(claudeConfig, 'claude');

      expect(result.servers[0].args).toEqual([]);
    });

    it('should handle missing mcpServers object', () => {
      const claudeConfig = {};

      const result = (service as any).parseToolConfig(claudeConfig, 'claude');

      expect(result.servers).toHaveLength(0);
    });

    it('should handle empty mcpServers object', () => {
      const claudeConfig = {
        mcpServers: {},
      };

      const result = (service as any).parseToolConfig(claudeConfig, 'claude');

      expect(result.servers).toHaveLength(0);
    });

    it('should handle server with complex environment variables', () => {
      const claudeConfig = {
        mcpServers: {
          'env-server': {
            command: 'python',
            args: ['-m', 'server'],
            env: {
              PATH: '/usr/bin:/bin',
              HOME: '/Users/test',
              API_KEY: 'secret-123',
              CUSTOM_VAR: 'complex value with spaces',
            },
          },
        },
      };

      const result = (service as any).parseToolConfig(claudeConfig, 'claude');

      expect(result.servers[0].env).toMatchObject({
        PATH: '/usr/bin:/bin',
        HOME: '/Users/test',
        API_KEY: 'secret-123',
        CUSTOM_VAR: 'complex value with spaces',
      });
    });
  });

  describe('convertToToolConfig - Claude format', () => {
    it('should convert unified config to Claude mcpServers format', () => {
      const unifiedConfig = {
        servers: [
          {
            id: 'test-server',
            name: 'test-server',
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-filesystem', '/Users/test/documents'],
            env: {
              NODE_ENV: 'production',
            },
          },
        ],
      };

      const result = (service as any).convertToToolConfig(unifiedConfig, 'claude');

      expect(result.mcpServers).toBeDefined();
      expect(result.mcpServers['test-server']).toMatchObject({
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/Users/test/documents'],
        env: {
          NODE_ENV: 'production',
        },
      });
    });

    it('should convert multiple servers to Claude format', () => {
      const unifiedConfig = {
        servers: [
          {
            id: 'filesystem',
            name: 'filesystem',
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-filesystem'],
          },
          {
            id: 'github',
            name: 'github',
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-github'],
            env: {
              GITHUB_TOKEN: 'token123',
            },
          },
        ],
      };

      const result = (service as any).convertToToolConfig(unifiedConfig, 'claude');

      expect(Object.keys(result.mcpServers)).toHaveLength(2);
      expect(result.mcpServers['filesystem']).toMatchObject({
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem'],
      });
      expect(result.mcpServers['github']).toMatchObject({
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
        env: {
          GITHUB_TOKEN: 'token123',
        },
      });
    });

    it('should omit env field when not present', () => {
      const unifiedConfig = {
        servers: [
          {
            id: 'simple-server',
            name: 'simple-server',
            command: 'node',
            args: ['server.js'],
          },
        ],
      };

      const result = (service as any).convertToToolConfig(unifiedConfig, 'claude');

      expect(result.mcpServers['simple-server']).not.toHaveProperty('env');
    });

    it('should handle empty args array', () => {
      const unifiedConfig = {
        servers: [
          {
            id: 'no-args-server',
            name: 'no-args-server',
            command: 'python',
            args: [],
          },
        ],
      };

      const result = (service as any).convertToToolConfig(unifiedConfig, 'claude');

      expect(result.mcpServers['no-args-server'].args).toEqual([]);
    });

    it('should handle server with alwaysAllow field', () => {
      const unifiedConfig = {
        servers: [
          {
            id: 'permissive-server',
            name: 'permissive-server',
            command: 'npx',
            args: ['-y', '@test/server'],
            alwaysAllow: ['read', 'write'],
          },
        ],
      };

      const result = (service as any).convertToToolConfig(unifiedConfig, 'claude');

      // Note: Claude format may not support alwaysAllow in the same way
      // This test documents current behavior
      expect(result.mcpServers['permissive-server']).toBeDefined();
    });
  });

  describe('Claude Config Round-trip', () => {
    it('should preserve data through parse -> convert cycle', () => {
      const originalClaudeConfig = {
        mcpServers: {
          'server1': {
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-filesystem'],
            env: {
              PATH: '/usr/bin',
            },
          },
          'server2': {
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-github'],
            env: {
              GITHUB_TOKEN: 'token123',
            },
          },
        },
      };

      // Parse Claude config to unified format
      const unified = (service as any).parseToolConfig(originalClaudeConfig, 'claude');

      // Convert unified format back to Claude format
      const claude = (service as any).convertToToolConfig(unified, 'claude');

      // Verify the round-trip
      expect(claude.mcpServers['server1']).toMatchObject({
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem'],
        env: {
          PATH: '/usr/bin',
        },
      });

      expect(claude.mcpServers['server2']).toMatchObject({
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
        env: {
          GITHUB_TOKEN: 'token123',
        },
      });
    });

    it('should preserve empty args through round-trip', () => {
      const originalClaudeConfig = {
        mcpServers: {
          'empty-args-server': {
            command: 'node',
            args: [],
          },
        },
      };

      const unified = (service as any).parseToolConfig(originalClaudeConfig, 'claude');
      const claude = (service as any).convertToToolConfig(unified, 'claude');

      expect(claude.mcpServers['empty-args-server'].args).toEqual([]);
    });

    it('should handle missing env field through round-trip', () => {
      const originalClaudeConfig = {
        mcpServers: {
          'no-env-server': {
            command: 'python',
            args: ['-m', 'server'],
          },
        },
      };

      const unified = (service as any).parseToolConfig(originalClaudeConfig, 'claude');
      const claude = (service as any).convertToToolConfig(unified, 'claude');

      expect(claude.mcpServers['no-env-server']).not.toHaveProperty('env');
    });
  });

  describe('Claude edge cases', () => {
    it('should handle server with null env', () => {
      const claudeConfig = {
        mcpServers: {
          'null-env-server': {
            command: 'server',
            args: [],
            env: null,
          },
        },
      };

      const result = (service as any).parseToolConfig(claudeConfig, 'claude');

      expect(result.servers[0].env).toBeNull();
    });

    it('should handle server with missing args field', () => {
      const claudeConfig = {
        mcpServers: {
          'no-args-field': {
            command: 'node',
          },
        },
      };

      const result = (service as any).parseToolConfig(claudeConfig, 'claude');

      expect(result.servers[0].args).toEqual([]);
    });

    it('should handle complex server configurations', () => {
      const claudeConfig = {
        mcpServers: {
          'complex-server': {
            command: '/usr/local/bin/python3',
            args: [
              '-m',
              'server',
              '--port',
              '8080',
              '--host',
              'localhost',
            ],
            env: {
              PYTHONPATH: '/usr/lib/python3.9',
              SERVER_MODE: 'production',
              LOG_LEVEL: 'debug',
            },
          },
        },
      };

      const result = (service as any).parseToolConfig(claudeConfig, 'claude');

      expect(result.servers[0]).toMatchObject({
        id: 'complex-server',
        name: 'complex-server',
        command: '/usr/local/bin/python3',
        args: [
          '-m',
          'server',
          '--port',
          '8080',
          '--host',
          'localhost',
        ],
        env: {
          PYTHONPATH: '/usr/lib/python3.9',
          SERVER_MODE: 'production',
          LOG_LEVEL: 'debug',
        },
      });
    });
  });
});
