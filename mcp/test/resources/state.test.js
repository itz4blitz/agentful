import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createMCPServer } from '../../server.js';
import { MockExecutor } from '../fixtures/mock-executor.js';
import { createTestEnvironment, cleanupTestEnvironment } from '../fixtures/test-helpers.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * State Resource Tests
 *
 * Tests the agentful://state resource:
 * - Read state successfully
 * - Handle missing state file
 * - JSON formatting
 * - Caching behavior
 * - State content validation
 */
describe('State Resource', () => {
  let server;
  let testDir;
  let mockExecutor;

  beforeEach(async () => {
    testDir = await createTestEnvironment();
    mockExecutor = new MockExecutor();

    server = createMCPServer({
      projectRoot: testDir,
      executor: mockExecutor
    });
  });

  afterEach(async () => {
    mockExecutor.reset();
    await cleanupTestEnvironment(testDir);
  });

  describe('Read State Successfully', () => {
    it('should read existing state file', async () => {
      const result = await server.getServer().request(
        {
          method: 'resources/read',
          params: { uri: 'agentful://state' }
        },
        'ReadResourceResultSchema'
      );

      expect(result.contents).toBeDefined();
      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].uri).toBe('agentful://state');
      expect(result.contents[0].mimeType).toBe('application/json');
      expect(result.contents[0].text).toBeDefined();
    });

    it('should return valid JSON state', async () => {
      const result = await server.getServer().request(
        {
          method: 'resources/read',
          params: { uri: 'agentful://state' }
        },
        'ReadResourceResultSchema'
      );

      const state = JSON.parse(result.contents[0].text);

      expect(state).toHaveProperty('currentPhase');
      expect(state).toHaveProperty('progress');
      expect(state).toHaveProperty('features');
      expect(state).toHaveProperty('decisions');
      expect(state).toHaveProperty('lastUpdated');
    });

    it('should include feature data', async () => {
      const result = await server.getServer().request(
        {
          method: 'resources/read',
          params: { uri: 'agentful://state' }
        },
        'ReadResourceResultSchema'
      );

      const state = JSON.parse(result.contents[0].text);

      expect(state.features).toBeInstanceOf(Array);
      expect(state.features.length).toBeGreaterThan(0);

      const feature = state.features[0];
      expect(feature).toHaveProperty('id');
      expect(feature).toHaveProperty('name');
      expect(feature).toHaveProperty('status');
      expect(feature).toHaveProperty('priority');
    });

    it('should reflect current phase', async () => {
      const result = await server.getServer().request(
        {
          method: 'resources/read',
          params: { uri: 'agentful://state' }
        },
        'ReadResourceResultSchema'
      );

      const state = JSON.parse(result.contents[0].text);

      expect(state.currentPhase).toBeDefined();
      expect(typeof state.currentPhase).toBe('string');
    });

    it('should include progress percentage', async () => {
      const result = await server.getServer().request(
        {
          method: 'resources/read',
          params: { uri: 'agentful://state' }
        },
        'ReadResourceResultSchema'
      );

      const state = JSON.parse(result.contents[0].text);

      expect(state.progress).toBeDefined();
      expect(typeof state.progress).toBe('number');
      expect(state.progress).toBeGreaterThanOrEqual(0);
      expect(state.progress).toBeLessThanOrEqual(100);
    });
  });

  describe('Handle Missing State File', () => {
    beforeEach(async () => {
      // Remove state file to test missing file handling
      const statePath = path.join(testDir, '.agentful/state.json');
      await fs.unlink(statePath).catch(() => {});
    });

    it('should handle missing state file gracefully', async () => {
      const result = await server.getServer().request(
        {
          method: 'resources/read',
          params: { uri: 'agentful://state' }
        },
        'ReadResourceResultSchema'
      );

      expect(result.contents).toBeDefined();
      expect(result.contents[0].text).toBeDefined();

      const response = JSON.parse(result.contents[0].text);
      expect(response).toHaveProperty('error');
    });

    it('should return proper error message', async () => {
      const result = await server.getServer().request(
        {
          method: 'resources/read',
          params: { uri: 'agentful://state' }
        },
        'ReadResourceResultSchema'
      );

      const response = JSON.parse(result.contents[0].text);
      expect(response.error).toContain('State file not found');
    });

    it('should still return valid JSON', async () => {
      const result = await server.getServer().request(
        {
          method: 'resources/read',
          params: { uri: 'agentful://state' }
        },
        'ReadResourceResultSchema'
      );

      expect(() => {
        JSON.parse(result.contents[0].text);
      }).not.toThrow();
    });
  });

  describe('JSON Formatting', () => {
    it('should return properly formatted JSON', async () => {
      const result = await server.getServer().request(
        {
          method: 'resources/read',
          params: { uri: 'agentful://state' }
        },
        'ReadResourceResultSchema'
      );

      const text = result.contents[0].text;

      // Should be parseable
      expect(() => JSON.parse(text)).not.toThrow();

      // Should be pretty-printed (contains newlines and indentation)
      expect(text).toContain('\n');
      expect(text).toMatch(/\s{2,}/); // Multiple spaces for indentation
    });

    it('should have correct MIME type', async () => {
      const result = await server.getServer().request(
        {
          method: 'resources/read',
          params: { uri: 'agentful://state' }
        },
        'ReadResourceResultSchema'
      );

      expect(result.contents[0].mimeType).toBe('application/json');
    });

    it('should include URI in response', async () => {
      const result = await server.getServer().request(
        {
          method: 'resources/read',
          params: { uri: 'agentful://state' }
        },
        'ReadResourceResultSchema'
      );

      expect(result.contents[0].uri).toBe('agentful://state');
    });
  });

  describe('State Content Validation', () => {
    it('should handle empty features array', async () => {
      // Update state file to have empty features
      const statePath = path.join(testDir, '.agentful/state.json');
      await fs.writeFile(
        statePath,
        JSON.stringify({
          currentPhase: 'planning',
          progress: 0,
          features: [],
          decisions: [],
          lastUpdated: new Date().toISOString()
        }, null, 2)
      );

      const result = await server.getServer().request(
        {
          method: 'resources/read',
          params: { uri: 'agentful://state' }
        },
        'ReadResourceResultSchema'
      );

      const state = JSON.parse(result.contents[0].text);
      expect(state.features).toEqual([]);
    });

    it('should preserve all state properties', async () => {
      const result = await server.getServer().request(
        {
          method: 'resources/read',
          params: { uri: 'agentful://state' }
        },
        'ReadResourceResultSchema'
      );

      const state = JSON.parse(result.contents[0].text);

      // All expected properties should be present
      expect(state).toHaveProperty('currentPhase');
      expect(state).toHaveProperty('progress');
      expect(state).toHaveProperty('features');
      expect(state).toHaveProperty('decisions');
      expect(state).toHaveProperty('lastUpdated');
    });

    it('should handle complex feature objects', async () => {
      const result = await server.getServer().request(
        {
          method: 'resources/read',
          params: { uri: 'agentful://state' }
        },
        'ReadResourceResultSchema'
      );

      const state = JSON.parse(result.contents[0].text);

      if (state.features && state.features.length > 0) {
        const feature = state.features[0];

        // Feature should have all required fields
        expect(feature).toHaveProperty('id');
        expect(feature).toHaveProperty('name');
        expect(feature).toHaveProperty('status');
        expect(feature).toHaveProperty('priority');
      }
    });
  });

  describe('Multiple Reads', () => {
    it('should return consistent data on multiple reads', async () => {
      const result1 = await server.getServer().request(
        {
          method: 'resources/read',
          params: { uri: 'agentful://state' }
        },
        'ReadResourceResultSchema'
      );

      const result2 = await server.getServer().request(
        {
          method: 'resources/read',
          params: { uri: 'agentful://state' }
        },
        'ReadResourceResultSchema'
      );

      expect(result1.contents[0].text).toBe(result2.contents[0].text);
    });

    it('should handle concurrent reads', async () => {
      const reads = [
        server.getServer().request(
          { method: 'resources/read', params: { uri: 'agentful://state' } },
          'ReadResourceResultSchema'
        ),
        server.getServer().request(
          { method: 'resources/read', params: { uri: 'agentful://state' } },
          'ReadResourceResultSchema'
        ),
        server.getServer().request(
          { method: 'resources/read', params: { uri: 'agentful://state' } },
          'ReadResourceResultSchema'
        )
      ];

      const results = await Promise.all(reads);

      expect(results).toHaveLength(3);
      expect(results[0].contents[0].text).toBeDefined();
      expect(results[1].contents[0].text).toBeDefined();
      expect(results[2].contents[0].text).toBeDefined();
    });
  });

  describe('State Updates', () => {
    it('should reflect changes after state file update', async () => {
      // Read initial state
      const result1 = await server.getServer().request(
        {
          method: 'resources/read',
          params: { uri: 'agentful://state' }
        },
        'ReadResourceResultSchema'
      );

      const initialState = JSON.parse(result1.contents[0].text);

      // Update state file
      const statePath = path.join(testDir, '.agentful/state.json');
      const newState = {
        ...initialState,
        currentPhase: 'testing',
        progress: 75
      };

      await fs.writeFile(statePath, JSON.stringify(newState, null, 2));

      // Read updated state
      const result2 = await server.getServer().request(
        {
          method: 'resources/read',
          params: { uri: 'agentful://state' }
        },
        'ReadResourceResultSchema'
      );

      const updatedState = JSON.parse(result2.contents[0].text);

      expect(updatedState.currentPhase).toBe('testing');
      expect(updatedState.progress).toBe(75);
    });
  });
});
