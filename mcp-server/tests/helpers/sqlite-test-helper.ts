import initSqlJs, { Database } from 'sql.js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * SQLite Test Helper
 * - Creates in-memory databases for isolated testing
 * - Loads test schema
 * - Provides utility methods
 */
export class SQLiteTestHelper {
  /**
   * Create in-memory database with schema loaded
   */
  static async createMemoryDB(): Promise<Database> {
    const SQL = await initSqlJs();
    const db = new SQL.Database();

    // Load schema
    const schemaPath = resolve(process.cwd(), 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    // Remove comments and split by semicolon
    const cleanedSchema = schema
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');

    const statements = cleanedSchema.split(';').filter(s => s.trim().length > 0);
    for (const statement of statements) {
      try {
        db.run(statement);
      } catch (error) {
        console.warn('[SQLiteTestHelper] Schema statement warning:', error);
      }
    }

    return db;
  }

  /**
   * Insert test pattern
   */
  static insertTestPattern(db: Database, pattern: {
    id: string;
    code: string;
    tech_stack: string;
    success_rate?: number;
  }): void {
    db.run(
      `INSERT INTO patterns (id, code, tech_stack, success_rate) VALUES (?, ?, ?, ?)`,
      [pattern.id, pattern.code, pattern.tech_stack, pattern.success_rate ?? 0.5]
    );
  }

  /**
   * Insert test error fix
   */
  static insertTestErrorFix(db: Database, fix: {
    id: string;
    error_message: string;
    fix_code: string;
    tech_stack: string;
    success_rate?: number;
  }): void {
    db.run(
      `INSERT INTO error_fixes (id, error_message, fix_code, tech_stack, success_rate) VALUES (?, ?, ?, ?, ?)`,
      [fix.id, fix.error_message, fix.fix_code, fix.tech_stack, fix.success_rate ?? 0.5]
    );
  }

  /**
   * Generate test embedding (384-dim vector)
   */
  static generateTestEmbedding(seed: number = 0): number[] {
    return Array.from({ length: 384 }, (_, i) => {
      // Simple deterministic generator
      return Math.sin(seed + i) * 0.5 + 0.5;
    });
  }

  /**
   * Generate similar embedding (for testing similarity search)
   */
  static generateSimilarEmbedding(base: number[], similarity: number = 0.8): number[] {
    // Add noise to reduce similarity
    return base.map((v, i) => {
      const noise = (Math.random() - 0.5) * (1 - similarity);
      return Math.max(0, Math.min(1, v + noise));
    });
  }
}
