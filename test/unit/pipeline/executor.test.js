import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AgentExecutor, createAgentExecutor } from '../../../lib/pipeline/executor.js';
import fs from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';
import { spawn } from 'child_process';

// Mock child_process
vi.mock('child_process', () => ({
  spawn: vi.fn()
}));

/**
 * Agent Executor Unit Tests
 *
 * Tests for agent execution runtime
 * Covers agent invocation, context passing, subprocess management, and cleanup
 */

describe('AgentExecutor', () => {
  let executor;
  let testDir;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(tmpdir(), 'executor-test-'));
    executor = new AgentExecutor({
      agentsDir: path.join(testDir, '.claude/agents'),
      tempDir: path.join(testDir, 'temp'),
      claudeCommand: 'mock-claude',
      streamLogs: false
    });

    // Setup test agent directory
    await fs.mkdir(path.join(testDir, '.claude/agents'), { recursive: true });
    await fs.writeFile(
      path.join(testDir, '.claude/agents', 'test-agent.md'),
      '# Test Agent\n\nThis is a test agent.'
    );

    vi.clearAllMocks();
  });

  afterEach(async () => {
    if (testDir) {
      await fs.rm(testDir, { recursive: true, force: true });
    }
  });

  describe('constructor', () => {
    it('should create executor with default options', () => {
      const exec = new AgentExecutor();
      expect(exec.options.agentsDir).toBe('.claude/agents');
      expect(exec.options.claudeCommand).toBe('claude');
      expect(exec.options.streamLogs).toBe(true);
    });

    it('should accept custom options', () => {
      const exec = new AgentExecutor({
        agentsDir: '/custom/agents',
        claudeCommand: 'custom-claude',
        streamLogs: false
      });
      expect(exec.options.agentsDir).toBe('/custom/agents');
      expect(exec.options.claudeCommand).toBe('custom-claude');
      expect(exec.options.streamLogs).toBe(false);
    });

    it('should initialize empty execution map', () => {
      expect(executor.activeExecutions.size).toBe(0);
    });
  });

  describe('_resolveAgentFile', () => {
    it('should resolve agent with .md extension', async () => {
      const agentFile = await executor._resolveAgentFile('test-agent');
      expect(agentFile).toContain('test-agent.md');
    });

    it('should resolve agent without extension', async () => {
      await fs.writeFile(path.join(testDir, '.claude/agents', 'plain-agent'), 'content');
      const agentFile = await executor._resolveAgentFile('plain-agent');
      expect(agentFile).toContain('plain-agent');
    });

    it('should throw error for non-existent agent', async () => {
      await expect(executor._resolveAgentFile('nonexistent')).rejects.toThrow('Agent not found');
    });
  });

  describe('_buildAgentPrompt', () => {
    it('should build basic prompt', async () => {
      const jobDef = {
        task: 'Test task',
        prompt: 'Test prompt'
      };
      const context = {};

      const prompt = await executor._buildAgentPrompt(jobDef, context);
      expect(prompt).toContain('Test task');
      expect(prompt).toContain('Test prompt');
    });

    it('should interpolate variables', async () => {
      const jobDef = {
        prompt: 'Hello {{name}}'
      };
      const context = { name: 'World' };

      const prompt = await executor._buildAgentPrompt(jobDef, context);
      expect(prompt).toContain('Hello World');
    });

    it('should handle nested variables', async () => {
      const jobDef = {
        prompt: 'User: {{user.name}}, Age: {{user.age}}'
      };
      const context = {
        user: { name: 'Alice', age: 30 }
      };

      const prompt = await executor._buildAgentPrompt(jobDef, context);
      expect(prompt).toContain('User: Alice');
      expect(prompt).toContain('Age: 30');
    });

    it('should leave undefined variables unchanged', async () => {
      const jobDef = {
        prompt: 'Hello {{missing}}'
      };
      const context = {};

      const prompt = await executor._buildAgentPrompt(jobDef, context);
      expect(prompt).toContain('{{missing}}');
    });
  });

  describe('_interpolateVariables', () => {
    it('should replace simple variables', () => {
      const text = 'Hello {{name}}';
      const context = { name: 'World' };
      const result = executor._interpolateVariables(text, context);
      expect(result).toBe('Hello World');
    });

    it('should replace multiple variables', () => {
      const text = '{{greeting}} {{name}}!';
      const context = { greeting: 'Hello', name: 'World' };
      const result = executor._interpolateVariables(text, context);
      expect(result).toBe('Hello World!');
    });

    it('should handle nested properties', () => {
      const text = '{{user.name}} is {{user.age}}';
      const context = { user: { name: 'Alice', age: 30 } };
      const result = executor._interpolateVariables(text, context);
      expect(result).toBe('Alice is 30');
    });
  });

  describe('_getNestedValue', () => {
    it('should get top-level property', () => {
      const obj = { name: 'test' };
      const value = executor._getNestedValue(obj, 'name');
      expect(value).toBe('test');
    });

    it('should get nested property', () => {
      const obj = { user: { name: 'Alice' } };
      const value = executor._getNestedValue(obj, 'user.name');
      expect(value).toBe('Alice');
    });

    it('should return undefined for missing property', () => {
      const obj = { user: { name: 'Alice' } };
      const value = executor._getNestedValue(obj, 'user.age');
      expect(value).toBeUndefined();
    });

    it('should handle deeply nested properties', () => {
      const obj = { a: { b: { c: { d: 'deep' } } } };
      const value = executor._getNestedValue(obj, 'a.b.c.d');
      expect(value).toBe('deep');
    });
  });

  describe('_injectContextReference', () => {
    it('should inject context and output file paths', () => {
      const prompt = 'Original prompt';
      const contextFile = '/path/to/context.json';
      const outputFile = '/path/to/output.json';

      const result = executor._injectContextReference(prompt, contextFile, outputFile);

      expect(result).toContain(contextFile);
      expect(result).toContain(outputFile);
      expect(result).toContain('Original prompt');
      expect(result).toContain('Pipeline Job Context');
      expect(result).toContain('Output format');
    });
  });

  describe('_writeContextFile', () => {
    it('should write context to temp file', async () => {
      const context = { key: 'value', nested: { prop: 'data' } };
      const executionId = 'test-exec-123';

      const filePath = await executor._writeContextFile(executionId, context);

      expect(filePath).toContain(executionId);
      expect(filePath).toContain('context.json');

      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(content);

      expect(parsed).toEqual(context);
    });

    it('should create temp directory if missing', async () => {
      const context = { test: 'data' };
      const executionId = 'test-exec-456';

      await executor._writeContextFile(executionId, context);

      const tempDirStat = await fs.stat(executor.options.tempDir);
      expect(tempDirStat.isDirectory()).toBe(true);
    });
  });

  describe('_writePromptFile', () => {
    it('should write prompt to temp file', async () => {
      const prompt = 'Test prompt content';
      const executionId = 'test-exec-789';

      const filePath = await executor._writePromptFile(executionId, prompt);

      expect(filePath).toContain(executionId);
      expect(filePath).toContain('prompt.txt');

      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toBe(prompt);
    });
  });

  describe('_cleanupTempFiles', () => {
    it('should remove temp files', async () => {
      const executionId = 'test-cleanup-123';

      // Create temp files
      await fs.mkdir(executor.options.tempDir, { recursive: true });
      const contextFile = path.join(executor.options.tempDir, `${executionId}-context.json`);
      const outputFile = path.join(executor.options.tempDir, `${executionId}-output.json`);
      const promptFile = path.join(executor.options.tempDir, `${executionId}-prompt.txt`);

      await fs.writeFile(contextFile, 'context');
      await fs.writeFile(outputFile, 'output');
      await fs.writeFile(promptFile, 'prompt');

      // Verify files exist
      await fs.access(contextFile);
      await fs.access(outputFile);
      await fs.access(promptFile);

      // Cleanup
      await executor._cleanupTempFiles(executionId);

      // Verify files are removed
      await expect(fs.access(contextFile)).rejects.toThrow();
      await expect(fs.access(outputFile)).rejects.toThrow();
      await expect(fs.access(promptFile)).rejects.toThrow();
    });

    it('should not throw if files do not exist', async () => {
      await expect(executor._cleanupTempFiles('nonexistent-id')).resolves.not.toThrow();
    });
  });

  describe('_extractProgress', () => {
    it('should extract progress from text', () => {
      const onProgress = vi.fn();
      executor._extractProgress('[PROGRESS: 45%]', onProgress);
      expect(onProgress).toHaveBeenCalledWith(45);
    });

    it('should extract progress case-insensitively', () => {
      const onProgress = vi.fn();
      executor._extractProgress('[progress: 75%]', onProgress);
      expect(onProgress).toHaveBeenCalledWith(75);
    });

    it('should detect completion markers', () => {
      const onProgress = vi.fn();
      executor._extractProgress('Task completed successfully', onProgress);
      expect(onProgress).toHaveBeenCalledWith(100);
    });

    it('should handle missing onProgress callback', () => {
      expect(() => executor._extractProgress('[PROGRESS: 50%]', undefined)).not.toThrow();
    });
  });

  describe('_generateExecutionId', () => {
    it('should generate unique execution ID', () => {
      const id1 = executor._generateExecutionId('job1');
      const id2 = executor._generateExecutionId('job1');

      expect(id1).not.toBe(id2);
      expect(id1).toContain('job1');
      expect(id2).toContain('job1');
    });
  });

  describe('getExecutionStatus', () => {
    it('should return null for non-existent execution', () => {
      const status = executor.getExecutionStatus('nonexistent-id');
      expect(status).toBeNull();
    });

    it('should return status for active execution', () => {
      const execContext = {
        executionId: 'test-123',
        jobId: 'job1',
        agent: 'test-agent',
        cancelled: false
      };

      executor.activeExecutions.set('test-123', execContext);

      const status = executor.getExecutionStatus('test-123');
      expect(status).toEqual(execContext);
    });
  });

  describe('cancel', () => {
    it('should return false for non-existent execution', async () => {
      const result = await executor.cancel('nonexistent-id');
      expect(result).toBe(false);
    });

    it('should mark execution as cancelled', async () => {
      const mockProcess = {
        kill: vi.fn(),
        killed: false
      };

      const execContext = {
        executionId: 'test-123',
        cancelled: false,
        process: mockProcess
      };

      executor.activeExecutions.set('test-123', execContext);

      const result = await executor.cancel('test-123');

      expect(result).toBe(true);
      expect(execContext.cancelled).toBe(true);
      expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');
    });
  });

  describe('_executeViaAPI', () => {
    it('should throw not implemented error', async () => {
      const execContext = { executionId: 'test-123' };
      const jobDef = { id: 'job1', agent: 'test-agent' };

      await expect(
        executor._executeViaAPI(execContext, jobDef, 'prompt', {}, {})
      ).rejects.toThrow('API execution not yet implemented');
    });
  });

  describe('createAgentExecutor factory', () => {
    it('should create AgentExecutor instance', () => {
      const exec = createAgentExecutor({ streamLogs: false });
      expect(exec).toBeInstanceOf(AgentExecutor);
      expect(exec.options.streamLogs).toBe(false);
    });

    it('should create with default options', () => {
      const exec = createAgentExecutor();
      expect(exec).toBeInstanceOf(AgentExecutor);
    });
  });
});
