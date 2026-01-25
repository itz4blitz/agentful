/**
 * agentful - Autonomous product development framework
 *
 * Coordinates specialized AI agents for product development with human-in-the-loop checkpoints.
 * Includes centralized state validation, intelligent context awareness, and quality gates.
 *
 * @module agentful
 * @version 1.3.0
 */

export { initProject, copyDirectory, isInitialized, getState } from './init.js';

// Export pipeline orchestration system
export * from './pipeline/index.js';

// Export Claude Code executor abstraction
export {
  ClaudeExecutor,
  ExecutionMode,
  ExecutionState,
  createClaudeExecutor,
  createExecutor,
  executeAgent
} from './core/claude-executor.js';

// Export CI integration for claude-code-action
export * from './ci/index.js';

// Export remote execution server
export * from './server/index.js';
export * from './server/auth.js';
export * from './server/executor.js';

// Export state validation utilities
export {
  STATE_SCHEMAS,
  validateStateFile,
  recoverStateFile,
  validateAllState,
  getDefaultState,
  isStateFileValid,
  getStateFile,
  updateStateFile,
  formatValidationResults
} from './state-validator.js';
