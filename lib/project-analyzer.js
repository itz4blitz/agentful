#!/usr/bin/env node

/**
 * Project Analyzer Engine
 * Comprehensive project analysis for agentful initialization
 * Supports multi-language, multi-framework projects with confidence scoring
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { detectTechStack } from './tech-stack-detector.js';
import { detectDomains } from './domain-detector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache configuration
const CACHE_VERSION = '1.0';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Main project analysis function
 * @param {string} projectRoot - Root directory of the project
 * @returns {Promise<Object>} Comprehensive analysis results
 */
export async function analyzeProject(projectRoot = process.cwd()) {
  const startTime = Date.now();

  // Check for cached analysis
  const cachedAnalysis = await loadCachedAnalysis(projectRoot);
  if (cachedAnalysis) {
    return cachedAnalysis;
  }

  try {
    // Phase 1: Quick scan (determine project type and language)
    const quickScan = await performQuickScan(projectRoot);

    // Phase 2: Deep analysis (dependencies, frameworks, patterns)
    const deepAnalysis = await performDeepAnalysis(projectRoot, quickScan);

    // Phase 3: Pattern mining (code samples, conventions)
    const patternMining = await performPatternMining(projectRoot, quickScan);

    // Phase 4: Domain detection
    const domainDetection = await detectDomains(projectRoot, quickScan);

    // Combine all analysis phases
    const analysis = {
      projectRoot,
      analyzedAt: new Date().toISOString(),
      analysisDuration: Date.now() - startTime,
      cacheVersion: CACHE_VERSION,

      // Project classification
      projectType: quickScan.projectType,
      language: deepAnalysis.language,
      primaryLanguage: deepAnalysis.primaryLanguage,

      // Technology stack
      frameworks: deepAnalysis.frameworks,
      techStack: deepAnalysis.techStack,

      // Structure and organization
      structure: quickScan.structure,
      buildSystem: deepAnalysis.buildSystem,
      packageManager: deepAnalysis.packageManager,

      // Domains and features
      domains: domainDetection.detected,
      domainConfidence: domainDetection.confidence,

      // Code patterns and conventions
      patterns: patternMining.patterns,
      conventions: patternMining.conventions,

      // Samples for agent generation
      samples: patternMining.samples,

      // Metadata
      confidence: calculateOverallConfidence(quickScan, deepAnalysis, patternMining),
      warnings: generateWarnings(quickScan, deepAnalysis),
      recommendations: generateRecommendations(quickScan, deepAnalysis)
    };

    // Cache the results
    await cacheAnalysis(projectRoot, analysis);

    return analysis;
  } catch (error) {
    // Graceful error handling - return partial analysis
    return {
      projectRoot,
      analyzedAt: new Date().toISOString(),
      error: error.message,
      partial: true,
      projectType: 'unknown',
      language: 'unknown',
      frameworks: [],
      structure: 'unknown',
      domains: [],
      patterns: {},
      samples: {},
      confidence: 0,
      warnings: [`Analysis failed: ${error.message}`],
      recommendations: ['Manual analysis required']
    };
  }
}

/**
 * Phase 1: Quick scan to determine project type and basic structure
 */
async function performQuickScan(projectRoot) {
  const scan = {
    projectType: 'unknown',
    structure: 'unknown',
    sourceDirectories: [],
    hasTests: false,
    hasDocs: false,
    isMonorepo: false,
    isEmpty: false
  };

  try {
    const entries = fs.readdirSync(projectRoot, { withFileTypes: true });

    // Check if empty
    if (entries.length === 0) {
      scan.isEmpty = true;
      return scan;
    }

    // Detect source directories
    const sourceDirPatterns = [
      'src', 'app', 'lib', 'server', 'client', 'packages',
      'Controllers', 'Models', 'Views', 'Services', 'Repositories',
      'cmd', 'internal', 'pkg', 'web', 'frontend', 'backend'
    ];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const name = entry.name.toLowerCase();
        if (sourceDirPatterns.some(pattern => name === pattern.toLowerCase())) {
          scan.sourceDirectories.push(entry.name);
        }
        if (name === 'test' || name === 'tests' || name === '__tests__') {
          scan.hasTests = true;
        }
        if (name === 'docs' || name === 'documentation') {
          scan.hasDocs = true;
        }
      }
    }

    // Detect monorepo
    const monorepoIndicators = [
      'pnpm-workspace.yaml', 'turbo.json', 'nx.json',
      'lerna.json', '.gitmodules', 'workspace.json'
    ];
    scan.isMonorepo = monorepoIndicators.some(indicator =>
      fs.existsSync(path.join(projectRoot, indicator))
    );

    // Determine project type based on structure
    if (scan.sourceDirectories.length === 0) {
      scan.structure = 'flat';
    } else if (scan.sourceDirectories.includes('src')) {
      scan.structure = 'src-based';
    } else if (scan.sourceDirectories.includes('app')) {
      scan.structure = 'app-based';
    } else if (scan.isMonorepo) {
      scan.structure = 'monorepo';
    }

    // Determine project type
    const hasPackageJson = fs.existsSync(path.join(projectRoot, 'package.json'));
    const hasRequirements = fs.existsSync(path.join(projectRoot, 'requirements.txt')) ||
                           fs.existsSync(path.join(projectRoot, 'pyproject.toml'));
    const hasGoMod = fs.existsSync(path.join(projectRoot, 'go.mod'));
    const hasCargo = fs.existsSync(path.join(projectRoot, 'Cargo.toml'));
    const hasCsproj = entries.some(e => e.name.endsWith('.csproj'));
    const hasPom = fs.existsSync(path.join(projectRoot, 'pom.xml'));

    if (hasPackageJson) {
      scan.projectType = hasRequirements ? 'polyglot' : 'web-application';
    } else if (hasRequirements) {
      scan.projectType = 'python-application';
    } else if (hasGoMod) {
      scan.projectType = 'go-service';
    } else if (hasCargo) {
      scan.projectType = 'rust-application';
    } else if (hasCsproj) {
      scan.projectType = 'dotnet-application';
    } else if (hasPom) {
      scan.projectType = 'java-application';
    }

  } catch (error) {
    scan.warnings = [`Quick scan error: ${error.message}`];
  }

  return scan;
}

/**
 * Phase 2: Deep analysis of dependencies, frameworks, and build system
 */
async function performDeepAnalysis(projectRoot, quickScan) {
  const analysis = {
    language: 'unknown',
    primaryLanguage: 'unknown',
    frameworks: [],
    techStack: {},
    buildSystem: 'unknown',
    packageManager: 'unknown',
    dependencies: [],
    devDependencies: []
  };

  try {
    // Use tech stack detector for comprehensive analysis
    const techStack = await detectTechStack(projectRoot);

    analysis.language = techStack.language;
    analysis.primaryLanguage = techStack.primaryLanguage;
    analysis.frameworks = techStack.frameworks;
    analysis.techStack = techStack;
    analysis.buildSystem = techStack.buildSystem || 'unknown';
    analysis.packageManager = techStack.packageManager || 'unknown';
    analysis.dependencies = techStack.dependencies || [];
    analysis.devDependencies = techStack.devDependencies || [];

  } catch (error) {
    analysis.warnings = [`Deep analysis error: ${error.message}`];
  }

  return analysis;
}

/**
 * Phase 3: Pattern mining and code sampling
 */
async function performPatternMining(projectRoot, quickScan) {
  const mining = {
    patterns: {},
    conventions: {},
    samples: {}
  };

  try {
    // Determine source directory to sample from
    const sourceDirs = quickScan.sourceDirectories;
    const primarySourceDir = sourceDirs[0] || '.';
    const sourcePath = path.join(projectRoot, primarySourceDir);

    if (!fs.existsSync(sourcePath)) {
      mining.warnings = ['Source directory not found'];
      return mining;
    }

    // Sample files for pattern detection
    const samples = await sampleProjectFiles(sourcePath, 5);
    mining.samples = samples;

    // Detect patterns from samples
    mining.patterns = detectCodePatterns(samples);

    // Detect conventions
    mining.conventions = detectConventions(samples, quickScan);

  } catch (error) {
    mining.warnings = [`Pattern mining error: ${error.message}`];
  }

  return mining;
}

/**
 * Sample representative files from the project
 */
async function sampleProjectFiles(sourcePath, maxFiles = 5) {
  const samples = {
    controllers: [],
    models: [],
    utilities: [],
    components: [],
    configs: [],
    tests: []
  };

  try {
    // Walk the directory tree
    const walkDir = (dir, maxDepth = 3, currentDepth = 0) => {
      if (currentDepth >= maxDepth) return [];

      const results = [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Skip node_modules and similar
          if (!['node_modules', '.git', 'dist', 'build', 'target'].includes(entry.name)) {
            results.push(...walkDir(fullPath, maxDepth, currentDepth + 1));
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          const name = entry.name.toLowerCase();

          // Categorize files
          if (['.js', '.ts', '.jsx', '.tsx', '.py', '.go', '.rs', '.java', '.cs'].includes(ext)) {
            if (name.includes('controller') || name.includes('handler') || name.includes('route')) {
              samples.controllers.push(fullPath);
            } else if (name.includes('model') || name.includes('entity') || name.includes('schema')) {
              samples.models.push(fullPath);
            } else if (name.includes('util') || name.includes('helper') || name.includes('service')) {
              samples.utilities.push(fullPath);
            } else if (name.includes('component') || name.includes('view')) {
              samples.components.push(fullPath);
            } else if (name.includes('config') || name.includes('setting')) {
              samples.configs.push(fullPath);
            } else if (name.includes('test') || name.includes('spec')) {
              samples.tests.push(fullPath);
            }

            results.push(fullPath);
          }
        }
      }

      return results;
    };

    walkDir(sourcePath);

    // Read content of sampled files (limit to avoid memory issues)
    const readSamples = async (filePath) => {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const relativePath = path.relative(sourcePath, filePath);
        return {
          path: relativePath,
          absolutePath: filePath,
          content: content.length > 10000 ? content.substring(0, 10000) + '...' : content,
          extension: path.extname(filePath)
        };
      } catch (error) {
        return null;
      }
    };

    // Read up to maxFiles from each category
    const sampledFiles = {};
    for (const [category, files] of Object.entries(samples)) {
      const filesToRead = files.slice(0, Math.ceil(maxFiles / Object.keys(samples).length));
      sampledFiles[category] = (await Promise.all(filesToRead.map(readSamples))).filter(Boolean);
    }

    return sampledFiles;

  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Detect code patterns from sampled files
 */
function detectCodePatterns(samples) {
  const patterns = {
    imports: [],
    exports: [],
    styling: [],
    stateManagement: [],
    apiPatterns: [],
    testingFrameworks: []
  };

  try {
    const allFiles = Object.values(samples).flat();

    for (const sample of allFiles) {
      if (!sample || !sample.content) continue;

      const content = sample.content;
      const ext = sample.extension;

      // Detect import patterns
      if (['.js', '.ts', '.jsx', '.tsx'].includes(ext)) {
        const es6Imports = content.match(/import\s+.*?from\s+['"]/g) || [];
        patterns.imports.push(...es6Imports);

        const commonJsImports = content.match(/require\(['"]/g) || [];
        patterns.imports.push(...commonJsImports);

        // Detect exports
        const namedExports = content.match(/export\s+(const|function|class)/g) || [];
        patterns.exports.push(...namedExports);

        const defaultExports = content.match(/export\s+default/g) || [];
        patterns.exports.push(...defaultExports);
      }

      // Detect styling patterns
      if (content.includes('styled-components') || content.includes('styled')) {
        patterns.styling.push('styled-components');
      }
      if (content.includes('className') || content.includes('class=')) {
        patterns.styling.push('css-classes');
      }
      if (content.includes('@emotion') || content.includes('css`')) {
        patterns.styling.push('emotion');
      }
      if (content.includes('tailwind') || content.includes('tw-')) {
        patterns.styling.push('tailwind');
      }

      // Detect state management
      if (content.includes('useState') || content.includes('useReducer')) {
        patterns.stateManagement.push('react-hooks');
      }
      if (content.includes('createStore') || content.includes('configureStore')) {
        patterns.stateManagement.push('redux');
      }
      if (content.includes('zustand')) {
        patterns.stateManagement.push('zustand');
      }
      if (content.includes('observable') || content.includes('BehaviorSubject')) {
        patterns.stateManagement.push('rxjs');
      }

      // Detect API patterns
      if (content.includes('fetch(') || content.includes('axios.') || content.includes('axios.get')) {
        patterns.apiPatterns.push('http-client');
      }
      if (content.includes('graphql') || content.includes('gql`')) {
        patterns.apiPatterns.push('graphql');
      }
      if (content.includes('app.get') || content.includes('app.post') || content.includes('router.')) {
        patterns.apiPatterns.push('express-routes');
      }
      if (content.includes('@Get') || content.includes('@Post') || content.includes('@Controller')) {
        patterns.apiPatterns.push('nestjs-decorators');
      }

      // Detect testing frameworks
      if (content.includes('describe(') && content.includes('it(')) {
        patterns.testingFrameworks.push('jest');
      }
      if (content.includes('test(') || content.includes('describe(')) {
        patterns.testingFrameworks.push('vitest');
      }
      if (content.includes('def test_') || content.includes('class Test')) {
        patterns.testingFrameworks.push('pytest');
      }
      if (content.includes('func Test') || content.includes('t.Run(')) {
        patterns.testingFrameworks.push('go-testing');
      }
    }

    // Remove duplicates
    for (const key of Object.keys(patterns)) {
      patterns[key] = [...new Set(patterns[key])];
    }

  } catch (error) {
    patterns.error = error.message;
  }

  return patterns;
}

/**
 * Detect project conventions from samples
 */
function detectConventions(samples, quickScan) {
  const conventions = {
    naming: {},
    fileOrganization: quickScan.structure,
    importStyle: [],
    codeStyle: []
  };

  try {
    const allFiles = Object.values(samples).flat();

    for (const sample of allFiles) {
      if (!sample || !sample.content) continue;

      const content = sample.content;
      const fileName = path.basename(sample.path);

      // Detect naming conventions
      if (fileName.includes('-')) {
        conventions.naming.files = 'kebab-case';
      } else if (fileName.includes('_')) {
        conventions.naming.files = 'snake_case';
      } else if (/[A-Z]/.test(fileName[0])) {
        conventions.naming.files = 'PascalCase';
      }

      // Detect import style
      if (content.includes('import')) {
        conventions.importStyle.push('es6');
      }
      if (content.includes('require(')) {
        conventions.importStyle.push('commonjs');
      }

      // Detect code style
      if (content.includes('async') && content.includes('await')) {
        conventions.codeStyle.push('async-await');
      }
      if (content.includes('=>') || content.includes('=>')) {
        conventions.codeStyle.push('arrow-functions');
      }
      if (content.includes('class ') && content.includes('extends')) {
        conventions.codeStyle.push('class-based');
      }
      if (content.includes('function ') && !content.includes('=>')) {
        conventions.codeStyle.push('functional');
      }
    }

    // Remove duplicates
    conventions.importStyle = [...new Set(conventions.importStyle)];
    conventions.codeStyle = [...new Set(conventions.codeStyle)];

  } catch (error) {
    conventions.error = error.message;
  }

  return conventions;
}

/**
 * Calculate overall confidence score
 */
function calculateOverallConfidence(quickScan, deepAnalysis, patternMining) {
  let confidence = 0;
  let factors = 0;

  // Language detection confidence
  if (deepAnalysis.language && deepAnalysis.language !== 'unknown') {
    confidence += 0.3;
    factors++;
  }

  // Framework detection
  if (deepAnalysis.frameworks.length > 0) {
    confidence += 0.2;
    factors++;
  }

  // Structure detection
  if (quickScan.structure && quickScan.structure !== 'unknown') {
    confidence += 0.2;
    factors++;
  }

  // Pattern detection
  if (patternMining.patterns && Object.keys(patternMining.patterns).length > 0) {
    const patternCount = Object.values(patternMining.patterns)
      .filter(arr => Array.isArray(arr) && arr.length > 0).length;
    confidence += Math.min(patternCount * 0.1, 0.3);
    factors++;
  }

  return Math.min(confidence, 1.0);
}

/**
 * Generate warnings based on analysis
 */
function generateWarnings(quickScan, deepAnalysis) {
  const warnings = [];

  if (quickScan.isEmpty) {
    warnings.push('Project appears to be empty');
  }

  if (deepAnalysis.language === 'unknown') {
    warnings.push('Could not detect programming language');
  }

  if (!quickScan.hasTests) {
    warnings.push('No test directory detected');
  }

  if (quickScan.isMonorepo) {
    warnings.push('Monorepo detected - analysis may be incomplete');
  }

  return warnings;
}

/**
 * Generate recommendations based on analysis
 */
function generateRecommendations(quickScan, deepAnalysis) {
  const recommendations = [];

  if (!quickScan.hasTests) {
    recommendations.push('Consider adding test coverage');
  }

  if (!quickScan.hasDocs) {
    recommendations.push('Consider adding documentation');
  }

  if (deepAnalysis.language !== 'unknown' && deepAnalysis.frameworks.length === 0) {
    recommendations.push('No frameworks detected - may need manual configuration');
  }

  return recommendations;
}

/**
 * Load cached analysis if available and fresh
 */
async function loadCachedAnalysis(projectRoot) {
  try {
    const cachePath = path.join(projectRoot, '.agentful', 'analysis-cache.json');

    if (!fs.existsSync(cachePath)) {
      return null;
    }

    const cached = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
    const cacheAge = Date.now() - new Date(cached.analyzedAt).getTime();

    // Check if cache is still valid
    if (cacheAge < CACHE_DURATION && cached.cacheVersion === CACHE_VERSION) {
      return cached;
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Cache analysis results
 */
async function cacheAnalysis(projectRoot, analysis) {
  try {
    const agentfulDir = path.join(projectRoot, '.agentful');

    if (!fs.existsSync(agentfulDir)) {
      fs.mkdirSync(agentfulDir, { recursive: true });
    }

    const cachePath = path.join(agentfulDir, 'analysis-cache.json');
    fs.writeFileSync(cachePath, JSON.stringify(analysis, null, 2));

  } catch (error) {
    // Silent fail - caching is optional
  }
}

/**
 * Export analysis results to architecture.json
 */
export async function exportToArchitectureJson(projectRoot, analysis) {
  try {
    const agentfulDir = path.join(projectRoot, '.agentful');
    const archPath = path.join(agentfulDir, 'architecture.json');

    const architecture = {
      analysis_date: analysis.analyzedAt,
      project_type: analysis.projectType,
      detected_patterns: {
        framework: analysis.frameworks[0] || 'unknown',
        language: analysis.language,
        primary_language: analysis.primaryLanguage,
        structure: analysis.structure,
        build_system: analysis.buildSystem,
        package_manager: analysis.packageManager
      },
      tech_stack: analysis.techStack,
      domains: analysis.domains,
      patterns: analysis.patterns,
      conventions: analysis.conventions,
      generated_agents: [],
      key_conventions_discovered: analysis.conventions.codeStyle || [],
      confidence: analysis.confidence,
      warnings: analysis.warnings,
      recommendations: analysis.recommendations
    };

    fs.writeFileSync(archPath, JSON.stringify(architecture, null, 2));

    return architecture;
  } catch (error) {
    throw new Error(`Failed to export architecture.json: ${error.message}`);
  }
}
