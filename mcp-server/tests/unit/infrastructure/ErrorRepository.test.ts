import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Database } from 'sql.js';
import { ErrorRepository } from '../../../src/infrastructure/ErrorRepository.js';
import { SQLiteTestHelper } from '../../helpers/sqlite-test-helper.js';
import { FixtureBuilder } from '../../helpers/fixture-builder.js';

describe('ErrorRepository', () => {
  let db: Database;
  let repository: ErrorRepository;

  beforeEach(async () => {
    db = await SQLiteTestHelper.createMemoryDB();
    repository = new ErrorRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('insert', () => {
    it('should insert an error fix successfully', async () => {
      const errorFix = FixtureBuilder.createErrorFix();

      await repository.insert(errorFix);

      const result = db.exec(`SELECT * FROM error_fixes WHERE id = '${errorFix.id}'`);
      expect(result.length).toBeGreaterThan(0);

      const { columns, values } = result[0];
      const errorMsgIdx = columns.indexOf('error_message');
      const fixCodeIdx = columns.indexOf('fix_code');
      const techStackIdx = columns.indexOf('tech_stack');
      const successRateIdx = columns.indexOf('success_rate');

      expect(values[0][errorMsgIdx]).toBe(errorFix.error_message);
      expect(values[0][fixCodeIdx]).toBe(errorFix.fix_code);
      expect(values[0][techStackIdx]).toBe(errorFix.tech_stack);
      expect(values[0][successRateIdx]).toBe(errorFix.success_rate);
    });

    it('should handle multiple inserts', async () => {
      const errorFixes = FixtureBuilder.createErrorFixBatch(3);

      for (const errorFix of errorFixes) {
        await repository.insert(errorFix);
      }

      const result = db.exec('SELECT COUNT(*) as count FROM error_fixes');
      const count = result[0].values[0][0] as number;
      expect(count).toBe(3);
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      // Insert test data
      const errorFixes = [
        FixtureBuilder.createErrorFix({
          id: 'error-1',
          tech_stack: 'next.js@14+typescript',
          success_rate: 0.9
        }),
        FixtureBuilder.createErrorFix({
          id: 'error-2',
          tech_stack: 'next.js@14+typescript',
          success_rate: 0.7
        }),
        FixtureBuilder.createErrorFix({
          id: 'error-3',
          tech_stack: 'react@18+javascript',
          success_rate: 0.8
        })
      ];

      for (const errorFix of errorFixes) {
        await repository.insert(errorFix);
      }
    });

    it('should return error fixes filtered by tech_stack', async () => {
      const embedding = SQLiteTestHelper.generateTestEmbedding();

      const results = await repository.search(embedding, 'next.js@14+typescript', 10);

      expect(results).toHaveLength(2);
      expect(results.every(r => r.tech_stack === 'next.js@14+typescript')).toBe(true);
    });

    it('should limit results', async () => {
      const embedding = SQLiteTestHelper.generateTestEmbedding();

      const results = await repository.search(embedding, 'next.js@14+typescript', 1);

      expect(results).toHaveLength(1);
    });

    it('should return empty array when no error fixes exist for tech_stack', async () => {
      const embedding = SQLiteTestHelper.generateTestEmbedding();

      const results = await repository.search(embedding, 'vue@3+typescript', 10);

      expect(results).toEqual([]);
    });

    it('should sort by success_rate descending', async () => {
      const embedding = SQLiteTestHelper.generateTestEmbedding();

      const results = await repository.search(embedding, 'next.js@14+typescript', 10);

      expect(results[0].success_rate).toBeGreaterThan(results[1].success_rate);
    });
  });

  describe('updateSuccessRate', () => {
    it('should update success rate using exponential moving average', async () => {
      const errorFix = FixtureBuilder.createErrorFix({
        id: 'test-error',
        success_rate: 0.5
      });
      await repository.insert(errorFix);

      await repository.updateSuccessRate('test-error', true);

      const result = db.exec(`SELECT success_rate FROM error_fixes WHERE id = 'test-error'`);
      const newRate = result[0].values[0][0] as number;

      // new_rate = 0.9 * 0.5 + 0.1 * 1 = 0.55
      expect(newRate).toBeCloseTo(0.55, 5);
    });

    it('should decrease success rate for negative feedback', async () => {
      const errorFix = FixtureBuilder.createErrorFix({
        id: 'test-error',
        success_rate: 0.5
      });
      await repository.insert(errorFix);

      await repository.updateSuccessRate('test-error', false);

      const result = db.exec(`SELECT success_rate FROM error_fixes WHERE id = 'test-error'`);
      const newRate = result[0].values[0][0] as number;

      // new_rate = 0.9 * 0.5 + 0.1 * 0 = 0.45
      expect(newRate).toBeCloseTo(0.45, 5);
    });

    it('should handle multiple updates correctly', async () => {
      const errorFix = FixtureBuilder.createErrorFix({
        id: 'test-error',
        success_rate: 0.5
      });
      await repository.insert(errorFix);

      await repository.updateSuccessRate('test-error', true);
      await repository.updateSuccessRate('test-error', true);
      await repository.updateSuccessRate('test-error', false);

      const result = db.exec(`SELECT success_rate FROM error_fixes WHERE id = 'test-error'`);
      const finalRate = result[0].values[0][0] as number;

      // After two positive and one negative: should be higher than initial
      expect(finalRate).toBeGreaterThan(0.5);
    });
  });

  describe('edge cases', () => {
    it('should handle empty error message', async () => {
      const errorFix = FixtureBuilder.createErrorFix({ error_message: '' });
      await repository.insert(errorFix);

      const result = db.exec(`SELECT error_message FROM error_fixes WHERE id = '${errorFix.id}'`);
      expect(result[0].values[0][0]).toBe('');
    });

    it('should handle special characters in fix code', async () => {
      const fixCode = 'const test = "hello \'world\'"; // comment\n/* multi\nline\ncomment */';
      const errorFix = FixtureBuilder.createErrorFix({ fix_code: fixCode });
      await repository.insert(errorFix);

      const result = db.exec(`SELECT fix_code FROM error_fixes WHERE id = '${errorFix.id}'`);
      expect(result[0].values[0][0]).toBe(fixCode);
    });

    it('should handle very long error messages', async () => {
      const errorMessage = 'Error: ' + 'x'.repeat(1000);
      const errorFix = FixtureBuilder.createErrorFix({ error_message: errorMessage });
      await repository.insert(errorFix);

      const result = db.exec(`SELECT error_message FROM error_fixes WHERE id = '${errorFix.id}'`);
      expect(result[0].values[0][0]).toBe(errorMessage);
    });
  });
});
