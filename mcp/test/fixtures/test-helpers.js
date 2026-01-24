import fs from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';

/**
 * Test Helper Utilities
 */

/**
 * Create a temporary test directory with agentful structure
 */
export async function createTestEnvironment() {
  const testDir = await fs.mkdtemp(path.join(tmpdir(), 'mcp-test-'));

  // Create directory structure
  await fs.mkdir(path.join(testDir, '.agentful'), { recursive: true });
  await fs.mkdir(path.join(testDir, '.claude/agents'), { recursive: true });
  await fs.mkdir(path.join(testDir, '.claude/product'), { recursive: true });

  // Copy fixture files
  const fixturesDir = path.join(process.cwd(), 'mcp/test/fixtures');

  await fs.copyFile(
    path.join(fixturesDir, 'mock-state.json'),
    path.join(testDir, '.agentful/state.json')
  );

  await fs.copyFile(
    path.join(fixturesDir, 'mock-completion.json'),
    path.join(testDir, '.agentful/completion.json')
  );

  // Copy test agents
  await fs.cp(
    path.join(fixturesDir, 'test-agents'),
    path.join(testDir, '.claude/agents'),
    { recursive: true }
  );

  return testDir;
}

/**
 * Clean up test environment
 */
export async function cleanupTestEnvironment(testDir) {
  if (testDir && testDir.includes('mcp-test-')) {
    await fs.rm(testDir, { recursive: true, force: true });
  }
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(condition, timeout = 5000, interval = 50) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

/**
 * Mock MCP client response
 */
export function createMockMCPClient() {
  const calls = [];

  return {
    async callTool(name, args) {
      calls.push({ type: 'tool', name, args });
      return { success: true, result: { executionId: 'mock-exec-id' } };
    },

    async readResource(uri) {
      calls.push({ type: 'resource', uri });
      return { contents: [{ uri, mimeType: 'application/json', text: '{}' }] };
    },

    async listTools() {
      return { tools: [] };
    },

    async listResources() {
      return { resources: [] };
    },

    getCalls() {
      return calls;
    },

    reset() {
      calls.length = 0;
    }
  };
}

/**
 * Create a test product spec
 */
export async function createTestProductSpec(testDir) {
  const spec = `# Test Product Specification

## Overview
A test application for MCP integration testing

## Features

### Authentication (HIGH)
- User registration
- User login
- Password reset
- Session management

### API (MEDIUM)
- RESTful endpoints
- Request validation
- Error handling
- Rate limiting

### Frontend (LOW)
- Landing page
- User dashboard
- Settings page
`;

  await fs.writeFile(
    path.join(testDir, '.claude/product/index.md'),
    spec
  );
}
