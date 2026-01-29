/**
 * Tool Integration Service Tests - Kiro CLI (JSON)
 * Tests Kiro JSON config parsing and conversion
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

describe('ToolIntegrationService - Kiro CLI (JSON)', () => {
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

  describe('parseToolConfig - Kiro format', () => {
    it('should parse Kiro MCP servers from mcpServers object', () => {
      const kiroConfig = {
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

      const result = (service as any).parseToolConfig(kiroConfig, 'kiro');

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

    it('should parse Kiro MCP servers with alwaysAllow field', () => {
      const kiroConfig = {
        mcpServers: {
          'permissive-server': {
            command: 'npx',
            args: ['-y', '@test/server'],
            env: {
              API_KEY: 'secret',
            },
            alwaysAllow: ['read', 'write', 'execute'],
          },
        },
      };

      const result = (service as any).parseToolConfig(kiroConfig, 'kiro');

      expect(result.servers[0]).toMatchObject({
        id: 'permissive-server',
        name: 'permissive-server',
        command: 'npx',
        args: ['-y', '@test/server'],
        env: {
          API_KEY: 'secret',
        },
        alwaysAllow: ['read', 'write', 'execute'],
        disabled: false,
      });
    });

    it('should handle multiple Kiro MCP servers', () => {
      const kiroConfig = {
        mcpServers: {
          'filesystem': {
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-filesystem'],
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

      const result = (service as any).parseToolConfig(kiroConfig, 'kiro');

      expect(result.servers).toHaveLength(2);
      expect(result.servers[0].id).toBe('filesystem');
      expect(result.servers[1].id).toBe('github');
      expect(result.servers[1].env).toEqual({
        GITHUB_TOKEN: 'token123',
      });
    });

    it('should handle server without env field', () => {
      const kiroConfig = {
        mcpServers: {
          'simple-server': {
            command: 'node',
            args: ['server.js'],
          },
        },
      };

      const result = (service as any).parseToolConfig(kiroConfig, 'kiro');

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
      const kiroConfig = {
        mcpServers: {
          'no-args-server': {
            command: 'python',
            args: [],
          },
        },
      };

      const result = (service as any).parseToolConfig(kiroConfig, 'kiro');

      expect(result.servers[0].args).toEqual([]);
    });

    it('should handle missing mcpServers object', () => {
      const kiroConfig = {};

      const result = (service as any).parseToolConfig(kiroConfig, 'kiro');

      expect(result.servers).toHaveLength(0);
    });

    it('should handle empty mcpServers object', () => {
      const kiroConfig = {
        mcpServers: {},
      };

      const result = (service as any).parseToolConfig(kiroConfig, 'kiro');

      expect(result.servers).toHaveLength(0);
    });

    it('should handle server with complex environment variables', () => {
      const kiroConfig = {
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

      const result = (service as any).parseToolConfig(kiroConfig, 'kiro');

      expect(result.servers[0].env).toMatchObject({
        PATH: '/usr/bin:/bin',
        HOME: '/Users/test',
        API_KEY: 'secret-123',
        CUSTOM_VAR: 'complex value with spaces',
      });
    });

    it('should handle server with alwaysAllow containing multiple permissions', () => {
      const kiroConfig = {
        mcpServers: {
          'full-permissions': {
            command: 'server',
            args: [],
            alwaysAllow: ['read', 'write', 'execute', 'delete', 'admin'],
          },
        },
      };

      const result = (service as any).parseToolConfig(kiroConfig, 'kiro');

      expect(result.servers[0].alwaysAllow).toEqual([
        'read',
        'write',
        'execute',
        'delete',
        'admin',
      ]);
    });
  });

  describe('convertToToolConfig - Kiro format', () => {
    it('should convert unified config to Kiro mcpServers format', () => {
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

      const result = (service as any).convertToToolConfig(unifiedConfig, 'kiro');

      expect(result.mcpServers).toBeDefined();
      expect(result.mcpServers['test-server']).toMatchObject({
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/Users/test/documents'],
        env: {
          NODE_ENV: 'production',
        },
      });
    });

    it('should convert multiple servers to Kiro format', () => {
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

      const result = (service as any).convertToToolConfig(unifiedConfig, 'kiro');

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

      const result = (service as any).convertToToolConfig(unifiedConfig, 'kiro');

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

      const result = (service as any).convertToToolConfig(unifiedConfig, 'kiro');

      expect(result.mcpServers['no-args-server'].args).toEqual([]);
    });

    it('should include alwaysAllow field when present', () => {
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

      const result = (service as any).convertToToolConfig(unifiedConfig, 'kiro');

      expect(result.mcpServers['permissive-server'].alwaysAllow).toEqual(['read', 'write']);
    });

    it('should omit alwaysAllow field when not present', () => {
      const unifiedConfig = {
        servers: [
          {
            id: 'restricted-server',
            name: 'restricted-server',
            command: 'node',
            args: [],
          },
        ],
      };

      const result = (service as any).convertToToolConfig(unifiedConfig, 'kiro');

      expect(result.mcpServers['restricted-server']).not.toHaveProperty('alwaysAllow');
    });
  });

  describe('Kiro Config Round-trip', () => {
    it('should preserve data through parse -> convert cycle', () => {
      const originalKiroConfig = {
        mcpServers: {
          'server1': {
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-filesystem'],
            env: {
              PATH: '/usr/bin',
            },
            alwaysAllow: ['read'],
          },
          'server2': {
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-github'],
            env: {
              GITHUB_TOKEN: 'token123',
            },
            alwaysAllow: ['read', 'write'],
          },
        },
      };

      // Parse Kiro config to unified format
      const unified = (service as any).parseToolConfig(originalKiroConfig, 'kiro');

      // Convert unified format back to Kiro format
      const kiro = (service as any).convertToToolConfig(unified, 'kiro');

      // Verify the round-trip
      expect(kiro.mcpServers['server1']).toMatchObject({
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem'],
        env: {
          PATH: '/usr/bin',
        },
        alwaysAllow: ['read'],
      });

      expect(kiro.mcpServers['server2']).toMatchObject({
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
        env: {
          GITHUB_TOKEN: 'token123',
        },
        alwaysAllow: ['read', 'write'],
      });
    });

    it('should preserve empty args through round-trip', () => {
      const originalKiroConfig = {
        mcpServers: {
          'empty-args-server': {
            command: 'node',
            args: [],
          },
        },
      };

      const unified = (service as any).parseToolConfig(originalKiroConfig, 'kiro');
      const kiro = (service as any).convertToToolConfig(unified, 'kiro');

      expect(kiro.mcpServers['empty-args-server'].args).toEqual([]);
    });

    it('should handle missing env field through round-trip', () => {
      const originalKiroConfig = {
        mcpServers: {
          'no-env-server': {
            command: 'python',
            args: ['-m', 'server'],
          },
        },
      };

      const unified = (service as any).parseToolConfig(originalKiroConfig, 'kiro');
      const kiro = (service as any).convertToToolConfig(unified, 'kiro');

      expect(kiro.mcpServers['no-env-server']).not.toHaveProperty('env');
    });

    it('should preserve alwaysAllow through round-trip', () => {
      const originalKiroConfig = {
        mcpServers: {
          'permissive-server': {
            command: 'server',
            args: [],
            alwaysAllow: ['read', 'write', 'execute'],
          },
        },
      };

      const unified = (service as any).parseToolConfig(originalKiroConfig, 'kiro');
      const kiro = (service as any).convertToToolConfig(unified, 'kiro');

      expect(kiro.mcpServers['permissive-server'].alwaysAllow).toEqual([
        'read',
        'write',
        'execute',
      ]);
    });
  });

  describe('Kiro edge cases', () => {
    it('should handle server with null env', () => {
      const kiroConfig = {
        mcpServers: {
          'null-env-server': {
            command: 'server',
            args: [],
            env: null,
          },
        },
      };

      const result = (service as any).parseToolConfig(kiroConfig, 'kiro');

      expect(result.servers[0].env).toBeNull();
    });

    it('should handle server with missing args field', () => {
      const kiroConfig = {
        mcpServers: {
          'no-args-field': {
            command: 'node',
          },
        },
      };

      const result = (service as any).parseToolConfig(kiroConfig, 'kiro');

      expect(result.servers[0].args).toEqual([]);
    });

    it('should handle server with null alwaysAllow', () => {
      const kiroConfig = {
        mcpServers: {
          'null-permissions': {
            command: 'server',
            args: [],
            alwaysAllow: null,
          },
        },
      };

      const result = (service as any).parseToolConfig(kiroConfig, 'kiro');

      expect(result.servers[0].alwaysAllow).toBeNull();
    });

    it('should handle server with empty alwaysAllow array', () => {
      const kiroConfig = {
        mcpServers: {
          'empty-permissions': {
            command: 'server',
            args: [],
            alwaysAllow: [],
          },
        },
      };

      const result = (service as any).parseToolConfig(kiroConfig, 'kiro');

      expect(result.servers[0].alwaysAllow).toEqual([]);
    });

    it('should handle complex server configurations', () => {
      const kiroConfig = {
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
            alwaysAllow: ['read', 'write'],
          },
        },
      };

      const result = (service as any).parseToolConfig(kiroConfig, 'kiro');

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
        alwaysAllow: ['read', 'write'],
      });
    });

    it('should handle server with both env and alwaysAllow', () => {
      const kiroConfig = {
        mcpServers: {
          'full-featured': {
            command: 'npx',
            args: ['-y', '@test/server'],
            env: {
              API_KEY: 'secret',
              DEBUG: 'true',
            },
            alwaysAllow: ['read', 'write', 'execute'],
          },
        },
      };

      const result = (service as any).parseToolConfig(kiroConfig, 'kiro');

      expect(result.servers[0].env).toEqual({
        API_KEY: 'secret',
        DEBUG: 'true',
      });
      expect(result.servers[0].alwaysAllow).toEqual(['read', 'write', 'execute']);
    });
  });
});
