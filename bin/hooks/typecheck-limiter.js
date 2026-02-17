#!/usr/bin/env node

/**
 * TypeScript Check Hook (Cross-platform)
 *
 * Runs tsc --noEmit and shows first 5 lines of output.
 * Equivalent to: npx tsc --noEmit 2>&1 | head -5 || true
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const MAX_LINES = 5;

// Find tsc - try local node_modules first, then global
function findTsc() {
  const localTsc = path.join(process.cwd(), 'node_modules', '.bin', 'tsc');
  if (fs.existsSync(localTsc + '.cmd') || fs.existsSync(localTsc)) {
    return localTsc;
  }
  return 'tsc';
}

const tscPath = findTsc();
const tsc = spawn(tscPath, ['--noEmit'], {
  shell: true,
  cwd: process.cwd()
});

let output = '';
let lineCount = 0;

tsc.stdout.on('data', (data) => {
  if (lineCount < MAX_LINES) {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (lineCount < MAX_LINES && line.trim()) {
        output += line + '\n';
        lineCount++;
      }
    }
  }
});

tsc.stderr.on('data', (data) => {
  if (lineCount < MAX_LINES) {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (lineCount < MAX_LINES && line.trim()) {
        output += line + '\n';
        lineCount++;
      }
    }
  }
});

tsc.on('close', () => {
  if (output.trim()) {
    console.log(output.trim());
  }
  // Always exit 0 - type errors are informational
  process.exit(0);
});

tsc.on('error', () => {
  // tsc not available - exit silently
  process.exit(0);
});
