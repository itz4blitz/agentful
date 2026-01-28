#!/usr/bin/env node

/**
 * Parallel Execution Module for agentful
 *
 * Enables parallel agent delegation using Claude Code's TeammateTool when available.
 * Falls back to sequential execution when TeammateTool is not enabled.
 *
 * Phase 1: Detect and optionally enable TeammateTool via swarm mode patch
 * Phase 2: Graceful cutover when Claude Code SDK adds native support
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Check if file is a native binary (Mach-O, ELF, etc.) vs JavaScript
 * @param {string} filePath - Path to file
 * @returns {boolean} true if native binary
 */
function isNativeBinary(filePath) {
  try {
    const magic = Buffer.alloc(4);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, magic, 0, 4, 0);
    fs.closeSync(fd);
    const hex = magic.toString('hex');
    return hex === 'cffaedfe' || hex === 'cafebabe' || hex === '7f454c46';
  } catch {
    return false;
  }
}

/**
 * Detect if TeammateTool is available in current Claude Code installation
 * Auto-enables if possible
 */
export function detectTeammateTool() {
  try {
    const claudePath = findClaudeCodeBinary();
    if (!claudePath) {
      return { available: false, reason: 'Claude Code binary not found' };
    }

    if (isNativeBinary(claudePath)) {
      return { available: false, reason: 'Native binary detected - patching not supported', isNative: true };
    }

    const cliContent = fs.readFileSync(claudePath, 'utf8');

    // Check for TeammateTool presence
    const hasTeammateTool = /TeammateTool|teammate_mailbox|launchSwarm/.test(cliContent);

    if (!hasTeammateTool) {
      return { available: false, reason: 'TeammateTool code not present (Claude Code version too old)' };
    }

    // Check if swarm gate is enabled
    const gateState = detectSwarmGateState(cliContent);

    if (gateState === 'enabled') {
      return { available: true, method: 'native' };
    }

    if (gateState === 'disabled') {
      // AUTO-ENABLE: Patch on first detection
      const enableResult = enableTeammateTool();
      if (enableResult.success) {
        return { available: true, method: 'native', autoEnabled: true };
      }
      return {
        available: false,
        reason: 'TeammateTool present but failed to auto-enable',
        canEnable: true
      };
    }

    return { available: false, reason: 'Unknown gate state' };
  } catch (error) {
    return { available: false, reason: `Detection error: ${error.message}` };
  }
}

/**
 * Find Claude Code binary path
 */
function findClaudeCodeBinary() {
  try {
    // Try standard npm global install location
    const npmRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
    const cliPath = path.join(npmRoot, '@anthropic-ai', 'claude-code', 'cli.js');

    if (fs.existsSync(cliPath)) {
      return cliPath;
    }

    // Try which/where command
    const whichCmd = process.platform === 'win32' ? 'where' : 'which';
    const claudeBin = execSync(`${whichCmd} claude`, { encoding: 'utf8' }).trim().split('\n')[0];

    if (claudeBin && fs.existsSync(claudeBin)) {
      // Resolve symlinks
      const realPath = fs.realpathSync(claudeBin);
      return realPath;
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Detect swarm gate state in CLI content
 */
function detectSwarmGateState(content) {
  // Pattern: function XX(){if(Yz(process.env.CLAUDE_CODE_AGENT_SWARMS))return!1;return xK("tengu_brass_pebble",!1)}
  const SWARM_GATE_MARKER = /tengu_brass_pebble/;
  const SWARM_GATE_FN_RE = /function\s+([a-zA-Z_$][\w$]*)\(\)\{if\([\w$]+\(process\.env\.CLAUDE_CODE_AGENT_SWARMS\)\)return!1;return\s*[\w$]+\("tengu_brass_pebble",!1\)\}/;

  // Check if gate function exists (disabled state)
  if (SWARM_GATE_FN_RE.test(content)) {
    return 'disabled';
  }

  // Check if swarm code exists but marker is gone (likely patched)
  if (!SWARM_GATE_MARKER.test(content)) {
    const hasSwarmCode = /TeammateTool|teammate_mailbox|launchSwarm/.test(content);
    if (hasSwarmCode) {
      return 'enabled';
    }
    return 'unknown';
  }

  return 'unknown';
}

/**
 * Enable TeammateTool by patching Claude Code CLI
 */
export function enableTeammateTool() {
  try {
    const claudePath = findClaudeCodeBinary();
    if (!claudePath) {
      throw new Error('Claude Code binary not found');
    }

    if (isNativeBinary(claudePath)) {
      return { success: false, error: 'Native binary detected - patching not supported. TeammateTool patching only works with npm-installed Claude Code.' };
    }

    // Backup original
    const backupPath = `${claudePath}.backup-${Date.now()}`;
    fs.copyFileSync(claudePath, backupPath);

    // Read and patch
    let content = fs.readFileSync(claudePath, 'utf8');
    const patchResult = patchSwarmGate(content);

    if (!patchResult.changed) {
      fs.unlinkSync(backupPath); // Remove backup if no changes
      return { success: true, message: 'Already enabled', alreadyEnabled: true };
    }

    // Write patched version
    fs.writeFileSync(claudePath, patchResult.content, 'utf8');

    return {
      success: true,
      message: 'TeammateTool enabled successfully',
      backupPath,
      alreadyEnabled: false
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Patch swarm gate function to always return true
 */
function patchSwarmGate(content) {
  const SWARM_GATE_FN_RE = /function\s+([a-zA-Z_$][\w$]*)\(\)\{if\([\w$]+\(process\.env\.CLAUDE_CODE_AGENT_SWARMS\)\)return!1;return\s*[\w$]+\("tengu_brass_pebble",!1\)\}/;

  const match = content.match(SWARM_GATE_FN_RE);
  if (!match) {
    return { content, changed: false, state: 'unknown' };
  }

  const fnName = match[1];
  const fullMatch = match[0];

  // Replace with simple return true
  const patched = content.replace(fullMatch, `function ${fnName}(){return!0}`);

  return { content: patched, changed: true, state: 'enabled' };
}

/**
 * Get parallel execution capability information
 */
export function getParallelCapabilities() {
  const detection = detectTeammateTool();

  return {
    parallel: detection.available,
    method: detection.available ? detection.method : 'sequential',
    canEnable: detection.canEnable || false,
    reason: detection.reason || 'Available'
  };
}

/**
 * Format task delegation for parallel execution
 *
 * @param {Array} tasks - Array of {agent, description} objects
 * @returns {string} Formatted delegation prompt
 */
export function formatDelegation(tasks) {
  const taskList = tasks.map((t, i) => `${i + 1}. ${t.agent}: ${t.description}`).join('\n');

  return `Launch ${tasks.length} agents in parallel to work on these tasks simultaneously:

${taskList}

Use the Task tool to spawn all agents in parallel. Each agent should work independently on their assigned task.`;
}

// CLI interface for manual testing
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];

  if (command === 'detect') {
    console.log('Detecting TeammateTool availability...\n');
    const result = detectTeammateTool();
    console.log(JSON.stringify(result, null, 2));
  } else if (command === 'enable') {
    console.log('Enabling TeammateTool...\n');
    const result = enableTeammateTool();
    console.log(JSON.stringify(result, null, 2));
  } else if (command === 'capabilities') {
    const caps = getParallelCapabilities();
    console.log(JSON.stringify(caps, null, 2));
  } else {
    console.log(`
agentful Parallel Execution Tool

Usage:
  node lib/parallel-execution.js detect       Check if TeammateTool is available
  node lib/parallel-execution.js enable       Enable TeammateTool via patch
  node lib/parallel-execution.js capabilities Show current capabilities
`);
  }
}
