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

// Export codebase analyzer
export * from './core/analyzer.js';
export * from './core/detectors/index.js';
