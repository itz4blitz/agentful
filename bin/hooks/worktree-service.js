#!/usr/bin/env node

/**
 * Git Worktree Service
 *
 * Core service for managing git worktrees in agentful.
 * Provides worktree creation, tracking, and cleanup functions.
 *
 * Environment Variables:
 *   AGENTFUL_WORKTREE_MODE - auto|block|off (default: auto)
 *   AGENTFUL_WORKTREE_LOCATION - Where to create worktrees (default: ../)
 *   AGENTFUL_WORKTREE_AUTO_CLEANUP - Auto-remove after completion (default: true)
 *   AGENTFUL_WORKTREE_RETENTION_DAYS - Days before cleanup (default: 7)
 *   AGENTFUL_WORKTREE_MAX_ACTIVE - Max active worktrees (default: 5)
 *
 * Usage:
 *   node worktree-service.js create <purpose> <branch>
 *   node worktree-service.js list
 *   node worktree-service.js cleanup
 *   node worktree-service.js prune
 *   node worktree-service.js status
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration from environment
const CONFIG = {
  mode: process.env.AGENTFUL_WORKTREE_MODE || 'auto',
  location: process.env.AGENTFUL_WORKTREE_LOCATION || '../',
  autoCleanup: process.env.AGENTFUL_WORKTREE_AUTO_CLEANUP !== 'false',
  retentionDays: parseInt(process.env.AGENTFUL_WORKTREE_RETENTION_DAYS || '7', 10),
  maxActive: parseInt(process.env.AGENTFUL_WORKTREE_MAX_ACTIVE || '5', 10),
};

// Paths
const REPO_ROOT = findRepoRoot();
const WORKTREES_DIR = path.join(REPO_ROOT, '.git', 'worktrees');
const TRACKING_FILE = path.join(REPO_ROOT, '.agentful', 'worktrees.json');

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
    console.error('❌ Not in a git repository');
    process.exit(1);
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
 * Get current working directory relative to repo root
 */
function getCurrentWorktree() {
  const cwd = process.cwd();
  const gitCommonDir = execSync('git rev-parse --git-common-dir', {
    encoding: 'utf8',
    cwd,
  }).trim();

  // If .git is a file, we're in a worktree
  const gitFile = path.join(cwd, '.git');
  const isWorktree = fs.existsSync(gitFile) && fs.statSync(gitFile).isFile();

  if (isWorktree) {
    // Read the worktree path from .git file
    const gitDir = fs.readFileSync(gitFile, 'utf8').trim();
    const worktreePath = gitDir.replace('gitdir: ', '').replace('/.git', '');
    return path.basename(worktreePath);
  }

  return null;
}

/**
 * Sanitize branch name for use in worktree name
 */
function sanitizeBranchName(branch) {
  return branch
    .replace(/\//g, '-')      // Replace / with -
    .replace(/[^a-zA-Z0-9-]/g, '')  // Remove special chars
    .replace(/-+/g, '-')      // Collapse multiple dashes
    .replace(/^-|-$/g, '');  // Trim leading/trailing dashes
}

/**
 * Validate worktree name for security
 */
function validateWorktreeName(name) {
  // Prevent path traversal
  const resolvedPath = path.resolve(REPO_ROOT, CONFIG.location, name);
  if (!resolvedPath.startsWith(REPO_ROOT)) {
    throw new Error('Invalid worktree name: path traversal detected');
  }

  // Check for valid characters
  if (!/^[a-zA-Z0-9-]+$/.test(name)) {
    throw new Error('Invalid worktree name: contains invalid characters');
  }

  return true;
}

/**
 * Get tracked worktrees from .agentful/worktrees.json
 */
function getTrackedWorktrees() {
  try {
    if (fs.existsSync(TRACKING_FILE)) {
      const content = fs.readFileSync(TRACKING_FILE, 'utf8');
      return JSON.parse(content);
    }
  } catch (error) {
    // Invalid tracking file, start fresh
    console.warn(`⚠️  Corrupted tracking file, starting fresh: ${TRACKING_FILE}`);
  }

  return { active: [] };
}

/**
 * Save tracked worktrees to .agentful/worktrees.json
 */
function saveTrackedWorktrees(data) {
  const dir = path.dirname(TRACKING_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(
    TRACKING_FILE,
    JSON.stringify(data, null, 2),
    'utf8'
  );
}

/**
 * Get list of all git worktrees
 */
function getGitWorktrees() {
  try {
    const output = execSync('git worktree list', {
      encoding: 'utf8',
      cwd: REPO_ROOT,
    });

    return output.trim().split('\n').map(line => {
      const [worktreePath, commit, branch] = line.split(/\s+/);
      return {
        path: worktreePath,
        commit,
        branch: branch.replace(/[\[\]]/g, ''), // Remove [ ] brackets
      };
    });
  } catch (error) {
    return [];
  }
}

/**
 * Check if a branch is already checked out
 */
function isBranchCheckedOut(branch) {
  const worktrees = getGitWorktrees();
  return worktrees.some(w => w.branch === branch);
}

/**
 * Create a unique branch name if original is already checked out
 */
function getUniqueBranch(originalBranch, timestamp) {
  if (!isBranchCheckedOut(originalBranch)) {
    return originalBranch;
  }

  // Create unique branch with timestamp
  const uniqueName = `${originalBranch}-agentful-${timestamp}`;
  console.log(`⚠️  Branch "${originalBranch}" already checked out`);
  console.log(`   Creating unique branch: ${uniqueName}`);
  return uniqueName;
}

/**
 * Check disk space
 */
function checkDiskSpace(requiredBytes) {
  try {
    const stats = fs.statSync(REPO_ROOT);
    // Note: This is a basic check. For production, use df or similar
    return true;
  } catch (error) {
    console.warn('⚠️  Could not check disk space');
    return true;
  }
}

/**
 * Create a new worktree
 */
function createWorktree(purpose, branch = null) {
  const timestamp = Date.now();
  const currentBranch = branch || getCurrentBranch();
  const sanitizedBranch = sanitizeBranchName(currentBranch);

  // Generate worktree name
  const worktreeName = `agentful-${purpose}-${sanitizedBranch}-${timestamp}`;

  // Validate
  validateWorktreeName(worktreeName);

  // Get unique branch if needed
  const targetBranch = getUniqueBranch(currentBranch, timestamp);

  // Check max active worktrees
  const tracked = getTrackedWorktrees();
  if (tracked.active.length >= CONFIG.maxActive) {
    console.warn(`⚠️  Maximum active worktrees reached (${CONFIG.maxActive})`);
    console.warn('   Run cleanup first: node worktree-service.js cleanup');
  }

  // Create worktree
  const worktreePath = path.join(REPO_ROOT, CONFIG.location, worktreeName);

  try {
    console.log(`🌳 Creating worktree: ${worktreeName}`);
    console.log(`   Branch: ${targetBranch}`);
    console.log(`   Path: ${worktreePath}`);

    execSync(
      `git worktree add "${worktreePath}" -b "${targetBranch}"`,
      { cwd: REPO_ROOT, stdio: 'inherit' }
    );

    // Initialize submodules if present
    const submodulePath = path.join(worktreePath, '.gitmodules');
    if (fs.existsSync(submodulePath)) {
      console.log('   📦 Initializing submodules...');
      execSync('git submodule update --init --recursive', {
        cwd: worktreePath,
        stdio: 'inherit',
      });
    }

    // Track the worktree
    const worktreeData = {
      name: worktreeName,
      path: worktreePath,
      branch: targetBranch,
      purpose,
      created_at: new Date().toISOString(),
      last_activity: new Date().toISOString(),
    };

    tracked.active.push(worktreeData);
    saveTrackedWorktrees(tracked);

    console.log(`✅ Worktree created successfully`);
    console.log(`   Export AGENTFUL_WORKTREE_DIR="${worktreePath}"`);

    // Output worktree path for easy capture
    console.log(`WORKTREE_PATH=${worktreePath}`);

    return worktreeData;
  } catch (error) {
    console.error(`❌ Failed to create worktree: ${error.message}`);
    process.exit(1);
  }
}

/**
 * List all tracked worktrees
 */
function listWorktrees() {
  const tracked = getTrackedWorktrees();
  const gitWorktrees = getGitWorktrees();

  console.log('\n📋 Active Worktrees:\n');

  if (tracked.active.length === 0) {
    console.log('   No active worktrees\n');
    return;
  }

  tracked.active.forEach(w => {
    const gitWt = gitWorktrees.find(gw => gw.path === w.path);
    const exists = !!gitWt;
    const ageMs = Date.now() - new Date(w.created_at).getTime();
    const ageMins = Math.floor(ageMs / 60000);

    let status = exists ? '🟢 Active' : '🔴 Orphaned';
    if (ageMins > 60) status = '🟡 Stale';

    console.log(`┌─────────────────────────────────────────────────────────────┐`);
    console.log(`│ ${w.name}`);
    console.log(`│ ├─ Branch: ${w.branch}`);
    console.log(`│ ├─ Purpose: ${w.purpose}`);
    console.log(`│ ├─ Path: ${w.path}`);
    console.log(`│ ├─ Status: ${status} (${ageMins} min ago)`);
    console.log(`│ └─ Created: ${w.created_at}`);
    console.log(`└─────────────────────────────────────────────────────────────┘`);
  });

  console.log('');
}

/**
 * Get status of current session
 */
function getStatus() {
  const currentWorktree = getCurrentWorktree();
  const tracked = getTrackedWorktrees();

  if (currentWorktree) {
    const wt = tracked.active.find(w => w.name === currentWorktree);
    if (wt) {
      console.log(`\n🌳 Current worktree: ${wt.name}`);
      console.log(`   Branch: ${wt.branch}`);
      console.log(`   Purpose: ${wt.purpose}`);
      console.log(`   Path: ${wt.path}\n`);
    } else {
      console.log(`\n⚠️  In untracked worktree: ${currentWorktree}`);
      console.log(`   Worktree exists but not tracked by agentful\n`);
    }
  } else {
    console.log('\n📍 Working in root repository');
    console.log('   No active worktree for this session\n');
  }

  console.log(`Mode: ${CONFIG.mode}`);
  console.log(`Location: ${CONFIG.location}`);
  console.log(`Auto-cleanup: ${CONFIG.autoCleanup ? 'enabled' : 'disabled'}`);
  console.log(`Max active: ${CONFIG.maxActive}\n`);
}

/**
 * Cleanup stale worktrees
 */
function cleanupWorktrees() {
  const tracked = getTrackedWorktrees();
  const now = Date.now();
  const retentionMs = CONFIG.retentionDays * 24 * 60 * 60 * 1000;
  let cleanedCount = 0;

  console.log(`\n🧹 Cleaning up worktrees older than ${CONFIG.retentionDays} days...\n`);

  const active = tracked.active.filter(w => {
    const age = now - new Date(w.created_at).getTime();
    const isStale = age > retentionMs;

    if (isStale) {
      console.log(`🗑️  Removing stale: ${w.name}`);
      try {
        execSync(`git worktree remove "${w.path}"`, {
          cwd: REPO_ROOT,
          stdio: 'inherit',
        });
        cleanedCount++;
      } catch (error) {
        console.warn(`   ⚠️  Failed to remove: ${error.message}`);
      }
    }

    return !isStale; // Keep only non-stale
  });

  // Save updated tracking
  saveTrackedWorktrees({ active });

  // Also run git prune to clean metadata
  console.log('\n🧹 Pruning git worktree metadata...');
  try {
    execSync('git worktree prune', { cwd: REPO_ROOT, stdio: 'inherit' });
  } catch (error) {
    console.warn(`   ⚠️  Prune warning: ${error.message}`);
  }

  console.log(`\n✅ Cleanup complete. Removed ${cleanedCount} worktree(s).\n`);
}

/**
 * Prune git worktree metadata
 */
function pruneWorktrees() {
  console.log('\n🧹 Pruning git worktree metadata...\n');
  try {
    execSync('git worktree prune', { cwd: REPO_ROOT, stdio: 'inherit' });
    console.log('✅ Prune complete\n');
  } catch (error) {
    console.error(`❌ Prune failed: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Remove a specific worktree
 */
function removeWorktree(worktreeName) {
  const tracked = getTrackedWorktrees();
  const worktree = tracked.active.find(w => w.name === worktreeName);

  if (!worktree) {
    console.error(`❌ Worktree not found: ${worktreeName}`);
    process.exit(1);
  }

  try {
    console.log(`🗑️  Removing worktree: ${worktreeName}`);
    execSync(`git worktree remove "${worktree.path}"`, {
      cwd: REPO_ROOT,
      stdio: 'inherit',
    });

    // Remove from tracking
    const active = tracked.active.filter(w => w.name !== worktreeName);
    saveTrackedWorktrees({ active });

    console.log('✅ Worktree removed\n');
  } catch (error) {
    console.error(`❌ Failed to remove worktree: ${error.message}`);
    process.exit(1);
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

// CLI interface
const command = process.argv[2];
const args = process.argv.slice(3);

// Auto-disable worktree mode in CI
if (isCIEnvironment()) {
  console.log('🤖 CI environment detected. Worktree mode auto-disabled.\n');
  process.exit(0);
}

switch (command) {
  case 'create':
    if (args.length < 1) {
      console.error('Usage: worktree-service.js create <purpose> [branch]');
      console.error('Example: worktree-service.js create feature feature/auth');
      process.exit(1);
    }
    createWorktree(args[0], args[1]);
    break;

  case 'list':
    listWorktrees();
    break;

  case 'status':
    getStatus();
    break;

  case 'cleanup':
    cleanupWorktrees();
    break;

  case 'prune':
    pruneWorktrees();
    break;

  case 'remove':
    if (args.length < 1) {
      console.error('Usage: worktree-service.js remove <worktree-name>');
      process.exit(1);
    }
    removeWorktree(args[0]);
    break;

  default:
    console.log('Git Worktree Service for agentful\n');
    console.log('Usage: node worktree-service.js <command> [args]\n');
    console.log('Commands:');
    console.log('  create <purpose> [branch]  Create a new worktree');
    console.log('  list                        List all tracked worktrees');
    console.log('  status                      Show current worktree status');
    console.log('  cleanup                     Remove stale worktrees');
    console.log('  prune                       Prune git worktree metadata');
    console.log('  remove <name>              Remove specific worktree\n');
    console.log(`Environment: AGENTFUL_WORKTREE_MODE=${CONFIG.mode}`);
    process.exit(0);
}
