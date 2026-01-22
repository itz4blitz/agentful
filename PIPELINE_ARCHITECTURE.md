# Pipeline Orchestration System - Architecture

## Overview

This document describes the architecture of agentful's pipeline orchestration system, designed to run AI agents in complex, long-running workflows with robust error handling and state management.

## Design Goals

1. **Handle Long-Running Processes** - Support agent executions that take 20+ minutes
2. **Cost Awareness** - Minimize redundant LLM API calls through caching and state persistence
3. **Fault Tolerance** - Recover from non-deterministic AI agent failures
4. **Parallelization** - Execute independent agents concurrently for speed
5. **Observability** - Provide real-time progress tracking and logging
6. **Integration** - Work seamlessly with existing CI/CD platforms

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Pipeline Engine                          │
│  - Dependency graph resolution                               │
│  - Job scheduling and execution                              │
│  - State management and persistence                          │
│  - Progress tracking                                         │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────┐    ┌────────────────────────────┐
│    Agent Executor        │    │   Integration Adapters     │
│  - Agent invocation      │    │  - GitHub Actions          │
│  - Context passing       │    │  - GitLab CI               │
│  - Log streaming         │    │  - Jenkins                 │
│  - Result collection     │    │  - Webhook handlers        │
└──────────────────────────┘    └────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│                    AI Agents                                  │
│  orchestrator │ backend │ frontend │ tester │ reviewer │...  │
└──────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Pipeline Definition Format (YAML)

**Purpose**: Declarative workflow definition for AI agent orchestration

**Structure**:
```yaml
name: pipeline-name
version: 1.0
description: What this pipeline does

# Optional: Trigger configuration
triggers:
  - type: push | pull_request | schedule | manual | webhook
    branches: [...]
    cron: "..."

# Optional: Environment variables
env:
  KEY: value

# Optional: Concurrency settings
concurrency:
  maxConcurrentJobs: 3
  cancelInProgress: false

# Optional: Default timeout
timeout: 1800000 # 30 minutes

jobs:
  - id: unique-job-id
    name: Human-readable name
    agent: agent-name
    task: Task description
    dependsOn: [job-id-1, job-id-2]
    when: "condition"
    inputs: { ... }
    timeout: 600000
    retry:
      maxAttempts: 2
      backoff: exponential
      delayMs: 2000
    continueOnError: false
```

**Key Features**:
- Jobs have unique IDs
- Dependencies create execution order
- Conditional execution with `when` clause
- Retry policies for non-deterministic failures
- Timeout protection
- Context passing between jobs

### 2. Orchestration Engine

**File**: `lib/pipeline/engine.js`

**Responsibilities**:
1. Load and validate pipeline definitions
2. Build dependency graph
3. Schedule jobs respecting dependencies
4. Manage concurrent execution (max 3-5 jobs)
5. Handle job failures and retries
6. Persist state after each job
7. Emit progress events

**Key Classes**:

#### `PipelineEngine`

Main orchestration class extending EventEmitter.

**Methods**:
- `startPipeline(pipeline, context)` - Start pipeline execution
- `getPipelineStatus(runId)` - Get current status
- `cancelPipeline(runId)` - Cancel running pipeline
- `resumePipeline(runId)` - Resume interrupted pipeline

**Events**:
- `pipeline:started` - Pipeline execution started
- `pipeline:completed` - Pipeline completed successfully
- `pipeline:failed` - Pipeline failed
- `job:started` - Job started
- `job:completed` - Job completed
- `job:failed` - Job failed
- `job:progress` - Progress update
- `job:log` - Log output

**State Management**:

State is persisted to `.agentful/pipelines/runs/<runId>.json`:

```json
{
  "runId": "pipeline-name-1234567890-abc",
  "pipeline": { /* pipeline definition */ },
  "status": "running",
  "startedAt": "2026-01-21T00:00:00Z",
  "completedAt": null,
  "context": { /* execution context */ },
  "jobs": {
    "job-1": {
      "status": "completed",
      "startedAt": "...",
      "completedAt": "...",
      "output": { /* job output */ },
      "attemptCount": 1
    },
    "job-2": {
      "status": "running",
      "startedAt": "...",
      "progress": 45,
      "attemptCount": 1
    }
  },
  "dependencyGraph": {
    "job-1": [],
    "job-2": ["job-1"]
  },
  "errors": []
}
```

**Dependency Resolution Algorithm**:

1. Build directed acyclic graph (DAG) from `dependsOn` declarations
2. Detect circular dependencies (fail if found)
3. Find jobs with no pending dependencies (ready queue)
4. Execute ready jobs (respecting concurrency limits)
5. When job completes, check dependent jobs
6. Repeat until all jobs complete or pipeline fails

**Concurrency Control**:

```javascript
// Max concurrent jobs (configurable)
this.options.maxConcurrentJobs = 3;

// Job queue
this.jobQueue = []; // Jobs waiting to execute

// Active job tracking
this.activeJobCount = 0;
this.runningJobs = new Map(); // jobId -> ExecutionContext

// When job slot available
if (this.activeJobCount < this.maxConcurrentJobs) {
  const job = this.jobQueue.shift();
  this.activeJobCount++;
  this._executeJob(job).finally(() => {
    this.activeJobCount--;
  });
}
```

### 3. Agent Execution Runtime

**File**: `lib/pipeline/executor.js`

**Responsibilities**:
1. Invoke AI agents via subprocess or API
2. Pass context between jobs
3. Stream logs and progress updates
4. Handle cancellation and cleanup
5. Collect and structure results

**Key Classes**:

#### `AgentExecutor`

Handles agent execution lifecycle.

**Execution Methods**:

1. **Subprocess Execution** (default)
   - Spawns `claude` CLI with agent
   - Writes context to temp file
   - Monitors stdout/stderr
   - Enforces timeout
   - Reads output file
   - Cleans up temp files

2. **API Execution** (future)
   - Direct Claude API calls
   - No subprocess overhead
   - Better for cloud environments

**Context Passing**:

```javascript
// Write context to temp file
const contextFile = `.agentful/pipelines/temp/${executionId}-context.json`;
await fs.writeFile(contextFile, JSON.stringify({
  inputs: jobDef.inputs,
  previousJobs: {
    "job-1": { output: { ... } },
    "job-2": { output: { ... } }
  }
}));

// Agent reads context, writes output
const outputFile = `.agentful/pipelines/temp/${executionId}-output.json`;

// Agent prompt includes file references
const prompt = `
Input context: ${contextFile}
Write output to: ${outputFile}

Output format (JSON):
{
  "success": true,
  "data": { ... },
  "message": "Job completed"
}

Task: ${jobDef.task}
`;
```

**Progress Tracking**:

Agents can emit progress markers in stdout:
```
[PROGRESS: 25%]
[PROGRESS: 50%]
[PROGRESS: 75%]
```

Executor parses these and emits progress events.

**Cancellation**:

```javascript
async cancel(executionId) {
  const exec = this.activeExecutions.get(executionId);
  if (exec && exec.process) {
    exec.process.kill('SIGTERM');

    // Force kill after 5s
    setTimeout(() => {
      if (!exec.process.killed) {
        exec.process.kill('SIGKILL');
      }
    }, 5000);
  }
}
```

### 4. Integration Adapters

**File**: `lib/pipeline/integrations.js`

**Purpose**: Convert agentful pipelines to CI/CD platform formats

#### GitHub Actions Adapter

Converts to `.github/workflows/*.yml`:

```yaml
name: feature-development
on: [push, pull_request]
jobs:
  implement-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx agentful pipeline run --job implement-backend

  implement-frontend:
    runs-on: ubuntu-latest
    needs: [implement-backend]
    steps:
      - uses: actions/checkout@v4
      - run: npx agentful pipeline run --job implement-frontend
```

#### GitLab CI Adapter

Converts to `.gitlab-ci.yml`:

```yaml
stages:
  - build
  - test

implement-backend:
  stage: build
  script:
    - npx agentful pipeline run --job implement-backend

implement-frontend:
  stage: build
  needs:
    - job: implement-backend
  script:
    - npx agentful pipeline run --job implement-frontend
```

#### Jenkins Adapter

Converts to `Jenkinsfile`:

```groovy
pipeline {
  agent any
  stages {
    stage('Implement Backend') {
      steps {
        sh 'npx agentful pipeline run --job implement-backend'
      }
    }
    stage('Implement Frontend') {
      steps {
        sh 'npx agentful pipeline run --job implement-frontend'
      }
    }
  }
}
```

#### Webhook Handler

Handles webhook triggers:

```javascript
webhookHandler.registerWebhook({
  pipeline: 'deploy-production.yml',
  secret: process.env.WEBHOOK_SECRET,
  filters: {
    'event_type': 'deploy_production',
    'environment': 'production'
  },
  transform: (payload) => ({
    commit: payload.commit,
    branch: payload.branch
  })
});

// On webhook request
const result = await webhookHandler.handleWebhook(
  webhookId,
  requestPayload,
  requestHeaders
);
// -> Pipeline triggered with transformed context
```

### 5. State Persistence

**Directory Structure**:
```
.agentful/pipelines/
├── runs/
│   ├── feature-dev-1234567890-abc.json
│   ├── feature-dev-1234567891-def.json
│   └── validation-1234567892-ghi.json
├── temp/
│   ├── job-1-context.json
│   ├── job-1-output.json
│   └── job-1-prompt.txt
└── backups/
    └── feature-dev-1234567890-abc-backup-20260121.json
```

**Persistence Strategy**:

1. **After Pipeline Start**: Save initial state
2. **After Each Job**: Update job status and output
3. **On Pipeline Complete/Fail**: Save final state
4. **On Interrupt**: State already persisted, can resume

**Recovery**:

```javascript
// Resume interrupted pipeline
const state = await loadPipelineState(runId);

// Reset failed/running jobs to pending
for (const [jobId, job] of Object.entries(state.jobs)) {
  if (job.status === 'running' || job.status === 'failed') {
    job.status = 'pending';
    job.attemptCount = 0;
  }
}

// Continue execution from current state
await executePipeline(state);
```

## Error Handling

### Job-Level Errors

**Types**:
1. **Validation Errors** - Invalid job definition
2. **Timeout Errors** - Job exceeded timeout
3. **Execution Errors** - Agent failed
4. **Non-deterministic Errors** - LLM API issues

**Retry Strategy**:

```javascript
const maxRetries = jobDef.retry?.maxAttempts || 0;

if (job.attemptCount <= maxRetries) {
  // Calculate backoff delay
  const delay = calculateRetryDelay(job.attemptCount, jobDef.retry);

  // Wait and retry
  await sleep(delay);
  job.status = 'pending';
} else {
  // Max retries reached
  job.status = 'failed';

  if (!jobDef.continueOnError) {
    // Fail entire pipeline
    throw new Error(`Job ${jobId} failed after ${job.attemptCount} attempts`);
  }
}
```

**Backoff Algorithms**:
- **Exponential**: `baseDelay * 2^(attempt-1)` - Best for rate limits
- **Linear**: `baseDelay * attempt` - Good for transient issues
- **Fixed**: `baseDelay` - Simple constant delay

### Pipeline-Level Errors

**Failure Scenarios**:
1. Job fails without `continueOnError`
2. Circular dependency detected
3. Invalid pipeline definition
4. Resource exhaustion

**Failure Handling**:
1. Mark pipeline as FAILED
2. Cancel queued jobs
3. Let running jobs complete
4. Persist error state
5. Emit failure event

## Performance Optimizations

### 1. Parallel Execution

Independent jobs run concurrently:

```yaml
jobs:
  - id: backend
    agent: backend

  - id: frontend
    agent: frontend

  - id: docs
    agent: documentation

  # All three run in parallel

  - id: integration
    dependsOn: [backend, frontend, docs]
    agent: tester
```

### 2. Conditional Skipping

Skip unnecessary work:

```yaml
- id: fix-issues
  agent: fixer
  when: "quality-check.status == 'failed'"
  # Only runs if quality check failed
```

### 3. Smart Caching

State persistence enables:
- Resume from failure point
- Skip completed jobs on retry
- Avoid redundant LLM calls

### 4. Resource Management

Control concurrent execution:
- Low concurrency (2-3): Lower cost, longer duration
- High concurrency (5-7): Higher cost, faster completion

## Cost Management

### LLM API Call Optimization

**Problem**: Each agent invocation costs $0.10-$1.00 in API fees

**Solutions**:
1. **State Persistence** - Don't re-run completed jobs
2. **Conditional Execution** - Skip unnecessary work
3. **Retry Limits** - Cap retries at 2-3 attempts
4. **Parallel Execution** - Complete pipeline faster
5. **Context Reuse** - Pass outputs between jobs to avoid re-analysis

### Cost Estimation

```
Pipeline: feature-development.yml
Jobs: 9
Avg duration per job: 10 minutes
Avg cost per job: $0.50

Sequential execution:
- Duration: 90 minutes
- Cost: $4.50

Parallel execution (3 concurrent):
- Duration: 35 minutes
- Cost: $4.50 (same cost, faster completion)
```

## Security Considerations

### 1. Secrets Management

Never log or persist secrets:

```javascript
// Mask secrets in logs
const maskedContext = maskSecrets(context, [
  'VERCEL_TOKEN',
  'DATABASE_PASSWORD',
  'API_KEY'
]);
```

### 2. Subprocess Isolation

Agents run in isolated processes:
- Can't access parent process memory
- Separate file system namespace (optional)
- Resource limits (CPU, memory, disk)

### 3. Webhook Signature Verification

Verify webhook authenticity:

```javascript
const signature = headers['x-hub-signature-256'];
const expectedSignature = crypto
  .createHmac('sha256', secret)
  .update(JSON.stringify(payload))
  .digest('hex');

if (signature !== expectedSignature) {
  throw new Error('Invalid webhook signature');
}
```

## Monitoring and Observability

### Real-time Progress

```javascript
engine.on('job:progress', ({ jobId, progress }) => {
  console.log(`${jobId}: ${progress}%`);
});

engine.on('job:log', ({ jobId, message }) => {
  console.log(`[${jobId}] ${message}`);
});
```

### Metrics Collection

Track key metrics:
- Pipeline duration
- Job duration
- Failure rate
- Retry count
- Cost per pipeline

### Alerting

Trigger alerts on:
- Pipeline failure
- Job timeout
- High failure rate
- Cost threshold exceeded

## API Design

### Pipeline Engine API

```javascript
import { PipelineEngine } from '@itz4blitz/agentful/pipeline';

const engine = new PipelineEngine({
  maxConcurrentJobs: 3,
  stateDir: '.agentful/pipelines',
  defaultTimeout: 1800000,
  agentExecutor: customExecutor
});

// Start pipeline
const runId = await engine.startPipeline(pipeline, context);

// Get status
const status = engine.getPipelineStatus(runId);

// Cancel
await engine.cancelPipeline(runId);

// Resume
await engine.resumePipeline(runId);

// Events
engine.on('pipeline:completed', ({ runId, duration }) => {
  console.log(`Pipeline ${runId} completed in ${duration}ms`);
});
```

### Agent Executor API

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
    onProgress: (progress) => console.log(progress),
    onLog: (message) => console.log(message)
  }
);

// Cancel
await executor.cancel(executionId);
```

## Future Enhancements

### 1. Distributed Execution

Run jobs across multiple machines:
- Job queue in Redis
- Worker pools
- Load balancing

### 2. Advanced Scheduling

- Job priorities
- Resource reservations
- Time-based scheduling

### 3. Pipeline Composition

Reusable pipeline templates:

```yaml
name: my-pipeline
includes:
  - common/validation.yml
  - common/deployment.yml

jobs:
  - id: custom-job
    agent: backend
```

### 4. Interactive Pipelines

Pause for human input:

```yaml
- id: manual-approval
  agent: orchestrator
  task: Request approval from user
  interactive: true
  timeout: 3600000 # 1 hour for approval
```

### 5. Pipeline Visualization

Web UI showing:
- Live dependency graph
- Job status
- Progress bars
- Log streaming

## Implementation Strategy

### Phase 1: Core Engine (Week 1)
- ✅ Pipeline definition schema
- ✅ Dependency graph resolution
- ✅ Job scheduling
- ✅ State persistence
- ✅ Basic executor

### Phase 2: Integration (Week 2)
- ✅ GitHub Actions adapter
- ✅ GitLab CI adapter
- ✅ Jenkins adapter
- ✅ Webhook handler

### Phase 3: CLI & Examples (Week 3)
- ✅ Pipeline CLI
- ✅ Example pipelines
- ✅ Documentation
- [ ] Integration tests

### Phase 4: Production Features (Week 4)
- [ ] Advanced error handling
- [ ] Metrics and monitoring
- [ ] Cost tracking
- [ ] Performance optimization

### Phase 5: Advanced Features (Future)
- [ ] Distributed execution
- [ ] Pipeline composition
- [ ] Interactive pipelines
- [ ] Web UI

## Testing Strategy

### Unit Tests
- Dependency graph resolution
- Job scheduling logic
- Retry policies
- Context passing

### Integration Tests
- End-to-end pipeline execution
- State persistence and recovery
- CI/CD adapter output validation
- Webhook handling

### Performance Tests
- Concurrent job execution
- Large pipeline handling
- State file size optimization

## Conclusion

The pipeline orchestration system enables agentful to handle complex, long-running workflows with robust error handling and state management. The architecture prioritizes:

1. **Reliability** - State persistence and recovery
2. **Performance** - Parallel execution and caching
3. **Cost** - Minimize redundant LLM calls
4. **Integration** - Works with existing CI/CD tools
5. **Observability** - Real-time progress and logging

This foundation supports agentful's vision of autonomous product development with human checkpoints at scale.
