import type { Database } from 'sql.js';
import { CodePattern, IPatternRepository } from '../types/index.js';

/**
 * Pattern Repository
 * - Stores and retrieves code patterns
 * - Text-based similarity search (sorted by success_rate)
 * - Exponential moving average for success rate
 */
export class PatternRepository implements IPatternRepository {
  constructor(private db: Database) {}

  /**
   * Insert pattern into database
   */
  async insert(pattern: CodePattern): Promise<void> {
    this.db.run(
      `INSERT INTO patterns (id, code, tech_stack, success_rate) VALUES (?, ?, ?, ?)`,
      [pattern.id, pattern.code, pattern.tech_stack, pattern.success_rate]
    );
  }

  /**
   * Search for similar patterns using text-based similarity
   */
  async search(_queryEmbedding: number[], techStack: string, limit: number): Promise<CodePattern[]> {
    const result = this.db.exec(
      `SELECT id, code, tech_stack, success_rate FROM patterns WHERE tech_stack = ? ORDER BY success_rate DESC LIMIT ?`,
      [techStack, limit]
    );

    if (result.length === 0) {
      return [];
    }

    const { columns, values } = result[0];
    const idIdx = columns.indexOf('id');
    const codeIdx = columns.indexOf('code');
    const techStackIdx = columns.indexOf('tech_stack');
    const successRateIdx = columns.indexOf('success_rate');

    return values.map(row => ({
      id: row[idIdx] as string,
      code: row[codeIdx] as string,
      tech_stack: row[techStackIdx] as string,
      success_rate: row[successRateIdx] as number
    }));
  }

  /**
   * Update success rate using exponential moving average
   * new_rate = 0.9 * old_rate + 0.1 * new_value
   */
  async updateSuccessRate(id: string, success: boolean): Promise<void> {
    this.db.run(
      `UPDATE patterns SET success_rate = success_rate * 0.9 + ? * 0.1 WHERE id = ?`,
      [success ? 1 : 0, id]
    );
  }
}
