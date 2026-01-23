/**
 * Agent Execution Logic for Agentful Server
 *
 * Spawns Claude Code CLI with agent prompts and manages execution state.
 *
 * @module server/executor
 */

import { spawn } from 'child_process';
import { randomUUID } from 'crypto';
import { loadAgentDefinition } from '../ci/claude-action-integration.js';

/**
 * Execution states
 */
export const ExecutionState = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

/**
 * Maximum output size (1MB per execution)
 */
const MAX_OUTPUT_SIZE = 1 * 1024 * 1024;

/**
 * Maximum task length (10KB)
 */
const MAX_TASK_LENGTH = 10 * 1024;

/**
 * Allowed environment variable whitelist
 */
const ALLOWED_ENV_VARS = new Set(['NODE_ENV', 'DEBUG', 'LOG_LEVEL']);

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
 * Sanitize task input to prevent command injection
 * @param {string} task - Task description
 * @returns {Object} Validation result { valid: boolean, error?: string }
 */
function validateTask(task) {
  if (typeof task !== 'string') {
    return { valid: false, error: 'Task must be a string' };
  }

  if (task.length > MAX_TASK_LENGTH) {
    return {
      valid: false,
      error: `Task exceeds maximum length of ${MAX_TASK_LENGTH / 1024}KB`
    };
  }

  // Check for shell metacharacters that could be dangerous
  const dangerousPatterns = [
    /\$\(/,  // Command substitution
    /`/,     // Backtick command substitution
    /\|\|/,  // Or operator
    /&&/,    // And operator
    /;/,     // Command separator
    />/,     // Output redirection
    /</,     // Input redirection
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(task)) {
      return {
        valid: false,
        error: 'Task contains potentially dangerous shell metacharacters'
      };
    }
  }

  return { valid: true };
}

/**
 * Filter environment variables to whitelist only
 * @param {Object} env - Environment variables
 * @returns {Object} Filtered environment variables
 */
function filterEnvironmentVars(env) {
  const filtered = {};
  for (const [key, value] of Object.entries(env)) {
    if (ALLOWED_ENV_VARS.has(key)) {
      filtered[key] = value;
    }
  }
  return filtered;
}

/**
 * In-memory execution store
 * In production, use a database or distributed cache
 */
const executions = new Map();

/**
 * Build agent prompt from task
 * @param {Object} agent - Agent definition
 * @param {string} task - Task description
 * @returns {string} Formatted prompt
 */
function buildAgentPrompt(agent, task) {
  return `# Task for ${agent.metadata.name} Agent

${task}

---

# Agent Instructions

${agent.instructions}
`;
}

/**
 * Execute agent with Claude Code CLI
 * @param {string} agentName - Name of the agent
 * @param {string} task - Task description
 * @param {Object} options - Execution options
 * @param {string} [options.projectRoot] - Project root directory
 * @param {number} [options.timeout] - Execution timeout in ms
 * @param {Object} [options.env] - Additional environment variables
 * @param {boolean} [options.async=false] - If true, return immediately with executionId
 * @returns {Promise<Object>} Execution result (or just executionId if async=true)
 */
export async function executeAgent(agentName, task, options = {}) {
  const {
    projectRoot = process.cwd(),
    timeout = 10 * 60 * 1000, // 10 minutes default
    env = {},
    async = false, // New option for non-blocking execution
  } = options;

  // Validate agent name to prevent path traversal
  if (!isValidAgentName(agentName)) {
    throw new Error(
      `Invalid agent name: "${agentName}". ` +
      `Agent names must contain only alphanumeric characters, hyphens, and underscores.`
    );
  }

  // Validate and sanitize task input
  const taskValidation = validateTask(task);
  if (!taskValidation.valid) {
    throw new Error(`Invalid task: ${taskValidation.error}`);
  }

  // Filter environment variables to whitelist
  const filteredEnv = filterEnvironmentVars(env);

  const executionId = randomUUID();

  // Initialize execution record
  const execution = {
    id: executionId,
    agent: agentName,
    task,
    state: ExecutionState.PENDING,
    startTime: Date.now(),
    endTime: null,
    output: '',
    error: null,
    exitCode: null,
  };

  executions.set(executionId, execution);

  // If async mode, start execution in background and return immediately
  if (async) {
    // Start execution in background (don't await)
    runAgentExecution(executionId, agentName, task, {
      projectRoot,
      timeout,
      filteredEnv,
    }).catch((error) => {
      // Update execution with error if background execution fails
      const exec = executions.get(executionId);
      if (exec) {
        exec.state = ExecutionState.FAILED;
        exec.endTime = Date.now();
        exec.error = error.message;
        exec.exitCode = -1;
      }
    });

    return {
      executionId,
      state: ExecutionState.PENDING,
      message: 'Execution started in background',
    };
  }

  // Synchronous mode - wait for completion and return full result
  return runAgentExecution(executionId, agentName, task, {
    projectRoot,
    timeout,
    filteredEnv,
  });
}

/**
 * Internal function to run agent execution
 * @param {string} executionId - Execution ID
 * @param {string} agentName - Agent name
 * @param {string} task - Task description
 * @param {Object} options - Execution options
 * @returns {Promise<Object>} Execution result
 */
async function runAgentExecution(executionId, agentName, task, options) {
  const { projectRoot, timeout, filteredEnv } = options;
  const execution = executions.get(executionId);

  if (!execution) {
    throw new Error(`Execution ${executionId} not found`);
  }

  try {
    // Load agent definition
    const agent = await loadAgentDefinition(agentName, projectRoot);

    // Build prompt
    const prompt = buildAgentPrompt(agent, task);

    // Update state to running
    execution.state = ExecutionState.RUNNING;
    execution.agentMetadata = agent.metadata;

    // Spawn Claude Code CLI
    const claude = spawn('claude', ['-p', prompt], {
      cwd: projectRoot,
      env: {
        ...process.env,
        ...filteredEnv,
        // Disable interactive prompts
        CLAUDE_NON_INTERACTIVE: '1',
      },
      timeout,
    });

    // Capture output with size limit
    const outputChunks = [];
    const errorChunks = [];
    let outputSize = 0;
    let outputTruncated = false;

    claude.stdout.on('data', (data) => {
      const chunk = data.toString();
      outputChunks.push(chunk);

      // Check output size limit
      if (outputSize < MAX_OUTPUT_SIZE) {
        const remainingSpace = MAX_OUTPUT_SIZE - outputSize;
        const chunkToAdd = chunk.length <= remainingSpace
          ? chunk
          : chunk.substring(0, remainingSpace) + '\n[Output truncated - limit reached]';

        execution.output += chunkToAdd;
        outputSize += chunk.length;

        if (chunk.length > remainingSpace) {
          outputTruncated = true;
        }
      }
    });

    claude.stderr.on('data', (data) => {
      const chunk = data.toString();
      errorChunks.push(chunk);

      // Check output size limit
      if (outputSize < MAX_OUTPUT_SIZE) {
        const remainingSpace = MAX_OUTPUT_SIZE - outputSize;
        const chunkToAdd = chunk.length <= remainingSpace
          ? chunk
          : chunk.substring(0, remainingSpace) + '\n[Output truncated - limit reached]';

        execution.output += chunkToAdd;
        outputSize += chunk.length;

        if (chunk.length > remainingSpace) {
          outputTruncated = true;
        }
      }
    });

    // Wait for completion
    let timeoutHandle = null;
    const exitCode = await new Promise((resolve, reject) => {
      claude.on('close', (code) => {
        // Clear timeout on normal completion
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
          timeoutHandle = null;
        }
        resolve(code);
      });

      claude.on('error', (error) => {
        // Clear timeout on error
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
          timeoutHandle = null;
        }
        reject(error);
      });

      // Handle timeout
      if (timeout) {
        timeoutHandle = setTimeout(() => {
          timeoutHandle = null;
          claude.kill('SIGTERM');
          reject(new Error(`Execution timeout after ${timeout}ms`));
        }, timeout);
      }
    });

    // Add truncation notice if output was limited
    if (outputTruncated) {
      execution.output += '\n\n[Note: Output was truncated due to size limit]';
    }

    // Update execution record
    execution.endTime = Date.now();
    execution.exitCode = exitCode;

    if (exitCode === 0) {
      execution.state = ExecutionState.COMPLETED;
    } else {
      execution.state = ExecutionState.FAILED;
      execution.error = `Claude exited with code ${exitCode}`;
    }

    return {
      executionId,
      state: execution.state,
      exitCode,
    };
  } catch (error) {
    // Update execution with error
    execution.state = ExecutionState.FAILED;
    execution.endTime = Date.now();
    execution.error = error.message;
    execution.exitCode = -1;

    return {
      executionId,
      state: ExecutionState.FAILED,
      error: error.message,
    };
  }
}

/**
 * Get execution status
 * @param {string} executionId - Execution ID
 * @returns {Object|null} Execution details or null if not found
 */
export function getExecutionStatus(executionId) {
  const execution = executions.get(executionId);

  if (!execution) {
    return null;
  }

  // Calculate duration
  const duration = execution.endTime
    ? execution.endTime - execution.startTime
    : Date.now() - execution.startTime;

  return {
    id: execution.id,
    agent: execution.agent,
    task: execution.task,
    state: execution.state,
    startTime: execution.startTime,
    endTime: execution.endTime,
    duration,
    output: execution.output,
    error: execution.error,
    exitCode: execution.exitCode,
    metadata: execution.agentMetadata,
  };
}

/**
 * List all executions (with optional filtering)
 * @param {Object} filters - Filter options
 * @param {string} [filters.agent] - Filter by agent name
 * @param {string} [filters.state] - Filter by state
 * @param {number} [filters.limit] - Maximum number of results
 * @returns {Object[]} Array of execution summaries
 */
export function listExecutions(filters = {}) {
  const { agent, state, limit = 100 } = filters;

  let results = Array.from(executions.values());

  // Apply filters
  if (agent) {
    results = results.filter((e) => e.agent === agent);
  }

  if (state) {
    results = results.filter((e) => e.state === state);
  }

  // Sort by start time (newest first)
  results.sort((a, b) => b.startTime - a.startTime);

  // Limit results
  results = results.slice(0, limit);

  // Return summary (no output to keep response small)
  return results.map((e) => ({
    id: e.id,
    agent: e.agent,
    task: e.task,
    state: e.state,
    startTime: e.startTime,
    endTime: e.endTime,
    duration: e.endTime ? e.endTime - e.startTime : Date.now() - e.startTime,
    exitCode: e.exitCode,
  }));
}

/**
 * Clean up old executions (to prevent memory leak)
 * @param {number} maxAge - Maximum age in ms (default: 1 hour)
 * @returns {number} Number of executions cleaned up
 */
export function cleanupExecutions(maxAge = 60 * 60 * 1000) {
  const cutoff = Date.now() - maxAge;
  let cleaned = 0;

  for (const [id, execution] of executions.entries()) {
    if (execution.endTime && execution.endTime < cutoff) {
      executions.delete(id);
      cleaned++;
    }
  }

  return cleaned;
}

/**
 * Start periodic cleanup (runs every hour)
 */
export function startPeriodicCleanup() {
  setInterval(() => {
    const cleaned = cleanupExecutions();
    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} old executions`);
    }
  }, 60 * 60 * 1000); // Run every hour
}

export default {
  executeAgent,
  getExecutionStatus,
  listExecutions,
  cleanupExecutions,
  startPeriodicCleanup,
  ExecutionState,
};
