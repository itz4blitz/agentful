/**
 * JSON Schemas for Pipeline Definitions
 *
 * Provides validation schemas for pipeline YAML files
 */

export const pipelineSchema = {
  type: 'object',
  required: ['name', 'jobs'],
  properties: {
    name: {
      type: 'string',
      description: 'Pipeline name',
      pattern: '^[a-z0-9-]+$'
    },
    version: {
      type: 'string',
      description: 'Pipeline version',
      pattern: '^\\d+\\.\\d+(\\.\\d+)?$',
      default: '1.0'
    },
    description: {
      type: 'string',
      description: 'Pipeline description'
    },
    triggers: {
      type: 'array',
      description: 'Pipeline triggers',
      items: {
        $ref: '#/definitions/trigger'
      }
    },
    env: {
      type: 'object',
      description: 'Environment variables',
      additionalProperties: { type: 'string' }
    },
    jobs: {
      type: 'array',
      description: 'Pipeline jobs',
      minItems: 1,
      items: {
        $ref: '#/definitions/job'
      }
    },
    concurrency: {
      type: 'object',
      description: 'Concurrency settings',
      properties: {
        maxConcurrentJobs: {
          type: 'integer',
          minimum: 1,
          maximum: 10,
          default: 3
        },
        cancelInProgress: {
          type: 'boolean',
          default: false
        }
      }
    },
    timeout: {
      type: 'integer',
      description: 'Default job timeout in milliseconds',
      minimum: 1000,
      default: 1800000 // 30 minutes
    }
  },
  definitions: {
    trigger: {
      type: 'object',
      required: ['type'],
      properties: {
        type: {
          type: 'string',
          enum: ['push', 'pull_request', 'schedule', 'manual', 'webhook']
        },
        branches: {
          type: 'array',
          items: { type: 'string' }
        },
        cron: {
          type: 'string',
          description: 'Cron expression for scheduled triggers'
        },
        webhook: {
          type: 'object',
          properties: {
            secret: { type: 'string' },
            filters: { type: 'object' }
          }
        }
      }
    },
    job: {
      type: 'object',
      required: ['id', 'agent'],
      properties: {
        id: {
          type: 'string',
          description: 'Unique job identifier',
          pattern: '^[a-z0-9-]+$'
        },
        name: {
          type: 'string',
          description: 'Human-readable job name'
        },
        agent: {
          type: 'string',
          description: 'Agent to execute (name or path)'
        },
        task: {
          type: 'string',
          description: 'Task description for the agent'
        },
        prompt: {
          type: 'string',
          description: 'Additional prompt instructions'
        },
        dependsOn: {
          oneOf: [
            { type: 'string' },
            { type: 'array', items: { type: 'string' } }
          ],
          description: 'Job dependencies'
        },
        when: {
          type: 'string',
          description: 'Conditional execution expression'
        },
        inputs: {
          type: 'object',
          description: 'Job-specific inputs',
          additionalProperties: true
        },
        timeout: {
          type: 'integer',
          description: 'Job timeout in milliseconds',
          minimum: 1000
        },
        retry: {
          $ref: '#/definitions/retry'
        },
        continueOnError: {
          type: 'boolean',
          description: 'Continue pipeline even if this job fails',
          default: false
        },
        execution: {
          type: 'object',
          description: 'Execution configuration',
          properties: {
            method: {
              type: 'string',
              enum: ['subprocess', 'api'],
              default: 'subprocess'
            },
            isolation: {
              type: 'string',
              enum: ['shared', 'isolated'],
              default: 'shared'
            }
          }
        },
        runsOn: {
          type: 'string',
          description: 'Runner environment (for CI/CD integrations)',
          default: 'ubuntu-latest'
        },
        stage: {
          type: 'string',
          description: 'Pipeline stage (for GitLab CI)',
          default: 'test'
        },
        setup: {
          type: 'array',
          description: 'Setup steps before job execution',
          items: {
            type: 'object',
            required: ['command'],
            properties: {
              name: { type: 'string' },
              command: { type: 'string' }
            }
          }
        }
      }
    },
    retry: {
      type: 'object',
      description: 'Retry policy',
      properties: {
        maxAttempts: {
          type: 'integer',
          minimum: 0,
          maximum: 5,
          default: 0
        },
        backoff: {
          type: 'string',
          enum: ['exponential', 'linear', 'fixed'],
          default: 'exponential'
        },
        delayMs: {
          type: 'integer',
          minimum: 0,
          default: 2000
        }
      }
    }
  }
};

/**
 * Validate pipeline definition
 *
 * @param {Object} pipeline - Pipeline definition
 * @returns {Object} Validation result { valid: boolean, errors: array }
 */
export function validatePipeline(pipeline) {
  // Basic validation
  const errors = [];

  if (!pipeline.name) {
    errors.push('Pipeline must have a name');
  }

  if (!pipeline.jobs || !Array.isArray(pipeline.jobs) || pipeline.jobs.length === 0) {
    errors.push('Pipeline must have at least one job');
  }

  // Validate jobs
  const jobIds = new Set();
  for (const job of pipeline.jobs || []) {
    if (!job.id) {
      errors.push('Each job must have an id');
    } else if (jobIds.has(job.id)) {
      errors.push(`Duplicate job id: ${job.id}`);
    } else {
      jobIds.add(job.id);
    }

    if (!job.agent) {
      errors.push(`Job ${job.id} must specify an agent`);
    }

    // Validate dependencies
    if (job.dependsOn) {
      const deps = Array.isArray(job.dependsOn) ? job.dependsOn : [job.dependsOn];
      for (const depId of deps) {
        if (!jobIds.has(depId)) {
          errors.push(`Job ${job.id} depends on unknown job: ${depId}`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export default {
  pipelineSchema,
  validatePipeline
};
