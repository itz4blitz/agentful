/**
 * Gemini AI Provider
 * Implements AIProvider interface for Google's Gemini API
 */

import { VertexAI } from '@google-cloud/vertexai';
import type {
  AIProvider,
  Message,
  ChatResponse,
  ChatStreamChunk,
  ChatOptions,
  TokenCount,
  ProviderConfig,
} from '../types';

export class GeminiProvider implements AIProvider {
  readonly type = 'gemini';
  private client: VertexAI;
  private model: string;

  constructor(config: ProviderConfig) {
    this.client = new VertexAI({
      project: config.baseURL || '', // Using baseURL as project placeholder
      location: 'us-central1',
    });

    this.model = config.model || 'gemini-1.5-pro';
  }

  async chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse> {
    try {
      const generativeModel = this.client.getGenerativeModel({
        model: this.model,
      });

      // Convert messages to Gemini format
      const systemInstruction = messages
        .filter(m => m.role === 'system')
        .map(m => m.content)
        .join('\n\n');

      const chatMessages = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));

      const result = await generativeModel.generateContent({
        contents: chatMessages,
        systemInstruction: systemInstruction || undefined,
        generationConfig: {
          temperature: options?.temperature,
          maxOutputTokens: options?.maxTokens,
          stopSequences: options?.stopSequences,
        },
      });

      const response = result.response;
      const content = response.candidates?.[0]?.content?.parts?.[0]?.text || '';

      return {
        content,
        usage: {
          promptTokens: response.usageMetadata?.promptTokenCount || 0,
          completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: response.usageMetadata?.totalTokenCount || 0,
        },
        model: this.model,
        finishReason: response.candidates?.[0]?.finishReason === 'STOP' ? 'stop' : 'length',
      };
    } catch (error) {
      throw new Error(
        `Gemini API error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async *streamChat(
    messages: Message[],
    options?: ChatOptions
  ): AsyncGenerator<ChatStreamChunk> {
    try {
      const generativeModel = this.client.getGenerativeModel({
        model: this.model,
      });

      // Convert messages to Gemini format
      const systemInstruction = messages
        .filter(m => m.role === 'system')
        .map(m => m.content)
        .join('\n\n');

      const chatMessages = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));

      const result = await generativeModel.generateContentStream({
        contents: chatMessages,
        systemInstruction: systemInstruction || undefined,
        generationConfig: {
          temperature: options?.temperature,
          maxOutputTokens: options?.maxTokens,
          stopSequences: options?.stopSequences,
        },
      });

      for await (const chunk of result.stream) {
        const content = chunk.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (content) {
          yield {
            content,
            done: false,
          };
        }
      }

      yield {
        content: '',
        done: true,
      };
    } catch (error) {
      throw new Error(
        `Gemini streaming error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async countTokens(text: string): Promise<TokenCount> {
    try {
      const generativeModel = this.client.getGenerativeModel({
        model: this.model,
      });

      const result = await generativeModel.countTokens({
        contents: [{ parts: [{ text }] }],
      });

      return {
        count: result.totalTokens,
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
      const generativeModel = this.client.getGenerativeModel({
        model: this.model,
      });

      await generativeModel.generateContent('test');
      return true;
    } catch {
      return false;
    }
  }
}
