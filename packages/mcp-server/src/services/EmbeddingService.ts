import { pipeline, Pipeline } from '@xenova/transformers';
import { IEmbeddingService } from '../types/index.js';

/**
 * Embedding Service
 * - Generates 384-dim vectors using Transformers.js
 * - Lazy model loading for testability
 * - Model caching for performance
 */
export class EmbeddingService implements IEmbeddingService {
  private static instance: EmbeddingService | null = null;
  private model: Pipeline | null = null;
  private readonly MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): EmbeddingService {
    if (!EmbeddingService.instance) {
      EmbeddingService.instance = new EmbeddingService();
    }
    return EmbeddingService.instance;
  }

  /**
   * Generate embedding for text
   * @param text - Input text to embed
   * @returns 384-dimensional vector
   */
  async embed(text: string): Promise<number[]> {
    // Lazy load model
    if (!this.model) {
      try {
        this.model = await pipeline('feature-extraction', this.MODEL_NAME, {
          progress_callback: (_progress: unknown) => {
            // Optionally log progress for debugging
            if (process.env.AGENTFUL_LOG_LEVEL === 'debug') {
              // Progress logging disabled for now
            }
          }
        }) as Pipeline;
      } catch (error) {
        throw new Error(
          `Failed to load embedding model: ${error instanceof Error ? error.message : error}`
        );
      }
    }

    try {
      // Generate embedding
      const output = await this.model!(text, {
        pooling: 'mean',
        normalize: true
      });

      // Convert to array
      const embedding = Array.from(output.data) as number[];

      // Validate dimensions
      if (embedding.length !== 384) {
        throw new Error(`Invalid embedding dimensions: ${embedding.length} (expected 384)`);
      }

      return embedding;
    } catch (error) {
      throw new Error(
        `Failed to generate embedding: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Reset singleton (for testing)
   */
  static reset(): void {
    EmbeddingService.instance = null;
  }
}

/**
 * Mock Embedding Service for testing
 * - Generates deterministic embeddings based on text hash
 * - No external dependencies
 * - Fast and reliable for unit tests
 */
export class MockEmbeddingService implements IEmbeddingService {
  async embed(text: string): Promise<number[]> {
    // Generate deterministic hash
    const hash = this.hashString(text);
    const random = this.seededRandom(hash);

    // Generate 384-dim vector
    return Array.from({ length: 384 }, () => random());
  }

  /**
   * Simple string hash
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Seeded random number generator
   */
  private seededRandom(seed: number): () => number {
    return () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }
}
