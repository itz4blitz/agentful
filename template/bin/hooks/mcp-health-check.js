#!/usr/bin/env node
/**
 * MCP Server Health Check Hook
 *
 * Checks if the Agentful MCP server is running and properly configured.
 * This should be run in the SessionStart hook after the main health check.
 */

import fs from 'fs';
import path from 'path';

/**
 * Check if MCP server tools are available
 * This is a basic check - actual tool testing happens when tools are called
 */
function checkMCPServerHealth() {
  const mcpServerPath = path.resolve(process.cwd(), 'mcp-server');

  // Skip check if MCP server directory doesn't exist
  if (!fs.existsSync(mcpServerPath)) {
    return; // Silent skip - MCP server is optional
  }

  // Check if MCP server is built
  const distPath = path.join(mcpServerPath, 'dist');
  if (!fs.existsSync(distPath)) {
    console.log('⚠️  MCP server not built. Run: cd mcp-server && npm run build');
    return;
  }

  // Check if WASM file exists
  const wasmPaths = [
    path.join(mcpServerPath, 'dist/infrastructure/sql-wasm.wasm'),
    path.join(mcpServerPath, 'dist/sql-wasm.wasm'),
    path.join(mcpServerPath, 'sql-wasm.wasm')
  ];

  const wasmExists = wasmPaths.some(p => fs.existsSync(p));
  if (!wasmExists) {
    console.log('⚠️  MCP server WASM file missing. Run: cd mcp-server && npm run build');
    return;
  }

  // All checks passed
  if (process.env.AGENTFUL_LOG_LEVEL === 'debug') {
    console.log('✅ MCP server health check passed');
  }
}

// Run health check
checkMCPServerHealth();
