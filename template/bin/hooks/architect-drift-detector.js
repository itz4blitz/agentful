#!/usr/bin/env node

/**
 * Architect Drift Detector Hook
 *
 * Intelligently detects when project changes require architect re-analysis.
 *
 * Triggers re-analysis ONLY when:
 * - Tech stack fundamentally changed (switched frameworks)
 * - Significant new patterns (20%+ file growth AND 50+ new files)
 * - Analysis is very stale (>30 days old)
 *
 * Does NOT trigger on:
 * - Minor dependency updates (version bumps)
 * - Small file additions
 * - Recent analysis (<30 days ago)
 *
 * Run: After any Write/Edit operation by agents
 * Action: Updates .agentful/architecture.json with needs_reanalysis: true
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const ARCHITECTURE_FILE = '.agentful/architecture.json';
const STALE_THRESHOLD_DAYS = 7;

/**
 * Detect if architect needs to re-run
 */
function detectArchitectDrift() {
  try {
    // Load current architecture analysis
    const arch = loadArchitecture();

    // Check various drift indicators
    const driftReasons = [];

    // 1. Check if dependency files changed
    if (dependenciesChanged(arch)) {
      driftReasons.push('dependencies_changed');
    }

    // 2. Check if tech stack files modified
    if (techStackFilesModified(arch)) {
      driftReasons.push('tech_stack_modified');
    }

    // 3. Check if analysis is stale
    if (analysisIsStale(arch)) {
      driftReasons.push('analysis_stale');
    }

    // 4. Check if new patterns emerged (heuristic: lots of new files)
    if (newPatternsDetected(arch)) {
      driftReasons.push('new_patterns_detected');
    }

    // If drift detected, evaluate if it's meaningful
    if (driftReasons.length > 0) {
      // Only trigger if the drift is significant
      if (isMeaningfulDrift(driftReasons, arch)) {
        markForReanalysis(arch, driftReasons);
        console.log(`⚠️  Architecture changed: ${formatDriftReasons(driftReasons)}`);
        console.log('   Run /agentful-generate to update skills and agents');
        return true;
      }
    }

    return false;
  } catch (error) {
    // Fail silently - don't block operations if architecture.json missing
    return false;
  }
}

/**
 * Load architecture.json
 */
function loadArchitecture() {
  if (!fs.existsSync(ARCHITECTURE_FILE)) {
    // First run - architect hasn't analyzed yet
    return {
      last_analysis: null,
      dependency_hashes: {},
      file_count: 0,
      needs_reanalysis: true
    };
  }

  return JSON.parse(fs.readFileSync(ARCHITECTURE_FILE, 'utf8'));
}

/**
 * Check if dependency files changed
 */
function dependenciesChanged(arch) {
  const depFiles = [
    'package.json',
    'package-lock.json',
    'requirements.txt',
    'pyproject.toml',
    'Pipfile',
    'go.mod',
    'go.sum',
    'Gemfile',
    'Gemfile.lock',
    'composer.json',
    'pom.xml',
    'build.gradle',
    'Cargo.toml'
  ];

  for (const file of depFiles) {
    if (!fs.existsSync(file)) continue;

    const currentHash = hashFile(file);
    const previousHash = arch.dependency_hashes?.[file];

    if (previousHash && currentHash !== previousHash) {
      return true;
    }
  }

  return false;
}

/**
 * Check if tech stack config files modified
 */
function techStackFilesModified(arch) {
  const configFiles = [
    'tsconfig.json',
    'next.config.js',
    'vite.config.js',
    'webpack.config.js',
    'django/settings.py',
    'config/application.rb',
    'nest-cli.json'
  ];

  for (const file of configFiles) {
    if (!fs.existsSync(file)) continue;

    const currentHash = hashFile(file);
    const previousHash = arch.dependency_hashes?.[file];

    if (previousHash && currentHash !== previousHash) {
      return true;
    }
  }

  return false;
}

/**
 * Check if analysis is stale (>7 days old)
 */
function analysisIsStale(arch) {
  if (!arch.last_analysis) return true;

  const lastAnalysis = new Date(arch.last_analysis);
  const daysSinceAnalysis = (Date.now() - lastAnalysis.getTime()) / (1000 * 60 * 60 * 24);

  return daysSinceAnalysis > STALE_THRESHOLD_DAYS;
}

/**
 * Heuristic: Check if significant new code added (potential new patterns)
 */
function newPatternsDetected(arch) {
  // Count current files in src/
  const currentFileCount = countSourceFiles();
  const previousFileCount = arch.file_count || 0;

  // If 20% more files added, might have new patterns
  const growthRatio = (currentFileCount - previousFileCount) / Math.max(previousFileCount, 1);

  return growthRatio > 0.2;
}

/**
 * Count source files
 */
function countSourceFiles() {
  const srcDirs = ['src', 'app', 'lib', 'pages', 'components'];
  let count = 0;

  for (const dir of srcDirs) {
    if (fs.existsSync(dir)) {
      count += countFilesRecursive(dir);
    }
  }

  return count;
}

/**
 * Count files recursively
 */
function countFilesRecursive(dir) {
  let count = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    if (entry.name === 'node_modules') continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      count += countFilesRecursive(fullPath);
    } else if (entry.isFile()) {
      count++;
    }
  }

  return count;
}

/**
 * Hash a file
 */
function hashFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Determine if drift is meaningful enough to trigger re-analysis
 *
 * Meaningful changes:
 * - New tech stack files (switched frameworks)
 * - Significant new patterns (20%+ file growth AND 50+ new files)
 * - Stale analysis (>30 days)
 *
 * NOT meaningful:
 * - Minor dependency updates (version bumps)
 * - Small file additions
 * - Recent analysis (<7 days ago)
 */
function isMeaningfulDrift(reasons, arch) {
  // If analysis is stale (>30 days), any drift is meaningful
  if (analysisIsStale(arch)) {
    const daysSinceAnalysis = getDaysSinceAnalysis(arch);
    if (daysSinceAnalysis > 30) {
      return true;
    }
  }

  // Tech stack changes are always meaningful
  if (reasons.includes('tech_stack_modified')) {
    return true;
  }

  // New patterns are meaningful if significant growth
  if (reasons.includes('new_patterns_detected')) {
    const currentFileCount = countSourceFiles();
    const previousFileCount = arch.file_count || 0;
    const growthRatio = (currentFileCount - previousFileCount) / Math.max(previousFileCount, 1);

    // Only if >20% growth AND at least 50 new files
    const newFileCount = currentFileCount - previousFileCount;
    if (growthRatio > 0.2 && newFileCount > 50) {
      return true;
    }
  }

  // Dependency changes alone are NOT meaningful
  // (version bumps, new libraries don't require architect re-run)
  if (reasons.includes('dependencies_changed') && reasons.length === 1) {
    return false;
  }

  // Combination of factors might be meaningful
  return false;
}

/**
 * Get days since last analysis
 */
function getDaysSinceAnalysis(arch) {
  if (!arch.last_analysis) return 999;

  const lastAnalysis = new Date(arch.last_analysis);
  return (Date.now() - lastAnalysis.getTime()) / (1000 * 60 * 60 * 24);
}

/**
 * Format drift reasons for display
 */
function formatDriftReasons(reasons) {
  const labels = {
    'dependencies_changed': 'dependencies updated',
    'tech_stack_modified': 'tech stack changed',
    'analysis_stale': 'analysis outdated',
    'new_patterns_detected': 'new code patterns detected'
  };

  return reasons.map(r => labels[r] || r).join(', ');
}

/**
 * Mark architecture.json for re-analysis
 */
function markForReanalysis(arch, reasons) {
  arch.needs_reanalysis = true;
  arch.drift_reasons = reasons;
  arch.drift_detected_at = new Date().toISOString();

  // Ensure directory exists
  const dir = path.dirname(ARCHITECTURE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(ARCHITECTURE_FILE, JSON.stringify(arch, null, 2));
}

// Run detection
const driftDetected = detectArchitectDrift();
process.exit(driftDetected ? 1 : 0);
