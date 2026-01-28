/**
 * Claude AI Provider
 * Implements AIProvider interface for Anthropic's Claude API
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  AIProvider,
  Message,
  ChatResponse,
  ChatStreamChunk,
  ChatOptions,
  TokenCount,
  ProviderConfig,
} from '../types';

export class ClaudeProvider implements AIProvider {
  readonly type = 'claude';
  private client: Anthropic;
  private model: string;

  constructor(config: ProviderConfig) {
    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      timeout: config.timeout || 60000,
      defaultHeaders: config.headers,
    });

    this.model = config.model || 'claude-3-5-sonnet-20241022';
  }

  async chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse> {
    try {
      const systemMessages = messages.filter(m => m.role === 'system');
      const conversationMessages = messages.filter(m => m.role !== 'system');

      const response = await this.client.messages.create({
        model: this.model,
        messages: conversationMessages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        system: systemMessages.map(m => m.content).join('\n\n') || undefined,
        temperature: options?.temperature,
        max_tokens: options?.maxTokens || 4096,
        stop_sequences: options?.stopSequences,
      });

      const content = response.content
        .filter(block => block.type === 'text')
        .map(block => (block.type === 'text' ? block.text : ''))
        .join('');

      return {
        content,
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
        model: response.model,
        finishReason: response.stop_reason === 'end_turn' ? 'stop' : 'length',
      };
    } catch (error) {
      throw new Error(
        `Claude API error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async *streamChat(
    messages: Message[],
    options?: ChatOptions
  ): AsyncGenerator<ChatStreamChunk> {
    try {
      const systemMessages = messages.filter(m => m.role === 'system');
      const conversationMessages = messages.filter(m => m.role !== 'system');

      const stream = await this.client.messages.create({
        model: this.model,
        messages: conversationMessages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        system: systemMessages.map(m => m.content).join('\n\n') || undefined,
        temperature: options?.temperature,
        max_tokens: options?.maxTokens || 4096,
        stop_sequences: options?.stopSequences,
        stream: true,
      });

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta') {
          if (chunk.delta.type === 'text_delta') {
            yield {
              content: chunk.delta.text,
              done: false,
            };
          }
        }

        if (chunk.type === 'message_stop') {
          yield {
            content: '',
            done: true,
          };
        }
      }
    } catch (error) {
      throw new Error(
        `Claude streaming error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async countTokens(text: string): Promise<TokenCount> {
    try {
      const response = await this.client.messages.countTokens({
        model: this.model,
        messages: [{ role: 'user', content: text }],
      });

      return {
        count: response.input_tokens,
        model: this.model,
      };
    } catch (error) {
      // Fallback: estimate tokens (rough approximation: 1 token ≈ 4 characters)
      const estimated = Math.ceil(text.length / 4);
      return {
        count: estimated,
        model: this.model,
      };
    }
  }

  async validate(): Promise<boolean> {
    try {
      await this.client.messages.create({
        model: this.model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }],
      });
      return true;
    } catch {
      return false;
    }
  }
}
