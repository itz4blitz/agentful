/**
 * MCP Tool: Launch Specialist Agent
 *
 * Launches a specialized agent (backend, frontend, tester, etc.) to execute a task.
 * Uses the agentful execution engine to spawn agents in background or synchronous mode.
 *
 * @module mcp/tools/launch-specialist
 */

import { randomUUID } from 'crypto';

/**
 * Launch Specialist Tool Definition
 *
 * @type {Object}
 */
export const launchSpecialistTool = {
  name: 'launch_specialist',
  description: 'Launch a specialized agent (backend, frontend, tester, etc.) to execute a task. Returns execution ID for status tracking.',

  inputSchema: {
    type: 'object',
    properties: {
      agent: {
        type: 'string',
        enum: ['orchestrator', 'backend', 'frontend', 'tester', 'reviewer', 'fixer', 'architect'],
        description: 'Specialist agent to launch'
      },
      task: {
        type: 'string',
        description: 'Task description for the agent (10-10000 characters)',
        minLength: 10,
        maxLength: 10000
      },
      context: {
        type: 'object',
        properties: {
          featureId: {
            type: 'string',
            description: 'Optional feature ID for context'
          },
          domainId: {
            type: 'string',
            description: 'Optional domain ID for context'
          },
          files: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional list of relevant file paths'
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'critical'],
            description: 'Task priority level'
          }
        },
        description: 'Optional context information for execution'
      },
      async: {
        type: 'boolean',
        description: 'If true, return immediately with execution ID (background mode). If false, wait for completion.',
        default: true
      },
      timeout: {
        type: 'number',
        description: 'Execution timeout in milliseconds (default: 600000 = 10 minutes)',
        minimum: 1000,
        maximum: 3600000,
        default: 600000
      }
    },
    required: ['agent', 'task']
  },

  /**
   * Handler function for launching specialist agents
   *
   * @param {Object} input - Tool input parameters
   * @param {string} input.agent - Agent name
   * @param {string} input.task - Task description
   * @param {Object} [input.context] - Optional execution context
   * @param {boolean} [input.async=true] - Async execution mode
   * @param {number} [input.timeout=600000] - Execution timeout
   * @param {Object} adapters - MCP adapters for execution
   * @param {Object} adapters.execution - Execution adapter
   * @param {Object} adapters.state - State adapter
   * @returns {Promise<Object>} MCP response with execution details
   */
  async handler(input, adapters) {
    const { agent, task, context = {}, async = true, timeout = 600000 } = input;

    // Validate agent name against allowed list
    const allowedAgents = ['orchestrator', 'backend', 'frontend', 'tester', 'reviewer', 'fixer', 'architect'];
    if (!allowedAgents.includes(agent)) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Invalid agent name',
            message: `Agent "${agent}" is not recognized. Allowed agents: ${allowedAgents.join(', ')}`,
            allowedAgents
          }, null, 2)
        }],
        isError: true
      };
    }

    // Validate task length
    if (task.length < 10) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Invalid task',
            message: 'Task description must be at least 10 characters long'
          }, null, 2)
        }],
        isError: true
      };
    }

    if (task.length > 10000) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Invalid task',
            message: 'Task description must not exceed 10000 characters'
          }, null, 2)
        }],
        isError: true
      };
    }

    // Validate timeout bounds
    if (timeout < 1000 || timeout > 3600000) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Invalid timeout',
            message: 'Timeout must be between 1000ms (1 second) and 3600000ms (1 hour)'
          }, null, 2)
        }],
        isError: true
      };
    }

    try {
      // Execute agent using execution adapter
      const result = await adapters.execution.executeAgent(agent, task, {
        context,
        async,
        timeout
      });

      // Return success response
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            executionId: result.executionId || result.id,
            status: result.status || result.state || 'started',
            agent,
            task: task.substring(0, 100) + (task.length > 100 ? '...' : ''),
            mode: async ? 'background' : 'synchronous',
            timestamp: new Date().toISOString(),
            statusUrl: `/status/${result.executionId || result.id}`,
            message: async
              ? 'Agent execution started in background. Use get_status tool to check progress.'
              : 'Agent execution completed.'
          }, null, 2)
        }]
      };

    } catch (error) {
      // Handle execution errors
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Execution failed',
            message: error.message,
            agent,
            timestamp: new Date().toISOString(),
            suggestion: 'Check that the agent exists and the execution adapter is properly configured.'
          }, null, 2)
        }],
        isError: true
      };
    }
  }
};

export default launchSpecialistTool;
