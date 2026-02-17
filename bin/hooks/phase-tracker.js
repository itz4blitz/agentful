#!/usr/bin/env node

/**
 * Phase Tracker Hook
 *
 * Tracks current agentful phase from .agentful/state.json
 * Cross-platform compatible (Windows, macOS, Linux)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STATE_FILE = path.join(process.cwd(), '.agentful', 'state.json');

try {
  if (fs.existsSync(STATE_FILE)) {
    const content = fs.readFileSync(STATE_FILE, 'utf8');
    const state = JSON.parse(content);
    const phase = state.current_phase || 'idle';
    // Silent output - just track phase internally
    // console.log(phase);
  }
} catch (error) {
  // Silently fail - phase tracking is optional
}

process.exit(0);
