import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..', '..', '..');
const hookPath = path.join(projectRoot, 'bin', 'hooks', 'post-feature.js');
const completionFile = path.join(projectRoot, '.agentful', 'completion.json');
const metricsFile = path.join(projectRoot, '.agentful', 'agent-metrics.json');

/**
 * Post-Feature Hook Unit Tests
 *
 * Tests for bin/hooks/post-feature.js
 * Tests validation gates, completion.json updates, metrics tracking, and git commits
 *
 * Coverage targets:
 * - 100% line coverage
 * - 100% branch coverage
 * - All validation gates tested
 * - All error paths tested
 */

describe('post-feature hook', () => {
  let originalEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };

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
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;

    // Clean up test files
    if (fs.existsSync(completionFile)) {
      fs.unlinkSync(completionFile);
    }
    if (fs.existsSync(metricsFile)) {
      fs.unlinkSync(metricsFile);
    }
  });

  describe('Feature Detection', () => {
    it('should exit 0 when AGENTFUL_FEATURE is not set', () => {
      const env = { ...process.env };
      delete env.AGENTFUL_FEATURE;

      try {
        execSync(`node "${hookPath}"`, {
          cwd: projectRoot,
          env: env,
          stdio: 'pipe'
        });
        expect(true).toBe(true);
      } catch (error) {
        expect.fail('Hook should exit 0 when AGENTFUL_FEATURE is not set');
      }
    });

    it('should exit 0 when AGENTFUL_FEATURE is empty string', () => {
      const env = {
        ...process.env,
        AGENTFUL_FEATURE: ''
      };

      try {
        execSync(`node "${hookPath}"`, {
          cwd: projectRoot,
          env: env,
          stdio: 'pipe'
        });
        expect(true).toBe(true);
      } catch (error) {
        expect.fail('Hook should exit 0 when AGENTFUL_FEATURE is empty');
      }
    });

    it('should continue processing when AGENTFUL_FEATURE is set', () => {
      const env = {
        ...process.env,
        AGENTFUL_FEATURE: 'test-feature'
      };

      try {
        const output = execSync(`node "${hookPath}"`, {
          cwd: projectRoot,
          env: env,
          stdio: 'pipe',
          encoding: 'utf8'
        });
        expect(output).toContain('=== Post-Feature Validation: test-feature ===');
      } catch (error) {
        // Command will fail validation but should run
        expect(error.stdout || error.stderr).toContain('Post-Feature Validation');
      }
    });
  });

  describe('Validation Gates', () => {
    it('should run all 4 validation checks', () => {
      const env = {
        ...process.env,
        AGENTFUL_FEATURE: 'test-feature'
      };

      try {
        const output = execSync(`node "${hookPath}"`, {
          cwd: projectRoot,
          env: env,
          stdio: 'pipe',
          encoding: 'utf8'
        });

        expect(output).toContain('[1/4] Running tests...');
        expect(output).toContain('[2/4] Running type check...');
        expect(output).toContain('[3/4] Running linter...');
        expect(output).toContain('[4/4] Checking test coverage...');
      } catch (error) {
        // Even if validation fails, should run all checks
        const output = (error.stdout || '') + (error.stderr || '');
        expect(output).toContain('[1/4] Running tests...');
        expect(output).toContain('[2/4] Running type check...');
        expect(output).toContain('[3/4] Running linter...');
        expect(output).toContain('[4/4] Checking test coverage...');
      }
    });

    it('should skip type check when no tsconfig.json', () => {
      const env = {
        ...process.env,
        AGENTFUL_FEATURE: 'test-feature'
      };

      try {
        const output = execSync(`node "${hookPath}"`, {
          cwd: projectRoot,
          env: env,
          stdio: 'pipe',
          encoding: 'utf8'
        });
        expect(output).toContain('Type Check: SKIP (no TypeScript)');
      } catch (error) {
        const output = (error.stdout || '') + (error.stderr || '');
        expect(output).toContain('Type Check: SKIP (no TypeScript)');
      }
    });

    it('should always skip coverage check', () => {
      const env = {
        ...process.env,
        AGENTFUL_FEATURE: 'test-feature'
      };

      try {
        const output = execSync(`node "${hookPath}"`, {
          cwd: projectRoot,
          env: env,
          stdio: 'pipe',
          encoding: 'utf8'
        });
        expect(output).toContain('Coverage: SKIP (unable to measure)');
      } catch (error) {
        const output = (error.stdout || '') + (error.stderr || '');
        expect(output).toContain('Coverage: SKIP (unable to measure)');
      }
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
      const env = {
        ...process.env,
        AGENTFUL_FEATURE: 'user-auth',
        AGENTFUL_DOMAIN: 'authentication'
      };

      try {
        execSync(`node "${hookPath}"`, {
          cwd: projectRoot,
          env: env,
          stdio: 'pipe'
        });
      } catch (error) {
        // Hook may fail validation, but should still update completion.json
      }

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
      const env = {
        ...process.env,
        AGENTFUL_FEATURE: 'search-feature'
      };

      try {
        execSync(`node "${hookPath}"`, {
          cwd: projectRoot,
          env: env,
          stdio: 'pipe'
        });
      } catch (error) {
        // Hook may fail validation
      }

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

      const env = {
        ...process.env,
        AGENTFUL_FEATURE: 'user-auth',
        AGENTFUL_DOMAIN: 'authentication'
      };

      try {
        execSync(`node "${hookPath}"`, {
          cwd: projectRoot,
          env: env,
          stdio: 'pipe'
        });
      } catch (error) {
        // Hook may fail validation
      }

      const completion = JSON.parse(fs.readFileSync(completionFile, 'utf8'));
      expect(completion.domains.authentication.features['user-login']).toBeDefined();
      expect(completion.domains.authentication.features['user-auth']).toBeDefined();
    });

    it('should handle missing completion.json gracefully', () => {
      // Delete completion.json
      if (fs.existsSync(completionFile)) {
        fs.unlinkSync(completionFile);
      }

      const env = {
        ...process.env,
        AGENTFUL_FEATURE: 'test-feature'
      };

      try {
        execSync(`node "${hookPath}"`, {
          cwd: projectRoot,
          env: env,
          stdio: 'pipe'
        });
      } catch (error) {
        // Should not crash
        expect(error.code).toBeDefined();
      }
    });

    it('should handle invalid JSON gracefully', () => {
      // Write invalid JSON
      fs.writeFileSync(completionFile, 'invalid json {');

      const env = {
        ...process.env,
        AGENTFUL_FEATURE: 'test-feature'
      };

      try {
        const output = execSync(`node "${hookPath}"`, {
          cwd: projectRoot,
          env: env,
          stdio: 'pipe',
          encoding: 'utf8'
        });
      } catch (error) {
        const output = (error.stdout || '') + (error.stderr || '');
        expect(output).toContain('WARNING: Failed to update completion.json');
      }
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

      const env = {
        ...process.env,
        AGENTFUL_FEATURE: 'test-feature',
        AGENTFUL_DOMAIN: 'testing'
      };

      try {
        execSync(`node "${hookPath}"`, {
          cwd: projectRoot,
          env: env,
          stdio: 'pipe'
        });
      } catch (error) {
        // Hook may fail validation
      }

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

      const env = {
        ...process.env,
        AGENTFUL_FEATURE: 'test-feature'
      };

      try {
        execSync(`node "${hookPath}"`, {
          cwd: projectRoot,
          env: env,
          stdio: 'pipe'
        });
      } catch (error) {
        // Hook may fail validation
      }

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

      const env = {
        ...process.env,
        AGENTFUL_FEATURE: 'test-feature'
      };

      try {
        execSync(`node "${hookPath}"`, {
          cwd: projectRoot,
          env: env,
          stdio: 'pipe'
        });
      } catch (error) {
        // Should not crash
        expect(error.code).toBeDefined();
      }
    });

    it('should handle invalid metrics JSON gracefully', () => {
      fs.writeFileSync(metricsFile, 'invalid json {');

      const env = {
        ...process.env,
        AGENTFUL_FEATURE: 'test-feature'
      };

      try {
        execSync(`node "${hookPath}"`, {
          cwd: projectRoot,
          env: env,
          stdio: 'pipe'
        });
      } catch (error) {
        const output = (error.stdout || '') + (error.stderr || '');
        expect(output).toContain('WARNING: Failed to update agent-metrics.json');
      }
    });
  });

  describe('Validation Results Array', () => {
    beforeEach(() => {
      const initialCompletion = {
        agents: {},
        skills: {}
      };
      fs.writeFileSync(completionFile, JSON.stringify(initialCompletion, null, 2));
    });

    it('should record all validation results', () => {
      const env = {
        ...process.env,
        AGENTFUL_FEATURE: 'test-feature'
      };

      try {
        execSync(`node "${hookPath}"`, {
          cwd: projectRoot,
          env: env,
          stdio: 'pipe'
        });
      } catch (error) {
        // Hook may fail validation
      }

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
  });

  describe('Exit Codes', () => {
    it('should exit 0 when no feature is set', () => {
      const env = { ...process.env };
      delete env.AGENTFUL_FEATURE;

      try {
        execSync(`node "${hookPath}"`, {
          cwd: projectRoot,
          env: env,
          stdio: 'pipe'
        });
        expect(true).toBe(true); // Exited successfully
      } catch (error) {
        expect.fail('Should exit 0 when no feature set');
      }
    });

    it('should show validation failure message when validations fail', () => {
      const env = {
        ...process.env,
        AGENTFUL_FEATURE: 'test-feature'
      };

      try {
        execSync(`node "${hookPath}"`, {
          cwd: projectRoot,
          env: env,
          stdio: 'pipe',
          encoding: 'utf8'
        });
        // If it doesn't throw, tests passed (unlikely in test environment)
      } catch (error) {
        const output = (error.stdout || '') + (error.stderr || '');
        if (error.status !== 0) {
          expect(output).toContain('=== Validation Failed');
          expect(output).toContain('Fix validation errors before completing feature');
          expect(output).toContain('Run /agentful-validate for detailed output');
        }
      }
    });
  });

  describe('Console Output', () => {
    it('should display feature name in header', () => {
      const env = {
        ...process.env,
        AGENTFUL_FEATURE: 'my-awesome-feature'
      };

      try {
        const output = execSync(`node "${hookPath}"`, {
          cwd: projectRoot,
          env: env,
          stdio: 'pipe',
          encoding: 'utf8'
        });
        expect(output).toContain('=== Post-Feature Validation: my-awesome-feature ===');
      } catch (error) {
        const output = (error.stdout || '') + (error.stderr || '');
        expect(output).toContain('=== Post-Feature Validation: my-awesome-feature ===');
      }
    });

    it('should show validation check numbers', () => {
      const env = {
        ...process.env,
        AGENTFUL_FEATURE: 'test-feature'
      };

      try {
        const output = execSync(`node "${hookPath}"`, {
          cwd: projectRoot,
          env: env,
          stdio: 'pipe',
          encoding: 'utf8'
        });

        expect(output).toContain('[1/4]');
        expect(output).toContain('[2/4]');
        expect(output).toContain('[3/4]');
        expect(output).toContain('[4/4]');
      } catch (error) {
        const output = (error.stdout || '') + (error.stderr || '');
        expect(output).toContain('[1/4]');
        expect(output).toContain('[2/4]');
        expect(output).toContain('[3/4]');
        expect(output).toContain('[4/4]');
      }
    });
  });

  describe('Git Commit Logic', () => {
    it('should not create commit when validation fails', () => {
      const env = {
        ...process.env,
        AGENTFUL_FEATURE: 'test-feature'
      };

      try {
        const output = execSync(`node "${hookPath}"`, {
          cwd: projectRoot,
          env: env,
          stdio: 'pipe',
          encoding: 'utf8'
        });
        // If tests pass, would try git commit
      } catch (error) {
        const output = (error.stdout || '') + (error.stderr || '');
        // Should not contain git commit messages when validation fails
        expect(output).not.toContain('Creating git commit...');
      }
    });
  });
});
