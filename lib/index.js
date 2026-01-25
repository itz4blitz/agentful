/**
 * agentful - Lightweight project initialization
 *
 * The heavy analysis is done by Claude via /agentful-agents and /agentful-skills commands.
 * This module just handles template copying and state management.
 *
 * @module agentful
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
