import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..', '..', '..');
const healthCheckPath = path.join(projectRoot, 'bin', 'hooks', 'health-check.js');

/**
 * Health Check Unit Tests
 *
 * Comprehensive tests for bin/hooks/health-check.js
 * Tests all critical checks, warning checks, and edge cases
 * Target: 100% code coverage
 *
 * Note: These tests use a subprocess approach to properly isolate
 * each test execution since health-check.js runs immediately on import.
 */

describe('Health Check', () => {
  let testDir;

  beforeEach(async () => {
    // Create a temporary test directory in OS temp dir
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'health-check-test-'));
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.rm(testDir, { recursive: true, force: true });
  });

  /**
   * Helper to run health-check.js in a subprocess
   */
  function runHealthCheck() {
    const result = spawnSync('node', [healthCheckPath], {
      cwd: testDir,
      encoding: 'utf8',
      timeout: 5000
    });

    return {
      exitCode: result.status,
      stdout: result.stdout || '',
      stderr: result.stderr || ''
    };
  }

  /**
   * Helper to create directory structure
   */
  async function createDir(dirPath) {
    await fs.mkdir(path.join(testDir, dirPath), { recursive: true });
  }

  /**
   * Helper to create file with content
   */
  async function createFile(filePath, content = '{}') {
    const fullPath = path.join(testDir, filePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content, 'utf8');
  }

  /**
   * Helper to create all required directories
   */
  async function createAllDirectories() {
    await createDir('.agentful');
    await createDir('.claude/agents');
    await createDir('.claude/commands');
    await createDir('.claude/product');
    await createDir('.claude/skills');
  }

  /**
   * Helper to create all required state files
   */
  async function createAllStateFiles() {
    await createFile('.agentful/state.json', '{}');
    await createFile('.agentful/completion.json', '{}');
    await createFile('.agentful/decisions.json', '{}');
  }

  /**
   * Helper to create all core agents
   */
  async function createAllCoreAgents() {
    const agents = [
      'orchestrator',
      'backend',
      'frontend',
      'tester',
      'reviewer',
      'fixer',
      'architect',
      'product-analyzer'
    ];

    for (const agent of agents) {
      await createFile(`.claude/agents/${agent}.md`, '# Agent');
    }
  }

  describe('Critical Check 1: .agentful directory', () => {
    it('should exit with message when .agentful directory is missing', () => {
      const result = runHealthCheck();

      expect(result.stdout).toContain('❌ Agentful not initialized.');
      expect(result.stdout).toContain('Run: npx @itz4blitz/agentful init');
      expect(result.exitCode).toBe(0);
    });

    it('should proceed to other checks when .agentful exists', async () => {
      await createDir('.agentful');

      const result = runHealthCheck();

      // Should check state files (and report them as missing)
      expect(result.stdout).toContain('state.json');
      expect(result.exitCode).toBe(0);
    });
  });

  describe('Critical Check 2: Core state files', () => {
    it('should report error for missing state.json', async () => {
      await createDir('.agentful');
      await createFile('.agentful/completion.json');
      await createFile('.agentful/decisions.json');
      await createAllDirectories();
      await createFile('.claude/settings.json');
      await createAllCoreAgents();

      const result = runHealthCheck();

      expect(result.stdout).toContain('❌ Missing .agentful/state.json');
      expect(result.stdout).toContain('❌ Found 1 critical issue(s)');
      expect(result.exitCode).toBe(0);
    });

    it('should report error for missing completion.json', async () => {
      await createDir('.agentful');
      await createFile('.agentful/state.json');
      await createFile('.agentful/decisions.json');
      await createAllDirectories();
      await createFile('.claude/settings.json');
      await createAllCoreAgents();

      const result = runHealthCheck();

      expect(result.stdout).toContain('❌ Missing .agentful/completion.json');
      expect(result.stdout).toContain('❌ Found 1 critical issue(s)');
      expect(result.exitCode).toBe(0);
    });

    it('should report error for missing decisions.json', async () => {
      await createDir('.agentful');
      await createFile('.agentful/state.json');
      await createFile('.agentful/completion.json');
      await createAllDirectories();
      await createFile('.claude/settings.json');
      await createAllCoreAgents();

      const result = runHealthCheck();

      expect(result.stdout).toContain('❌ Missing .agentful/decisions.json');
      expect(result.stdout).toContain('❌ Found 1 critical issue(s)');
      expect(result.exitCode).toBe(0);
    });

    it('should report multiple missing state files', async () => {
      await createDir('.agentful');
      await createAllDirectories();
      await createFile('.claude/settings.json');
      await createAllCoreAgents();

      const result = runHealthCheck();

      expect(result.stdout).toContain('❌ Missing .agentful/state.json');
      expect(result.stdout).toContain('❌ Missing .agentful/completion.json');
      expect(result.stdout).toContain('❌ Missing .agentful/decisions.json');
      expect(result.stdout).toContain('❌ Found 3 critical issue(s)');
      expect(result.exitCode).toBe(0);
    });
  });

  describe('Critical Check 3: .claude directory structure', () => {
    it('should report error for missing .claude/agents', async () => {
      await createDir('.agentful');
      await createAllStateFiles();
      await createDir('.claude/commands');
      await createDir('.claude/product');
      await createDir('.claude/skills');
      await createFile('.claude/settings.json');

      const result = runHealthCheck();

      expect(result.stdout).toContain('❌ Missing .claude/agents/');
      expect(result.exitCode).toBe(0);
    });

    it('should report error for missing .claude/commands', async () => {
      await createDir('.agentful');
      await createAllStateFiles();
      await createDir('.claude/agents');
      await createDir('.claude/product');
      await createDir('.claude/skills');
      await createFile('.claude/settings.json');
      await createAllCoreAgents();

      const result = runHealthCheck();

      expect(result.stdout).toContain('❌ Missing .claude/commands/');
      expect(result.exitCode).toBe(0);
    });

    it('should report error for missing .claude/product', async () => {
      await createDir('.agentful');
      await createAllStateFiles();
      await createDir('.claude/agents');
      await createDir('.claude/commands');
      await createDir('.claude/skills');
      await createFile('.claude/settings.json');
      await createAllCoreAgents();

      const result = runHealthCheck();

      expect(result.stdout).toContain('❌ Missing .claude/product/');
      expect(result.exitCode).toBe(0);
    });

    it('should report error for missing .claude/skills', async () => {
      await createDir('.agentful');
      await createAllStateFiles();
      await createDir('.claude/agents');
      await createDir('.claude/commands');
      await createDir('.claude/product');
      await createFile('.claude/settings.json');
      await createAllCoreAgents();

      const result = runHealthCheck();

      expect(result.stdout).toContain('❌ Missing .claude/skills/');
      expect(result.exitCode).toBe(0);
    });

    it('should report all missing .claude directories', async () => {
      await createDir('.agentful');
      await createAllStateFiles();
      await createFile('.claude/settings.json');

      const result = runHealthCheck();

      expect(result.stdout).toContain('❌ Missing .claude/agents/');
      expect(result.stdout).toContain('❌ Missing .claude/commands/');
      expect(result.stdout).toContain('❌ Missing .claude/product/');
      expect(result.stdout).toContain('❌ Missing .claude/skills/');
      expect(result.exitCode).toBe(0);
    });
  });

  describe('Critical Check 4: Core agents', () => {
    const coreAgents = [
      'orchestrator',
      'backend',
      'frontend',
      'tester',
      'reviewer',
      'fixer',
      'architect',
      'product-analyzer'
    ];

    coreAgents.forEach((agent) => {
      it(`should report error for missing ${agent} agent`, async () => {
        await createDir('.agentful');
        await createAllStateFiles();
        await createAllDirectories();
        await createFile('.claude/settings.json');

        // Create all agents except the one being tested
        for (const a of coreAgents.filter(a => a !== agent)) {
          await createFile(`.claude/agents/${a}.md`, '# Agent');
        }

        const result = runHealthCheck();

        expect(result.stdout).toContain(`❌ Missing core agent: .claude/agents/${agent}.md`);
        expect(result.exitCode).toBe(0);
      });
    });

    it('should report multiple missing core agents', async () => {
      await createDir('.agentful');
      await createAllStateFiles();
      await createAllDirectories();
      await createFile('.claude/settings.json');

      // Only create orchestrator and backend
      await createFile('.claude/agents/orchestrator.md', '# Agent');
      await createFile('.claude/agents/backend.md', '# Agent');

      const result = runHealthCheck();

      expect(result.stdout).toContain('❌ Missing core agent: .claude/agents/frontend.md');
      expect(result.stdout).toContain('❌ Missing core agent: .claude/agents/tester.md');
      expect(result.stdout).toContain('❌ Missing core agent: .claude/agents/reviewer.md');
      expect(result.stdout).toContain('❌ Missing core agent: .claude/agents/fixer.md');
      expect(result.stdout).toContain('❌ Missing core agent: .claude/agents/architect.md');
      expect(result.stdout).toContain('❌ Missing core agent: .claude/agents/product-analyzer.md');
      expect(result.exitCode).toBe(0);
    });
  });

  describe('Critical Check 5: Product specification', () => {
    it('should pass when .claude/product/index.md exists', async () => {
      await createDir('.agentful');
      await createAllStateFiles();
      await createAllDirectories();
      await createFile('.claude/settings.json');
      await createAllCoreAgents();
      await createFile('.claude/product/index.md', '# Product');

      const result = runHealthCheck();

      // Should not warn about product specification
      expect(result.stdout).not.toContain('No product specification found');
      expect(result.exitCode).toBe(0);
    });

    it('should pass when hierarchical product structure exists', async () => {
      await createDir('.agentful');
      await createAllStateFiles();
      await createAllDirectories();
      await createFile('.claude/settings.json');
      await createAllCoreAgents();
      await createDir('.claude/product/domains/auth');
      await createFile('.claude/product/domains/auth/index.md', '# Auth');

      const result = runHealthCheck();

      expect(result.stdout).not.toContain('No product specification found');
      expect(result.exitCode).toBe(0);
    });

    it('should warn when no product specification exists', async () => {
      await createDir('.agentful');
      await createAllStateFiles();
      await createAllDirectories();
      await createFile('.claude/settings.json');
      await createAllCoreAgents();

      const result = runHealthCheck();

      expect(result.stdout).toContain('⚠️  No product specification found');
      expect(result.stdout).toContain('Create .claude/product/index.md or run /agentful-product');
      expect(result.exitCode).toBe(0);
    });

    it('should warn when domains directory exists but no index.md files', async () => {
      await createDir('.agentful');
      await createAllStateFiles();
      await createAllDirectories();
      await createFile('.claude/settings.json');
      await createAllCoreAgents();
      await createDir('.claude/product/domains/auth');
      await createDir('.claude/product/domains/payments');
      // Don't create index.md files in domains

      const result = runHealthCheck();

      expect(result.stdout).toContain('⚠️  No product specification found');
      expect(result.exitCode).toBe(0);
    });

    it('should handle empty domains directory gracefully', async () => {
      await createDir('.agentful');
      await createAllStateFiles();
      await createAllDirectories();
      await createFile('.claude/settings.json');
      await createAllCoreAgents();
      await createDir('.claude/product/domains');
      // Empty domains directory

      const result = runHealthCheck();

      expect(result.stdout).toContain('⚠️  No product specification found');
      expect(result.exitCode).toBe(0);
    });
  });

  describe('Critical Check 6: Settings file', () => {
    it('should report error when settings.json is missing', async () => {
      await createDir('.agentful');
      await createAllStateFiles();
      await createAllDirectories();
      await createAllCoreAgents();

      const result = runHealthCheck();

      expect(result.stdout).toContain('❌ Missing .claude/settings.json');
      expect(result.exitCode).toBe(0);
    });

    it('should report error when settings.json has invalid JSON', async () => {
      await createDir('.agentful');
      await createAllStateFiles();
      await createAllDirectories();
      await createAllCoreAgents();
      await createFile('.claude/settings.json', '{ invalid json }');

      const result = runHealthCheck();

      expect(result.stdout).toContain('❌ Invalid JSON in .claude/settings.json');
      expect(result.exitCode).toBe(0);
    });

    it('should pass when settings.json is valid', async () => {
      await createDir('.agentful');
      await createAllStateFiles();
      await createAllDirectories();
      await createAllCoreAgents();
      await createFile('.claude/settings.json', '{"project": "agentful"}');

      const result = runHealthCheck();

      // Should not mention settings.json errors
      expect(result.stdout).not.toContain('Missing .claude/settings.json');
      expect(result.stdout).not.toContain('Invalid JSON in .claude/settings.json');
      expect(result.exitCode).toBe(0);
    });
  });

  describe('Warning Check: Architecture analysis', () => {
    it('should warn when architecture.json is missing', async () => {
      await createDir('.agentful');
      await createAllStateFiles();
      await createAllDirectories();
      await createFile('.claude/settings.json');
      await createAllCoreAgents();

      const result = runHealthCheck();

      expect(result.stdout).toContain('⚠️  Tech stack not analyzed. Run /agentful-generate to:');
      expect(result.stdout).toContain('- Detect your tech stack');
      expect(result.stdout).toContain('- Discover business domains');
      expect(result.stdout).toContain('- Generate specialized agents');
      expect(result.exitCode).toBe(0);
    });

    it('should warn when architecture.json is missing techStack', async () => {
      await createDir('.agentful');
      await createAllStateFiles();
      await createAllDirectories();
      await createFile('.claude/settings.json');
      await createAllCoreAgents();
      await createFile('.agentful/architecture.json', '{"domains": ["auth", "payments"]}');

      const result = runHealthCheck();

      expect(result.stdout).toContain('⚠️  .agentful/architecture.json is malformed');
      expect(result.stdout).toContain('Run /agentful-generate to regenerate');
      expect(result.exitCode).toBe(0);
    });

    it('should warn when architecture.json is missing domains', async () => {
      await createDir('.agentful');
      await createAllStateFiles();
      await createAllDirectories();
      await createFile('.claude/settings.json');
      await createAllCoreAgents();
      await createFile('.agentful/architecture.json', '{"techStack": ["node", "react"]}');

      const result = runHealthCheck();

      expect(result.stdout).toContain('⚠️  .agentful/architecture.json is malformed');
      expect(result.exitCode).toBe(0);
    });

    it('should warn when architecture.json has invalid JSON', async () => {
      await createDir('.agentful');
      await createAllStateFiles();
      await createAllDirectories();
      await createFile('.claude/settings.json');
      await createAllCoreAgents();
      await createFile('.agentful/architecture.json', '{ invalid json }');

      const result = runHealthCheck();

      expect(result.stdout).toContain('⚠️  .agentful/architecture.json is malformed');
      expect(result.stdout).toContain('Run /agentful-generate to regenerate');
      expect(result.exitCode).toBe(0);
    });

    it('should pass when architecture.json is valid', async () => {
      await createDir('.agentful');
      await createAllStateFiles();
      await createAllDirectories();
      await createFile('.claude/settings.json');
      await createAllCoreAgents();
      await createFile('.agentful/architecture.json', '{"techStack": ["node", "react"], "domains": ["auth", "payments"]}');

      const result = runHealthCheck();

      // Should not warn about architecture
      expect(result.stdout).not.toContain('Tech stack not analyzed');
      expect(result.stdout).not.toContain('architecture.json is malformed');
      expect(result.exitCode).toBe(0);
    });
  });

  describe('Summary: All checks pass', () => {
    it('should show success message when all checks pass with no warnings', async () => {
      await createDir('.agentful');
      await createAllStateFiles();
      await createAllDirectories();
      await createFile('.claude/settings.json');
      await createAllCoreAgents();
      await createFile('.claude/product/index.md');
      await createFile('.agentful/architecture.json', '{"techStack": ["node"], "domains": ["auth"]}');

      const result = runHealthCheck();

      expect(result.stdout).toContain('✅ Agentful ready');
      expect(result.exitCode).toBe(0);
    });

    it('should show warning summary when warnings exist but no errors', async () => {
      await createDir('.agentful');
      await createAllStateFiles();
      await createAllDirectories();
      await createFile('.claude/settings.json');
      await createAllCoreAgents();
      // Missing architecture.json and product specification

      const result = runHealthCheck();

      expect(result.stdout).toContain('⚠️  Agentful ready with');
      expect(result.stdout).toContain('warning(s)');
      expect(result.exitCode).toBe(0);
    });
  });

  describe('Summary: Critical errors', () => {
    it('should exit with error message when critical issues exist', async () => {
      await createDir('.agentful');
      // Missing state files
      await createAllDirectories();
      await createFile('.claude/settings.json');
      await createAllCoreAgents();

      const result = runHealthCheck();

      expect(result.stdout).toContain('❌ Found');
      expect(result.stdout).toContain('critical issue(s)');
      expect(result.stdout).toContain('Run: npx @itz4blitz/agentful init');
      expect(result.exitCode).toBe(0);
    });

    it('should exit with correct error count', async () => {
      await createDir('.agentful');
      // Only missing state.json and completion.json
      await createFile('.agentful/decisions.json');
      await createAllDirectories();
      await createFile('.claude/settings.json');
      await createAllCoreAgents();

      const result = runHealthCheck();

      expect(result.stdout).toContain('❌ Missing .agentful/state.json');
      expect(result.stdout).toContain('❌ Missing .agentful/completion.json');
      expect(result.stdout).toContain('❌ Found 2 critical issue(s)');
      expect(result.exitCode).toBe(0);
    });
  });

  describe('Edge cases and boundary conditions', () => {
    it('should handle very large error counts', async () => {
      await createDir('.agentful');
      // Missing everything except .agentful directory

      const result = runHealthCheck();

      expect(result.stdout).toContain('❌ Found');
      expect(result.stdout).toContain('critical issue(s)');
      expect(result.exitCode).toBe(0);
    });

    it('should report warnings and errors separately', async () => {
      await createDir('.agentful');
      await createAllStateFiles();
      await createAllDirectories();
      await createFile('.claude/settings.json');
      await createAllCoreAgents();
      // Missing architecture.json (warning) and product spec (warning)

      const result = runHealthCheck();

      expect(result.stdout).toContain('⚠️');
      expect(result.stdout).not.toContain('❌');
      expect(result.exitCode).toBe(0);
    });

    it('should handle mixed warnings and no errors', async () => {
      await createDir('.agentful');
      await createAllStateFiles();
      await createAllDirectories();
      await createFile('.claude/settings.json');
      await createAllCoreAgents();
      await createFile('.claude/product/index.md');
      // Missing only architecture.json (1 warning)

      const result = runHealthCheck();

      expect(result.stdout).toContain('⚠️  Tech stack not analyzed');
      expect(result.stdout).toContain('⚠️  Agentful ready with 1 warning(s)');
      expect(result.exitCode).toBe(0);
    });
  });
});
