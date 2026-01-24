/**
 * Decisions Resource
 * Provides read-only access to pending decisions
 * URI: agentful://decisions
 */

/**
 * Pending decisions resource
 * Exposes decisions that require human input
 */
export const decisionsResource = {
  uri: 'agentful://decisions',
  name: 'Pending Decisions',
  description: 'Decisions requiring human input to unblock agent work',
  mimeType: 'application/json',

  /**
   * Read pending decisions
   * @param {Object} adapters - Data adapters
   * @returns {Promise<Object>} MCP resource response
   */
  async read(adapters) {
    try {
      const decisions = await adapters.decisions.readDecisions();

      if (decisions.error) {
        return {
          contents: [{
            uri: 'agentful://decisions',
            mimeType: 'application/json',
            text: JSON.stringify({
              error: decisions.error,
              pending: 0,
              decisions: [],
              hint: 'Decisions will appear here when agents need human input'
            }, null, 2)
          }]
        };
      }

      // Categorize decisions by priority
      const decisionList = decisions.decisions || [];
      const categorized = {
        critical: [],
        high: [],
        medium: [],
        low: []
      };

      for (const decision of decisionList) {
        const priority = (decision.priority || 'medium').toLowerCase();
        if (categorized[priority]) {
          categorized[priority].push(decision);
        } else {
          categorized.medium.push(decision);
        }
      }

      // Calculate age for each decision
      const enrichedDecisions = decisionList.map(decision => {
        const createdAt = decision.createdAt ? new Date(decision.createdAt) : null;
        const ageMs = createdAt ? Date.now() - createdAt.getTime() : 0;
        const ageHours = Math.floor(ageMs / (1000 * 60 * 60));

        return {
          ...decision,
          age: {
            hours: ageHours,
            days: Math.floor(ageHours / 24),
            human: ageHours < 24
              ? `${ageHours} hour${ageHours !== 1 ? 's' : ''} ago`
              : `${Math.floor(ageHours / 24)} day${Math.floor(ageHours / 24) !== 1 ? 's' : ''} ago`
          }
        };
      });

      const enriched = {
        decisions: enrichedDecisions,
        categorized,
        summary: {
          total: decisionList.length,
          critical: categorized.critical.length,
          high: categorized.high.length,
          medium: categorized.medium.length,
          low: categorized.low.length,
          oldest: enrichedDecisions.length > 0
            ? enrichedDecisions.reduce((oldest, d) =>
              d.createdAt && (!oldest.createdAt || d.createdAt < oldest.createdAt) ? d : oldest
            , enrichedDecisions[0])
            : null
        },
        lastUpdated: decisions.lastUpdated,
        readAt: new Date().toISOString()
      };

      return {
        contents: [{
          uri: 'agentful://decisions',
          mimeType: 'application/json',
          text: JSON.stringify(enriched, null, 2)
        }]
      };
    } catch (error) {
      return {
        contents: [{
          uri: 'agentful://decisions',
          mimeType: 'application/json',
          text: JSON.stringify({
            error: 'Failed to read decisions',
            message: error.message,
            pending: 0,
            decisions: [],
            hint: 'Verify .agentful/decisions.json exists and is valid JSON'
          }, null, 2)
        }]
      };
    }
  }
};
