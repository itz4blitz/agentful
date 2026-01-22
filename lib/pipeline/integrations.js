import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';

/**
 * CI/CD Integration Adapters
 *
 * Provides adapters for various CI/CD platforms:
 * - GitHub Actions
 * - GitLab CI
 * - Jenkins
 * - Webhook triggers
 */

/**
 * GitHub Actions Integration
 *
 * Converts agentful pipelines to GitHub Actions workflows
 */
export class GitHubActionsAdapter {
  /**
   * Convert pipeline to GitHub Actions workflow
   *
   * @param {Object} pipeline - Agentful pipeline definition
   * @returns {Object} GitHub Actions workflow YAML
   */
  static convertToWorkflow(pipeline) {
    const workflow = {
      name: pipeline.name,
      on: this._convertTriggers(pipeline.triggers),
      env: pipeline.env || {},
      jobs: {}
    };

    // Convert each job
    for (const job of pipeline.jobs) {
      const ghJob = {
        'runs-on': job.runsOn || 'ubuntu-latest',
        steps: this._convertJobSteps(job)
      };

      // Add dependencies
      if (job.dependsOn) {
        ghJob.needs = Array.isArray(job.dependsOn) ? job.dependsOn : [job.dependsOn];
      }

      // Add conditionals
      if (job.when) {
        ghJob.if = this._convertCondition(job.when);
      }

      // Add timeout
      if (job.timeout) {
        ghJob['timeout-minutes'] = Math.ceil(job.timeout / 60000);
      }

      workflow.jobs[job.id] = ghJob;
    }

    return workflow;
  }

  /**
   * Internal: Convert pipeline triggers to GitHub Actions triggers
   *
   * @private
   */
  static _convertTriggers(triggers) {
    if (!triggers) {
      return { workflow_dispatch: {} }; // Manual trigger only
    }

    const ghTriggers = {};

    for (const trigger of triggers) {
      if (trigger.type === 'push') {
        ghTriggers.push = {
          branches: trigger.branches || ['main']
        };
      } else if (trigger.type === 'pull_request') {
        ghTriggers.pull_request = {
          branches: trigger.branches || ['main']
        };
      } else if (trigger.type === 'schedule') {
        ghTriggers.schedule = [{ cron: trigger.cron }];
      } else if (trigger.type === 'manual') {
        ghTriggers.workflow_dispatch = {};
      }
    }

    return ghTriggers;
  }

  /**
   * Internal: Convert job steps
   *
   * @private
   */
  static _convertJobSteps(job) {
    const steps = [
      {
        name: 'Checkout code',
        uses: 'actions/checkout@v4'
      }
    ];

    // Add setup steps
    if (job.setup) {
      for (const setupStep of job.setup) {
        steps.push({
          name: setupStep.name,
          run: setupStep.command
        });
      }
    }

    // Add main agent execution step
    steps.push({
      name: `Execute ${job.name}`,
      run: this._buildAgentExecutionCommand(job),
      env: {
        AGENTFUL_AGENT: job.agent,
        AGENTFUL_CONTEXT: '${{ toJson(github) }}'
      }
    });

    return steps;
  }

  /**
   * Internal: Build agent execution command
   *
   * @private
   */
  static _buildAgentExecutionCommand(job) {
    return `
npx agentful pipeline run \\
  --job ${job.id} \\
  --agent ${job.agent} \\
  --context-file context.json
`.trim();
  }

  /**
   * Internal: Convert condition to GitHub Actions format
   *
   * @private
   */
  static _convertCondition(condition) {
    // Simple mapping - would need more sophisticated conversion
    return condition
      .replace(/status\s*==\s*'completed'/, "success()")
      .replace(/status\s*==\s*'failed'/, "failure()");
  }

  /**
   * Write GitHub Actions workflow file
   *
   * @param {Object} pipeline - Agentful pipeline definition
   * @param {string} outputPath - Path to write workflow file
   */
  static async writeWorkflowFile(pipeline, outputPath) {
    const workflow = this.convertToWorkflow(pipeline);
    const yamlContent = yaml.dump(workflow, { lineWidth: 120 });

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, yamlContent);

    return outputPath;
  }
}

/**
 * GitLab CI Integration
 *
 * Converts agentful pipelines to GitLab CI configuration
 */
export class GitLabCIAdapter {
  /**
   * Convert pipeline to GitLab CI configuration
   *
   * @param {Object} pipeline - Agentful pipeline definition
   * @returns {Object} GitLab CI YAML
   */
  static convertToConfig(pipeline) {
    const config = {
      stages: this._extractStages(pipeline.jobs),
      variables: pipeline.env || {}
    };

    // Convert each job
    for (const job of pipeline.jobs) {
      const glJob = {
        stage: job.stage || 'test',
        script: this._convertJobScript(job)
      };

      // Add dependencies
      if (job.dependsOn) {
        glJob.needs = Array.isArray(job.dependsOn)
          ? job.dependsOn.map(dep => ({ job: dep }))
          : [{ job: job.dependsOn }];
      }

      // Add rules (conditionals)
      if (job.when) {
        glJob.rules = [{ if: this._convertCondition(job.when) }];
      }

      // Add timeout
      if (job.timeout) {
        glJob.timeout = `${Math.ceil(job.timeout / 60)}m`;
      }

      // Add retry policy
      if (job.retry) {
        glJob.retry = {
          max: job.retry.maxAttempts || 2,
          when: ['runner_system_failure', 'stuck_or_timeout_failure']
        };
      }

      config[job.id] = glJob;
    }

    return config;
  }

  /**
   * Internal: Extract stages from jobs
   *
   * @private
   */
  static _extractStages(jobs) {
    const stages = new Set(['build', 'test', 'deploy']);

    for (const job of jobs) {
      if (job.stage) {
        stages.add(job.stage);
      }
    }

    return Array.from(stages);
  }

  /**
   * Internal: Convert job script
   *
   * @private
   */
  static _convertJobScript(job) {
    const script = [];

    // Setup commands
    if (job.setup) {
      for (const setupStep of job.setup) {
        script.push(setupStep.command);
      }
    }

    // Main agent execution
    script.push(
      `npx agentful pipeline run --job ${job.id} --agent ${job.agent}`
    );

    return script;
  }

  /**
   * Internal: Convert condition to GitLab CI format
   *
   * @private
   */
  static _convertCondition(condition) {
    // GitLab CI uses different syntax
    return condition
      .replace(/status\s*==\s*'completed'/, '$CI_JOB_STATUS == "success"')
      .replace(/status\s*==\s*'failed'/, '$CI_JOB_STATUS == "failed"');
  }

  /**
   * Write GitLab CI configuration file
   *
   * @param {Object} pipeline - Agentful pipeline definition
   * @param {string} outputPath - Path to write config file
   */
  static async writeConfigFile(pipeline, outputPath) {
    const config = this.convertToConfig(pipeline);
    const yamlContent = yaml.dump(config, { lineWidth: 120 });

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, yamlContent);

    return outputPath;
  }
}

/**
 * Jenkins Integration
 *
 * Converts agentful pipelines to Jenkins pipeline syntax
 */
export class JenkinsAdapter {
  /**
   * Convert pipeline to Jenkinsfile
   *
   * @param {Object} pipeline - Agentful pipeline definition
   * @returns {string} Jenkinsfile content
   */
  static convertToJenkinsfile(pipeline) {
    const stages = this._convertJobsToStages(pipeline.jobs);

    return `
pipeline {
  agent any

  environment {
${this._formatEnvironment(pipeline.env || {})}
  }

  stages {
${stages}
  }

  post {
    always {
      echo 'Pipeline completed'
    }
    success {
      echo 'Pipeline succeeded'
    }
    failure {
      echo 'Pipeline failed'
    }
  }
}
`.trim();
  }

  /**
   * Internal: Convert jobs to Jenkins stages
   *
   * @private
   */
  static _convertJobsToStages(jobs) {
    const stages = [];

    for (const job of jobs) {
      const stage = `
    stage('${job.name || job.id}') {
      steps {
${this._formatSteps(job)}
      }
    }`;
      stages.push(stage);
    }

    return stages.join('\n');
  }

  /**
   * Internal: Format environment variables
   *
   * @private
   */
  static _formatEnvironment(env) {
    return Object.entries(env)
      .map(([key, value]) => `    ${key} = '${value}'`)
      .join('\n');
  }

  /**
   * Internal: Format job steps
   *
   * @private
   */
  static _formatSteps(job) {
    const steps = [];

    // Setup steps
    if (job.setup) {
      for (const setupStep of job.setup) {
        steps.push(`        sh '${setupStep.command}'`);
      }
    }

    // Main agent execution
    steps.push(`        sh 'npx agentful pipeline run --job ${job.id} --agent ${job.agent}'`);

    return steps.join('\n');
  }

  /**
   * Write Jenkinsfile
   *
   * @param {Object} pipeline - Agentful pipeline definition
   * @param {string} outputPath - Path to write Jenkinsfile
   */
  static async writeJenkinsfile(pipeline, outputPath) {
    const content = this.convertToJenkinsfile(pipeline);

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, content);

    return outputPath;
  }
}

/**
 * Webhook Handler
 *
 * Handles webhook triggers for pipelines
 */
export class WebhookHandler {
  constructor(pipelineEngine) {
    this.pipelineEngine = pipelineEngine;
    this.webhooks = new Map(); // webhookId -> WebhookConfig
  }

  /**
   * Register webhook trigger
   *
   * @param {Object} config - Webhook configuration
   * @returns {string} Webhook ID
   */
  registerWebhook(config) {
    const webhookId = this._generateWebhookId();

    this.webhooks.set(webhookId, {
      id: webhookId,
      pipeline: config.pipeline,
      secret: config.secret,
      filters: config.filters || {},
      transform: config.transform || null,
      createdAt: new Date().toISOString()
    });

    return webhookId;
  }

  /**
   * Handle webhook request
   *
   * @param {string} webhookId - Webhook ID
   * @param {Object} payload - Webhook payload
   * @param {Object} headers - Request headers
   * @returns {Promise<Object>} Result
   */
  async handleWebhook(webhookId, payload, headers = {}) {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      throw new Error(`Webhook not found: ${webhookId}`);
    }

    // Verify signature if secret is set
    if (webhook.secret) {
      this._verifySignature(webhook.secret, payload, headers);
    }

    // Apply filters
    if (!this._matchesFilters(payload, webhook.filters)) {
      return {
        success: true,
        message: 'Webhook ignored due to filters',
        triggered: false
      };
    }

    // Transform payload to context
    const context = webhook.transform
      ? webhook.transform(payload)
      : { webhook: payload };

    // Trigger pipeline
    const runId = await this.pipelineEngine.startPipeline(webhook.pipeline, {
      ...context,
      triggeredBy: 'webhook',
      webhookId
    });

    return {
      success: true,
      message: 'Pipeline triggered',
      triggered: true,
      runId
    };
  }

  /**
   * Internal: Verify webhook signature
   *
   * @private
   */
  _verifySignature(secret, payload, headers) {
    // Implementation depends on the webhook provider
    // GitHub, GitLab, etc. have different signature schemes

    // For GitHub:
    // const signature = headers['x-hub-signature-256'];
    // const expectedSignature = crypto
    //   .createHmac('sha256', secret)
    //   .update(JSON.stringify(payload))
    //   .digest('hex');

    // For now, just check if signature header exists
    const signature = headers['x-webhook-signature'] || headers['x-hub-signature-256'];
    if (!signature) {
      throw new Error('Missing webhook signature');
    }
  }

  /**
   * Internal: Check if payload matches filters
   *
   * @private
   */
  _matchesFilters(payload, filters) {
    for (const [key, value] of Object.entries(filters)) {
      const payloadValue = this._getNestedValue(payload, key);

      if (Array.isArray(value)) {
        if (!value.includes(payloadValue)) return false;
      } else if (payloadValue !== value) {
        return false;
      }
    }

    return true;
  }

  /**
   * Internal: Get nested value from object
   *
   * @private
   */
  _getNestedValue(obj, path) {
    return path.split('.').reduce((current, prop) => {
      return current && current[prop] !== undefined ? current[prop] : undefined;
    }, obj);
  }

  /**
   * Internal: Generate webhook ID
   *
   * @private
   */
  _generateWebhookId() {
    return `webhook-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

/**
 * Export all adapters
 */
export default {
  GitHubActionsAdapter,
  GitLabCIAdapter,
  JenkinsAdapter,
  WebhookHandler
};
