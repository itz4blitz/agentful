/**
 * OpenAI Provider Implementation
 * Implements AIProvider interface using OpenAI's API
 */

import type {
  AIProvider,
  Message,
  ChatOptions,
  ChatResponse,
  ChatStreamChunk,
  TokenCount,
  ProviderConfig,
} from '../types.js';

export class OpenAIProvider implements AIProvider {
  readonly type = 'openai';
  private client: any;
  private model: string;

  constructor(config: ProviderConfig) {
    this.model = config.model || 'gpt-4';

    // Dynamic import to avoid requiring openai as a hard dependency
    const OpenAI = require('openai');

    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      timeout: config.timeout || 60000,
    });
  }

  /**
   * Send a chat request and get a complete response
   */
  async chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens,
        stop: options?.stopSequences,
        tools: options?.tools?.map(t => ({
          type: 'function',
          function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          },
        })),
      });

      const choice = response.choices[0];
      const message = choice.message;

      return {
        content: message.content || '',
        toolCalls: message.tool_calls?.map(tc => ({
          id: tc.id,
          name: tc.function.name,
          arguments: JSON.parse(tc.function.arguments),
        })),
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
        model: response.model,
        finishReason: choice.finish_reason as any,
      };
    } catch (error: any) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  /**
   * Send a chat request and stream the response
   */
  async *streamChat(
    messages: Message[],
    options?: ChatOptions
  ): AsyncGenerator<ChatStreamChunk> {
    try {
      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens,
        stop: options?.stopSequences,
        tools: options?.tools?.map(t => ({
          type: 'function',
          function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          },
        })),
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        const finishReason = chunk.choices[0]?.finish_reason;

        yield {
          content: delta?.content || '',
          toolCalls: delta?.tool_calls?.map(tc => ({
            id: tc.id || '',
            name: tc.function?.name || '',
            arguments: tc.function?.arguments
              ? JSON.parse(tc.function.arguments)
              : {},
          })),
          done: finishReason !== null,
          usage: finishReason
            ? {
                promptTokens: chunk.usage?.prompt_tokens || 0,
                completionTokens: chunk.usage?.completion_tokens || 0,
                totalTokens: chunk.usage?.total_tokens || 0,
              }
            : undefined,
        };
      }
    } catch (error: any) {
      throw new Error(`OpenAI streaming error: ${error.message}`);
    }
  }

  /**
   * Count tokens in a text for this provider
   * Note: This is an approximation. For accurate counts, use tiktoken
   */
  async countTokens(text: string): Promise<TokenCount> {
    // Simple approximation: ~4 characters per token for English text
    // For production use, integrate tiktoken or similar tokenizer
    const approximateCount = Math.ceil(text.length / 4);

    return {
      count: approximateCount,
      model: this.model,
    };
  }

  /**
   * Validate that the provider is properly configured
   */
  async validate(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch {
      return false;
    }
  }
}
