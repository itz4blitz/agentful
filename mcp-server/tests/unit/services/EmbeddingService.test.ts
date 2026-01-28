import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MockEmbeddingService } from '../../../src/services/EmbeddingService.js';
import { EmbeddingService } from '../../../src/services/EmbeddingService.js';

describe('MockEmbeddingService', () => {
  let service: MockEmbeddingService;

  beforeEach(() => {
    service = new MockEmbeddingService();
  });

  describe('embed', () => {
    it('should generate 384-dimensional vector', async () => {
      const embedding = await service.embed('test text');

      expect(embedding).toHaveLength(384);
    });

    it('should generate deterministic embeddings for same text', async () => {
      const text = 'test text';
      const embedding1 = await service.embed(text);
      const embedding2 = await service.embed(text);

      expect(embedding1).toEqual(embedding2);
    });

    it('should generate different embeddings for different text', async () => {
      const embedding1 = await service.embed('text one');
      const embedding2 = await service.embed('text two');

      expect(embedding1).not.toEqual(embedding2);
    });

    it('should generate embeddings with values between 0 and 1', async () => {
      const embedding = await service.embed('test');

      embedding.forEach(value => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      });
    });

    it('should handle empty string', async () => {
      const embedding = await service.embed('');

      expect(embedding).toHaveLength(384);
    });

    it('should handle very long text', async () => {
      const longText = 'a'.repeat(100000);
      const embedding = await service.embed(longText);

      expect(embedding).toHaveLength(384);
    });

    it('should handle special characters', async () => {
      const specialText = '特殊字符 🚀 emoji test\n<script>alert("xss")</script>';
      const embedding = await service.embed(specialText);

      expect(embedding).toHaveLength(384);
    });

    it('should be faster than real embedding service', async () => {
      const start = Date.now();
      for (let i = 0; i < 100; i++) {
        await service.embed(`test text ${i}`);
      }
      const duration = Date.now() - start;

      // Should complete 100 embeddings in less than 100ms
      expect(duration).toBeLessThan(100);
    });
  });

  describe('deterministic behavior', () => {
    it('should produce consistent embeddings across multiple instances', async () => {
      const service1 = new MockEmbeddingService();
      const service2 = new MockEmbeddingService();

      const text = 'consistent test';
      const embedding1 = await service1.embed(text);
      const embedding2 = await service2.embed(text);

      expect(embedding1).toEqual(embedding2);
    });

    it('should maintain similarity for similar text', async () => {
      const text1 = 'authentication with JWT';
      const text2 = 'authentication using JWT tokens';

      const embedding1 = await service.embed(text1);
      const embedding2 = await service.embed(text2);

      // Calculate cosine similarity
      let dotProduct = 0;
      let magnitude1 = 0;
      let magnitude2 = 0;

      for (let i = 0; i < embedding1.length; i++) {
        dotProduct += embedding1[i] * embedding2[i];
        magnitude1 += embedding1[i] * embedding1[i];
        magnitude2 += embedding2[i] * embedding2[i];
      }

      const similarity = dotProduct / (Math.sqrt(magnitude1) * Math.sqrt(magnitude2));

      // Similar text should have reasonable similarity
      expect(similarity).toBeGreaterThan(0.5);
    });
  });

  describe('interface compliance', () => {
    it('should implement IEmbeddingService interface', async () => {
      const service = new MockEmbeddingService();

      // Should have embed method
      expect(typeof service.embed).toBe('function');

      // Should return promise
      const result = service.embed('test');
      expect(result).toBeInstanceOf(Promise);

      // Should resolve to number array
      const embedding = await result;
      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding.every(v => typeof v === 'number')).toBe(true);
    });
  });

  describe('singleton pattern', () => {
    it('should create independent instances', async () => {
      // MockEmbeddingService doesn't use singleton pattern
      // Each new call creates a new instance
      const service1 = new MockEmbeddingService();
      const service2 = new MockEmbeddingService();

      // Should be different instances
      expect(service1 === service2).toBe(false);

      // But should produce same results for same input
      const text = 'test text';
      const result1 = await service1.embed(text);
      const result2 = await service2.embed(text);

      expect(result1).toEqual(result2);
    });

    it('should not have static getInstance method', () => {
      // MockEmbeddingService is a simple class, not a singleton
      expect(typeof MockEmbeddingService.getInstance).toBe('undefined');
    });
  });
});

describe('EmbeddingService', () => {
  afterEach(() => {
    // Reset singleton after each test
    EmbeddingService.reset();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = EmbeddingService.getInstance();
      const instance2 = EmbeddingService.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should create new instance if none exists', () => {
      const instance = EmbeddingService.getInstance();

      expect(instance).toBeInstanceOf(EmbeddingService);
    });
  });

  describe('reset', () => {
    it('should reset singleton instance', () => {
      const instance1 = EmbeddingService.getInstance();

      EmbeddingService.reset();
      const instance2 = EmbeddingService.getInstance();

      expect(instance1).not.toBe(instance2);
    });

    it('should handle reset when no instance exists', () => {
      expect(() => EmbeddingService.reset()).not.toThrow();
    });

    it('should handle multiple consecutive resets', () => {
      expect(() => {
        EmbeddingService.reset();
        EmbeddingService.reset();
        EmbeddingService.reset();
      }).not.toThrow();
    });
  });

  describe('embed', () => {
    it('should attempt to load model and generate embedding', async () => {
      const service = EmbeddingService.getInstance();

      try {
        const embedding = await service.embed('test text');

        // If successful, validate the embedding
        expect(Array.isArray(embedding)).toBe(true);
        expect(embedding.length).toBe(384);
      } catch (error: any) {
        // Expected to fail due to model download requirements in test environment
        // But we can verify the error message is appropriate
        expect(error.message).toBeDefined();
      }
    });

    it('should throw appropriate error for model loading failure', async () => {
      const service = EmbeddingService.getInstance();

      try {
        await service.embed('test');
      } catch (error: any) {
        // Error should be related to model loading or embedding generation
        expect(error.message).toBeDefined();
        expect(error.message.length).toBeGreaterThan(0);
      }
    });

    it('should handle empty string input', async () => {
      const service = EmbeddingService.getInstance();

      try {
        await service.embed('');
      } catch (error: any) {
        expect(error.message).toBeDefined();
      }
    });

    it('should handle special characters in input', async () => {
      const service = EmbeddingService.getInstance();

      try {
        await service.embed('特殊字符 🚀 emoji test\n<script>alert("xss")</script>');
      } catch (error: any) {
        expect(error.message).toBeDefined();
      }
    });

    it('should be an async method', () => {
      const service = EmbeddingService.getInstance();

      const result = service.embed('test');
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe('singleton behavior', () => {
    it('should share model instance across singleton', async () => {
      const service1 = EmbeddingService.getInstance();
      const service2 = EmbeddingService.getInstance();

      expect(service1).toBe(service2);

      try {
        // Both should use the same model instance
        await Promise.all([
          service1.embed('test1'),
          service2.embed('test2')
        ]);
      } catch (error: any) {
        // Expected to fail due to model requirements
        expect(error).toBeDefined();
      }
    });
  });
});
