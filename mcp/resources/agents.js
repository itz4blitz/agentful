/**
 * Agents Resource
 * Provides read-only access to available agents
 * URI: agentful://agents/list
 */

/**
 * Available agents resource
 * Exposes list of available agents and their definitions
 */
export const agentsResource = {
  uri: 'agentful://agents/list',
  name: 'Available Agents',
  description: 'List of available agents with their capabilities',
  mimeType: 'application/json',

  /**
   * Read available agents
   * @param {Object} adapters - Data adapters
   * @returns {Promise<Object>} MCP resource response
   */
  async read(adapters) {
    try {
      const agentsList = await adapters.agents.listAgents();

      if (agentsList.error) {
        return {
          contents: [{
            uri: 'agentful://agents/list',
            mimeType: 'application/json',
            text: JSON.stringify({
              error: agentsList.error,
              agents: [],
              count: 0,
              hint: 'Run: npx @itz4blitz/agentful init'
            }, null, 2)
          }]
        };
      }

      // Categorize agents by type
      const coreAgents = [
        'orchestrator',
        'backend',
        'frontend',
        'tester',
        'reviewer',
        'fixer',
        'architect',
        'product-analyzer'
      ];

      const categorized = {
        core: [],
        domain: [],
        custom: []
      };

      for (const agent of agentsList.agents) {
        if (coreAgents.includes(agent)) {
          categorized.core.push(agent);
        } else if (agent.includes('-')) {
          // Domain agents typically have hyphens (e.g., auth-backend, billing-api)
          categorized.domain.push(agent);
        } else {
          categorized.custom.push(agent);
        }
      }

      // Get architecture to identify generated agents
      let generatedAgents = [];
      try {
        const arch = await adapters.architecture.readArchitecture();
        generatedAgents = arch.generatedAgents || [];
      } catch {
        // Architecture not available, skip
      }

      const enriched = {
        agents: agentsList.agents.map(name => ({
          name,
          type: categorized.core.includes(name) ? 'core'
            : categorized.domain.includes(name) ? 'domain'
              : 'custom',
          generated: generatedAgents.includes(name)
        })),
        categorized,
        summary: {
          total: agentsList.count,
          core: categorized.core.length,
          domain: categorized.domain.length,
          custom: categorized.custom.length,
          generated: generatedAgents.length
        },
        readAt: new Date().toISOString()
      };

      return {
        contents: [{
          uri: 'agentful://agents/list',
          mimeType: 'application/json',
          text: JSON.stringify(enriched, null, 2)
        }]
      };
    } catch (error) {
      return {
        contents: [{
          uri: 'agentful://agents/list',
          mimeType: 'application/json',
          text: JSON.stringify({
            error: 'Failed to read agents',
            message: error.message,
            agents: [],
            count: 0,
            hint: 'Verify .claude/agents/ directory exists'
          }, null, 2)
        }]
      };
    }
  }
};

/**
 * Single agent resource (template support)
 * URI: agentful://agents/{name}
 */
export const agentResource = {
  uri: 'agentful://agents/{name}',
  name: 'Agent Definition',
  description: 'Get a specific agent\'s definition and capabilities',
  mimeType: 'text/markdown',

  /**
   * Read a specific agent
   * @param {Object} adapters - Data adapters
   * @param {Object} params - URI parameters
   * @returns {Promise<Object>} MCP resource response
   */
  async read(adapters, params) {
    const agentName = params.name;

    if (!agentName) {
      return {
        contents: [{
          uri: 'agentful://agents/{name}',
          mimeType: 'application/json',
          text: JSON.stringify({
            error: 'Agent name is required',
            hint: 'Use URI pattern: agentful://agents/{name}'
          }, null, 2)
        }]
      };
    }

    try {
      const agent = await adapters.agents.getAgent(agentName);

      if (agent.error) {
        return {
          contents: [{
            uri: `agentful://agents/${agentName}`,
            mimeType: 'application/json',
            text: JSON.stringify({
              error: agent.error,
              hint: `Available agents: Run agentful status to list agents`
            }, null, 2)
          }]
        };
      }

      return {
        contents: [{
          uri: `agentful://agents/${agentName}`,
          mimeType: 'text/markdown',
          text: agent.content,
          metadata: {
            name: agent.name,
            path: agent.path
          }
        }]
      };
    } catch (error) {
      return {
        contents: [{
          uri: `agentful://agents/${agentName}`,
          mimeType: 'application/json',
          text: JSON.stringify({
            error: 'Failed to read agent',
            message: error.message,
            hint: 'Verify agent exists in .claude/agents/'
          }, null, 2)
        }]
      };
    }
  }
};
