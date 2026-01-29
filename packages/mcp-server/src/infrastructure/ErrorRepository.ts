import type { Database } from 'sql.js';
import { ErrorFix, IErrorRepository } from '../types/index.js';

/**
 * Error Repository
 * - Stores and retrieves error → fix mappings
 * - Text-based similarity search (sorted by success_rate)
 * - Exponential moving average for success rate
 */
export class ErrorRepository implements IErrorRepository {
  constructor(private db: Database) {}

  /**
   * Insert error fix into database
   */
  async insert(fix: ErrorFix): Promise<void> {
    this.db.run(
      `INSERT INTO error_fixes (id, error_message, fix_code, tech_stack, success_rate) VALUES (?, ?, ?, ?, ?)`,
      [fix.id, fix.error_message, fix.fix_code, fix.tech_stack, fix.success_rate]
    );
  }

  /**
   * Search for similar error fixes using text-based similarity
   */
  async search(_queryEmbedding: number[], techStack: string, limit: number): Promise<ErrorFix[]> {
    const result = this.db.exec(
      `SELECT id, error_message, fix_code, tech_stack, success_rate FROM error_fixes WHERE tech_stack = ? ORDER BY success_rate DESC LIMIT ?`,
      [techStack, limit]
    );

    if (result.length === 0) {
      return [];
    }

    const { columns, values } = result[0];
    const idIdx = columns.indexOf('id');
    const errorMsgIdx = columns.indexOf('error_message');
    const fixCodeIdx = columns.indexOf('fix_code');
    const techStackIdx = columns.indexOf('tech_stack');
    const successRateIdx = columns.indexOf('success_rate');

    return values.map(row => ({
      id: row[idIdx] as string,
      error_message: row[errorMsgIdx] as string,
      fix_code: row[fixCodeIdx] as string,
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
      `UPDATE error_fixes SET success_rate = success_rate * 0.9 + ? * 0.1 WHERE id = ?`,
      [success ? 1 : 0, id]
    );
  }
}
