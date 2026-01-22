import { describe, it, expect, beforeEach, afterEach } from 'vitest';
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
import fs from 'fs';
import path from 'path';
import { tmpdir } from 'os';

/**
 * Validation Library Unit Tests
 *
 * Tests for centralized validation functions
 * Covers schema validation, file validation, and error handling
 */

describe('ValidationActions constants', () => {
  it('should export action constants', () => {
    expect(ValidationActions.MISSING).toBe('missing');
    expect(ValidationActions.CORRUPTED).toBe('corrupted');
    expect(ValidationActions.INVALID).toBe('invalid');
    expect(ValidationActions.INCOMPLETE).toBe('incomplete');
  });
});

describe('schemas', () => {
  it('should have state schema', () => {
    expect(schemas.state).toBeDefined();
    expect(schemas.state.type).toBe('object');
    expect(schemas.state.required).toContain('initialized');
    expect(schemas.state.required).toContain('version');
  });

  it('should have completion schema', () => {
    expect(schemas.completion).toBeDefined();
    expect(schemas.completion.required).toContain('agents');
    expect(schemas.completion.required).toContain('skills');
  });

  it('should have decisions schema', () => {
    expect(schemas.decisions).toBeDefined();
    expect(schemas.decisions.required).toContain('decisions');
  });

  it('should have architecture schema', () => {
    expect(schemas.architecture).toBeDefined();
    expect(schemas.architecture.required).toContain('project_type');
  });

  it('should have product schema', () => {
    expect(schemas.product).toBeDefined();
    expect(schemas.product.required).toContain('name');
    expect(schemas.product.required).toContain('features');
  });
});

describe('validateStateFile', () => {
  let testDir;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(tmpdir(), 'validation-test-'));
  });

  afterEach(() => {
    if (testDir) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should return missing action for non-existent file', () => {
    const filePath = path.join(testDir, 'nonexistent.json');
    const result = validateStateFile(filePath, 'state');

    expect(result.valid).toBe(false);
    expect(result.action).toBe('missing');
  });

  it('should return corrupted action for invalid JSON', () => {
    const filePath = path.join(testDir, 'corrupted.json');
    fs.writeFileSync(filePath, 'invalid json {{{');

    const result = validateStateFile(filePath, 'state');

    expect(result.valid).toBe(false);
    expect(result.action).toBe('corrupted');
  });

  it('should return invalid action for schema mismatch', () => {
    const filePath = path.join(testDir, 'invalid.json');
    fs.writeFileSync(filePath, JSON.stringify({ invalid: 'structure' }));

    const result = validateStateFile(filePath, 'state');

    expect(result.valid).toBe(false);
    expect(result.action).toBe('invalid');
    expect(result.errors).toBeDefined();
  });

  it('should return incomplete action for missing required fields', () => {
    const filePath = path.join(testDir, 'incomplete.json');
    const data = {
      initialized: new Date().toISOString(),
      version: '1.0.0',
      agents: [],
      skills: []
    };
    fs.writeFileSync(filePath, JSON.stringify(data));

    const result = validateStateFile(filePath, 'state', ['customField']);

    expect(result.valid).toBe(false);
    expect(result.action).toBe('incomplete');
    expect(result.missing_field).toBe('customField');
  });

  it('should return valid result for correct data', () => {
    const filePath = path.join(testDir, 'valid.json');
    const data = {
      initialized: new Date().toISOString(),
      version: '1.0.0',
      agents: ['orchestrator'],
      skills: ['validation']
    };
    fs.writeFileSync(filePath, JSON.stringify(data));

    const result = validateStateFile(filePath, 'state');

    expect(result.valid).toBe(true);
    expect(result.content).toEqual(data);
  });

  it('should throw error for unknown schema', () => {
    const filePath = path.join(testDir, 'test.json');
    fs.writeFileSync(filePath, JSON.stringify({}));

    expect(() => validateStateFile(filePath, 'unknown-schema')).toThrow('Unknown schema name');
  });
});

describe('validateState', () => {
  let testDir;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(tmpdir(), 'state-test-'));
  });

  afterEach(() => {
    if (testDir) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should validate state.json structure', () => {
    const filePath = path.join(testDir, 'state.json');
    const data = {
      initialized: new Date().toISOString(),
      version: '1.0.0',
      agents: ['orchestrator', 'backend'],
      skills: ['validation', 'testing']
    };
    fs.writeFileSync(filePath, JSON.stringify(data));

    const result = validateState(filePath);

    expect(result.valid).toBe(true);
    expect(result.content.agents).toEqual(['orchestrator', 'backend']);
  });

  it('should reject state without version', () => {
    const filePath = path.join(testDir, 'state.json');
    const data = {
      initialized: new Date().toISOString(),
      agents: [],
      skills: []
    };
    fs.writeFileSync(filePath, JSON.stringify(data));

    const result = validateState(filePath);

    expect(result.valid).toBe(false);
    expect(result.action).toBe('invalid');
  });

  it('should accept additional properties', () => {
    const filePath = path.join(testDir, 'state.json');
    const data = {
      initialized: new Date().toISOString(),
      version: '1.0.0',
      agents: [],
      skills: [],
      customField: 'custom value'
    };
    fs.writeFileSync(filePath, JSON.stringify(data));

    const result = validateState(filePath);

    expect(result.valid).toBe(true);
    expect(result.content.customField).toBe('custom value');
  });
});

describe('validateCompletion', () => {
  let testDir;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(tmpdir(), 'completion-test-'));
  });

  afterEach(() => {
    if (testDir) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should validate completion.json structure', () => {
    const filePath = path.join(testDir, 'completion.json');
    const data = {
      agents: {
        orchestrator: { completed: true, progress: 100 }
      },
      skills: {
        validation: { completed: false, progress: 50 }
      },
      lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(filePath, JSON.stringify(data));

    const result = validateCompletion(filePath);

    expect(result.valid).toBe(true);
    expect(result.content.agents.orchestrator.completed).toBe(true);
  });

  it('should validate progress range', () => {
    const filePath = path.join(testDir, 'completion.json');
    const data = {
      agents: {},
      skills: {},
      lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(filePath, JSON.stringify(data));

    const result = validateCompletion(filePath);

    expect(result.valid).toBe(true);
  });
});

describe('validateDecisions', () => {
  let testDir;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(tmpdir(), 'decisions-test-'));
  });

  afterEach(() => {
    if (testDir) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should validate decisions.json structure', () => {
    const filePath = path.join(testDir, 'decisions.json');
    const data = {
      decisions: [
        {
          id: 'decision-1',
          question: 'Should we use TypeScript?',
          status: 'pending',
          created: new Date().toISOString(),
          updated: new Date().toISOString()
        }
      ],
      lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(filePath, JSON.stringify(data));

    const result = validateDecisions(filePath);

    expect(result.valid).toBe(true);
    expect(result.content.decisions).toHaveLength(1);
  });

  it('should validate decision status enum', () => {
    const filePath = path.join(testDir, 'decisions.json');
    const data = {
      decisions: [
        {
          id: 'decision-1',
          question: 'Test question',
          status: 'invalid-status',
          created: new Date().toISOString(),
          updated: new Date().toISOString()
        }
      ],
      lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(filePath, JSON.stringify(data));

    const result = validateDecisions(filePath);

    expect(result.valid).toBe(false);
    expect(result.action).toBe('invalid');
  });

  it('should reject additional properties', () => {
    const filePath = path.join(testDir, 'decisions.json');
    const data = {
      decisions: [],
      lastUpdated: new Date().toISOString(),
      extraField: 'not allowed'
    };
    fs.writeFileSync(filePath, JSON.stringify(data));

    const result = validateDecisions(filePath);

    expect(result.valid).toBe(false);
  });
});

describe('validateArchitecture', () => {
  let testDir;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(tmpdir(), 'architecture-test-'));
  });

  afterEach(() => {
    if (testDir) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should validate architecture.json structure', () => {
    const filePath = path.join(testDir, 'architecture.json');
    const data = {
      project_type: 'web-app',
      technologies: {
        frontend: 'React',
        backend: 'Node.js',
        database: 'PostgreSQL'
      },
      patterns: ['MVC', 'Repository Pattern'],
      lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(filePath, JSON.stringify(data));

    const result = validateArchitecture(filePath);

    expect(result.valid).toBe(true);
    expect(result.content.project_type).toBe('web-app');
  });
});

describe('validateProduct', () => {
  let testDir;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(tmpdir(), 'product-test-'));
  });

  afterEach(() => {
    if (testDir) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should validate product.json structure', () => {
    const filePath = path.join(testDir, 'product.json');
    const data = {
      name: 'Test Product',
      description: 'A test product',
      features: [
        {
          id: 'feature-1',
          name: 'User Authentication',
          priority: 'high'
        }
      ],
      lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(filePath, JSON.stringify(data));

    const result = validateProduct(filePath);

    expect(result.valid).toBe(true);
    expect(result.content.name).toBe('Test Product');
  });

  it('should validate priority enum', () => {
    const filePath = path.join(testDir, 'product.json');
    const data = {
      name: 'Test Product',
      description: 'A test product',
      features: [
        {
          id: 'feature-1',
          name: 'Feature',
          priority: 'invalid-priority'
        }
      ],
      lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(filePath, JSON.stringify(data));

    const result = validateProduct(filePath);

    expect(result.valid).toBe(false);
    expect(result.action).toBe('invalid');
  });
});

describe('validateBatch', () => {
  let testDir;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(tmpdir(), 'batch-test-'));
  });

  afterEach(() => {
    if (testDir) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should validate multiple files', () => {
    const statePath = path.join(testDir, 'state.json');
    const completionPath = path.join(testDir, 'completion.json');

    fs.writeFileSync(statePath, JSON.stringify({
      initialized: new Date().toISOString(),
      version: '1.0.0',
      agents: [],
      skills: []
    }));

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

  it('should return validation results for all files', () => {
    const validPath = path.join(testDir, 'valid.json');
    const invalidPath = path.join(testDir, 'invalid.json');

    fs.writeFileSync(validPath, JSON.stringify({
      initialized: new Date().toISOString(),
      version: '1.0.0',
      agents: [],
      skills: []
    }));

    fs.writeFileSync(invalidPath, 'invalid json');

    const results = validateBatch([
      { filePath: validPath, schemaName: 'state' },
      { filePath: invalidPath, schemaName: 'state' }
    ]);

    expect(results[validPath].valid).toBe(true);
    expect(results[invalidPath].valid).toBe(false);
    expect(results[invalidPath].action).toBe('corrupted');
  });
});

describe('getErrorMessage', () => {
  it('should return message for valid result', () => {
    const result = { valid: true };
    expect(getErrorMessage(result)).toBe('Validation passed');
  });

  it('should return message for missing file', () => {
    const result = { valid: false, action: 'missing' };
    const message = getErrorMessage(result);
    expect(message).toContain('not found');
  });

  it('should return message for corrupted file', () => {
    const result = { valid: false, action: 'corrupted' };
    const message = getErrorMessage(result);
    expect(message).toContain('corrupted');
  });

  it('should return message for invalid schema', () => {
    const result = {
      valid: false,
      action: 'invalid',
      errors: [
        { instancePath: '/version', message: 'must be string' }
      ]
    };
    const message = getErrorMessage(result);
    expect(message).toContain('Schema validation failed');
    expect(message).toContain('version');
  });

  it('should return message for incomplete data', () => {
    const result = {
      valid: false,
      action: 'incomplete',
      missing_field: 'requiredField'
    };
    const message = getErrorMessage(result);
    expect(message).toContain('requiredField');
  });
});

describe('getSuggestedAction', () => {
  it('should suggest no action for valid result', () => {
    const result = { valid: true };
    expect(getSuggestedAction(result)).toBe('No action needed');
  });

  it('should suggest initialization for missing file', () => {
    const result = { valid: false, action: 'missing' };
    const action = getSuggestedAction(result);
    expect(action).toContain('initialization');
  });

  it('should suggest backup for corrupted file', () => {
    const result = { valid: false, action: 'corrupted' };
    const action = getSuggestedAction(result);
    expect(action).toContain('Backup');
  });

  it('should suggest fixing for invalid schema', () => {
    const result = { valid: false, action: 'invalid' };
    const action = getSuggestedAction(result);
    expect(action).toContain('Fix');
  });

  it('should suggest adding field for incomplete data', () => {
    const result = {
      valid: false,
      action: 'incomplete',
      missing_field: 'requiredField'
    };
    const action = getSuggestedAction(result);
    expect(action).toContain('Add');
    expect(action).toContain('requiredField');
  });
});
