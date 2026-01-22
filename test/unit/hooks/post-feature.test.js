import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateFeatureCompletion } from '../../../bin/hooks/post-feature.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..', '..', '..');
const completionFile = path.join(projectRoot, '.agentful', 'completion.json');
const metricsFile = path.join(projectRoot, '.agentful', 'agent-metrics.json');

describe('post-feature hook', () => {
  beforeEach(() => {
    // Clean up test files
    if (fs.existsSync(completionFile)) {
      fs.unlinkSync(completionFile);
    }
    if (fs.existsSync(metricsFile)) {
      fs.unlinkSync(metricsFile);
    }

    // Ensure .agentful directory exists
    const agentfulDir = path.join(projectRoot, '.agentful');
    if (!fs.existsSync(agentfulDir)) {
      fs.mkdirSync(agentfulDir, { recursive: true });
    }

    // Mock console.log to suppress output during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(completionFile)) {
      fs.unlinkSync(completionFile);
    }
    if (fs.existsSync(metricsFile)) {
      fs.unlinkSync(metricsFile);
    }

    // Restore console
    vi.restoreAllMocks();
  });

  describe('Feature Detection', () => {
    it('should return success when feature is not provided', () => {
      const result = validateFeatureCompletion('');
      expect(result.errors).toBe(0);
      expect(result.exitCode).toBe(0);
      expect(result.validationResults).toEqual([]);
    });

    it('should return success when feature is undefined', () => {
      const result = validateFeatureCompletion();
      expect(result.errors).toBe(0);
      expect(result.exitCode).toBe(0);
    });

    it('should process when feature is provided', () => {
      const result = validateFeatureCompletion('test-feature');
      expect(result.validationResults.length).toBe(4);
    });
  });

  describe('completion.json Updates', () => {
    beforeEach(() => {
      // Create initial completion.json
      const initialCompletion = {
        agents: {},
        skills: {}
      };
      fs.writeFileSync(completionFile, JSON.stringify(initialCompletion, null, 2));
    });

    it('should create hierarchical structure with domain', () => {
      validateFeatureCompletion('user-auth', 'authentication');

      expect(fs.existsSync(completionFile)).toBe(true);
      const completion = JSON.parse(fs.readFileSync(completionFile, 'utf8'));

      expect(completion.domains).toBeDefined();
      expect(completion.domains.authentication).toBeDefined();
      expect(completion.domains.authentication.features).toBeDefined();
      expect(completion.domains.authentication.features['user-auth']).toBeDefined();

      const validation = completion.domains.authentication.features['user-auth'].validation;
      expect(validation.status).toMatch(/passed|failed/);
      expect(validation.timestamp).toBeDefined();
      expect(typeof validation.errors).toBe('number');
      expect(Array.isArray(validation.results)).toBe(true);
      expect(validation.results.length).toBe(4);
    });

    it('should create flat structure without domain', () => {
      validateFeatureCompletion('search-feature');

      expect(fs.existsSync(completionFile)).toBe(true);
      const completion = JSON.parse(fs.readFileSync(completionFile, 'utf8'));

      expect(completion.features).toBeDefined();
      expect(completion.features['search-feature']).toBeDefined();

      const validation = completion.features['search-feature'].validation;
      expect(validation.status).toMatch(/passed|failed/);
      expect(validation.timestamp).toBeDefined();
      expect(typeof validation.errors).toBe('number');
      expect(Array.isArray(validation.results)).toBe(true);
    });

    it('should update existing hierarchical structure', () => {
      // Create existing structure
      const existingCompletion = {
        agents: {},
        skills: {},
        domains: {
          authentication: {
            features: {
              'user-login': {
                validation: {
                  status: 'passed',
                  timestamp: '2026-01-19T10:00:00.000Z',
                  errors: 0,
                  results: ['tests:pass']
                }
              }
            }
          }
        }
      };
      fs.writeFileSync(completionFile, JSON.stringify(existingCompletion, null, 2));

      validateFeatureCompletion('user-auth', 'authentication');

      const completion = JSON.parse(fs.readFileSync(completionFile, 'utf8'));
      expect(completion.domains.authentication.features['user-login']).toBeDefined();
      expect(completion.domains.authentication.features['user-auth']).toBeDefined();
    });

    it('should handle missing completion.json gracefully', () => {
      // Delete completion.json
      if (fs.existsSync(completionFile)) {
        fs.unlinkSync(completionFile);
      }

      const result = validateFeatureCompletion('test-feature');
      // Should not crash, just continue
      expect(result.validationResults.length).toBe(4);
    });

    it('should handle invalid JSON gracefully', () => {
      // Write invalid JSON
      fs.writeFileSync(completionFile, 'invalid json {');

      const result = validateFeatureCompletion('test-feature');
      // Should not crash
      expect(result.validationResults.length).toBe(4);
    });
  });

  describe('Metrics Tracking', () => {
    beforeEach(() => {
      // Create initial metrics file
      const initialMetrics = {
        feature_hooks: []
      };
      fs.writeFileSync(metricsFile, JSON.stringify(initialMetrics, null, 2));
    });

    it('should append to existing metrics', () => {
      const existingMetrics = {
        feature_hooks: [
          {
            hook: 'PreFeature',
            feature: 'old-feature',
            domain: 'old-domain',
            timestamp: '2026-01-19T10:00:00.000Z',
            result: 'passed'
          }
        ]
      };
      fs.writeFileSync(metricsFile, JSON.stringify(existingMetrics, null, 2));

      validateFeatureCompletion('test-feature', 'testing');

      const metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
      expect(metrics.feature_hooks.length).toBeGreaterThan(1);
      const lastEntry = metrics.feature_hooks[metrics.feature_hooks.length - 1];
      expect(lastEntry.hook).toBe('PostFeature');
      expect(lastEntry.feature).toBe('test-feature');
      expect(lastEntry.domain).toBe('testing');
      expect(lastEntry.result).toMatch(/passed|failed/);
    });

    it('should create feature_hooks array if it does not exist', () => {
      fs.writeFileSync(metricsFile, JSON.stringify({ some_other_data: 'value' }, null, 2));

      validateFeatureCompletion('test-feature');

      const metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
      expect(Array.isArray(metrics.feature_hooks)).toBe(true);
      expect(metrics.feature_hooks.length).toBeGreaterThan(0);
      expect(metrics.feature_hooks[0].hook).toBe('PostFeature');
    });

    it('should handle missing metrics file gracefully', () => {
      // Delete metrics file
      if (fs.existsSync(metricsFile)) {
        fs.unlinkSync(metricsFile);
      }

      const result = validateFeatureCompletion('test-feature');
      // Should not crash
      expect(result.validationResults.length).toBe(4);
    });

    it('should handle invalid metrics JSON gracefully', () => {
      fs.writeFileSync(metricsFile, 'invalid json {');

      const result = validateFeatureCompletion('test-feature');
      // Should not crash
      expect(result.validationResults.length).toBe(4);
    });
  });

  describe('Validation Results', () => {
    beforeEach(() => {
      const initialCompletion = {
        agents: {},
        skills: {}
      };
      fs.writeFileSync(completionFile, JSON.stringify(initialCompletion, null, 2));
    });

    it('should record all validation results', () => {
      validateFeatureCompletion('test-feature');

      const completion = JSON.parse(fs.readFileSync(completionFile, 'utf8'));
      const validation = completion.features['test-feature'].validation;

      expect(Array.isArray(validation.results)).toBe(true);
      expect(validation.results.length).toBe(4);

      // Should contain status for each gate
      expect(validation.results.some(r => r.startsWith('tests:'))).toBe(true);
      expect(validation.results.some(r => r.startsWith('types:'))).toBe(true);
      expect(validation.results.some(r => r.startsWith('lint:'))).toBe(true);
      expect(validation.results.some(r => r.startsWith('coverage:'))).toBe(true);
    });

    it('should return proper exit codes', () => {
      const result = validateFeatureCompletion('test-feature');
      expect([0, 1]).toContain(result.exitCode);
      expect(typeof result.errors).toBe('number');
    });
  });
});
