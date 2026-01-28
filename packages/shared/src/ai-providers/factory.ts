/**
 * AI Provider Factory
 * Creates and manages AI provider instances
 */

import type {
  AIProvider,
  ProviderConfig,
} from './types.js';

/**
 * Supported provider types
 */
export type ProviderType = 'claude' | 'gemini' | 'openai' | 'codex';

/**
 * Provider registry entry
 */
interface ProviderRegistryEntry {
  type: ProviderType;
  create: (config: ProviderConfig) => AIProvider;
  description?: string;
}

/**
 * AI Provider Factory
 *
 * Usage:
 * ```ts
 * import { AIProviderFactory } from './factory.js';
 *
 * const provider = AIProviderFactory.createProvider('claude', {
 *   apiKey: process.env.ANTHROPIC_API_KEY,
 *   model: 'claude-3-5-sonnet-20241022'
 * });
 *
 * const response = await provider.chat([
 *   { role: 'user', content: 'Hello!' }
 * ]);
 * ```
 */
export class AIProviderFactory {
  private static registry: Map<ProviderType, ProviderRegistryEntry> = new Map();

  /**
   * Register a provider implementation
   * @param type - Provider type identifier
   * @param create - Factory function to create provider instance
   * @param description - Optional description of the provider
   */
  static register(
    type: ProviderType,
    create: (config: ProviderConfig) => AIProvider,
    description?: string
  ): void {
    this.registry.set(type, { type, create, description });
  }

  /**
   * Create a provider instance
   * @param type - Provider type to create
   * @param config - Provider configuration
   * @returns AIProvider instance
   * @throws Error if provider type is not registered
   */
  static createProvider(type: ProviderType, config: ProviderConfig): AIProvider {
    const entry = this.registry.get(type);

    if (!entry) {
      const available = Array.from(this.registry.keys()).join(', ');
      throw new Error(
        `Unknown provider type: "${type}". Available providers: ${available || 'none'}`
      );
    }

    return entry.create(config);
  }

  /**
   * Get list of available provider types
   * @returns Array of registered provider types
   */
  static getAvailableProviders(): ProviderType[] {
    return Array.from(this.registry.keys());
  }

  /**
   * Check if a provider type is available
   * @param type - Provider type to check
   * @returns true if provider is registered
   */
  static isProviderAvailable(type: ProviderType): boolean {
    return this.registry.has(type);
  }

  /**
   * Get provider information
   * @param type - Provider type
   * @returns Provider info or undefined if not found
   */
  static getProviderInfo(type: ProviderType): ProviderRegistryEntry | undefined {
    return this.registry.get(type);
  }

  /**
   * Unregister a provider (useful for testing)
   * @param type - Provider type to unregister
   */
  static unregister(type: ProviderType): void {
    this.registry.delete(type);
  }

  /**
   * Clear all registered providers (useful for testing)
   */
  static clearRegistry(): void {
    this.registry.clear();
  }
}

/**
 * Convenience function to create a provider
 * @param type - Provider type
 * @param config - Provider configuration
 * @returns AIProvider instance
 */
export function createProvider(type: ProviderType, config: ProviderConfig): AIProvider {
  return AIProviderFactory.createProvider(type, config);
}

/**
 * Convenience function to get available providers
 * @returns Array of provider types
 */
export function getAvailableProviders(): ProviderType[] {
  return AIProviderFactory.getAvailableProviders();
}
