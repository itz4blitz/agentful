import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..', '..', '..');
const preAgentPath = path.join(projectRoot, 'bin', 'hooks', 'pre-agent.js');

/**
 * Pre-Agent Hook Unit Tests
 *
 * Tests for bin/hooks/pre-agent.js
 * Validates agent preconditions before invocation
 *
 * Coverage targets:
 * - Agent file existence check
 * - Required state files existence (state.json, completion.json, decisions.json)
 * - state.json structure validation (current_phase field)
 * - state.json JSON validity
 * - Feature file existence (hierarchical and flat structures)
 * - Orchestrator blocked status check
 * - Exit codes (0 for success, 1 for failure)
 * - Console error/warning messages
 */

describe('Pre-Agent Hook', () => {
  let testDir;

  beforeEach(() => {
    // Create a unique temporary directory for each test
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agentful-test-'));
  });

  afterEach(() => {
    // Cleanup test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  /**
   * Helper function to setup test directory structure
   */
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

  /**
   * Helper function to execute pre-agent.js with environment variables
   */
  const runPreAgent = (env = {}) => {
    const envVars = {
      AGENTFUL_AGENT: env.AGENTFUL_AGENT || '',
      AGENTFUL_FEATURE: env.AGENTFUL_FEATURE || '',
      AGENTFUL_DOMAIN: env.AGENTFUL_DOMAIN || ''
    };

    const envString = Object.entries(envVars)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');

    try {
      const output = execSync(`${envString} node "${preAgentPath}"`, {
        cwd: testDir,
        encoding: 'utf-8',
        stdio: 'pipe'
      });
      return { exitCode: 0, stdout: output, stderr: '' };
    } catch (error) {
      return {
        exitCode: error.status || 1,
        stdout: error.stdout ? error.stdout.toString() : '',
        stderr: error.stderr ? error.stderr.toString() : ''
      };
    }
  };

  describe('Exit Code 0 - No Agent Specified', () => {
    it('should exit with code 0 when AGENTFUL_AGENT is not set', () => {
      setupTestDir();

      const result = runPreAgent({
        AGENTFUL_AGENT: ''
      });

      expect(result.exitCode).toBe(0);
    });

    it('should exit with code 0 when AGENTFUL_AGENT is undefined', () => {
      setupTestDir();

      const result = runPreAgent({});

      expect(result.exitCode).toBe(0);
    });

    it('should not perform any validation when no agent specified', () => {
      setupTestDir();

      const result = runPreAgent({
        AGENTFUL_AGENT: ''
      });

      expect(result.exitCode).toBe(0);
      expect(result.stderr).not.toContain('ERROR');
    });
  });

  describe('Check 1: Agent File Exists', () => {
    it('should error when agent file does not exist', () => {
      setupTestDir();

      const result = runPreAgent({
        AGENTFUL_AGENT: 'nonexistent-agent'
      });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('ERROR: Agent file not found');
      expect(result.stderr).toContain('.claude/agents/nonexistent-agent.md');
    });

    it('should pass agent file check when agent file exists', () => {
      setupTestDir({
        createAgent: true,
        agentName: 'orchestrator'
      });

      const result = runPreAgent({
        AGENTFUL_AGENT: 'orchestrator'
      });

      // Will still fail due to missing state files, but shouldn't error on agent file
      expect(result.stderr).not.toContain('ERROR: Agent file not found');
      expect(result.stderr).toContain('ERROR: Missing state file');
    });
  });

  describe('Check 2: Required State Files Exist', () => {
    it('should error when state.json is missing', () => {
      setupTestDir({
        createAgent: true,
        agentName: 'orchestrator'
      });

      const result = runPreAgent({
        AGENTFUL_AGENT: 'orchestrator'
      });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('ERROR: Missing state file: .agentful/state.json');
    });

    it('should error when completion.json is missing', () => {
      setupTestDir({
        createAgent: true,
        agentName: 'orchestrator'
      });

      const result = runPreAgent({
        AGENTFUL_AGENT: 'orchestrator'
      });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('ERROR: Missing state file: .agentful/completion.json');
    });

    it('should error when decisions.json is missing', () => {
      setupTestDir({
        createAgent: true,
        agentName: 'orchestrator'
      });

      const result = runPreAgent({
        AGENTFUL_AGENT: 'orchestrator'
      });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('ERROR: Missing state file: .agentful/decisions.json');
    });

    it('should count all missing state files as separate errors', () => {
      setupTestDir({
        createAgent: true,
        agentName: 'orchestrator'
      });

      const result = runPreAgent({
        AGENTFUL_AGENT: 'orchestrator'
      });

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain('validation failed');
      // Should have 3 state file errors
      const stateFileErrors = (result.stderr.match(/ERROR: Missing state file/g) || []).length;
      expect(stateFileErrors).toBe(3);
    });
  });

  describe('Check 3: Validate state.json Structure', () => {
    it('should error when state.json contains invalid JSON', () => {
      setupTestDir({
        createAgent: true,
        agentName: 'orchestrator',
        createStateFiles: true,
        stateContent: 'not valid json{'
      });

      const result = runPreAgent({
        AGENTFUL_AGENT: 'orchestrator'
      });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('ERROR: .agentful/state.json is invalid JSON');
    });

    it('should error when state.json is missing current_phase field', () => {
      setupTestDir({
        createAgent: true,
        agentName: 'orchestrator',
        createStateFiles: true,
        stateContent: {
          some_field: 'value',
          another_field: 'value2'
        }
      });

      const result = runPreAgent({
        AGENTFUL_AGENT: 'orchestrator'
      });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('ERROR: .agentful/state.json is malformed (missing current_phase)');
    });

    it('should pass when state.json has valid structure with current_phase', () => {
      setupTestDir({
        createAgent: true,
        agentName: 'orchestrator',
        createStateFiles: true,
        stateContent: {
          current_phase: 'implementation',
          active_agents: [],
          blocked_on: []
        }
      });

      const result = runPreAgent({
        AGENTFUL_AGENT: 'orchestrator'
      });

      // Should not have state.json validation errors
      expect(result.exitCode).toBe(0);
      expect(result.stderr).not.toContain('ERROR: .agentful/state.json is invalid JSON');
      expect(result.stderr).not.toContain('ERROR: .agentful/state.json is malformed');
    });

    it('should handle empty state.json file', () => {
      setupTestDir({
        createAgent: true,
        agentName: 'orchestrator',
        createStateFiles: true,
        stateContent: ''
      });

      const result = runPreAgent({
        AGENTFUL_AGENT: 'orchestrator'
      });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('ERROR: .agentful/state.json is invalid JSON');
    });

    it('should handle state.json with null current_phase', () => {
      setupTestDir({
        createAgent: true,
        agentName: 'orchestrator',
        createStateFiles: true,
        stateContent: {
          current_phase: null
        }
      });

      const result = runPreAgent({
        AGENTFUL_AGENT: 'orchestrator'
      });

      expect(result.exitCode).toBe(1);
      // null is falsy, so should error
      expect(result.stderr).toContain('ERROR: .agentful/state.json is malformed (missing current_phase)');
    });

    it('should handle state.json with empty string current_phase', () => {
      setupTestDir({
        createAgent: true,
        agentName: 'orchestrator',
        createStateFiles: true,
        stateContent: {
          current_phase: ''
        }
      });

      const result = runPreAgent({
        AGENTFUL_AGENT: 'orchestrator'
      });

      expect(result.exitCode).toBe(1);
      // Empty string is falsy, so should error
      expect(result.stderr).toContain('ERROR: .agentful/state.json is malformed (missing current_phase)');
    });

    it('should handle state.json with undefined current_phase', () => {
      setupTestDir({
        createAgent: true,
        agentName: 'orchestrator',
        createStateFiles: true,
        stateContent: {
          current_phase: undefined
        }
      });

      const result = runPreAgent({
        AGENTFUL_AGENT: 'orchestrator'
      });

      expect(result.exitCode).toBe(1);
      // undefined serializes to missing field
      expect(result.stderr).toContain('ERROR: .agentful/state.json is malformed (missing current_phase)');
    });
  });

  describe('Check 4: Feature File Existence', () => {
    it('should warn when feature specified but not found (no domain)', () => {
      setupTestDir({
        createAgent: true,
        agentName: 'orchestrator',
        createStateFiles: true,
        stateContent: { current_phase: 'implementation' }
      });

      const result = runPreAgent({
        AGENTFUL_AGENT: 'orchestrator',
        AGENTFUL_FEATURE: 'nonexistent-feature',
        AGENTFUL_DOMAIN: ''
      });

      expect(result.exitCode).toBe(0); // Warnings don't cause failure
      expect(result.stdout).toContain("WARNING: Feature 'nonexistent-feature' not found in product specification");
    });

    it('should warn when feature specified but not found (with domain)', () => {
      setupTestDir({
        createAgent: true,
        agentName: 'orchestrator',
        createStateFiles: true,
        stateContent: { current_phase: 'implementation' }
      });

      const result = runPreAgent({
        AGENTFUL_AGENT: 'orchestrator',
        AGENTFUL_FEATURE: 'nonexistent-feature',
        AGENTFUL_DOMAIN: 'nonexistent-domain'
      });

      expect(result.exitCode).toBe(0); // Warnings don't cause failure
      expect(result.stdout).toContain("WARNING: Feature 'nonexistent-feature' not found in product specification");
    });

    it('should find feature in hierarchical structure when domain is specified', () => {
      setupTestDir({
        createAgent: true,
        agentName: 'orchestrator',
        createStateFiles: true,
        stateContent: { current_phase: 'implementation' },
        createFeature: true,
        featureName: 'test-feature',
        domainName: 'test-domain'
      });

      const result = runPreAgent({
        AGENTFUL_AGENT: 'orchestrator',
        AGENTFUL_FEATURE: 'test-feature',
        AGENTFUL_DOMAIN: 'test-domain'
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain("WARNING: Feature 'test-feature' not found");
    });

    it('should find feature in flat structure when no domain', () => {
      setupTestDir({
        createAgent: true,
        agentName: 'orchestrator',
        createStateFiles: true,
        stateContent: { current_phase: 'implementation' },
        createFeature: true,
        featureName: 'test-feature',
        domainName: null
      });

      const result = runPreAgent({
        AGENTFUL_AGENT: 'orchestrator',
        AGENTFUL_FEATURE: 'test-feature'
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain("WARNING: Feature 'test-feature' not found");
    });

    it('should fall back to flat structure when hierarchical not found', () => {
      setupTestDir({
        createAgent: true,
        agentName: 'orchestrator',
        createStateFiles: true,
        stateContent: { current_phase: 'implementation' },
        createFeature: true,
        featureName: 'test-feature',
        domainName: null
      });

      const result = runPreAgent({
        AGENTFUL_AGENT: 'orchestrator',
        AGENTFUL_FEATURE: 'test-feature',
        AGENTFUL_DOMAIN: 'nonexistent-domain'
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain("WARNING: Feature 'test-feature' not found");
    });

    it('should not warn when feature is not specified', () => {
      setupTestDir({
        createAgent: true,
        agentName: 'orchestrator',
        createStateFiles: true,
        stateContent: { current_phase: 'implementation' }
      });

      const result = runPreAgent({
        AGENTFUL_AGENT: 'orchestrator',
        AGENTFUL_FEATURE: ''
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain('WARNING: Feature');
    });
  });

  describe('Check 5: Orchestrator Blocked Status', () => {
    it('should warn when orchestrator is blocked on decisions', () => {
      setupTestDir({
        createAgent: true,
        agentName: 'orchestrator',
        createStateFiles: true,
        stateContent: {
          current_phase: 'implementation',
          blocked_on: ['decision-1', 'decision-2']
        }
      });

      const result = runPreAgent({
        AGENTFUL_AGENT: 'orchestrator'
      });

      expect(result.exitCode).toBe(0); // Warnings don't cause failure
      expect(result.stdout).toContain('WARNING: Orchestrator is blocked on decisions');
      expect(result.stdout).toContain('decision-1');
      expect(result.stdout).toContain('decision-2');
    });

    it('should not warn when blocked_on is empty array', () => {
      setupTestDir({
        createAgent: true,
        agentName: 'orchestrator',
        createStateFiles: true,
        stateContent: {
          current_phase: 'implementation',
          blocked_on: []
        }
      });

      const result = runPreAgent({
        AGENTFUL_AGENT: 'orchestrator'
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain('WARNING: Orchestrator is blocked on decisions');
    });

    it('should not warn when blocked_on is not present', () => {
      setupTestDir({
        createAgent: true,
        agentName: 'orchestrator',
        createStateFiles: true,
        stateContent: {
          current_phase: 'implementation'
        }
      });

      const result = runPreAgent({
        AGENTFUL_AGENT: 'orchestrator'
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain('WARNING: Orchestrator is blocked on decisions');
    });

    it('should not warn when blocked_on is not an array', () => {
      setupTestDir({
        createAgent: true,
        agentName: 'orchestrator',
        createStateFiles: true,
        stateContent: {
          current_phase: 'implementation',
          blocked_on: 'not-an-array'
        }
      });

      const result = runPreAgent({
        AGENTFUL_AGENT: 'orchestrator'
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain('WARNING: Orchestrator is blocked on decisions');
    });

    it('should handle JSON parse error gracefully (already handled in Check 3)', () => {
      setupTestDir({
        createAgent: true,
        agentName: 'orchestrator',
        createStateFiles: true,
        stateContent: 'invalid json'
      });

      const result = runPreAgent({
        AGENTFUL_AGENT: 'orchestrator'
      });

      // Error from Check 3
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('ERROR: .agentful/state.json is invalid JSON');
      // Check 5 catches the error and does nothing (already handled)
    });
  });

  describe('Exit Code 1 - Validation Failures', () => {
    it('should exit with code 1 when critical checks fail', () => {
      setupTestDir();

      const result = runPreAgent({
        AGENTFUL_AGENT: 'nonexistent-agent'
      });

      expect(result.exitCode).toBe(1);
    });

    it('should display error count in failure message', () => {
      setupTestDir();

      const result = runPreAgent({
        AGENTFUL_AGENT: 'nonexistent-agent'
      });

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain('Pre-agent validation failed with');
      expect(result.stdout).toContain('error(s)');
    });

    it('should display agent name in failure message', () => {
      setupTestDir();

      const result = runPreAgent({
        AGENTFUL_AGENT: 'test-agent'
      });

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain('Agent: test-agent');
    });

    it('should display feature in failure message when specified', () => {
      setupTestDir();

      const result = runPreAgent({
        AGENTFUL_AGENT: 'test-agent',
        AGENTFUL_FEATURE: 'test-feature'
      });

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain('Feature: test-feature');
    });

    it('should display domain in failure message when specified', () => {
      setupTestDir();

      const result = runPreAgent({
        AGENTFUL_AGENT: 'test-agent',
        AGENTFUL_FEATURE: 'test-feature',
        AGENTFUL_DOMAIN: 'test-domain'
      });

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain('Domain: test-domain');
    });

    it('should not display feature when not specified', () => {
      setupTestDir();

      const result = runPreAgent({
        AGENTFUL_AGENT: 'test-agent',
        AGENTFUL_FEATURE: ''
      });

      expect(result.exitCode).toBe(1);
      expect(result.stdout).not.toContain('Feature:');
    });

    it('should not display domain when not specified', () => {
      setupTestDir();

      const result = runPreAgent({
        AGENTFUL_AGENT: 'test-agent',
        AGENTFUL_DOMAIN: ''
      });

      expect(result.exitCode).toBe(1);
      expect(result.stdout).not.toContain('Domain:');
    });
  });

  describe('Exit Code 0 - All Checks Pass', () => {
    it('should exit with code 0 when all validation passes', () => {
      setupTestDir({
        createAgent: true,
        agentName: 'orchestrator',
        createStateFiles: true,
        stateContent: {
          current_phase: 'implementation',
          active_agents: [],
          blocked_on: []
        }
      });

      const result = runPreAgent({
        AGENTFUL_AGENT: 'orchestrator'
      });

      expect(result.exitCode).toBe(0);
      expect(result.stderr).not.toContain('ERROR');
    });

    it('should not print errors when all checks pass', () => {
      setupTestDir({
        createAgent: true,
        agentName: 'orchestrator',
        createStateFiles: true,
        stateContent: {
          current_phase: 'implementation'
        }
      });

      const result = runPreAgent({
        AGENTFUL_AGENT: 'orchestrator'
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain('Pre-agent validation failed');
      expect(result.stderr).not.toContain('ERROR');
    });

    it('should exit 0 even with warnings', () => {
      setupTestDir({
        createAgent: true,
        agentName: 'orchestrator',
        createStateFiles: true,
        stateContent: {
          current_phase: 'implementation',
          blocked_on: ['decision-1']
        }
      });

      const result = runPreAgent({
        AGENTFUL_AGENT: 'orchestrator',
        AGENTFUL_FEATURE: 'nonexistent-feature'
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('WARNING');
      expect(result.stderr).not.toContain('ERROR');
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle multiple validation errors correctly', () => {
      setupTestDir();

      const result = runPreAgent({
        AGENTFUL_AGENT: 'nonexistent-agent'
      });

      // Should have agent file error + 3 state file errors
      expect(result.exitCode).toBe(1);
      const errorCount = (result.stderr.match(/ERROR:/g) || []).length;
      expect(errorCount).toBe(4);
    });

    it('should handle very long agent names', () => {
      setupTestDir();

      const longName = 'a'.repeat(1000);
      const result = runPreAgent({
        AGENTFUL_AGENT: longName
      });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('ERROR');
    });

    it('should handle special characters in agent name', () => {
      setupTestDir();

      const result = runPreAgent({
        AGENTFUL_AGENT: 'agent/../../../etc/passwd'
      });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('ERROR: Agent file not found');
    });

    it('should handle special characters in feature name', () => {
      setupTestDir({
        createAgent: true,
        agentName: 'orchestrator',
        createStateFiles: true,
        stateContent: { current_phase: 'implementation' }
      });

      const result = runPreAgent({
        AGENTFUL_AGENT: 'orchestrator',
        AGENTFUL_FEATURE: 'feature/../../../etc/passwd'
      });

      // Should warn about feature not found
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('WARNING');
    });

    it('should handle special characters in domain name', () => {
      setupTestDir({
        createAgent: true,
        agentName: 'orchestrator',
        createStateFiles: true,
        stateContent: { current_phase: 'implementation' }
      });

      const result = runPreAgent({
        AGENTFUL_AGENT: 'orchestrator',
        AGENTFUL_FEATURE: 'test-feature',
        AGENTFUL_DOMAIN: 'domain/../../../etc/passwd'
      });

      // Should warn about feature not found
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('WARNING');
    });
  });

  describe('File Structure', () => {
    it('should be executable with shebang', () => {
      const content = fs.readFileSync(preAgentPath, 'utf-8');
      expect(content.startsWith('#!/usr/bin/env node')).toBe(true);
    });

    it('should import fs module', () => {
      const content = fs.readFileSync(preAgentPath, 'utf-8');
      expect(content).toContain("import fs from 'fs'");
    });

    it('should read environment variables', () => {
      const content = fs.readFileSync(preAgentPath, 'utf-8');
      expect(content).toContain('process.env.AGENTFUL_AGENT');
      expect(content).toContain('process.env.AGENTFUL_FEATURE');
      expect(content).toContain('process.env.AGENTFUL_DOMAIN');
    });

    it('should define all required checks', () => {
      const content = fs.readFileSync(preAgentPath, 'utf-8');

      // Check comments for each validation
      expect(content).toContain('Check 1: Agent file exists');
      expect(content).toContain('Check 2: Required state files exist');
      expect(content).toContain('Check 3: Validate state.json structure');
      expect(content).toContain('Check 4:');
      expect(content).toContain('Check 5:');
    });

    it('should use consistent error counting', () => {
      const content = fs.readFileSync(preAgentPath, 'utf-8');
      expect(content).toContain('let errors = 0');
      expect(content).toContain('errors++');
      expect(content).toContain('if (errors > 0)');
    });

    it('should call process.exit with correct codes', () => {
      const content = fs.readFileSync(preAgentPath, 'utf-8');
      expect(content).toContain('process.exit(0)');
      expect(content).toContain('process.exit(1)');
    });
  });

  describe('Console Output', () => {
    it('should use console.error for errors', () => {
      setupTestDir();

      const result = runPreAgent({
        AGENTFUL_AGENT: 'nonexistent'
      });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('ERROR');
    });

    it('should use console.log for warnings', () => {
      setupTestDir({
        createAgent: true,
        agentName: 'orchestrator',
        createStateFiles: true,
        stateContent: { current_phase: 'implementation' }
      });

      const result = runPreAgent({
        AGENTFUL_AGENT: 'orchestrator',
        AGENTFUL_FEATURE: 'nonexistent-feature'
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('WARNING');
    });

    it('should format error messages consistently', () => {
      setupTestDir();

      const result = runPreAgent({
        AGENTFUL_AGENT: 'nonexistent'
      });

      // All error messages should start with "ERROR:"
      const errorLines = result.stderr.split('\n').filter(line => line.includes('ERROR'));
      errorLines.forEach(line => {
        if (line.trim().length > 0) {
          expect(line).toContain('ERROR:');
        }
      });
    });

    it('should format warning messages consistently', () => {
      setupTestDir({
        createAgent: true,
        agentName: 'orchestrator',
        createStateFiles: true,
        stateContent: { current_phase: 'implementation' }
      });

      const result = runPreAgent({
        AGENTFUL_AGENT: 'orchestrator',
        AGENTFUL_FEATURE: 'nonexistent'
      });

      // All warning messages should start with "WARNING:"
      const warningLines = result.stdout.split('\n').filter(line => line.includes('WARNING'));
      warningLines.forEach(line => {
        if (line.trim().length > 0) {
          expect(line).toContain('WARNING:');
        }
      });
    });
  });
});
