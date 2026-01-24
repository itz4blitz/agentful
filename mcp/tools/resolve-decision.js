/**
 * MCP Tool: Resolve Decision
 *
 * Resolves a pending decision by providing an answer.
 * Updates .agentful/decisions.json with the resolution.
 *
 * @module mcp/tools/resolve-decision
 */

/**
 * Resolve Decision Tool Definition
 *
 * @type {Object}
 */
export const resolveDecisionTool = {
  name: 'resolve_decision',
  description: 'Resolve a pending decision by providing an answer. The decision is marked as answered and blocked agents can proceed.',

  inputSchema: {
    type: 'object',
    properties: {
      decisionId: {
        type: 'string',
        description: 'The ID of the decision to resolve',
        minLength: 1,
        maxLength: 100
      },
      answer: {
        type: 'string',
        description: 'The answer/resolution for the decision',
        minLength: 1,
        maxLength: 10000
      },
      metadata: {
        type: 'object',
        description: 'Optional metadata about the resolution',
        properties: {
          resolvedBy: {
            type: 'string',
            description: 'Who resolved the decision (user, agent name, etc.)'
          },
          reasoning: {
            type: 'string',
            description: 'Optional reasoning for the decision'
          },
          alternatives: {
            type: 'array',
            items: { type: 'string' },
            description: 'Alternative options that were considered'
          }
        }
      }
    },
    required: ['decisionId', 'answer']
  },

  /**
   * Handler function for resolving decisions
   *
   * @param {Object} input - Tool input parameters
   * @param {string} input.decisionId - Decision ID to resolve
   * @param {string} input.answer - Answer to the decision
   * @param {Object} [input.metadata] - Optional metadata
   * @param {Object} adapters - MCP adapters
   * @param {Object} adapters.state - State management adapter
   * @returns {Promise<Object>} MCP response with resolution details
   */
  async handler(input, adapters) {
    const { decisionId, answer, metadata = {} } = input;

    // Validate decision ID
    if (!decisionId || decisionId.trim().length === 0) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Invalid decision ID',
            message: 'Decision ID must be a non-empty string'
          }, null, 2)
        }],
        isError: true
      };
    }

    if (decisionId.length > 100) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Invalid decision ID',
            message: 'Decision ID must not exceed 100 characters'
          }, null, 2)
        }],
        isError: true
      };
    }

    // Validate answer
    if (!answer || answer.trim().length === 0) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Invalid answer',
            message: 'Answer must be a non-empty string'
          }, null, 2)
        }],
        isError: true
      };
    }

    if (answer.length > 10000) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Invalid answer',
            message: 'Answer must not exceed 10000 characters'
          }, null, 2)
        }],
        isError: true
      };
    }

    try {
      // Resolve decision using state adapter
      const result = await adapters.state.resolveDecision({
        decisionId,
        answer: answer.trim(),
        metadata: {
          ...metadata,
          resolvedAt: new Date().toISOString()
        }
      });

      // Check if decision was found
      if (!result.found) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: 'Decision not found',
              message: `No pending decision found with ID: ${decisionId}`,
              suggestion: 'Use list_decisions to see all pending decisions, or check that the decision ID is correct.',
              decisionId
            }, null, 2)
          }],
          isError: true
        };
      }

      // Check if decision was already resolved
      if (result.alreadyResolved) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: 'Decision already resolved',
              message: `Decision "${decisionId}" was already answered`,
              decisionId,
              previousAnswer: result.previousAnswer,
              resolvedAt: result.resolvedAt,
              suggestion: 'If you need to update the answer, cancel the decision first and create a new one.'
            }, null, 2)
          }],
          isError: true
        };
      }

      // Build success response
      const response = {
        success: true,
        decisionId,
        question: result.question,
        answer: answer.trim(),
        status: 'answered',
        resolvedAt: new Date().toISOString(),
        blockedAgents: result.blockedAgents || [],
        message: `Decision "${decisionId}" has been resolved. ${result.blockedAgents && result.blockedAgents.length > 0 ? `${result.blockedAgents.length} blocked agent(s) can now proceed.` : ''}`
      };

      // Include context if available
      if (result.context) {
        response.context = result.context;
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(response, null, 2)
        }]
      };

    } catch (error) {
      // Handle state management errors
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Decision resolution failed',
            message: error.message,
            decisionId,
            suggestion: error.code === 'ENOENT'
              ? 'Decisions file does not exist. No decisions have been created yet.'
              : error.code === 'EACCES'
                ? 'Permission denied. Check file permissions for .agentful/decisions.json'
                : 'Check that the state adapter is properly configured and has write permissions.'
          }, null, 2)
        }],
        isError: true
      };
    }
  }
};

export default resolveDecisionTool;
