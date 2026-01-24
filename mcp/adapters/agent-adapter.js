/**
 * MCP Agent Adapter
 *
 * Bridges MCP server to agentful's agent definitions (.claude/agents/*.md).
 * Reuses existing agent loading logic from lib/ci/claude-action-integration.js.
 *
 * @module mcp/adapters/agent-adapter
 */

import {
  loadAgentDefinition,
  listAvailableAgents,
  CIError,
  CI_ERROR_CODES,
} from '../../lib/ci/claude-action-integration.js';
import path from 'path';
import { readdir } from 'fs/promises';

/**
 * Agent Adapter
 *
 * Provides MCP-compatible interface to agentful's agent system.
 * All methods reuse existing agent loading logic.
 */
export class AgentAdapter {
  /**
   * Create agent adapter
   *
   * @param {Object} config - Adapter configuration
   * @param {string} [config.agentsDir='.claude/agents'] - Agents directory
   * @param {string} [config.projectRoot=process.cwd()] - Project root directory
   */
  constructor(config = {}) {
    this.config = {
      agentsDir: config.agentsDir || '.claude/agents',
      projectRoot: config.projectRoot || process.cwd(),
      ...config,
    };

    // Resolve absolute paths
    this.agentsDir = path.isAbsolute(this.config.agentsDir)
      ? this.config.agentsDir
      : path.join(this.config.projectRoot, this.config.agentsDir);
  }

  /**
   * List all available agents
   *
   * @returns {Promise<string[]>} Array of agent names
   */
  async listAgents() {
    try {
      return await listAvailableAgents(this.config.projectRoot);
    } catch (error) {
      throw new Error(`Failed to list agents: ${error.message}`);
    }
  }

  /**
   * Get agent definition with metadata and instructions
   *
   * @param {string} agentName - Agent name (without .md extension)
   * @returns {Promise<Object>} Agent definition
   *
   * Returns:
   * {
   *   name: string,
   *   path: string,
   *   metadata: {
   *     name: string,
   *     description: string,
   *     model: string,
   *     tools: string[]
   *   },
   *   instructions: string
   * }
   *
   * @throws {Error} If agent not found or invalid
   */
  async getAgentDefinition(agentName) {
    try {
      const agent = await loadAgentDefinition(agentName, this.config.projectRoot);
      return agent;
    } catch (error) {
      if (error instanceof CIError) {
        // Convert CIError to standard Error with helpful message
        if (error.code === CI_ERROR_CODES.AGENT_NOT_FOUND) {
          const availableAgents = await this.listAgents();
          throw new Error(
            `Agent "${agentName}" not found.\n` +
            `Available agents: ${availableAgents.join(', ') || 'none'}`
          );
        }

        if (error.code === CI_ERROR_CODES.INVALID_AGENT_FILE) {
          throw new Error(
            `Agent "${agentName}" has invalid format: ${error.message}\n` +
            `Agent files must be markdown with YAML frontmatter.`
          );
        }
      }

      throw new Error(`Failed to load agent "${agentName}": ${error.message}`);
    }
  }

  /**
   * Get metadata for multiple agents
   *
   * @param {string[]} [agentNames] - Agent names (if omitted, returns all)
   * @returns {Promise<Object[]>} Array of agent metadata
   *
   * Returns array of:
   * {
   *   name: string,
   *   description: string,
   *   model: string,
   *   tools: string[],
   *   path: string
   * }
   */
  async getAgentsMetadata(agentNames = null) {
    // If no names provided, get all agents
    const names = agentNames || (await this.listAgents());

    const metadata = [];

    for (const name of names) {
      try {
        const agent = await this.getAgentDefinition(name);
        metadata.push({
          name: agent.name,
          description: agent.metadata.description,
          model: agent.metadata.model,
          tools: agent.metadata.tools || [],
          path: agent.path,
        });
      } catch (error) {
        // Skip agents that fail to load
        console.warn(`Failed to load agent ${name}:`, error.message);
      }
    }

    return metadata;
  }

  /**
   * Check if an agent exists
   *
   * @param {string} agentName - Agent name
   * @returns {Promise<boolean>} True if agent exists
   */
  async agentExists(agentName) {
    try {
      await this.getAgentDefinition(agentName);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get agents by capability/tool
   *
   * @param {string} tool - Tool name (e.g., 'Write', 'Bash', 'Grep')
   * @returns {Promise<string[]>} Array of agent names that have this tool
   */
  async getAgentsByTool(tool) {
    const allAgents = await this.listAgents();
    const agentsWithTool = [];

    for (const agentName of allAgents) {
      try {
        const agent = await this.getAgentDefinition(agentName);
        const tools = agent.metadata.tools || [];

        // Tools can be string or array
        const toolsList = Array.isArray(tools) ? tools : tools.split(',').map((t) => t.trim());

        if (toolsList.includes(tool)) {
          agentsWithTool.push(agentName);
        }
      } catch (error) {
        // Skip agents that fail to load
        continue;
      }
    }

    return agentsWithTool;
  }

  /**
   * Search agents by description keyword
   *
   * @param {string} keyword - Search keyword
   * @returns {Promise<Object[]>} Array of matching agents with metadata
   */
  async searchAgents(keyword) {
    const allAgents = await this.listAgents();
    const matches = [];

    const searchTerm = keyword.toLowerCase();

    for (const agentName of allAgents) {
      try {
        const agent = await this.getAgentDefinition(agentName);

        // Search in name, description, and instructions
        const searchable = [
          agent.name,
          agent.metadata.description || '',
          agent.instructions,
        ].join(' ').toLowerCase();

        if (searchable.includes(searchTerm)) {
          matches.push({
            name: agent.name,
            description: agent.metadata.description,
            model: agent.metadata.model,
            path: agent.path,
          });
        }
      } catch (error) {
        // Skip agents that fail to load
        continue;
      }
    }

    return matches;
  }

  /**
   * Get agent instructions only (without metadata)
   *
   * @param {string} agentName - Agent name
   * @returns {Promise<string>} Agent instructions markdown
   */
  async getAgentInstructions(agentName) {
    const agent = await this.getAgentDefinition(agentName);
    return agent.instructions;
  }

  /**
   * Validate agent definition format
   *
   * @param {string} agentName - Agent name
   * @returns {Promise<Object>} Validation result
   *
   * Returns:
   * {
   *   valid: boolean,
   *   errors: string[] (if invalid),
   *   warnings: string[]
   * }
   */
  async validateAgent(agentName) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
    };

    try {
      const agent = await this.getAgentDefinition(agentName);

      // Check required metadata fields
      const requiredFields = ['name', 'description'];
      for (const field of requiredFields) {
        if (!agent.metadata[field]) {
          result.errors.push(`Missing required metadata field: ${field}`);
          result.valid = false;
        }
      }

      // Check recommended fields
      const recommendedFields = ['model', 'tools'];
      for (const field of recommendedFields) {
        if (!agent.metadata[field]) {
          result.warnings.push(`Missing recommended metadata field: ${field}`);
        }
      }

      // Check instructions length
      if (!agent.instructions || agent.instructions.trim().length === 0) {
        result.errors.push('Agent instructions are empty');
        result.valid = false;
      } else if (agent.instructions.length < 100) {
        result.warnings.push('Agent instructions are very short (< 100 chars)');
      }

      // Check model value
      const validModels = ['sonnet', 'opus', 'haiku', 'claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku', 'claude-sonnet-4'];
      if (agent.metadata.model && !validModels.includes(agent.metadata.model)) {
        result.warnings.push(
          `Unknown model: ${agent.metadata.model}. Valid models: ${validModels.join(', ')}`
        );
      }

    } catch (error) {
      result.valid = false;
      result.errors.push(error.message);
    }

    return result;
  }
}

/**
 * Create agent adapter instance
 *
 * @param {Object} config - Adapter configuration
 * @returns {AgentAdapter} Adapter instance
 */
export function createAgentAdapter(config = {}) {
  return new AgentAdapter(config);
}

export default AgentAdapter;
