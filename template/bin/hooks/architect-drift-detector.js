#!/usr/bin/env node

/**
 * Architect Drift Detector Hook
 *
 * Detects when project changes require architect to re-analyze and update skills/agents.
 *
 * Triggers re-analysis when:
 * - New dependencies added (package.json, requirements.txt, go.mod, etc.)
 * - Tech stack changes (switched frameworks)
 * - New patterns emerge (5+ files violating existing conventions)
 * - Skills are stale (last analysis > 7 days old)
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
    const newLibraries = [];

    // 1. Check if NEW dependencies added (not just version bumps)
    const depChange = dependenciesChanged(arch);
    if (depChange.changed) {
      newLibraries.push(...depChange.newLibraries);
      driftReasons.push('new_libraries_added');
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
      if (isMeaningfulDrift(driftReasons, arch, newLibraries)) {
        markForReanalysis(arch, driftReasons, newLibraries);
        console.log(`⚠️  Architecture changed: ${formatDriftReasons(driftReasons, newLibraries)}`);
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
 * Returns: { changed: boolean, newLibraries: string[] }
 */
function dependenciesChanged(arch) {
  const depFiles = [
    { file: 'package.json', type: 'json', key: 'dependencies' },
    { file: 'package.json', type: 'json', key: 'devDependencies' },
    { file: 'requirements.txt', type: 'txt' },
    { file: 'pyproject.toml', type: 'toml', key: 'dependencies' },
    { file: 'Pipfile', type: 'toml', key: 'packages' },
    { file: 'go.mod', type: 'go' },
    { file: 'Gemfile', type: 'ruby' },
    { file: 'composer.json', type: 'json', key: 'require' },
    { file: 'pom.xml', type: 'xml' },
    { file: 'build.gradle', type: 'gradle' },
    { file: 'Cargo.toml', type: 'toml', key: 'dependencies' }
  ];

  const newLibraries = [];

  for (const depFile of depFiles) {
    if (!fs.existsSync(depFile.file)) continue;

    const currentHash = hashFile(depFile.file);
    const previousHash = arch.dependency_hashes?.[depFile.file];

    if (previousHash && currentHash !== previousHash) {
      // Check if NEW libraries were added (not just version bumps)
      const added = getNewLibraries(depFile.file, depFile, arch);
      if (added.length > 0) {
        newLibraries.push(...added);
      }
    }
  }

  return {
    changed: newLibraries.length > 0,
    newLibraries
  };
}

/**
 * Get list of new libraries added since last analysis
 */
function getNewLibraries(filePath, fileInfo, arch) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const previousContent = arch.previous_dependencies?.[filePath] || '';

    if (!previousContent) return []; // First time, can't determine new vs old

    // Parse current and previous dependencies
    const currentDeps = parseDependencies(content, fileInfo);
    const previousDeps = parseDependencies(previousContent, fileInfo);

    // Find libraries in current but not in previous
    const newLibs = Object.keys(currentDeps).filter(lib => !previousDeps[lib]);

    return newLibs;
  } catch (error) {
    return [];
  }
}

/**
 * Parse dependencies from various file formats
 */
function parseDependencies(content, fileInfo) {
  const deps = {};

  try {
    if (fileInfo.file === 'package.json') {
      const json = JSON.parse(content);
      const section = json[fileInfo.key] || {};
      Object.keys(section).forEach(key => {
        deps[key] = section[key];
      });
    } else if (fileInfo.file === 'requirements.txt') {
      content.split('\n').forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#')) {
          const name = line.split('==')[0].split('>=')[0].split('<=')[0].trim();
          if (name) deps[name] = line;
        }
      });
    } else if (fileInfo.file === 'go.mod') {
      const lines = content.split('\n');
      let inRequire = false;
      lines.forEach(line => {
        if (line.trim().startsWith('require (')) inRequire = true;
        else if (line.trim() === ')') inRequire = false;
        else if (inRequire || line.trim().startsWith('require ')) {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 2 && parts[0] !== 'require') {
            deps[parts[0]] = parts[1];
          }
        }
      });
    }
    // Add more formats as needed...
  } catch (error) {
    // Silently fail parsing
  }

  return deps;
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
 * - NEW libraries added (not version bumps)
 * - Tech stack fundamentally changed (switched frameworks)
 * - Significant new patterns (20%+ file growth AND 50+ new files)
 * - Stale analysis (>30 days)
 *
 * NOT meaningful:
 * - Version bumps only
 * - Small file additions
 * - Recent analysis (<30 days ago)
 */
function isMeaningfulDrift(reasons, arch, newLibraries) {
  // New libraries are ALWAYS meaningful (might create new skills/agents)
  if (reasons.includes('new_libraries_added')) {
    return true;
  }

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
function formatDriftReasons(reasons, newLibraries) {
  const labels = {
    'new_libraries_added': `new libraries: ${newLibraries.slice(0, 3).join(', ')}${newLibraries.length > 3 ? '...' : ''}`,
    'tech_stack_modified': 'tech stack changed',
    'analysis_stale': 'analysis outdated',
    'new_patterns_detected': 'new code patterns detected'
  };

  return reasons.map(r => labels[r] || r).join(', ');
}

/**
 * Mark architecture.json for re-analysis
 * Also stores current dependencies for next comparison
 */
function markForReanalysis(arch, reasons, newLibraries) {
  arch.needs_reanalysis = true;
  arch.drift_reasons = reasons;
  arch.new_libraries = newLibraries;
  arch.drift_detected_at = new Date().toISOString();

  // Store current dependencies for future comparison
  if (!arch.previous_dependencies) {
    arch.previous_dependencies = {};
  }

  const depFiles = ['package.json', 'requirements.txt', 'go.mod', 'Pipfile', 'Cargo.toml'];
  depFiles.forEach(file => {
    if (fs.existsSync(file)) {
      arch.previous_dependencies[file] = fs.readFileSync(file, 'utf8');
    }
  });

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
