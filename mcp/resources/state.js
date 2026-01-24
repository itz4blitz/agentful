/**
 * State Resource
 * Provides read-only access to current agentful state
 * URI: agentful://state/current
 */

/**
 * Current execution state resource
 * Exposes real-time agentful orchestration state
 */
export const stateResource = {
  uri: 'agentful://state/current',
  name: 'Current Execution State',
  description: 'Real-time agentful orchestration state including initialized agents and skills',
  mimeType: 'application/json',

  /**
   * Read current state
   * @param {Object} adapters - Data adapters
   * @returns {Promise<Object>} MCP resource response
   */
  async read(adapters) {
    try {
      const state = await adapters.state.readState();

      if (state.error) {
        return {
          contents: [{
            uri: 'agentful://state/current',
            mimeType: 'application/json',
            text: JSON.stringify({
              error: state.error,
              initialized: false,
              hint: 'Run: npx @itz4blitz/agentful init'
            }, null, 2)
          }]
        };
      }

      // Enrich state with computed fields
      const enriched = {
        ...state,
        status: state.initialized ? 'initialized' : 'not-initialized',
        agentCount: state.agents?.length || 0,
        skillCount: state.skills?.length || 0,
        readAt: new Date().toISOString()
      };

      return {
        contents: [{
          uri: 'agentful://state/current',
          mimeType: 'application/json',
          text: JSON.stringify(enriched, null, 2)
        }]
      };
    } catch (error) {
      return {
        contents: [{
          uri: 'agentful://state/current',
          mimeType: 'application/json',
          text: JSON.stringify({
            error: 'Failed to read state',
            message: error.message,
            initialized: false,
            hint: 'Verify .agentful/state.json exists and is valid JSON'
          }, null, 2)
        }]
      };
    }
  }
};
