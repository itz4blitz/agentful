#!/usr/bin/env node

/**
 * Agentful Mode Toggle Hook
 *
 * Checks if agentful mode is enabled and routes user prompts accordingly.
 *
 * Usage in .claude/settings.json:
 * {
 *   "hooks": {
 *     "UserPromptSubmit": [{
 *       "hooks": [{
 *         "type": "command",
 *         "command": "node bin/hooks/agentful-mode-toggle.js"
 *       }]
 *     }]
 *   }
 * }
 */

import fs from 'fs';
import path from 'path';

const STATE_FILE = '.agentful/mode.json';

/**
 * Get current agentful mode
 */
function getMode() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
      return data.enabled ?? false;
    }
  } catch (error) {
    // File doesn't exist or invalid, default to disabled
  }
  return false;
}

/**
 * Check if prompt is a mode toggle command
 */
function isModeToggle(prompt) {
  const trimmed = prompt.trim().toLowerCase();
  return trimmed === '/agentful-mode' ||
         trimmed === '/agentful-on' ||
         trimmed === '/agentful-off';
}

/**
 * Check if prompt is a slash command
 */
function isSlashCommand(prompt) {
  return prompt.trim().startsWith('/');
}

// Get user prompt from environment (Claude Code provides this)
const userPrompt = process.env.USER_PROMPT || '';

// Check if mode toggle
if (isModeToggle(userPrompt)) {
  // Let it pass through - the actual command will handle toggling
  console.log('Mode toggle detected - passing through');
  process.exit(0);
}

// Check if agentful mode is enabled
const enabled = getMode();

if (!enabled) {
  // Agentful mode disabled - allow normal operation
  process.exit(0);
}

// Agentful mode enabled - intercept non-slash commands
if (!isSlashCommand(userPrompt)) {
  console.log('🤖 Agentful mode active - routing to /agentful');
  console.log(`Original: "${userPrompt}"`);
  console.log(`Routed: /agentful ${userPrompt}`);
  console.log('');
  console.log('To disable agentful mode: /agentful-off');

  // This is informational only - the hook can't modify the prompt
  // But it alerts the user that agentful mode is active
}

process.exit(0);
