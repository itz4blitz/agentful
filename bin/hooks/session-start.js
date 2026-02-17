#!/usr/bin/env node

/**
 * Session Start Hook
 *
 * Runs when Claude Code session starts.
 * Provides intelligent context awareness and suggests next actions.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to import context-awareness module from agentful package
let contextModule = null;
try {
  // Import from same directory (bin/hooks/)
  const modulePath = path.join(__dirname, './context-awareness.js');
  if (fs.existsSync(modulePath)) {
    contextModule = await import(modulePath);
  }
} catch (error) {
  // Silently fail - we'll show basic status instead
}

/**
 * Detect if TeammateTool (parallel execution) is enabled
 * Supports Windows, macOS, and Linux
 */
function detectParallelExecution() {
  // Check environment variable first (user can set AGENTFUL_PARALLEL=true)
  if (process.env.AGENTFUL_PARALLEL === 'true') {
    return { enabled: true, method: 'env_var' };
  }

  try {
    // Find Claude Code binary - try multiple paths for Windows/Unix
    let cliPath = null;
    const possiblePaths = [
      // Windows npm global
      path.join(execSync('npm root -g', { encoding: 'utf8' }).trim(), '@anthropic-ai', 'claude-code', 'cli.js'),
      // Unix npm global
      '/usr/local/lib/node_modules/@anthropic-ai/claude-code/cli.js',
      // Homebrew on macOS
      '/opt/homebrew/lib/node_modules/@anthropic-ai/claude-code/cli.js',
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        cliPath = p;
        break;
      }
    }

    if (!cliPath) {
      // Assume enabled if we can't find CLI (newer versions have it by default)
      return { enabled: true, method: 'assumed' };
    }

    // Check for TeammateTool pattern
    const content = fs.readFileSync(cliPath, 'utf8');
    const hasTeammateTool = /TeammateTool|teammate_mailbox|launchSwarm|Task\(/.test(content);

    if (!hasTeammateTool) {
      return { enabled: false, reason: 'Claude Code version too old' };
    }

    // Check if gate is disabled (means it's patched/enabled)
    const SWARM_GATE_MARKER = /tengu_brass_pebble/;
    const gateExists = SWARM_GATE_MARKER.test(content);

    if (!gateExists) {
      return { enabled: true, method: 'patched' };
    }

    // Default to enabled for newer versions
    return { enabled: true, method: 'default' };
  } catch (error) {
    // On error, assume enabled (optimistic)
    return { enabled: true, method: 'fallback' };
  }
}

// Main execution
const detection = detectParallelExecution();

// Basic parallel execution status
const parallelStatus = detection.enabled
  ? '✅ Agentful ready (parallel execution: ON)'
  : '⚠️  Agentful ready (parallel execution: OFF - agents will run sequentially)';

// Try to show intelligent context awareness
if (contextModule && contextModule.generateSessionStartMessage) {
  try {
    const message = contextModule.generateSessionStartMessage(process.cwd());
    console.log(parallelStatus);
    console.log('');
    console.log(message);
  } catch (error) {
    // Fall back to basic status
    console.log(parallelStatus);
    if (process.env.VERBOSE) {
      console.log(`   Context awareness error: ${error.message}`);
    }
  }
} else {
  // No context module - show basic status
  console.log(parallelStatus);
  if (process.env.VERBOSE && !detection.enabled) {
    console.log(`   Reason: ${detection.reason}`);
  }
}
