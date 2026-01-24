/**
 * MCP Tool: Update Progress
 *
 * Updates the completion progress for a feature, agent, or skill.
 * Writes to .agentful/completion.json with atomic operations.
 *
 * @module mcp/tools/update-progress
 */

/**
 * Update Progress Tool Definition
 *
 * @type {Object}
 */
export const updateProgressTool = {
  name: 'update_progress',
  description: 'Update the completion progress for a feature, agent, or skill. Progress is persisted to .agentful/completion.json.',

  inputSchema: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: ['feature', 'agent', 'skill'],
        description: 'Type of item to update progress for'
      },
      id: {
        type: 'string',
        description: 'Identifier for the feature, agent, or skill',
        minLength: 1,
        maxLength: 200
      },
      progress: {
        type: 'number',
        description: 'Progress percentage (0-100)',
        minimum: 0,
        maximum: 100
      },
      completed: {
        type: 'boolean',
        description: 'Whether the item is fully completed (automatically set to true if progress >= 100)'
      },
      metadata: {
        type: 'object',
        description: 'Optional metadata to attach (e.g., lastUpdatedBy, notes)',
        additionalProperties: true
      }
    },
    required: ['type', 'id', 'progress']
  },

  /**
   * Handler function for updating progress
   *
   * @param {Object} input - Tool input parameters
   * @param {string} input.type - Type of item (feature, agent, skill)
   * @param {string} input.id - Item identifier
   * @param {number} input.progress - Progress percentage
   * @param {boolean} [input.completed] - Completion status
   * @param {Object} [input.metadata] - Optional metadata
   * @param {Object} adapters - MCP adapters
   * @param {Object} adapters.state - State management adapter
   * @returns {Promise<Object>} MCP response with updated progress
   */
  async handler(input, adapters) {
    const { type, id, progress, completed, metadata = {} } = input;

    // Validate type
    const allowedTypes = ['feature', 'agent', 'skill'];
    if (!allowedTypes.includes(type)) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Invalid type',
            message: `Type must be one of: ${allowedTypes.join(', ')}`,
            received: type
          }, null, 2)
        }],
        isError: true
      };
    }

    // Validate ID
    if (!id || id.trim().length === 0) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Invalid ID',
            message: 'ID must be a non-empty string'
          }, null, 2)
        }],
        isError: true
      };
    }

    if (id.length > 200) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Invalid ID',
            message: 'ID must not exceed 200 characters'
          }, null, 2)
        }],
        isError: true
      };
    }

    // Validate progress range
    if (progress < 0 || progress > 100) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Invalid progress',
            message: 'Progress must be between 0 and 100',
            received: progress
          }, null, 2)
        }],
        isError: true
      };
    }

    try {
      // Determine completion status
      const isCompleted = completed !== undefined ? completed : progress >= 100;

      // Update progress using state adapter
      const result = await adapters.state.updateProgress({
        type,
        id,
        progress: Math.round(progress * 10) / 10, // Round to 1 decimal place
        completed: isCompleted,
        metadata: {
          ...metadata,
          lastUpdated: new Date().toISOString()
        }
      });

      // Return success response
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            type,
            id,
            progress: Math.round(progress * 10) / 10,
            completed: isCompleted,
            previousProgress: result.previousProgress || 0,
            progressDelta: Math.round((progress - (result.previousProgress || 0)) * 10) / 10,
            timestamp: new Date().toISOString(),
            message: isCompleted
              ? `${type} "${id}" marked as completed (100%)`
              : `${type} "${id}" progress updated to ${Math.round(progress)}%`
          }, null, 2)
        }]
      };

    } catch (error) {
      // Handle state management errors
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Progress update failed',
            message: error.message,
            type,
            id,
            suggestion: error.code === 'ENOENT'
              ? 'Completion file does not exist. It will be created automatically on first update.'
              : 'Check that the state adapter is properly configured and has write permissions.'
          }, null, 2)
        }],
        isError: true
      };
    }
  }
};

export default updateProgressTool;
