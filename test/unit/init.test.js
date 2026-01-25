import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { initProject, copyDirectory, isInitialized, getState } from '../../lib/init.js';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Init Workflow Unit Tests
 *
 * Tests for the initialization workflow (lib/init.js)
 * Tests project setup, directory copying, and state management
 */

describe('Init Workflow', () => {
  let testDir;

  beforeEach(async () => {
    // Create a temporary directory for each test
    testDir = await mkdtemp(path.join(tmpdir(), 'agentful-test-'));
  });

  afterEach(async () => {
    // Clean up temporary directory after each test
    if (testDir) {
      await rm(testDir, { recursive: true, force: true });
    }
  });

  describe('initProject', () => {
    it('should initialize project successfully', async () => {
      const result = await initProject(testDir);

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('files');
      expect(result.success).toBe(true);
      expect(Array.isArray(result.files)).toBe(true);
      expect(result.files.length).toBeGreaterThan(0);
    });

    it('should create .agentful directory', async () => {
      await initProject(testDir);

      const agentfulDir = path.join(testDir, '.agentful');
      const stat = await fs.stat(agentfulDir);
      expect(stat.isDirectory()).toBe(true);
    });

    it('should create state.json with correct structure', async () => {
      await initProject(testDir);

      const stateFile = path.join(testDir, '.agentful', 'state.json');
      const content = await fs.readFile(stateFile, 'utf-8');
      const state = JSON.parse(content);

      expect(state).toHaveProperty('version');
      expect(state).toHaveProperty('current_task');
      expect(state).toHaveProperty('current_phase');
      expect(state).toHaveProperty('iterations');
      expect(state).toHaveProperty('last_updated');
      expect(state).toHaveProperty('blocked_on');
      expect(state.version).toBe('1.0');
      expect(state.current_task).toBeNull();
      expect(state.current_phase).toBe('idle');
      expect(state.iterations).toBe(0);
      expect(Array.isArray(state.blocked_on)).toBe(true);
    });

    it('should create completion.json with correct structure', async () => {
      await initProject(testDir);

      const completionFile = path.join(testDir, '.agentful', 'completion.json');
      const content = await fs.readFile(completionFile, 'utf-8');
      const completion = JSON.parse(content);

      expect(completion).toHaveProperty('features');
      expect(completion).toHaveProperty('gates');
      expect(completion).toHaveProperty('overall_progress');
      expect(typeof completion.features).toBe('object');
      expect(typeof completion.gates).toBe('object');
      expect(completion.gates).toHaveProperty('tests_passing');
      expect(completion.gates).toHaveProperty('no_type_errors');
      expect(completion.gates).toHaveProperty('no_dead_code');
      expect(completion.gates).toHaveProperty('coverage_80');
      expect(completion.gates).toHaveProperty('security_clean');
      expect(completion.overall_progress).toBe(0);
    });

    it('should create decisions.json with correct structure', async () => {
      await initProject(testDir);

      const decisionsFile = path.join(testDir, '.agentful', 'decisions.json');
      const content = await fs.readFile(decisionsFile, 'utf-8');
      const decisions = JSON.parse(content);

      expect(decisions).toHaveProperty('pending');
      expect(decisions).toHaveProperty('resolved');
      expect(Array.isArray(decisions.pending)).toBe(true);
      expect(Array.isArray(decisions.resolved)).toBe(true);
    });

    it('should create conversation-state.json', async () => {
      await initProject(testDir);

      const conversationStateFile = path.join(testDir, '.agentful', 'conversation-state.json');
      const content = await fs.readFile(conversationStateFile, 'utf-8');
      const state = JSON.parse(content);

      expect(state).toHaveProperty('current_phase');
      expect(state).toHaveProperty('last_message_time');
      expect(state).toHaveProperty('active_feature');
      expect(state).toHaveProperty('unresolved_references');
      expect(state).toHaveProperty('context_history');
    });

    it('should create conversation-history.json with full schema', async () => {
      await initProject(testDir);

      const conversationHistoryFile = path.join(testDir, '.agentful', 'conversation-history.json');
      const content = await fs.readFile(conversationHistoryFile, 'utf-8');
      const history = JSON.parse(content);

      // Schema metadata
      expect(history).toHaveProperty('_schema_version', '1.0');
      expect(history).toHaveProperty('version', '1.0');
      expect(history).toHaveProperty('schema', 'conversation-history');

      // Main sections
      expect(history).toHaveProperty('session');
      expect(history).toHaveProperty('conversation');
      expect(history).toHaveProperty('context');
      expect(history).toHaveProperty('state_integration');
      expect(history).toHaveProperty('product_context');
      expect(history).toHaveProperty('user');
      expect(history).toHaveProperty('agents');
      expect(history).toHaveProperty('skills_invoked');
      expect(history).toHaveProperty('metadata');

      // Backward compatibility - messages array still exists
      expect(history.conversation).toHaveProperty('messages');
      expect(Array.isArray(history.conversation.messages)).toBe(true);

      // Session structure
      expect(history.session).toMatchObject({
        id: null,
        started_at: null,
        last_updated: null,
        message_count: 0,
        active: false,
        mode: 'interactive'
      });

      // Metadata
      expect(history.metadata).toHaveProperty('created_at');
      expect(history.metadata).toHaveProperty('created_by', 'agentful-cli');
      expect(history.metadata).toHaveProperty('project_root');
      expect(history.metadata.environment).toHaveProperty('platform');
      expect(history.metadata.environment).toHaveProperty('node_version');
    });

    it('should create .claude/product directory structure', async () => {
      await initProject(testDir);

      const productDir = path.join(testDir, '.claude', 'product');
      const stat = await fs.stat(productDir);
      expect(stat.isDirectory()).toBe(true);
    });

    it('should create .claude/product/index.md', async () => {
      await initProject(testDir);

      const indexMd = path.join(testDir, '.claude', 'product', 'index.md');
      const content = await fs.readFile(indexMd, 'utf-8');

      expect(content).toContain('# Product Specification');
      expect(content).toContain('## Overview');
      expect(content).toContain('## Tech Stack');
      expect(content).toContain('## Domains');
    });

    it('should create .claude/product/README.md', async () => {
      await initProject(testDir);

      const readmeMd = path.join(testDir, '.claude', 'product', 'README.md');
      const content = await fs.readFile(readmeMd, 'utf-8');

      expect(content).toContain('# Product Structure Guide');
      expect(content).toContain('## Structure');
      expect(content).toContain('## Files Explained');
    });

    it('should return list of created files', async () => {
      const result = await initProject(testDir);

      expect(result.files).toContain('.agentful/');
      expect(result.files).toContain('.agentful/state.json');
      expect(result.files).toContain('.agentful/completion.json');
      expect(result.files).toContain('.agentful/decisions.json');
      expect(result.files).toContain('.claude/product/index.md');
      expect(result.files).toContain('.claude/product/README.md');
    });
  });

  describe('copyDirectory', () => {
    it('should copy directory recursively', async () => {
      // Create a source directory with files
      const sourceDir = path.join(testDir, 'source');
      const destDir = path.join(testDir, 'dest');

      await fs.mkdir(sourceDir, { recursive: true });
      await fs.mkdir(path.join(sourceDir, 'subdir'), { recursive: true });
      await fs.writeFile(path.join(sourceDir, 'file1.txt'), 'content1');
      await fs.writeFile(path.join(sourceDir, 'subdir', 'file2.txt'), 'content2');

      await copyDirectory(sourceDir, destDir);

      // Check files were copied
      const file1Content = await fs.readFile(path.join(destDir, 'file1.txt'), 'utf-8');
      const file2Content = await fs.readFile(path.join(destDir, 'subdir', 'file2.txt'), 'utf-8');

      expect(file1Content).toBe('content1');
      expect(file2Content).toBe('content2');
    });

    it('should create destination directory if it does not exist', async () => {
      const sourceDir = path.join(testDir, 'source');
      const destDir = path.join(testDir, 'nested', 'dest');

      await fs.mkdir(sourceDir, { recursive: true });
      await fs.writeFile(path.join(sourceDir, 'file.txt'), 'content');

      await copyDirectory(sourceDir, destDir);

      const stat = await fs.stat(destDir);
      expect(stat.isDirectory()).toBe(true);
    });
  });

  describe('isInitialized', () => {
    it('should return false for uninitialized directory', async () => {
      const result = await isInitialized(testDir);
      expect(result).toBe(false);
    });

    it('should return true for initialized directory', async () => {
      await initProject(testDir);
      const result = await isInitialized(testDir);
      expect(result).toBe(true);
    });

    it('should check for state.json existence', async () => {
      // Create .agentful directory without state.json
      await fs.mkdir(path.join(testDir, '.agentful'), { recursive: true });
      const result = await isInitialized(testDir);
      expect(result).toBe(false);
    });
  });

  describe('getState', () => {
    it('should return null for uninitialized directory', async () => {
      const state = await getState(testDir);
      expect(state).toBeNull();
    });

    it('should return state object for initialized directory', async () => {
      await initProject(testDir);
      const state = await getState(testDir);

      expect(state).not.toBeNull();
      expect(state).toHaveProperty('version');
      expect(state).toHaveProperty('current_task');
      expect(state).toHaveProperty('current_phase');
      expect(state).toHaveProperty('iterations');
      expect(state).toHaveProperty('last_updated');
      expect(state).toHaveProperty('blocked_on');
    });

    it('should return parsed JSON from state.json', async () => {
      await initProject(testDir);
      const state = await getState(testDir);

      expect(typeof state).toBe('object');
      expect(state.version).toBe('1.0');
      expect(state.current_phase).toBe('idle');
      expect(Array.isArray(state.blocked_on)).toBe(true);
    });

    it('should return null if state.json is invalid JSON', async () => {
      await fs.mkdir(path.join(testDir, '.agentful'), { recursive: true });
      await fs.writeFile(path.join(testDir, '.agentful', 'state.json'), 'invalid json');

      const state = await getState(testDir);
      expect(state).toBeNull();
    });
  });

  describe('state file timestamps', () => {
    it('should set last_updated timestamp in ISO format', async () => {
      await initProject(testDir);
      const state = await getState(testDir);

      expect(state.last_updated).toBeTruthy();
      // Should be valid ISO 8601 date
      const date = new Date(state.last_updated);
      expect(date.toISOString()).toBe(state.last_updated);
    });

    it('should not have lastUpdated in completion.json', async () => {
      await initProject(testDir);

      const completionFile = path.join(testDir, '.agentful', 'completion.json');
      const content = await fs.readFile(completionFile, 'utf-8');
      const completion = JSON.parse(content);

      // New schema doesn't have lastUpdated
      expect(completion.lastUpdated).toBeUndefined();
      expect(completion).toHaveProperty('features');
      expect(completion).toHaveProperty('gates');
      expect(completion).toHaveProperty('overall_progress');
    });
  });

  describe('version tracking', () => {
    it('should set version in state.json', async () => {
      await initProject(testDir);
      const state = await getState(testDir);

      expect(state.version).toBe('1.0');
    });
  });
});
