#!/usr/bin/env node

/**
 * Test suite for the agentful Analysis Engine
 * Run with: node lib/test-analyzer.js
 */

import { analyzeProject, detectDomains, detectTechStack } from './index.js';
import path from 'path';

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, ...args) {
  console.log(color, ...args, COLORS.reset);
}

function section(title) {
  console.log('');
  log(COLORS.bright, `═══ ${title} ═══`);
  console.log('');
}

async function testTechStackDetection() {
  section('Testing Tech Stack Detection');

  try {
    const result = await detectTechStack(process.cwd());

    log(COLORS.green, '✓ Tech stack detection completed');
    console.log('');
    log(COLORS.bright, 'Results:');
    log(COLORS.cyan, `  Language:         ${result.language}`);
    log(COLORS.cyan, `  Primary Language: ${result.primaryLanguage}`);
    log(COLORS.cyan, `  Languages:        ${result.languages.join(', ') || 'none'}`);
    log(COLORS.cyan, `  Frameworks:       ${result.frameworks.join(', ') || 'none'}`);
    log(COLORS.cyan, `  Databases:        ${result.databases.join(', ') || 'none'}`);
    log(COLORS.cyan, `  Testing:          ${result.testingFrameworks.join(', ') || 'none'}`);
    log(COLORS.cyan, `  Styling:          ${result.styling.join(', ') || 'none'}`);
    log(COLORS.cyan, `  Package Manager:  ${result.packageManager}`);
    log(COLORS.cyan, `  Build System:     ${result.buildSystem}`);
    log(COLORS.cyan, `  Confidence:       ${(result.confidence * 100).toFixed(0)}%`);

    if (result.dependencies.length > 0) {
      console.log('');
      log(COLORS.dim, `  Dependencies (${result.dependencies.length}):`);
      result.dependencies.slice(0, 10).forEach(dep => {
        log(COLORS.dim, `    • ${dep}`);
      });
      if (result.dependencies.length > 10) {
        log(COLORS.dim, `    ... and ${result.dependencies.length - 10} more`);
      }
    }

    return result;
  } catch (error) {
    log(COLORS.red, `✗ Tech stack detection failed: ${error.message}`);
    return null;
  }
}

async function testDomainDetection() {
  section('Testing Domain Detection');

  try {
    const result = await detectDomains(process.cwd());

    log(COLORS.green, '✓ Domain detection completed');
    console.log('');

    if (result.detected.length > 0) {
      log(COLORS.bright, `Detected ${result.detected.length} domains:`);
      console.log('');

      result.detected.forEach((domain, index) => {
        const confidence = result.confidence[domain];
        const bar = '█'.repeat(Math.round(confidence * 20)) + '░'.repeat(20 - Math.round(confidence * 20));
        log(COLORS.cyan, `  ${index + 1}. ${domain}`);
        log(COLORS.dim, `     ${bar} ${(confidence * 100).toFixed(0)}%`);
      });

      console.log('');
      log(COLORS.dim, `Overall confidence: ${(result.totalConfidence * 100).toFixed(0)}%`);
    } else {
      log(COLORS.yellow, '⚠ No domains detected');
    }

    if (result.signals) {
      console.log('');
      log(COLORS.bright, 'Signal breakdown:');
      log(COLORS.dim, `  Structure: ${Object.keys(result.signals.structure || {}).length} matches`);
      log(COLORS.dim, `  API:       ${Object.keys(result.signals.api || {}).length} matches`);
      log(COLORS.dim, `  Schema:    ${Object.keys(result.signals.schema || {}).length} matches`);
      log(COLORS.dim, `  Modules:   ${Object.keys(result.signals.modules || {}).length} matches`);
    }

    return result;
  } catch (error) {
    log(COLORS.red, `✗ Domain detection failed: ${error.message}`);
    return null;
  }
}

async function testFullAnalysis() {
  section('Testing Full Project Analysis');

  try {
    const startTime = Date.now();
    const result = await analyzeProject(process.cwd());
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    log(COLORS.green, `✓ Full analysis completed in ${duration}s`);
    console.log('');

    log(COLORS.bright, 'Project Overview:');
    log(COLORS.cyan, `  Type:        ${result.projectType}`);
    log(COLORS.cyan, `  Language:    ${result.language}`);
    log(COLORS.cyan, `  Structure:   ${result.structure}`);
    log(COLORS.cyan, `  Confidence:  ${(result.confidence * 100).toFixed(0)}%`);

    if (result.frameworks.length > 0) {
      console.log('');
      log(COLORS.bright, 'Frameworks:');
      result.frameworks.forEach(fw => {
        log(COLORS.cyan, `  • ${fw}`);
      });
    }

    if (result.domains.length > 0) {
      console.log('');
      log(COLORS.bright, 'Business Domains:');
      result.domains.slice(0, 5).forEach((domain, i) => {
        const conf = result.domainConfidence[domain];
        log(COLORS.cyan, `  ${i + 1}. ${domain} (${(conf * 100).toFixed(0)}%)`);
      });
    }

    if (result.patterns && Object.keys(result.patterns).length > 0) {
      console.log('');
      log(COLORS.bright, 'Detected Patterns:');
      Object.entries(result.patterns).forEach(([category, patterns]) => {
        if (Array.isArray(patterns) && patterns.length > 0) {
          log(COLORS.cyan, `  ${category}:`);
          patterns.slice(0, 3).forEach(p => {
            log(COLORS.dim, `    • ${p}`);
          });
        }
      });
    }

    if (result.warnings && result.warnings.length > 0) {
      console.log('');
      log(COLORS.yellow, 'Warnings:');
      result.warnings.forEach(w => {
        log(COLORS.dim, `  ⚠ ${w}`);
      });
    }

    if (result.recommendations && result.recommendations.length > 0) {
      console.log('');
      log(COLORS.bright, 'Recommendations:');
      result.recommendations.forEach(r => {
        log(COLORS.cyan, `  • ${r}`);
      });
    }

    return result;
  } catch (error) {
    log(COLORS.red, `✗ Full analysis failed: ${error.message}`);
    console.error(error);
    return null;
  }
}

async function main() {
  console.log('');
  log(COLORS.cyan, '╔═══════════════════════════════════════════════════════════════╗');
  log(COLORS.cyan, '║         agentful Analysis Engine - Test Suite                 ║');
  log(COLORS.cyan, '╚═══════════════════════════════════════════════════════════════╝');
  console.log('');

  log(COLORS.dim, `Testing directory: ${process.cwd()}`);
  console.log('');

  // Run all tests
  await testTechStackDetection();
  await testDomainDetection();
  await testFullAnalysis();

  // Summary
  section('Test Suite Complete');
  log(COLORS.green, '✓ All tests completed successfully!');
  console.log('');
  log(COLORS.dim, 'To analyze a different project, run:');
  log(COLORS.cyan, '  node lib/test-analyzer.js');
  console.log('');
  log(COLORS.dim, 'To use in your code:');
  log(COLORS.cyan, '  import { analyzeProject } from "@itz4blitz/agentful/lib";');
  log(COLORS.cyan, '  const analysis = await analyzeProject("/path/to/project");');
  console.log('');
}

main().catch(error => {
  log(COLORS.red, `Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
