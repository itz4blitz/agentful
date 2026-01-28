/**
 * AI Provider Abstraction Layer
 *
 * A unified interface for working with multiple AI providers
 *
 * @example
 * ```ts
 * import { createProvider } from '@agentful/ai-providers';
 *
 * // Register your providers (implementation-specific)
 * import { ClaudeProvider } from '@agentful/ai-providers/claude';
 * import { OpenAIProvider } from '@agentful/ai-providers/openai';
 *
 * AIProviderFactory.register('claude', (config) => new ClaudeProvider(config));
 * AIProviderFactory.register('openai', (config) => new OpenAIProvider(config));
 *
 * // Create and use a provider
 * const provider = createProvider('claude', {
 *   apiKey: process.env.ANTHROPIC_API_KEY!,
 *   model: 'claude-3-5-sonnet-20241022'
 * });
 *
 * const response = await provider.chat([
 *   { role: 'user', content: 'Hello, Claude!' }
 * ]);
 *
 * console.log(response.content);
 * ```
 */

// Core types
export type {
  Role,
  Message,
  ToolCall,
  ProviderConfig,
  ChatOptions,
  ChatResponse,
  ChatStreamChunk,
  TokenCount,
  AIProvider,
} from './types.js';

// Factory
export {
  AIProviderFactory,
  createProvider,
  getAvailableProviders,
} from './factory.js';

export type { ProviderType } from './factory.js';
