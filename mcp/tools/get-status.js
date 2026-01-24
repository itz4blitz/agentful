/**
 * MCP Tool: Get Execution Status
 *
 * Retrieves the current status of an agent execution by execution ID.
 * Provides detailed information including state, output, errors, and timing.
 *
 * @module mcp/tools/get-status
 */

/**
 * Get Status Tool Definition
 *
 * @type {Object}
 */
export const getStatusTool = {
  name: 'get_status',
  description: 'Get the current status and details of an agent execution by execution ID. Returns state, output, errors, and timing information.',

  inputSchema: {
    type: 'object',
    properties: {
      executionId: {
        type: 'string',
        description: 'The execution ID returned from launch_specialist',
        pattern: '^[a-f0-9-]{36}$' // UUID format
      },
      includeOutput: {
        type: 'boolean',
        description: 'Include full output in response (may be large)',
        default: false
      },
      outputLimit: {
        type: 'number',
        description: 'Maximum characters of output to return (default: 1000)',
        minimum: 100,
        maximum: 100000,
        default: 1000
      }
    },
    required: ['executionId']
  },

  /**
   * Handler function for retrieving execution status
   *
   * @param {Object} input - Tool input parameters
   * @param {string} input.executionId - Execution ID to query
   * @param {boolean} [input.includeOutput=false] - Include full output
   * @param {number} [input.outputLimit=1000] - Max output characters
   * @param {Object} adapters - MCP adapters
   * @param {Object} adapters.execution - Execution adapter
   * @returns {Promise<Object>} MCP response with execution status
   */
  async handler(input, adapters) {
    const { executionId, includeOutput = false, outputLimit = 1000 } = input;

    // Validate execution ID format (UUID)
    const uuidRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
    if (!uuidRegex.test(executionId)) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Invalid execution ID',
            message: 'Execution ID must be a valid UUID format (e.g., "550e8400-e29b-41d4-a716-446655440000")',
            received: executionId
          }, null, 2)
        }],
        isError: true
      };
    }

    try {
      // Retrieve execution status from adapter
      const execution = await adapters.execution.getExecutionStatus(executionId);

      // Check if execution exists
      if (!execution) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: 'Execution not found',
              message: `No execution found with ID: ${executionId}`,
              suggestion: 'Check that the execution ID is correct and the execution has not been cleaned up.',
              executionId
            }, null, 2)
          }],
          isError: true
        };
      }

      // Calculate duration
      const duration = execution.endTime
        ? execution.endTime - execution.startTime
        : Date.now() - execution.startTime;

      // Build response object
      const response = {
        success: true,
        executionId: execution.id,
        agent: execution.agent,
        state: execution.state,
        startTime: execution.startTime,
        startTimeIso: new Date(execution.startTime).toISOString(),
        endTime: execution.endTime,
        endTimeIso: execution.endTime ? new Date(execution.endTime).toISOString() : null,
        duration,
        durationSeconds: Math.round(duration / 1000),
        exitCode: execution.exitCode,
        error: execution.error || null,
        metadata: execution.metadata || {},
        isRunning: execution.state === 'running' || execution.state === 'pending',
        isComplete: execution.state === 'completed' || execution.state === 'failed'
      };

      // Include output if requested
      if (includeOutput && execution.output) {
        const output = execution.output;
        response.output = {
          full: output,
          truncated: false,
          length: output.length
        };

        // Apply output limit if output exceeds limit
        if (output.length > outputLimit) {
          response.output.full = output.substring(0, outputLimit) + '\n\n[... truncated ...]';
          response.output.truncated = true;
          response.output.displayedLength = outputLimit;
        }
      } else if (execution.output) {
        // Provide output summary without full content
        response.outputAvailable = true;
        response.outputLength = execution.output.length;
        response.outputPreview = execution.output.substring(0, 200) + (execution.output.length > 200 ? '...' : '');
      }

      // Add helpful status messages
      if (execution.state === 'pending') {
        response.message = 'Execution is queued and waiting to start';
      } else if (execution.state === 'running') {
        response.message = `Execution is in progress (running for ${response.durationSeconds}s)`;
      } else if (execution.state === 'completed') {
        response.message = `Execution completed successfully in ${response.durationSeconds}s`;
      } else if (execution.state === 'failed') {
        response.message = `Execution failed after ${response.durationSeconds}s`;
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(response, null, 2)
        }]
      };

    } catch (error) {
      // Handle adapter errors
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Status retrieval failed',
            message: error.message,
            executionId,
            suggestion: 'Check that the execution adapter is properly configured and accessible.'
          }, null, 2)
        }],
        isError: true
      };
    }
  }
};

export default getStatusTool;
