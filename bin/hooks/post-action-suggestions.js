#!/usr/bin/env node

/**
 * Post-Action Suggestions Hook
 *
 * Runs after specific slash commands complete.
 * Provides smart suggestions for what to do next.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to import context-awareness module
let contextModule = null;
try {
  const modulePath = path.join(__dirname, './context-awareness.js');
  if (fs.existsSync(modulePath)) {
    contextModule = await import(modulePath);
  }
} catch (error) {
  // Silently fail
}

// Detect which action was just completed
const lastAction = process.env.LAST_COMMAND || '';

// Map of slash commands to action names
const actionMap = {
  'agentful-generate': 'agentful-generate',
  'agentful-start': 'agentful-start',
  'agentful-decide': 'agentful-decide',
  'agentful-validate': 'agentful-validate',
  'agentful-status': 'agentful-status',
  'agentful-product': 'agentful-product'
};

// Find matching action
let detectedAction = null;
for (const [cmd, action] of Object.entries(actionMap)) {
  if (lastAction.includes(cmd)) {
    detectedAction = action;
    break;
  }
}

// Show suggestions if we have context module and detected action
if (contextModule && contextModule.generatePostActionSuggestions && detectedAction) {
  try {
    const suggestions = contextModule.generatePostActionSuggestions(
      detectedAction,
      process.cwd()
    );

    if (suggestions.length > 0) {
      const formatted = contextModule.formatSuggestions(suggestions, {
        maxSuggestions: 3,
        includeNumbers: true
      });

      console.log('');
      console.log('─'.repeat(60));
      console.log(formatted);
      console.log('─'.repeat(60));
    }
  } catch (error) {
    // Silently fail - don't disrupt user experience
    if (process.env.VERBOSE) {
      console.log(`Post-action suggestion error: ${error.message}`);
    }
  }
}
