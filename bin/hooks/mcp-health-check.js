#!/usr/bin/env node
/**
 * MCP Health Check Hook
 *
 * Verifies the "agentful" MCP server is configured in Claude Code.
 * Non-blocking: warns only, never exits with failure.
 */

import { spawnSync } from 'child_process';

const MCP_NAME = 'agentful';
const SETUP_COMMAND = 'claude mcp add agentful -- npx -y @itz4blitz/agentful-mcp-server';

function runClaudeMcpList() {
  return spawnSync('claude', ['mcp', 'list'], {
    encoding: 'utf8'
  });
}

function hasAgentfulMcp(text) {
  return new RegExp(`^\\s*${MCP_NAME}(\\s|$)`, 'm').test(text);
}

function printMissingMcpWarning() {
  console.log('⚠️  Agentful MCP server is not configured.');
  console.log(`   Run: ${SETUP_COMMAND}`);
}

(() => {
  const result = runClaudeMcpList();

  if (result.error) {
    if (result.error.code === 'ENOENT') {
      console.log('⚠️  Claude CLI not found; MCP setup check skipped.');
      return;
    }

    if (process.env.VERBOSE) {
      console.log(`⚠️  MCP setup check failed: ${result.error.message}`);
    }
    return;
  }

  if (result.status !== 0) {
    if (process.env.VERBOSE) {
      const reason = (result.stderr || result.stdout || '').trim();
      console.log(`⚠️  MCP setup check failed${reason ? `: ${reason}` : ''}`);
    }
    return;
  }

  const output = `${result.stdout || ''}\n${result.stderr || ''}`;
  if (!hasAgentfulMcp(output)) {
    printMissingMcpWarning();
  }
})();
