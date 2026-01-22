import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';

/**
 * Agent Execution Runtime
 *
 * Handles the actual execution of AI agents:
 * - Agent invocation via subprocess or API
 * - Context passing between jobs
 * - Streaming logs and progress
 * - Cancellation and cleanup
 * - Result collection
 */

/**
 * Agent Executor
 *
 * Executes agents and manages their lifecycle
 */
export class AgentExecutor extends EventEmitter {
  constructor(options = {}) {
    super();

    this.options = {
      agentsDir: options.agentsDir || '.claude/agents',
      tempDir: options.tempDir || '.agentful/pipelines/temp',
      claudeCommand: options.claudeCommand || 'claude',
      streamLogs: options.streamLogs !== false,
      ...options
    };

    this.activeExecutions = new Map(); // executionId -> ExecutionContext
  }

  /**
   * Execute an agent
   *
   * @param {Object} jobDef - Job definition from pipeline
   * @param {Object} context - Execution context (inputs, variables)
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Execution result with output
   */
  async execute(jobDef, context, options = {}) {
    const executionId = this._generateExecutionId(jobDef.id);

    // Build execution context
    const execContext = {
      executionId,
      jobId: jobDef.id,
      agent: jobDef.agent,
      startTime: Date.now(),
      cancelled: false,
      process: null,
      output: '',
      error: '',
      exitCode: null
    };

    this.activeExecutions.set(executionId, execContext);

    try {
      // Prepare agent invocation
      const agentFile = await this._resolveAgentFile(jobDef.agent);
      const prompt = await this._buildAgentPrompt(jobDef, context);

      // Determine execution method
      const method = jobDef.execution?.method || 'subprocess';

      let result;
      if (method === 'subprocess') {
        result = await this._executeViaSubprocess(execContext, agentFile, prompt, context, options);
      } else if (method === 'api') {
        result = await this._executeViaAPI(execContext, jobDef, prompt, context, options);
      } else {
        throw new Error(`Unknown execution method: ${method}`);
      }

      return result;

    } finally {
      this.activeExecutions.delete(executionId);
    }
  }

  /**
   * Cancel an active execution
   *
   * @param {string} executionId - Execution ID to cancel
   * @returns {Promise<boolean>} True if cancelled, false if not found
   */
  async cancel(executionId) {
    const execContext = this.activeExecutions.get(executionId);
    if (!execContext) return false;

    execContext.cancelled = true;

    if (execContext.process) {
      // Kill the subprocess
      execContext.process.kill('SIGTERM');

      // Force kill after timeout
      setTimeout(() => {
        if (execContext.process && !execContext.process.killed) {
          execContext.process.kill('SIGKILL');
        }
      }, 5000);
    }

    return true;
  }

  /**
   * Get execution status
   *
   * @param {string} executionId - Execution ID
   * @returns {Object|null} Execution context or null if not found
   */
  getExecutionStatus(executionId) {
    return this.activeExecutions.get(executionId) || null;
  }

  /**
   * Internal: Execute via subprocess
   *
   * @private
   */
  async _executeViaSubprocess(execContext, agentFile, prompt, context, options) {
    // Write context to temp file
    const contextFile = await this._writeContextFile(execContext.executionId, context);
    const outputFile = path.join(this.options.tempDir, `${execContext.executionId}-output.json`);

    // Prepare agent prompt with context reference
    const fullPrompt = this._injectContextReference(prompt, contextFile, outputFile);

    // Write prompt to temp file
    const promptFile = await this._writePromptFile(execContext.executionId, fullPrompt);

    return new Promise((resolve, reject) => {
      // Spawn Claude Code with agent
      const args = [
        '--agent', agentFile,
        '--prompt-file', promptFile
      ];

      if (options.timeout) {
        args.push('--timeout', options.timeout.toString());
      }

      const proc = spawn(this.options.claudeCommand, args, {
        cwd: process.cwd(),
        env: { ...process.env }
      });

      execContext.process = proc;

      // Setup timeout
      let timeoutHandle;
      if (options.timeout) {
        timeoutHandle = setTimeout(() => {
          if (!execContext.cancelled) {
            proc.kill('SIGTERM');
            reject(new Error(`Agent execution timed out after ${options.timeout}ms`));
          }
        }, options.timeout);
      }

      // Capture stdout
      proc.stdout.on('data', (data) => {
        const text = data.toString();
        execContext.output += text;

        if (this.options.streamLogs && options.onLog) {
          options.onLog(text);
        }

        // Try to extract progress updates
        this._extractProgress(text, options.onProgress);
      });

      // Capture stderr
      proc.stderr.on('data', (data) => {
        const text = data.toString();
        execContext.error += text;

        if (this.options.streamLogs && options.onLog) {
          options.onLog(`[ERROR] ${text}`);
        }
      });

      // Handle process exit
      proc.on('close', async (code) => {
        if (timeoutHandle) clearTimeout(timeoutHandle);

        execContext.exitCode = code;
        execContext.process = null;

        try {
          // Read output file if exists
          let output = null;
          try {
            const outputContent = await fs.readFile(outputFile, 'utf-8');
            output = JSON.parse(outputContent);
          } catch (error) {
            // No output file or invalid JSON - use stdout
            output = { stdout: execContext.output };
          }

          // Cleanup temp files
          await this._cleanupTempFiles(execContext.executionId);

          if (execContext.cancelled) {
            reject(new Error('Execution was cancelled'));
          } else if (code === 0) {
            resolve({
              success: true,
              output,
              duration: Date.now() - execContext.startTime
            });
          } else {
            reject(new Error(`Agent failed with exit code ${code}: ${execContext.error}`));
          }
        } catch (error) {
          reject(error);
        }
      });

      proc.on('error', (error) => {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        reject(new Error(`Failed to spawn agent: ${error.message}`));
      });
    });
  }

  /**
   * Internal: Execute via API
   *
   * @private
   */
  async _executeViaAPI(execContext, jobDef, prompt, context, options) {
    // This would integrate with Claude API directly
    // For now, throw error indicating this needs to be implemented

    throw new Error('API execution not yet implemented. Use subprocess method.');

    // Future implementation would look like:
    // const response = await fetch('https://api.anthropic.com/v1/messages', {
    //   method: 'POST',
    //   headers: { ... },
    //   body: JSON.stringify({ ... })
    // });
  }

  /**
   * Internal: Resolve agent file path
   *
   * @private
   */
  async _resolveAgentFile(agentName) {
    // Try with .md extension
    let agentFile = path.join(this.options.agentsDir, `${agentName}.md`);

    try {
      await fs.access(agentFile);
      return agentFile;
    } catch (error) {
      // Try without extension
      agentFile = path.join(this.options.agentsDir, agentName);

      try {
        await fs.access(agentFile);
        return agentFile;
      } catch (error) {
        throw new Error(`Agent not found: ${agentName}`);
      }
    }
  }

  /**
   * Internal: Build agent prompt from job definition
   *
   * @private
   */
  async _buildAgentPrompt(jobDef, context) {
    let prompt = jobDef.prompt || '';

    // Replace variables in prompt
    prompt = this._interpolateVariables(prompt, context);

    // Add task description
    if (jobDef.task) {
      prompt = `${jobDef.task}\n\n${prompt}`;
    }

    return prompt;
  }

  /**
   * Internal: Interpolate variables in text
   *
   * @private
   */
  _interpolateVariables(text, context) {
    return text.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
      const value = this._getNestedValue(context, path);
      return value !== undefined ? value : match;
    });
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
   * Internal: Inject context reference into prompt
   *
   * @private
   */
  _injectContextReference(prompt, contextFile, outputFile) {
    return `
# Pipeline Job Context

Input context is available at: ${contextFile}
Write your output to: ${outputFile}

Output format (JSON):
\`\`\`json
{
  "success": true,
  "data": { ... },
  "message": "Job completed successfully"
}
\`\`\`

---

# Task

${prompt}
`;
  }

  /**
   * Internal: Write context to temp file
   *
   * @private
   */
  async _writeContextFile(executionId, context) {
    const contextFile = path.join(this.options.tempDir, `${executionId}-context.json`);
    await fs.mkdir(this.options.tempDir, { recursive: true });
    await fs.writeFile(contextFile, JSON.stringify(context, null, 2));
    return contextFile;
  }

  /**
   * Internal: Write prompt to temp file
   *
   * @private
   */
  async _writePromptFile(executionId, prompt) {
    const promptFile = path.join(this.options.tempDir, `${executionId}-prompt.txt`);
    await fs.mkdir(this.options.tempDir, { recursive: true });
    await fs.writeFile(promptFile, prompt);
    return promptFile;
  }

  /**
   * Internal: Cleanup temp files
   *
   * @private
   */
  async _cleanupTempFiles(executionId) {
    const files = [
      path.join(this.options.tempDir, `${executionId}-context.json`),
      path.join(this.options.tempDir, `${executionId}-output.json`),
      path.join(this.options.tempDir, `${executionId}-prompt.txt`)
    ];

    for (const file of files) {
      try {
        await fs.unlink(file);
      } catch (error) {
        // Ignore errors - file might not exist
      }
    }
  }

  /**
   * Internal: Extract progress from output
   *
   * @private
   */
  _extractProgress(text, onProgress) {
    if (!onProgress) return;

    // Look for progress markers: [PROGRESS: 45%] or similar
    const progressMatch = text.match(/\[PROGRESS:\s*(\d+)%\]/i);
    if (progressMatch) {
      const progress = parseInt(progressMatch[1], 10);
      onProgress(progress);
      return;
    }

    // Look for task completion markers
    if (text.includes('Task completed') || text.includes('✓')) {
      onProgress(100);
    }
  }

  /**
   * Internal: Generate execution ID
   *
   * @private
   */
  _generateExecutionId(jobId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `${jobId}-${timestamp}-${random}`;
  }
}

/**
 * Agent Executor Factory
 *
 * Creates agent executor with custom configuration
 */
export function createAgentExecutor(options = {}) {
  return new AgentExecutor(options);
}

export default AgentExecutor;
