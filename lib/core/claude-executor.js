/**
 * Unified Claude Code Executor Abstraction
 *
 * Consolidates three different Claude invocation methods:
 * 1. Task API - Use Claude Code's Task() API (preferred, works in slash commands)
 * 2. Subprocess - Spawn claude CLI with -p flag (for server/pipeline)
 * 3. API - Direct Anthropic API calls (future, not yet implemented)
 *
 * Provides streaming execution with real-time progress updates,
 * question detection, error handling, and retry logic.
 *
 * @module core/claude-executor
 */

import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { loadAgentDefinition } from '../ci/claude-action-integration.js';

/**
 * Execution modes
 */
export const ExecutionMode = {
  TASK_API: 'task-api',
  SUBPROCESS: 'subprocess',
  API: 'api',
};

/**
 * Execution states
 */
export const ExecutionState = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
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
 * Default timeout (10 minutes)
 */
const DEFAULT_TIMEOUT = 10 * 60 * 1000;

/**
 * Output Parser
 *
 * Detects progress markers, questions, and errors in streaming output
 */
class OutputParser {
  constructor() {
    this.buffer = '';
  }

  /**
   * Parse a chunk of output
   *
   * @param {string} chunk - Raw output chunk
   * @returns {Object} Parsed events { progress?, question?, error? }
   */
  parse(chunk) {
    this.buffer += chunk;
    const events = {};

    // Detect progress markers: [PROGRESS: 45%] or Progress: 45%
    const progressMatch = chunk.match(/(?:\[PROGRESS:\s*(\d+)%\]|Progress:\s*(\d+)%)/i);
    if (progressMatch) {
      const progress = parseInt(progressMatch[1] || progressMatch[2], 10);
      events.progress = { percentage: progress, raw: progressMatch[0] };
    }

    // Detect task completion markers
    if (chunk.includes('Task completed') || chunk.includes('✓ Complete')) {
      events.progress = { percentage: 100, raw: 'Task completed' };
    }

    // Detect questions: Lines ending with "?" or "Please provide"
    const questionMatch = chunk.match(/^(.+\?)\s*$/m) || chunk.match(/(Please provide .+)/);
    if (questionMatch) {
      events.question = {
        text: questionMatch[1].trim(),
        timestamp: Date.now()
      };
    }

    // Detect errors: Lines starting with "Error:", "ERROR:", or containing "failed"
    const errorMatch = chunk.match(/(?:Error:|ERROR:|❌)\s*(.+)/i);
    if (errorMatch) {
      events.error = {
        message: errorMatch[1].trim(),
        timestamp: Date.now()
      };
    }

    return events;
  }

  /**
   * Reset the buffer
   */
  reset() {
    this.buffer = '';
  }

  /**
   * Get full buffered output
   *
   * @returns {string} Complete output
   */
  getBuffer() {
    return this.buffer;
  }
}

/**
 * Unified Claude Code Executor
 *
 * Provides consistent interface for executing agents across different modes:
 * - Task API: Uses Claude Code's Task() API (for slash commands)
 * - Subprocess: Spawns claude CLI with -p flag (for server/pipeline)
 * - API: Direct Anthropic API calls (future)
 *
 * @extends EventEmitter
 * @emits chunk - Streaming output chunk
 * @emits progress - Progress update (0-100)
 * @emits question - Question detected in output
 * @emits error - Error during execution
 * @emits complete - Execution completed
 * @emits retry - Retry attempt starting
 * @emits cancelled - Execution cancelled
 */
export class ClaudeExecutor extends EventEmitter {
  /**
   * Create a new Claude executor
   *
   * @param {Object} options - Executor options
   * @param {string} [options.mode='subprocess'] - Execution mode
   * @param {string} [options.projectRoot=process.cwd()] - Project root directory
   * @param {string} [options.agentsDir='.claude/agents'] - Agents directory
   * @param {string} [options.claudeCommand='claude'] - Claude CLI command
   * @param {string} [options.workingDir=process.cwd()] - Working directory (alias for projectRoot)
   * @param {number} [options.timeout=600000] - Default timeout in ms
   * @param {number} [options.maxOutputSize=1048576] - Maximum output size
   * @param {boolean} [options.streamOutput=true] - Stream output as chunks
   * @param {number} [options.maxRetries=2] - Maximum retry attempts
   */
  constructor(options = {}) {
    super();

    this.options = {
      mode: options.mode || ExecutionMode.SUBPROCESS,
      projectRoot: options.projectRoot || options.workingDir || process.cwd(),
      agentsDir: options.agentsDir || '.claude/agents',
      claudeCommand: options.claudeCommand || 'claude',
      workingDir: options.workingDir || options.projectRoot || process.cwd(),
      timeout: options.timeout || DEFAULT_TIMEOUT,
      maxOutputSize: options.maxOutputSize || MAX_OUTPUT_SIZE,
      streamOutput: options.streamOutput !== false,
      maxRetries: options.maxRetries || 2,
      ...options,
    };

    // Validate mode
    if (!Object.values(ExecutionMode).includes(this.options.mode)) {
      throw new Error(
        `Invalid execution mode: ${this.options.mode}. ` +
        `Must be one of: ${Object.values(ExecutionMode).join(', ')}`
      );
    }

    this.activeExecutions = new Map();
  }

  /**
   * Execute an agent with a task (main execution method)
   *
   * @param {string} agentName - Name of the agent
   * @param {string} task - Task description
   * @param {Object} [context={}] - Additional context
   * @param {Object} [context.files] - Files to include in context
   * @param {Object} [context.requirements] - Requirements to include
   * @param {Object} [context.variables] - Variables to interpolate
   * @param {Object} [options={}] - Execution options
   * @param {number} [options.timeout] - Override default timeout
   * @param {boolean} [options.streamOutput] - Override streaming setting
   * @returns {Promise<Object>} Execution result
   */
  async execute(agentName, task, context = {}, options = {}) {
    // Validate inputs
    this._validateTask(task);

    const executionId = randomUUID();
    const execOptions = { ...this.options, ...options };

    // Initialize execution context
    const execContext = {
      id: executionId,
      agent: agentName,
      task,
      state: ExecutionState.PENDING,
      startTime: Date.now(),
      endTime: null,
      retries: 0,
      output: '',
      error: null,
      exitCode: null,
    };

    this.activeExecutions.set(executionId, execContext);

    try {
      // Load agent definition
      const agentDef = await this.loadAgent(agentName);
      execContext.agentMetadata = agentDef.metadata;

      // Build full prompt
      const prompt = await this.buildFullPrompt(agentDef, task, context);

      // Update state
      execContext.state = ExecutionState.RUNNING;

      // Execute based on mode
      let result;
      switch (this.options.mode) {
        case ExecutionMode.TASK_API:
          result = await this.executeViaTaskAPI(execContext, agentDef, prompt, context, execOptions);
          break;

        case ExecutionMode.SUBPROCESS:
          result = await this._executeViaSubprocessInternal(execContext, agentDef, prompt, context, execOptions);
          break;

        case ExecutionMode.API:
          result = await this.executeViaAPI(execContext, agentDef, prompt, context, execOptions);
          break;

        default:
          throw new Error(`Unsupported execution mode: ${this.options.mode}`);
      }

      // Update execution context
      execContext.state = ExecutionState.COMPLETED;
      execContext.endTime = Date.now();
      execContext.output = result.output;

      this.emit('complete', {
        executionId,
        duration: execContext.endTime - execContext.startTime,
        result,
      });

      return result;

    } catch (error) {
      // Check if we should retry
      if (execContext.retries < execOptions.maxRetries && this._isRetryableError(error)) {
        execContext.retries++;
        const delay = Math.pow(2, execContext.retries) * 1000; // Exponential backoff

        this.emit('retry', {
          executionId,
          attempt: execContext.retries,
          maxRetries: execOptions.maxRetries,
          delay,
          error: error.message,
        });

        await this._sleep(delay);

        // Retry execution
        return this.execute(agentName, task, context, options);
      }

      // Update execution context with error
      execContext.state = ExecutionState.FAILED;
      execContext.endTime = Date.now();
      execContext.error = error.message;

      this.emit('error', {
        executionId,
        error: error.message,
        duration: execContext.endTime - execContext.startTime,
      });

      throw error;

    } finally {
      // Clean up after delay to allow status queries
      setTimeout(() => {
        this.activeExecutions.delete(executionId);
      }, 60000); // Keep for 1 minute
    }
  }

  /**
   * Load agent definition from .claude/agents/
   *
   * @param {string} agentName - Name of the agent
   * @returns {Promise<Object>} Agent definition with metadata and instructions
   */
  async loadAgent(agentName) {
    return loadAgentDefinition(agentName, this.options.projectRoot);
  }

  /**
   * Build full prompt from agent definition, task, and context
   *
   * @param {Object} agentDef - Agent definition
   * @param {string} task - Task description
   * @param {Object} context - Additional context
   * @returns {Promise<string>} Complete prompt
   */
  async buildFullPrompt(agentDef, task, context = {}) {
    let prompt = `# Task for ${agentDef.metadata.name} Agent

${task}

`;

    // Add context sections
    if (context.files && Array.isArray(context.files)) {
      prompt += `## Relevant Files

${context.files.map(f => `- ${f}`).join('\n')}

`;
    }

    if (context.requirements) {
      prompt += `## Requirements

${context.requirements}

`;
    }

    if (context.variables && Object.keys(context.variables).length > 0) {
      prompt += `## Variables

${Object.entries(context.variables).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

`;
    }

    // Add agent instructions
    prompt += `---

# Agent Instructions

${agentDef.instructions}
`;

    return prompt;
  }

  /**
   * Execute via Claude Code Task API
   *
   * @param {Object} execContext - Execution context
   * @param {Object} agentDef - Agent definition
   * @param {string} prompt - Full prompt
   * @param {Object} context - Additional context
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Execution result
   */
  async executeViaTaskAPI(execContext, agentDef, prompt, context, options) {
    // Task API requires the Task function to be available in the environment
    // This is typically only available when running inside Claude Code slash commands

    if (typeof Task === 'undefined') {
      throw new Error(
        'Task API is not available. ' +
        'This execution mode only works inside Claude Code slash commands. ' +
        'Use subprocess or api mode instead.'
      );
    }

    try {
      const result = await Task(prompt, {
        timeout: options.timeout,
      });

      return {
        success: true,
        output: result,
        mode: ExecutionMode.TASK_API,
      };

    } catch (error) {
      throw new Error(`Task API execution failed: ${error.message}`);
    }
  }

  /**
   * Execute via Anthropic API
   *
   * @param {Object} execContext - Execution context
   * @param {Object} agentDef - Agent definition
   * @param {string} prompt - Full prompt
   * @param {Object} context - Additional context
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Execution result
   */
  async executeViaAPI(execContext, agentDef, prompt, context, options) {
    // Direct API execution not yet implemented
    // This would require ANTHROPIC_API_KEY and direct fetch calls

    throw new Error(
      'Direct API execution not yet implemented. ' +
      'Use task-api or subprocess mode instead. ' +
      'To implement API mode, add Anthropic API key and implement API client.'
    );

    // Future implementation:
    // const apiKey = process.env.ANTHROPIC_API_KEY;
    // if (!apiKey) {
    //   throw new Error('ANTHROPIC_API_KEY environment variable not set');
    // }
    //
    // const response = await fetch('https://api.anthropic.com/v1/messages', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'x-api-key': apiKey,
    //     'anthropic-version': '2023-06-01',
    //   },
    //   body: JSON.stringify({
    //     model: 'claude-sonnet-4',
    //     max_tokens: 4096,
    //     messages: [{ role: 'user', content: prompt }],
    //   }),
    // });
    //
    // if (!response.ok) {
    //   throw new Error(`API error: ${response.status} ${response.statusText}`);
    // }
    //
    // const result = await response.json();
    // return {
    //   success: true,
    //   output: result.content[0].text,
    //   mode: ExecutionMode.API,
    // };
  }

  /**
   * Internal method for subprocess execution (used by execute() and backward compat)
   *
   * @private
   */
  async _executeViaSubprocessInternal(execContext, agentDef, prompt, context, options) {
    return new Promise((resolve, reject) => {
      const args = ['-p', prompt];

      if (options.timeout) {
        args.push('--timeout', options.timeout.toString());
      }

      const proc = spawn(options.claudeCommand, args, {
        cwd: options.workingDir,
        env: {
          ...process.env,
          CLAUDE_NON_INTERACTIVE: '1', // Disable interactive prompts
        },
      });

      execContext.process = proc;
      execContext.parser = new OutputParser();

      let outputSize = 0;
      let outputTruncated = false;

      // Setup timeout
      const timeoutHandle = setTimeout(() => {
        proc.kill('SIGTERM');
        reject(new Error(`Execution timeout after ${options.timeout}ms`));
      }, options.timeout);

      // Capture stdout
      proc.stdout.on('data', (data) => {
        const chunk = data.toString();

        // Check output size limit
        if (outputSize < options.maxOutputSize) {
          const remainingSpace = options.maxOutputSize - outputSize;
          const chunkToAdd = chunk.length <= remainingSpace
            ? chunk
            : chunk.substring(0, remainingSpace) + '\n[Output truncated - limit reached]';

          execContext.output += chunkToAdd;
          outputSize += chunk.length;

          if (chunk.length > remainingSpace) {
            outputTruncated = true;
          }

          // Emit chunk if streaming enabled
          if (options.streamOutput) {
            this.emit('chunk', { executionId: execContext.id, chunk: chunkToAdd, text: chunkToAdd });
          }

          // Parse for structured events
          const events = execContext.parser.parse(chunk);

          if (events.progress) {
            this.emit('progress', {
              executionId: execContext.id,
              percentage: events.progress.percentage,
              message: events.progress.raw,
              timestamp: Date.now()
            });
          }

          if (events.question) {
            this.emit('question', {
              executionId: execContext.id,
              text: events.question.text,
              timestamp: events.question.timestamp
            });
          }

          if (events.error) {
            this.emit('error', {
              executionId: execContext.id,
              message: events.error.message,
              timestamp: events.error.timestamp
            });
          }
        }
      });

      // Capture stderr
      proc.stderr.on('data', (data) => {
        const chunk = data.toString();
        execContext.output += `[ERROR] ${chunk}`;

        if (options.streamOutput) {
          this.emit('chunk', { executionId: execContext.id, chunk: `[ERROR] ${chunk}`, text: `[ERROR] ${chunk}` });
        }

        this.emit('error', {
          executionId: execContext.id,
          message: chunk,
          timestamp: Date.now(),
          source: 'stderr'
        });
      });

      // Handle process exit
      proc.on('close', (code) => {
        clearTimeout(timeoutHandle);
        execContext.exitCode = code;
        execContext.process = null;

        if (outputTruncated) {
          execContext.output += '\n\n[Note: Output was truncated due to size limit]';
        }

        if (code === 0) {
          resolve({
            success: true,
            output: execContext.output,
            exitCode: code,
            mode: ExecutionMode.SUBPROCESS,
            truncated: outputTruncated,
          });
        } else {
          reject(new Error(`Claude exited with code ${code}`));
        }
      });

      // Handle spawn errors
      proc.on('error', (error) => {
        clearTimeout(timeoutHandle);
        reject(new Error(`Failed to spawn claude: ${error.message}`));
      });
    });
  }

  /**
   * Execute agent via subprocess (backward compatibility method)
   *
   * @param {string} agentName - Name of the agent
   * @param {string} task - Task description
   * @param {Object} options - Execution options
   * @param {string} [options.prompt] - Custom prompt (overrides task)
   * @param {number} [options.timeout] - Execution timeout in ms
   * @param {string} [options.workingDir] - Working directory
   * @returns {Promise<Object>} Execution result
   */
  async executeViaSubprocess(agentName, task, options = {}) {
    const executionId = randomUUID();
    const prompt = options.prompt || task;
    const timeout = options.timeout || this.options.timeout;
    const workingDir = options.workingDir || this.options.workingDir;

    const execution = {
      id: executionId,
      agent: agentName,
      task,
      state: ExecutionState.PENDING,
      startTime: Date.now(),
      endTime: null,
      process: null,
      parser: new OutputParser(),
      output: '',
      error: '',
      exitCode: null,
    };

    this.activeExecutions.set(executionId, execution);

    try {
      execution.state = ExecutionState.RUNNING;

      // Emit start event
      this.emit('start', {
        executionId,
        agent: agentName,
        task,
        timestamp: execution.startTime
      });

      return await new Promise((resolve, reject) => {
        // Spawn Claude Code CLI
        const args = ['-p', prompt];
        const proc = spawn(this.options.claudeCommand, args, {
          cwd: workingDir,
          env: {
            ...process.env,
            CLAUDE_NON_INTERACTIVE: '1',
          },
        });

        execution.process = proc;

        let timeoutHandle = null;
        let outputSize = 0;
        let outputTruncated = false;

        // Setup timeout
        if (timeout) {
          timeoutHandle = setTimeout(() => {
            proc.kill('SIGTERM');
            reject(new Error(`Execution timeout after ${timeout}ms`));
          }, timeout);
        }

        // Handle stdout - emit chunks and parse for events
        proc.stdout.on('data', (data) => {
          const chunk = data.toString();

          // Check output size limit
          if (outputSize < this.options.maxOutputSize) {
            const remainingSpace = this.options.maxOutputSize - outputSize;
            const chunkToStore = chunk.length <= remainingSpace
              ? chunk
              : chunk.substring(0, remainingSpace);

            execution.output += chunkToStore;
            outputSize += chunk.length;

            if (chunk.length > remainingSpace) {
              outputTruncated = true;
              execution.output += '\n[Output truncated - limit reached]';
            }
          }

          // Emit raw chunk event
          this.emit('chunk', {
            executionId,
            text: chunk,
            timestamp: Date.now()
          });

          // Parse for structured events
          const events = execution.parser.parse(chunk);

          if (events.progress) {
            this.emit('progress', {
              executionId,
              percentage: events.progress.percentage,
              message: events.progress.raw,
              timestamp: Date.now()
            });
          }

          if (events.question) {
            this.emit('question', {
              executionId,
              text: events.question.text,
              timestamp: events.question.timestamp
            });
          }

          if (events.error) {
            this.emit('error', {
              executionId,
              message: events.error.message,
              timestamp: events.error.timestamp
            });
          }
        });

        // Handle stderr - emit as errors
        proc.stderr.on('data', (data) => {
          const chunk = data.toString();
          execution.error += chunk;

          this.emit('error', {
            executionId,
            message: chunk,
            timestamp: Date.now(),
            source: 'stderr'
          });
        });

        // Handle process exit
        proc.on('close', (code) => {
          if (timeoutHandle) {
            clearTimeout(timeoutHandle);
          }

          execution.exitCode = code;
          execution.endTime = Date.now();
          execution.process = null;

          const duration = execution.endTime - execution.startTime;

          if (code === 0) {
            execution.state = ExecutionState.COMPLETED;

            // Emit complete event
            this.emit('complete', {
              executionId,
              output: execution.output,
              duration,
              timestamp: execution.endTime
            });

            resolve({
              executionId,
              state: ExecutionState.COMPLETED,
              output: execution.output,
              duration,
              exitCode: code,
              truncated: outputTruncated
            });
          } else {
            execution.state = ExecutionState.FAILED;

            reject(new Error(
              `Agent execution failed with exit code ${code}: ${execution.error || 'No error details'}`
            ));
          }

          // Cleanup execution from active map
          this.activeExecutions.delete(executionId);
        });

        proc.on('error', (error) => {
          if (timeoutHandle) {
            clearTimeout(timeoutHandle);
          }

          execution.state = ExecutionState.FAILED;
          execution.endTime = Date.now();

          this.emit('error', {
            executionId,
            message: error.message,
            timestamp: Date.now(),
            source: 'spawn'
          });

          reject(new Error(`Failed to spawn Claude Code: ${error.message}`));

          // Cleanup execution from active map
          this.activeExecutions.delete(executionId);
        });
      });

    } catch (error) {
      execution.state = ExecutionState.FAILED;
      execution.endTime = Date.now();
      execution.error = error.message;

      this.activeExecutions.delete(executionId);
      throw error;
    }
  }

  /**
   * Execute with streaming callbacks
   *
   * @param {string} agentName - Name of the agent
   * @param {string} task - Task description
   * @param {Object} callbacks - Callback functions
   * @param {Function} [callbacks.onChunk] - Called for each output chunk
   * @param {Function} [callbacks.onProgress] - Called when progress detected
   * @param {Function} [callbacks.onQuestion] - Called when question detected
   * @param {Function} [callbacks.onError] - Called when error detected
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Execution result
   */
  async executeWithStreaming(agentName, task, callbacks = {}, options = {}) {
    const { onChunk, onProgress, onQuestion, onError } = callbacks;

    // Register event listeners
    const listeners = {};

    if (onChunk) {
      listeners.chunk = (event) => {
        if (event.executionId) {
          onChunk(event.text);
        }
      };
      this.on('chunk', listeners.chunk);
    }

    if (onProgress) {
      listeners.progress = (event) => {
        if (event.executionId) {
          onProgress(event.percentage, event.message);
        }
      };
      this.on('progress', listeners.progress);
    }

    if (onQuestion) {
      listeners.question = (event) => {
        if (event.executionId) {
          onQuestion(event.text);
        }
      };
      this.on('question', listeners.question);
    }

    if (onError) {
      listeners.error = (event) => {
        if (event.executionId) {
          onError(event.message, event.source);
        }
      };
      this.on('error', listeners.error);
    }

    try {
      // Execute with subprocess
      const result = await this.executeViaSubprocess(agentName, task, options);
      return result;
    } finally {
      // Cleanup listeners
      for (const [event, listener] of Object.entries(listeners)) {
        this.removeListener(event, listener);
      }
    }
  }

  /**
   * Cancel an active execution
   *
   * @param {string} executionId - Execution ID to cancel
   * @returns {boolean} True if cancelled, false if not found
   */
  cancel(executionId) {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      return false;
    }

    if (execution.process) {
      execution.state = ExecutionState.CANCELLED;
      execution.process.kill('SIGTERM');

      // Force kill after timeout
      setTimeout(() => {
        if (execution.process && !execution.process.killed) {
          execution.process.kill('SIGKILL');
        }
      }, 5000);

      return true;
    }

    return false;
  }

  /**
   * Get execution status
   *
   * @param {string} executionId - Execution ID
   * @returns {Object|null} Execution status or null if not found
   */
  getExecutionStatus(executionId) {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      return null;
    }

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
      exitCode: execution.exitCode,
      outputLength: execution.output.length,
      errorLength: execution.error.length
    };
  }

  /**
   * List all active executions
   *
   * @returns {Object[]} Array of execution statuses
   */
  listActiveExecutions() {
    return Array.from(this.activeExecutions.keys()).map(id =>
      this.getExecutionStatus(id)
    );
  }

  /**
   * Validate task input
   *
   * @private
   * @param {string} task - Task description
   * @throws {Error} If task is invalid
   */
  _validateTask(task) {
    if (typeof task !== 'string') {
      throw new Error('Task must be a string');
    }

    if (task.length === 0) {
      throw new Error('Task cannot be empty');
    }

    if (task.length > MAX_TASK_LENGTH) {
      throw new Error(
        `Task exceeds maximum length of ${MAX_TASK_LENGTH / 1024}KB`
      );
    }

    // Check for dangerous shell metacharacters
    const dangerousPatterns = [
      /\$\(/,  // Command substitution
      /`/,     // Backtick command substitution
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(task)) {
        throw new Error(
          'Task contains potentially dangerous shell metacharacters'
        );
      }
    }
  }

  /**
   * Check if error is retryable
   *
   * @private
   * @param {Error} error - Error to check
   * @returns {boolean} True if retryable
   */
  _isRetryableError(error) {
    const retryablePatterns = [
      /timeout/i,
      /ECONNREFUSED/i,
      /ETIMEDOUT/i,
      /rate limit/i,
      /429/,
    ];

    return retryablePatterns.some(pattern =>
      pattern.test(error.message)
    );
  }

  /**
   * Sleep for specified duration
   *
   * @private
   * @param {number} ms - Duration in milliseconds
   * @returns {Promise<void>}
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Create a Claude executor instance
 *
 * @param {Object} options - Executor options
 * @returns {ClaudeExecutor} Executor instance
 */
export function createClaudeExecutor(options = {}) {
  return new ClaudeExecutor(options);
}

/**
 * Create a Claude executor with specified mode (convenience method)
 *
 * @param {Object} options - Executor options
 * @returns {ClaudeExecutor} Executor instance
 */
export function createExecutor(options = {}) {
  return new ClaudeExecutor(options);
}

/**
 * Execute a one-off agent task (convenience method)
 *
 * @param {string} agentName - Agent name
 * @param {string} task - Task description
 * @param {Object} context - Execution context
 * @param {Object} options - Executor options
 * @returns {Promise<Object>} Execution result
 */
export async function executeAgent(agentName, task, context = {}, options = {}) {
  const executor = new ClaudeExecutor(options);
  return executor.execute(agentName, task, context, options);
}

export default ClaudeExecutor;
