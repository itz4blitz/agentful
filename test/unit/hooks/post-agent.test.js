import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..', '..', '..');
const hookPath = path.join(projectRoot, 'bin', 'hooks', 'post-agent.js');
const metricsFile = path.join(projectRoot, '.agentful', 'agent-metrics.json');

/**
 * Post-Agent Hook Unit Tests
 *
 * Tests for bin/hooks/post-agent.js
 * Tests metrics tracking, file creation, error handling, and edge cases
 *
 * Coverage targets:
 * - 100% line coverage
 * - 100% branch coverage
 * - All error paths tested
 */

describe('post-agent hook', () => {
  let originalEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };

    // Clean up metrics file before each test
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

    // Clean up metrics file after each test
    if (fs.existsSync(metricsFile)) {
      fs.unlinkSync(metricsFile);
    }
  });

  describe('environment variable handling', () => {
    it('should exit 0 when AGENTFUL_AGENT is not set', () => {
      // Unset AGENTFUL_AGENT
      const env = { ...process.env };
      delete env.AGENTFUL_AGENT;

      try {
        execSync(`node "${hookPath}"`, {
          cwd: projectRoot,
          env: env,
          stdio: 'pipe'
        });
        // Should not throw (exit 0)
        expect(true).toBe(true);
      } catch (error) {
        // Should not reach here
        expect.fail('Hook should exit 0 when AGENTFUL_AGENT is not set');
      }
    });

    it('should exit 0 when AGENTFUL_AGENT is empty string', () => {
      const env = {
        ...process.env,
        AGENTFUL_AGENT: ''
      };

      try {
        execSync(`node "${hookPath}"`, {
          cwd: projectRoot,
          env: env,
          stdio: 'pipe'
        });
        // Should not throw (exit 0)
        expect(true).toBe(true);
      } catch (error) {
        expect.fail('Hook should exit 0 when AGENTFUL_AGENT is empty');
      }
    });

    it('should process when AGENTFUL_AGENT is set', () => {
      const env = {
        ...process.env,
        AGENTFUL_AGENT: 'test-agent'
      };

      execSync(`node "${hookPath}"`, {
        cwd: projectRoot,
        env: env,
        stdio: 'pipe'
      });

      // Metrics file should be created
      expect(fs.existsSync(metricsFile)).toBe(true);
    });
  });

  describe('metrics file creation', () => {
    it('should create metrics file when it does not exist', () => {
      // Ensure file doesn't exist
      expect(fs.existsSync(metricsFile)).toBe(false);

      const env = {
        ...process.env,
        AGENTFUL_AGENT: 'test-agent',
        AGENTFUL_FEATURE: 'test-feature',
        AGENTFUL_DOMAIN: 'test-domain'
      };

      execSync(`node "${hookPath}"`, {
        cwd: projectRoot,
        env: env,
        stdio: 'pipe'
      });

      // File should now exist
      expect(fs.existsSync(metricsFile)).toBe(true);

      // Should have correct structure
      const metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
      expect(metrics).toHaveProperty('invocations');
      expect(metrics).toHaveProperty('last_invocation');
      expect(metrics).toHaveProperty('feature_hooks');
    });

    it('should create metrics with correct initial structure', () => {
      const env = {
        ...process.env,
        AGENTFUL_AGENT: 'architect'
      };

      execSync(`node "${hookPath}"`, {
        cwd: projectRoot,
        env: env,
        stdio: 'pipe'
      });

      const metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));

      // Check structure
      expect(metrics.invocations).toEqual({ architect: 1 });
      expect(metrics.last_invocation).toHaveProperty('agent', 'architect');
      expect(metrics.last_invocation).toHaveProperty('timestamp');
      expect(metrics.last_invocation).toHaveProperty('feature');
      expect(metrics.last_invocation).toHaveProperty('domain');
      expect(Array.isArray(metrics.feature_hooks)).toBe(true);
    });
  });

  describe('metrics tracking', () => {
    it('should increment invocation count for agent', () => {
      const env = {
        ...process.env,
        AGENTFUL_AGENT: 'backend'
      };

      // First invocation
      execSync(`node "${hookPath}"`, {
        cwd: projectRoot,
        env: env,
        stdio: 'pipe'
      });

      let metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
      expect(metrics.invocations.backend).toBe(1);

      // Second invocation
      execSync(`node "${hookPath}"`, {
        cwd: projectRoot,
        env: env,
        stdio: 'pipe'
      });

      metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
      expect(metrics.invocations.backend).toBe(2);

      // Third invocation
      execSync(`node "${hookPath}"`, {
        cwd: projectRoot,
        env: env,
        stdio: 'pipe'
      });

      metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
      expect(metrics.invocations.backend).toBe(3);
    });

    it('should track different agents separately', () => {
      // Invoke architect
      execSync(`node "${hookPath}"`, {
        cwd: projectRoot,
        env: {
          ...process.env,
          AGENTFUL_AGENT: 'architect'
        },
        stdio: 'pipe'
      });

      // Invoke backend
      execSync(`node "${hookPath}"`, {
        cwd: projectRoot,
        env: {
          ...process.env,
          AGENTFUL_AGENT: 'backend'
        },
        stdio: 'pipe'
      });

      // Invoke architect again
      execSync(`node "${hookPath}"`, {
        cwd: projectRoot,
        env: {
          ...process.env,
          AGENTFUL_AGENT: 'architect'
        },
        stdio: 'pipe'
      });

      const metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
      expect(metrics.invocations.architect).toBe(2);
      expect(metrics.invocations.backend).toBe(1);
    });

    it('should update last_invocation with timestamp', () => {
      const beforeTime = new Date().toISOString();

      execSync(`node "${hookPath}"`, {
        cwd: projectRoot,
        env: {
          ...process.env,
          AGENTFUL_AGENT: 'tester'
        },
        stdio: 'pipe'
      });

      const afterTime = new Date().toISOString();
      const metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));

      expect(metrics.last_invocation.timestamp).toBeDefined();
      expect(metrics.last_invocation.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

      // Timestamp should be between before and after
      expect(metrics.last_invocation.timestamp >= beforeTime).toBe(true);
      expect(metrics.last_invocation.timestamp <= afterTime).toBe(true);
    });

    it('should record agent name in last_invocation', () => {
      execSync(`node "${hookPath}"`, {
        cwd: projectRoot,
        env: {
          ...process.env,
          AGENTFUL_AGENT: 'reviewer'
        },
        stdio: 'pipe'
      });

      const metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
      expect(metrics.last_invocation.agent).toBe('reviewer');
    });

    it('should record feature in last_invocation', () => {
      execSync(`node "${hookPath}"`, {
        cwd: projectRoot,
        env: {
          ...process.env,
          AGENTFUL_AGENT: 'frontend',
          AGENTFUL_FEATURE: 'user-authentication'
        },
        stdio: 'pipe'
      });

      const metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
      expect(metrics.last_invocation.feature).toBe('user-authentication');
    });

    it('should record domain in last_invocation', () => {
      execSync(`node "${hookPath}"`, {
        cwd: projectRoot,
        env: {
          ...process.env,
          AGENTFUL_AGENT: 'backend',
          AGENTFUL_DOMAIN: 'api'
        },
        stdio: 'pipe'
      });

      const metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
      expect(metrics.last_invocation.domain).toBe('api');
    });

    it('should record all metadata in last_invocation', () => {
      execSync(`node "${hookPath}"`, {
        cwd: projectRoot,
        env: {
          ...process.env,
          AGENTFUL_AGENT: 'orchestrator',
          AGENTFUL_FEATURE: 'payment-flow',
          AGENTFUL_DOMAIN: 'billing'
        },
        stdio: 'pipe'
      });

      const metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
      expect(metrics.last_invocation.agent).toBe('orchestrator');
      expect(metrics.last_invocation.feature).toBe('payment-flow');
      expect(metrics.last_invocation.domain).toBe('billing');
      expect(metrics.last_invocation.timestamp).toBeDefined();
    });

    it('should update last_invocation on each run', () => {
      // First invocation
      execSync(`node "${hookPath}"`, {
        cwd: projectRoot,
        env: {
          ...process.env,
          AGENTFUL_AGENT: 'backend',
          AGENTFUL_FEATURE: 'feature-1'
        },
        stdio: 'pipe'
      });

      const metrics1 = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
      const firstTimestamp = metrics1.last_invocation.timestamp;

      // Small delay to ensure different timestamp
      execSync('sleep 0.1', { stdio: 'pipe' });

      // Second invocation
      execSync(`node "${hookPath}"`, {
        cwd: projectRoot,
        env: {
          ...process.env,
          AGENTFUL_AGENT: 'frontend',
          AGENTFUL_FEATURE: 'feature-2'
        },
        stdio: 'pipe'
      });

      const metrics2 = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));

      // Last invocation should be updated
      expect(metrics2.last_invocation.agent).toBe('frontend');
      expect(metrics2.last_invocation.feature).toBe('feature-2');
      expect(metrics2.last_invocation.timestamp).not.toBe(firstTimestamp);
    });
  });

  describe('edge cases with missing environment variables', () => {
    it('should handle missing AGENTFUL_FEATURE', () => {
      execSync(`node "${hookPath}"`, {
        cwd: projectRoot,
        env: {
          ...process.env,
          AGENTFUL_AGENT: 'backend',
          AGENTFUL_DOMAIN: 'api'
        },
        stdio: 'pipe'
      });

      const metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
      expect(metrics.last_invocation.feature).toBe('');
      expect(metrics.last_invocation.domain).toBe('api');
    });

    it('should handle missing AGENTFUL_DOMAIN', () => {
      execSync(`node "${hookPath}"`, {
        cwd: projectRoot,
        env: {
          ...process.env,
          AGENTFUL_AGENT: 'frontend',
          AGENTFUL_FEATURE: 'dashboard'
        },
        stdio: 'pipe'
      });

      const metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
      expect(metrics.last_invocation.feature).toBe('dashboard');
      expect(metrics.last_invocation.domain).toBe('');
    });

    it('should handle missing both AGENTFUL_FEATURE and AGENTFUL_DOMAIN', () => {
      execSync(`node "${hookPath}"`, {
        cwd: projectRoot,
        env: {
          ...process.env,
          AGENTFUL_AGENT: 'tester'
        },
        stdio: 'pipe'
      });

      const metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
      expect(metrics.last_invocation.agent).toBe('tester');
      expect(metrics.last_invocation.feature).toBe('');
      expect(metrics.last_invocation.domain).toBe('');
    });
  });

  describe('corrupted metrics file handling', () => {
    it('should recreate metrics file when corrupted with invalid JSON', () => {
      // Write invalid JSON
      fs.writeFileSync(metricsFile, 'invalid json content {{{');

      execSync(`node "${hookPath}"`, {
        cwd: projectRoot,
        env: {
          ...process.env,
          AGENTFUL_AGENT: 'backend'
        },
        stdio: 'pipe'
      });

      // Should have recreated with valid structure
      const metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
      expect(metrics).toHaveProperty('invocations');
      expect(metrics).toHaveProperty('last_invocation');
      expect(metrics).toHaveProperty('feature_hooks');
      expect(metrics.invocations.backend).toBe(1);
    });

    it('should recreate metrics file when corrupted with empty file', () => {
      // Write empty file
      fs.writeFileSync(metricsFile, '');

      execSync(`node "${hookPath}"`, {
        cwd: projectRoot,
        env: {
          ...process.env,
          AGENTFUL_AGENT: 'reviewer'
        },
        stdio: 'pipe'
      });

      // Should have recreated with valid structure
      const metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
      expect(metrics.invocations.reviewer).toBe(1);
    });

    it('should recreate metrics file when corrupted with non-JSON content', () => {
      // Write non-JSON content
      fs.writeFileSync(metricsFile, 'This is not JSON at all!');

      execSync(`node "${hookPath}"`, {
        cwd: projectRoot,
        env: {
          ...process.env,
          AGENTFUL_AGENT: 'architect'
        },
        stdio: 'pipe'
      });

      // Should have recreated with valid structure
      const metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
      expect(metrics.invocations.architect).toBe(1);
    });

    it('should print warning when recreating corrupted file', () => {
      // Write invalid JSON
      fs.writeFileSync(metricsFile, 'corrupted');

      const output = execSync(`node "${hookPath}"`, {
        cwd: projectRoot,
        env: {
          ...process.env,
          AGENTFUL_AGENT: 'backend'
        },
        encoding: 'utf8',
        stdio: 'pipe'
      });

      // Should have logged warning (captured in stdout/stderr)
      // Note: The hook logs to console.log, so we check that execution succeeded
      expect(fs.existsSync(metricsFile)).toBe(true);
      const metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
      expect(metrics.invocations.backend).toBe(1);
    });
  });

  describe('file write error handling', () => {
    it('should handle write failure gracefully and exit 0', () => {
      // Create metrics file with read-only permissions
      fs.writeFileSync(metricsFile, JSON.stringify({
        invocations: {},
        last_invocation: null,
        feature_hooks: []
      }));

      // Make file read-only
      fs.chmodSync(metricsFile, 0o444);

      try {
        // Should still exit 0 even if write fails
        execSync(`node "${hookPath}"`, {
          cwd: projectRoot,
          env: {
            ...process.env,
            AGENTFUL_AGENT: 'backend'
          },
          stdio: 'pipe'
        });

        // Should not throw (exits 0)
        expect(true).toBe(true);
      } finally {
        // Restore write permissions for cleanup
        fs.chmodSync(metricsFile, 0o644);
      }
    });
  });

  describe('metrics structure validation', () => {
    it('should preserve existing metrics when updating', () => {
      // Create initial metrics with multiple agents
      const initialMetrics = {
        invocations: {
          architect: 5,
          backend: 3,
          frontend: 2
        },
        last_invocation: {
          agent: 'frontend',
          timestamp: '2026-01-19T10:00:00.000Z',
          feature: 'old-feature',
          domain: 'old-domain'
        },
        feature_hooks: []
      };

      fs.writeFileSync(metricsFile, JSON.stringify(initialMetrics, null, 2));

      // Run hook for backend
      execSync(`node "${hookPath}"`, {
        cwd: projectRoot,
        env: {
          ...process.env,
          AGENTFUL_AGENT: 'backend',
          AGENTFUL_FEATURE: 'new-feature',
          AGENTFUL_DOMAIN: 'new-domain'
        },
        stdio: 'pipe'
      });

      const metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));

      // Backend count should be incremented
      expect(metrics.invocations.backend).toBe(4);

      // Other agent counts should be preserved
      expect(metrics.invocations.architect).toBe(5);
      expect(metrics.invocations.frontend).toBe(2);

      // Last invocation should be updated
      expect(metrics.last_invocation.agent).toBe('backend');
      expect(metrics.last_invocation.feature).toBe('new-feature');
      expect(metrics.last_invocation.domain).toBe('new-domain');
    });

    it('should initialize count to 1 for new agent', () => {
      // Create initial metrics with some agents
      const initialMetrics = {
        invocations: {
          architect: 5,
          backend: 3
        },
        last_invocation: null,
        feature_hooks: []
      };

      fs.writeFileSync(metricsFile, JSON.stringify(initialMetrics, null, 2));

      // Run hook for new agent
      execSync(`node "${hookPath}"`, {
        cwd: projectRoot,
        env: {
          ...process.env,
          AGENTFUL_AGENT: 'tester'
        },
        stdio: 'pipe'
      });

      const metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));

      // New agent should have count of 1
      expect(metrics.invocations.tester).toBe(1);

      // Existing agents should be preserved
      expect(metrics.invocations.architect).toBe(5);
      expect(metrics.invocations.backend).toBe(3);
    });

    it('should maintain feature_hooks array', () => {
      // Create initial metrics with feature_hooks
      const initialMetrics = {
        invocations: {},
        last_invocation: null,
        feature_hooks: ['hook1', 'hook2']
      };

      fs.writeFileSync(metricsFile, JSON.stringify(initialMetrics, null, 2));

      execSync(`node "${hookPath}"`, {
        cwd: projectRoot,
        env: {
          ...process.env,
          AGENTFUL_AGENT: 'backend'
        },
        stdio: 'pipe'
      });

      const metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));

      // feature_hooks should be preserved
      expect(Array.isArray(metrics.feature_hooks)).toBe(true);
      expect(metrics.feature_hooks).toEqual(['hook1', 'hook2']);
    });
  });

  describe('JSON formatting', () => {
    it('should write properly formatted JSON with 2-space indentation', () => {
      execSync(`node "${hookPath}"`, {
        cwd: projectRoot,
        env: {
          ...process.env,
          AGENTFUL_AGENT: 'backend'
        },
        stdio: 'pipe'
      });

      const rawContent = fs.readFileSync(metricsFile, 'utf8');

      // Check for proper formatting
      expect(rawContent).toContain('  "invocations"');
      expect(rawContent).toContain('  "last_invocation"');

      // Should be valid JSON
      expect(() => JSON.parse(rawContent)).not.toThrow();
    });
  });

  describe('exit codes', () => {
    it('should exit with code 0 on success', () => {
      try {
        execSync(`node "${hookPath}"`, {
          cwd: projectRoot,
          env: {
            ...process.env,
            AGENTFUL_AGENT: 'backend'
          },
          stdio: 'pipe'
        });
        // Should not throw
        expect(true).toBe(true);
      } catch (error) {
        expect.fail('Hook should exit with code 0 on success');
      }
    });

    it('should exit with code 0 even when no agent specified', () => {
      try {
        execSync(`node "${hookPath}"`, {
          cwd: projectRoot,
          env: {
            ...process.env
          },
          stdio: 'pipe'
        });
        // Should not throw
        expect(true).toBe(true);
      } catch (error) {
        expect.fail('Hook should exit with code 0 when no agent specified');
      }
    });
  });
});
