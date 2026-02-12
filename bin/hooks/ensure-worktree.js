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
 *   AGENTFUL_WORKTREE_DIR - Where to create worktrees (default: ../)
 *   AGENTFUL_WORKTREE_AUTO_CLEANUP - Auto-remove after completion (default: true)
 *   AGENTFUL_WORKTREE_RETENTION_DAYS - Days before cleanup (default: 7)
 *   AGENTFUL_WORKTREE_MAX_ACTIVE - Max active worktrees (default: 5)
 *
 * To disable this hook:
 *   Temporary: export AGENTFUL_WORKTREE_MODE=off
 *   Permanent: Remove from .claude/settings.json PreToolUse hooks
 *   Customize: Edit bin/hooks/ensure-worktree.js
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync, existsSync } from 'fs';

// Get configuration
const MODE = process.env.AGENTFUL_WORKTREE_MODE || 'auto';
const WORKTREE_DIR = process.env.AGENTFUL_WORKTREE_DIR || '../';
const AUTO_CLEANUP = process.env.AGENTFUL_WORKTREE_AUTO_CLEANUP !== 'false';
const RETENTION_DAYS = parseInt(process.env.AGENTFUL_WORKTREE_RETENTION_DAYS || '7', 10);
const MAX_ACTIVE = parseInt(process.env.AGENTFUL_WORKTREE_MAX_ACTIVE || '5', 10);
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
    if (existsSync(gitFile) && statSync(gitFile).isFile()) {
      return true;
    }
  } catch (error) {
    return false;
  }
}

/**
 * Determine worktree purpose from agent/task context
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

  // Task-based purposes
  const taskPurposes = {
    'feature': 'feature',
    'hotfix': 'hotfix',
    'bugfix': 'bugfix',
    'experiment': 'experiment',
  };

  // Determine purpose based on agent type, then task type
  if (agentPurposes[AGENT_TYPE]) {
    return agentPurposes[AGENT_TYPE];
  }

  if (taskPurposes[TASK_TYPE]) {
    return taskPurposes[TASK_TYPE];
  }

  // Default to general
  return 'general';
}

/**
 * Show block message with helpful error
 */
function showBlockMessage() {
  const branch = getCurrentBranch();

  console.error(`
:::error
═════════════════════════════════════════════════
  🚫 Blocked: Direct Repository Edits
═════════════════════════════════════════════════

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

/**
 * Create worktree automatically
 */
function createWorktree() {
  const repoRoot = findRepoRoot();
  if (!repoRoot) {
    console.error(':::error Not in a git repository:::');
    process.exit(1);
  }

  const purpose = determinePurpose();
  const branch = getCurrentBranch();
  const timestamp = Date.now();

  // Generate worktree name
  const worktreeName = `agentful-${purpose}-${sanitizeBranchName(branch)}-${timestamp}`;

  // Create worktree
  const worktreePath = path.join(repoRoot, WORKTREE_DIR, worktreeName);

  console.log(`🌳 Creating worktree: ${worktreeName}`);
  console.log(`   Branch: ${branch}`);
  console.log(`   Path: ${worktreePath}`);

  try {
    execSync(
      `git worktree add "${worktreePath}" -b "${branch}"`,
      { cwd: repoRoot, stdio: 'inherit' }
    );
  } catch (error) {
    console.error(`:::error Failed to create worktree: ${error.message}:::`);
    process.exit(1);
  }

  // Track in state.json (would happen in orchestrator, but this is standalone)
  try {
    const stateFile = path.join(repoRoot, '.agentful', 'state.json');
    if (existsSync(stateFile)) {
      const state = JSON.parse(readFileSync(stateFile, 'utf8'));
      state.current_worktree = {
        name: worktreeName,
        path: worktreePath,
        branch: branch,
        purpose: purpose,
        created_at: new Date().toISOString(),
      };
      writeFileSync(stateFile, JSON.stringify(state, null, 2));
    }
  } catch (error) {
    // State file might not exist yet, that's okay
  }

  // Export for caller to capture
  console.log(`export AGENTFUL_WORKTREE_DIR="${worktreePath}"`);

  process.exit(0);
}

/**
 * Main execution
 */
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

  // Not in worktree - handle based on mode
  switch (MODE) {
    case 'off':
      // Allow all edits silently
      process.exit(0);
      break;

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
