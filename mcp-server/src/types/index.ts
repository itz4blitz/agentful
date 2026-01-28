/**
 * MCP Vector DB Type Definitions
 * Minimal design: 2 data models, 2 repository interfaces, 1 service interface
 */

/**
 * Successful code pattern stored for reuse
 */
export interface CodePattern {
  id: string;
  code: string;
  tech_stack: string;        // e.g., "next.js@14+typescript"
  success_rate: number;      // 0.0 to 1.0
}

/**
 * Error → fix mapping stored for error resolution
 */
export interface ErrorFix {
  id: string;
  error_message: string;
  fix_code: string;
  tech_stack: string;        // e.g., "next.js@14+typescript"
  success_rate: number;      // 0.0 to 1.0
}

/**
 * Combined result from pattern search (used by MCP tool)
 */
export interface PatternResult {
  id: string;
  type: 'pattern' | 'error_fix';
  code: string;              // fix_code for error_fix, code for pattern
  success_rate: number;
  tech_stack: string;
  distance?: number;         // Optional: similarity distance
}

/**
 * Pattern repository interface
 */
export interface IPatternRepository {
  insert(pattern: CodePattern): Promise<void>;
  search(queryEmbedding: number[], techStack: string, limit: number): Promise<CodePattern[]>;
  updateSuccessRate(id: string, success: boolean): Promise<void>;
}

/**
 * Error repository interface
 */
export interface IErrorRepository {
  insert(fix: ErrorFix): Promise<void>;
  search(queryEmbedding: number[], techStack: string, limit: number): Promise<ErrorFix[]>;
  updateSuccessRate(id: string, success: boolean): Promise<void>;
}

/**
 * Embedding service interface
 */
export interface IEmbeddingService {
  embed(text: string): Promise<number[]>;
}

/**
 * Database manager interface
 */
export interface IDatabaseManager {
  getConnection(): Promise<import('sql.js').Database>;
  migrate(): Promise<void>;
  close(): void;
}

/**
 * MCP tool input schemas
 */
export interface StorePatternInput {
  code: string;
  tech_stack: string;
  error?: string;  // If present, stores as ErrorFix; otherwise CodePattern
}

export interface FindPatternsInput {
  query: string;
  tech_stack: string;
  limit?: number;
}

export interface AddFeedbackInput {
  pattern_id: string;
  success: boolean;
}

/**
 * MCP tool output schemas
 */
export interface StorePatternOutput {
  pattern_id: string;
  success: boolean;
}

export interface FindPatternsOutput {
  patterns: PatternResult[];
}

export interface AddFeedbackOutput {
  updated: boolean;
  success_rate?: number;
}
