# Pipeline Orchestration System

A robust orchestration system for running AI agents in complex, long-running workflows with dependency management, parallel execution, and fault tolerance.

## Features

- **Async Execution** - Handle workflows that take 5-30 minutes
- **Parallel Jobs** - Run multiple agents concurrently for speed
- **Dependency Management** - Automatic dependency graph resolution
- **State Persistence** - Resume interrupted pipelines
- **Retry Policies** - Automatic retry with exponential backoff
- **Progress Tracking** - Real-time progress updates and logs
- **CI/CD Integration** - Export to GitHub Actions, GitLab CI, Jenkins
- **Webhook Triggers** - Trigger pipelines via HTTP webhooks
- **Cost Optimization** - Minimize redundant LLM API calls

## Quick Start

### 1. Install

```bash
npm install @itz4blitz/agentful
```

### 2. Create Pipeline

Create `.agentful/pipelines/my-pipeline.yml`:

```yaml
name: my-pipeline
version: 1.0

jobs:
  - id: step-1
    agent: backend
    task: Implement API endpoint

  - id: step-2
    agent: frontend
    dependsOn: step-1
    task: Create UI component

  - id: step-3
    agent: tester
    dependsOn: [step-1, step-2]
    task: Write tests
```

### 3. Run Pipeline

```bash
npx agentful pipeline run --pipeline .agentful/pipelines/my-pipeline.yml
```

### 4. Check Status

```bash
npx agentful pipeline status --run-id my-pipeline-1234567890-abc
```

## Architecture

```
┌─────────────────────────────────────────┐
│         Pipeline Engine                 │
│  - Dependency resolution                │
│  - Job scheduling                       │
│  - State persistence                    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         Agent Executor                  │
│  - Agent invocation                     │
│  - Context passing                      │
│  - Log streaming                        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│            AI Agents                    │
│  backend │ frontend │ tester │ ...     │
└─────────────────────────────────────────┘
```

## Components

### Pipeline Engine (`engine.js`)

Core orchestration engine that manages pipeline execution:

```javascript
import { PipelineEngine } from '@itz4blitz/agentful/pipeline';

const engine = new PipelineEngine({
  maxConcurrentJobs: 3,
  stateDir: '.agentful/pipelines',
  defaultTimeout: 1800000 // 30 minutes
});

// Start pipeline
const runId = await engine.startPipeline(pipeline, context);

// Get status
const status = engine.getPipelineStatus(runId);

// Cancel pipeline
await engine.cancelPipeline(runId);

// Resume interrupted pipeline
await engine.resumePipeline(runId);
```

**Events:**
- `pipeline:started` - Pipeline execution started
- `pipeline:completed` - Pipeline completed successfully
- `pipeline:failed` - Pipeline failed
- `job:started` - Job started execution
- `job:completed` - Job completed successfully
- `job:failed` - Job failed
- `job:progress` - Job progress update
- `job:log` - Job log output

### Agent Executor (`executor.js`)

Handles agent execution lifecycle:

```javascript
import { AgentExecutor } from '@itz4blitz/agentful/pipeline';

const executor = new AgentExecutor({
  agentsDir: '.claude/agents',
  tempDir: '.agentful/pipelines/temp',
  streamLogs: true
});

// Execute agent
const result = await executor.execute(
  jobDef,
  context,
  {
    timeout: 600000,
    onProgress: (progress) => console.log(`Progress: ${progress}%`),
    onLog: (message) => console.log(message)
  }
);

// Cancel execution
await executor.cancel(executionId);
```

### Integration Adapters (`integrations.js`)

Convert pipelines to CI/CD platform formats:

```javascript
import {
  GitHubActionsAdapter,
  GitLabCIAdapter,
  JenkinsAdapter,
  WebhookHandler
} from '@itz4blitz/agentful/pipeline';

// Export to GitHub Actions
const workflow = GitHubActionsAdapter.convertToWorkflow(pipeline);
await GitHubActionsAdapter.writeWorkflowFile(
  pipeline,
  '.github/workflows/agentful.yml'
);

// Export to GitLab CI
const config = GitLabCIAdapter.convertToConfig(pipeline);
await GitLabCIAdapter.writeConfigFile(pipeline, '.gitlab-ci.yml');

// Export to Jenkins
const jenkinsfile = JenkinsAdapter.convertToJenkinsfile(pipeline);
await JenkinsAdapter.writeJenkinsfile(pipeline, 'Jenkinsfile');

// Setup webhook handler
const webhookHandler = new WebhookHandler(engine);
const webhookId = webhookHandler.registerWebhook({
  pipeline: 'deploy-production.yml',
  secret: process.env.WEBHOOK_SECRET,
  filters: { event_type: 'deploy' }
});
```

## Pipeline Definition

### Basic Structure

```yaml
name: pipeline-name
version: 1.0
description: Pipeline description

jobs:
  - id: job-1
    agent: agent-name
    task: What the agent should do
```

### Full Options

```yaml
name: advanced-pipeline
version: 1.0
description: Advanced pipeline with all features

# Triggers
triggers:
  - type: push
    branches: [main]
  - type: pull_request
  - type: schedule
    cron: "0 0 * * *"
  - type: manual
  - type: webhook
    filters:
      event_type: deploy

# Environment variables
env:
  NODE_ENV: production
  API_KEY: ${{ secrets.API_KEY }}

# Concurrency
concurrency:
  maxConcurrentJobs: 3
  cancelInProgress: false

# Default timeout
timeout: 1800000

jobs:
  - id: job-id
    name: Human-readable name
    agent: agent-name
    task: Detailed task description
    prompt: Additional instructions

    # Dependencies
    dependsOn:
      - job-1
      - job-2

    # Conditional execution
    when: "job-1.status == 'completed'"

    # Inputs
    inputs:
      data: ${{ job-1.output.result }}

    # Timeout
    timeout: 600000

    # Retry policy
    retry:
      maxAttempts: 2
      backoff: exponential
      delayMs: 2000

    # Error handling
    continueOnError: false

    # Execution configuration
    execution:
      method: subprocess
      isolation: shared

    # CI/CD specific
    runsOn: ubuntu-latest
    stage: test

    # Setup steps
    setup:
      - name: Install dependencies
        command: npm ci
```

## Examples

See `/examples/pipelines/` for complete examples:

### Feature Development
```yaml
name: feature-development
jobs:
  - id: analyze
    agent: product-analyzer
  - id: backend
    agent: backend
    dependsOn: analyze
  - id: frontend
    agent: frontend
    dependsOn: analyze
  - id: tests
    agent: tester
    dependsOn: [backend, frontend]
  - id: review
    agent: reviewer
    dependsOn: tests
```

### Continuous Validation
```yaml
name: validation
concurrency:
  maxConcurrentJobs: 5
jobs:
  - id: type-check
    agent: reviewer
  - id: lint
    agent: reviewer
  - id: unit-tests
    agent: tester
  - id: security-scan
    agent: reviewer
  - id: aggregate
    agent: orchestrator
    dependsOn: [type-check, lint, unit-tests, security-scan]
```

### Production Deployment
```yaml
name: deploy-production
jobs:
  - id: pre-deploy-validation
    agent: reviewer
  - id: build-production
    agent: orchestrator
    dependsOn: pre-deploy-validation
  - id: deploy-staging
    agent: orchestrator
    dependsOn: build-production
  - id: smoke-tests
    agent: tester
    dependsOn: deploy-staging
  - id: manual-approval
    agent: orchestrator
    dependsOn: smoke-tests
  - id: deploy-production
    agent: orchestrator
    dependsOn: manual-approval
  - id: post-deploy-validation
    agent: tester
    dependsOn: deploy-production
```

## CLI Commands

```bash
# Run pipeline
npx agentful pipeline run --pipeline path/to/pipeline.yml

# Run with context
npx agentful pipeline run -p pipeline.yml -c context.json

# Check status
npx agentful pipeline status --run-id <run-id>

# List all runs
npx agentful pipeline list

# Cancel pipeline
npx agentful pipeline cancel --run-id <run-id>

# Resume pipeline
npx agentful pipeline resume --run-id <run-id>

# Validate pipeline
npx agentful pipeline validate --pipeline pipeline.yml
```

## State Management

Pipelines automatically save state to `.agentful/pipelines/runs/`:

```json
{
  "runId": "pipeline-name-1234567890-abc",
  "status": "running",
  "startedAt": "2026-01-21T00:00:00Z",
  "jobs": {
    "job-1": {
      "status": "completed",
      "output": { ... }
    },
    "job-2": {
      "status": "running",
      "progress": 45
    }
  }
}
```

Resume interrupted pipelines:
```bash
npx agentful pipeline resume --run-id pipeline-name-1234567890-abc
```

## Error Handling

### Retry Policies

```yaml
jobs:
  - id: api-call
    agent: backend
    retry:
      maxAttempts: 3
      backoff: exponential # exponential, linear, fixed
      delayMs: 2000
```

Retry delays:
- **Exponential**: 2s, 4s, 8s
- **Linear**: 2s, 4s, 6s
- **Fixed**: 2s, 2s, 2s

### Error Propagation

```yaml
jobs:
  - id: optional-job
    agent: backend
    continueOnError: true # Don't fail pipeline

  - id: critical-job
    agent: backend
    continueOnError: false # Fail pipeline (default)
```

## Performance

### Parallel Execution

```yaml
jobs:
  # These run in parallel
  - id: backend
    agent: backend
  - id: frontend
    agent: frontend
  - id: docs
    agent: documentation

  # This waits for all three
  - id: integration
    agent: tester
    dependsOn: [backend, frontend, docs]
```

### Concurrency Control

```yaml
concurrency:
  maxConcurrentJobs: 3
```

Guidelines:
- Small projects: 2-3 concurrent jobs
- Medium projects: 3-5 concurrent jobs
- Large projects: 5-7 concurrent jobs

Higher concurrency = faster but more expensive (LLM API costs).

## Cost Optimization

1. **State Persistence** - Don't re-run completed jobs
2. **Conditional Execution** - Skip unnecessary work
3. **Retry Limits** - Cap retries at 2-3 attempts
4. **Parallel Execution** - Complete faster overall
5. **Context Reuse** - Pass outputs to avoid re-analysis

Example cost estimation:
```
Pipeline: 9 jobs
Avg cost per job: $0.50
Total cost: $4.50

Sequential: 90 minutes
Parallel (3 concurrent): 35 minutes
(Same cost, faster completion)
```

## Security

### Secrets Management

Never log secrets:
```yaml
env:
  API_KEY: ${{ secrets.API_KEY }}
```

### Webhook Verification

```javascript
const webhookHandler = new WebhookHandler(engine);
webhookHandler.registerWebhook({
  pipeline: 'deploy.yml',
  secret: process.env.WEBHOOK_SECRET // Verify signature
});
```

## Testing

```javascript
import { PipelineEngine } from '@itz4blitz/agentful/pipeline';

describe('Pipeline Engine', () => {
  it('executes jobs in dependency order', async () => {
    const engine = new PipelineEngine();
    const runId = await engine.startPipeline(pipeline);
    // ... assertions
  });
});
```

## Documentation

- [Architecture Overview](../../PIPELINE_ARCHITECTURE.md)
- [API Reference](../../docs/pages/pipelines/overview.mdx)
- [Examples](../../examples/pipelines/)

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development guidelines.

## License

MIT
