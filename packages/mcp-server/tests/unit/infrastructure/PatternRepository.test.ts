import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Database } from 'sql.js';
import { PatternRepository } from '../../../src/infrastructure/PatternRepository.js';
import { SQLiteTestHelper } from '../../helpers/sqlite-test-helper.js';
import { FixtureBuilder } from '../../helpers/fixture-builder.js';

describe('PatternRepository', () => {
  let db: Database;
  let repository: PatternRepository;

  beforeEach(async () => {
    db = await SQLiteTestHelper.createMemoryDB();
    repository = new PatternRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('insert', () => {
    it('should insert a pattern successfully', async () => {
      const pattern = FixtureBuilder.createPattern();

      await repository.insert(pattern);

      const result = db.exec(`SELECT * FROM patterns WHERE id = '${pattern.id}'`);
      expect(result.length).toBeGreaterThan(0);

      const { columns, values } = result[0];
      const codeIdx = columns.indexOf('code');
      const techStackIdx = columns.indexOf('tech_stack');
      const successRateIdx = columns.indexOf('success_rate');

      expect(values[0][codeIdx]).toBe(pattern.code);
      expect(values[0][techStackIdx]).toBe(pattern.tech_stack);
      expect(values[0][successRateIdx]).toBe(pattern.success_rate);
    });

    it('should handle multiple inserts', async () => {
      const patterns = FixtureBuilder.createPatternBatch(3);

      for (const pattern of patterns) {
        await repository.insert(pattern);
      }

      const result = db.exec('SELECT COUNT(*) as count FROM patterns');
      const count = result[0].values[0][0] as number;
      expect(count).toBe(3);
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      // Insert test data
      const patterns = [
        FixtureBuilder.createPattern({
          id: 'pattern-1',
          tech_stack: 'next.js@14+typescript',
          success_rate: 0.9
        }),
        FixtureBuilder.createPattern({
          id: 'pattern-2',
          tech_stack: 'next.js@14+typescript',
          success_rate: 0.7
        }),
        FixtureBuilder.createPattern({
          id: 'pattern-3',
          tech_stack: 'react@18+javascript',
          success_rate: 0.8
        })
      ];

      for (const pattern of patterns) {
        await repository.insert(pattern);
      }
    });

    it('should return patterns filtered by tech_stack', async () => {
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

    it('should return empty array when no patterns exist for tech_stack', async () => {
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
      const pattern = FixtureBuilder.createPattern({
        id: 'test-pattern',
        success_rate: 0.5
      });
      await repository.insert(pattern);

      await repository.updateSuccessRate('test-pattern', true);

      const result = db.exec(`SELECT success_rate FROM patterns WHERE id = 'test-pattern'`);
      const newRate = result[0].values[0][0] as number;

      // new_rate = 0.9 * 0.5 + 0.1 * 1 = 0.55
      expect(newRate).toBeCloseTo(0.55, 5);
    });

    it('should decrease success rate for negative feedback', async () => {
      const pattern = FixtureBuilder.createPattern({
        id: 'test-pattern',
        success_rate: 0.5
      });
      await repository.insert(pattern);

      await repository.updateSuccessRate('test-pattern', false);

      const result = db.exec(`SELECT success_rate FROM patterns WHERE id = 'test-pattern'`);
      const newRate = result[0].values[0][0] as number;

      // new_rate = 0.9 * 0.5 + 0.1 * 0 = 0.45
      expect(newRate).toBeCloseTo(0.45, 5);
    });

    it('should handle multiple updates correctly', async () => {
      const pattern = FixtureBuilder.createPattern({
        id: 'test-pattern',
        success_rate: 0.5
      });
      await repository.insert(pattern);

      await repository.updateSuccessRate('test-pattern', true);
      await repository.updateSuccessRate('test-pattern', true);
      await repository.updateSuccessRate('test-pattern', false);

      const result = db.exec(`SELECT success_rate FROM patterns WHERE id = 'test-pattern'`);
      const finalRate = result[0].values[0][0] as number;

      // After two positive and one negative: should be higher than initial
      expect(finalRate).toBeGreaterThan(0.5);
    });
  });

  describe('edge cases', () => {
    it('should handle empty code string', async () => {
      const pattern = FixtureBuilder.createPattern({ code: '' });
      await repository.insert(pattern);

      const result = db.exec(`SELECT code FROM patterns WHERE id = '${pattern.id}'`);
      expect(result[0].values[0][0]).toBe('');
    });

    it('should handle special characters in code', async () => {
      const code = 'const test = "hello \'world\'"; // comment\n/* multi\nline\ncomment */';
      const pattern = FixtureBuilder.createPattern({ code });
      await repository.insert(pattern);

      const result = db.exec(`SELECT code FROM patterns WHERE id = '${pattern.id}'`);
      expect(result[0].values[0][0]).toBe(code);
    });

    it('should handle very long tech stack strings', async () => {
      const techStack = 'a'.repeat(1000);
      const pattern = FixtureBuilder.createPattern({ tech_stack: techStack });
      await repository.insert(pattern);

      const result = db.exec(`SELECT tech_stack FROM patterns WHERE id = '${pattern.id}'`);
      expect(result[0].values[0][0]).toBe(techStack);
    });
  });
});
