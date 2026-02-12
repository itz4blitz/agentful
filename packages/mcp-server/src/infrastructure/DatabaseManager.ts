import initSqlJs, { Database } from 'sql.js';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { IDatabaseManager } from '../types/index.js';

// Get the directory of the current module
const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Database Manager
 * - Singleton pattern for connection management
 * - Schema migration support
 * - Uses sql.js (pure JavaScript, no native compilation)
 */
export class DatabaseManager implements IDatabaseManager {
  private static instance: DatabaseManager | null = null;
  private db: Database | null = null;

  private constructor() {}

  /**
   * Resolve sql.js WASM path for both built and test/runtime contexts.
   */
  private resolveWasmPath(file: string): string {
    const candidates = [
      // Built runtime: dist/infrastructure/sql-wasm.wasm
      resolve(__dirname, file),
      // Test runtime from src: packages/mcp-server/node_modules/sql.js/dist/sql-wasm.wasm
      resolve(__dirname, '../../node_modules/sql.js/dist', file),
      // Fallback when cwd is package root
      resolve(process.cwd(), 'node_modules/sql.js/dist', file),
      // Fallback when cwd is monorepo root
      resolve(process.cwd(), 'packages/mcp-server/node_modules/sql.js/dist', file)
    ];

    const match = candidates.find(candidate => existsSync(candidate));
    return match ?? resolve(__dirname, file);
  }

  /**
   * Get singleton instance
   */
  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * Get database connection
   */
  async getConnection(): Promise<Database> {
    if (!this.db) {
      const SQL = await initSqlJs({
        locateFile: (file: string) => this.resolveWasmPath(file)
      });
      this.db = new SQL.Database();
    }
    return this.db;
  }

  /**
   * Run schema migrations
   */
  async migrate(): Promise<void> {
    const db = await this.getConnection();

    // Check if migrations table exists
    const result = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='schema_migrations'");

    if (result.length === 0 || result[0].values.length === 0) {
      // First time setup - load schema
      // Look in dist directory (where compiled code runs) and project root
      let schemaPath = resolve(__dirname, '../schema.sql');
      if (!existsSync(schemaPath)) {
        schemaPath = resolve(process.cwd(), 'schema.sql');
      }
      if (!existsSync(schemaPath)) {
        throw new Error(`Schema file not found at ${schemaPath}`);
      }
      const schema = readFileSync(schemaPath, 'utf-8');

      // Execute schema line by line
      const statements = schema.split(';').filter(s => s.trim().length > 0);
      for (const statement of statements) {
        try {
          db.run(statement);
        } catch (error) {
          console.warn('[DatabaseManager] Schema statement warning:', error);
        }
      }
    }
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Reset singleton (for testing)
   */
  static reset(): void {
    if (DatabaseManager.instance) {
      DatabaseManager.instance.close();
      DatabaseManager.instance = null;
    }
  }
}
