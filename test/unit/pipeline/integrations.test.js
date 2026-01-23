import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  GitHubActionsAdapter,
  GitLabCIAdapter,
  JenkinsAdapter,
  WebhookHandler
} from '../../../lib/pipeline/integrations.js';
import fs from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';

/**
 * CI/CD Integrations Unit Tests
 *
 * Tests for pipeline integration adapters
 * Covers GitHub Actions, GitLab CI, Jenkins, and Webhook handlers
 */

describe('GitHubActionsAdapter', () => {
  describe('convertToWorkflow', () => {
    it('should convert basic pipeline', () => {
      const pipeline = {
        name: 'test-pipeline',
        jobs: [
          { id: 'job1', agent: 'test-agent', task: 'Test task' }
        ]
      };

      const workflow = GitHubActionsAdapter.convertToWorkflow(pipeline);

      expect(workflow.name).toBe('test-pipeline');
      expect(workflow.jobs.job1).toBeTruthy();
    });

    it('should set default trigger for missing triggers', () => {
      const pipeline = {
        name: 'test',
        jobs: [{ id: 'job1', agent: 'agent1' }]
      };

      const workflow = GitHubActionsAdapter.convertToWorkflow(pipeline);
      expect(workflow.on.workflow_dispatch).toBeTruthy();
    });

    it('should convert push trigger', () => {
      const pipeline = {
        name: 'test',
        triggers: [
          { type: 'push', branches: ['main', 'develop'] }
        ],
        jobs: [{ id: 'job1', agent: 'agent1' }]
      };

      const workflow = GitHubActionsAdapter.convertToWorkflow(pipeline);
      expect(workflow.on.push.branches).toEqual(['main', 'develop']);
    });

    it('should convert pull_request trigger', () => {
      const pipeline = {
        name: 'test',
        triggers: [
          { type: 'pull_request', branches: ['main'] }
        ],
        jobs: [{ id: 'job1', agent: 'agent1' }]
      };

      const workflow = GitHubActionsAdapter.convertToWorkflow(pipeline);
      expect(workflow.on.pull_request.branches).toEqual(['main']);
    });

    it('should convert schedule trigger', () => {
      const pipeline = {
        name: 'test',
        triggers: [
          { type: 'schedule', cron: '0 0 * * *' }
        ],
        jobs: [{ id: 'job1', agent: 'agent1' }]
      };

      const workflow = GitHubActionsAdapter.convertToWorkflow(pipeline);
      expect(workflow.on.schedule[0].cron).toBe('0 0 * * *');
    });

    it('should add job dependencies', () => {
      const pipeline = {
        name: 'test',
        jobs: [
          { id: 'job1', agent: 'agent1' },
          { id: 'job2', agent: 'agent2', dependsOn: 'job1' }
        ]
      };

      const workflow = GitHubActionsAdapter.convertToWorkflow(pipeline);
      expect(workflow.jobs.job2.needs).toEqual(['job1']);
    });

    it('should handle multiple dependencies', () => {
      const pipeline = {
        name: 'test',
        jobs: [
          { id: 'job1', agent: 'agent1' },
          { id: 'job2', agent: 'agent2' },
          { id: 'job3', agent: 'agent3', dependsOn: ['job1', 'job2'] }
        ]
      };

      const workflow = GitHubActionsAdapter.convertToWorkflow(pipeline);
      expect(workflow.jobs.job3.needs).toEqual(['job1', 'job2']);
    });

    it('should convert job timeout', () => {
      const pipeline = {
        name: 'test',
        jobs: [
          { id: 'job1', agent: 'agent1', timeout: 120000 }
        ]
      };

      const workflow = GitHubActionsAdapter.convertToWorkflow(pipeline);
      expect(workflow.jobs.job1['timeout-minutes']).toBe(2);
    });

    it('should add checkout step', () => {
      const pipeline = {
        name: 'test',
        jobs: [{ id: 'job1', agent: 'agent1' }]
      };

      const workflow = GitHubActionsAdapter.convertToWorkflow(pipeline);
      const steps = workflow.jobs.job1.steps;

      expect(steps[0].uses).toBe('actions/checkout@v4');
    });

    it('should include environment variables', () => {
      const pipeline = {
        name: 'test',
        env: { NODE_ENV: 'production', DEBUG: 'true' },
        jobs: [{ id: 'job1', agent: 'agent1' }]
      };

      const workflow = GitHubActionsAdapter.convertToWorkflow(pipeline);
      expect(workflow.env).toEqual({ NODE_ENV: 'production', DEBUG: 'true' });
    });
  });

  describe('writeWorkflowFile', () => {
    let testDir;

    beforeEach(async () => {
      testDir = await fs.mkdtemp(path.join(tmpdir(), 'gh-actions-test-'));
    });

    afterEach(async () => {
      if (testDir) {
        await fs.rm(testDir, { recursive: true, force: true });
      }
    });

    it('should write workflow to file', async () => {
      const pipeline = {
        name: 'test',
        jobs: [{ id: 'job1', agent: 'agent1' }]
      };

      const outputPath = path.join(testDir, 'workflow.yml');
      await GitHubActionsAdapter.writeWorkflowFile(pipeline, outputPath);

      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toContain('name: test');
    });
  });
});

describe('GitLabCIAdapter', () => {
  describe('convertToConfig', () => {
    it('should convert basic pipeline', () => {
      const pipeline = {
        name: 'test-pipeline',
        jobs: [
          { id: 'job1', agent: 'test-agent', stage: 'test' }
        ]
      };

      const config = GitLabCIAdapter.convertToConfig(pipeline);
      expect(config.job1).toBeTruthy();
      expect(config.job1.stage).toBe('test');
    });

    it('should extract stages from jobs', () => {
      const pipeline = {
        name: 'test',
        jobs: [
          { id: 'job1', agent: 'agent1', stage: 'build' },
          { id: 'job2', agent: 'agent2', stage: 'test' },
          { id: 'job3', agent: 'agent3', stage: 'deploy' }
        ]
      };

      const config = GitLabCIAdapter.convertToConfig(pipeline);
      expect(config.stages).toContain('build');
      expect(config.stages).toContain('test');
      expect(config.stages).toContain('deploy');
    });

    it('should add retry policy', () => {
      const pipeline = {
        name: 'test',
        jobs: [
          { id: 'job1', agent: 'agent1', retry: { maxAttempts: 3 } }
        ]
      };

      const config = GitLabCIAdapter.convertToConfig(pipeline);
      expect(config.job1.retry.max).toBe(3);
    });

    it('should convert dependencies to needs', () => {
      const pipeline = {
        name: 'test',
        jobs: [
          { id: 'job1', agent: 'agent1' },
          { id: 'job2', agent: 'agent2', dependsOn: 'job1' }
        ]
      };

      const config = GitLabCIAdapter.convertToConfig(pipeline);
      expect(config.job2.needs).toEqual([{ job: 'job1' }]);
    });

    it('should include environment variables', () => {
      const pipeline = {
        name: 'test',
        env: { NODE_ENV: 'production' },
        jobs: [{ id: 'job1', agent: 'agent1' }]
      };

      const config = GitLabCIAdapter.convertToConfig(pipeline);
      expect(config.variables).toEqual({ NODE_ENV: 'production' });
    });
  });

  describe('writeConfigFile', () => {
    let testDir;

    beforeEach(async () => {
      testDir = await fs.mkdtemp(path.join(tmpdir(), 'gitlab-ci-test-'));
    });

    afterEach(async () => {
      if (testDir) {
        await fs.rm(testDir, { recursive: true, force: true });
      }
    });

    it('should write config to file', async () => {
      const pipeline = {
        name: 'test',
        jobs: [{ id: 'job1', agent: 'agent1' }]
      };

      const outputPath = path.join(testDir, '.gitlab-ci.yml');
      await GitLabCIAdapter.writeConfigFile(pipeline, outputPath);

      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toContain('job1:');
    });
  });
});

describe('JenkinsAdapter', () => {
  describe('convertToJenkinsfile', () => {
    it('should convert basic pipeline', () => {
      const pipeline = {
        name: 'test-pipeline',
        jobs: [
          { id: 'job1', name: 'Test Job', agent: 'test-agent' }
        ]
      };

      const jenkinsfile = JenkinsAdapter.convertToJenkinsfile(pipeline);

      expect(jenkinsfile).toContain('pipeline {');
      expect(jenkinsfile).toContain('agent any');
      expect(jenkinsfile).toContain("stage('Test Job')");
    });

    it('should include environment variables', () => {
      const pipeline = {
        name: 'test',
        env: { NODE_ENV: 'production', DEBUG: 'true' },
        jobs: [{ id: 'job1', agent: 'agent1' }]
      };

      const jenkinsfile = JenkinsAdapter.convertToJenkinsfile(pipeline);
      expect(jenkinsfile).toContain('NODE_ENV');
      expect(jenkinsfile).toContain('production');
    });

    it('should add post blocks', () => {
      const pipeline = {
        name: 'test',
        jobs: [{ id: 'job1', agent: 'agent1' }]
      };

      const jenkinsfile = JenkinsAdapter.convertToJenkinsfile(pipeline);
      expect(jenkinsfile).toContain('post {');
      expect(jenkinsfile).toContain('always {');
      expect(jenkinsfile).toContain('success {');
      expect(jenkinsfile).toContain('failure {');
    });
  });

  describe('writeJenkinsfile', () => {
    let testDir;

    beforeEach(async () => {
      testDir = await fs.mkdtemp(path.join(tmpdir(), 'jenkins-test-'));
    });

    afterEach(async () => {
      if (testDir) {
        await fs.rm(testDir, { recursive: true, force: true });
      }
    });

    it('should write Jenkinsfile', async () => {
      const pipeline = {
        name: 'test',
        jobs: [{ id: 'job1', agent: 'agent1' }]
      };

      const outputPath = path.join(testDir, 'Jenkinsfile');
      await JenkinsAdapter.writeJenkinsfile(pipeline, outputPath);

      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toContain('pipeline {');
    });
  });
});

describe('WebhookHandler', () => {
  let handler;
  let mockEngine;

  beforeEach(() => {
    mockEngine = {
      startPipeline: vi.fn(async () => 'run-123')
    };
    handler = new WebhookHandler(mockEngine);
  });

  describe('registerWebhook', () => {
    it('should register webhook and return ID', () => {
      const config = {
        pipeline: { name: 'test', jobs: [] },
        secret: 'secret123'
      };

      const webhookId = handler.registerWebhook(config);

      expect(webhookId).toBeTruthy();
      expect(webhookId).toContain('webhook-');
      expect(handler.webhooks.has(webhookId)).toBe(true);
    });

    it('should store webhook configuration', () => {
      const config = {
        pipeline: { name: 'test', jobs: [] },
        secret: 'secret123',
        filters: { branch: 'main' }
      };

      const webhookId = handler.registerWebhook(config);
      const stored = handler.webhooks.get(webhookId);

      expect(stored.pipeline).toBe(config.pipeline);
      expect(stored.secret).toBe('secret123');
      expect(stored.filters).toEqual({ branch: 'main' });
    });
  });

  describe('handleWebhook', () => {
    it('should throw error for non-existent webhook', async () => {
      await expect(
        handler.handleWebhook('nonexistent-id', {}, {})
      ).rejects.toThrow('Webhook not found');
    });

    it('should trigger pipeline on valid webhook', async () => {
      const config = {
        pipeline: { name: 'test', jobs: [] }
      };
      const webhookId = handler.registerWebhook(config);

      const result = await handler.handleWebhook(webhookId, { data: 'test' });

      expect(result.success).toBe(true);
      expect(result.triggered).toBe(true);
      expect(result.runId).toBe('run-123');
      expect(mockEngine.startPipeline).toHaveBeenCalled();
    });

    it('should pass webhook payload to pipeline context', async () => {
      const config = {
        pipeline: { name: 'test', jobs: [] }
      };
      const webhookId = handler.registerWebhook(config);
      const payload = { action: 'push', ref: 'refs/heads/main' };

      await handler.handleWebhook(webhookId, payload);

      expect(mockEngine.startPipeline).toHaveBeenCalledWith(
        config.pipeline,
        expect.objectContaining({
          webhook: payload,
          triggeredBy: 'webhook'
        })
      );
    });

    it('should apply filters', async () => {
      const config = {
        pipeline: { name: 'test', jobs: [] },
        filters: { branch: 'main' }
      };
      const webhookId = handler.registerWebhook(config);

      // Payload doesn't match filter
      const result = await handler.handleWebhook(
        webhookId,
        { branch: 'develop' },
        {}
      );

      expect(result.triggered).toBe(false);
      expect(mockEngine.startPipeline).not.toHaveBeenCalled();
    });

    it('should trigger when filters match', async () => {
      const config = {
        pipeline: { name: 'test', jobs: [] },
        filters: { branch: 'main' }
      };
      const webhookId = handler.registerWebhook(config);

      const result = await handler.handleWebhook(
        webhookId,
        { branch: 'main' },
        {}
      );

      expect(result.triggered).toBe(true);
      expect(mockEngine.startPipeline).toHaveBeenCalled();
    });

    it('should require signature when secret is set', async () => {
      const config = {
        pipeline: { name: 'test', jobs: [] },
        secret: 'secret123'
      };
      const webhookId = handler.registerWebhook(config);

      await expect(
        handler.handleWebhook(webhookId, {}, {})
      ).rejects.toThrow('Missing webhook signature');
    });

    it('should accept signature when provided', async () => {
      const config = {
        pipeline: { name: 'test', jobs: [] },
        secret: 'secret123'
      };
      const webhookId = handler.registerWebhook(config);

      const result = await handler.handleWebhook(
        webhookId,
        {},
        { 'x-webhook-signature': 'abc123' }
      );

      expect(result.triggered).toBe(true);
    });

    it('should transform payload when transform function provided', async () => {
      const config = {
        pipeline: { name: 'test', jobs: [] },
        transform: (payload) => ({ customField: payload.data.toUpperCase() })
      };
      const webhookId = handler.registerWebhook(config);

      await handler.handleWebhook(webhookId, { data: 'test' });

      expect(mockEngine.startPipeline).toHaveBeenCalledWith(
        config.pipeline,
        expect.objectContaining({
          customField: 'TEST'
        })
      );
    });
  });

  describe('_matchesFilters', () => {
    it('should match simple equality filter', () => {
      const payload = { branch: 'main' };
      const filters = { branch: 'main' };

      const result = handler._matchesFilters(payload, filters);
      expect(result).toBe(true);
    });

    it('should not match different values', () => {
      const payload = { branch: 'develop' };
      const filters = { branch: 'main' };

      const result = handler._matchesFilters(payload, filters);
      expect(result).toBe(false);
    });

    it('should match array filters', () => {
      const payload = { branch: 'develop' };
      const filters = { branch: ['main', 'develop'] };

      const result = handler._matchesFilters(payload, filters);
      expect(result).toBe(true);
    });

    it('should handle nested properties', () => {
      const payload = { repository: { name: 'test-repo' } };
      const filters = { 'repository.name': 'test-repo' };

      const result = handler._matchesFilters(payload, filters);
      expect(result).toBe(true);
    });
  });

  describe('_getNestedValue', () => {
    it('should get top-level property', () => {
      const obj = { name: 'test' };
      const value = handler._getNestedValue(obj, 'name');
      expect(value).toBe('test');
    });

    it('should get nested property', () => {
      const obj = { user: { name: 'Alice' } };
      const value = handler._getNestedValue(obj, 'user.name');
      expect(value).toBe('Alice');
    });

    it('should return undefined for missing property', () => {
      const obj = { user: { name: 'Alice' } };
      const value = handler._getNestedValue(obj, 'user.age');
      expect(value).toBeUndefined();
    });
  });

  describe('_generateWebhookId', () => {
    it('should generate unique webhook ID', () => {
      const id1 = handler._generateWebhookId();
      const id2 = handler._generateWebhookId();

      expect(id1).not.toBe(id2);
      expect(id1).toContain('webhook-');
      expect(id2).toContain('webhook-');
    });
  });
});
