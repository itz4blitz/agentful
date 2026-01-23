#!/usr/bin/env node
// analyze-trigger.js
// Checks if changed files warrant an /agentful-analyze suggestion

import path from 'path';

/**
 * Check if a file change should trigger an /agentful-analyze suggestion
 * @param {string} filepath - The file path to check
 * @returns {string|null} - Suggestion message or null if no suggestion needed
 */
export function checkAnalyzeTrigger(filepath) {
  // Exit silently if no file specified
  if (!filepath) {
    return null;
  }

  // Normalize the file path to get just the filename
  const filename = path.basename(filepath);

  // Check for key files that should trigger analysis suggestions
  switch (filename) {
    case 'package.json':
      // Only trigger for root package.json, not node_modules
      if (filepath.includes('node_modules')) {
        return null;
      }
      return 'Dependencies changed in package.json. Consider running /agentful-analyze to update architecture understanding.';

    case 'architecture.json':
      return 'Architecture configuration updated. Run /agentful-analyze to refresh tech stack analysis.';

    case 'tsconfig.json':
    case 'jsconfig.json':
      return 'TypeScript/JavaScript configuration changed. Consider running /agentful-analyze to update build settings.';

    case '.env.example':
    case '.env.sample':
      return 'Environment template changed. Consider running /agentful-analyze to update configuration understanding.';

    case 'docker-compose.yml':
    case 'Dockerfile':
      return 'Docker configuration changed. Consider running /agentful-analyze to update deployment setup.';

    default:
      // Check for build config files with patterns
      if (filename.startsWith('vite.config.') ||
          filename.startsWith('webpack.config.') ||
          filename.startsWith('rollup.config.') ||
          filename.startsWith('next.config.')) {
        return 'Build configuration changed. Consider running /agentful-analyze to update bundler settings.';
      }

      // No suggestion needed for other files
      return null;
  }
}

// CLI entrypoint
if (import.meta.url === `file://${process.argv[1]}`) {
  const FILE = process.env.FILE || '';
  const message = checkAnalyzeTrigger(FILE);

  if (message) {
    console.log(message);
  }

  process.exit(0);
}
