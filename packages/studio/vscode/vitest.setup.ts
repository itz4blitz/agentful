/**
 * Vitest setup for VS Code extension tests
 */

import { vi } from 'vitest';

// Mock vscode module
vi.mock('vscode', () => ({
  window: {
    createOutputChannel: vi.fn(() => ({
      appendLine: vi.fn(),
      show: vi.fn(),
      hide: vi.fn(),
      dispose: vi.fn(),
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
  Uri: {
    file: (p: string) => ({ fsPath: p }),
    parse: (u: string) => u,
  },
  commands: {
    executeCommand: vi.fn(),
  },
  env: {
    openExternal: vi.fn(),
  },
}));

// Set up environment variables for testing
process.env.TEST_VAR = 'test-value';
process.env.API_KEY = 'secret-key';
