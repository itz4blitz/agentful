/**
 * Tool Integration Service Tests
 * Focus on Cursor MCP config parsing and conversion
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as vscode from 'vscode';
import { ToolIntegrationService } from '../tool-integration';

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

describe('ToolIntegrationService - Cursor MCP Support', () => {
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

  describe('parseToolConfig - Cursor format', () => {
    it('should parse Cursor stdio MCP servers from mcpServers object', async () => {
      const cursorConfig = {
        mcpServers: {
          'test-server': {
            type: 'stdio',
            command: 'node',
            args: ['server.js'],
            env: {
              NODE_ENV: 'production',
            },
          },
        },
      };

      // Access private method using TypeScript's type assertion
      const result = (service as any).parseToolConfig(cursorConfig, 'cursor');

      expect(result.servers).toHaveLength(1);
      expect(result.servers[0]).toMatchObject({
        id: 'test-server',
        name: 'test-server',
        transport: 'stdio',
        command: 'node',
        args: ['server.js'],
        env: {
          NODE_ENV: 'production',
        },
        disabled: false,
      });
    });

    it('should parse Cursor SSE transport servers', async () => {
      const cursorConfig = {
        mcpServers: {
          'sse-server': {
            type: 'sse',
            url: 'https://api.example.com/sse',
            headers: {
              Authorization: 'Bearer token123',
            },
          },
        },
      };

      const result = (service as any).parseToolConfig(cursorConfig, 'cursor');

      expect(result.servers).toHaveLength(1);
      expect(result.servers[0]).toMatchObject({
        id: 'sse-server',
        name: 'sse-server',
        transport: 'sse',
        command: 'https://api.example.com/sse',
        url: 'https://api.example.com/sse',
        env: {
          HEADERS: JSON.stringify({
            Authorization: 'Bearer token123',
          }),
        },
        disabled: false,
      });
    });

    it('should parse Cursor HTTP transport servers', async () => {
      const cursorConfig = {
        mcpServers: {
          'http-server': {
            type: 'http',
            url: 'https://api.example.com/http',
          },
        },
      };

      const result = (service as any).parseToolConfig(cursorConfig, 'cursor');

      expect(result.servers).toHaveLength(1);
      expect(result.servers[0]).toMatchObject({
        id: 'http-server',
        name: 'http-server',
        transport: 'http',
        command: 'https://api.example.com/http',
        url: 'https://api.example.com/http',
        disabled: false,
      });
    });

    it('should interpolate environment variables in commands', async () => {
      const cursorConfig = {
        mcpServers: {
          'env-server': {
            type: 'stdio',
            command: '${env:TEST_VAR}/bin/server',
            args: ['--key', '${env:API_KEY}'],
          },
        },
      };

      const result = (service as any).parseToolConfig(cursorConfig, 'cursor');

      expect(result.servers[0].command).toBe('test-value/bin/server');
      expect(result.servers[0].args).toEqual(['--key', 'secret-key']);
    });

    it('should interpolate ${workspaceFolder} variable', async () => {
      const cursorConfig = {
        mcpServers: {
          'workspace-server': {
            type: 'stdio',
            command: '${workspaceFolder}/scripts/server.sh',
            args: ['--dir', '${workspaceFolder}/data'],
          },
        },
      };

      const result = (service as any).parseToolConfig(cursorConfig, 'cursor');

      expect(result.servers[0].command).toBe('/test/workspace/scripts/server.sh');
      expect(result.servers[0].args).toEqual(['--dir', '/test/workspace/data']);
    });

    it('should default to stdio transport when type is not specified', async () => {
      const cursorConfig = {
        mcpServers: {
          'default-server': {
            command: 'python',
            args: ['-m', 'server'],
          },
        },
      };

      const result = (service as any).parseToolConfig(cursorConfig, 'cursor');

      expect(result.servers[0].transport).toBe('stdio');
      expect(result.servers[0].command).toBe('python');
    });

    it('should handle multiple servers with mixed transports', async () => {
      const cursorConfig = {
        mcpServers: {
          'stdio-server': {
            type: 'stdio',
            command: 'node',
            args: ['server1.js'],
          },
          'sse-server': {
            type: 'sse',
            url: 'https://api.example.com/sse',
          },
          'http-server': {
            type: 'http',
            url: 'https://api.example.com/http',
          },
        },
      };

      const result = (service as any).parseToolConfig(cursorConfig, 'cursor');

      expect(result.servers).toHaveLength(3);
      expect(result.servers[0].transport).toBe('stdio');
      expect(result.servers[1].transport).toBe('sse');
      expect(result.servers[2].transport).toBe('http');
    });

    it('should handle empty mcpServers object', async () => {
      const cursorConfig = {
        mcpServers: {},
      };

      const result = (service as any).parseToolConfig(cursorConfig, 'cursor');

      expect(result.servers).toHaveLength(0);
    });

    it('should handle missing mcpServers', async () => {
      const cursorConfig = {};

      const result = (service as any).parseToolConfig(cursorConfig, 'cursor');

      expect(result.servers).toHaveLength(0);
    });

    it('should preserve env variables from config', async () => {
      const cursorConfig = {
        mcpServers: {
          'env-server': {
            type: 'stdio',
            command: 'server',
            env: {
              PORT: '8080',
              HOST: 'localhost',
              DEBUG: 'true',
            },
          },
        },
      };

      const result = (service as any).parseToolConfig(cursorConfig, 'cursor');

      expect(result.servers[0].env).toEqual({
        PORT: '8080',
        HOST: 'localhost',
        DEBUG: 'true',
      });
    });
  });

  describe('convertToToolConfig - Cursor format', () => {
    it('should convert stdio servers to Cursor mcpServers format', async () => {
      const unifiedConfig = {
        servers: [
          {
            id: 'stdio-server',
            name: 'stdio-server',
            transport: 'stdio' as const,
            command: 'node',
            args: ['server.js'],
            env: {
              NODE_ENV: 'production',
            },
          },
        ],
      };

      const result = (service as any).convertToToolConfig(unifiedConfig, 'cursor');

      expect(result.mcpServers).toBeDefined();
      expect(result.mcpServers['stdio-server']).toMatchObject({
        type: 'stdio',
        command: 'node',
        args: ['server.js'],
        env: {
          NODE_ENV: 'production',
        },
      });
    });

    it('should convert SSE servers to Cursor mcpServers format', async () => {
      const unifiedConfig = {
        servers: [
          {
            id: 'sse-server',
            name: 'sse-server',
            transport: 'sse' as const,
            command: 'https://api.example.com/sse',
            url: 'https://api.example.com/sse',
            args: [],
          },
        ],
      };

      const result = (service as any).convertToToolConfig(unifiedConfig, 'cursor');

      expect(result.mcpServers['sse-server']).toMatchObject({
        type: 'sse',
        url: 'https://api.example.com/sse',
      });
    });

    it('should convert HTTP servers to Cursor mcpServers format', async () => {
      const unifiedConfig = {
        servers: [
          {
            id: 'http-server',
            name: 'http-server',
            transport: 'http' as const,
            command: 'https://api.example.com/http',
            url: 'https://api.example.com/http',
            args: [],
          },
        ],
      };

      const result = (service as any).convertToToolConfig(unifiedConfig, 'cursor');

      expect(result.mcpServers['http-server']).toMatchObject({
        type: 'http',
        url: 'https://api.example.com/http',
      });
    });

    it('should handle headers from env (stored as JSON)', async () => {
      const unifiedConfig = {
        servers: [
          {
            id: 'sse-server',
            name: 'sse-server',
            transport: 'sse' as const,
            command: 'https://api.example.com/sse',
            url: 'https://api.example.com/sse',
            args: [],
            env: {
              HEADERS: JSON.stringify({
                Authorization: 'Bearer token123',
                'X-Custom-Header': 'custom-value',
              }),
            },
          },
        ],
      };

      const result = (service as any).convertToToolConfig(unifiedConfig, 'cursor');

      expect(result.mcpServers['sse-server'].headers).toEqual({
        Authorization: 'Bearer token123',
        'X-Custom-Header': 'custom-value',
      });
      expect(result.mcpServers['sse-server'].env).toBeUndefined();
    });

    it('should handle invalid JSON in headers gracefully', async () => {
      const unifiedConfig = {
        servers: [
          {
            id: 'sse-server',
            name: 'sse-server',
            transport: 'sse' as const,
            command: 'https://api.example.com/sse',
            url: 'https://api.example.com/sse',
            args: [],
            env: {
              HEADERS: 'invalid-json{{{',
            },
          },
        ],
      };

      const result = (service as any).convertToToolConfig(unifiedConfig, 'cursor');

      // Should not have headers, but env should still have HEADERS
      expect(result.mcpServers['sse-server'].headers).toBeUndefined();
      expect(result.mcpServers['sse-server'].env?.HEADERS).toBe('invalid-json{{{');
    });

    it('should convert multiple servers with mixed transports', async () => {
      const unifiedConfig = {
        servers: [
          {
            id: 'stdio-server',
            name: 'stdio-server',
            transport: 'stdio' as const,
            command: 'node',
            args: ['server.js'],
          },
          {
            id: 'sse-server',
            name: 'sse-server',
            transport: 'sse' as const,
            command: 'https://api.example.com/sse',
            url: 'https://api.example.com/sse',
            args: [],
          },
          {
            id: 'http-server',
            name: 'http-server',
            transport: 'http' as const,
            command: 'https://api.example.com/http',
            url: 'https://api.example.com/http',
            args: [],
          },
        ],
      };

      const result = (service as any).convertToToolConfig(unifiedConfig, 'cursor');

      expect(Object.keys(result.mcpServers)).toHaveLength(3);
      expect(result.mcpServers['stdio-server'].type).toBe('stdio');
      expect(result.mcpServers['sse-server'].type).toBe('sse');
      expect(result.mcpServers['http-server'].type).toBe('http');
    });

    it('should default to stdio when transport is not specified', async () => {
      const unifiedConfig = {
        servers: [
          {
            id: 'default-server',
            name: 'default-server',
            command: 'python',
            args: ['-m', 'server'],
          },
        ],
      };

      const result = (service as any).convertToToolConfig(unifiedConfig, 'cursor');

      expect(result.mcpServers['default-server'].type).toBe('stdio');
    });

    it('should handle empty args array', async () => {
      const unifiedConfig = {
        servers: [
          {
            id: 'no-args-server',
            name: 'no-args-server',
            transport: 'stdio' as const,
            command: 'server',
            args: [],
          },
        ],
      };

      const result = (service as any).convertToToolConfig(unifiedConfig, 'cursor');

      expect(result.mcpServers['no-args-server'].args).toBeUndefined();
    });

    it('should omit env when not present', async () => {
      const unifiedConfig = {
        servers: [
          {
            id: 'no-env-server',
            name: 'no-env-server',
            transport: 'stdio' as const,
            command: 'server',
            args: [],
          },
        ],
      };

      const result = (service as any).convertToToolConfig(unifiedConfig, 'cursor');

      expect(result.mcpServers['no-env-server'].env).toBeUndefined();
    });
  });

  describe('interpolateEnvVars', () => {
    it('should replace ${env:VAR_NAME} with environment variable value', () => {
      const input = '${env:TEST_VAR}/path';
      const result = (service as any).interpolateEnvVars(input);
      expect(result).toBe('test-value/path');
    });

    it('should replace multiple ${env:VAR_NAME} occurrences', () => {
      const input = '${env:TEST_VAR}/${env:API_KEY}';
      const result = (service as any).interpolateEnvVars(input);
      expect(result).toBe('test-value/secret-key');
    });

    it('should replace ${workspaceFolder} with workspace path', () => {
      const input = '${workspaceFolder}/scripts/server.sh';
      const result = (service as any).interpolateEnvVars(input);
      expect(result).toBe('/test/workspace/scripts/server.sh');
    });

    it('should keep ${env:VAR_NAME} when variable does not exist', () => {
      const input = '${env:NONEXISTENT_VAR}/path';
      const result = (service as any).interpolateEnvVars(input);
      expect(result).toBe('${env:NONEXISTENT_VAR}/path');
    });

    it('should handle mixed env and workspaceFolder variables', () => {
      const input = '${workspaceFolder}/${env:TEST_VAR}/server';
      const result = (service as any).interpolateEnvVars(input);
      expect(result).toBe('/test/workspace/test-value/server');
    });

    it('should return original string when no variables present', () => {
      const input = '/just/a/normal/path';
      const result = (service as any).interpolateEnvVars(input);
      expect(result).toBe('/just/a/normal/path');
    });

    it('should handle empty string', () => {
      const input = '';
      const result = (service as any).interpolateEnvVars(input);
      expect(result).toBe('');
    });

    it('should handle undefined input', () => {
      const result = (service as any).interpolateEnvVars(undefined);
      expect(result).toBeUndefined();
    });

    it('should handle non-string input', () => {
      const result = (service as any).interpolateEnvVars(12345);
      expect(result).toBe(12345);
    });

    it('should keep ${workspaceFolder} when no workspace is open', () => {
      // Mock no workspace
      (vscode.workspace.workspaceFolders as any) = undefined;

      const input = '${workspaceFolder}/path';
      const result = (service as any).interpolateEnvVars(input);
      expect(result).toBe('${workspaceFolder}/path');

      // Restore workspace
      (vscode.workspace.workspaceFolders as any) = [
        {
          uri: {
            fsPath: '/test/workspace',
          },
        },
      ];
    });
  });

  describe('Cursor edge cases', () => {
    it('should handle server with no command or url (invalid config)', async () => {
      const cursorConfig = {
        mcpServers: {
          'invalid-server': {
            type: 'stdio',
            // Missing command
          },
        },
      };

      const result = (service as any).parseToolConfig(cursorConfig, 'cursor');

      expect(result.servers[0].command).toBeUndefined();
      expect(result.servers[0].args).toEqual([]);
    });

    it('should handle server with only envFile (if supported)', async () => {
      const cursorConfig = {
        mcpServers: {
          'envfile-server': {
            type: 'stdio',
            command: 'server',
            envFile: '.env',
          },
        },
      };

      const result = (service as any).parseToolConfig(cursorConfig, 'cursor');

      // envFile should be preserved in the result if needed
      expect(result.servers[0].command).toBe('server');
    });

    it('should handle URL interpolation in SSE/HTTP servers', async () => {
      const cursorConfig = {
        mcpServers: {
          'interpolated-url': {
            type: 'sse',
            url: 'https://${env:TEST_VAR}.example.com/sse',
          },
        },
      };

      const result = (service as any).parseToolConfig(cursorConfig, 'cursor');

      expect(result.servers[0].url).toBe('https://test-value.example.com/sse');
      expect(result.servers[0].command).toBe('https://test-value.example.com/sse');
    });

    it('should handle project vs global config paths', async () => {
      // Test that .cursor/mcp.json (project) and ~/.cursor/mcp.json (global) are handled
      const toolDefs = (service as any).constructor.TOOL_DEFINITIONS || [];
      const cursorTool = toolDefs.find((t: any) => t.id === 'cursor');

      expect(cursorTool).toBeDefined();
      expect(cursorTool.configPath).toBe('.cursor/mcp.json');
    });
  });
});

describe('ToolIntegrationService - Gemini CLI', () => {
  let service: ToolIntegrationService;
  let mockContext: any;

  beforeEach(() => {
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

    service = new ToolIntegrationService(mockContext);
  });

  describe('parseGeminiConfig', () => {
    it('should parse stdio transport with command and args', () => {
      const geminiConfig = {
        mcpServers: {
          'test-server': {
            transport: 'stdio',
            command: 'npx',
            args: ['-y', '@itz4blitz/agentful-mcp-server'],
            env: {
              API_KEY: 'test-key',
            },
          },
        },
      };

      const result = (service as any).parseToolConfig(geminiConfig, 'gemini');

      expect(result.servers).toHaveLength(1);
      expect(result.servers[0]).toMatchObject({
        id: 'test-server',
        name: 'test-server',
        transport: 'stdio',
        command: 'npx',
        args: ['-y', '@itz4blitz/agentful-mcp-server'],
        env: {
          API_KEY: 'test-key',
        },
      });
    });

    it('should parse HTTP transport with httpUrl', () => {
      const geminiConfig = {
        mcpServers: {
          'http-server': {
            httpUrl: 'http://localhost:3000/mcp',
            headers: {
              Authorization: 'Bearer token',
            },
            timeout: 30000,
          },
        },
      };

      const result = (service as any).parseToolConfig(geminiConfig, 'gemini');

      expect(result.servers).toHaveLength(1);
      expect(result.servers[0]).toMatchObject({
        id: 'http-server',
        name: 'http-server',
        transport: 'http',
        url: 'http://localhost:3000/mcp',
        timeout: 30000,
      });
    });

    it('should parse SSE transport with url', () => {
      const geminiConfig = {
        mcpServers: {
          'sse-server': {
            url: 'http://localhost:3000/sse',
            timeout: 60000,
          },
        },
      };

      const result = (service as any).parseToolConfig(geminiConfig, 'gemini');

      expect(result.servers).toHaveLength(1);
      expect(result.servers[0]).toMatchObject({
        id: 'sse-server',
        name: 'sse-server',
        transport: 'sse',
        url: 'http://localhost:3000/sse',
        timeout: 60000,
      });
    });

    it('should handle transport precedence: httpUrl > url > command', () => {
      const geminiConfig = {
        mcpServers: {
          'precedence-test': {
            httpUrl: 'http://localhost:3000/mcp',
            url: 'http://localhost:3000/sse',
            command: 'npx',
            args: ['server'],
          },
        },
      };

      const result = (service as any).parseToolConfig(geminiConfig, 'gemini');

      expect(result.servers[0].transport).toBe('http');
      expect(result.servers[0].url).toBe('http://localhost:3000/mcp');
      expect(result.servers[0].command).toBeUndefined();
    });

    it('should parse multiple servers', () => {
      const geminiConfig = {
        mcpServers: {
          'stdio-server': {
            command: 'npx',
            args: ['@modelcontextprotocol/server-filesystem'],
          },
          'http-server': {
            httpUrl: 'http://localhost:3000/mcp',
          },
          'sse-server': {
            url: 'http://localhost:4000/sse',
          },
        },
      };

      const result = (service as any).parseToolConfig(geminiConfig, 'gemini');

      expect(result.servers).toHaveLength(3);
      expect(result.servers[0]).toMatchObject({
        id: 'stdio-server',
        transport: 'stdio',
        command: 'npx',
      });
      expect(result.servers[1]).toMatchObject({
        id: 'http-server',
        transport: 'http',
        url: 'http://localhost:3000/mcp',
      });
      expect(result.servers[2]).toMatchObject({
        id: 'sse-server',
        transport: 'sse',
        url: 'http://localhost:4000/sse',
      });
    });

    it('should return empty servers array when mcpServers is missing', () => {
      const geminiConfig = {};
      const result = (service as any).parseToolConfig(geminiConfig, 'gemini');

      expect(result.servers).toEqual([]);
    });

    it('should handle server with minimal config', () => {
      const geminiConfig = {
        mcpServers: {
          'minimal-server': {
            command: 'node',
          },
        },
      };

      const result = (service as any).parseToolConfig(geminiConfig, 'gemini');

      expect(result.servers[0]).toMatchObject({
        id: 'minimal-server',
        name: 'minimal-server',
        transport: 'stdio',
        command: 'node',
        args: [],
        disabled: false,
      });
    });
  });

  describe('convertToGeminiConfig', () => {
    it('should convert stdio transport to Gemini format', () => {
      const unifiedConfig = {
        servers: [
          {
            id: 'stdio-server',
            name: 'stdio-server',
            transport: 'stdio' as const,
            command: 'npx',
            args: ['-y', '@itz4blitz/agentful-mcp-server'],
            env: {
              API_KEY: 'test-key',
            },
            disabled: false,
          },
        ],
      };

      const result = (service as any).convertToToolConfig(unifiedConfig, 'gemini');

      expect(result).toEqual({
        mcpServers: {
          'stdio-server': {
            transport: 'stdio',
            command: 'npx',
            args: ['-y', '@itz4blitz/agentful-mcp-server'],
            env: {
              API_KEY: 'test-key',
            },
          },
        },
      });
    });

    it('should convert HTTP transport to Gemini format with httpUrl', () => {
      const unifiedConfig = {
        servers: [
          {
            id: 'http-server',
            name: 'http-server',
            transport: 'http' as const,
            url: 'http://localhost:3000/mcp',
            timeout: 30000,
            disabled: false,
          },
        ],
      };

      const result = (service as any).convertToToolConfig(unifiedConfig, 'gemini');

      expect(result).toEqual({
        mcpServers: {
          'http-server': {
            httpUrl: 'http://localhost:3000/mcp',
            timeout: 30000,
          },
        },
      });
    });

    it('should convert SSE transport to Gemini format with url', () => {
      const unifiedConfig = {
        servers: [
          {
            id: 'sse-server',
            name: 'sse-server',
            transport: 'sse' as const,
            url: 'http://localhost:3000/sse',
            timeout: 60000,
            disabled: false,
          },
        ],
      };

      const result = (service as any).convertToToolConfig(unifiedConfig, 'gemini');

      expect(result).toEqual({
        mcpServers: {
          'sse-server': {
            url: 'http://localhost:3000/sse',
            timeout: 60000,
          },
        },
      });
    });

    it('should convert multiple servers with different transports', () => {
      const unifiedConfig = {
        servers: [
          {
            id: 'stdio-server',
            name: 'stdio-server',
            transport: 'stdio' as const,
            command: 'npx',
            args: ['server1'],
            disabled: false,
          },
          {
            id: 'http-server',
            name: 'http-server',
            transport: 'http' as const,
            url: 'http://localhost:3000/mcp',
            disabled: false,
          },
          {
            id: 'sse-server',
            name: 'sse-server',
            transport: 'sse' as const,
            url: 'http://localhost:4000/sse',
            disabled: false,
          },
        ],
      };

      const result = (service as any).convertToToolConfig(unifiedConfig, 'gemini');

      expect(result).toEqual({
        mcpServers: {
          'stdio-server': {
            transport: 'stdio',
            command: 'npx',
            args: ['server1'],
          },
          'http-server': {
            httpUrl: 'http://localhost:3000/mcp',
          },
          'sse-server': {
            url: 'http://localhost:4000/sse',
          },
        },
      });
    });

    it('should handle server with empty args array', () => {
      const unifiedConfig = {
        servers: [
          {
            id: 'no-args-server',
            name: 'no-args-server',
            transport: 'stdio' as const,
            command: 'node',
            args: [],
            disabled: false,
          },
        ],
      };

      const result = (service as any).convertToToolConfig(unifiedConfig, 'gemini');

      expect(result.mcpServers['no-args-server']).not.toHaveProperty('args');
    });

    it('should omit optional fields when not present', () => {
      const unifiedConfig = {
        servers: [
          {
            id: 'minimal-server',
            name: 'minimal-server',
            transport: 'stdio' as const,
            command: 'node',
            disabled: false,
          },
        ],
      };

      const result = (service as any).convertToToolConfig(unifiedConfig, 'gemini');

      expect(result).toEqual({
        mcpServers: {
          'minimal-server': {
            transport: 'stdio',
            command: 'node',
          },
        },
      });
    });
  });

  describe('Gemini Config Round-trip', () => {
    it('should preserve data through parse -> convert cycle', () => {
      const originalGeminiConfig = {
        mcpServers: {
          'server1': {
            transport: 'stdio',
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-filesystem'],
            env: {
              PATH: '/usr/bin',
            },
          },
          'server2': {
            httpUrl: 'http://localhost:3000/mcp',
            timeout: 60000,
          },
          'server3': {
            url: 'http://localhost:4000/sse',
            timeout: 120000,
          },
        },
      };

      // Parse Gemini config to unified format
      const unified = (service as any).parseToolConfig(originalGeminiConfig, 'gemini');

      // Convert unified format back to Gemini format
      const gemini = (service as any).convertToToolConfig(unified, 'gemini');

      // Verify the round-trip
      expect(gemini.mcpServers['server1']).toMatchObject({
        transport: 'stdio',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem'],
        env: {
          PATH: '/usr/bin',
        },
      });

      expect(gemini.mcpServers['server2']).toMatchObject({
        httpUrl: 'http://localhost:3000/mcp',
        timeout: 60000,
      });

      expect(gemini.mcpServers['server3']).toMatchObject({
        url: 'http://localhost:4000/sse',
        timeout: 120000,
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle server with null values', () => {
      const geminiConfig = {
        mcpServers: {
          'null-server': {
            command: 'npx',
            args: null,
            env: null,
          },
        },
      };

      const result = (service as any).parseToolConfig(geminiConfig, 'gemini');

      expect(result.servers[0].args).toEqual([]);
      expect(result.servers[0].env).toBeNull();
    });

    it('should handle malformed server config gracefully', () => {
      const geminiConfig = {
        mcpServers: {
          'malformed-server': {
            // No transport info at all
          },
        },
      };

      const result = (service as any).parseToolConfig(geminiConfig, 'gemini');

      // Should create a server entry even with minimal info
      expect(result.servers[0].id).toBe('malformed-server');
      expect(result.servers[0].transport).toBe('stdio');
    });

    it('should preserve numeric timeout values', () => {
      const geminiConfig = {
        mcpServers: {
          'timeout-server': {
            httpUrl: 'http://localhost:3000/mcp',
            timeout: 45000,
          },
        },
      };

      const result = (service as any).parseToolConfig(geminiConfig, 'gemini');

      expect(result.servers[0].timeout).toBe(45000);
      expect(typeof result.servers[0].timeout).toBe('number');
    });
  });
});

describe('ToolIntegrationService - Cline', () => {
  let service: ToolIntegrationService;
  let mockContext: any;

  beforeEach(() => {
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

    service = new ToolIntegrationService(mockContext);
  });

  describe('getClineConfigPath', () => {
    it('should return macOS-specific path', () => {
      // Mock platform as macOS
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        configurable: true,
      });

      const path = (service as any).getClineConfigPath();

      expect(path).toContain('Library/Application Support/Code/User/globalStorage');
      expect(path).toContain('saoudrizwan.claude-dev');
      expect(path).toContain('cline_mcp_settings.json');

      // Restore platform
      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
        configurable: true,
      });
    });

    it('should return Windows-specific path', () => {
      const originalPlatform = process.platform;
      const originalAppData = process.env.APPDATA;

      Object.defineProperty(process, 'platform', {
        value: 'win32',
        configurable: true,
      });
      process.env.APPDATA = 'C:\\Users\\Test\\AppData\\Roaming';

      const path = (service as any).getClineConfigPath();

      expect(path).toContain('Code\\User\\globalStorage');
      expect(path).toContain('saoudrizwan.claude-dev');
      expect(path).toContain('cline_mcp_settings.json');

      // Restore
      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
        configurable: true,
      });
      process.env.APPDATA = originalAppData;
    });

    it('should return Linux-specific path', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        configurable: true,
      });

      const path = (service as any).getClineConfigPath();

      expect(path).toContain('.config/Code/User/globalStorage');
      expect(path).toContain('saoudrizwan.claude-dev');
      expect(path).toContain('cline_mcp_settings.json');

      // Restore platform
      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
        configurable: true,
      });
    });

    it('should fallback to Linux path for unknown platforms', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', {
        value: 'freebsd',
        configurable: true,
      });

      const path = (service as any).getClineConfigPath();

      expect(path).toContain('.config/Code/User/globalStorage');

      // Restore platform
      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
        configurable: true,
      });
    });
  });

  describe('parseToolConfig - Cline format', () => {
    it('should parse Cline MCP servers from mcpServers object', () => {
      const clineConfig = {
        mcpServers: {
          'test-server': {
            command: 'npx',
            args: ['-y', '@itz4blitz/agentful-mcp-server'],
            env: {
              API_KEY: 'test-key',
            },
            alwaysAllow: ['read', 'write'],
            disabled: false,
          },
        },
      };

      const result = (service as any).parseToolConfig(clineConfig, 'cline');

      expect(result.servers).toHaveLength(1);
      expect(result.servers[0]).toMatchObject({
        id: 'test-server',
        name: 'test-server',
        command: 'npx',
        args: ['-y', '@itz4blitz/agentful-mcp-server'],
        env: {
          API_KEY: 'test-key',
        },
        alwaysAllow: ['read', 'write'],
        disabled: false,
      });
    });

    it('should handle server with disabled field set to true', () => {
      const clineConfig = {
        mcpServers: {
          'disabled-server': {
            command: 'node',
            args: ['server.js'],
            disabled: true,
          },
        },
      };

      const result = (service as any).parseToolConfig(clineConfig, 'cline');

      expect(result.servers[0].disabled).toBe(true);
    });

    it('should default disabled to false when not specified', () => {
      const clineConfig = {
        mcpServers: {
          'enabled-server': {
            command: 'python',
            args: ['-m', 'server'],
          },
        },
      };

      const result = (service as any).parseToolConfig(clineConfig, 'cline');

      expect(result.servers[0].disabled).toBe(false);
    });

    it('should handle alwaysAllow field', () => {
      const clineConfig = {
        mcpServers: {
          'permissive-server': {
            command: 'server',
            args: [],
            alwaysAllow: ['read', 'write', 'execute'],
          },
        },
      };

      const result = (service as any).parseToolConfig(clineConfig, 'cline');

      expect(result.servers[0].alwaysAllow).toEqual(['read', 'write', 'execute']);
    });

    it('should handle server without optional fields', () => {
      const clineConfig = {
        mcpServers: {
          'minimal-server': {
            command: 'node',
          },
        },
      };

      const result = (service as any).parseToolConfig(clineConfig, 'cline');

      expect(result.servers[0]).toMatchObject({
        id: 'minimal-server',
        name: 'minimal-server',
        command: 'node',
        args: [],
        disabled: false,
      });
      expect(result.servers[0].alwaysAllow).toBeUndefined();
    });

    it('should handle multiple servers', () => {
      const clineConfig = {
        mcpServers: {
          'server1': {
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-filesystem'],
            alwaysAllow: ['read'],
          },
          'server2': {
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-github'],
            disabled: true,
          },
        },
      };

      const result = (service as any).parseToolConfig(clineConfig, 'cline');

      expect(result.servers).toHaveLength(2);
      expect(result.servers[0].id).toBe('server1');
      expect(result.servers[0].alwaysAllow).toEqual(['read']);
      expect(result.servers[1].id).toBe('server2');
      expect(result.servers[1].disabled).toBe(true);
    });

    it('should handle empty mcpServers object', () => {
      const clineConfig = {
        mcpServers: {},
      };

      const result = (service as any).parseToolConfig(clineConfig, 'cline');

      expect(result.servers).toHaveLength(0);
    });

    it('should handle missing mcpServers', () => {
      const clineConfig = {};

      const result = (service as any).parseToolConfig(clineConfig, 'cline');

      expect(result.servers).toHaveLength(0);
    });

    it('should preserve environment variables', () => {
      const clineConfig = {
        mcpServers: {
          'env-server': {
            command: 'server',
            args: ['--port', '8080'],
            env: {
              NODE_ENV: 'production',
              API_KEY: 'secret',
              DEBUG: 'true',
            },
          },
        },
      };

      const result = (service as any).parseToolConfig(clineConfig, 'cline');

      expect(result.servers[0].env).toEqual({
        NODE_ENV: 'production',
        API_KEY: 'secret',
        DEBUG: 'true',
      });
    });
  });

  describe('convertToToolConfig - Cline format', () => {
    it('should convert unified config to Cline mcpServers format', () => {
      const unifiedConfig = {
        servers: [
          {
            id: 'test-server',
            name: 'test-server',
            command: 'npx',
            args: ['-y', '@itz4blitz/agentful-mcp-server'],
            env: {
              API_KEY: 'test-key',
            },
            alwaysAllow: ['read', 'write'],
            disabled: false,
          },
        ],
      };

      const result = (service as any).convertToToolConfig(unifiedConfig, 'cline');

      expect(result.mcpServers).toBeDefined();
      expect(result.mcpServers['test-server']).toMatchObject({
        command: 'npx',
        args: ['-y', '@itz4blitz/agentful-mcp-server'],
        env: {
          API_KEY: 'test-key',
        },
        alwaysAllow: ['read', 'write'],
        disabled: false,
      });
    });

    it('should include disabled field when true', () => {
      const unifiedConfig = {
        servers: [
          {
            id: 'disabled-server',
            name: 'disabled-server',
            command: 'node',
            args: ['server.js'],
            disabled: true,
          },
        ],
      };

      const result = (service as any).convertToToolConfig(unifiedConfig, 'cline');

      expect(result.mcpServers['disabled-server'].disabled).toBe(true);
    });

    it('should omit disabled field when false', () => {
      const unifiedConfig = {
        servers: [
          {
            id: 'enabled-server',
            name: 'enabled-server',
            command: 'python',
            args: ['-m', 'server'],
            disabled: false,
          },
        ],
      };

      const result = (service as any).convertToToolConfig(unifiedConfig, 'cline');

      expect(result.mcpServers['enabled-server']).not.toHaveProperty('disabled');
    });

    it('should include alwaysAllow field when present', () => {
      const unifiedConfig = {
        servers: [
          {
            id: 'permissive-server',
            name: 'permissive-server',
            command: 'server',
            args: [],
            alwaysAllow: ['read', 'write', 'execute'],
          },
        ],
      };

      const result = (service as any).convertToToolConfig(unifiedConfig, 'cline');

      expect(result.mcpServers['permissive-server'].alwaysAllow).toEqual(['read', 'write', 'execute']);
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

      const result = (service as any).convertToToolConfig(unifiedConfig, 'cline');

      expect(result.mcpServers['restricted-server']).not.toHaveProperty('alwaysAllow');
    });

    it('should omit env field when not present', () => {
      const unifiedConfig = {
        servers: [
          {
            id: 'no-env-server',
            name: 'no-env-server',
            command: 'server',
            args: [],
          },
        ],
      };

      const result = (service as any).convertToToolConfig(unifiedConfig, 'cline');

      expect(result.mcpServers['no-env-server']).not.toHaveProperty('env');
    });

    it('should handle empty args array', () => {
      const unifiedConfig = {
        servers: [
          {
            id: 'no-args-server',
            name: 'no-args-server',
            command: 'server',
            args: [],
          },
        ],
      };

      const result = (service as any).convertToToolConfig(unifiedConfig, 'cline');

      expect(result.mcpServers['no-args-server']).not.toHaveProperty('args');
    });

    it('should convert multiple servers', () => {
      const unifiedConfig = {
        servers: [
          {
            id: 'server1',
            name: 'server1',
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-filesystem'],
            alwaysAllow: ['read'],
          },
          {
            id: 'server2',
            name: 'server2',
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-github'],
            disabled: true,
          },
        ],
      };

      const result = (service as any).convertToToolConfig(unifiedConfig, 'cline');

      expect(Object.keys(result.mcpServers)).toHaveLength(2);
      expect(result.mcpServers['server1'].alwaysAllow).toEqual(['read']);
      expect(result.mcpServers['server2'].disabled).toBe(true);
    });
  });

  describe('Cline Config Round-trip', () => {
    it('should preserve data through parse -> convert cycle', () => {
      const originalClineConfig = {
        mcpServers: {
          'server1': {
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-filesystem'],
            env: {
              PATH: '/usr/bin',
            },
            alwaysAllow: ['read', 'write'],
          },
          'server2': {
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-github'],
            disabled: true,
          },
        },
      };

      // Parse Cline config to unified format
      const unified = (service as any).parseToolConfig(originalClineConfig, 'cline');

      // Convert unified format back to Cline format
      const cline = (service as any).convertToToolConfig(unified, 'cline');

      // Verify the round-trip
      expect(cline.mcpServers['server1']).toMatchObject({
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem'],
        env: {
          PATH: '/usr/bin',
        },
        alwaysAllow: ['read', 'write'],
      });

      expect(cline.mcpServers['server2']).toMatchObject({
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
        disabled: true,
      });
    });

    it('should preserve disabled field correctly in round-trip', () => {
      const originalClineConfig = {
        mcpServers: {
          'disabled-server': {
            command: 'node',
            args: ['server.js'],
            disabled: true,
          },
        },
      };

      const unified = (service as any).parseToolConfig(originalClineConfig, 'cline');
      const cline = (service as any).convertToToolConfig(unified, 'cline');

      expect(cline.mcpServers['disabled-server'].disabled).toBe(true);
    });

    it('should preserve alwaysAllow field correctly in round-trip', () => {
      const originalClineConfig = {
        mcpServers: {
          'permissive-server': {
            command: 'server',
            args: [],
            alwaysAllow: ['read', 'write', 'execute'],
          },
        },
      };

      const unified = (service as any).parseToolConfig(originalClineConfig, 'cline');
      const cline = (service as any).convertToToolConfig(unified, 'cline');

      expect(cline.mcpServers['permissive-server'].alwaysAllow).toEqual(['read', 'write', 'execute']);
    });
  });

  describe('readMCPConfig - Cline special path handling', () => {
    it('should use Cline-specific config path for cline tool ID', async () => {
      const getClineConfigPathSpy = vi.spyOn(service as any, 'getClineConfigPath');
      getClineConfigPathSpy.mockReturnValue('/test/path/cline_mcp_settings.json');

      // Mock fs.readFile
      const fs = require('fs/promises');
      fs.readFile = vi.fn().mockResolvedValue(JSON.stringify({ mcpServers: {} }));

      await service.readMCPConfig('cline');

      expect(getClineConfigPathSpy).toHaveBeenCalled();
    });
  });

  describe('writeMCPConfig - Cline special path handling', () => {
    it('should use Cline-specific config path for cline tool ID', async () => {
      const getClineConfigPathSpy = vi.spyOn(service as any, 'getClineConfigPath');
      getClineConfigPathSpy.mockReturnValue('/test/path/cline_mcp_settings.json');

      // Mock fs methods
      const fs = require('fs/promises');
      fs.mkdir = vi.fn().mockResolvedValue(undefined);
      fs.readFile = vi.fn().mockRejectedValue(new Error('File not found'));
      fs.writeFile = vi.fn().mockResolvedValue(undefined);

      const config = {
        servers: [
          {
            id: 'test-server',
            name: 'test-server',
            command: 'npx',
            args: ['-y', '@itz4blitz/agentful-mcp-server'],
          },
        ],
      };

      await service.writeMCPConfig('cline', config);

      expect(getClineConfigPathSpy).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle server with null alwaysAllow', () => {
      const clineConfig = {
        mcpServers: {
          'null-permissions': {
            command: 'server',
            args: [],
            alwaysAllow: null,
          },
        },
      };

      const result = (service as any).parseToolConfig(clineConfig, 'cline');

      expect(result.servers[0].alwaysAllow).toBeNull();
    });

    it('should handle server with empty alwaysAllow array', () => {
      const clineConfig = {
        mcpServers: {
          'empty-permissions': {
            command: 'server',
            args: [],
            alwaysAllow: [],
          },
        },
      };

      const result = (service as any).parseToolConfig(clineConfig, 'cline');

      expect(result.servers[0].alwaysAllow).toEqual([]);
    });

    it('should handle server with null disabled field', () => {
      const clineConfig = {
        mcpServers: {
          'null-disabled': {
            command: 'server',
            args: [],
            disabled: null,
          },
        },
      };

      const result = (service as any).parseToolConfig(clineConfig, 'cline');

      expect(result.servers[0].disabled).toBe(null);
    });
  });
});
