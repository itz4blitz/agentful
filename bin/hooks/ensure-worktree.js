#!/usr/bin/env node

/**
 * Ensure Worktree Hook
 *
 * PreToolUse hook that enforces git worktree usage for file modifications.
 *
 * Modes:
 *   off   - Allow all edits (backward compatible)
 *   block  - Require existing worktree, reject if not in one
 *   auto   - Create worktree automatically if not in one
 *
 * Environment Variables:
 *   AGENTFUL_WORKTREE_MODE - off|block|auto (default: auto)
 *   AGENTFUL_WORKTREE_DIR - Current worktree path (if in worktree)
 *   AGENTFUL_AGENT_TYPE - Type of agent (fixer, reviewer, etc.)
 *   AGENTFUL_TASK_TYPE - Type of task (feature, hotfix, etc.)
 *
 * To disable this hook:
 *   export AGENTFUL_WORKTREE_MODE=off
 *   or remove from .claude/settings.json PreToolUse hooks
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get configuration
const MODE = process.env.AGENTFUL_WORKTREE_MODE || 'auto';
const WORKTREE_DIR = process.env.AGENTFUL_WORKTREE_DIR || '';
const AGENT_TYPE = process.env.AGENTFUL_AGENT_TYPE || 'general';
const TASK_TYPE = process.env.AGENTFUL_TASK_TYPE || 'general';

/**
 * Detect if currently in a git worktree
 */
function isInWorktree() {
  try {
    const cwd = process.cwd();
    const gitFile = path.join(cwd, '.git');

    // If .git is a file (not a directory), we're in a worktree
    if (fs.existsSync(gitFile)) {
      const stat = fs.statSync(gitFile);
      return stat.isFile();
    }

    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Find git repository root
 */
function findRepoRoot() {
  try {
    return execSync('git rev-parse --show-toplevel', {
      encoding: 'utf8',
      cwd: process.cwd(),
    }).trim();
  } catch (error) {
    return null;
  }
}

/**
 * Get current git branch
 */
function getCurrentBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', {
      encoding: 'utf8',
      cwd: process.cwd(),
    }).trim();
  } catch (error) {
    return 'unknown';
  }
}

/**
 * Detect if running in CI environment
 */
function isCIEnvironment() {
  return process.env.CI === 'true' ||
         process.env.GITHUB_ACTIONS === 'true' ||
         process.env.GITLAB_CI === 'true' ||
         process.env.CIRCLECI === 'true';
}

/**
 * Determine worktree purpose from context
 */
function determinePurpose() {
  // Agent-based purposes
  const agentPurposes = {
    'fixer': 'fix',
    'reviewer': 'review',
    'tester': 'test',
    'backend': 'backend',
    'frontend': 'frontend',
    'architect': 'architect',
    'orchestrator': 'orchestrator',
  };

  if (agentPurposes[AGENT_TYPE]) {
    return agentPurposes[AGENT_TYPE];
  }

  // Task-based purposes
  const taskPurposes = {
    'feature': 'feature',
    'hotfix': 'hotfix',
    'bugfix': 'bugfix',
    'experiment': 'experiment',
  };

  if (taskPurposes[TASK_TYPE]) {
    return taskPurposes[TASK_TYPE];
  }

  return 'general';
}

/**
 * Create worktree automatically
 */
function createWorktree() {
  try {
    const repoRoot = findRepoRoot();
    if (!repoRoot) {
      console.error(':::error Not in a git repository:::');
      process.exit(1);
    }

    const purpose = determinePurpose();
    const branch = getCurrentBranch();
    const servicePath = path.join(__dirname, 'worktree-service.js');

    console.log(`\n🌳 AGENTFUL_WORKTREE_MODE=auto`);
    console.log(`   Agent: ${AGENT_TYPE}`);
    console.log(`   Task: ${TASK_TYPE}`);
    console.log(`   Purpose: ${purpose}`);
    console.log(`   Creating worktree...\n`);

    // Execute worktree service
    const output = execSync(
      `node "${servicePath}" create "${purpose}" "${branch}"`,
      {
        cwd: repoRoot,
        encoding: 'utf8',
      }
    );

    // Extract worktree path from output
    const match = output.match(/WORKTREE_PATH=(.+)/);
    if (match && match[1]) {
      const worktreePath = match[1].trim();

      // Export for caller to capture
      console.log(`\n:::echo:::onend::`);
      console.log(`export AGENTFUL_WORKTREE_DIR="${worktreePath}"`);
      console.log(`   → Next: Run your task in this worktree\n`);
    }

    process.exit(0);
  } catch (error) {
    console.error(`:::error Failed to create worktree: ${error.message}:::`);
    process.exit(1);
  }
}

/**
 * Show block message with helpful error
 */
function showBlockMessage() {
  const branch = getCurrentBranch();
  const repoRoot = findRepoRoot();

  console.error(`
:::error
═══════════════════════════════════════════════════════════
  🚫 Blocked: Direct Repository Edits
═══════════════════════════════════════════════════════════

You are attempting to edit files in the root repository, but AGENTFUL_WORKTREE_MODE
is set to "block" which requires working in a git worktree.

Current branch: ${branch}
Current directory: ${process.cwd()}

To proceed, choose one option:

1. 🌳 Create a worktree (recommended):
   git worktree add ../my-worktree -b ${branch}
   cd ../my-worktree

2. ⚙️  Change mode to auto (creates worktrees automatically):
   export AGENTFUL_WORKTREE_MODE=auto

3. 🚫 Disable worktree protection (not recommended):
   export AGENTFUL_WORKTREE_MODE=off

For more information, see: /agentful-worktree or docs/pages/concepts/git-worktrees.mdx
:::`);

  process.exit(1);
}

// Main execution
(() => {
  // Get tool and file from environment
  const tool = process.env.TOOL || '';
  const file = process.env.FILE || '';

  // Only check Write and Edit tools
  if (tool !== 'Write' && tool !== 'Edit') {
    process.exit(0);
  }

  // Auto-disable in CI environments
  if (isCIEnvironment()) {
    process.exit(0);
  }

  // Check if already in worktree (explicitly set or detected)
  if (WORKTREE_DIR) {
    // In worktree - allow operation
    process.exit(0);
  }

  // Check if we're in a worktree directory
  if (isInWorktree()) {
    process.exit(0);
  }

  // Not in worktree - handle based on mode
  switch (MODE) {
    case 'off':
      // Allow all edits silently
      process.exit(0);

    case 'block':
      // Require existing worktree
      showBlockMessage();
      break;

    case 'auto':
      // Create worktree automatically
      createWorktree();
      break;

    default:
      console.error(`:::warning Invalid AGENTFUL_WORKTREE_MODE: ${MODE}:::`);
      console.error(`:::warning Valid options: off, block, auto:::`);
      process.exit(1);
  }
})();
