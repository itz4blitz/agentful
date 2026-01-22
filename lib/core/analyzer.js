import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';
import {
  detectLanguages,
  getPrimaryLanguage
} from './detectors/language.js';
import { detectFrameworks } from './detectors/framework.js';
import { detectPatterns } from './detectors/patterns.js';
import { detectConventions } from './detectors/conventions.js';

/**
 * Codebase Analyzer
 *
 * Analyzes project codebase to detect:
 * - Programming languages
 * - Frameworks and libraries
 * - Architecture patterns
 * - Code conventions
 * - Project structure
 *
 * Outputs structured analysis to .agentful/architecture.json
 */

/**
 * Default ignore patterns for file scanning
 */
const DEFAULT_IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  '.agentful',
  'dist',
  'build',
  'coverage',
  '.next',
  '.nuxt',
  '.vscode',
  '.idea',
  '*.log',
  '*.lock',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml'
];

/**
 * Codebase Analyzer Class
 */
export class CodebaseAnalyzer extends EventEmitter {
  constructor(options = {}) {
    super();

    this.options = {
      projectRoot: options.projectRoot || process.cwd(),
      outputPath: options.outputPath || '.agentful/architecture.json',
      ignorePatterns: options.ignorePatterns || DEFAULT_IGNORE_PATTERNS,
      maxFiles: options.maxFiles || 5000,
      timeout: options.timeout || 30000,
      ...options
    };

    this.startTime = null;
    this.analysis = null;
  }

  /**
   * Run full codebase analysis
   *
   * @returns {Promise<Object>} Analysis results
   */
  async analyze() {
    this.startTime = Date.now();
    this.emit('start', { projectRoot: this.options.projectRoot });

    try {
      // Step 1: Scan project files
      this.emit('progress', { stage: 'scanning', progress: 0 });
      const files = await this.scanFiles();
      this.emit('progress', { stage: 'scanning', progress: 100, fileCount: files.length });

      // Step 2: Detect languages
      this.emit('progress', { stage: 'languages', progress: 0 });
      const languages = await detectLanguages(files, this.options.projectRoot);
      this.emit('progress', { stage: 'languages', progress: 100, count: languages.length });

      // Step 3: Detect frameworks
      this.emit('progress', { stage: 'frameworks', progress: 0 });
      const frameworks = await detectFrameworks(files, this.options.projectRoot);
      this.emit('progress', { stage: 'frameworks', progress: 100, count: frameworks.length });

      // Step 4: Detect patterns
      this.emit('progress', { stage: 'patterns', progress: 0 });
      const patterns = await detectPatterns(files, this.options.projectRoot);
      this.emit('progress', { stage: 'patterns', progress: 100 });

      // Step 5: Detect conventions
      this.emit('progress', { stage: 'conventions', progress: 0 });
      const conventions = await detectConventions(files, this.options.projectRoot);
      this.emit('progress', { stage: 'conventions', progress: 100 });

      // Build analysis result
      this.analysis = this.buildAnalysisResult(languages, frameworks, patterns, conventions, files);

      // Step 6: Write to file
      this.emit('progress', { stage: 'writing', progress: 0 });
      await this.writeAnalysis(this.analysis);
      this.emit('progress', { stage: 'writing', progress: 100 });

      const duration = Date.now() - this.startTime;
      this.emit('complete', { duration, analysis: this.analysis });

      return this.analysis;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Scan project files
   *
   * @returns {Promise<string[]>} Array of relative file paths
   */
  async scanFiles() {
    const files = [];
    const ignorePatterns = this.options.ignorePatterns;

    const shouldIgnore = (filePath) => {
      return ignorePatterns.some(pattern => {
        if (pattern.includes('*')) {
          const regex = new RegExp(pattern.replace(/\*/g, '.*'));
          return regex.test(filePath);
        }
        return filePath.includes(pattern);
      });
    };

    const scanDir = async (dir, basePath = '') => {
      if (files.length >= this.options.maxFiles) return;

      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        // Separate directories and files
        const dirs = [];
        const fileEntries = [];

        for (const entry of entries) {
          const relativePath = path.join(basePath, entry.name);
          if (shouldIgnore(relativePath)) continue;

          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            dirs.push({ fullPath, relativePath });
          } else if (entry.isFile()) {
            fileEntries.push(relativePath);
          }
        }

        // Add files
        files.push(...fileEntries);

        if (files.length >= this.options.maxFiles) {
          this.emit('warning', {
            message: `Max file limit reached (${this.options.maxFiles})`,
            partial: true
          });
          return;
        }

        // Scan subdirectories in parallel
        if (dirs.length > 0) {
          await Promise.all(
            dirs.map(({ fullPath, relativePath }) =>
              scanDir(fullPath, relativePath)
            )
          );
        }
      } catch (error) {
        // Skip directories we can't read
        this.emit('warning', {
          message: `Cannot read directory: ${dir}`,
          error: error.message
        });
      }
    };

    await scanDir(this.options.projectRoot);

    return files;
  }

  /**
   * Build structured analysis result
   *
   * @param {Object[]} languages - Detected languages
   * @param {Object[]} frameworks - Detected frameworks
   * @param {Object} patterns - Detected patterns
   * @param {Object} conventions - Detected conventions
   * @param {string[]} files - Scanned files
   * @returns {Object} Structured analysis result
   */
  buildAnalysisResult(languages, frameworks, patterns, conventions, files) {
    const primaryLanguage = getPrimaryLanguage(languages);
    const isNewProject = files.length < 10;

    // Calculate overall confidence score
    const confidence = this.calculateConfidence(languages, frameworks, patterns, isNewProject);

    return {
      version: '1.0.0',
      analyzedAt: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      projectRoot: this.options.projectRoot,
      fileCount: files.length,
      isNewProject,
      confidence,

      languages: languages.map(lang => ({
        name: lang.name,
        confidence: lang.confidence,
        files: lang.files,
        percentage: lang.percentage,
        extensions: lang.extensions
      })),

      primaryLanguage: primaryLanguage ? primaryLanguage.name : null,

      frameworks: frameworks.map(fw => ({
        name: fw.name,
        version: fw.version || 'unknown',
        type: fw.type,
        category: fw.category,
        confidence: fw.confidence,
        source: fw.source
      })),

      patterns: {
        components: patterns.components || { detected: false },
        api: patterns.api || { detected: false },
        database: patterns.database || { detected: false },
        tests: patterns.tests || { detected: false },
        auth: patterns.auth || { detected: false }
      },

      conventions: {
        naming: conventions.naming,
        namingConfidence: conventions.namingConfidence,
        fileStructure: conventions.fileStructure,
        structureConfidence: conventions.structureConfidence,
        codeStyle: conventions.codeStyle,
        importStyle: conventions.importStyle,
        linting: conventions.linting
      },

      recommendations: this.generateRecommendations(
        languages,
        frameworks,
        patterns,
        isNewProject,
        confidence
      )
    };
  }

  /**
   * Calculate overall confidence score
   *
   * @param {Object[]} languages - Detected languages
   * @param {Object[]} frameworks - Detected frameworks
   * @param {Object} patterns - Detected patterns
   * @param {boolean} isNewProject - Whether this is a new project
   * @returns {number} Confidence score 0-100
   */
  calculateConfidence(languages, frameworks, patterns, isNewProject) {
    if (isNewProject) {
      // New projects have low confidence by design
      return 30;
    }

    let score = 0;

    // Language detection confidence (40 points max)
    if (languages.length > 0) {
      const avgLangConfidence = languages.reduce((sum, l) => sum + l.confidence, 0) / languages.length;
      score += (avgLangConfidence / 100) * 40;
    }

    // Framework detection confidence (30 points max)
    if (frameworks.length > 0) {
      const avgFwConfidence = frameworks.reduce((sum, f) => sum + f.confidence, 0) / frameworks.length;
      score += (avgFwConfidence / 100) * 30;
    }

    // Pattern detection confidence (30 points max)
    const detectedPatterns = Object.values(patterns).filter(p => p.detected).length;
    const totalPatterns = Object.keys(patterns).length;
    score += (detectedPatterns / totalPatterns) * 30;

    return Math.round(score);
  }

  /**
   * Generate recommendations based on analysis
   *
   * @param {Object[]} languages - Detected languages
   * @param {Object[]} frameworks - Detected frameworks
   * @param {Object} patterns - Detected patterns
   * @param {boolean} isNewProject - Whether this is a new project
   * @param {number} confidence - Overall confidence score
   * @returns {Object[]} Array of recommendations
   */
  generateRecommendations(languages, frameworks, patterns, isNewProject, confidence) {
    const recommendations = [];

    // Low confidence warning
    if (confidence < 50) {
      recommendations.push({
        type: 'warning',
        priority: 'high',
        message: 'Low detection confidence. Consider manually specifying tech stack in product spec.',
        action: 'Add explicit tech stack section to .claude/product/index.md'
      });
    }

    // New project recommendations
    if (isNewProject) {
      recommendations.push({
        type: 'info',
        priority: 'medium',
        message: 'New project detected. Analyzer will use default configurations.',
        action: 'Continue with /agentful-start to generate specialized agents'
      });
    }

    // No tests detected
    if (!patterns.tests || !patterns.tests.detected) {
      recommendations.push({
        type: 'suggestion',
        priority: 'medium',
        message: 'No test files detected. Consider setting up testing framework.',
        action: 'Add vitest, jest, or other testing framework'
      });
    }

    // No linting detected
    if (!patterns.tests?.detected) {
      recommendations.push({
        type: 'suggestion',
        priority: 'low',
        message: 'No linting configuration detected.',
        action: 'Consider adding ESLint and Prettier for code quality'
      });
    }

    // Multiple languages with similar confidence
    if (languages.length > 1) {
      const topTwo = languages.slice(0, 2);
      const diff = topTwo[0].confidence - topTwo[1].confidence;
      if (diff < 10) {
        recommendations.push({
          type: 'info',
          priority: 'low',
          message: `Multiple primary languages detected: ${topTwo.map(l => l.name).join(', ')}`,
          action: 'Agents will be generated for both languages'
        });
      }
    }

    return recommendations;
  }

  /**
   * Write analysis to file
   *
   * @param {Object} analysis - Analysis results
   * @returns {Promise<void>}
   */
  async writeAnalysis(analysis) {
    const outputPath = path.join(this.options.projectRoot, this.options.outputPath);
    const outputDir = path.dirname(outputPath);

    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    // Write analysis with pretty formatting
    await fs.writeFile(outputPath, JSON.stringify(analysis, null, 2), 'utf-8');

    this.emit('written', { path: outputPath });
  }

  /**
   * Read existing analysis from file
   *
   * @returns {Promise<Object|null>} Existing analysis or null if not found
   */
  async readExistingAnalysis() {
    const outputPath = path.join(this.options.projectRoot, this.options.outputPath);

    try {
      const content = await fs.readFile(outputPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if analysis is stale (older than 24 hours or file count changed significantly)
   *
   * @param {Object} existingAnalysis - Existing analysis to check
   * @returns {Promise<boolean>} True if stale, false if fresh
   */
  async isAnalysisStale(existingAnalysis) {
    if (!existingAnalysis) return true;

    // Check age (24 hours)
    const age = Date.now() - new Date(existingAnalysis.analyzedAt).getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    if (age > maxAge) return true;

    // Check if file count changed significantly (>10%)
    const currentFiles = await this.scanFiles();
    const fileCountDiff = Math.abs(currentFiles.length - existingAnalysis.fileCount);
    const fileCountChangePercent = (fileCountDiff / existingAnalysis.fileCount) * 100;
    if (fileCountChangePercent > 10) return true;

    return false;
  }

  /**
   * Analyze with caching - only re-analyze if stale
   *
   * @param {boolean} force - Force re-analysis even if fresh
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeWithCache(force = false) {
    if (!force) {
      const existing = await this.readExistingAnalysis();
      if (existing) {
        const isStale = await this.isAnalysisStale(existing);
        if (!isStale) {
          this.emit('cached', { analysis: existing });
          return existing;
        }
      }
    }

    return this.analyze();
  }
}

/**
 * Create analyzer instance
 *
 * @param {Object} options - Analyzer options
 * @returns {CodebaseAnalyzer} Analyzer instance
 */
export function createAnalyzer(options = {}) {
  return new CodebaseAnalyzer(options);
}

/**
 * Quick analyze function - analyze and return results
 *
 * @param {Object} options - Analyzer options
 * @returns {Promise<Object>} Analysis results
 */
export async function analyzeCodebase(options = {}) {
  const analyzer = new CodebaseAnalyzer(options);
  return analyzer.analyze();
}

/**
 * Analyze with progress logging
 *
 * @param {Object} options - Analyzer options
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} Analysis results
 */
export async function analyzeWithProgress(options = {}, onProgress = null) {
  const analyzer = new CodebaseAnalyzer(options);

  if (onProgress) {
    analyzer.on('progress', onProgress);
  }

  return analyzer.analyze();
}

export default {
  CodebaseAnalyzer,
  createAnalyzer,
  analyzeCodebase,
  analyzeWithProgress
};
