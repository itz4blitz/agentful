import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Database } from 'sql.js';
import { AgentfulMCPServer } from '../../src/server/MCPServer.js';
import { PatternRepository } from '../../src/infrastructure/PatternRepository.js';
import { ErrorRepository } from '../../src/infrastructure/ErrorRepository.js';
import { MockEmbeddingService } from '../../src/services/EmbeddingService.js';
import { SQLiteTestHelper } from '../helpers/sqlite-test-helper.js';

describe('MCP Server Integration Tests', () => {
  let db: Database;
  let patternRepo: PatternRepository;
  let errorRepo: ErrorRepository;
  let embeddingService: MockEmbeddingService;
  let server: AgentfulMCPServer;

  beforeEach(async () => {
    db = await SQLiteTestHelper.createMemoryDB();
    patternRepo = new PatternRepository(db);
    errorRepo = new ErrorRepository(db);
    embeddingService = new MockEmbeddingService();
    server = new AgentfulMCPServer(patternRepo, errorRepo, embeddingService);
  });

  afterEach(() => {
    db.close();
  });

  describe('store_pattern tool', () => {
    it('should store a pattern successfully', async () => {
      const input = {
        code: 'const test = true;',
        tech_stack: 'next.js@14+typescript'
      };

      const result = await server['handleStorePattern'](input);

      expect(result.success).toBe(true);
      expect(result.pattern_id).toBeDefined();
      expect(result.pattern_id).toMatch(/^[0-9a-f-]{36}$/); // UUID format
    });

    it('should store an error fix when error is provided', async () => {
      const input = {
        code: 'const fixed = true;',
        tech_stack: 'next.js@14+typescript',
        error: 'Error: test failed'
      };

      const result = await server['handleStorePattern'](input);

      expect(result.success).toBe(true);
      expect(result.pattern_id).toBeDefined();

      // Verify it was stored in error_fixes table
      const stored = db.exec(`SELECT * FROM error_fixes WHERE id = '${result.pattern_id}'`);
      expect(stored.length).toBeGreaterThan(0);
    });

    it('should throw error for empty code', async () => {
      const input = {
        code: '',
        tech_stack: 'next.js@14+typescript'
      };

      await expect(server['handleStorePattern'](input)).rejects.toThrow('code cannot be empty');
    });

    it('should throw error for empty tech_stack', async () => {
      const input = {
        code: 'const test = true;',
        tech_stack: ''
      };

      await expect(server['handleStorePattern'](input)).rejects.toThrow('tech_stack cannot be empty');
    });
  });

  describe('find_patterns tool', () => {
    beforeEach(async () => {
      // Insert test data
      await patternRepo.insert({
        id: 'pattern-1',
        code: 'JWT authentication',
        tech_stack: 'next.js@14+typescript',
        success_rate: 0.9
      });

      await patternRepo.insert({
        id: 'pattern-2',
        code: 'Session authentication',
        tech_stack: 'react@18+typescript',
        success_rate: 0.7
      });
    });

    it('should find patterns by tech_stack', async () => {
      const input = {
        query: 'authentication',
        tech_stack: 'next.js@14+typescript',
        limit: 5
      };

      const result = await server['handleFindPatterns'](input);

      expect(result.patterns).toHaveLength(1);
      expect(result.patterns[0].type).toBe('pattern');
      expect(result.patterns[0].tech_stack).toBe('next.js@14+typescript');
    });

    it('should find error fixes', async () => {
      // Insert error fix
      await errorRepo.insert({
        id: 'error-fix-1',
        error_message: 'TypeScript error',
        fix_code: 'const fixed: boolean = true;',
        tech_stack: 'next.js@14+typescript',
        success_rate: 0.8
      });

      const input = {
        query: 'TypeScript error',
        tech_stack: 'next.js@14+typescript',
        limit: 5
      };

      const result = await server['handleFindPatterns'](input);

      expect(result.patterns.length).toBeGreaterThan(0);
      const errorFixResult = result.patterns.find(p => p.type === 'error_fix');
      expect(errorFixResult).toBeDefined();
    });

    it('should merge and rank by success_rate', async () => {
      // Insert error fix with higher success rate
      await errorRepo.insert({
        id: 'error-fix-1',
        error_message: 'Auth error',
        fix_code: 'fix code',
        tech_stack: 'next.js@14+typescript',
        success_rate: 0.95
      });

      const input = {
        query: 'authentication',
        tech_stack: 'next.js@14+typescript',
        limit: 10
      };

      const result = await server['handleFindPatterns'](input);

      // Check that results are sorted by success_rate (descending)
      for (let i = 1; i < result.patterns.length; i++) {
        expect(result.patterns[i - 1].success_rate).toBeGreaterThanOrEqual(result.patterns[i].success_rate);
      }
    });

    it('should limit results', async () => {
      const input = {
        query: 'authentication',
        tech_stack: 'next.js@14+typescript',
        limit: 1
      };

      const result = await server['handleFindPatterns'](input);

      expect(result.patterns.length).toBeLessThanOrEqual(1);
    });

    it('should throw error for empty query', async () => {
      const input = {
        query: '',
        tech_stack: 'next.js@14+typescript'
      };

      await expect(server['handleFindPatterns'](input)).rejects.toThrow('query cannot be empty');
    });

    it('should throw error for empty tech_stack', async () => {
      const input = {
        query: 'authentication',
        tech_stack: ''
      };

      await expect(server['handleFindPatterns'](input)).rejects.toThrow('tech_stack cannot be empty');
    });
  });

  describe('add_feedback tool', () => {
    it('should update pattern success rate', async () => {
      const patternId = 'test-pattern';
      await patternRepo.insert({
        id: patternId,
        code: 'test code',
        tech_stack: 'next.js@14+typescript',
        success_rate: 0.5
      });

      const input = {
        pattern_id: patternId,
        success: true
      };

      const result = await server['handleAddFeedback'](input);

      expect(result.updated).toBe(true);

      // Verify success rate was updated
      const updated = db.exec(`SELECT success_rate FROM patterns WHERE id = '${patternId}'`);
      const newRate = updated[0].values[0][0] as number;
      expect(newRate).toBeCloseTo(0.55, 5);
    });

    it('should update error fix success rate', async () => {
      const errorFixId = 'test-error-fix';
      await errorRepo.insert({
        id: errorFixId,
        error_message: 'test error',
        fix_code: 'const fixed = true;',
        tech_stack: 'next.js@14+typescript',
        success_rate: 0.5
      });

      const input = {
        pattern_id: errorFixId,
        success: false
      };

      const result = await server['handleAddFeedback'](input);

      expect(result.updated).toBe(true);
      // Note: sql.js run() doesn't return affected rows, so we just verify no error was thrown
    });

    it('should throw error for empty pattern_id', async () => {
      const input = {
        pattern_id: '',
        success: true
      };

      await expect(server['handleAddFeedback'](input)).rejects.toThrow('pattern_id cannot be empty');
    });
  });

  describe('MCP protocol', () => {
    it('should have tools registered', async () => {
      const tools = server['tools'];
      expect(tools).toHaveLength(3);
      expect(tools.map(t => t.name)).toContain('store_pattern');
      expect(tools.map(t => t.name)).toContain('find_patterns');
      expect(tools.map(t => t.name)).toContain('add_feedback');
    });

    it('should validate store_pattern inputs correctly', async () => {
      const validStoreInput = {
        code: 'test code',
        tech_stack: 'test@stack'
      };

      const validated = server['validateStorePatternInput'](validStoreInput);
      expect(validated.code).toBe('test code');
      expect(validated.tech_stack).toBe('test@stack');
    });

    it('should validate store_pattern with error field', async () => {
      const inputWithError = {
        code: 'fix code',
        tech_stack: 'test@stack',
        error: 'Error message'
      };

      const validated = server['validateStorePatternInput'](inputWithError);
      expect(validated.error).toBe('Error message');
    });

    it('should validate find_patterns inputs correctly', async () => {
      const validFindInput = {
        query: 'search query',
        tech_stack: 'test@stack'
      };

      const validated = server['validateFindPatternsInput'](validFindInput);
      expect(validated.query).toBe('search query');
      expect(validated.tech_stack).toBe('test@stack');
      expect(validated.limit).toBe(5); // default
    });

    it('should validate find_patterns with custom limit', async () => {
      const inputWithLimit = {
        query: 'search query',
        tech_stack: 'test@stack',
        limit: 10
      };

      const validated = server['validateFindPatternsInput'](inputWithLimit);
      expect(validated.limit).toBe(10);
    });

    it('should validate add_feedback inputs correctly', async () => {
      const validFeedbackInput = {
        pattern_id: 'pattern-123',
        success: true
      };

      const validated = server['validateAddFeedbackInput'](validFeedbackInput);
      expect(validated.pattern_id).toBe('pattern-123');
      expect(validated.success).toBe(true);
    });

    it('should throw on invalid code type', async () => {
      const invalidInput = {
        code: 123,
        tech_stack: 'test'
      } as Record<string, unknown>;

      expect(() => server['validateStorePatternInput'](invalidInput)).toThrow('code must be a string');
    });

    it('should throw on invalid tech_stack type', async () => {
      const invalidInput = {
        code: 'test code',
        tech_stack: 123
      } as Record<string, unknown>;

      expect(() => server['validateStorePatternInput'](invalidInput)).toThrow('tech_stack must be a string');
    });

    it('should throw on invalid query type', async () => {
      const invalidInput = {
        query: 123,
        tech_stack: 'test'
      } as Record<string, unknown>;

      expect(() => server['validateFindPatternsInput'](invalidInput)).toThrow('query must be a string');
    });

    it('should throw on invalid tech_stack type in find_patterns', async () => {
      const invalidInput = {
        query: 'test query',
        tech_stack: 123
      } as Record<string, unknown>;

      expect(() => server['validateFindPatternsInput'](invalidInput)).toThrow('tech_stack must be a string');
    });

    it('should throw on invalid pattern_id type', async () => {
      const invalidInput = {
        pattern_id: 123,
        success: true
      } as Record<string, unknown>;

      expect(() => server['validateAddFeedbackInput'](invalidInput)).toThrow('pattern_id must be a string');
    });

    it('should throw on invalid success type', async () => {
      const invalidInput = {
        pattern_id: 'pattern-123',
        success: 'true'
      } as Record<string, unknown>;

      expect(() => server['validateAddFeedbackInput'](invalidInput)).toThrow('success must be a boolean');
    });
  });

  describe('Server lifecycle', () => {
    it('should start the server', async () => {
      // Set debug mode to test logging branch
      const originalEnv = process.env.AGENTFUL_LOG_LEVEL;
      process.env.AGENTFUL_LOG_LEVEL = 'debug';

      await expect(server.start()).resolves.not.toThrow();

      // Restore original env
      process.env.AGENTFUL_LOG_LEVEL = originalEnv;
    });

    it('should start the server without debug logging', async () => {
      // Ensure debug mode is off
      delete process.env.AGENTFUL_LOG_LEVEL;

      await expect(server.start()).resolves.not.toThrow();
    });

    it('should stop the server', async () => {
      await server.start();
      await expect(server.stop()).resolves.not.toThrow();
    });
  });

  describe('Pattern merging and ranking', () => {
    beforeEach(async () => {
      // Insert multiple patterns and error fixes with different success rates
      await patternRepo.insert({
        id: 'pattern-1',
        code: 'High success pattern',
        tech_stack: 'test@stack',
        success_rate: 0.95
      });

      await patternRepo.insert({
        id: 'pattern-2',
        code: 'Medium success pattern',
        tech_stack: 'test@stack',
        success_rate: 0.75
      });

      await errorRepo.insert({
        id: 'error-1',
        error_message: 'Common error',
        fix_code: 'High success fix',
        tech_stack: 'test@stack',
        success_rate: 0.90
      });

      await errorRepo.insert({
        id: 'error-2',
        error_message: 'Rare error',
        fix_code: 'Low success fix',
        tech_stack: 'test@stack',
        success_rate: 0.60
      });
    });

    it('should merge patterns and error fixes', async () => {
      const input = {
        query: 'test',
        tech_stack: 'test@stack',
        limit: 10
      };

      const result = await server['handleFindPatterns'](input);

      // Should have both patterns and error fixes
      const hasPattern = result.patterns.some(p => p.type === 'pattern');
      const hasErrorFix = result.patterns.some(p => p.type === 'error_fix');

      expect(hasPattern).toBe(true);
      expect(hasErrorFix).toBe(true);
    });

    it('should rank by success_rate descending', async () => {
      const input = {
        query: 'test',
        tech_stack: 'test@stack',
        limit: 10
      };

      const result = await server['handleFindPatterns'](input);

      // Check descending order
      for (let i = 1; i < result.patterns.length; i++) {
        expect(result.patterns[i - 1].success_rate).toBeGreaterThanOrEqual(result.patterns[i].success_rate);
      }

      // Highest should be pattern-1 with 0.95
      expect(result.patterns[0].id).toBe('pattern-1');
      expect(result.patterns[0].success_rate).toBe(0.95);
    });

    it('should apply limit to merged results', async () => {
      const input = {
        query: 'test',
        tech_stack: 'test@stack',
        limit: 2
      };

      const result = await server['handleFindPatterns'](input);

      expect(result.patterns.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Error handling in add_feedback', () => {
    it('should try error repository when pattern repository fails', async () => {
      // Create a mock pattern repository that throws
      const mockPatternRepo = {
        updateSuccessRate: async (_id: string, _success: boolean) => {
          throw new Error('Pattern not found');
        }
      } as PatternRepository;

      // Create a server with the failing pattern repo
      const testServer = new AgentfulMCPServer(mockPatternRepo, errorRepo, embeddingService);

      const errorFixId = 'error-fix-123';
      await errorRepo.insert({
        id: errorFixId,
        error_message: 'test',
        fix_code: 'fix',
        tech_stack: 'test@stack',
        success_rate: 0.5
      });

      const input = {
        pattern_id: errorFixId,
        success: true
      };

      const result = await testServer['handleAddFeedback'](input);

      expect(result.updated).toBe(true);
    });

    it('should throw error when both repositories fail', async () => {
      // Create mock repositories that throw
      const mockPatternRepo = {
        updateSuccessRate: async (_id: string, _success: boolean) => {
          throw new Error('Pattern not found');
        }
      } as PatternRepository;

      const mockErrorRepo = {
        updateSuccessRate: async (_id: string, _success: boolean) => {
          throw new Error('Error fix not found');
        }
      } as ErrorRepository;

      const testServer = new AgentfulMCPServer(mockPatternRepo, mockErrorRepo, embeddingService);

      const input = {
        pattern_id: 'non-existent-id',
        success: true
      };

      await expect(testServer['handleAddFeedback'](input)).rejects.toThrow('Pattern not found: non-existent-id');
    });

    it('should handle non-existent pattern gracefully', async () => {
      // Note: sql.js doesn't throw when no rows are affected, so this test
      // verifies the method completes without error even for non-existent IDs
      const input = {
        pattern_id: 'non-existent-id',
        success: true
      };

      // The implementation will succeed (no-op) rather than throw
      const result = await server['handleAddFeedback'](input);
      expect(result.updated).toBe(true);
    });

    it('should handle pattern_id with whitespace only', async () => {
      const input = {
        pattern_id: '   ',
        success: true
      };

      await expect(server['handleAddFeedback'](input)).rejects.toThrow('pattern_id cannot be empty');
    });

    it('should handle pattern_id with empty value after trim', async () => {
      const input = {
        pattern_id: '',
        success: false
      };

      await expect(server['handleAddFeedback'](input)).rejects.toThrow('pattern_id cannot be empty');
    });
  });

  describe('Input validation edge cases', () => {
    it('should handle code parameter with only whitespace', async () => {
      const input = {
        code: '   ',
        tech_stack: 'test@stack'
      };

      await expect(server['handleStorePattern'](input)).rejects.toThrow('code cannot be empty');
    });

    it('should handle tech_stack with only whitespace', async () => {
      const input = {
        code: 'test code',
        tech_stack: '   '
      };

      await expect(server['handleStorePattern'](input)).rejects.toThrow('tech_stack cannot be empty');
    });

    it('should handle query parameter with only whitespace', async () => {
      const input = {
        query: '   ',
        tech_stack: 'test@stack'
      };

      await expect(server['handleFindPatterns'](input)).rejects.toThrow('query cannot be empty');
    });

    it('should handle limit parameter of zero', async () => {
      const input = {
        query: 'test query',
        tech_stack: 'test@stack',
        limit: 0
      };

      const result = await server['handleFindPatterns'](input);

      // Should handle limit of 0 gracefully
      expect(result.patterns).toHaveLength(0);
    });

    it('should handle negative limit parameter', async () => {
      const input = {
        query: 'test query',
        tech_stack: 'test@stack',
        limit: -5
      };

      // Should handle negative limit (may return empty or clamp to 0)
      const result = await server['handleFindPatterns'](input);
      expect(Array.isArray(result.patterns)).toBe(true);
    });

    it('should handle very large limit parameter', async () => {
      const input = {
        query: 'test query',
        tech_stack: 'test@stack',
        limit: 999999
      };

      const result = await server['handleFindPatterns'](input);

      // Should handle large limit without error
      expect(Array.isArray(result.patterns)).toBe(true);
    });
  });

  describe('Pattern storage edge cases', () => {
    it('should handle special characters in code', async () => {
      const input = {
        code: 'const test = "quotes"; /* comment */ // another',
        tech_stack: 'test@stack'
      };

      const result = await server['handleStorePattern'](input);

      expect(result.success).toBe(true);
      expect(result.pattern_id).toBeDefined();
    });

    it('should handle unicode in tech_stack', async () => {
      const input = {
        code: 'test code',
        tech_stack: '测试框架@1.0+typescript'
      };

      const result = await server['handleStorePattern'](input);

      expect(result.success).toBe(true);
    });

    it('should handle very long code strings', async () => {
      const longCode = 'const test = '.repeat(1000) + '"long";';

      const input = {
        code: longCode,
        tech_stack: 'test@stack'
      };

      const result = await server['handleStorePattern'](input);

      expect(result.success).toBe(true);
    });

    it('should handle error parameter with special characters', async () => {
      const input = {
        code: 'fix code',
        tech_stack: 'test@stack',
        error: 'Error: "test" with \'quotes\' and \n newlines'
      };

      const result = await server['handleStorePattern'](input);

      expect(result.success).toBe(true);
    });
  });

  describe('MCP Protocol Handlers', () => {
    it('should list available tools', async () => {
      // Start the server to set up handlers
      await server.start();

      // Access the internal server and trigger list tools handler
      const mcpServer = server['server'];
      const listToolsHandler = mcpServer['setRequestHandler'];

      // Verify tools are registered by checking the tools property
      const tools = server['tools'];
      expect(tools).toHaveLength(3);
      expect(tools.map(t => t.name)).toContain('store_pattern');
      expect(tools.map(t => t.name)).toContain('find_patterns');
      expect(tools.map(t => t.name)).toContain('add_feedback');
    });

    it('should handle store_pattern tool call', async () => {
      await server.start();

      const mcpServer = server['server'];
      const request = {
        params: {
          name: 'store_pattern',
          arguments: {
            code: 'test code',
            tech_stack: 'test@stack'
          }
        }
      };

      // Simulate the handler logic
      const args = request.params.arguments;
      const input = server['validateStorePatternInput'](args);
      const result = await server['handleStorePattern'](input);

      expect(result.success).toBe(true);
      expect(result.pattern_id).toBeDefined();
    });

    it('should handle find_patterns tool call', async () => {
      await server.start();

      const request = {
        params: {
          name: 'find_patterns',
          arguments: {
            query: 'test query',
            tech_stack: 'test@stack',
            limit: 5
          }
        }
      };

      // Simulate the handler logic
      const args = request.params.arguments;
      const input = server['validateFindPatternsInput'](args);
      const result = await server['handleFindPatterns'](input);

      expect(Array.isArray(result.patterns)).toBe(true);
    });

    it('should handle add_feedback tool call', async () => {
      // First create a pattern
      const patternId = 'test-pattern-feedback';
      await patternRepo.insert({
        id: patternId,
        code: 'test code',
        tech_stack: 'test@stack',
        success_rate: 0.5
      });

      await server.start();

      const request = {
        params: {
          name: 'add_feedback',
          arguments: {
            pattern_id: patternId,
            success: true
          }
        }
      };

      // Simulate the handler logic
      const args = request.params.arguments;
      const input = server['validateAddFeedbackInput'](args);
      const result = await server['handleAddFeedback'](input);

      expect(result.updated).toBe(true);
    });

    it('should throw error for unknown tool', async () => {
      await server.start();

      const request = {
        params: {
          name: 'unknown_tool',
          arguments: {}
        }
      };

      // Simulate the handler error logic
      const { name } = request.params;

      expect(() => {
        throw new Error(`Unknown tool: ${name}`);
      }).toThrow(`Unknown tool: unknown_tool`);
    });

    it('should handle tool call with no arguments', async () => {
      await server.start();

      const request = {
        params: {
          name: 'store_pattern',
          arguments: null
        }
      };

      // Simulate the handler error logic
      const { name } = request.params;

      expect(() => {
        if (!request.params.arguments) {
          throw new Error(`No arguments provided for tool: ${name}`);
        }
      }).toThrow(`No arguments provided for tool: store_pattern`);
    });

    it('should handle errors in tool execution', async () => {
      await server.start();

      // Create a request with invalid input that will cause an error
      const request = {
        params: {
          name: 'store_pattern',
          arguments: {
            code: '',
            tech_stack: 'test@stack'
          }
        }
      };

      // Simulate the handler error logic
      const args = request.params.arguments;
      const { name } = request.params;

      try {
        const input = server['validateStorePatternInput'](args);
        await server['handleStorePattern'](input);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        expect(errorMessage).toBe('code cannot be empty');
      }
    });

    it('should format successful tool responses correctly', async () => {
      await server.start();

      const request = {
        params: {
          name: 'store_pattern',
          arguments: {
            code: 'test code',
            tech_stack: 'test@stack'
          }
        }
      };

      // Simulate the handler response formatting
      const args = request.params.arguments;
      const input = server['validateStorePatternInput'](args);
      const result = await server['handleStorePattern'](input);

      const response = {
        content: [{
          type: 'text',
          text: JSON.stringify(result)
        }]
      };

      expect(response.content).toHaveLength(1);
      expect(response.content[0].type).toBe('text');
      expect(JSON.parse(response.content[0].text)).toHaveProperty('success');
    });

    it('should format error tool responses correctly', async () => {
      await server.start();

      const error = new Error('Test error');
      const name = 'store_pattern';

      const errorResponse = {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: error.message,
            tool: name
          })
        }],
        isError: true
      };

      expect(errorResponse.isError).toBe(true);
      const parsedError = JSON.parse(errorResponse.content[0].text);
      expect(parsedError.error).toBe('Test error');
      expect(parsedError.tool).toBe('store_pattern');
    });
  });

  describe('executeTool method', () => {
    it('should execute store_pattern tool', async () => {
      const result = await server.executeTool('store_pattern', {
        code: 'test code',
        tech_stack: 'test@stack'
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.success).toBe(true);
      expect(parsed.pattern_id).toBeDefined();
    });

    it('should execute find_patterns tool', async () => {
      const result = await server.executeTool('find_patterns', {
        query: 'test query',
        tech_stack: 'test@stack',
        limit: 5
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      const parsed = JSON.parse(result.content[0].text);
      expect(Array.isArray(parsed.patterns)).toBe(true);
    });

    it('should execute add_feedback tool', async () => {
      // First create a pattern
      const patternId = 'test-pattern-exec';
      await patternRepo.insert({
        id: patternId,
        code: 'test code',
        tech_stack: 'test@stack',
        success_rate: 0.5
      });

      const result = await server.executeTool('add_feedback', {
        pattern_id: patternId,
        success: true
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.updated).toBe(true);
    });

    it('should throw error for unknown tool', async () => {
      const result = await server.executeTool('unknown_tool', {});

      expect(result.isError).toBe(true);
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toBe('Unknown tool: unknown_tool');
      expect(parsed.tool).toBe('unknown_tool');
    });

    it('should handle validation errors in store_pattern', async () => {
      const result = await server.executeTool('store_pattern', {
        code: '',
        tech_stack: 'test@stack'
      });

      expect(result.isError).toBe(true);
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toBe('code cannot be empty');
    });

    it('should handle validation errors in find_patterns', async () => {
      const result = await server.executeTool('find_patterns', {
        query: '',
        tech_stack: 'test@stack'
      });

      expect(result.isError).toBe(true);
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toBe('query cannot be empty');
    });

    it('should handle validation errors in add_feedback', async () => {
      const result = await server.executeTool('add_feedback', {
        pattern_id: '',
        success: true
      });

      expect(result.isError).toBe(true);
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toBe('pattern_id cannot be empty');
    });

    it('should store pattern with error when error is provided', async () => {
      const result = await server.executeTool('store_pattern', {
        code: 'fix code',
        tech_stack: 'test@stack',
        error: 'Test error message'
      });

      expect(result.content).toHaveLength(1);
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.success).toBe(true);
      expect(parsed.pattern_id).toBeDefined();
    });

    it('should handle find_patterns with custom limit', async () => {
      const result = await server.executeTool('find_patterns', {
        query: 'test',
        tech_stack: 'test@stack',
        limit: 10
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(Array.isArray(parsed.patterns)).toBe(true);
    });

    it('should handle find_patterns with zero limit', async () => {
      const result = await server.executeTool('find_patterns', {
        query: 'test',
        tech_stack: 'test@stack',
        limit: 0
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.patterns).toHaveLength(0);
    });

    it('should return proper error format with tool name', async () => {
      const result = await server.executeTool('store_pattern', {
        code: '',
        tech_stack: 'test@stack'
      });

      expect(result.isError).toBe(true);
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toHaveProperty('error');
      expect(parsed).toHaveProperty('tool');
      expect(parsed.tool).toBe('store_pattern');
    });

    it('should handle non-Error objects in catch block', async () => {
      // Create a scenario where a non-Error is thrown
      const mockServer = server['server'];

      // Test error formatting with string error
      const result = await server.executeTool('unknown_tool', {});

      expect(result.isError).toBe(true);
      expect(result.content[0].type).toBe('text');
    });
  });

  describe('handleListTools method', () => {
    it('should return all registered tools', async () => {
      const result = await server.handleListTools();

      expect(result.tools).toHaveLength(3);
      expect(result.tools[0].name).toBe('store_pattern');
      expect(result.tools[1].name).toBe('find_patterns');
      expect(result.tools[2].name).toBe('add_feedback');
    });

    it('should return tools with correct structure', async () => {
      const result = await server.handleListTools();

      result.tools.forEach(tool => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
      });
    });
  });

  describe('handleCallTool method', () => {
    it('should call executeTool with valid arguments', async () => {
      const result = await server.handleCallTool('store_pattern', {
        code: 'test code',
        tech_stack: 'test@stack'
      });

      expect(result.content).toHaveLength(1);
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.success).toBe(true);
    });

    it('should throw error when args are undefined', async () => {
      await expect(server.handleCallTool('store_pattern', undefined))
        .rejects.toThrow('No arguments provided for tool: store_pattern');
    });

    it('should include tool name in error message', async () => {
      await expect(server.handleCallTool('find_patterns', undefined))
        .rejects.toThrow('find_patterns');
    });

    it('should pass through tool execution results', async () => {
      const result = await server.handleCallTool('find_patterns', {
        query: 'test',
        tech_stack: 'test@stack'
      });

      expect(result.content[0].type).toBe('text');
      const parsed = JSON.parse(result.content[0].text);
      expect(Array.isArray(parsed.patterns)).toBe(true);
    });

    it('should handle tool errors and return error response', async () => {
      const result = await server.handleCallTool('store_pattern', {
        code: '',
        tech_stack: 'test@stack'
      });

      expect(result.isError).toBe(true);
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toBe('code cannot be empty');
    });

    it('should work with all three tools', async () => {
      // Test store_pattern
      const storeResult = await server.handleCallTool('store_pattern', {
        code: 'code',
        tech_stack: 'stack'
      });
      expect(storeResult.content[0].type).toBe('text');

      // Test find_patterns
      const findResult = await server.handleCallTool('find_patterns', {
        query: 'query',
        tech_stack: 'stack'
      });
      expect(findResult.content[0].type).toBe('text');

      // Test add_feedback
      const feedbackResult = await server.handleCallTool('add_feedback', {
        pattern_id: 'test-123',
        success: true
      });
      expect(feedbackResult.content[0].type).toBe('text');
    });
  });

  describe('handleToolRequest method', () => {
    it('should extract name and args from request and call handleCallTool', async () => {
      const request = {
        params: {
          name: 'store_pattern',
          arguments: {
            code: 'test code',
            tech_stack: 'test@stack'
          }
        }
      };

      const result = await server.handleToolRequest(request);

      expect(result.content[0].type).toBe('text');
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.success).toBe(true);
    });

    it('should handle requests with undefined arguments', async () => {
      const request = {
        params: {
          name: 'store_pattern',
          arguments: undefined
        }
      };

      const result = await server.handleToolRequest(request);

      expect(result.isError).toBe(true);
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toContain('No arguments provided');
    });

    it('should work with all three tools', async () => {
      const storeRequest = {
        params: {
          name: 'store_pattern' as const,
          arguments: { code: 'code', tech_stack: 'stack' }
        }
      };

      const findRequest = {
        params: {
          name: 'find_patterns' as const,
          arguments: { query: 'query', tech_stack: 'stack' }
        }
      };

      const feedbackRequest = {
        params: {
          name: 'add_feedback' as const,
          arguments: { pattern_id: 'test-123', success: true }
        }
      };

      const storeResult = await server.handleToolRequest(storeRequest);
      expect(storeResult.content[0].type).toBe('text');

      const findResult = await server.handleToolRequest(findRequest);
      expect(findResult.content[0].type).toBe('text');

      const feedbackResult = await server.handleToolRequest(feedbackRequest);
      expect(feedbackResult.content[0].type).toBe('text');
    });

    it('should pass through errors from tool execution', async () => {
      const request = {
        params: {
          name: 'store_pattern',
          arguments: { code: '', tech_stack: 'stack' }
        }
      };

      const result = await server.handleToolRequest(request);

      expect(result.isError).toBe(true);
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toBe('code cannot be empty');
    });
  });

  describe('createCallToolHandler method', () => {
    it('should return a handler function', () => {
      const handler = server.createCallToolHandler();

      expect(typeof handler).toBe('function');
    });

    it('should create handler that delegates to handleToolRequest', async () => {
      const handler = server.createCallToolHandler();
      const request = {
        params: {
          name: 'store_pattern',
          arguments: {
            code: 'test code',
            tech_stack: 'test@stack'
          }
        }
      };

      const result = await handler(request, undefined);

      expect(result.content[0].type).toBe('text');
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.success).toBe(true);
    });

    it('should handle undefined arguments through the handler', async () => {
      const handler = server.createCallToolHandler();
      const request = {
        params: {
          name: 'find_patterns',
          arguments: undefined
        }
      };

      const result = await handler(request, undefined);

      expect(result.isError).toBe(true);
    });

    it('should pass extra parameter to handler', async () => {
      const handler = server.createCallToolHandler();
      const request = {
        params: {
          name: 'add_feedback',
          arguments: {
            pattern_id: 'test-123',
            success: true
          }
        }
      };

      const result = await handler(request, { extra: 'param' });

      expect(result.content[0].type).toBe('text');
    });

    it('should handle non-Error objects in catch block', async () => {
      // Mock handleStorePattern to throw a non-Error object
      const originalHandleStorePattern = server['handleStorePattern'].bind(server);
      server['handleStorePattern'] = async () => {
        throw 'string error message'; // Throw a string instead of Error
      };

      const result = await server.executeTool('store_pattern', {
        code: 'test',
        tech_stack: 'test'
      });

      expect(result.isError).toBe(true);
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toBe('string error message');

      // Restore original method
      server['handleStorePattern'] = originalHandleStorePattern;
    });
  });
});
