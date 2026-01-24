#!/usr/bin/env node

/**
 * Agentful MCP Server - Stdio Transport
 *
 * Specialized entrypoint for stdio-only mode.
 * Ensures no stdout pollution and proper stdio handling.
 *
 * Use this when:
 * - Running with Claude Code
 * - Running with Kiro
 * - Running with Aider (MCP mode)
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read version
const versionPath = path.join(__dirname, '../../version.json');
const VERSION = JSON.parse(readFileSync(versionPath, 'utf-8')).version;

// Get configuration from environment
const config = {
  transport: 'stdio',
  projectRoot: process.env.AGENTFUL_PROJECT_ROOT || process.cwd(),
  logLevel: process.env.LOG_LEVEL || 'error', // Minimal logging for stdio
};

// Log to stderr only (never stdout - reserved for MCP protocol)
function logError(message) {
  console.error(`[agentful-mcp] ${message}`);
}

// Log startup
logError(`Starting MCP server v${VERSION} (stdio mode)`);
logError(`Project: ${config.projectRoot}`);

// TODO: Import and start actual MCP server
// const { createMCPServer } = await import('../server.js');
// const server = createMCPServer(config);
// await server.start();

// Placeholder for now
logError('MCP server implementation coming soon...');

// Handle graceful shutdown (stderr only)
process.on('SIGINT', () => {
  logError('Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logError('Shutting down gracefully...');
  process.exit(0);
});

// Prevent accidental stdout writes
process.stdout.on('error', (err) => {
  if (err.code === 'EPIPE') {
    // Client disconnected - exit gracefully
    process.exit(0);
  } else {
    logError(`Stdout error: ${err.message}`);
    process.exit(1);
  }
});
