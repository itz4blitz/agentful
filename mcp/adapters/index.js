/**
 * MCP Adapters Index
 *
 * Central export point for all MCP adapters.
 * Provides thin wrappers that bridge MCP server to agentful's existing infrastructure.
 *
 * @module mcp/adapters
 */

export {
  ExecutionAdapter,
  createExecutionAdapter,
} from './execution-adapter.js';

export {
  StateAdapter,
  createStateAdapter,
} from './state-adapter.js';

export {
  AgentAdapter,
  createAgentAdapter,
} from './agent-adapter.js';

export {
  ValidationAdapter,
  createValidationAdapter,
  ValidationGates,
} from './validation-adapter.js';

/**
 * Create all adapters with shared configuration
 *
 * @param {Object} config - Shared adapter configuration
 * @param {string} [config.projectRoot=process.cwd()] - Project root directory
 * @param {string} [config.agentsDir='.claude/agents'] - Agents directory
 * @param {string} [config.stateDir='.agentful'] - State files directory
 * @param {string} [config.tempDir='.agentful/temp'] - Temporary files directory
 * @returns {Object} All adapters
 */
export function createAdapters(config = {}) {
  const projectRoot = config.projectRoot || process.cwd();

  return {
    execution: createExecutionAdapter({
      ...config,
      projectRoot,
    }),
    state: createStateAdapter({
      ...config,
      projectRoot,
    }),
    agent: createAgentAdapter({
      ...config,
      projectRoot,
    }),
    validation: createValidationAdapter({
      ...config,
      projectRoot,
    }),
  };
}

export default {
  createAdapters,
  createExecutionAdapter,
  createStateAdapter,
  createAgentAdapter,
  createValidationAdapter,
};
