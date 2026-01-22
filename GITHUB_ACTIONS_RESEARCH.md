# GitHub Actions Research: AI Agent Integration Patterns

**Research Date:** January 21, 2025
**Purpose:** Document actionable patterns for agentful's GitHub Actions implementation

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Action Types Comparison](#action-types-comparison)
3. [Authentication & Security Patterns](#authentication--security-patterns)
4. [Long-Running Process Strategies](#long-running-process-strategies)
5. [PR Commenting & Status Updates](#pr-commenting--status-updates)
6. [Artifact Storage & Results](#artifact-storage--results)
7. [Matrix Builds for Parallel Execution](#matrix-builds-for-parallel-execution)
8. [Marketplace Distribution Best Practices](#marketplace-distribution-best-practices)
9. [Real-World Implementation Examples](#real-world-implementation-examples)
10. [Recommendations for agentful](#recommendations-for-agentful)

---

## Executive Summary

### Key Findings

1. **Composite Actions** are the recommended approach for most use cases (fastest, cross-platform, easiest maintenance)
2. **JavaScript Actions** offer more flexibility when you need programmatic control
3. **Docker Actions** provide the most isolation but are slower and Linux-only
4. **Long-running agents (5-20 min)** require careful timeout management and progress reporting
5. **PR commenting** should use update-or-create pattern to avoid spam
6. **Artifact storage** has 2GB free limit with 90-day retention; use compression strategies wisely

### AI/LLM GitHub Actions Landscape

Popular AI-powered GitHub Actions in 2025:
- **Claude Code Action** (Anthropic Official) - General-purpose AI assistant
- **LLM AI Code Reviewer** - Multi-provider support (Groq, Gemini)
- **OpenAI GPT Code Review** - GPT-4 powered reviews
- **RepoFixAI** - Groq and RoBERTa based reviews
- **AutoReviewer** - OpenAI GPT-4 automated reviews

Common pattern: All trigger on `pull_request` events and post comments back to PRs.

---

## Action Types Comparison

### Overview Table

| Feature | Docker Actions | JavaScript Actions | Composite Actions |
|---------|---------------|-------------------|-------------------|
| **Speed** | Slow (container boot) | Fast | Fast |
| **Isolation** | Complete | Shared host | Shared host |
| **Platform Support** | Linux only | Cross-platform | Cross-platform |
| **Complexity** | High (Dockerfile) | Medium (Node.js) | Low (YAML) |
| **Use Case** | Complex deps | Programmatic logic | Reusable workflows |
| **Maintenance** | High | Medium | Low |

### Recommendation for agentful

**Primary:** Start with **Composite Action** for speed and simplicity
**Secondary:** Use **JavaScript Action** if you need:
- Complex authentication flows
- Programmatic GitHub API interactions
- Advanced error handling and retry logic

### Action Structure Examples

#### Composite Action (Recommended)

```yaml
# action.yml
name: 'agentful GitHub Action'
description: 'Run agentful agents on your pull requests'
author: 'itz4blitz'

branding:
  icon: 'cpu'
  color: 'blue'

inputs:
  anthropic_api_key:
    description: 'Anthropic API key for Claude'
    required: true
  github_token:
    description: 'GitHub token for API access'
    required: true
    default: ${{ github.token }}
  agent:
    description: 'Which agent to run (orchestrator, reviewer, fixer)'
    required: false
    default: 'orchestrator'
  timeout_minutes:
    description: 'Maximum time for agent execution'
    required: false
    default: '20'

outputs:
  result:
    description: 'Agent execution result'
    value: ${{ steps.run-agent.outputs.result }}
  completion_status:
    description: 'Feature completion status'
    value: ${{ steps.run-agent.outputs.completion }}

runs:
  using: 'composite'
  steps:
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'

    - name: Install agentful
      shell: bash
      run: npm install -g @itz4blitz/agentful

    - name: Initialize agentful
      shell: bash
      run: npx @itz4blitz/agentful init --non-interactive

    - name: Run agentful agent
      id: run-agent
      shell: bash
      timeout-minutes: ${{ inputs.timeout_minutes }}
      env:
        ANTHROPIC_API_KEY: ${{ inputs.anthropic_api_key }}
        GITHUB_TOKEN: ${{ inputs.github_token }}
      run: |
        # Run agent and capture output
        claude --dangerously-skip-permissions <<EOF
        /agentful-start --agent=${{ inputs.agent }}
        EOF

        # Export results for next steps
        echo "result=$(cat .agentful/last-validation.json)" >> $GITHUB_OUTPUT
        echo "completion=$(jq -r '.completion_percentage' .agentful/completion.json)" >> $GITHUB_OUTPUT
```

#### JavaScript Action (Advanced)

```javascript
// index.js
const core = require('@actions/core');
const github = require('@actions/github');
const { exec } = require('@actions/exec');

async function run() {
  try {
    // Get inputs
    const anthropicApiKey = core.getInput('anthropic_api_key', { required: true });
    const githubToken = core.getInput('github_token', { required: true });
    const agent = core.getInput('agent') || 'orchestrator';
    const timeoutMinutes = parseInt(core.getInput('timeout_minutes') || '20');

    // Set environment variables
    process.env.ANTHROPIC_API_KEY = anthropicApiKey;
    process.env.GITHUB_TOKEN = githubToken;

    // Create GitHub client for API access
    const octokit = github.getOctokit(githubToken);
    const context = github.context;

    // Start check run for status tracking
    const checkRun = await octokit.rest.checks.create({
      owner: context.repo.owner,
      repo: context.repo.repo,
      name: 'agentful Agent',
      head_sha: context.sha,
      status: 'in_progress',
      started_at: new Date().toISOString(),
    });

    // Install agentful
    core.info('Installing agentful...');
    await exec('npm', ['install', '-g', '@itz4blitz/agentful']);

    // Run agent with timeout
    core.info(`Running ${agent} agent...`);
    const startTime = Date.now();

    // Execute agent
    let agentOutput = '';
    const exitCode = await exec('claude', [
      '--dangerously-skip-permissions',
      '-c',
      `/agentful-start --agent=${agent}`
    ], {
      timeout: timeoutMinutes * 60 * 1000,
      listeners: {
        stdout: (data) => {
          agentOutput += data.toString();
          core.info(data.toString());
        },
        stderr: (data) => {
          core.warning(data.toString());
        }
      }
    });

    const duration = Date.now() - startTime;

    // Read results
    const fs = require('fs');
    const validationResult = JSON.parse(
      fs.readFileSync('.agentful/last-validation.json', 'utf8')
    );
    const completionData = JSON.parse(
      fs.readFileSync('.agentful/completion.json', 'utf8')
    );

    // Update check run
    await octokit.rest.checks.update({
      owner: context.repo.owner,
      repo: context.repo.repo,
      check_run_id: checkRun.data.id,
      status: 'completed',
      conclusion: exitCode === 0 ? 'success' : 'failure',
      completed_at: new Date().toISOString(),
      output: {
        title: 'agentful Agent Execution',
        summary: `Agent: ${agent}\nDuration: ${Math.round(duration / 1000)}s\nCompletion: ${completionData.completion_percentage}%`,
        text: agentOutput
      }
    });

    // Set outputs
    core.setOutput('result', JSON.stringify(validationResult));
    core.setOutput('completion_status', completionData.completion_percentage);

    // Comment on PR if applicable
    if (context.eventName === 'pull_request') {
      await commentOnPR(octokit, context, validationResult, completionData);
    }

  } catch (error) {
    core.setFailed(error.message);
  }
}

async function commentOnPR(octokit, context, validation, completion) {
  const { owner, repo } = context.repo;
  const issue_number = context.payload.pull_request.number;

  // Check for existing comment
  const comments = await octokit.rest.issues.listComments({
    owner,
    repo,
    issue_number
  });

  const botComment = comments.data.find(
    comment => comment.user.type === 'Bot' && comment.body.includes('<!-- agentful-report -->')
  );

  const body = generateCommentBody(validation, completion);

  if (botComment) {
    // Update existing comment
    await octokit.rest.issues.updateComment({
      owner,
      repo,
      comment_id: botComment.id,
      body
    });
  } else {
    // Create new comment
    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number,
      body
    });
  }
}

function generateCommentBody(validation, completion) {
  return `<!-- agentful-report -->
## 🤖 agentful Agent Report

**Completion Status:** ${completion.completion_percentage}%

### Validation Results

${validation.gates.map(gate =>
  `- ${gate.passed ? '✅' : '❌'} ${gate.name}: ${gate.message}`
).join('\n')}

---
*Powered by [agentful](https://agentful.app)*
`;
}

run();
```

---

## Authentication & Security Patterns

### Best Practices (2025)

1. **Never hardcode secrets** - Always use GitHub Secrets
2. **Use OIDC over static credentials** when possible (cloud providers)
3. **Rotate secrets regularly** (30/60/90 days based on risk)
4. **Use environment-specific secrets** for staging vs. production
5. **Descriptive naming conventions** - `ANTHROPIC_PROD_API_KEY` vs. `API_KEY`
6. **Limit secret reuse** - Don't share secrets across workflows
7. **Never expose in logs** - GitHub auto-redacts registered secrets
8. **Audit secrets usage** - Review how secrets are accessed
9. **Least-privilege access** - Minimum permissions needed
10. **Use GitHub's built-in token** - `${{ github.token }}` when possible

### Authentication Implementation

```yaml
# Basic secrets usage
- name: Run agentful
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: |
    # Secrets are automatically redacted in logs
    echo "Running with authenticated access"
```

### Environment-Specific Secrets

```yaml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production  # This gates access to production secrets
    steps:
      - uses: actions/checkout@v4
      - name: Deploy
        env:
          API_KEY: ${{ secrets.PROD_API_KEY }}  # Only accessible in prod environment
        run: |
          # Deployment steps
```

### OpenID Connect (OIDC) Pattern

```yaml
# For cloud providers - no long-lived secrets needed
permissions:
  id-token: write  # Required for OIDC
  contents: read

- name: Configure AWS Credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::123456789012:role/GitHubActions
    aws-region: us-east-1
    # No access keys needed!
```

### Multi-Provider Authentication (Claude Code Pattern)

```yaml
inputs:
  auth_provider:
    description: 'Authentication provider'
    required: true
    # Options: anthropic, bedrock, vertex, foundry

  anthropic_api_key:
    description: 'Anthropic API key'
    required: false

  aws_region:
    description: 'AWS region for Bedrock'
    required: false

  gcp_project:
    description: 'GCP project for Vertex AI'
    required: false

steps:
  - name: Authenticate based on provider
    shell: bash
    run: |
      case "${{ inputs.auth_provider }}" in
        anthropic)
          export ANTHROPIC_API_KEY="${{ inputs.anthropic_api_key }}"
          ;;
        bedrock)
          # AWS credentials from OIDC or environment
          export AWS_REGION="${{ inputs.aws_region }}"
          ;;
        vertex)
          # GCP credentials from OIDC or service account
          export GCP_PROJECT="${{ inputs.gcp_project }}"
          ;;
      esac
```

---

## Long-Running Process Strategies

### Challenge

agentful agents can run for 5-20 minutes, which requires:
1. Proper timeout configuration
2. Progress tracking
3. Graceful handling of timeouts
4. Cost management (GitHub Actions minutes)

### Default Timeouts

- **Job default:** 6 hours (360 minutes)
- **Workflow default:** 6 hours
- **Recommended:** 30 minutes for most workflows
- **For agentful:** 20-30 minutes per agent

### Timeout Configuration

```yaml
jobs:
  run-agent:
    runs-on: ubuntu-latest
    timeout-minutes: 30  # Job-level timeout

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        timeout-minutes: 2  # Step-level timeout

      - name: Run long agent process
        timeout-minutes: 20  # Specific timeout for long-running step
        run: |
          claude --dangerously-skip-permissions <<EOF
          /agentful-start
          EOF
```

### Progress Tracking Pattern

```yaml
- name: Run agent with progress updates
  id: agent
  timeout-minutes: 20
  run: |
    # Create a background process to monitor progress
    (
      while true; do
        if [ -f .agentful/state.json ]; then
          progress=$(jq -r '.progress_percentage' .agentful/state.json)
          echo "::notice::Progress: ${progress}%"
        fi
        sleep 30
      done
    ) &
    MONITOR_PID=$!

    # Run the actual agent
    claude --dangerously-skip-permissions <<EOF
    /agentful-start
    EOF

    # Clean up monitor
    kill $MONITOR_PID 2>/dev/null || true
```

### Job Chaining for Extended Processes

If a single agent run might exceed 20 minutes, chain multiple jobs:

```yaml
jobs:
  # Phase 1: Architecture
  architect:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    outputs:
      status: ${{ steps.run.outputs.status }}
    steps:
      - uses: actions/checkout@v4
      - name: Run architect agent
        id: run
        run: |
          claude --dangerously-skip-permissions <<EOF
          /agentful-start --agent=architect
          EOF
          echo "status=complete" >> $GITHUB_OUTPUT

  # Phase 2: Implementation (depends on architect)
  implement:
    needs: architect
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
      - name: Run backend agent
        run: |
          claude --dangerously-skip-permissions <<EOF
          /agentful-start --agent=backend
          EOF

  # Phase 3: Validation (depends on implement)
  validate:
    needs: implement
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - name: Run reviewer agent
        run: |
          claude --dangerously-skip-permissions <<EOF
          /agentful-validate
          EOF
```

### Self-Hosted Runners (No 6-hour limit)

For organizations with very long-running processes:

```yaml
jobs:
  extended-agent:
    runs-on: self-hosted  # No 6-hour timeout limit
    timeout-minutes: 120  # 2 hours
    steps:
      - uses: actions/checkout@v4
      - name: Run extended agent process
        run: |
          # Can run much longer on self-hosted runners
          claude --dangerously-skip-permissions <<EOF
          /ralph-loop "/agentful-start" --max-iterations 100
          EOF
```

### Cost Management

```yaml
# Protect budget with aggressive timeouts
jobs:
  budget-conscious:
    runs-on: ubuntu-latest
    timeout-minutes: 15  # Hard limit to control costs
    steps:
      - uses: actions/checkout@v4
      - name: Run with time budget
        timeout-minutes: 10
        run: |
          # This will be killed after 10 minutes max
          claude --dangerously-skip-permissions <<EOF
          /agentful-start
          EOF
```

---

## PR Commenting & Status Updates

### Best Practices (2025)

1. **Update existing comments** instead of creating new ones (avoid spam)
2. **Use hidden markers** (`<!-- agentful-report -->`) to identify bot comments
3. **Start with non-blocking checks** when introducing AI bots
4. **Scope to diffs only** - no drive-by comments on legacy code
5. **Keep prompts precise** - avoid noisy, generic feedback
6. **Use check runs for status** instead of commit statuses
7. **Require `pull-requests: write` permission**

### Update-or-Create Comment Pattern

```yaml
- name: Comment on PR
  uses: actions/github-script@v7
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    script: |
      const fs = require('fs');

      // Read agent results
      const validation = JSON.parse(
        fs.readFileSync('.agentful/last-validation.json', 'utf8')
      );
      const completion = JSON.parse(
        fs.readFileSync('.agentful/completion.json', 'utf8')
      );

      // Generate comment body
      const marker = '<!-- agentful-report -->';
      const body = `${marker}
## 🤖 agentful Agent Report

**Completion Status:** ${completion.completion_percentage}%

### Quality Gates

${validation.gates.map(gate =>
  `- ${gate.passed ? '✅' : '❌'} **${gate.name}**: ${gate.message}`
).join('\n')}

${validation.gates.every(g => g.passed) ?
  '✨ All quality gates passed!' :
  '⚠️ Some quality gates need attention'
}

---
*Powered by [agentful](https://agentful.app)*
`;

      // Find existing comment
      const { data: comments } = await github.rest.issues.listComments({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: context.payload.pull_request.number
      });

      const existingComment = comments.find(
        comment => comment.body.includes(marker)
      );

      if (existingComment) {
        // Update existing comment
        await github.rest.issues.updateComment({
          owner: context.repo.owner,
          repo: context.repo.repo,
          comment_id: existingComment.id,
          body
        });
        console.log('Updated existing comment');
      } else {
        // Create new comment
        await github.rest.issues.createComment({
          owner: context.repo.owner,
          repo: context.repo.repo,
          issue_number: context.payload.pull_request.number,
          body
        });
        console.log('Created new comment');
      }
```

### Check Runs API Pattern

Check runs provide richer information than commit statuses:

```yaml
- name: Create check run
  uses: actions/github-script@v7
  with:
    script: |
      // Start check run
      const { data: checkRun } = await github.rest.checks.create({
        owner: context.repo.owner,
        repo: context.repo.repo,
        name: 'agentful Agent',
        head_sha: context.sha,
        status: 'in_progress',
        started_at: new Date().toISOString(),
        output: {
          title: 'Running agentful agents...',
          summary: 'Agent execution in progress'
        }
      });

      // Store check run ID for later updates
      core.exportVariable('CHECK_RUN_ID', checkRun.id);

- name: Run agent
  run: |
    claude --dangerously-skip-permissions <<EOF
    /agentful-start
    EOF

- name: Update check run
  if: always()
  uses: actions/github-script@v7
  with:
    script: |
      const fs = require('fs');
      const checkRunId = process.env.CHECK_RUN_ID;

      // Read results
      const validation = JSON.parse(
        fs.readFileSync('.agentful/last-validation.json', 'utf8')
      );

      const allPassed = validation.gates.every(g => g.passed);

      await github.rest.checks.update({
        owner: context.repo.owner,
        repo: context.repo.repo,
        check_run_id: checkRunId,
        status: 'completed',
        conclusion: allPassed ? 'success' : 'failure',
        completed_at: new Date().toISOString(),
        output: {
          title: allPassed ? 'All quality gates passed' : 'Some quality gates failed',
          summary: `Completion: ${validation.completion_percentage}%`,
          text: validation.gates.map(g =>
            `${g.passed ? '✅' : '❌'} ${g.name}: ${g.message}`
          ).join('\n'),
          annotations: validation.gates
            .filter(g => !g.passed && g.file)
            .map(g => ({
              path: g.file,
              start_line: g.line || 1,
              end_line: g.line || 1,
              annotation_level: 'failure',
              message: g.message
            }))
        }
      });
```

### Trigger Patterns

```yaml
# Pattern 1: Auto-review on PR open/update
name: Auto Review
on:
  pull_request:
    types: [opened, synchronize, ready_for_review]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run review agent
        run: |
          claude --dangerously-skip-permissions <<EOF
          /agentful-start --agent=reviewer
          EOF
```

```yaml
# Pattern 2: Comment-triggered (@agentful)
name: On-Demand Agent
on:
  issue_comment:
    types: [created]

jobs:
  agent:
    if: |
      github.event.issue.pull_request &&
      contains(github.event.comment.body, '@agentful')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Parse command from comment
        id: parse
        run: |
          COMMENT="${{ github.event.comment.body }}"
          # Extract agent name from "@agentful run <agent>"
          AGENT=$(echo "$COMMENT" | grep -oP '@agentful run \K\w+' || echo "orchestrator")
          echo "agent=$AGENT" >> $GITHUB_OUTPUT

      - name: Run specified agent
        run: |
          claude --dangerously-skip-permissions <<EOF
          /agentful-start --agent=${{ steps.parse.outputs.agent }}
          EOF
```

### Permissions Configuration

```yaml
permissions:
  contents: read
  pull-requests: write  # Required for commenting
  checks: write         # Required for check runs
  issues: write         # Required if handling issues
```

---

## Artifact Storage & Results

### Limits and Constraints

- **Free tier:** 2GB storage, 90-day retention
- **Per-job limit:** 500 artifacts
- **Retention:** Configurable 1-90 days (default 90)
- **Immutability:** Cannot modify artifacts after creation

### Best Practices

1. **Use compression wisely** - Level 0 for large, incompressible files
2. **Set aggressive retention** - Most teams don't need 90 days
3. **Unique names in matrix builds** - Avoid overwrites
4. **External storage for large files** - S3, Azure Blob, etc.
5. **Use cache for dependencies** - Faster restore than artifacts
6. **Clean up regularly** - Check Settings → Actions → Storage

### Basic Artifact Upload

```yaml
- name: Run agentful agent
  run: |
    claude --dangerously-skip-permissions <<EOF
    /agentful-start
    EOF

- name: Upload agent results
  uses: actions/upload-artifact@v4
  if: always()  # Upload even if agent fails
  with:
    name: agentful-results
    path: |
      .agentful/state.json
      .agentful/completion.json
      .agentful/last-validation.json
      .agentful/decisions.json
    retention-days: 7  # Only keep for 7 days
    compression-level: 6  # Default compression
```

### Large File Strategy

```yaml
- name: Upload large artifacts
  uses: actions/upload-artifact@v4
  with:
    name: agent-logs
    path: .agentful/logs/
    compression-level: 0  # No compression for speed
    retention-days: 3     # Short retention for large files
```

### Multiple Artifacts Pattern

```yaml
# Upload different artifact types separately
- name: Upload validation results
  uses: actions/upload-artifact@v4
  with:
    name: validation-report
    path: .agentful/last-validation.json
    retention-days: 30

- name: Upload completion data
  uses: actions/upload-artifact@v4
  with:
    name: completion-status
    path: .agentful/completion.json
    retention-days: 30

- name: Upload agent logs (large)
  uses: actions/upload-artifact@v4
  with:
    name: agent-logs
    path: .agentful/logs/
    compression-level: 0
    retention-days: 7
    if-no-files-found: ignore  # Don't fail if no logs
```

### Downloading Artifacts in Later Jobs

```yaml
jobs:
  run-agent:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run agent
        run: |
          claude --dangerously-skip-permissions <<EOF
          /agentful-start
          EOF
      - name: Upload results
        uses: actions/upload-artifact@v4
        with:
          name: agent-results
          path: .agentful/

  report:
    needs: run-agent
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Download agent results
        uses: actions/download-artifact@v4
        with:
          name: agent-results
          path: .agentful/

      - name: Generate report
        run: |
          # Process downloaded artifacts
          node scripts/generate-report.js
```

### External Storage Pattern (For Large Files)

```yaml
- name: Upload to S3 instead of artifacts
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
  run: |
    # Upload large logs to S3
    aws s3 cp .agentful/logs/ s3://my-bucket/agentful/logs/ --recursive

    # Save S3 URL as output
    echo "logs_url=https://s3.amazonaws.com/my-bucket/agentful/logs/" >> $GITHUB_OUTPUT

- name: Comment with S3 link
  uses: actions/github-script@v7
  with:
    script: |
      await github.rest.issues.createComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: context.payload.pull_request.number,
        body: `📦 Agent logs: ${{ steps.upload.outputs.logs_url }}`
      });
```

### Artifact Outputs

```yaml
- name: Upload with outputs
  id: upload
  uses: actions/upload-artifact@v4
  with:
    name: results
    path: .agentful/

- name: Use artifact info
  run: |
    echo "Artifact ID: ${{ steps.upload.outputs.artifact-id }}"
    echo "Artifact URL: ${{ steps.upload.outputs.artifact-url }}"
```

---

## Matrix Builds for Parallel Execution

### Overview

Matrix strategy runs the same job multiple times with different configurations in parallel.

### Basic Matrix Example

```yaml
jobs:
  parallel-agents:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        agent: [architect, backend, frontend, tester]

    steps:
      - uses: actions/checkout@v4
      - name: Run agent
        run: |
          claude --dangerously-skip-permissions <<EOF
          /agentful-start --agent=${{ matrix.agent }}
          EOF
```

This creates 4 parallel jobs, one for each agent.

### Multi-Dimensional Matrix

```yaml
jobs:
  matrix-build:
    strategy:
      matrix:
        agent: [backend, frontend]
        environment: [staging, production]
        node-version: [18, 20]

    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}

      - name: Run agent in environment
        env:
          ENVIRONMENT: ${{ matrix.environment }}
        run: |
          claude --dangerously-skip-permissions <<EOF
          /agentful-start --agent=${{ matrix.agent }}
          EOF
```

This creates 2 × 2 × 2 = **8 parallel jobs**.

### Include/Exclude Patterns

```yaml
jobs:
  smart-matrix:
    strategy:
      matrix:
        agent: [architect, backend, frontend, tester, reviewer]
        os: [ubuntu-latest, macos-latest]

        # Add specific combinations
        include:
          # Only run fixer on ubuntu with extra memory
          - agent: fixer
            os: ubuntu-latest
            runs-on: ubuntu-latest-8-cores

        # Exclude incompatible combinations
        exclude:
          # Tester doesn't work on macOS yet
          - agent: tester
            os: macos-latest

    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - name: Run agent
        run: |
          claude --dangerously-skip-permissions <<EOF
          /agentful-start --agent=${{ matrix.agent }}
          EOF
```

### Max Parallel Configuration

```yaml
jobs:
  throttled-agents:
    strategy:
      matrix:
        agent: [architect, backend, frontend, tester, reviewer, fixer]
      max-parallel: 2  # Only 2 agents run at once

    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run agent
        run: |
          claude --dangerously-skip-permissions <<EOF
          /agentful-start --agent=${{ matrix.agent }}
          EOF
```

Good for:
- **Cost control** - Limit concurrent jobs
- **Rate limiting** - Avoid API throttling
- **Resource constraints** - Don't overwhelm self-hosted runners

### Fail-Fast Configuration

```yaml
jobs:
  independent-agents:
    strategy:
      matrix:
        agent: [architect, backend, frontend]
      fail-fast: false  # Don't cancel other jobs if one fails

    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run agent
        run: |
          claude --dangerously-skip-permissions <<EOF
          /agentful-start --agent=${{ matrix.agent }}
          EOF
```

**fail-fast: true** (default) - Cancel all jobs if one fails
**fail-fast: false** - Let all jobs complete independently

### Collecting Matrix Results

```yaml
jobs:
  parallel-agents:
    strategy:
      matrix:
        agent: [architect, backend, frontend]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run agent
        run: |
          claude --dangerously-skip-permissions <<EOF
          /agentful-start --agent=${{ matrix.agent }}
          EOF
      - name: Upload results
        uses: actions/upload-artifact@v4
        with:
          name: results-${{ matrix.agent }}
          path: .agentful/

  # Collect all results after matrix completes
  aggregate:
    needs: parallel-agents
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Download all agent results
        uses: actions/download-artifact@v4
        with:
          path: results/

      - name: Aggregate results
        run: |
          # Combine results from all agents
          node scripts/aggregate-results.js results/

      - name: Comment on PR
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const aggregate = JSON.parse(fs.readFileSync('aggregate.json'));

            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.payload.pull_request.number,
              body: `## 🤖 All Agents Complete\n\n${aggregate.summary}`
            });
```

### Dynamic Matrix from Files

```yaml
jobs:
  prepare:
    runs-on: ubuntu-latest
    outputs:
      agents: ${{ steps.set-matrix.outputs.agents }}
    steps:
      - uses: actions/checkout@v4
      - name: Generate matrix from product spec
        id: set-matrix
        run: |
          # Read features from product spec and generate agent list
          AGENTS=$(node scripts/get-required-agents.js)
          echo "agents=$AGENTS" >> $GITHUB_OUTPUT

  run-agents:
    needs: prepare
    strategy:
      matrix:
        agent: ${{ fromJson(needs.prepare.outputs.agents) }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run agent
        run: |
          claude --dangerously-skip-permissions <<EOF
          /agentful-start --agent=${{ matrix.agent }}
          EOF
```

---

## Marketplace Distribution Best Practices

### Publishing Requirements

✅ **Requirements for GitHub Actions Marketplace:**

1. Action must be in a **public repository**
2. Repository must contain a **single action** (one `action.yml` per repo)
3. Action name must be **unique** (not matching existing actions, users, orgs, or GitHub features)
4. Repository must **not contain workflow files** (`.github/workflows/`)
5. Must accept **GitHub Marketplace Developer Agreement**
6. Must have **two-factor authentication** enabled

### Publisher Verification

**For Apps:** Available through application process
**For Actions:** Only available to GitHub partners (no public application)

### Marketplace Badges

- **Verified Creator** - GitHub has verified the creator as a partner organization
- **Publisher Domain Verification** - Organization has verified domain ownership

### Recommended Repository Structure

```
agentful-action/
├── action.yml              # Action metadata (REQUIRED at root)
├── README.md               # Marketplace listing description
├── LICENSE                 # Open source license
├── CHANGELOG.md            # Version history
├── .github/
│   ├── ISSUE_TEMPLATE/     # Issue templates
│   └── PULL_REQUEST_TEMPLATE.md
├── docs/                   # Documentation
│   ├── usage.md
│   ├── examples.md
│   └── troubleshooting.md
├── examples/               # Example workflows
│   ├── basic.yml
│   ├── advanced.yml
│   └── matrix.yml
├── src/                    # Source code (for JS actions)
│   └── index.js
├── dist/                   # Compiled code (for JS actions)
│   └── index.js
└── scripts/                # Helper scripts
    └── setup.sh
```

### action.yml Best Practices

```yaml
name: 'agentful GitHub Action'
description: 'Run agentful agents on your pull requests for autonomous development'
author: 'itz4blitz'

# Branding for marketplace
branding:
  icon: 'cpu'  # Choose from Feather icons
  color: 'blue'  # Available: white, yellow, blue, green, orange, red, purple, gray-dark

inputs:
  anthropic_api_key:
    description: 'Anthropic API key for Claude access'
    required: true

  github_token:
    description: 'GitHub token for API access'
    required: true
    default: ${{ github.token }}

  agent:
    description: 'Which agent to run (orchestrator, reviewer, fixer, architect, backend, frontend, tester)'
    required: false
    default: 'orchestrator'

  timeout_minutes:
    description: 'Maximum time for agent execution (default: 20)'
    required: false
    default: '20'

  mode:
    description: 'Execution mode (auto, interactive, validate-only)'
    required: false
    default: 'auto'

outputs:
  validation_result:
    description: 'JSON string of validation results'

  completion_percentage:
    description: 'Feature completion percentage (0-100)'

  quality_gates_passed:
    description: 'Whether all quality gates passed (true/false)'

runs:
  using: 'composite'
  steps:
    # Implementation steps...
```

### README.md Template for Marketplace

```markdown
# agentful GitHub Action

Run agentful agents on your pull requests for autonomous development.

## Features

- 🤖 Multiple specialized agents (architect, backend, frontend, tester, reviewer, fixer)
- ✅ Automated quality gates (type checking, linting, tests, coverage, security)
- 📊 Progress tracking and completion percentages
- 💬 PR comments with validation results
- 🔄 Continuous development with human-in-the-loop checkpoints

## Usage

### Basic Example

\`\`\`yaml
name: agentful Agent
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run agentful reviewer
        uses: itz4blitz/agentful-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          github_token: ${{ secrets.GITHUB_TOKEN }}
          agent: reviewer
\`\`\`

### Advanced Example

\`\`\`yaml
name: Full agentful Pipeline
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  orchestrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run agentful orchestrator
        uses: itz4blitz/agentful-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          github_token: ${{ secrets.GITHUB_TOKEN }}
          agent: orchestrator
          timeout_minutes: 30
          mode: auto
\`\`\`

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `anthropic_api_key` | Anthropic API key | Yes | - |
| `github_token` | GitHub token | Yes | `${{ github.token }}` |
| `agent` | Agent to run | No | `orchestrator` |
| `timeout_minutes` | Execution timeout | No | `20` |
| `mode` | Execution mode | No | `auto` |

## Outputs

| Output | Description |
|--------|-------------|
| `validation_result` | JSON string of validation results |
| `completion_percentage` | Feature completion percentage |
| `quality_gates_passed` | Whether all quality gates passed |

## Examples

See [examples/](examples/) for more workflow configurations.

## License

MIT

## Support

- Documentation: https://agentful.app/docs
- Issues: https://github.com/itz4blitz/agentful-action/issues
```

### Semantic Versioning Strategy

```bash
# Tag releases for marketplace versions
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# Create major version tag that users can reference
git tag -fa v1 -m "Update v1 to v1.0.0"
git push origin v1 --force
```

Users can then reference:
- `itz4blitz/agentful-action@v1` (auto-updates to latest v1.x.x)
- `itz4blitz/agentful-action@v1.0.0` (pinned version)
- `itz4blitz/agentful-action@main` (bleeding edge)

### Publishing Checklist

- [ ] Public repository
- [ ] Single `action.yml` at root
- [ ] Comprehensive README.md
- [ ] LICENSE file
- [ ] Example workflows in `examples/`
- [ ] Branding (icon + color)
- [ ] Unique action name
- [ ] No workflow files in repo
- [ ] Two-factor authentication enabled
- [ ] Marketplace Developer Agreement accepted
- [ ] Semantic version tags (v1.0.0)
- [ ] CHANGELOG.md
- [ ] Clear input/output documentation

### Marketing on Marketplace

- **Clear description** - What problem does it solve?
- **Use cases** - Who is it for?
- **Screenshots/GIFs** - Show it in action
- **Example workflows** - Make it easy to get started
- **Badges** - Build status, version, downloads
- **Links** - Documentation, website, issues

---

## Real-World Implementation Examples

### Anthropic Claude Code Action

**Repository:** https://github.com/anthropics/claude-code-action
**Type:** Composite + TypeScript
**Key Features:**
- Multiple authentication providers (Anthropic, Bedrock, Vertex, Foundry)
- Intelligent mode detection (@mentions, assignments, explicit prompts)
- Structured outputs as validated JSON
- Dynamic progress tracking with checkboxes
- Flexible tool access to GitHub APIs

**Authentication Pattern:**
```yaml
inputs:
  authentication_provider:
    description: 'Authentication provider'
    required: true
    # Options: anthropic-direct-api, amazon-bedrock, google-vertex-ai, microsoft-foundry
```

**Lessons for agentful:**
- Support multiple auth providers from day one
- Use composite action for speed and simplicity
- Provide structured JSON outputs
- Intelligent triggering (don't spam on every push)

### GitHub Actions Upload Artifact

**Repository:** https://github.com/actions/upload-artifact
**Type:** TypeScript action
**Key Features:**
- Smart compression with configurable levels (0-9)
- Handles large files efficiently
- Retention policies
- Exclusion patterns
- Multiple file/directory support

**Performance Pattern:**
```yaml
- uses: actions/upload-artifact@v4
  with:
    name: results
    path: .agentful/
    compression-level: 6  # Balance speed vs size
    retention-days: 7     # Auto-cleanup
    if-no-files-found: warn
```

**Lessons for agentful:**
- Set sensible retention defaults (7 days, not 90)
- Use compression-level: 0 for large logs
- Always handle missing files gracefully
- Provide clear output about what was uploaded

### Playwright GitHub Action (Deprecated)

**Repository:** https://github.com/microsoft/playwright-github-action
**Type:** Deprecated (now recommends CLI)
**Key Insight:** Sometimes the best action is no action - use the tool's CLI directly

**Recommended Pattern:**
```yaml
- name: Install playwright
  run: npx playwright install --with-deps

- name: Run tests
  run: npx playwright test
```

**Lessons for agentful:**
- Consider whether a GitHub Action is needed or if CLI is better
- CLI might be more maintainable long-term
- Users already familiar with CLI will appreciate consistency
- Actions add complexity - justify the value

---

## Recommendations for agentful

### 1. Action Type: Composite Action

**Rationale:**
- Fastest execution (no container overhead)
- Cross-platform support (Linux, macOS, Windows)
- Easiest to maintain (YAML configuration)
- Best for orchestrating CLI tools (which agentful already is)

**Recommended Structure:**
```yaml
# action.yml
name: 'agentful'
description: 'Autonomous product development with AI agents'
author: 'itz4blitz'

branding:
  icon: 'cpu'
  color: 'blue'

inputs:
  anthropic_api_key:
    description: 'Anthropic API key'
    required: true

  command:
    description: 'agentful command to run'
    required: false
    default: '/agentful-start'

  agent:
    description: 'Specific agent to run'
    required: false

  timeout_minutes:
    description: 'Maximum execution time'
    required: false
    default: '20'

outputs:
  completion_percentage:
    description: 'Feature completion percentage'
    value: ${{ steps.complete.outputs.completion }}

  validation_result:
    description: 'Validation results JSON'
    value: ${{ steps.complete.outputs.validation }}

runs:
  using: 'composite'
  steps:
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'

    - name: Install agentful
      shell: bash
      run: npm install -g @itz4blitz/agentful

    - name: Initialize agentful
      shell: bash
      run: |
        if [ ! -d ".claude" ]; then
          npx @itz4blitz/agentful init --non-interactive
        fi

    - name: Run agentful
      shell: bash
      timeout-minutes: ${{ inputs.timeout_minutes }}
      env:
        ANTHROPIC_API_KEY: ${{ inputs.anthropic_api_key }}
      run: |
        AGENT_FLAG=""
        if [ -n "${{ inputs.agent }}" ]; then
          AGENT_FLAG="--agent=${{ inputs.agent }}"
        fi

        claude --dangerously-skip-permissions <<EOF
        ${{ inputs.command }} $AGENT_FLAG
        EOF

    - name: Export results
      id: complete
      shell: bash
      run: |
        if [ -f ".agentful/completion.json" ]; then
          COMPLETION=$(jq -r '.completion_percentage' .agentful/completion.json)
          echo "completion=$COMPLETION" >> $GITHUB_OUTPUT
        fi

        if [ -f ".agentful/last-validation.json" ]; then
          VALIDATION=$(cat .agentful/last-validation.json | jq -c)
          echo "validation=$VALIDATION" >> $GITHUB_OUTPUT
        fi
```

### 2. Authentication: Multi-Provider Support

Support multiple authentication methods like Claude Code Action:

```yaml
inputs:
  auth_provider:
    description: 'Authentication provider (anthropic, bedrock, vertex)'
    required: false
    default: 'anthropic'

  anthropic_api_key:
    description: 'Anthropic API key (for anthropic provider)'
    required: false

  aws_region:
    description: 'AWS region (for bedrock provider)'
    required: false

  gcp_project:
    description: 'GCP project (for vertex provider)'
    required: false
```

### 3. Long-Running Process Strategy

For agentful's 5-20 minute agent runs:

```yaml
- name: Run agent with progress updates
  shell: bash
  timeout-minutes: ${{ inputs.timeout_minutes }}
  run: |
    # Start progress monitoring in background
    (
      while true; do
        if [ -f ".agentful/state.json" ]; then
          PHASE=$(jq -r '.current_phase' .agentful/state.json)
          PROGRESS=$(jq -r '.progress_percentage' .agentful/state.json)
          echo "::notice::Phase: $PHASE | Progress: $PROGRESS%"
        fi
        sleep 30
      done
    ) &
    MONITOR_PID=$!

    # Run agent
    claude --dangerously-skip-permissions <<EOF
    ${{ inputs.command }}
    EOF

    # Cleanup
    kill $MONITOR_PID 2>/dev/null || true
```

### 4. PR Integration Pattern

Recommended approach:

```yaml
- name: Comment on PR
  if: github.event_name == 'pull_request'
  uses: actions/github-script@v7
  with:
    script: |
      const fs = require('fs');
      const marker = '<!-- agentful-report -->';

      // Read results
      const completion = JSON.parse(
        fs.readFileSync('.agentful/completion.json', 'utf8')
      );
      const validation = JSON.parse(
        fs.readFileSync('.agentful/last-validation.json', 'utf8')
      );

      // Generate comment
      const body = `${marker}
## 🤖 agentful Report

**Completion:** ${completion.completion_percentage}%

### Quality Gates
${validation.gates.map(g =>
  `- ${g.passed ? '✅' : '❌'} ${g.name}: ${g.message}`
).join('\n')}

---
*[agentful](https://agentful.app) • [docs](https://agentful.app/docs)*
`;

      // Update or create comment
      const { data: comments } = await github.rest.issues.listComments({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: context.payload.pull_request.number
      });

      const existing = comments.find(c => c.body.includes(marker));

      if (existing) {
        await github.rest.issues.updateComment({
          owner: context.repo.owner,
          repo: context.repo.repo,
          comment_id: existing.id,
          body
        });
      } else {
        await github.rest.issues.createComment({
          owner: context.repo.owner,
          repo: context.repo.repo,
          issue_number: context.payload.pull_request.number,
          body
        });
      }
```

### 5. Artifact Strategy

For agentful results:

```yaml
- name: Upload agent results
  uses: actions/upload-artifact@v4
  if: always()
  with:
    name: agentful-results-${{ github.run_id }}
    path: |
      .agentful/state.json
      .agentful/completion.json
      .agentful/last-validation.json
      .agentful/decisions.json
    retention-days: 7
    compression-level: 6

- name: Upload agent logs (large files)
  uses: actions/upload-artifact@v4
  if: always()
  with:
    name: agentful-logs-${{ github.run_id }}
    path: .agentful/logs/
    retention-days: 3
    compression-level: 0  # Large logs, no compression
    if-no-files-found: ignore
```

### 6. Matrix Build Pattern

For parallel agent execution:

```yaml
jobs:
  parallel-agents:
    strategy:
      matrix:
        agent: [architect, backend, frontend, tester]
      max-parallel: 2  # Control costs and API rate limits
      fail-fast: false  # Let all agents complete

    runs-on: ubuntu-latest
    timeout-minutes: 25

    steps:
      - uses: actions/checkout@v4

      - name: Run agent
        uses: itz4blitz/agentful-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          agent: ${{ matrix.agent }}
          timeout_minutes: 20

  aggregate:
    needs: parallel-agents
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Download all results
        uses: actions/download-artifact@v4
      - name: Comment aggregate results
        uses: actions/github-script@v7
        # ... aggregate and comment
```

### 7. Example Workflows to Provide

Create `examples/` directory with:

**examples/basic.yml** - Simple reviewer on PR
```yaml
name: agentful Review
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: itz4blitz/agentful-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          agent: reviewer
```

**examples/full-pipeline.yml** - Complete orchestration
```yaml
name: agentful Full Pipeline
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  orchestrate:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
      - uses: itz4blitz/agentful-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          command: /agentful-start
          timeout_minutes: 25
```

**examples/parallel.yml** - Matrix execution
```yaml
name: agentful Parallel Agents
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  parallel:
    strategy:
      matrix:
        agent: [architect, backend, frontend]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: itz4blitz/agentful-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          agent: ${{ matrix.agent }}
```

**examples/on-demand.yml** - Comment-triggered
```yaml
name: agentful On Demand
on:
  issue_comment:
    types: [created]

jobs:
  agent:
    if: |
      github.event.issue.pull_request &&
      contains(github.event.comment.body, '@agentful')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: itz4blitz/agentful-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

### 8. Repository Structure

```
agentful-action/
├── action.yml              # Main action definition
├── README.md               # Marketplace description
├── LICENSE                 # MIT license
├── CHANGELOG.md            # Version history
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug.md
│   │   └── feature.md
│   └── PULL_REQUEST_TEMPLATE.md
├── docs/
│   ├── installation.md
│   ├── usage.md
│   ├── inputs.md
│   ├── outputs.md
│   ├── examples.md
│   └── troubleshooting.md
└── examples/
    ├── basic.yml
    ├── full-pipeline.yml
    ├── parallel.yml
    └── on-demand.yml
```

### 9. Publishing Strategy

1. **Create separate repository:** `agentful-action` (not in main agentful repo)
2. **Version with semantic versioning:** v1.0.0, v1.0.1, etc.
3. **Maintain major version tags:** v1 (floating), v1.0.0 (pinned)
4. **Clear release notes** in CHANGELOG.md
5. **Tag releases properly:**
   ```bash
   git tag -a v1.0.0 -m "Initial release"
   git push origin v1.0.0
   git tag -fa v1 -m "Update v1 to v1.0.0"
   git push origin v1 --force
   ```

### 10. Testing Strategy

Before publishing to marketplace:

```yaml
# .github/workflows/test.yml (in agentful-action repo)
name: Test Action
on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]

    steps:
      - uses: actions/checkout@v4

      - name: Test action
        uses: ./  # Test local action
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          command: /agentful-status
          timeout_minutes: 5

      - name: Verify outputs
        run: |
          echo "Completion: ${{ steps.test.outputs.completion_percentage }}"
          echo "Validation: ${{ steps.test.outputs.validation_result }}"
```

---

## Summary

### Key Takeaways for agentful

1. **Use Composite Action** - Fastest, simplest, most maintainable
2. **Support Multiple Auth Providers** - Anthropic, Bedrock, Vertex from day one
3. **Aggressive Timeouts** - Default 20 minutes with configurable override
4. **Progress Monitoring** - Background process logging progress every 30s
5. **Update-or-Create Comments** - Never spam PRs with multiple bot comments
6. **Smart Artifact Strategy** - 7-day retention for results, 3-day for logs, compression-level: 0 for large files
7. **Matrix Builds with max-parallel** - Control costs while enabling parallelism
8. **Separate Repository** - Don't include action in main agentful repo
9. **Rich Examples** - Provide 4-5 example workflows for common use cases
10. **Semantic Versioning** - v1.0.0 pinned, v1 floating

### Architecture Decision

**Recommended:** Composite Action + CLI approach (like Playwright)

**Why:**
- agentful is already a mature CLI tool
- No need to duplicate logic in TypeScript
- Faster execution (no container overhead)
- Cross-platform support
- Easier maintenance (changes to CLI automatically available)
- Users familiar with agentful CLI will recognize patterns

### Next Steps

1. Create `agentful-action` repository
2. Implement composite action following patterns above
3. Add example workflows
4. Write comprehensive README for marketplace
5. Test on multiple platforms
6. Publish to marketplace
7. Document in main agentful README
8. Create blog post/announcement

---

## Additional Resources

- **GitHub Actions Documentation:** https://docs.github.com/actions
- **Marketplace Publishing:** https://docs.github.com/actions/creating-actions/publishing-actions-in-github-marketplace
- **Composite Actions:** https://docs.github.com/actions/creating-actions/creating-a-composite-action
- **Secrets Best Practices:** https://docs.github.com/actions/security-guides/security-hardening-for-github-actions
- **Check Runs API:** https://docs.github.com/rest/checks/runs
- **Artifacts v4:** https://github.blog/news-insights/product-news/get-started-with-v4-of-github-actions-artifacts/
- **Matrix Strategy:** https://docs.github.com/actions/using-jobs/using-a-matrix-for-your-jobs

---

**Research completed:** January 21, 2025
**Next action:** Begin implementation of agentful-action repository
