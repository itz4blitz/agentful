#!/usr/bin/env node

/**
 * Codebase Analyzer CLI
 *
 * Simple CLI for testing the analyzer
 *
 * Usage:
 *   node lib/core/cli.js [options]
 *
 * Options:
 *   --project <path>   Project root path (default: current directory)
 *   --output <path>    Output file path (default: .agentful/architecture.json)
 *   --force            Force re-analysis even if cache is fresh
 *   --verbose          Show detailed progress
 */

import { CodebaseAnalyzer } from './analyzer.js';

const args = process.argv.slice(2);

// Parse CLI arguments
const options = {
  projectRoot: process.cwd(),
  outputPath: '.agentful/architecture.json',
  force: false,
  verbose: false
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];

  if (arg === '--project' && args[i + 1]) {
    options.projectRoot = args[++i];
  } else if (arg === '--output' && args[i + 1]) {
    options.outputPath = args[++i];
  } else if (arg === '--force') {
    options.force = true;
  } else if (arg === '--verbose') {
    options.verbose = true;
  } else if (arg === '--help' || arg === '-h') {
    console.log(`
Codebase Analyzer CLI

Usage:
  node lib/core/cli.js [options]

Options:
  --project <path>   Project root path (default: current directory)
  --output <path>    Output file path (default: .agentful/architecture.json)
  --force            Force re-analysis even if cache is fresh
  --verbose          Show detailed progress
  --help, -h         Show this help message

Examples:
  # Analyze current directory
  node lib/core/cli.js

  # Analyze specific project
  node lib/core/cli.js --project /path/to/project

  # Force re-analysis
  node lib/core/cli.js --force --verbose
`);
    process.exit(0);
  }
}

// Create analyzer
const analyzer = new CodebaseAnalyzer(options);

// Setup event listeners
analyzer.on('start', ({ projectRoot }) => {
  console.log(`\n🔍 Analyzing codebase: ${projectRoot}\n`);
});

analyzer.on('progress', ({ stage, progress, fileCount, count }) => {
  if (options.verbose) {
    let message = `   ${stage}: ${progress}%`;
    if (fileCount) message += ` (${fileCount} files)`;
    if (count) message += ` (${count} detected)`;
    console.log(message);
  }
});

analyzer.on('warning', ({ message }) => {
  if (options.verbose) {
    console.warn(`   ⚠️  ${message}`);
  }
});

analyzer.on('written', ({ path }) => {
  console.log(`\n✅ Analysis written to: ${path}\n`);
});

analyzer.on('complete', ({ duration, analysis }) => {
  console.log(`⏱️  Completed in ${duration}ms\n`);

  // Print summary
  console.log('📊 Summary:');
  console.log(`   Files analyzed: ${analysis.fileCount}`);
  console.log(`   Confidence: ${analysis.confidence}%`);
  console.log(`   Primary language: ${analysis.primaryLanguage || 'unknown'}`);
  console.log(`   Languages: ${analysis.languages.map(l => l.name).join(', ')}`);
  console.log(`   Frameworks: ${analysis.frameworks.map(f => f.name).join(', ') || 'none'}`);

  if (analysis.recommendations.length > 0) {
    console.log(`\n💡 Recommendations:`);
    analysis.recommendations.forEach((rec, i) => {
      console.log(`   ${i + 1}. [${rec.priority}] ${rec.message}`);
      console.log(`      → ${rec.action}`);
    });
  }

  console.log('');
});

analyzer.on('error', (error) => {
  console.error(`\n❌ Analysis failed: ${error.message}\n`);
  if (options.verbose) {
    console.error(error.stack);
  }
  process.exit(1);
});

// Run analysis
(async () => {
  try {
    if (options.force) {
      await analyzer.analyze();
    } else {
      await analyzer.analyzeWithCache();
    }
  } catch (error) {
    console.error(`\n❌ Unexpected error: ${error.message}\n`);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
})();
