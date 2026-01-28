import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';
import { randomUUID } from 'crypto';
import {
  IPatternRepository,
  IErrorRepository,
  IEmbeddingService,
  StorePatternInput,
  FindPatternsInput,
  AddFeedbackInput,
  StorePatternOutput,
  FindPatternsOutput,
  AddFeedbackOutput,
  PatternResult
} from '../types/index.js';

/**
 * MCP Server for agentful Pattern Learning
 * - 6 tools: store_pattern, find_patterns, add_feedback, get_canvas_state, get_element_context, broadcast_canvas
 * - Unified storage for patterns and error fixes
 * - Canvas state management for visual editor
 * - Graceful error handling
 */
export class AgentfulMCPServer {
  private server: Server;
  private tools: Tool[] = [];
  private degradedMode: boolean;

  constructor(
    private patternRepo: IPatternRepository | null,
    private errorRepo: IErrorRepository | null,
    private embeddingService: IEmbeddingService | null
  ) {
    // Check if we're in degraded mode (no database)
    this.degradedMode = !patternRepo || !errorRepo || !embeddingService;

    this.server = new Server(
      {
        name: 'agentful-pattern-server',
        version: this.degradedMode ? '2.0.0-degraded' : '2.0.0'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    this.registerTools();
    this.setupHandlers();
  }

  /**
   * Register MCP tools
   */
  private registerTools(): void {
    this.tools = [
      {
        name: 'store_pattern',
        description: 'Store a successful code pattern or error fix for future reuse',
        inputSchema: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'The code pattern or fix code to store'
            },
            tech_stack: {
              type: 'string',
              description: 'Tech stack identifier (e.g., "next.js@14+typescript")'
            },
            error: {
              type: 'string',
              description: 'Optional: If provided, stores as error fix mapping from error to fix code'
            }
          },
          required: ['code', 'tech_stack']
        }
      },
      {
        name: 'find_patterns',
        description: 'Find similar patterns or error fixes by semantic similarity',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Query text to search for similar patterns'
            },
            tech_stack: {
              type: 'string',
              description: 'Tech stack filter (e.g., "next.js@14+typescript")'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results to return',
              default: 5
            }
          },
          required: ['query', 'tech_stack']
        }
      },
      {
        name: 'add_feedback',
        description: 'Update success rate for a pattern or error fix',
        inputSchema: {
          type: 'object',
          properties: {
            pattern_id: {
              type: 'string',
              description: 'ID of the pattern or error fix'
            },
            success: {
              type: 'boolean',
              description: 'Whether the pattern was successful (true) or not (false)'
            }
          },
          required: ['pattern_id', 'success']
        }
      },
      {
        name: 'get_canvas_state',
        description: 'Get current canvas state for a project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'Project identifier'
            }
          },
          required: ['projectId']
        }
      },
      {
        name: 'get_element_context',
        description: 'Get specific element context from canvas',
        inputSchema: {
          type: 'object',
          properties: {
            elementId: {
              type: 'string',
              description: 'Element identifier'
            }
          },
          required: ['elementId']
        }
      },
      {
        name: 'broadcast_canvas',
        description: 'Broadcast canvas changes to connected clients',
        inputSchema: {
          type: 'object',
          properties: {
            canvasState: {
              type: 'object',
              description: 'Current canvas state to broadcast'
            }
          },
          required: ['canvasState']
        }
      }
    ];
  }

  /**
   * Setup request handlers
   */
  private setupHandlers(): void {
    // List tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => this.handleListTools());

    // Call tool
    this.server.setRequestHandler(CallToolRequestSchema, this.createCallToolHandler());
  }

  /**
   * Check if server is in degraded mode (no database available)
   */
  private isDegradedMode(): boolean {
    return this.degradedMode;
  }

  /**
   * Create call tool handler (extracted for testing)
   */
  createCallToolHandler(): (request: { params: { name: string; arguments?: Record<string, unknown> } }, _extra: unknown) => Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }> {
    return async (request, _extra) => {
      return this.handleToolRequest(request);
    };
  }

  /**
   * Handle tool request (extracted for testing)
   */
  async handleToolRequest(request: { params: { name: string; arguments?: Record<string, unknown> } }): Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }> {
    try {
      const { name, arguments: args } = request.params;
      return await this.handleCallTool(name, args);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: errorMessage,
            tool: request.params.name
          })
        }],
        isError: true
      };
    }
  }

  /**
   * Handle list tools request (public for testing)
   */
  async handleListTools(): Promise<{ tools: Tool[] }> {
    return { tools: this.tools };
  }

  /**
   * Handle call tool request (public for testing)
   */
  async handleCallTool(name: string, args: Record<string, unknown> | undefined): Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }> {
    if (!args) {
      throw new Error(`No arguments provided for tool: ${name}`);
    }

    return this.executeTool(name, args);
  }

  /**
   * Execute tool (public method for testing)
   */
  async executeTool(name: string, args: Record<string, unknown>): Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }> {
    try {
      switch (name) {
        case 'store_pattern': {
          const input = this.validateStorePatternInput(args);
          const result = await this.handleStorePattern(input);
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(result)
            }]
          };
        }

        case 'find_patterns': {
          const input = this.validateFindPatternsInput(args);
          const result = await this.handleFindPatterns(input);
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(result)
            }]
          };
        }

        case 'add_feedback': {
          const input = this.validateAddFeedbackInput(args);
          const result = await this.handleAddFeedback(input);
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(result)
            }]
          };
        }

        case 'get_canvas_state': {
          const result = await this.handleGetCanvasState(args);
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(result)
            }]
          };
        }

        case 'get_element_context': {
          const result = await this.handleGetElementContext(args);
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(result)
            }]
          };
        }

        case 'broadcast_canvas': {
          const result = await this.handleBroadcastCanvas(args);
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(result)
            }]
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: errorMessage,
            tool: name
          })
        }],
        isError: true
      };
    }
  }

  /**
   * Handle store_pattern tool
   */
  private async handleStorePattern(input: StorePatternInput): Promise<StorePatternOutput> {
    // Check degraded mode
    if (this.isDegradedMode()) {
      throw new Error('Database not available in degraded mode. Please ensure sql.js WASM files are properly configured.');
    }

    const { code, tech_stack, error } = input;

    // Validate input
    if (!code || code.trim().length === 0) {
      throw new Error('code cannot be empty');
    }
    if (!tech_stack || tech_stack.trim().length === 0) {
      throw new Error('tech_stack cannot be empty');
    }

    // Generate embedding (currently unused due to simplified text-based search)
    await this.embeddingService!.embed(error || code);
    const id = randomUUID();

    if (error) {
      // Store as error fix
      await this.errorRepo!.insert({
        id,
        error_message: error,
        fix_code: code,
        tech_stack,
        success_rate: 0.5
      });
    } else {
      // Store as pattern
      await this.patternRepo!.insert({
        id,
        code,
        tech_stack,
        success_rate: 0.5
      });
    }

    return {
      pattern_id: id,
      success: true
    };
  }

  /**
   * Handle find_patterns tool
   */
  private async handleFindPatterns(input: FindPatternsInput): Promise<FindPatternsOutput> {
    // Check degraded mode
    if (this.isDegradedMode()) {
      throw new Error('Database not available in degraded mode. Please ensure sql.js WASM files are properly configured.');
    }

    const { query, tech_stack, limit = 5 } = input;

    // Validate input
    if (!query || query.trim().length === 0) {
      throw new Error('query cannot be empty');
    }
    if (!tech_stack || tech_stack.trim().length === 0) {
      throw new Error('tech_stack cannot be empty');
    }

    // Generate embedding for query
    const embedding = await this.embeddingService!.embed(query);

    // Search both repositories in parallel
    const [patterns, errorFixes] = await Promise.all([
      this.patternRepo!.search(embedding, tech_stack, limit),
      this.errorRepo!.search(embedding, tech_stack, limit)
    ]);

    // Merge and rank by success_rate
    const results: PatternResult[] = [
      ...patterns.map(p => ({
        id: p.id,
        type: 'pattern' as const,
        code: p.code,
        success_rate: p.success_rate,
        tech_stack: p.tech_stack
      })),
      ...errorFixes.map(e => ({
        id: e.id,
        type: 'error_fix' as const,
        code: e.fix_code,
        success_rate: e.success_rate,
        tech_stack: e.tech_stack
      }))
    ].sort((a, b) => b.success_rate - a.success_rate)
      .slice(0, limit);

    return { patterns: results };
  }

  /**
   * Handle add_feedback tool
   */
  private async handleAddFeedback(input: AddFeedbackInput): Promise<AddFeedbackOutput> {
    // Check degraded mode
    if (this.isDegradedMode()) {
      throw new Error('Database not available in degraded mode. Please ensure sql.js WASM files are properly configured.');
    }

    const { pattern_id, success } = input;

    // Validate input
    if (!pattern_id || pattern_id.trim().length === 0) {
      throw new Error('pattern_id cannot be empty');
    }

    // Try updating in pattern repository
    try {
      await this.patternRepo!.updateSuccessRate(pattern_id, success);
      return {
        updated: true
      };
    } catch (patternError) {
      // If not found in patterns, try error fixes
      try {
        await this.errorRepo!.updateSuccessRate(pattern_id, success);
        return {
          updated: true
        };
      } catch (errorError) {
        throw new Error(`Pattern not found: ${pattern_id}`);
      }
    }
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    if (process.env.AGENTFUL_LOG_LEVEL === 'debug') {
      console.error('[MCP Server] Started successfully');
    }
  }

  /**
   * Stop the MCP server
   */
  async stop(): Promise<void> {
    await this.server.close();
  }

  /**
   * Handle get_canvas_state tool
   */
  private async handleGetCanvasState(args: Record<string, unknown>): Promise<{
    elements: unknown[];
    selectedElement: unknown;
    theme: unknown;
  }> {
    const { projectId } = args;

    if (typeof projectId !== 'string') {
      throw new Error('projectId must be a string');
    }

    // TODO: Implement actual canvas state retrieval
    return {
      elements: [],
      selectedElement: null,
      theme: null
    };
  }

  /**
   * Handle get_element_context tool
   */
  private async handleGetElementContext(args: Record<string, unknown>): Promise<{
    element: unknown;
    props: unknown;
    styles: unknown;
    position: unknown;
  }> {
    const { elementId } = args;

    if (typeof elementId !== 'string') {
      throw new Error('elementId must be a string');
    }

    // TODO: Implement actual element context retrieval
    return {
      element: null,
      props: {},
      styles: {},
      position: null
    };
  }

  /**
   * Handle broadcast_canvas tool
   */
  private async handleBroadcastCanvas(args: Record<string, unknown>): Promise<{
    success: boolean;
  }> {
    const { canvasState } = args;

    if (!canvasState || typeof canvasState !== 'object') {
      throw new Error('canvasState must be an object');
    }

    // TODO: Implement actual canvas broadcasting
    return {
      success: true
    };
  }

  /**
   * Validate store_pattern input
   */
  private validateStorePatternInput(args: Record<string, unknown>): StorePatternInput {
    if (typeof args.code !== 'string') {
      throw new Error('code must be a string');
    }
    if (typeof args.tech_stack !== 'string') {
      throw new Error('tech_stack must be a string');
    }
    return {
      code: args.code,
      tech_stack: args.tech_stack,
      error: typeof args.error === 'string' ? args.error : undefined
    };
  }

  /**
   * Validate find_patterns input
   */
  private validateFindPatternsInput(args: Record<string, unknown>): FindPatternsInput {
    if (typeof args.query !== 'string') {
      throw new Error('query must be a string');
    }
    if (typeof args.tech_stack !== 'string') {
      throw new Error('tech_stack must be a string');
    }
    return {
      query: args.query,
      tech_stack: args.tech_stack,
      limit: typeof args.limit === 'number' ? args.limit : 5
    };
  }

  /**
   * Validate add_feedback input
   */
  private validateAddFeedbackInput(args: Record<string, unknown>): AddFeedbackInput {
    if (typeof args.pattern_id !== 'string') {
      throw new Error('pattern_id must be a string');
    }
    if (typeof args.success !== 'boolean') {
      throw new Error('success must be a boolean');
    }
    return {
      pattern_id: args.pattern_id,
      success: args.success
    };
  }
}
