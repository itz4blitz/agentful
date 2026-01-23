import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import { validateAgentPreconditions } from '../../../bin/hooks/pre-agent.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('Pre-Agent Hook', () => {
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
      createAgent = false,
      agentName = 'test-agent',
      createStateFiles = false,
      stateContent = null,
      createFeature = false,
      featureName = 'test-feature',
      domainName = null
    } = options;

    // Create .claude/agents directory
    const agentsDir = path.join(testDir, '.claude', 'agents');
    fs.mkdirSync(agentsDir, { recursive: true });

    if (createAgent) {
      const agentFile = path.join(agentsDir, `${agentName}.md`);
      fs.writeFileSync(agentFile, '# Test Agent', 'utf-8');
    }

    // Create .agentful directory
    const agentfulDir = path.join(testDir, '.agentful');
    fs.mkdirSync(agentfulDir, { recursive: true });

    if (createStateFiles) {
      fs.writeFileSync(path.join(agentfulDir, 'completion.json'), '{}', 'utf-8');
      fs.writeFileSync(path.join(agentfulDir, 'decisions.json'), '[]', 'utf-8');

      if (stateContent !== null) {
        const stateFile = path.join(agentfulDir, 'state.json');
        if (typeof stateContent === 'string') {
          fs.writeFileSync(stateFile, stateContent, 'utf-8');
        } else {
          fs.writeFileSync(stateFile, JSON.stringify(stateContent, null, 2), 'utf-8');
        }
      } else {
        fs.writeFileSync(path.join(agentfulDir, 'state.json'), '{}', 'utf-8');
      }
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
  };

  describe('No agent specified', () => {
    it('should return success when agentName is empty', () => {
      const result = validateAgentPreconditions('');
      expect(result.errors).toBe(0);
      expect(result.exitCode).toBe(0);
    });

    it('should return success when agentName is undefined', () => {
      const result = validateAgentPreconditions();
      expect(result.errors).toBe(0);
      expect(result.exitCode).toBe(0);
    });
  });

  describe('Agent file checks', () => {
    it('should error when agent file does not exist', () => {
      setupTestDir({ createAgent: false });
      const result = validateAgentPreconditions('test-agent');
      expect(result.errors).toBeGreaterThan(0);
      expect(result.exitCode).toBe(1);
    });

    it('should pass when agent file exists', () => {
      setupTestDir({
        createAgent: true,
        agentName: 'backend',
        createStateFiles: true,
        stateContent: { current_phase: 'testing' }
      });
      const result = validateAgentPreconditions('backend');
      expect(result.errors).toBe(0);
      expect(result.exitCode).toBe(0);
    });
  });

  describe('State file checks', () => {
    it('should error when state files are missing', () => {
      setupTestDir({ createAgent: true, createStateFiles: false });
      const result = validateAgentPreconditions('test-agent');
      expect(result.errors).toBe(3);
      expect(result.exitCode).toBe(1);
    });

    it('should pass when all state files exist', () => {
      setupTestDir({
        createAgent: true,
        createStateFiles: true,
        stateContent: { current_phase: 'development' }
      });
      const result = validateAgentPreconditions('test-agent');
      expect(result.errors).toBe(0);
      expect(result.exitCode).toBe(0);
    });

    it('should error when state.json has invalid JSON', () => {
      setupTestDir({
        createAgent: true,
        createStateFiles: true,
        stateContent: 'invalid json {'
      });
      const result = validateAgentPreconditions('test-agent');
      expect(result.errors).toBeGreaterThan(0);
      expect(result.exitCode).toBe(1);
    });

    it('should error when state.json missing current_phase', () => {
      setupTestDir({
        createAgent: true,
        createStateFiles: true,
        stateContent: { some_other_field: 'value' }
      });
      const result = validateAgentPreconditions('test-agent');
      expect(result.errors).toBeGreaterThan(0);
      expect(result.exitCode).toBe(1);
    });
  });

  describe('Feature validation', () => {
    it('should find feature in flat structure', () => {
      setupTestDir({
        createAgent: true,
        createStateFiles: true,
        stateContent: { current_phase: 'development' },
        createFeature: true,
        featureName: 'login'
      });
      const result = validateAgentPreconditions('test-agent', 'login');
      expect(result.errors).toBe(0);
      expect(result.exitCode).toBe(0);
    });

    it('should find feature in hierarchical structure', () => {
      setupTestDir({
        createAgent: true,
        createStateFiles: true,
        stateContent: { current_phase: 'development' },
        createFeature: true,
        featureName: 'auth',
        domainName: 'security'
      });
      const result = validateAgentPreconditions('test-agent', 'auth', 'security');
      expect(result.errors).toBe(0);
      expect(result.exitCode).toBe(0);
    });

    it('should warn when feature not found but not block', () => {
      setupTestDir({
        createAgent: true,
        createStateFiles: true,
        stateContent: { current_phase: 'development' }
      });
      const result = validateAgentPreconditions('test-agent', 'nonexistent');
      expect(result.errors).toBe(0);
      expect(result.exitCode).toBe(0);
    });
  });

  describe('Orchestrator blocked status', () => {
    it('should warn when orchestrator is blocked', () => {
      setupTestDir({
        createAgent: true,
        createStateFiles: true,
        stateContent: {
          current_phase: 'development',
          blocked_on: ['decision-1', 'decision-2']
        }
      });
      const result = validateAgentPreconditions('test-agent');
      expect(result.errors).toBe(0);
      expect(result.exitCode).toBe(0);
    });

    it('should pass when orchestrator not blocked', () => {
      setupTestDir({
        createAgent: true,
        createStateFiles: true,
        stateContent: {
          current_phase: 'development',
          blocked_on: []
        }
      });
      const result = validateAgentPreconditions('test-agent');
      expect(result.errors).toBe(0);
      expect(result.exitCode).toBe(0);
    });
  });
});
