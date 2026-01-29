/**
 * VS Code API mock for testing
 */

import { vi } from 'vitest';

export const window = {
  createOutputChannel: vi.fn(() => ({
    appendLine: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    dispose: vi.fn(),
  })),
  showInformationMessage: vi.fn(),
  showErrorMessage: vi.fn(),
};

export const workspace = {
  workspaceFolders: [
    {
      uri: {
        fsPath: '/test/workspace',
      },
    },
  ],
};

export const Uri = {
  file: (p: string) => ({ fsPath: p }),
  parse: (u: string) => u,
};

export const commands = {
  executeCommand: vi.fn(),
};

export const env = {
  openExternal: vi.fn(),
};

export const extensions = {
  getExtension: vi.fn(),
};
