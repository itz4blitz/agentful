import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import { execSync } from 'child_process';
import {
  detectTeammateTool,
  enableTeammateTool,
  getParallelCapabilities,
  formatDelegation
} from '../../lib/parallel-execution.js';

// Mock fs and execSync
vi.mock('fs');
vi.mock('child_process');

/**
 * Parallel Execution Unit Tests
 *
 * Tests for lib/parallel-execution.js
 * Covers TeammateTool detection, enablement, and delegation formatting
 */

describe('Parallel Execution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('detectTeammateTool', () => {
    it('should detect when TeammateTool is not available (binary not found)', () => {
      execSync.mockReturnValue('');
      fs.existsSync.mockReturnValue(false);

      const result = detectTeammateTool();

      expect(result.available).toBe(false);
      expect(result.reason).toContain('binary not found');
    });

    it('should detect native Mach-O binary as having built-in parallel support', () => {
      // Native Claude Code binaries have built-in Task tool parallel execution
      execSync.mockImplementation((cmd) => {
        if (cmd.includes('npm root -g')) {
          return '/usr/local/lib/node_modules\n';
        }
        if (cmd.includes('which') || cmd.includes('where')) {
          return '/usr/local/bin/claude\n';
        }
        throw new Error('Unexpected command');
      });

      fs.existsSync.mockReturnValue(true);
      fs.realpathSync.mockImplementation((p) => p);
      fs.openSync.mockReturnValue(42);
      fs.readSync.mockImplementation((fd, buffer) => {
        buffer[0] = 0xcf;
        buffer[1] = 0xfa;
        buffer[2] = 0xed;
        buffer[3] = 0xfe;
        return 4;
      });
      fs.closeSync.mockReturnValue(undefined);

      const result = detectTeammateTool();

      expect(result.available).toBe(true);
      expect(result.method).toBe('native');
      expect(result.isNative).toBe(true);
    });

    it('should detect when TeammateTool code is not present (old version)', () => {
      // Mock execSync completely - no real calls
      execSync.mockImplementation((cmd) => {
        if (cmd.includes('npm root -g')) {
          return '/usr/local/lib/node_modules\n';
        }
        if (cmd.includes('which') || cmd.includes('where')) {
          throw new Error('Command not found');
        }
        throw new Error('Unexpected command');
      });

      // Mock ALL fs operations to prevent real filesystem access
      fs.existsSync.mockImplementation((p) => {
        // Only return true for our mocked npm path
        return p === '/usr/local/lib/node_modules/@anthropic-ai/claude-code/cli.js';
      });

      fs.realpathSync.mockImplementation((p) => p);

      // Return old CLI content WITHOUT any TeammateTool markers
      fs.readFileSync.mockReturnValue(`#!/usr/bin/env node\nconsole.log('Old CLI');`);

      const result = detectTeammateTool();

      expect(result.available).toBe(false);
      expect(result.reason).toMatch(/too old|not present/);
    });

    it('should detect when TeammateTool is disabled (gate exists)', () => {
      execSync.mockReturnValueOnce('/usr/local/lib/node_modules\n');
      fs.existsSync.mockReturnValue(true);
      fs.realpathSync.mockImplementation(p => p);

      const content = `
        function XX(){if(Yz(process.env.CLAUDE_CODE_AGENT_SWARMS))return!1;return xK("tengu_brass_pebble",!1)}
        const TeammateTool = {};
      `;

      // Mock readFileSync to return different content on each call
      let readCallCount = 0;
      fs.readFileSync.mockImplementation(() => {
        readCallCount++;
        // First call: detection, Second call: enablement
        return content;
      });

      fs.copyFileSync.mockReturnValue(undefined);
      fs.writeFileSync.mockReturnValue(undefined);

      const result = detectTeammateTool();

      // Auto-enable should have been attempted
      expect(result.available || result.canEnable).toBeTruthy();
    });

    it('should detect when TeammateTool is enabled (gate removed)', () => {
      execSync.mockReturnValue('/usr/local/lib/node_modules');
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(`
        const TeammateTool = {};
        const teammate_mailbox = {};
      `);

      const result = detectTeammateTool();

      expect(result.available).toBe(true);
      expect(result.method).toBe('native');
    });

    it('should auto-enable TeammateTool on first detection', () => {
      execSync.mockReturnValue('/usr/local/lib/node_modules');
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(`
        function XX(){if(Yz(process.env.CLAUDE_CODE_AGENT_SWARMS))return!1;return xK("tengu_brass_pebble",!1)}
        const TeammateTool = {};
      `);
      fs.copyFileSync.mockReturnValue(undefined);
      fs.writeFileSync.mockReturnValue(undefined);

      const result = detectTeammateTool();

      // Should attempt to enable
      expect(result.canEnable || result.autoEnabled).toBeTruthy();
    });
  });

  describe('enableTeammateTool', () => {
    it('should report native Mach-O binary as already enabled', () => {
      // Native binaries have built-in parallel support, no patching needed
      execSync.mockImplementation((cmd) => {
        if (cmd.includes('npm root -g')) {
          return '/usr/local/lib/node_modules\n';
        }
        if (cmd.includes('which') || cmd.includes('where')) {
          return '/usr/local/bin/claude\n';
        }
        throw new Error('Unexpected command');
      });

      fs.existsSync.mockReturnValue(true);
      fs.realpathSync.mockImplementation((p) => p);
      fs.openSync.mockReturnValue(42);
      fs.readSync.mockImplementation((fd, buffer) => {
        buffer[0] = 0xcf;
        buffer[1] = 0xfa;
        buffer[2] = 0xed;
        buffer[3] = 0xfe;
        return 4;
      });
      fs.closeSync.mockReturnValue(undefined);

      const result = enableTeammateTool();

      expect(result.success).toBe(true);
      expect(result.alreadyEnabled).toBe(true);
    });

    it('should create backup before patching', () => {
      execSync.mockReturnValue('/usr/local/lib/node_modules');
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(`
        function XX(){if(Yz(process.env.CLAUDE_CODE_AGENT_SWARMS))return!1;return xK("tengu_brass_pebble",!1)}
      `);
      fs.copyFileSync.mockReturnValue(undefined);
      fs.writeFileSync.mockReturnValue(undefined);

      const result = enableTeammateTool();

      expect(fs.copyFileSync).toHaveBeenCalled();
      expect(result.backupPath).toMatch(/\.backup-\d+$/);
    });

    it('should patch swarm gate function correctly', () => {
      execSync.mockReturnValue('/usr/local/lib/node_modules');
      fs.existsSync.mockReturnValue(true);
      const originalContent = 'function XX(){if(Yz(process.env.CLAUDE_CODE_AGENT_SWARMS))return!1;return xK("tengu_brass_pebble",!1)}';
      fs.readFileSync.mockReturnValue(originalContent);

      let patchedContent = null;
      fs.writeFileSync.mockImplementation((path, content) => {
        patchedContent = content;
      });
      fs.copyFileSync.mockReturnValue(undefined);

      const result = enableTeammateTool();

      expect(result.success).toBe(true);
      expect(patchedContent).toContain('function XX(){return!0}');
      expect(patchedContent).not.toContain('tengu_brass_pebble');
    });

    it('should not patch if already enabled', () => {
      execSync.mockReturnValue('/usr/local/lib/node_modules');
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('const TeammateTool = {};');
      fs.copyFileSync.mockReturnValue(undefined);
      fs.unlinkSync.mockReturnValue(undefined);

      const result = enableTeammateTool();

      expect(result.success).toBe(true);
      expect(result.alreadyEnabled).toBe(true);
      expect(fs.unlinkSync).toHaveBeenCalled(); // Removes backup
    });

    it('should handle errors gracefully', () => {
      execSync.mockImplementation(() => {
        throw new Error('Command failed');
      });

      const result = enableTeammateTool();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getParallelCapabilities', () => {
    it('should return parallel capabilities when available', () => {
      execSync.mockReturnValue('/usr/local/lib/node_modules');
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('const TeammateTool = {};');

      const caps = getParallelCapabilities();

      expect(caps.parallel).toBe(true);
      expect(caps.method).toBe('native');
    });

    it('should return sequential fallback when not available', () => {
      execSync.mockReturnValue('');
      fs.existsSync.mockReturnValue(false);

      const caps = getParallelCapabilities();

      expect(caps.parallel).toBe(false);
      expect(caps.method).toBe('sequential');
    });
  });

  describe('formatDelegation', () => {
    it('should format multiple tasks for parallel execution', () => {
      const tasks = [
        { agent: 'backend', description: 'Implement API' },
        { agent: 'frontend', description: 'Create UI' },
        { agent: 'tester', description: 'Write tests' }
      ];

      const formatted = formatDelegation(tasks);

      expect(formatted).toContain('Launch 3 agents in parallel');
      expect(formatted).toContain('1. backend: Implement API');
      expect(formatted).toContain('2. frontend: Create UI');
      expect(formatted).toContain('3. tester: Write tests');
      expect(formatted).toContain('Task tool');
    });

    it('should handle single task', () => {
      const tasks = [
        { agent: 'backend', description: 'Fix bug' }
      ];

      const formatted = formatDelegation(tasks);

      expect(formatted).toContain('Launch 1 agents in parallel');
      expect(formatted).toContain('backend: Fix bug');
    });

    it('should handle empty task list', () => {
      const tasks = [];

      const formatted = formatDelegation(tasks);

      expect(formatted).toContain('Launch 0 agents in parallel');
    });
  });

  describe('Integration with CLI', () => {
    it('should be importable from bin/cli.js', async () => {
      // Verify the import path works
      const { detectTeammateTool: imported } = await import('../../lib/parallel-execution.js');
      expect(imported).toBe(detectTeammateTool);
    });
  });
});
