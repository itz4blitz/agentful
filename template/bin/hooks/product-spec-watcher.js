#!/usr/bin/env node

/**
 * Product Spec Watcher Hook
 *
 * Triggered on Write/Edit of .claude/product/**.md files
 * Auto-triggers /agentful-generate when product spec is updated
 *
 * Use case:
 * 1. User runs /agentful-init → creates .claude/product/index.md
 * 2. This hook detects the file creation
 * 3. Checks if from /agentful-init flow
 * 4. Auto-triggers agent generation with BOTH tech stack + requirements
 */

const fs = require('fs');
const path = require('path');

// Get tool use metadata from environment
const toolUseEnv = process.env.CLAUDE_TOOL_USE || '{}';
let toolUse;

try {
  toolUse = JSON.parse(toolUseEnv);
} catch (error) {
  // Invalid JSON - exit silently
  process.exit(0);
}

// Get the file path that was written/edited
const filePath = toolUse.parameters?.file_path || '';

// Only trigger on product spec files
if (!filePath.includes('.claude/product/')) {
  process.exit(0);
}

// Get the root directory
const getRepoRoot = () => {
  try {
    const { execSync } = require('child_process');
    return execSync('git rev-parse --show-toplevel', {
      encoding: 'utf8'
    }).trim();
  } catch {
    // Not a git repo - use cwd
    return process.cwd();
  }
};

const repoRoot = getRepoRoot();
const setupProgressPath = path.join(repoRoot, '.agentful', 'setup-progress.json');
const architecturePath = path.join(repoRoot, '.agentful', 'architecture.json');

// Check if this is from /agentful-init flow
let isFromInit = false;
let setupProgress = null;

if (fs.existsSync(setupProgressPath)) {
  try {
    setupProgress = JSON.parse(fs.readFileSync(setupProgressPath, 'utf8'));

    // Check if setup just completed but agents not yet generated
    isFromInit = setupProgress.completed &&
                 !setupProgress.agents_generated &&
                 // Must be recent (within last 5 minutes)
                 (Date.now() - new Date(setupProgress.timestamp).getTime()) < 5 * 60 * 1000;
  } catch (error) {
    // Ignore JSON parse errors
  }
}

// Check if agents already exist
const hasExistingAgents = fs.existsSync(architecturePath);

if (isFromInit && !hasExistingAgents) {
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Product Specification Updated
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: ${path.relative(repoRoot, filePath)}

Auto-triggering agent generation with:
  ✓ Tech stack (detected)
  ✓ Product requirements (from /agentful-init)

This ensures specialized agents are tailored to your product.

Starting analysis...
`);

  // Mark that we're about to generate agents
  if (setupProgress) {
    setupProgress.agents_generation_triggered = true;
    setupProgress.agents_generation_timestamp = new Date().toISOString();

    try {
      fs.writeFileSync(setupProgressPath, JSON.stringify(setupProgress, null, 2));
    } catch (error) {
      // Non-fatal - continue anyway
    }
  }

  // NOTE: The actual triggering of /agentful-generate would happen here
  // This depends on Claude Code's slash command triggering system
  // For now, we just notify the user

  console.log(`
⏭️  Next: Agent generation will continue automatically.

If it doesn't start automatically, run:
  /agentful-generate
`);

} else if (!isFromInit && !hasExistingAgents) {
  // Manual edit of product spec, but no agents yet
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Product Specification Updated
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: ${path.relative(repoRoot, filePath)}

To generate specialized agents based on your product spec:
  /agentful-generate

Or to use the guided setup:
  /agentful-init
`);

} else if (hasExistingAgents) {
  // Agents already exist - notify about regeneration
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Product Specification Updated
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: ${path.relative(repoRoot, filePath)}

Your product spec changed, but agents already exist.

To regenerate agents with updated requirements:
  /agentful-generate

Or continue with existing agents:
  /agentful-start
`);
}

process.exit(0);
