/**
 * Claude Code Action Integration
 *
 * Integrates agentful with anthropics/claude-code-action for CI/CD.
 * Provides tools to load agent definitions, build prompts, and generate workflows.
 *
 * @module ci/claude-action-integration
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Error codes for CI operations
 */
export const CI_ERROR_CODES = {
  AGENT_NOT_FOUND: 'AGENT_NOT_FOUND',
  INVALID_AGENT_FILE: 'INVALID_AGENT_FILE',
  MISSING_CONTEXT: 'MISSING_CONTEXT',
  WORKFLOW_GENERATION_FAILED: 'WORKFLOW_GENERATION_FAILED',
};

/**
 * CI Error class for structured error handling
 */
export class CIError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'CIError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Validate agent name to prevent path traversal
 * @param {string} agentName - Agent name to validate
 * @returns {boolean} True if valid
 */
function isValidAgentName(agentName) {
  // Only allow alphanumeric, hyphens, and underscores
  return /^[a-zA-Z0-9_-]+$/.test(agentName);
}

/**
 * Parse agent markdown file with frontmatter
 * @param {string} content - Raw markdown content
 * @returns {Object} Parsed agent definition { metadata, instructions }
 */
function parseAgentMarkdown(content) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    throw new CIError(
      CI_ERROR_CODES.INVALID_AGENT_FILE,
      'Agent file must have YAML frontmatter',
      { content: content.substring(0, 200) }
    );
  }

  const [, frontmatter, instructions] = match;

  let metadata;
  try {
    metadata = yaml.load(frontmatter);
  } catch (error) {
    throw new CIError(
      CI_ERROR_CODES.INVALID_AGENT_FILE,
      'Invalid YAML frontmatter in agent file',
      { error: error.message }
    );
  }

  return {
    metadata,
    instructions: instructions.trim(),
  };
}

/**
 * Load agent definition from .claude/agents/{name}.md
 * @param {string} agentName - Name of the agent (e.g., 'backend', 'frontend')
 * @param {string} [projectRoot=process.cwd()] - Project root directory
 * @returns {Promise<Object>} Agent definition with metadata and instructions
 */
export async function loadAgentDefinition(agentName, projectRoot = process.cwd()) {
  // Validate agent name to prevent path traversal
  if (!isValidAgentName(agentName)) {
    throw new CIError(
      CI_ERROR_CODES.AGENT_NOT_FOUND,
      `Invalid agent name: "${agentName}". Agent names must contain only alphanumeric characters, hyphens, and underscores.`,
      { agentName }
    );
  }

  const agentPath = path.join(projectRoot, '.claude', 'agents', `${agentName}.md`);

  try {
    const content = await fs.readFile(agentPath, 'utf-8');
    const agent = parseAgentMarkdown(content);

    return {
      name: agentName,
      path: agentPath,
      ...agent,
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new CIError(
        CI_ERROR_CODES.AGENT_NOT_FOUND,
        `Agent definition not found: ${agentName}`,
        { path: agentPath, availableAgents: await listAvailableAgents(projectRoot) }
      );
    }

    if (error instanceof CIError) {
      throw error;
    }

    throw new CIError(
      CI_ERROR_CODES.INVALID_AGENT_FILE,
      `Failed to load agent definition: ${error.message}`,
      { agentName, path: agentPath, error: error.message }
    );
  }
}

/**
 * List all available agents in the project
 * @param {string} [projectRoot=process.cwd()] - Project root directory
 * @returns {Promise<string[]>} Array of agent names
 */
export async function listAvailableAgents(projectRoot = process.cwd()) {
  const agentsDir = path.join(projectRoot, '.claude', 'agents');

  try {
    const files = await fs.readdir(agentsDir);
    return files
      .filter(f => f.endsWith('.md'))
      .map(f => f.replace('.md', ''));
  } catch (error) {
    return [];
  }
}

/**
 * Extract GitHub context from environment variables
 * @returns {Promise<Object>} GitHub context metadata
 */
export async function extractGitHubContext() {
  const context = {
    platform: 'github',
    event: process.env.GITHUB_EVENT_NAME,
    repository: process.env.GITHUB_REPOSITORY,
    ref: process.env.GITHUB_REF,
    sha: process.env.GITHUB_SHA,
    actor: process.env.GITHUB_ACTOR,
    workflow: process.env.GITHUB_WORKFLOW,
    runId: process.env.GITHUB_RUN_ID,
    runNumber: process.env.GITHUB_RUN_NUMBER,
  };

  // Parse PR-specific context
  if (process.env.GITHUB_EVENT_NAME === 'pull_request') {
    try {
      const eventPath = process.env.GITHUB_EVENT_PATH;
      if (eventPath) {
        const eventData = await fs.readFile(eventPath, 'utf-8');
        const event = JSON.parse(eventData);
        context.pullRequest = {
          number: event.pull_request?.number,
          title: event.pull_request?.title,
          author: event.pull_request?.user?.login,
          base: event.pull_request?.base?.ref,
          head: event.pull_request?.head?.ref,
          changedFiles: event.pull_request?.changed_files,
        };
      }
    } catch (error) {
      // Event data not available, continue without it
    }
  }

  return context;
}

/**
 * Extract GitLab context from environment variables
 * @returns {Object} GitLab context metadata
 */
export function extractGitLabContext() {
  return {
    platform: 'gitlab',
    projectId: process.env.CI_PROJECT_ID,
    projectName: process.env.CI_PROJECT_NAME,
    repository: process.env.CI_PROJECT_PATH,
    ref: process.env.CI_COMMIT_REF_NAME,
    sha: process.env.CI_COMMIT_SHA,
    pipeline: process.env.CI_PIPELINE_ID,
    job: process.env.CI_JOB_NAME,
    mergeRequest: process.env.CI_MERGE_REQUEST_IID ? {
      iid: process.env.CI_MERGE_REQUEST_IID,
      title: process.env.CI_MERGE_REQUEST_TITLE,
      sourceBranch: process.env.CI_MERGE_REQUEST_SOURCE_BRANCH_NAME,
      targetBranch: process.env.CI_MERGE_REQUEST_TARGET_BRANCH_NAME,
    } : null,
  };
}

/**
 * Extract Jenkins context from environment variables
 * @returns {Object} Jenkins context metadata
 */
export function extractJenkinsContext() {
  return {
    platform: 'jenkins',
    buildNumber: process.env.BUILD_NUMBER,
    buildId: process.env.BUILD_ID,
    jobName: process.env.JOB_NAME,
    buildUrl: process.env.BUILD_URL,
    gitBranch: process.env.GIT_BRANCH,
    gitCommit: process.env.GIT_COMMIT,
    changeId: process.env.CHANGE_ID,
    changeBranch: process.env.CHANGE_BRANCH,
    changeTarget: process.env.CHANGE_TARGET,
  };
}

export function extractBitbucketContext() {
  return {
    platform: 'bitbucket',
    buildNumber: process.env.BITBUCKET_BUILD_NUMBER,
    pipelineUuid: process.env.BITBUCKET_PIPELINE_UUID,
    repository: process.env.BITBUCKET_REPO_FULL_NAME,
    workspace: process.env.BITBUCKET_WORKSPACE,
    gitBranch: process.env.BITBUCKET_BRANCH,
    gitCommit: process.env.BITBUCKET_COMMIT,
    gitTag: process.env.BITBUCKET_TAG,
    pullRequest: process.env.BITBUCKET_PR_ID ? {
      id: process.env.BITBUCKET_PR_ID,
      destinationBranch: process.env.BITBUCKET_PR_DESTINATION_BRANCH,
    } : null,
  };
}

/**
 * Auto-detect CI platform and extract context
 * @returns {Promise<Object>} CI context metadata
 */
export async function extractCIContext() {
  if (process.env.GITHUB_ACTIONS === 'true') {
    return await extractGitHubContext();
  }

  if (process.env.GITLAB_CI === 'true') {
    return extractGitLabContext();
  }

  if (process.env.JENKINS_HOME) {
    return extractJenkinsContext();
  }

  if (process.env.BITBUCKET_BUILD_NUMBER) {
    return extractBitbucketContext();
  }

  return {
    platform: 'unknown',
    isCI: false,
  };
}

/**
 * Inject CI context into prompt with proper formatting
 * @param {string} prompt - Base prompt
 * @param {Object} ciMetadata - CI context metadata
 * @returns {string} Prompt with injected CI context
 */
export function injectCIContext(prompt, ciMetadata) {
  const contextSection = `
## CI Context

**Platform:** ${ciMetadata.platform}
**Repository:** ${ciMetadata.repository || 'N/A'}
**Branch:** ${ciMetadata.ref || ciMetadata.gitBranch || 'N/A'}
**Commit:** ${ciMetadata.sha || ciMetadata.gitCommit || 'N/A'}
**Actor:** ${ciMetadata.actor || 'N/A'}

${ciMetadata.pullRequest ? `
### Pull Request
- **Number:** #${ciMetadata.pullRequest.number}
- **Title:** ${ciMetadata.pullRequest.title}
- **Author:** ${ciMetadata.pullRequest.author}
- **Base:** ${ciMetadata.pullRequest.base}
- **Head:** ${ciMetadata.pullRequest.head}
- **Changed Files:** ${ciMetadata.pullRequest.changedFiles || 'N/A'}
` : ''}

${ciMetadata.mergeRequest ? `
### Merge Request
- **IID:** !${ciMetadata.mergeRequest.iid}
- **Title:** ${ciMetadata.mergeRequest.title}
- **Source:** ${ciMetadata.mergeRequest.sourceBranch}
- **Target:** ${ciMetadata.mergeRequest.targetBranch}
` : ''}

---
`;

  return contextSection + '\n' + prompt;
}

/**
 * Build a prompt for claude-code-action
 * @param {string} agentName - Name of the agent
 * @param {string} task - Specific task description
 * @param {Object} [options] - Optional configuration
 * @param {string} [options.projectRoot] - Project root directory
 * @param {Object} [options.context] - Additional context to inject
 * @param {boolean} [options.includeCIContext=true] - Include CI metadata
 * @returns {Promise<string>} Formatted prompt for claude-code-action
 */
export async function buildCIPrompt(agentName, task, options = {}) {
  const {
    projectRoot = process.cwd(),
    context = {},
    includeCIContext = true,
  } = options;

  // Load agent definition
  const agent = await loadAgentDefinition(agentName, projectRoot);

  // Build base prompt
  let prompt = `# Task for ${agent.metadata.name} Agent

${task}

---

# Agent Instructions

${agent.instructions}
`;

  // Add custom context if provided
  if (Object.keys(context).length > 0) {
    prompt += `\n\n## Additional Context\n\n`;
    for (const [key, value] of Object.entries(context)) {
      prompt += `**${key}:** ${value}\n`;
    }
  }

  // Inject CI context if enabled
  if (includeCIContext) {
    const ciContext = await extractCIContext();
    if (ciContext.platform !== 'unknown') {
      prompt = injectCIContext(prompt, ciContext);
    }
  }

  return prompt;
}

/**
 * Generate GitHub Actions workflow file
 * @param {Object} config - Workflow configuration
 * @param {string[]} config.agents - Agent names to include
 * @param {string[]} config.triggers - Event triggers (e.g., ['pull_request', 'push'])
 * @param {Object} [config.options] - Additional workflow options
 * @returns {Promise<string>} YAML workflow content
 */
export async function generateGitHubWorkflow(config) {
  const {
    agents = ['backend', 'frontend', 'reviewer'],
    triggers = ['pull_request'],
    options = {},
  } = config;

  const {
    nodeVersion = '22.x',
    runsOn = 'ubuntu-latest',
    branches = ['main', 'develop'],
  } = options;

  const workflow = {
    name: 'Agentful CI',
    on: {},
    jobs: {},
  };

  // Configure triggers
  for (const trigger of triggers) {
    if (trigger === 'pull_request' || trigger === 'push') {
      workflow.on[trigger] = {
        branches,
      };
    } else {
      workflow.on[trigger] = {};
    }
  }

  // Generate job for each agent
  for (const agentName of agents) {
    const jobId = agentName.replace(/[^a-z0-9_-]/gi, '-');

    workflow.jobs[jobId] = {
      name: `${agentName} Agent`,
      'runs-on': runsOn,
      steps: [
        {
          name: 'Checkout code',
          uses: 'actions/checkout@v4',
        },
        {
          name: 'Setup Node.js',
          uses: 'actions/setup-node@v4',
          with: {
            'node-version': nodeVersion,
            cache: 'npm',
          },
        },
        {
          name: 'Install dependencies',
          run: 'npm ci',
        },
        {
          name: `Run ${agentName} agent`,
          uses: 'anthropics/claude-code-action@v1',
          with: {
            prompt: `$\{{ steps.prepare-prompt.outputs.prompt }}`,
            'api-key': '${{ secrets.ANTHROPIC_API_KEY }}',
            model: 'claude-sonnet-4',
          },
        },
      ],
    };

    // Add step to prepare prompt
    workflow.jobs[jobId].steps.splice(3, 0, {
      name: 'Prepare agent prompt',
      id: 'prepare-prompt',
      run: `echo "prompt=$(npx agentful ci ${agentName} \\"Analyze and review changes\\")" >> $GITHUB_OUTPUT`,
    });
  }

  return yaml.dump(workflow, {
    lineWidth: 120,
    noRefs: true,
  });
}

/**
 * Generate GitLab CI configuration
 * @param {Object} config - CI configuration
 * @returns {Promise<string>} YAML GitLab CI content
 */
export async function generateGitLabCI(config) {
  const {
    agents = ['backend', 'frontend', 'reviewer'],
    options = {},
  } = config;

  const {
    image = 'node:22',
    stages = ['test', 'review'],
  } = options;

  const ci = {
    image,
    stages,
  };

  // Generate job for each agent
  for (const agentName of agents) {
    const jobName = `${agentName}_agent`;

    ci[jobName] = {
      stage: 'review',
      script: [
        'npm ci',
        `PROMPT=$(npx agentful ci ${agentName} "Analyze and review changes")`,
        'echo "$PROMPT" | claude-code-action',
      ],
      only: ['merge_requests'],
    };
  }

  return yaml.dump(ci, {
    lineWidth: 120,
    noRefs: true,
  });
}

/**
 * Generate Jenkinsfile
 * @param {Object} config - Pipeline configuration
 * @returns {Promise<string>} Jenkinsfile content
 */
export async function generateJenkinsfile(config) {
  const {
    agents = ['backend', 'frontend', 'reviewer'],
    options = {},
  } = config;

  const {
    nodeVersion = '22',
  } = options;

  let jenkinsfile = `
pipeline {
  agent any

  tools {
    nodejs '${nodeVersion}'
  }

  stages {
    stage('Setup') {
      steps {
        sh 'npm ci'
      }
    }
`;

  // Generate stage for each agent
  for (const agentName of agents) {
    jenkinsfile += `
    stage('${agentName} Agent') {
      steps {
        script {
          def prompt = sh(
            script: "npx agentful ci ${agentName} 'Analyze and review changes'",
            returnStdout: true
          ).trim()

          // Run claude-code-action with prompt
          sh "echo '\${prompt}' | claude-code-action"
        }
      }
    }
`;
  }

  jenkinsfile += `
  }

  post {
    always {
      cleanWs()
    }
  }
}
`;

  return jenkinsfile.trim();
}

/**
 * Generate workflow for specified platform
 * @param {Object} config - Workflow configuration
 * @param {string} config.platform - CI platform ('github', 'gitlab', 'jenkins')
 * @param {string[]} config.agents - Agent names
 * @param {string[]} [config.triggers] - Event triggers (GitHub Actions only)
 * @param {Object} [config.options] - Additional options
 * @returns {Promise<string>} Workflow configuration content
 */
export async function generateWorkflow(config) {
  const { platform = 'github' } = config;

  switch (platform) {
    case 'github':
      return generateGitHubWorkflow(config);
    case 'gitlab':
      return generateGitLabCI(config);
    case 'jenkins':
      return generateJenkinsfile(config);
    default:
      throw new CIError(
        CI_ERROR_CODES.WORKFLOW_GENERATION_FAILED,
        `Unsupported CI platform: ${platform}`,
        { supportedPlatforms: ['github', 'gitlab', 'jenkins'] }
      );
  }
}

/**
 * Write workflow file to appropriate location
 * @param {string} content - Workflow content
 * @param {string} platform - CI platform
 * @param {string} [projectRoot=process.cwd()] - Project root directory
 * @returns {Promise<string>} Path to written file
 */
export async function writeWorkflowFile(content, platform, projectRoot = process.cwd()) {
  let filePath;

  switch (platform) {
    case 'github':
      filePath = path.join(projectRoot, '.github', 'workflows', 'agentful.yml');
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      break;
    case 'gitlab':
      filePath = path.join(projectRoot, '.gitlab-ci.yml');
      break;
    case 'jenkins':
      filePath = path.join(projectRoot, 'Jenkinsfile');
      break;
    default:
      throw new CIError(
        CI_ERROR_CODES.WORKFLOW_GENERATION_FAILED,
        `Cannot write workflow for unknown platform: ${platform}`
      );
  }

  await fs.writeFile(filePath, content, 'utf-8');
  return filePath;
}

// Export all functions
export default {
  loadAgentDefinition,
  listAvailableAgents,
  buildCIPrompt,
  injectCIContext,
  extractCIContext,
  extractGitHubContext,
  extractGitLabContext,
  extractJenkinsContext,
  generateWorkflow,
  generateGitHubWorkflow,
  generateGitLabCI,
  generateJenkinsfile,
  writeWorkflowFile,
  CIError,
  CI_ERROR_CODES,
};
