import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  validateStateFile,
  validateState,
  validateCompletion,
  validateDecisions,
  validateArchitecture,
  validateProduct,
  validateBatch,
  getErrorMessage,
  getSuggestedAction,
  ValidationActions,
  schemas
} from '../../lib/validation.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testDir = path.join(__dirname, 'test-validation-temp');

/**
 * Validation Library Tests
 *
 * Tests the centralized validation library for state files
 */
describe('Validation Library', () => {
  beforeEach(() => {
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('validateStateFile - missing files', () => {
    it('should return missing action when file does not exist', () => {
      const result = validateStateFile(
        path.join(testDir, 'nonexistent.json'),
        'state'
      );

      expect(result.valid).toBe(false);
      expect(result.action).toBe('missing');
      expect(result.error).toContain('File not found');
    });
  });

  describe('validateStateFile - corrupted files', () => {
    it('should return corrupted action for invalid JSON', () => {
      const filePath = path.join(testDir, 'corrupted.json');
      fs.writeFileSync(filePath, '{ invalid json ]');

      const result = validateStateFile(filePath, 'state');

      expect(result.valid).toBe(false);
      expect(result.action).toBe('corrupted');
      expect(result.error).toContain('Invalid JSON');
    });

    it('should return corrupted action for empty file', () => {
      const filePath = path.join(testDir, 'empty.json');
      fs.writeFileSync(filePath, '');

      const result = validateStateFile(filePath, 'state');

      expect(result.valid).toBe(false);
      expect(result.action).toBe('corrupted');
    });
  });

  describe('validateStateFile - invalid schema', () => {
    it('should return invalid action when schema validation fails', () => {
      const filePath = path.join(testDir, 'invalid-schema.json');
      fs.writeFileSync(filePath, JSON.stringify({
        initialized: 'not-a-date',
        version: '1.0.0',
        agents: [],
        skills: []
      }));

      const result = validateStateFile(filePath, 'state');

      expect(result.valid).toBe(false);
      expect(result.action).toBe('invalid');
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should return invalid action for wrong data types', () => {
      const filePath = path.join(testDir, 'wrong-types.json');
      fs.writeFileSync(filePath, JSON.stringify({
        initialized: new Date().toISOString(),
        version: '1.0.0',
        agents: 'not-an-array',
        skills: []
      }));

      const result = validateStateFile(filePath, 'state');

      expect(result.valid).toBe(false);
      expect(result.action).toBe('invalid');
    });
  });

  describe('validateStateFile - incomplete files', () => {
    it('should return incomplete action when required fields are missing', () => {
      const filePath = path.join(testDir, 'incomplete.json');
      fs.writeFileSync(filePath, JSON.stringify({
        initialized: new Date().toISOString(),
        version: '1.0.0',
        agents: [],
        skills: []
      }));

      const result = validateStateFile(filePath, 'state', ['custom_field']);

      expect(result.valid).toBe(false);
      expect(result.action).toBe('incomplete');
      expect(result.missing_field).toBe('custom_field');
    });
  });

  describe('validateStateFile - valid files', () => {
    it('should validate correct state.json', () => {
      const filePath = path.join(testDir, 'valid-state.json');
      const validState = {
        initialized: new Date().toISOString(),
        version: '1.0.0',
        agents: ['frontend', 'backend'],
        skills: ['react', 'nodejs']
      };
      fs.writeFileSync(filePath, JSON.stringify(validState));

      const result = validateStateFile(filePath, 'state');

      expect(result.valid).toBe(true);
      expect(result.content).toEqual(validState);
      expect(result.action).toBeUndefined();
    });
  });

  describe('validateState helper', () => {
    it('should validate state.json with custom non-existent path', () => {
      const filePath = path.join(testDir, 'nonexistent-state.json');
      const result = validateState(filePath);

      // Since file doesn't exist, should return missing
      expect(result.valid).toBe(false);
      expect(result.action).toBe('missing');
    });

    it('should accept custom path and additional fields', () => {
      const filePath = path.join(testDir, 'custom-state.json');
      const validState = {
        initialized: new Date().toISOString(),
        version: '1.0.0',
        agents: [],
        skills: [],
        custom_field: 'value'
      };
      fs.writeFileSync(filePath, JSON.stringify(validState));

      const result = validateState(filePath, ['custom_field']);

      expect(result.valid).toBe(true);
      expect(result.content.custom_field).toBe('value');
    });
  });

  describe('validateCompletion helper', () => {
    it('should validate completion.json structure', () => {
      const filePath = path.join(testDir, 'completion.json');
      const validCompletion = {
        agents: {
          frontend: { completed: true, progress: 100 },
          backend: { completed: false, progress: 50 }
        },
        skills: {
          react: { completed: true, progress: 100 }
        },
        lastUpdated: new Date().toISOString()
      };
      fs.writeFileSync(filePath, JSON.stringify(validCompletion));

      const result = validateCompletion(filePath);

      expect(result.valid).toBe(true);
      expect(result.content).toEqual(validCompletion);
    });

    it('should reject completion.json without lastUpdated', () => {
      const filePath = path.join(testDir, 'invalid-completion.json');
      fs.writeFileSync(filePath, JSON.stringify({
        agents: {},
        skills: {}
      }));

      const result = validateCompletion(filePath);

      expect(result.valid).toBe(false);
      expect(result.action).toBe('invalid');
    });
  });

  describe('validateDecisions helper', () => {
    it('should validate decisions.json structure', () => {
      const filePath = path.join(testDir, 'decisions.json');
      const validDecisions = {
        decisions: [
          {
            id: 'decision-1',
            question: 'Which database?',
            status: 'pending',
            created: new Date().toISOString()
          }
        ],
        lastUpdated: new Date().toISOString()
      };
      fs.writeFileSync(filePath, JSON.stringify(validDecisions));

      const result = validateDecisions(filePath);

      expect(result.valid).toBe(true);
      expect(result.content.decisions).toHaveLength(1);
    });

    it('should reject decisions with invalid status', () => {
      const filePath = path.join(testDir, 'invalid-decisions.json');
      fs.writeFileSync(filePath, JSON.stringify({
        decisions: [
          {
            id: 'decision-1',
            question: 'Which database?',
            status: 'invalid-status'
          }
        ],
        lastUpdated: new Date().toISOString()
      }));

      const result = validateDecisions(filePath);

      expect(result.valid).toBe(false);
      expect(result.action).toBe('invalid');
    });
  });

  describe('validateArchitecture helper', () => {
    it('should validate architecture.json structure', () => {
      const filePath = path.join(testDir, 'architecture.json');
      const validArchitecture = {
        version: '1.0.0',
        analyzedAt: new Date().toISOString(),
        projectRoot: '/test/project',
        fileCount: 10,
        confidence: 85,
        languages: [],
        frameworks: [],
        patterns: {},
        conventions: {},
        recommendations: []
      };
      fs.writeFileSync(filePath, JSON.stringify(validArchitecture));

      const result = validateArchitecture(filePath);

      expect(result.valid).toBe(true);
      expect(result.content.version).toBe('1.0.0');
      expect(result.content.confidence).toBe(85);
    });
  });

  describe('validateProduct helper', () => {
    it('should validate product.json structure', () => {
      const filePath = path.join(testDir, 'product.json');
      const validProduct = {
        name: 'Test Product',
        description: 'A test product',
        features: [
          {
            id: 'feature-1',
            name: 'User Auth',
            description: 'User authentication',
            priority: 'high'
          }
        ],
        lastUpdated: new Date().toISOString()
      };
      fs.writeFileSync(filePath, JSON.stringify(validProduct));

      const result = validateProduct(filePath);

      expect(result.valid).toBe(true);
      expect(result.content.name).toBe('Test Product');
      expect(result.content.features).toHaveLength(1);
    });

    it('should reject product with invalid priority', () => {
      const filePath = path.join(testDir, 'invalid-product.json');
      fs.writeFileSync(filePath, JSON.stringify({
        name: 'Test Product',
        description: 'A test product',
        features: [
          {
            id: 'feature-1',
            name: 'User Auth',
            priority: 'invalid-priority'
          }
        ],
        lastUpdated: new Date().toISOString()
      }));

      const result = validateProduct(filePath);

      expect(result.valid).toBe(false);
      expect(result.action).toBe('invalid');
    });
  });

  describe('validateBatch', () => {
    it('should validate multiple files at once', () => {
      // Create multiple valid files
      const statePath = path.join(testDir, 'state.json');
      fs.writeFileSync(statePath, JSON.stringify({
        initialized: new Date().toISOString(),
        version: '1.0.0',
        agents: [],
        skills: []
      }));

      const completionPath = path.join(testDir, 'completion.json');
      fs.writeFileSync(completionPath, JSON.stringify({
        agents: {},
        skills: {},
        lastUpdated: new Date().toISOString()
      }));

      const results = validateBatch([
        { filePath: statePath, schemaName: 'state' },
        { filePath: completionPath, schemaName: 'completion' }
      ]);

      expect(results[statePath].valid).toBe(true);
      expect(results[completionPath].valid).toBe(true);
    });

    it('should report individual file errors', () => {
      const statePath = path.join(testDir, 'state.json');
      fs.writeFileSync(statePath, JSON.stringify({
        initialized: new Date().toISOString(),
        version: '1.0.0',
        agents: [],
        skills: []
      }));

      const missingPath = path.join(testDir, 'missing.json');

      const results = validateBatch([
        { filePath: statePath, schemaName: 'state' },
        { filePath: missingPath, schemaName: 'completion' }
      ]);

      expect(results[statePath].valid).toBe(true);
      expect(results[missingPath].valid).toBe(false);
      expect(results[missingPath].action).toBe('missing');
    });
  });

  describe('getErrorMessage', () => {
    it('should return success message for valid results', () => {
      const result = { valid: true, content: {} };
      const message = getErrorMessage(result);

      expect(message).toBe('Validation passed');
    });

    it('should return missing file message', () => {
      const result = { valid: false, action: 'missing' };
      const message = getErrorMessage(result);

      expect(message).toContain('not found');
    });

    it('should return corrupted file message', () => {
      const result = { valid: false, action: 'corrupted' };
      const message = getErrorMessage(result);

      expect(message).toContain('corrupted');
      expect(message).toContain('JSON');
    });

    it('should return schema validation message', () => {
      const result = {
        valid: false,
        action: 'invalid',
        errors: [
          { instancePath: '/version', message: 'must match pattern' }
        ]
      };
      const message = getErrorMessage(result);

      expect(message).toContain('Schema validation failed');
      expect(message).toContain('/version');
    });

    it('should return incomplete message with field name', () => {
      const result = {
        valid: false,
        action: 'incomplete',
        missing_field: 'custom_field'
      };
      const message = getErrorMessage(result);

      expect(message).toContain('Missing required field');
      expect(message).toContain('custom_field');
    });
  });

  describe('getSuggestedAction', () => {
    it('should suggest no action for valid results', () => {
      const result = { valid: true, content: {} };
      const action = getSuggestedAction(result);

      expect(action).toBe('No action needed');
    });

    it('should suggest initialization for missing files', () => {
      const result = { valid: false, action: 'missing' };
      const action = getSuggestedAction(result);

      expect(action).toContain('initialization');
    });

    it('should suggest backup for corrupted files', () => {
      const result = { valid: false, action: 'corrupted' };
      const action = getSuggestedAction(result);

      expect(action).toContain('Backup');
    });

    it('should suggest fixing schema errors', () => {
      const result = { valid: false, action: 'invalid' };
      const action = getSuggestedAction(result);

      expect(action).toContain('Fix schema');
    });

    it('should suggest adding missing field', () => {
      const result = {
        valid: false,
        action: 'incomplete',
        missing_field: 'gates'
      };
      const action = getSuggestedAction(result);

      expect(action).toContain('Add the missing field');
      expect(action).toContain('gates');
    });
  });

  describe('ValidationActions constants', () => {
    it('should export action constants', () => {
      expect(ValidationActions.MISSING).toBe('missing');
      expect(ValidationActions.CORRUPTED).toBe('corrupted');
      expect(ValidationActions.INVALID).toBe('invalid');
      expect(ValidationActions.INCOMPLETE).toBe('incomplete');
    });
  });

  describe('schemas export', () => {
    it('should export all schemas', () => {
      expect(schemas).toHaveProperty('state');
      expect(schemas).toHaveProperty('completion');
      expect(schemas).toHaveProperty('decisions');
      expect(schemas).toHaveProperty('architecture');
      expect(schemas).toHaveProperty('product');
    });

    it('should have valid schema structure', () => {
      expect(schemas.state.type).toBe('object');
      expect(schemas.state.required).toContain('initialized');
      expect(schemas.state.required).toContain('version');
      expect(schemas.state.required).toContain('agents');
      expect(schemas.state.required).toContain('skills');
    });
  });

  describe('error handling', () => {
    it('should throw error for unknown schema name', () => {
      const filePath = path.join(testDir, 'test.json');
      fs.writeFileSync(filePath, JSON.stringify({}));

      expect(() => {
        validateStateFile(filePath, 'unknown-schema');
      }).toThrow('Unknown schema name');
    });
  });

  describe('edge cases', () => {
    it('should handle file with extra properties (state schema)', () => {
      const filePath = path.join(testDir, 'extra-props.json');
      fs.writeFileSync(filePath, JSON.stringify({
        initialized: new Date().toISOString(),
        version: '1.0.0',
        agents: [],
        skills: [],
        extra_property: 'allowed by state schema'
      }));

      const result = validateStateFile(filePath, 'state');

      // State schema has additionalProperties: true (allows extra fields)
      expect(result.valid).toBe(true);
    });

    it('should handle file with extra properties (completion schema)', () => {
      const filePath = path.join(testDir, 'extra-props-completion.json');
      fs.writeFileSync(filePath, JSON.stringify({
        agents: {},
        skills: {},
        lastUpdated: new Date().toISOString(),
        extra_property: 'allowed by completion schema'
      }));

      const result = validateStateFile(filePath, 'completion');

      // Completion schema has additionalProperties: true
      expect(result.valid).toBe(true);
    });

    it('should validate progress values within range', () => {
      const filePath = path.join(testDir, 'progress-range.json');
      fs.writeFileSync(filePath, JSON.stringify({
        agents: {
          frontend: { completed: true, progress: 150 }
        },
        skills: {},
        lastUpdated: new Date().toISOString()
      }));

      const result = validateStateFile(filePath, 'completion');

      expect(result.valid).toBe(false);
      expect(result.action).toBe('invalid');
    });
  });
});
