/**
 * Pipeline Orchestration System
 *
 * Entry point for agentful pipeline orchestration
 */

export { PipelineEngine, JobStatus, PipelineStatus } from './engine.js';
export { AgentExecutor, createAgentExecutor } from './executor.js';
export {
  GitHubActionsAdapter,
  GitLabCIAdapter,
  JenkinsAdapter,
  WebhookHandler
} from './integrations.js';
export { pipelineSchema, validatePipeline } from './schemas.js';

// Re-export for convenience
export * from './engine.js';
export * from './executor.js';
export * from './integrations.js';
export * from './schemas.js';

export default {
  PipelineEngine,
  AgentExecutor,
  createAgentExecutor,
  GitHubActionsAdapter,
  GitLabCIAdapter,
  JenkinsAdapter,
  WebhookHandler,
  pipelineSchema,
  validatePipeline
};
