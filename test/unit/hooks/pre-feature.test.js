import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import { validateFeatureReadiness } from '../../../bin/hooks/pre-feature.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('Pre-Feature Hook', () => {
  let testDir;
  let originalCwd;

  beforeEach(() => {
    // Create a unique temporary directory for each test
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agentful-test-'));
    originalCwd = process.cwd();
    process.chdir(testDir);

    // Mock console to suppress output during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original working directory
    process.chdir(originalCwd);

    // Cleanup test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }

    // Restore console
    vi.restoreAllMocks();
  });

  const setupTestDir = (options = {}) => {
    const {
      createFeature = false,
      featureName = 'test-feature',
      domainName = null,
      createCompletion = false,
      completionContent = {},
      createDecisions = false,
      decisionsContent = [],
      createArchitecture = false,
      architectureContent = {},
      createAgents = []
    } = options;

    // Create .agentful directory
    const agentfulDir = path.join(testDir, '.agentful');
    fs.mkdirSync(agentfulDir, { recursive: true });

    if (createCompletion) {
      fs.writeFileSync(
        path.join(agentfulDir, 'completion.json'),
        JSON.stringify(completionContent, null, 2),
        'utf-8'
      );
    }

    if (createDecisions) {
      fs.writeFileSync(
        path.join(agentfulDir, 'decisions.json'),
        JSON.stringify(decisionsContent, null, 2),
        'utf-8'
      );
    }

    if (createArchitecture) {
      fs.writeFileSync(
        path.join(agentfulDir, 'architecture.json'),
        JSON.stringify(architectureContent, null, 2),
        'utf-8'
      );
    }

    // Create feature files
    if (createFeature) {
      if (domainName) {
        // Hierarchical structure
        const featureDir = path.join(testDir, '.claude', 'product', 'domains', domainName, 'features');
        fs.mkdirSync(featureDir, { recursive: true });
        fs.writeFileSync(path.join(featureDir, `${featureName}.md`), '# Test Feature', 'utf-8');
      } else {
        // Flat structure
        const featureDir = path.join(testDir, '.claude', 'product', 'features');
        fs.mkdirSync(featureDir, { recursive: true });
        fs.writeFileSync(path.join(featureDir, `${featureName}.md`), '# Test Feature', 'utf-8');
      }
    }

    // Create agent files
    if (createAgents.length > 0) {
      const agentsDir = path.join(testDir, '.claude', 'agents');
      fs.mkdirSync(agentsDir, { recursive: true });
      for (const agent of createAgents) {
        fs.writeFileSync(path.join(agentsDir, `${agent}.md`), `# ${agent} Agent`, 'utf-8');
      }
    }
  };

  describe('No feature specified', () => {
    it('should return success when feature is empty', () => {
      const result = validateFeatureReadiness('');
      expect(result.errors).toBe(0);
      expect(result.exitCode).toBe(0);
    });

    it('should return success when feature is undefined', () => {
      const result = validateFeatureReadiness();
      expect(result.errors).toBe(0);
      expect(result.exitCode).toBe(0);
    });
  });

  describe('Feature file checks', () => {
    it('should error when feature file does not exist in flat structure', () => {
      setupTestDir({ createCompletion: true });
      const result = validateFeatureReadiness('nonexistent');
      expect(result.errors).toBeGreaterThan(0);
      expect(result.exitCode).toBe(1);
    });

    it('should pass when feature file exists in flat structure', () => {
      setupTestDir({
        createFeature: true,
        featureName: 'login',
        createCompletion: true
      });
      const result = validateFeatureReadiness('login');
      expect(result.errors).toBe(0);
      expect(result.exitCode).toBe(0);
    });

    it('should error when feature file does not exist in hierarchical structure', () => {
      setupTestDir({ createCompletion: true });
      const result = validateFeatureReadiness('auth', 'security');
      expect(result.errors).toBeGreaterThan(0);
      expect(result.exitCode).toBe(1);
    });

    it('should pass when feature file exists in hierarchical structure', () => {
      setupTestDir({
        createFeature: true,
        featureName: 'auth',
        domainName: 'security',
        createCompletion: true
      });
      const result = validateFeatureReadiness('auth', 'security');
      expect(result.errors).toBe(0);
      expect(result.exitCode).toBe(0);
    });
  });

  describe('completion.json checks', () => {
    it('should error when completion.json does not exist', () => {
      setupTestDir({ createFeature: true });
      const result = validateFeatureReadiness('test-feature');
      expect(result.errors).toBeGreaterThan(0);
      expect(result.exitCode).toBe(1);
    });

    it('should pass when completion.json exists', () => {
      setupTestDir({
        createFeature: true,
        createCompletion: true
      });
      const result = validateFeatureReadiness('test-feature');
      expect(result.errors).toBe(0);
      expect(result.exitCode).toBe(0);
    });

    it('should error when domain is blocked', () => {
      setupTestDir({
        createFeature: true,
        featureName: 'feature1',
        domainName: 'auth',
        createCompletion: true,
        completionContent: {
          domains: {
            auth: {
              status: 'blocked'
            }
          }
        }
      });
      const result = validateFeatureReadiness('feature1', 'auth');
      expect(result.errors).toBeGreaterThan(0);
      expect(result.exitCode).toBe(1);
    });
  });

  describe('Blocking decisions checks', () => {
    it('should error when feature is blocked by decisions', () => {
      setupTestDir({
        createFeature: true,
        featureName: 'login',
        createCompletion: true,
        createDecisions: true,
        decisionsContent: {
          pending: [
            {
              id: 'decision-1',
              blocking: ['login']
            }
          ]
        }
      });
      const result = validateFeatureReadiness('login');
      expect(result.errors).toBeGreaterThan(0);
      expect(result.exitCode).toBe(1);
    });

    it('should pass when feature not blocked', () => {
      setupTestDir({
        createFeature: true,
        featureName: 'login',
        createCompletion: true,
        createDecisions: true,
        decisionsContent: {
          pending: []
        }
      });
      const result = validateFeatureReadiness('login');
      expect(result.errors).toBe(0);
      expect(result.exitCode).toBe(0);
    });

    it('should error when hierarchical feature is blocked', () => {
      setupTestDir({
        createFeature: true,
        featureName: 'auth',
        domainName: 'security',
        createCompletion: true,
        createDecisions: true,
        decisionsContent: {
          pending: [
            {
              id: 'decision-1',
              blocking: ['security/auth']
            }
          ]
        }
      });
      const result = validateFeatureReadiness('auth', 'security');
      expect(result.errors).toBeGreaterThan(0);
      expect(result.exitCode).toBe(1);
    });
  });

  describe('Architecture checks', () => {
    it('should warn when tech stack not analyzed', () => {
      setupTestDir({
        createFeature: true,
        createCompletion: true,
        createArchitecture: true,
        architectureContent: {
          techStack: null
        }
      });
      const result = validateFeatureReadiness('test-feature');
      expect(result.errors).toBe(0);
      expect(result.warnings).toBeGreaterThan(0);
      expect(result.exitCode).toBe(0);
    });

    it('should pass when tech stack analyzed', () => {
      setupTestDir({
        createFeature: true,
        createCompletion: true,
        createArchitecture: true,
        architectureContent: {
          techStack: { language: 'javascript' }
        }
      });
      const result = validateFeatureReadiness('test-feature');
      expect(result.errors).toBe(0);
      expect(result.exitCode).toBe(0);
    });
  });

  describe('Agent checks', () => {
    it('should warn when core agents missing', () => {
      setupTestDir({
        createFeature: true,
        createCompletion: true
      });
      const result = validateFeatureReadiness('test-feature');
      expect(result.errors).toBe(0);
      expect(result.warnings).toBeGreaterThan(0);
      expect(result.exitCode).toBe(0);
    });

    it('should not warn when all core agents exist', () => {
      setupTestDir({
        createFeature: true,
        createCompletion: true,
        createAgents: ['backend', 'frontend', 'tester', 'reviewer']
      });
      const result = validateFeatureReadiness('test-feature');
      expect(result.errors).toBe(0);
      expect(result.warnings).toBe(0);
      expect(result.exitCode).toBe(0);
    });
  });

  describe('Return values', () => {
    it('should return proper structure with errors and warnings', () => {
      setupTestDir({
        createFeature: true,
        createCompletion: true
      });
      const result = validateFeatureReadiness('test-feature');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('exitCode');
      expect(typeof result.errors).toBe('number');
      expect(typeof result.warnings).toBe('number');
      expect(typeof result.exitCode).toBe('number');
    });
  });
});
