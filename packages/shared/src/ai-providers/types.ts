/**
 * AI Provider Abstraction Layer
 * Core types and interfaces for AI provider implementations
 */

/**
 * Message role in a conversation
 */
export type Role = 'system' | 'user' | 'assistant';

/**
 * A single message in a conversation
 */
export interface Message {
  role: Role;
  content: string;
}

/**
 * Tool/function call from an AI response
 */
export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

/**
 * Configuration options for provider initialization
 */
export interface ProviderConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * Options for chat/stream requests
 */
export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
  tools?: Array<{
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  }>;
  metadata?: Record<string, unknown>;
}

/**
 * Response from a non-streaming chat request
 */
export interface ChatResponse {
  content: string;
  toolCalls?: ToolCall[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason?: 'stop' | 'length' | 'tool_calls' | 'content_filter';
}

/**
 * Chunk from a streaming chat request
 */
export interface ChatStreamChunk {
  content: string;
  toolCalls?: ToolCall[];
  done: boolean;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Token count result
 */
export interface TokenCount {
  count: number;
  model: string;
}

/**
 * Main AI Provider interface
 * All AI providers must implement this interface
 */
export interface AIProvider {
  /**
   * The provider type identifier
   */
  readonly type: string;

  /**
   * Send a chat request and get a complete response
   * @param messages - Array of messages in the conversation
   * @param options - Optional configuration for this request
   * @returns Promise resolving to ChatResponse
   */
  chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse>;

  /**
   * Send a chat request and stream the response
   * @param messages - Array of messages in the conversation
   * @param options - Optional configuration for this request
   * @returns Async generator yielding ChatStreamChunk
   */
  streamChat(
    messages: Message[],
    options?: ChatOptions
  ): AsyncGenerator<ChatStreamChunk>;

  /**
   * Count tokens in a text for this provider
   * @param text - Text to count tokens for
   * @returns Promise resolving to TokenCount
   */
  countTokens(text: string): Promise<TokenCount>;

  /**
   * Validate that the provider is properly configured
   * @returns Promise resolving to true if valid
   */
  validate?(): Promise<boolean>;
}
