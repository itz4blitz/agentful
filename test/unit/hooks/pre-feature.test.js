import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const preFeatureScript = path.join(__dirname, '../../../bin/hooks/pre-feature.js');

/**
 * Pre-Feature Hook Unit Tests
 *
 * Tests for the pre-feature validation hook (bin/hooks/pre-feature.js)
 * Tests all validation checks, exit codes, and error/warning messages
 *
 * Coverage targets: 100% line and branch coverage
 */

describe('Pre-Feature Hook', () => {
  let originalCwd;
  let testDir;
  let mockFs;

  beforeEach(() => {
    originalCwd = process.cwd();
    // Create a temporary directory structure for testing
    testDir = path.join(__dirname, '../../../.test-tmp');

    // Mock fs module
    mockFs = {
      existsSync: vi.fn(),
      readFileSync: vi.fn()
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
    process.chdir(originalCwd);
  });

  /**
   * Helper function to run pre-feature.js with environment variables
   * @param {object} env - Environment variables
   * @returns {object} - { exitCode, stdout, stderr }
   */
  function runPreFeature(env = {}) {
    const envVars = Object.entries(env)
      .map(([key, value]) => `${key}=${value}`)
      .join(' ');

    try {
      const stdout = execSync(`${envVars} node ${preFeatureScript}`, {
        encoding: 'utf8',
        cwd: originalCwd,
        stdio: 'pipe'
      });
      return { exitCode: 0, stdout, stderr: '' };
    } catch (error) {
      return {
        exitCode: error.status,
        stdout: error.stdout || '',
        stderr: error.stderr || ''
      };
    }
  }

  describe('Feature Detection', () => {
    it('should exit 0 when no feature specified', () => {
      const result = runPreFeature({});
      expect(result.exitCode).toBe(0);
    });

    it('should exit 0 when AGENTFUL_FEATURE is empty string', () => {
      const result = runPreFeature({ AGENTFUL_FEATURE: '' });
      expect(result.exitCode).toBe(0);
    });

    it('should process feature when AGENTFUL_FEATURE is set', () => {
      const result = runPreFeature({
        AGENTFUL_FEATURE: 'test-feature'
      });

      // Will fail validation (files don't exist), but shows it processed the feature
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('ERROR');
    });
  });

  describe('Check 1: Feature File Exists', () => {
    describe('Flat Structure (no DOMAIN)', () => {
      it('should check for feature file in flat structure', () => {
        const result = runPreFeature({
          AGENTFUL_FEATURE: 'my-feature'
        });

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('ERROR: Feature file not found');
        expect(result.stderr).toContain('.claude/product/features/my-feature.md');
      });

      it('should pass when feature file exists in flat structure', () => {
        // Create the flat structure
        const featureDir = path.join(originalCwd, '.claude/product/features');
        const completionPath = path.join(originalCwd, '.agentful/completion.json');

        try {
          fs.mkdirSync(featureDir, { recursive: true });
          fs.mkdirSync(path.join(originalCwd, '.agentful'), { recursive: true });

          fs.writeFileSync(
            path.join(featureDir, 'test-flat.md'),
            '# Test Feature'
          );
          fs.writeFileSync(
            completionPath,
            JSON.stringify({ domains: {} })
          );

          const result = runPreFeature({
            AGENTFUL_FEATURE: 'test-flat'
          });

          // Should have warnings (missing agents) but no errors
          expect(result.exitCode).toBe(0);
          expect(result.stderr).not.toContain('ERROR: Feature file not found');
        } finally {
          // Cleanup
          fs.rmSync(path.join(originalCwd, '.claude'), { recursive: true, force: true });
          fs.rmSync(path.join(originalCwd, '.agentful'), { recursive: true, force: true });
        }
      });
    });

    describe('Hierarchical Structure (with DOMAIN)', () => {
      it('should check for feature file in hierarchical structure', () => {
        const result = runPreFeature({
          AGENTFUL_FEATURE: 'my-feature',
          AGENTFUL_DOMAIN: 'my-domain'
        });

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('ERROR: Feature file not found');
        expect(result.stderr).toContain('.claude/product/domains/my-domain/features/my-feature.md');
      });

      it('should pass when feature file exists in hierarchical structure', () => {
        const domainDir = path.join(originalCwd, '.claude/product/domains/test-domain/features');
        const completionPath = path.join(originalCwd, '.agentful/completion.json');

        try {
          fs.mkdirSync(domainDir, { recursive: true });
          fs.mkdirSync(path.join(originalCwd, '.agentful'), { recursive: true });

          fs.writeFileSync(
            path.join(domainDir, 'test-hierarchical.md'),
            '# Test Feature'
          );
          fs.writeFileSync(
            completionPath,
            JSON.stringify({
              domains: {
                'test-domain': { status: 'in-progress' }
              }
            })
          );

          const result = runPreFeature({
            AGENTFUL_FEATURE: 'test-hierarchical',
            AGENTFUL_DOMAIN: 'test-domain'
          });

          // Should have warnings (missing agents) but no errors
          expect(result.exitCode).toBe(0);
          expect(result.stderr).not.toContain('ERROR: Feature file not found');
        } finally {
          // Cleanup
          fs.rmSync(path.join(originalCwd, '.claude'), { recursive: true, force: true });
          fs.rmSync(path.join(originalCwd, '.agentful'), { recursive: true, force: true });
        }
      });
    });
  });

  describe('Check 2: completion.json Exists', () => {
    it('should error when completion.json does not exist', () => {
      const result = runPreFeature({
        AGENTFUL_FEATURE: 'test-feature'
      });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('ERROR: .agentful/completion.json not found');
    });

    it('should not error when completion.json exists', () => {
      const completionPath = path.join(originalCwd, '.agentful/completion.json');
      const featureDir = path.join(originalCwd, '.claude/product/features');

      try {
        fs.mkdirSync(path.join(originalCwd, '.agentful'), { recursive: true });
        fs.mkdirSync(featureDir, { recursive: true });

        fs.writeFileSync(completionPath, JSON.stringify({ domains: {} }));
        fs.writeFileSync(
          path.join(featureDir, 'test.md'),
          '# Test'
        );

        const result = runPreFeature({
          AGENTFUL_FEATURE: 'test'
        });

        expect(result.stderr).not.toContain('ERROR: .agentful/completion.json not found');
      } finally {
        fs.rmSync(path.join(originalCwd, '.claude'), { recursive: true, force: true });
        fs.rmSync(path.join(originalCwd, '.agentful'), { recursive: true, force: true });
      }
    });
  });

  describe('Check 3: Domain Blocked Status', () => {
    it('should error when domain status is blocked', () => {
      const completionPath = path.join(originalCwd, '.agentful/completion.json');
      const featureDir = path.join(originalCwd, '.claude/product/domains/blocked-domain/features');

      try {
        fs.mkdirSync(path.join(originalCwd, '.agentful'), { recursive: true });
        fs.mkdirSync(featureDir, { recursive: true });

        fs.writeFileSync(
          completionPath,
          JSON.stringify({
            domains: {
              'blocked-domain': { status: 'blocked' }
            }
          })
        );
        fs.writeFileSync(
          path.join(featureDir, 'test-feature.md'),
          '# Test'
        );

        const result = runPreFeature({
          AGENTFUL_FEATURE: 'test-feature',
          AGENTFUL_DOMAIN: 'blocked-domain'
        });

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain("ERROR: Domain 'blocked-domain' is blocked");
      } finally {
        fs.rmSync(path.join(originalCwd, '.claude'), { recursive: true, force: true });
        fs.rmSync(path.join(originalCwd, '.agentful'), { recursive: true, force: true });
      }
    });

    it('should not error when domain status is in-progress', () => {
      const completionPath = path.join(originalCwd, '.agentful/completion.json');
      const featureDir = path.join(originalCwd, '.claude/product/domains/active-domain/features');

      try {
        fs.mkdirSync(path.join(originalCwd, '.agentful'), { recursive: true });
        fs.mkdirSync(featureDir, { recursive: true });

        fs.writeFileSync(
          completionPath,
          JSON.stringify({
            domains: {
              'active-domain': { status: 'in-progress' }
            }
          })
        );
        fs.writeFileSync(
          path.join(featureDir, 'test-feature.md'),
          '# Test'
        );

        const result = runPreFeature({
          AGENTFUL_FEATURE: 'test-feature',
          AGENTFUL_DOMAIN: 'active-domain'
        });

        expect(result.stderr).not.toContain("ERROR: Domain 'active-domain' is blocked");
      } finally {
        fs.rmSync(path.join(originalCwd, '.claude'), { recursive: true, force: true });
        fs.rmSync(path.join(originalCwd, '.agentful'), { recursive: true, force: true });
      }
    });

    it('should not error when domain is not in completion.json (unknown status)', () => {
      const completionPath = path.join(originalCwd, '.agentful/completion.json');
      const featureDir = path.join(originalCwd, '.claude/product/domains/unknown-domain/features');

      try {
        fs.mkdirSync(path.join(originalCwd, '.agentful'), { recursive: true });
        fs.mkdirSync(featureDir, { recursive: true });

        fs.writeFileSync(
          completionPath,
          JSON.stringify({
            domains: {}
          })
        );
        fs.writeFileSync(
          path.join(featureDir, 'test-feature.md'),
          '# Test'
        );

        const result = runPreFeature({
          AGENTFUL_FEATURE: 'test-feature',
          AGENTFUL_DOMAIN: 'unknown-domain'
        });

        expect(result.stderr).not.toContain("ERROR: Domain 'unknown-domain' is blocked");
      } finally {
        fs.rmSync(path.join(originalCwd, '.claude'), { recursive: true, force: true });
        fs.rmSync(path.join(originalCwd, '.agentful'), { recursive: true, force: true });
      }
    });

    it('should handle missing domains property in completion.json', () => {
      const completionPath = path.join(originalCwd, '.agentful/completion.json');
      const featureDir = path.join(originalCwd, '.claude/product/domains/test-domain/features');

      try {
        fs.mkdirSync(path.join(originalCwd, '.agentful'), { recursive: true });
        fs.mkdirSync(featureDir, { recursive: true });

        fs.writeFileSync(completionPath, JSON.stringify({}));
        fs.writeFileSync(
          path.join(featureDir, 'test-feature.md'),
          '# Test'
        );

        const result = runPreFeature({
          AGENTFUL_FEATURE: 'test-feature',
          AGENTFUL_DOMAIN: 'test-domain'
        });

        // Should not error due to missing domains property
        expect(result.stderr).not.toContain("ERROR: Domain 'test-domain' is blocked");
      } finally {
        fs.rmSync(path.join(originalCwd, '.claude'), { recursive: true, force: true });
        fs.rmSync(path.join(originalCwd, '.agentful'), { recursive: true, force: true });
      }
    });
  });

  describe('Check 4: Blocking Decisions', () => {
    it('should error when feature is blocked by decisions (flat structure)', () => {
      const completionPath = path.join(originalCwd, '.agentful/completion.json');
      const decisionsPath = path.join(originalCwd, '.agentful/decisions.json');
      const featureDir = path.join(originalCwd, '.claude/product/features');

      try {
        fs.mkdirSync(path.join(originalCwd, '.agentful'), { recursive: true });
        fs.mkdirSync(featureDir, { recursive: true });

        fs.writeFileSync(completionPath, JSON.stringify({ domains: {} }));
        fs.writeFileSync(
          decisionsPath,
          JSON.stringify({
            pending: [
              {
                id: 'DECISION-001',
                blocking: ['blocked-feature']
              }
            ]
          })
        );
        fs.writeFileSync(
          path.join(featureDir, 'blocked-feature.md'),
          '# Test'
        );

        const result = runPreFeature({
          AGENTFUL_FEATURE: 'blocked-feature'
        });

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain("ERROR: Feature 'blocked-feature' is blocked by decisions: DECISION-001");
        expect(result.stderr).toContain('Run /agentful-decide to resolve blocking decisions');
      } finally {
        fs.rmSync(path.join(originalCwd, '.claude'), { recursive: true, force: true });
        fs.rmSync(path.join(originalCwd, '.agentful'), { recursive: true, force: true });
      }
    });

    it('should error when feature is blocked by decisions (hierarchical structure)', () => {
      const completionPath = path.join(originalCwd, '.agentful/completion.json');
      const decisionsPath = path.join(originalCwd, '.agentful/decisions.json');
      const featureDir = path.join(originalCwd, '.claude/product/domains/test-domain/features');

      try {
        fs.mkdirSync(path.join(originalCwd, '.agentful'), { recursive: true });
        fs.mkdirSync(featureDir, { recursive: true });

        fs.writeFileSync(
          completionPath,
          JSON.stringify({
            domains: {
              'test-domain': { status: 'in-progress' }
            }
          })
        );
        fs.writeFileSync(
          decisionsPath,
          JSON.stringify({
            pending: [
              {
                id: 'DECISION-002',
                blocking: ['test-domain/blocked-feature']
              }
            ]
          })
        );
        fs.writeFileSync(
          path.join(featureDir, 'blocked-feature.md'),
          '# Test'
        );

        const result = runPreFeature({
          AGENTFUL_FEATURE: 'blocked-feature',
          AGENTFUL_DOMAIN: 'test-domain'
        });

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain("ERROR: Feature 'blocked-feature' is blocked by decisions: DECISION-002");
      } finally {
        fs.rmSync(path.join(originalCwd, '.claude'), { recursive: true, force: true });
        fs.rmSync(path.join(originalCwd, '.agentful'), { recursive: true, force: true });
      }
    });

    it('should handle multiple blocking decisions', () => {
      const completionPath = path.join(originalCwd, '.agentful/completion.json');
      const decisionsPath = path.join(originalCwd, '.agentful/decisions.json');
      const featureDir = path.join(originalCwd, '.claude/product/features');

      try {
        fs.mkdirSync(path.join(originalCwd, '.agentful'), { recursive: true });
        fs.mkdirSync(featureDir, { recursive: true });

        fs.writeFileSync(completionPath, JSON.stringify({ domains: {} }));
        fs.writeFileSync(
          decisionsPath,
          JSON.stringify({
            pending: [
              {
                id: 'DEC-001',
                blocking: ['multi-blocked']
              },
              {
                id: 'DEC-002',
                blocking: ['multi-blocked', 'other-feature']
              },
              {
                id: 'DEC-003',
                blocking: ['different-feature']
              }
            ]
          })
        );
        fs.writeFileSync(
          path.join(featureDir, 'multi-blocked.md'),
          '# Test'
        );

        const result = runPreFeature({
          AGENTFUL_FEATURE: 'multi-blocked'
        });

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain("ERROR: Feature 'multi-blocked' is blocked by decisions: DEC-001, DEC-002");
      } finally {
        fs.rmSync(path.join(originalCwd, '.claude'), { recursive: true, force: true });
        fs.rmSync(path.join(originalCwd, '.agentful'), { recursive: true, force: true });
      }
    });

    it('should not error when no blocking decisions exist', () => {
      const completionPath = path.join(originalCwd, '.agentful/completion.json');
      const decisionsPath = path.join(originalCwd, '.agentful/decisions.json');
      const featureDir = path.join(originalCwd, '.claude/product/features');

      try {
        fs.mkdirSync(path.join(originalCwd, '.agentful'), { recursive: true });
        fs.mkdirSync(featureDir, { recursive: true });

        fs.writeFileSync(completionPath, JSON.stringify({ domains: {} }));
        fs.writeFileSync(
          decisionsPath,
          JSON.stringify({
            pending: [
              {
                id: 'DEC-001',
                blocking: ['other-feature']
              }
            ]
          })
        );
        fs.writeFileSync(
          path.join(featureDir, 'unblocked.md'),
          '# Test'
        );

        const result = runPreFeature({
          AGENTFUL_FEATURE: 'unblocked'
        });

        expect(result.stderr).not.toContain('is blocked by decisions');
      } finally {
        fs.rmSync(path.join(originalCwd, '.claude'), { recursive: true, force: true });
        fs.rmSync(path.join(originalCwd, '.agentful'), { recursive: true, force: true });
      }
    });

    it('should handle decisions.json not existing', () => {
      const completionPath = path.join(originalCwd, '.agentful/completion.json');
      const featureDir = path.join(originalCwd, '.claude/product/features');

      try {
        fs.mkdirSync(path.join(originalCwd, '.agentful'), { recursive: true });
        fs.mkdirSync(featureDir, { recursive: true });

        fs.writeFileSync(completionPath, JSON.stringify({ domains: {} }));
        fs.writeFileSync(
          path.join(featureDir, 'test.md'),
          '# Test'
        );

        const result = runPreFeature({
          AGENTFUL_FEATURE: 'test'
        });

        // Should not error when decisions.json doesn't exist
        expect(result.stderr).not.toContain('is blocked by decisions');
      } finally {
        fs.rmSync(path.join(originalCwd, '.claude'), { recursive: true, force: true });
        fs.rmSync(path.join(originalCwd, '.agentful'), { recursive: true, force: true });
      }
    });

    it('should handle invalid JSON in decisions.json gracefully', () => {
      const completionPath = path.join(originalCwd, '.agentful/completion.json');
      const decisionsPath = path.join(originalCwd, '.agentful/decisions.json');
      const featureDir = path.join(originalCwd, '.claude/product/features');

      try {
        fs.mkdirSync(path.join(originalCwd, '.agentful'), { recursive: true });
        fs.mkdirSync(featureDir, { recursive: true });

        fs.writeFileSync(completionPath, JSON.stringify({ domains: {} }));
        fs.writeFileSync(decisionsPath, 'invalid json {]');
        fs.writeFileSync(
          path.join(featureDir, 'test.md'),
          '# Test'
        );

        const result = runPreFeature({
          AGENTFUL_FEATURE: 'test'
        });

        // Should ignore invalid JSON and not crash
        expect(result.stderr).not.toContain('is blocked by decisions');
      } finally {
        fs.rmSync(path.join(originalCwd, '.claude'), { recursive: true, force: true });
        fs.rmSync(path.join(originalCwd, '.agentful'), { recursive: true, force: true });
      }
    });

    it('should handle missing pending array in decisions.json', () => {
      const completionPath = path.join(originalCwd, '.agentful/completion.json');
      const decisionsPath = path.join(originalCwd, '.agentful/decisions.json');
      const featureDir = path.join(originalCwd, '.claude/product/features');

      try {
        fs.mkdirSync(path.join(originalCwd, '.agentful'), { recursive: true });
        fs.mkdirSync(featureDir, { recursive: true });

        fs.writeFileSync(completionPath, JSON.stringify({ domains: {} }));
        fs.writeFileSync(decisionsPath, JSON.stringify({}));
        fs.writeFileSync(
          path.join(featureDir, 'test.md'),
          '# Test'
        );

        const result = runPreFeature({
          AGENTFUL_FEATURE: 'test'
        });

        // Should handle missing pending array
        expect(result.stderr).not.toContain('is blocked by decisions');
      } finally {
        fs.rmSync(path.join(originalCwd, '.claude'), { recursive: true, force: true });
        fs.rmSync(path.join(originalCwd, '.agentful'), { recursive: true, force: true });
      }
    });

    it('should handle partial path match in blocking array', () => {
      const completionPath = path.join(originalCwd, '.agentful/completion.json');
      const decisionsPath = path.join(originalCwd, '.agentful/decisions.json');
      const featureDir = path.join(originalCwd, '.claude/product/domains/auth/features');

      try {
        fs.mkdirSync(path.join(originalCwd, '.agentful'), { recursive: true });
        fs.mkdirSync(featureDir, { recursive: true });

        fs.writeFileSync(
          completionPath,
          JSON.stringify({
            domains: {
              'auth': { status: 'in-progress' }
            }
          })
        );
        fs.writeFileSync(
          decisionsPath,
          JSON.stringify({
            pending: [
              {
                id: 'DEC-AUTH',
                blocking: ['auth/login']
              }
            ]
          })
        );
        fs.writeFileSync(
          path.join(featureDir, 'login.md'),
          '# Test'
        );

        const result = runPreFeature({
          AGENTFUL_FEATURE: 'login',
          AGENTFUL_DOMAIN: 'auth'
        });

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain("ERROR: Feature 'login' is blocked by decisions: DEC-AUTH");
      } finally {
        fs.rmSync(path.join(originalCwd, '.claude'), { recursive: true, force: true });
        fs.rmSync(path.join(originalCwd, '.agentful'), { recursive: true, force: true });
      }
    });
  });

  describe('Check 5: Tech Stack Analysis (architecture.json)', () => {
    it('should warn when tech stack is null', () => {
      const completionPath = path.join(originalCwd, '.agentful/completion.json');
      const architecturePath = path.join(originalCwd, '.agentful/architecture.json');
      const featureDir = path.join(originalCwd, '.claude/product/features');

      try {
        fs.mkdirSync(path.join(originalCwd, '.agentful'), { recursive: true });
        fs.mkdirSync(featureDir, { recursive: true });

        fs.writeFileSync(completionPath, JSON.stringify({ domains: {} }));
        fs.writeFileSync(
          architecturePath,
          JSON.stringify({ techStack: null })
        );
        fs.writeFileSync(
          path.join(featureDir, 'test.md'),
          '# Test'
        );

        const result = runPreFeature({
          AGENTFUL_FEATURE: 'test'
        });

        expect(result.exitCode).toBe(0); // Warning, not error
        expect(result.stdout).toContain('WARNING: Tech stack not analyzed. Run /agentful-generate');
      } finally {
        fs.rmSync(path.join(originalCwd, '.claude'), { recursive: true, force: true });
        fs.rmSync(path.join(originalCwd, '.agentful'), { recursive: true, force: true });
      }
    });

    it('should warn when tech stack is missing', () => {
      const completionPath = path.join(originalCwd, '.agentful/completion.json');
      const architecturePath = path.join(originalCwd, '.agentful/architecture.json');
      const featureDir = path.join(originalCwd, '.claude/product/features');

      try {
        fs.mkdirSync(path.join(originalCwd, '.agentful'), { recursive: true });
        fs.mkdirSync(featureDir, { recursive: true });

        fs.writeFileSync(completionPath, JSON.stringify({ domains: {} }));
        fs.writeFileSync(architecturePath, JSON.stringify({}));
        fs.writeFileSync(
          path.join(featureDir, 'test.md'),
          '# Test'
        );

        const result = runPreFeature({
          AGENTFUL_FEATURE: 'test'
        });

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('WARNING: Tech stack not analyzed. Run /agentful-generate');
      } finally {
        fs.rmSync(path.join(originalCwd, '.claude'), { recursive: true, force: true });
        fs.rmSync(path.join(originalCwd, '.agentful'), { recursive: true, force: true });
      }
    });

    it('should not warn when tech stack is analyzed', () => {
      const completionPath = path.join(originalCwd, '.agentful/completion.json');
      const architecturePath = path.join(originalCwd, '.agentful/architecture.json');
      const featureDir = path.join(originalCwd, '.claude/product/features');

      try {
        fs.mkdirSync(path.join(originalCwd, '.agentful'), { recursive: true });
        fs.mkdirSync(featureDir, { recursive: true });

        fs.writeFileSync(completionPath, JSON.stringify({ domains: {} }));
        fs.writeFileSync(
          architecturePath,
          JSON.stringify({
            techStack: {
              frontend: 'React',
              backend: 'Node.js'
            }
          })
        );
        fs.writeFileSync(
          path.join(featureDir, 'test.md'),
          '# Test'
        );

        const result = runPreFeature({
          AGENTFUL_FEATURE: 'test'
        });

        expect(result.stdout).not.toContain('WARNING: Tech stack not analyzed');
      } finally {
        fs.rmSync(path.join(originalCwd, '.claude'), { recursive: true, force: true });
        fs.rmSync(path.join(originalCwd, '.agentful'), { recursive: true, force: true });
      }
    });

    it('should not warn when architecture.json does not exist', () => {
      const completionPath = path.join(originalCwd, '.agentful/completion.json');
      const featureDir = path.join(originalCwd, '.claude/product/features');

      try {
        fs.mkdirSync(path.join(originalCwd, '.agentful'), { recursive: true });
        fs.mkdirSync(featureDir, { recursive: true });

        fs.writeFileSync(completionPath, JSON.stringify({ domains: {} }));
        fs.writeFileSync(
          path.join(featureDir, 'test.md'),
          '# Test'
        );

        const result = runPreFeature({
          AGENTFUL_FEATURE: 'test'
        });

        expect(result.stdout).not.toContain('WARNING: Tech stack not analyzed');
      } finally {
        fs.rmSync(path.join(originalCwd, '.claude'), { recursive: true, force: true });
        fs.rmSync(path.join(originalCwd, '.agentful'), { recursive: true, force: true });
      }
    });

    it('should handle invalid JSON in architecture.json gracefully', () => {
      const completionPath = path.join(originalCwd, '.agentful/completion.json');
      const architecturePath = path.join(originalCwd, '.agentful/architecture.json');
      const featureDir = path.join(originalCwd, '.claude/product/features');

      try {
        fs.mkdirSync(path.join(originalCwd, '.agentful'), { recursive: true });
        fs.mkdirSync(featureDir, { recursive: true });

        fs.writeFileSync(completionPath, JSON.stringify({ domains: {} }));
        fs.writeFileSync(architecturePath, 'invalid json');
        fs.writeFileSync(
          path.join(featureDir, 'test.md'),
          '# Test'
        );

        const result = runPreFeature({
          AGENTFUL_FEATURE: 'test'
        });

        // Should not crash or warn on invalid JSON
        expect(result.stdout).not.toContain('WARNING: Tech stack not analyzed');
      } finally {
        fs.rmSync(path.join(originalCwd, '.claude'), { recursive: true, force: true });
        fs.rmSync(path.join(originalCwd, '.agentful'), { recursive: true, force: true });
      }
    });
  });

  describe('Check 6: Required Agents Exist', () => {
    it('should warn when backend agent is missing', () => {
      const completionPath = path.join(originalCwd, '.agentful/completion.json');
      const featureDir = path.join(originalCwd, '.claude/product/features');
      const agentsDir = path.join(originalCwd, '.claude/agents');

      try {
        fs.mkdirSync(path.join(originalCwd, '.agentful'), { recursive: true });
        fs.mkdirSync(featureDir, { recursive: true });
        fs.mkdirSync(agentsDir, { recursive: true });

        fs.writeFileSync(completionPath, JSON.stringify({ domains: {} }));
        fs.writeFileSync(path.join(featureDir, 'test.md'), '# Test');

        // Create all agents except backend
        fs.writeFileSync(path.join(agentsDir, 'frontend.md'), '# Frontend');
        fs.writeFileSync(path.join(agentsDir, 'tester.md'), '# Tester');
        fs.writeFileSync(path.join(agentsDir, 'reviewer.md'), '# Reviewer');

        const result = runPreFeature({
          AGENTFUL_FEATURE: 'test'
        });

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('WARNING: Core agent missing: .claude/agents/backend.md');
      } finally {
        fs.rmSync(path.join(originalCwd, '.claude'), { recursive: true, force: true });
        fs.rmSync(path.join(originalCwd, '.agentful'), { recursive: true, force: true });
      }
    });

    it('should warn when frontend agent is missing', () => {
      const completionPath = path.join(originalCwd, '.agentful/completion.json');
      const featureDir = path.join(originalCwd, '.claude/product/features');
      const agentsDir = path.join(originalCwd, '.claude/agents');

      try {
        fs.mkdirSync(path.join(originalCwd, '.agentful'), { recursive: true });
        fs.mkdirSync(featureDir, { recursive: true });
        fs.mkdirSync(agentsDir, { recursive: true });

        fs.writeFileSync(completionPath, JSON.stringify({ domains: {} }));
        fs.writeFileSync(path.join(featureDir, 'test.md'), '# Test');

        // Create all agents except frontend
        fs.writeFileSync(path.join(agentsDir, 'backend.md'), '# Backend');
        fs.writeFileSync(path.join(agentsDir, 'tester.md'), '# Tester');
        fs.writeFileSync(path.join(agentsDir, 'reviewer.md'), '# Reviewer');

        const result = runPreFeature({
          AGENTFUL_FEATURE: 'test'
        });

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('WARNING: Core agent missing: .claude/agents/frontend.md');
      } finally {
        fs.rmSync(path.join(originalCwd, '.claude'), { recursive: true, force: true });
        fs.rmSync(path.join(originalCwd, '.agentful'), { recursive: true, force: true });
      }
    });

    it('should warn when tester agent is missing', () => {
      const completionPath = path.join(originalCwd, '.agentful/completion.json');
      const featureDir = path.join(originalCwd, '.claude/product/features');
      const agentsDir = path.join(originalCwd, '.claude/agents');

      try {
        fs.mkdirSync(path.join(originalCwd, '.agentful'), { recursive: true });
        fs.mkdirSync(featureDir, { recursive: true });
        fs.mkdirSync(agentsDir, { recursive: true });

        fs.writeFileSync(completionPath, JSON.stringify({ domains: {} }));
        fs.writeFileSync(path.join(featureDir, 'test.md'), '# Test');

        // Create all agents except tester
        fs.writeFileSync(path.join(agentsDir, 'backend.md'), '# Backend');
        fs.writeFileSync(path.join(agentsDir, 'frontend.md'), '# Frontend');
        fs.writeFileSync(path.join(agentsDir, 'reviewer.md'), '# Reviewer');

        const result = runPreFeature({
          AGENTFUL_FEATURE: 'test'
        });

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('WARNING: Core agent missing: .claude/agents/tester.md');
      } finally {
        fs.rmSync(path.join(originalCwd, '.claude'), { recursive: true, force: true });
        fs.rmSync(path.join(originalCwd, '.agentful'), { recursive: true, force: true });
      }
    });

    it('should warn when reviewer agent is missing', () => {
      const completionPath = path.join(originalCwd, '.agentful/completion.json');
      const featureDir = path.join(originalCwd, '.claude/product/features');
      const agentsDir = path.join(originalCwd, '.claude/agents');

      try {
        fs.mkdirSync(path.join(originalCwd, '.agentful'), { recursive: true });
        fs.mkdirSync(featureDir, { recursive: true });
        fs.mkdirSync(agentsDir, { recursive: true });

        fs.writeFileSync(completionPath, JSON.stringify({ domains: {} }));
        fs.writeFileSync(path.join(featureDir, 'test.md'), '# Test');

        // Create all agents except reviewer
        fs.writeFileSync(path.join(agentsDir, 'backend.md'), '# Backend');
        fs.writeFileSync(path.join(agentsDir, 'frontend.md'), '# Frontend');
        fs.writeFileSync(path.join(agentsDir, 'tester.md'), '# Tester');

        const result = runPreFeature({
          AGENTFUL_FEATURE: 'test'
        });

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('WARNING: Core agent missing: .claude/agents/reviewer.md');
      } finally {
        fs.rmSync(path.join(originalCwd, '.claude'), { recursive: true, force: true });
        fs.rmSync(path.join(originalCwd, '.agentful'), { recursive: true, force: true });
      }
    });

    it('should warn for multiple missing agents', () => {
      const completionPath = path.join(originalCwd, '.agentful/completion.json');
      const featureDir = path.join(originalCwd, '.claude/product/features');
      const agentsDir = path.join(originalCwd, '.claude/agents');

      try {
        fs.mkdirSync(path.join(originalCwd, '.agentful'), { recursive: true });
        fs.mkdirSync(featureDir, { recursive: true });
        fs.mkdirSync(agentsDir, { recursive: true });

        fs.writeFileSync(completionPath, JSON.stringify({ domains: {} }));
        fs.writeFileSync(path.join(featureDir, 'test.md'), '# Test');

        // Only create backend agent
        fs.writeFileSync(path.join(agentsDir, 'backend.md'), '# Backend');

        const result = runPreFeature({
          AGENTFUL_FEATURE: 'test'
        });

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('WARNING: Core agent missing: .claude/agents/frontend.md');
        expect(result.stdout).toContain('WARNING: Core agent missing: .claude/agents/tester.md');
        expect(result.stdout).toContain('WARNING: Core agent missing: .claude/agents/reviewer.md');
        expect(result.stdout).toContain('Pre-feature validation passed with 3 warning(s)');
      } finally {
        fs.rmSync(path.join(originalCwd, '.claude'), { recursive: true, force: true });
        fs.rmSync(path.join(originalCwd, '.agentful'), { recursive: true, force: true });
      }
    });

    it('should not warn when all agents exist', () => {
      const completionPath = path.join(originalCwd, '.agentful/completion.json');
      const featureDir = path.join(originalCwd, '.claude/product/features');
      const agentsDir = path.join(originalCwd, '.claude/agents');

      try {
        fs.mkdirSync(path.join(originalCwd, '.agentful'), { recursive: true });
        fs.mkdirSync(featureDir, { recursive: true });
        fs.mkdirSync(agentsDir, { recursive: true });

        fs.writeFileSync(completionPath, JSON.stringify({ domains: {} }));
        fs.writeFileSync(path.join(featureDir, 'test.md'), '# Test');

        // Create all required agents
        fs.writeFileSync(path.join(agentsDir, 'backend.md'), '# Backend');
        fs.writeFileSync(path.join(agentsDir, 'frontend.md'), '# Frontend');
        fs.writeFileSync(path.join(agentsDir, 'tester.md'), '# Tester');
        fs.writeFileSync(path.join(agentsDir, 'reviewer.md'), '# Reviewer');

        const result = runPreFeature({
          AGENTFUL_FEATURE: 'test'
        });

        expect(result.exitCode).toBe(0);
        expect(result.stdout).not.toContain('WARNING: Core agent missing');
      } finally {
        fs.rmSync(path.join(originalCwd, '.claude'), { recursive: true, force: true });
        fs.rmSync(path.join(originalCwd, '.agentful'), { recursive: true, force: true });
      }
    });
  });

  describe('Exit Codes and Messages', () => {
    it('should exit 1 with multiple errors', () => {
      const result = runPreFeature({
        AGENTFUL_FEATURE: 'nonexistent'
      });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('ERROR: Feature file not found');
      expect(result.stderr).toContain('ERROR: .agentful/completion.json not found');
      // Summary messages go to stdout via console.log
      const output = result.stdout + result.stderr;
      expect(output).toContain('Pre-feature validation failed with 2 error(s)');
      expect(output).toContain('Feature: nonexistent');
    });

    it('should exit 1 with error and show domain in output', () => {
      const result = runPreFeature({
        AGENTFUL_FEATURE: 'nonexistent',
        AGENTFUL_DOMAIN: 'test-domain'
      });

      expect(result.exitCode).toBe(1);
      // Summary messages go to stdout via console.log
      const output = result.stdout + result.stderr;
      expect(output).toContain('Pre-feature validation failed');
      expect(output).toContain('Feature: nonexistent');
      expect(output).toContain('Domain: test-domain');
    });

    it('should exit 0 with warnings only', () => {
      const completionPath = path.join(originalCwd, '.agentful/completion.json');
      const featureDir = path.join(originalCwd, '.claude/product/features');
      const agentsDir = path.join(originalCwd, '.claude/agents');

      try {
        fs.mkdirSync(path.join(originalCwd, '.agentful'), { recursive: true });
        fs.mkdirSync(featureDir, { recursive: true });
        fs.mkdirSync(agentsDir, { recursive: true });

        fs.writeFileSync(completionPath, JSON.stringify({ domains: {} }));
        fs.writeFileSync(path.join(featureDir, 'test.md'), '# Test');

        // Don't create any agents (4 warnings)

        const result = runPreFeature({
          AGENTFUL_FEATURE: 'test'
        });

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('Pre-feature validation passed with 4 warning(s)');
      } finally {
        fs.rmSync(path.join(originalCwd, '.claude'), { recursive: true, force: true });
        fs.rmSync(path.join(originalCwd, '.agentful'), { recursive: true, force: true });
      }
    });

    it('should exit 0 with no errors or warnings', () => {
      const completionPath = path.join(originalCwd, '.agentful/completion.json');
      const featureDir = path.join(originalCwd, '.claude/product/features');
      const agentsDir = path.join(originalCwd, '.claude/agents');

      try {
        fs.mkdirSync(path.join(originalCwd, '.agentful'), { recursive: true });
        fs.mkdirSync(featureDir, { recursive: true });
        fs.mkdirSync(agentsDir, { recursive: true });

        fs.writeFileSync(completionPath, JSON.stringify({ domains: {} }));
        fs.writeFileSync(path.join(featureDir, 'test.md'), '# Test');

        // Create all agents
        fs.writeFileSync(path.join(agentsDir, 'backend.md'), '# Backend');
        fs.writeFileSync(path.join(agentsDir, 'frontend.md'), '# Frontend');
        fs.writeFileSync(path.join(agentsDir, 'tester.md'), '# Tester');
        fs.writeFileSync(path.join(agentsDir, 'reviewer.md'), '# Reviewer');

        const result = runPreFeature({
          AGENTFUL_FEATURE: 'test'
        });

        expect(result.exitCode).toBe(0);
        expect(result.stdout).not.toContain('warning');
        expect(result.stderr).not.toContain('ERROR');
      } finally {
        fs.rmSync(path.join(originalCwd, '.claude'), { recursive: true, force: true });
        fs.rmSync(path.join(originalCwd, '.agentful'), { recursive: true, force: true });
      }
    });
  });

  describe('JSON Parse Error Handling', () => {
    it('should handle invalid completion.json gracefully', () => {
      const completionPath = path.join(originalCwd, '.agentful/completion.json');
      const featureDir = path.join(originalCwd, '.claude/product/features');

      try {
        fs.mkdirSync(path.join(originalCwd, '.agentful'), { recursive: true });
        fs.mkdirSync(featureDir, { recursive: true });

        fs.writeFileSync(completionPath, 'invalid json {]');
        fs.writeFileSync(path.join(featureDir, 'test.md'), '# Test');

        const result = runPreFeature({
          AGENTFUL_FEATURE: 'test'
        });

        // Should not crash, should skip checks that require parsing
        expect(result.exitCode).toBe(0);
      } finally {
        fs.rmSync(path.join(originalCwd, '.claude'), { recursive: true, force: true });
        fs.rmSync(path.join(originalCwd, '.agentful'), { recursive: true, force: true });
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle feature with special characters in name', () => {
      const completionPath = path.join(originalCwd, '.agentful/completion.json');
      const featureDir = path.join(originalCwd, '.claude/product/features');

      try {
        fs.mkdirSync(path.join(originalCwd, '.agentful'), { recursive: true });
        fs.mkdirSync(featureDir, { recursive: true });

        fs.writeFileSync(completionPath, JSON.stringify({ domains: {} }));
        fs.writeFileSync(path.join(featureDir, 'my-feature-v2.md'), '# Test');

        const result = runPreFeature({
          AGENTFUL_FEATURE: 'my-feature-v2'
        });

        expect(result.stderr).not.toContain('ERROR: Feature file not found');
      } finally {
        fs.rmSync(path.join(originalCwd, '.claude'), { recursive: true, force: true });
        fs.rmSync(path.join(originalCwd, '.agentful'), { recursive: true, force: true });
      }
    });

    it('should handle domain with special characters in name', () => {
      const completionPath = path.join(originalCwd, '.agentful/completion.json');
      const featureDir = path.join(originalCwd, '.claude/product/domains/user-auth-v2/features');

      try {
        fs.mkdirSync(path.join(originalCwd, '.agentful'), { recursive: true });
        fs.mkdirSync(featureDir, { recursive: true });

        fs.writeFileSync(
          completionPath,
          JSON.stringify({
            domains: {
              'user-auth-v2': { status: 'in-progress' }
            }
          })
        );
        fs.writeFileSync(path.join(featureDir, 'login.md'), '# Test');

        const result = runPreFeature({
          AGENTFUL_FEATURE: 'login',
          AGENTFUL_DOMAIN: 'user-auth-v2'
        });

        expect(result.stderr).not.toContain('ERROR: Feature file not found');
      } finally {
        fs.rmSync(path.join(originalCwd, '.claude'), { recursive: true, force: true });
        fs.rmSync(path.join(originalCwd, '.agentful'), { recursive: true, force: true });
      }
    });

    it('should handle empty blocking array in decision', () => {
      const completionPath = path.join(originalCwd, '.agentful/completion.json');
      const decisionsPath = path.join(originalCwd, '.agentful/decisions.json');
      const featureDir = path.join(originalCwd, '.claude/product/features');

      try {
        fs.mkdirSync(path.join(originalCwd, '.agentful'), { recursive: true });
        fs.mkdirSync(featureDir, { recursive: true });

        fs.writeFileSync(completionPath, JSON.stringify({ domains: {} }));
        fs.writeFileSync(
          decisionsPath,
          JSON.stringify({
            pending: [
              {
                id: 'DEC-001',
                blocking: []
              }
            ]
          })
        );
        fs.writeFileSync(path.join(featureDir, 'test.md'), '# Test');

        const result = runPreFeature({
          AGENTFUL_FEATURE: 'test'
        });

        expect(result.stderr).not.toContain('is blocked by decisions');
      } finally {
        fs.rmSync(path.join(originalCwd, '.claude'), { recursive: true, force: true });
        fs.rmSync(path.join(originalCwd, '.agentful'), { recursive: true, force: true });
      }
    });

    it('should handle decision without blocking property', () => {
      const completionPath = path.join(originalCwd, '.agentful/completion.json');
      const decisionsPath = path.join(originalCwd, '.agentful/decisions.json');
      const featureDir = path.join(originalCwd, '.claude/product/features');

      try {
        fs.mkdirSync(path.join(originalCwd, '.agentful'), { recursive: true });
        fs.mkdirSync(featureDir, { recursive: true });

        fs.writeFileSync(completionPath, JSON.stringify({ domains: {} }));
        fs.writeFileSync(
          decisionsPath,
          JSON.stringify({
            pending: [
              {
                id: 'DEC-001'
                // No blocking property
              }
            ]
          })
        );
        fs.writeFileSync(path.join(featureDir, 'test.md'), '# Test');

        const result = runPreFeature({
          AGENTFUL_FEATURE: 'test'
        });

        expect(result.stderr).not.toContain('is blocked by decisions');
      } finally {
        fs.rmSync(path.join(originalCwd, '.claude'), { recursive: true, force: true });
        fs.rmSync(path.join(originalCwd, '.agentful'), { recursive: true, force: true });
      }
    });
  });

  describe('Full Integration Scenarios', () => {
    it('should pass all checks in a valid hierarchical project', () => {
      const completionPath = path.join(originalCwd, '.agentful/completion.json');
      const architecturePath = path.join(originalCwd, '.agentful/architecture.json');
      const decisionsPath = path.join(originalCwd, '.agentful/decisions.json');
      const featureDir = path.join(originalCwd, '.claude/product/domains/auth/features');
      const agentsDir = path.join(originalCwd, '.claude/agents');

      try {
        fs.mkdirSync(path.join(originalCwd, '.agentful'), { recursive: true });
        fs.mkdirSync(featureDir, { recursive: true });
        fs.mkdirSync(agentsDir, { recursive: true });

        fs.writeFileSync(
          completionPath,
          JSON.stringify({
            domains: {
              'auth': { status: 'in-progress' }
            }
          })
        );
        fs.writeFileSync(
          architecturePath,
          JSON.stringify({
            techStack: {
              frontend: 'React',
              backend: 'Node.js'
            }
          })
        );
        fs.writeFileSync(
          decisionsPath,
          JSON.stringify({
            pending: []
          })
        );
        fs.writeFileSync(path.join(featureDir, 'login.md'), '# Login Feature');

        // Create all agents
        fs.writeFileSync(path.join(agentsDir, 'backend.md'), '# Backend');
        fs.writeFileSync(path.join(agentsDir, 'frontend.md'), '# Frontend');
        fs.writeFileSync(path.join(agentsDir, 'tester.md'), '# Tester');
        fs.writeFileSync(path.join(agentsDir, 'reviewer.md'), '# Reviewer');

        const result = runPreFeature({
          AGENTFUL_FEATURE: 'login',
          AGENTFUL_DOMAIN: 'auth'
        });

        expect(result.exitCode).toBe(0);
        expect(result.stderr).not.toContain('ERROR');
        expect(result.stdout).not.toContain('WARNING');
      } finally {
        fs.rmSync(path.join(originalCwd, '.claude'), { recursive: true, force: true });
        fs.rmSync(path.join(originalCwd, '.agentful'), { recursive: true, force: true });
      }
    });

    it('should fail with multiple errors in invalid project', () => {
      const result = runPreFeature({
        AGENTFUL_FEATURE: 'nonexistent-feature',
        AGENTFUL_DOMAIN: 'nonexistent-domain'
      });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('ERROR: Feature file not found');
      expect(result.stderr).toContain('ERROR: .agentful/completion.json not found');
      // Summary messages go to stdout via console.log
      const output = result.stdout + result.stderr;
      expect(output).toContain('Pre-feature validation failed with 2 error(s)');
    });
  });
});
