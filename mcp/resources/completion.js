/**
 * Completion Resource
 * Provides read-only access to feature completion tracking
 * URI: agentful://completion
 */

/**
 * Feature completion tracking resource
 * Exposes progress tracking for domains, features, subtasks, and validation gates
 */
export const completionResource = {
  uri: 'agentful://completion',
  name: 'Feature Completion Tracking',
  description: 'Track completion progress for domains, features, subtasks, and validation gates',
  mimeType: 'application/json',

  /**
   * Read completion status
   * @param {Object} adapters - Data adapters
   * @returns {Promise<Object>} MCP resource response
   */
  async read(adapters) {
    try {
      const completion = await adapters.completion.readCompletion();

      if (completion.error) {
        return {
          contents: [{
            uri: 'agentful://completion',
            mimeType: 'application/json',
            text: JSON.stringify({
              error: completion.error,
              overallProgress: 0,
              hint: 'Run /agentful-start to begin tracking progress'
            }, null, 2)
          }]
        };
      }

      // Calculate summary statistics
      const domainCount = Object.keys(completion.domains || {}).length;
      const featureCount = Object.keys(completion.features || {}).length;
      const subtaskCount = Object.keys(completion.subtasks || {}).length;

      // Count completed items
      const completedDomains = Object.values(completion.domains || {})
        .filter(d => d.completed).length;
      const completedFeatures = Object.values(completion.features || {})
        .filter(f => f.completed).length;
      const completedSubtasks = Object.values(completion.subtasks || {})
        .filter(s => s.completed).length;

      // Count passing validation gates
      const validationGates = completion.validationGates || {};
      const totalGates = Object.keys(validationGates).length;
      const passingGates = Object.values(validationGates)
        .filter(Boolean).length;

      const enriched = {
        ...completion,
        summary: {
          domains: {
            total: domainCount,
            completed: completedDomains,
            progress: domainCount > 0 ? Math.round((completedDomains / domainCount) * 100) : 0
          },
          features: {
            total: featureCount,
            completed: completedFeatures,
            progress: featureCount > 0 ? Math.round((completedFeatures / featureCount) * 100) : 0
          },
          subtasks: {
            total: subtaskCount,
            completed: completedSubtasks,
            progress: subtaskCount > 0 ? Math.round((completedSubtasks / subtaskCount) * 100) : 0
          },
          validationGates: {
            total: totalGates,
            passing: passingGates,
            progress: totalGates > 0 ? Math.round((passingGates / totalGates) * 100) : 0
          }
        },
        readAt: new Date().toISOString()
      };

      return {
        contents: [{
          uri: 'agentful://completion',
          mimeType: 'application/json',
          text: JSON.stringify(enriched, null, 2)
        }]
      };
    } catch (error) {
      return {
        contents: [{
          uri: 'agentful://completion',
          mimeType: 'application/json',
          text: JSON.stringify({
            error: 'Failed to read completion status',
            message: error.message,
            overallProgress: 0,
            hint: 'Verify .agentful/completion.json exists and is valid JSON'
          }, null, 2)
        }]
      };
    }
  }
};
