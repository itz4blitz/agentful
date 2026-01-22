#!/usr/bin/env node
// analyze-trigger.js
// Checks if changed files warrant an /agentful-analyze suggestion

import path from 'path';

const FILE = process.env.FILE || '';

// Exit silently if no file specified
if (!FILE) {
  process.exit(0);
}

// Normalize the file path to get just the filename
const filename = path.basename(FILE);
const filepath = FILE;

// Check for key files that should trigger analysis suggestions
switch (filename) {
  case 'package.json':
    // Only trigger for root package.json, not node_modules
    if (filepath.includes('node_modules')) {
      process.exit(0);
    }
    console.log('Dependencies changed in package.json. Consider running /agentful-analyze to update architecture understanding.');
    process.exit(0);

  case 'architecture.json':
    console.log('Architecture configuration updated. Run /agentful-analyze to refresh tech stack analysis.');
    process.exit(0);

  case 'tsconfig.json':
  case 'jsconfig.json':
    console.log('TypeScript/JavaScript configuration changed. Consider running /agentful-analyze to update build settings.');
    process.exit(0);

  case '.env.example':
  case '.env.sample':
    console.log('Environment template changed. Consider running /agentful-analyze to update configuration understanding.');
    process.exit(0);

  case 'docker-compose.yml':
  case 'Dockerfile':
    console.log('Docker configuration changed. Consider running /agentful-analyze to update deployment setup.');
    process.exit(0);

  default:
    // Check for build config files with patterns
    if (filename.startsWith('vite.config.') ||
        filename.startsWith('webpack.config.') ||
        filename.startsWith('rollup.config.') ||
        filename.startsWith('next.config.')) {
      console.log('Build configuration changed. Consider running /agentful-analyze to update bundler settings.');
      process.exit(0);
    }

    // No suggestion needed for other files
    process.exit(0);
}
