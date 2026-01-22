import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CodebaseAnalyzer, analyzeCodebase } from '../../lib/core/analyzer.js';
import { validateArchitecture } from '../../lib/validation.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('CodebaseAnalyzer', () => {
  let testProjectRoot;
  const testOutputPath = '.agentful/architecture.json';

  beforeEach(async () => {
    // Create temporary directory for each test
    testProjectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'analyzer-test-'));

    // Create some test files so directory isn't empty
    await fs.writeFile(path.join(testProjectRoot, 'package.json'), JSON.stringify({
      name: 'test-project',
      version: '1.0.0',
      dependencies: {}
    }));
    await fs.writeFile(path.join(testProjectRoot, 'index.js'), '// Test file\nconsole.log("test");\n');
    await fs.writeFile(path.join(testProjectRoot, 'app.js'), 'export default function app() {}\n');
  });

  afterEach(async () => {
    // Cleanup temporary directory
    try {
      await fs.rm(testProjectRoot, { recursive: true, force: true });
    } catch (error) {
      // Ignore if directory doesn't exist
    }
  });

  describe('Basic Analysis', () => {
    it('should analyze current project', async () => {
      const analyzer = new CodebaseAnalyzer({
        projectRoot: testProjectRoot,
        outputPath: testOutputPath
      });

      const result = await analyzer.analyze();

      expect(result).toBeDefined();
      expect(result.version).toBe('1.0.0');
      expect(result.projectRoot).toBe(testProjectRoot);
      expect(result.fileCount).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(100);
    });

    it('should detect JavaScript/TypeScript', async () => {
      const result = await analyzeCodebase({
        projectRoot: testProjectRoot,
        outputPath: testOutputPath
      });

      const languages = result.languages.map(l => l.name);
      expect(languages).toContain('JavaScript');
    });

    it('should detect frameworks', async () => {
      const result = await analyzeCodebase({
        projectRoot: testProjectRoot,
        outputPath: testOutputPath
      });

      expect(result.frameworks).toBeDefined();
      expect(Array.isArray(result.frameworks)).toBe(true);
    });

    it('should detect patterns', async () => {
      const result = await analyzeCodebase({
        projectRoot: testProjectRoot,
        outputPath: testOutputPath
      });

      expect(result.patterns).toBeDefined();
      expect(result.patterns.components).toBeDefined();
      expect(result.patterns.api).toBeDefined();
      expect(result.patterns.database).toBeDefined();
      expect(result.patterns.tests).toBeDefined();
      expect(result.patterns.auth).toBeDefined();
    });

    it('should detect conventions', async () => {
      const result = await analyzeCodebase({
        projectRoot: testProjectRoot,
        outputPath: testOutputPath
      });

      expect(result.conventions).toBeDefined();
      expect(result.conventions.naming).toBeDefined();
      expect(result.conventions.fileStructure).toBeDefined();
    });
  });

  describe('Output Validation', () => {
    it('should write valid JSON to file', async () => {
      const analyzer = new CodebaseAnalyzer({
        projectRoot: testProjectRoot,
        outputPath: testOutputPath
      });

      await analyzer.analyze();

      const outputFilePath = path.join(testProjectRoot, testOutputPath);
      const content = await fs.readFile(outputFilePath, 'utf-8');
      const parsed = JSON.parse(content);

      expect(parsed).toBeDefined();
      expect(parsed.version).toBe('1.0.0');
    });

    it('should pass schema validation', async () => {
      const analyzer = new CodebaseAnalyzer({
        projectRoot: testProjectRoot,
        outputPath: testOutputPath
      });

      await analyzer.analyze();

      const outputFilePath = path.join(testProjectRoot, testOutputPath);
      const validation = validateArchitecture(outputFilePath);

      expect(validation.valid).toBe(true);
    });
  });

  describe('Events', () => {
    it('should emit start event', async () => {
      const analyzer = new CodebaseAnalyzer({
        projectRoot: testProjectRoot,
        outputPath: testOutputPath
      });

      let startEmitted = false;
      analyzer.on('start', () => {
        startEmitted = true;
      });

      await analyzer.analyze();
      expect(startEmitted).toBe(true);
    });

    it('should emit progress events', async () => {
      const analyzer = new CodebaseAnalyzer({
        projectRoot: testProjectRoot,
        outputPath: testOutputPath
      });

      const progressEvents = [];
      analyzer.on('progress', (event) => {
        progressEvents.push(event);
      });

      await analyzer.analyze();
      expect(progressEvents.length).toBeGreaterThan(0);
    });

    it('should emit complete event', async () => {
      const analyzer = new CodebaseAnalyzer({
        projectRoot: testProjectRoot,
        outputPath: testOutputPath
      });

      let completeEmitted = false;
      let duration = 0;

      analyzer.on('complete', ({ duration: d }) => {
        completeEmitted = true;
        duration = d;
      });

      await analyzer.analyze();
      expect(completeEmitted).toBe(true);
      expect(duration).toBeGreaterThan(0);
    });
  });

  describe('Caching', () => {
    it('should use cache when fresh', async () => {
      const analyzer = new CodebaseAnalyzer({
        projectRoot: testProjectRoot,
        outputPath: testOutputPath
      });

      // First analysis
      await analyzer.analyze();

      // Second analysis with cache
      const analyzer2 = new CodebaseAnalyzer({
        projectRoot: testProjectRoot,
        outputPath: testOutputPath
      });

      let cacheUsed = false;
      analyzer2.on('cached', () => {
        cacheUsed = true;
      });

      await analyzer2.analyzeWithCache();
      expect(cacheUsed).toBe(true);
    });

    it('should force re-analysis when requested', async () => {
      const analyzer = new CodebaseAnalyzer({
        projectRoot: testProjectRoot,
        outputPath: testOutputPath
      });

      // First analysis
      await analyzer.analyze();

      // Force re-analysis
      const analyzer2 = new CodebaseAnalyzer({
        projectRoot: testProjectRoot,
        outputPath: testOutputPath
      });

      let cacheUsed = false;
      analyzer2.on('cached', () => {
        cacheUsed = true;
      });

      await analyzer2.analyzeWithCache(true);
      expect(cacheUsed).toBe(false);
    });
  });

  describe('Confidence Scoring', () => {
    it('should calculate confidence score', async () => {
      const result = await analyzeCodebase({
        projectRoot: testProjectRoot,
        outputPath: testOutputPath
      });

      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(100);
    });

    it('should detect new projects with low confidence', async () => {
      const analyzer = new CodebaseAnalyzer({
        projectRoot: testProjectRoot,
        outputPath: testOutputPath
      });

      const result = await analyzer.analyze();

      if (result.fileCount < 10) {
        expect(result.isNewProject).toBe(true);
        expect(result.confidence).toBeLessThanOrEqual(50);
      }
    });
  });

  describe('Recommendations', () => {
    it('should generate recommendations', async () => {
      const result = await analyzeCodebase({
        projectRoot: testProjectRoot,
        outputPath: testOutputPath
      });

      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);

      if (result.recommendations.length > 0) {
        const rec = result.recommendations[0];
        expect(rec.type).toBeDefined();
        expect(rec.priority).toBeDefined();
        expect(rec.message).toBeDefined();
        expect(rec.action).toBeDefined();
      }
    });
  });

  describe('Performance', () => {
    it('should complete analysis in reasonable time', async () => {
      const startTime = Date.now();

      await analyzeCodebase({
        projectRoot: testProjectRoot,
        outputPath: testOutputPath
      });

      const duration = Date.now() - startTime;

      // Should complete in less than 5 seconds for this project
      expect(duration).toBeLessThan(5000);
    });
  });
});
