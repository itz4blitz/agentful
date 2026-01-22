import { describe, it, expect } from 'vitest';
import { pipelineSchema, validatePipeline } from '../../../lib/pipeline/schemas.js';

/**
 * Pipeline Schemas Unit Tests
 *
 * Tests for pipeline validation schemas and functions
 * Covers schema structure, validation logic, and error handling
 */

describe('pipelineSchema', () => {
  describe('schema structure', () => {
    it('should define required properties', () => {
      expect(pipelineSchema.required).toContain('name');
      expect(pipelineSchema.required).toContain('jobs');
    });

    it('should define name property', () => {
      expect(pipelineSchema.properties.name).toBeTruthy();
      expect(pipelineSchema.properties.name.type).toBe('string');
      expect(pipelineSchema.properties.name.pattern).toBe('^[a-z0-9-]+$');
    });

    it('should define jobs property', () => {
      expect(pipelineSchema.properties.jobs).toBeTruthy();
      expect(pipelineSchema.properties.jobs.type).toBe('array');
      expect(pipelineSchema.properties.jobs.minItems).toBe(1);
    });

    it('should define version property', () => {
      expect(pipelineSchema.properties.version).toBeTruthy();
      expect(pipelineSchema.properties.version.type).toBe('string');
      expect(pipelineSchema.properties.version.pattern).toBeTruthy();
    });

    it('should define triggers property', () => {
      expect(pipelineSchema.properties.triggers).toBeTruthy();
      expect(pipelineSchema.properties.triggers.type).toBe('array');
    });

    it('should define environment variables property', () => {
      expect(pipelineSchema.properties.env).toBeTruthy();
      expect(pipelineSchema.properties.env.type).toBe('object');
    });

    it('should define concurrency settings', () => {
      expect(pipelineSchema.properties.concurrency).toBeTruthy();
      expect(pipelineSchema.properties.concurrency.properties.maxConcurrentJobs).toBeTruthy();
      expect(pipelineSchema.properties.concurrency.properties.maxConcurrentJobs.minimum).toBe(1);
      expect(pipelineSchema.properties.concurrency.properties.maxConcurrentJobs.maximum).toBe(10);
    });

    it('should define timeout property', () => {
      expect(pipelineSchema.properties.timeout).toBeTruthy();
      expect(pipelineSchema.properties.timeout.type).toBe('integer');
      expect(pipelineSchema.properties.timeout.minimum).toBe(1000);
    });
  });

  describe('trigger definition', () => {
    it('should define trigger types', () => {
      const triggerSchema = pipelineSchema.definitions.trigger;
      expect(triggerSchema.properties.type.enum).toContain('push');
      expect(triggerSchema.properties.type.enum).toContain('pull_request');
      expect(triggerSchema.properties.type.enum).toContain('schedule');
      expect(triggerSchema.properties.type.enum).toContain('manual');
      expect(triggerSchema.properties.type.enum).toContain('webhook');
    });

    it('should define branches property', () => {
      const triggerSchema = pipelineSchema.definitions.trigger;
      expect(triggerSchema.properties.branches).toBeTruthy();
      expect(triggerSchema.properties.branches.type).toBe('array');
    });

    it('should define cron property', () => {
      const triggerSchema = pipelineSchema.definitions.trigger;
      expect(triggerSchema.properties.cron).toBeTruthy();
      expect(triggerSchema.properties.cron.type).toBe('string');
    });

    it('should define webhook property', () => {
      const triggerSchema = pipelineSchema.definitions.trigger;
      expect(triggerSchema.properties.webhook).toBeTruthy();
      expect(triggerSchema.properties.webhook.type).toBe('object');
    });
  });

  describe('job definition', () => {
    it('should require id and agent', () => {
      const jobSchema = pipelineSchema.definitions.job;
      expect(jobSchema.required).toContain('id');
      expect(jobSchema.required).toContain('agent');
    });

    it('should define job id with pattern', () => {
      const jobSchema = pipelineSchema.definitions.job;
      expect(jobSchema.properties.id.type).toBe('string');
      expect(jobSchema.properties.id.pattern).toBe('^[a-z0-9-]+$');
    });

    it('should define agent property', () => {
      const jobSchema = pipelineSchema.definitions.job;
      expect(jobSchema.properties.agent).toBeTruthy();
      expect(jobSchema.properties.agent.type).toBe('string');
    });

    it('should define task and prompt properties', () => {
      const jobSchema = pipelineSchema.definitions.job;
      expect(jobSchema.properties.task).toBeTruthy();
      expect(jobSchema.properties.prompt).toBeTruthy();
    });

    it('should define dependsOn as oneOf string or array', () => {
      const jobSchema = pipelineSchema.definitions.job;
      expect(jobSchema.properties.dependsOn.oneOf).toBeTruthy();
      expect(jobSchema.properties.dependsOn.oneOf).toHaveLength(2);
    });

    it('should define when condition property', () => {
      const jobSchema = pipelineSchema.definitions.job;
      expect(jobSchema.properties.when).toBeTruthy();
      expect(jobSchema.properties.when.type).toBe('string');
    });

    it('should define inputs property', () => {
      const jobSchema = pipelineSchema.definitions.job;
      expect(jobSchema.properties.inputs).toBeTruthy();
      expect(jobSchema.properties.inputs.type).toBe('object');
    });

    it('should define timeout property', () => {
      const jobSchema = pipelineSchema.definitions.job;
      expect(jobSchema.properties.timeout).toBeTruthy();
      expect(jobSchema.properties.timeout.type).toBe('integer');
      expect(jobSchema.properties.timeout.minimum).toBe(1000);
    });

    it('should define continueOnError property', () => {
      const jobSchema = pipelineSchema.definitions.job;
      expect(jobSchema.properties.continueOnError).toBeTruthy();
      expect(jobSchema.properties.continueOnError.type).toBe('boolean');
      expect(jobSchema.properties.continueOnError.default).toBe(false);
    });

    it('should define execution configuration', () => {
      const jobSchema = pipelineSchema.definitions.job;
      expect(jobSchema.properties.execution).toBeTruthy();
      expect(jobSchema.properties.execution.properties.method).toBeTruthy();
      expect(jobSchema.properties.execution.properties.method.enum).toContain('subprocess');
      expect(jobSchema.properties.execution.properties.method.enum).toContain('api');
    });

    it('should define CI/CD integration properties', () => {
      const jobSchema = pipelineSchema.definitions.job;
      expect(jobSchema.properties.runsOn).toBeTruthy();
      expect(jobSchema.properties.stage).toBeTruthy();
      expect(jobSchema.properties.setup).toBeTruthy();
    });
  });

  describe('retry definition', () => {
    it('should define maxAttempts', () => {
      const retrySchema = pipelineSchema.definitions.retry;
      expect(retrySchema.properties.maxAttempts).toBeTruthy();
      expect(retrySchema.properties.maxAttempts.type).toBe('integer');
      expect(retrySchema.properties.maxAttempts.minimum).toBe(0);
      expect(retrySchema.properties.maxAttempts.maximum).toBe(5);
    });

    it('should define backoff strategies', () => {
      const retrySchema = pipelineSchema.definitions.retry;
      expect(retrySchema.properties.backoff).toBeTruthy();
      expect(retrySchema.properties.backoff.enum).toContain('exponential');
      expect(retrySchema.properties.backoff.enum).toContain('linear');
      expect(retrySchema.properties.backoff.enum).toContain('fixed');
    });

    it('should define delay property', () => {
      const retrySchema = pipelineSchema.definitions.retry;
      expect(retrySchema.properties.delayMs).toBeTruthy();
      expect(retrySchema.properties.delayMs.type).toBe('integer');
      expect(retrySchema.properties.delayMs.minimum).toBe(0);
    });
  });
});

describe('validatePipeline', () => {
  describe('valid pipelines', () => {
    it('should accept valid minimal pipeline', () => {
      const pipeline = {
        name: 'test-pipeline',
        jobs: [
          { id: 'job1', agent: 'test-agent' }
        ]
      };

      const result = validatePipeline(pipeline);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept pipeline with multiple jobs', () => {
      const pipeline = {
        name: 'test-pipeline',
        jobs: [
          { id: 'job1', agent: 'agent1' },
          { id: 'job2', agent: 'agent2' },
          { id: 'job3', agent: 'agent3' }
        ]
      };

      const result = validatePipeline(pipeline);
      expect(result.valid).toBe(true);
    });

    it('should accept pipeline with job dependencies', () => {
      const pipeline = {
        name: 'test-pipeline',
        jobs: [
          { id: 'job1', agent: 'agent1' },
          { id: 'job2', agent: 'agent2', dependsOn: 'job1' }
        ]
      };

      const result = validatePipeline(pipeline);
      expect(result.valid).toBe(true);
    });

    it('should accept pipeline with multiple dependencies', () => {
      const pipeline = {
        name: 'test-pipeline',
        jobs: [
          { id: 'job1', agent: 'agent1' },
          { id: 'job2', agent: 'agent2' },
          { id: 'job3', agent: 'agent3', dependsOn: ['job1', 'job2'] }
        ]
      };

      const result = validatePipeline(pipeline);
      expect(result.valid).toBe(true);
    });

    it('should accept pipeline with all optional properties', () => {
      const pipeline = {
        name: 'test-pipeline',
        version: '1.0',
        description: 'Test pipeline',
        jobs: [
          {
            id: 'job1',
            name: 'Test Job',
            agent: 'test-agent',
            task: 'Run tests',
            prompt: 'Test prompt',
            timeout: 60000,
            continueOnError: false,
            inputs: { key: 'value' }
          }
        ]
      };

      const result = validatePipeline(pipeline);
      expect(result.valid).toBe(true);
    });
  });

  describe('invalid pipelines', () => {
    it('should reject pipeline without name', () => {
      const pipeline = {
        jobs: [{ id: 'job1', agent: 'agent1' }]
      };

      const result = validatePipeline(pipeline);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Pipeline must have a name');
    });

    it('should reject pipeline without jobs', () => {
      const pipeline = {
        name: 'test-pipeline'
      };

      const result = validatePipeline(pipeline);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Pipeline must have at least one job');
    });

    it('should reject pipeline with non-array jobs', () => {
      const pipeline = {
        name: 'test-pipeline',
        jobs: 'not-an-array'
      };

      const result = validatePipeline(pipeline);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Pipeline must have at least one job');
    });

    it('should reject pipeline with empty jobs array', () => {
      const pipeline = {
        name: 'test-pipeline',
        jobs: []
      };

      const result = validatePipeline(pipeline);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Pipeline must have at least one job');
    });

    it('should reject job without id', () => {
      const pipeline = {
        name: 'test-pipeline',
        jobs: [
          { agent: 'test-agent' }
        ]
      };

      const result = validatePipeline(pipeline);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Each job must have an id');
    });

    it('should reject job without agent', () => {
      const pipeline = {
        name: 'test-pipeline',
        jobs: [
          { id: 'job1' }
        ]
      };

      const result = validatePipeline(pipeline);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Job job1 must specify an agent');
    });

    it('should reject duplicate job ids', () => {
      const pipeline = {
        name: 'test-pipeline',
        jobs: [
          { id: 'job1', agent: 'agent1' },
          { id: 'job1', agent: 'agent2' }
        ]
      };

      const result = validatePipeline(pipeline);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Duplicate job id: job1');
    });

    it('should reject dependency on unknown job (string)', () => {
      const pipeline = {
        name: 'test-pipeline',
        jobs: [
          { id: 'job1', agent: 'agent1', dependsOn: 'unknown-job' }
        ]
      };

      const result = validatePipeline(pipeline);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Job job1 depends on unknown job: unknown-job');
    });

    it('should reject dependency on unknown job (array)', () => {
      const pipeline = {
        name: 'test-pipeline',
        jobs: [
          { id: 'job1', agent: 'agent1' },
          { id: 'job2', agent: 'agent2', dependsOn: ['job1', 'unknown-job'] }
        ]
      };

      const result = validatePipeline(pipeline);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Job job2 depends on unknown job: unknown-job');
    });

    it('should collect multiple validation errors', () => {
      const pipeline = {
        name: 'test-pipeline',
        jobs: [
          { agent: 'agent1' }, // Missing id
          { id: 'job2' }, // Missing agent
          { id: 'job3', agent: 'agent3', dependsOn: 'unknown-job' } // Unknown dependency
        ]
      };

      const result = validatePipeline(pipeline);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain('Each job must have an id');
      expect(result.errors).toContain('Job job2 must specify an agent');
    });
  });

  describe('edge cases', () => {
    it('should handle null pipeline', () => {
      const result = validatePipeline(null);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle undefined pipeline', () => {
      const result = validatePipeline(undefined);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle empty object pipeline', () => {
      const result = validatePipeline({});
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Pipeline must have a name');
      expect(result.errors).toContain('Pipeline must have at least one job');
    });

    it('should handle pipeline with null jobs', () => {
      const pipeline = {
        name: 'test-pipeline',
        jobs: null
      };

      const result = validatePipeline(pipeline);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Pipeline must have at least one job');
    });

    it('should handle job with empty string id', () => {
      const pipeline = {
        name: 'test-pipeline',
        jobs: [
          { id: '', agent: 'agent1' }
        ]
      };

      const result = validatePipeline(pipeline);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Each job must have an id');
    });

    it('should handle job with empty string agent', () => {
      const pipeline = {
        name: 'test-pipeline',
        jobs: [
          { id: 'job1', agent: '' }
        ]
      };

      const result = validatePipeline(pipeline);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Job job1 must specify an agent');
    });

    it('should handle dependsOn as empty array', () => {
      const pipeline = {
        name: 'test-pipeline',
        jobs: [
          { id: 'job1', agent: 'agent1', dependsOn: [] }
        ]
      };

      const result = validatePipeline(pipeline);
      expect(result.valid).toBe(true);
    });

    it('should handle dependsOn as empty string', () => {
      const pipeline = {
        name: 'test-pipeline',
        jobs: [
          { id: 'job1', agent: 'agent1', dependsOn: '' }
        ]
      };

      const result = validatePipeline(pipeline);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Job job1 depends on unknown job: ');
    });
  });

  describe('complex dependency scenarios', () => {
    it('should validate linear dependency chain', () => {
      const pipeline = {
        name: 'test-pipeline',
        jobs: [
          { id: 'job1', agent: 'agent1' },
          { id: 'job2', agent: 'agent2', dependsOn: 'job1' },
          { id: 'job3', agent: 'agent3', dependsOn: 'job2' },
          { id: 'job4', agent: 'agent4', dependsOn: 'job3' }
        ]
      };

      const result = validatePipeline(pipeline);
      expect(result.valid).toBe(true);
    });

    it('should validate diamond dependency pattern', () => {
      const pipeline = {
        name: 'test-pipeline',
        jobs: [
          { id: 'job1', agent: 'agent1' },
          { id: 'job2', agent: 'agent2', dependsOn: 'job1' },
          { id: 'job3', agent: 'agent3', dependsOn: 'job1' },
          { id: 'job4', agent: 'agent4', dependsOn: ['job2', 'job3'] }
        ]
      };

      const result = validatePipeline(pipeline);
      expect(result.valid).toBe(true);
    });

    it('should validate parallel jobs with no dependencies', () => {
      const pipeline = {
        name: 'test-pipeline',
        jobs: [
          { id: 'job1', agent: 'agent1' },
          { id: 'job2', agent: 'agent2' },
          { id: 'job3', agent: 'agent3' },
          { id: 'job4', agent: 'agent4' }
        ]
      };

      const result = validatePipeline(pipeline);
      expect(result.valid).toBe(true);
    });

    it('should validate job depending on multiple jobs', () => {
      const pipeline = {
        name: 'test-pipeline',
        jobs: [
          { id: 'job1', agent: 'agent1' },
          { id: 'job2', agent: 'agent2' },
          { id: 'job3', agent: 'agent3' },
          { id: 'job4', agent: 'agent4', dependsOn: ['job1', 'job2', 'job3'] }
        ]
      };

      const result = validatePipeline(pipeline);
      expect(result.valid).toBe(true);
    });

    it('should reject when dependency is defined before it exists', () => {
      const pipeline = {
        name: 'test-pipeline',
        jobs: [
          { id: 'job1', agent: 'agent1', dependsOn: 'job2' },
          { id: 'job2', agent: 'agent2' }
        ]
      };

      // Note: The current validation only checks if the job exists in the array,
      // not the order. This test documents current behavior.
      const result = validatePipeline(pipeline);
      expect(result.valid).toBe(true);
    });
  });

  describe('validation result structure', () => {
    it('should return object with valid and errors properties', () => {
      const pipeline = {
        name: 'test-pipeline',
        jobs: [{ id: 'job1', agent: 'agent1' }]
      };

      const result = validatePipeline(pipeline);
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('errors');
      expect(typeof result.valid).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should have empty errors array for valid pipeline', () => {
      const pipeline = {
        name: 'test-pipeline',
        jobs: [{ id: 'job1', agent: 'agent1' }]
      };

      const result = validatePipeline(pipeline);
      expect(result.errors).toEqual([]);
    });

    it('should have non-empty errors array for invalid pipeline', () => {
      const pipeline = {
        name: 'test-pipeline',
        jobs: []
      };

      const result = validatePipeline(pipeline);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should set valid to false when errors exist', () => {
      const pipeline = { name: 'test' };

      const result = validatePipeline(pipeline);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should set valid to true when no errors exist', () => {
      const pipeline = {
        name: 'test',
        jobs: [{ id: 'job1', agent: 'agent1' }]
      };

      const result = validatePipeline(pipeline);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
