/**
 * Unit tests for state-validator module
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  STATE_SCHEMAS,
  validateStateFile,
  recoverStateFile,
  validateAllState,
  getDefaultState,
  isStateFileValid,
  getStateFile,
  updateStateFile,
  formatValidationResults
} from '../../lib/state-validator.js';

describe('state-validator', () => {
  let tempDir;

  beforeEach(() => {
    // Create temporary directory for tests
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agentful-test-'));
    fs.mkdirSync(path.join(tempDir, '.agentful'), { recursive: true });
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('STATE_SCHEMAS', () => {
    it('should define all 7 state files', () => {
      const expectedFiles = [
        'state.json',
        'completion.json',
        'decisions.json',
        'architecture.json',
        'conversation-state.json',
        'conversation-history.json',
        'agent-metrics.json'
      ];

      const actualFiles = Object.keys(STATE_SCHEMAS);
      expect(actualFiles).toEqual(expect.arrayContaining(expectedFiles));
      expect(actualFiles.length).toBe(7);
    });

    it('should have required fields for each schema', () => {
      for (const [fileName, schema] of Object.entries(STATE_SCHEMAS)) {
        expect(schema).toHaveProperty('requiredFields');
        expect(schema).toHaveProperty('defaults');
        expect(schema).toHaveProperty('description');
        expect(Array.isArray(schema.requiredFields)).toBe(true);
        expect(typeof schema.defaults).toBe('object');
        expect(typeof schema.description).toBe('string');
      }
    });

    it('should mark architecture.json and agent-metrics.json as optional', () => {
      expect(STATE_SCHEMAS['architecture.json'].optional).toBe(true);
      expect(STATE_SCHEMAS['agent-metrics.json'].optional).toBe(true);
    });
  });

  describe('validateStateFile', () => {
    it('should return initialize action for missing file', () => {
      const filePath = path.join(tempDir, '.agentful', 'state.json');
      const schema = STATE_SCHEMAS['state.json'];

      const result = validateStateFile(filePath, schema);

      expect(result.valid).toBe(false);
      expect(result.action).toBe('initialize');
      expect(result.error).toContain('File not found');
    });

    it('should return backup_and_reset action for invalid JSON', () => {
      const filePath = path.join(tempDir, '.agentful', 'state.json');
      const schema = STATE_SCHEMAS['state.json'];

      // Write invalid JSON
      fs.writeFileSync(filePath, '{ invalid json', 'utf-8');

      const result = validateStateFile(filePath, schema);

      expect(result.valid).toBe(false);
      expect(result.action).toBe('backup_and_reset');
      expect(result.error).toContain('Invalid JSON');
    });

    it('should return add_field action for missing required field', () => {
      const filePath = path.join(tempDir, '.agentful', 'state.json');
      const schema = STATE_SCHEMAS['state.json'];

      // Write JSON missing a required field
      fs.writeFileSync(filePath, JSON.stringify({ initialized: new Date().toISOString() }), 'utf-8');

      const result = validateStateFile(filePath, schema);

      expect(result.valid).toBe(false);
      expect(result.action).toBe('add_field');
      expect(result.missing_field).toBe('version');
      expect(result.error).toContain("Missing required field 'version'");
    });

    it('should return valid for correct state file', () => {
      const filePath = path.join(tempDir, '.agentful', 'state.json');
      const schema = STATE_SCHEMAS['state.json'];

      const validState = {
        initialized: new Date().toISOString(),
        version: '1.0.0',
        agents: [],
        skills: []
      };

      fs.writeFileSync(filePath, JSON.stringify(validState), 'utf-8');

      const result = validateStateFile(filePath, schema);

      expect(result.valid).toBe(true);
      expect(result.data).toEqual(validState);
      expect(result.error).toBeUndefined();
    });
  });

  describe('recoverStateFile', () => {
    it('should create file with defaults for initialize action', () => {
      const filePath = path.join(tempDir, '.agentful', 'state.json');
      const defaults = STATE_SCHEMAS['state.json'].defaults;

      const result = recoverStateFile(filePath, defaults, 'initialize');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Created');
      expect(fs.existsSync(filePath)).toBe(true);

      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      expect(content).toHaveProperty('initialized');
      expect(content).toHaveProperty('version', '1.0.0');
      expect(content).toHaveProperty('agents');
      expect(content).toHaveProperty('skills');
    });

    it('should backup and reset for backup_and_reset action', () => {
      const filePath = path.join(tempDir, '.agentful', 'state.json');
      const defaults = STATE_SCHEMAS['state.json'].defaults;

      // Create corrupted file
      fs.writeFileSync(filePath, '{ corrupted json', 'utf-8');

      const result = recoverStateFile(filePath, defaults, 'backup_and_reset');

      expect(result.success).toBe(true);
      expect(result.message).toContain('backed up');
      expect(result.message).toContain('reset');

      // Check backup file exists
      const backupFiles = fs.readdirSync(path.join(tempDir, '.agentful'))
        .filter(f => f.startsWith('state.json.backup-'));
      expect(backupFiles.length).toBe(1);

      // Check new file is valid
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      expect(content).toHaveProperty('version', '1.0.0');
    });

    it('should add missing field for add_field action', () => {
      const filePath = path.join(tempDir, '.agentful', 'state.json');
      const defaults = STATE_SCHEMAS['state.json'].defaults;

      // Create file missing version field
      const partial = {
        initialized: new Date().toISOString(),
        agents: [],
        skills: []
      };
      fs.writeFileSync(filePath, JSON.stringify(partial), 'utf-8');

      const result = recoverStateFile(filePath, defaults, 'add_field', 'version');

      expect(result.success).toBe(true);
      expect(result.message).toContain("Added missing field 'version'");

      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      expect(content).toHaveProperty('version', '1.0.0');
      expect(content).toHaveProperty('initialized', partial.initialized);
    });

    it('should handle unknown action gracefully', () => {
      const filePath = path.join(tempDir, '.agentful', 'state.json');
      const defaults = STATE_SCHEMAS['state.json'].defaults;

      const result = recoverStateFile(filePath, defaults, 'unknown_action');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Unknown recovery action');
    });
  });

  describe('validateAllState', () => {
    it('should fail if .agentful directory does not exist', () => {
      const nonExistentDir = path.join(tempDir, 'nonexistent');

      const result = validateAllState(nonExistentDir);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('❌ .agentful directory does not exist');
    });

    it('should create .agentful directory with autoRecover', () => {
      const nonExistentDir = path.join(tempDir, 'nonexistent');

      const result = validateAllState(nonExistentDir, { autoRecover: true });

      expect(fs.existsSync(path.join(nonExistentDir, '.agentful'))).toBe(true);
      expect(result.recovered).toContain('✅ Created .agentful directory');
    });

    it('should validate all required state files', () => {
      // Create all required state files
      const requiredFiles = ['state.json', 'completion.json', 'decisions.json', 'conversation-state.json', 'conversation-history.json'];

      for (const fileName of requiredFiles) {
        const schema = STATE_SCHEMAS[fileName];
        const filePath = path.join(tempDir, '.agentful', fileName);
        const validState = {};

        for (const field of schema.requiredFields) {
          const defaultValue = schema.defaults[field];
          validState[field] = typeof defaultValue === 'function' ? defaultValue() : defaultValue;
        }

        fs.writeFileSync(filePath, JSON.stringify(validState), 'utf-8');
      }

      const result = validateAllState(tempDir);

      expect(result.valid).toBe(true);
      expect(Object.keys(result.files).length).toBeGreaterThanOrEqual(requiredFiles.length);
    });

    it('should skip optional files when skipOptional is true', () => {
      const result = validateAllState(tempDir, { skipOptional: true });

      // Should not have architecture.json or agent-metrics.json in results
      expect(result.files['architecture.json']).toBeUndefined();
      expect(result.files['agent-metrics.json']).toBeUndefined();
    });

    it('should validate optional files when skipOptional is false', () => {
      const result = validateAllState(tempDir, { skipOptional: false });

      // Should attempt to validate optional files
      expect(result.files['architecture.json']).toBeDefined();
      expect(result.files['agent-metrics.json']).toBeDefined();
    });

    it('should auto-recover all invalid files', () => {
      const result = validateAllState(tempDir, { autoRecover: true, skipOptional: true });

      expect(result.recovered.length).toBeGreaterThan(0);
      expect(result.recovered.some(msg => msg.includes('state.json'))).toBe(true);
    });
  });

  describe('getDefaultState', () => {
    it('should return default state for known file', () => {
      const defaults = getDefaultState('state.json');

      expect(defaults).toHaveProperty('initialized');
      expect(defaults).toHaveProperty('version', '1.0.0');
      expect(defaults).toHaveProperty('agents');
      expect(defaults).toHaveProperty('skills');
    });

    it('should return null for unknown file', () => {
      const defaults = getDefaultState('unknown.json');
      expect(defaults).toBeNull();
    });

    it('should resolve function defaults', () => {
      const defaults = getDefaultState('completion.json');

      expect(typeof defaults.initialized).toBe('string');
      expect(typeof defaults.last_updated).toBe('string');
      expect(defaults.features).toEqual({});
      expect(defaults.gates).toHaveProperty('tests_passing');
    });
  });

  describe('isStateFileValid', () => {
    it('should return false for missing file', () => {
      const result = isStateFileValid(tempDir, 'state.json');
      expect(result).toBe(false);
    });

    it('should return false for unknown file', () => {
      const result = isStateFileValid(tempDir, 'unknown.json');
      expect(result).toBe(false);
    });

    it('should return true for valid file', () => {
      const filePath = path.join(tempDir, '.agentful', 'state.json');
      const schema = STATE_SCHEMAS['state.json'];

      const validState = {
        initialized: new Date().toISOString(),
        version: '1.0.0',
        agents: [],
        skills: []
      };

      fs.writeFileSync(filePath, JSON.stringify(validState), 'utf-8');

      const result = isStateFileValid(tempDir, 'state.json');
      expect(result).toBe(true);
    });
  });

  describe('getStateFile', () => {
    it('should return error for unknown file', () => {
      const result = getStateFile(tempDir, 'unknown.json');

      expect(result.valid).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toContain('Unknown state file');
    });

    it('should return error for missing file', () => {
      const result = getStateFile(tempDir, 'state.json');

      expect(result.valid).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toContain('File not found');
    });

    it('should return valid data for valid file', () => {
      const filePath = path.join(tempDir, '.agentful', 'state.json');

      const validState = {
        initialized: new Date().toISOString(),
        version: '1.0.0',
        agents: ['test-agent'],
        skills: ['test-skill']
      };

      fs.writeFileSync(filePath, JSON.stringify(validState), 'utf-8');

      const result = getStateFile(tempDir, 'state.json');

      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
      expect(result.data).toEqual(validState);
    });

    it('should auto-recover invalid file when autoRecover is true', () => {
      const result = getStateFile(tempDir, 'state.json', { autoRecover: true });

      expect(result.valid).toBe(true);
      expect(result.recovered).toBe(true);
      expect(result.data).toHaveProperty('version', '1.0.0');
    });
  });

  describe('updateStateFile', () => {
    beforeEach(() => {
      // Create valid state file
      const filePath = path.join(tempDir, '.agentful', 'state.json');
      const validState = {
        initialized: new Date().toISOString(),
        version: '1.0.0',
        agents: [],
        skills: []
      };
      fs.writeFileSync(filePath, JSON.stringify(validState), 'utf-8');
    });

    it('should update file with object', () => {
      const result = updateStateFile(tempDir, 'state.json', {
        agents: ['new-agent']
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Updated');
      expect(result.data.agents).toEqual(['new-agent']);
      expect(result.data.version).toBe('1.0.0'); // Existing field preserved
    });

    it('should update file with function', () => {
      const result = updateStateFile(tempDir, 'state.json', (current) => ({
        ...current,
        skills: [...current.skills, 'new-skill']
      }));

      expect(result.success).toBe(true);
      expect(result.data.skills).toEqual(['new-skill']);
    });

    it('should reject update that removes required field', () => {
      const result = updateStateFile(tempDir, 'state.json', (current) => {
        const updated = { ...current };
        delete updated.version;
        return updated;
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('required field');
    });

    it('should fail for unknown file', () => {
      const result = updateStateFile(tempDir, 'unknown.json', {});

      expect(result.success).toBe(false);
      expect(result.message).toContain('Unknown state file');
    });
  });

  describe('formatValidationResults', () => {
    it('should format valid results', () => {
      const results = {
        valid: true,
        files: {},
        errors: [],
        warnings: [],
        recovered: []
      };

      const formatted = formatValidationResults(results);

      expect(formatted).toContain('✅ All state files are valid');
    });

    it('should format invalid results with errors', () => {
      const results = {
        valid: false,
        files: {},
        errors: ['❌ state.json: File not found'],
        warnings: [],
        recovered: []
      };

      const formatted = formatValidationResults(results);

      expect(formatted).toContain('❌ State validation failed');
      expect(formatted).toContain('**Errors:**');
      expect(formatted).toContain('state.json: File not found');
    });

    it('should format results with warnings', () => {
      const results = {
        valid: true,
        files: {},
        errors: [],
        warnings: ['⏭️ Skipped optional file'],
        recovered: []
      };

      const formatted = formatValidationResults(results);

      expect(formatted).toContain('**Warnings:**');
      expect(formatted).toContain('Skipped optional file');
    });

    it('should format results with recovery messages', () => {
      const results = {
        valid: true,
        files: {},
        errors: [],
        warnings: [],
        recovered: ['✅ Created state.json with default values']
      };

      const formatted = formatValidationResults(results);

      expect(formatted).toContain('**Recovered:**');
      expect(formatted).toContain('Created state.json');
    });
  });

  describe('integration tests', () => {
    it('should handle complete validation and recovery workflow', () => {
      // Start with no state files
      const validation = validateAllState(tempDir, {
        autoRecover: true,
        skipOptional: true,
        verbose: true
      });

      expect(validation.valid).toBe(true);
      expect(validation.recovered.length).toBeGreaterThan(0);

      // Verify all required files exist
      const requiredFiles = ['state.json', 'completion.json', 'decisions.json', 'conversation-state.json', 'conversation-history.json'];

      for (const fileName of requiredFiles) {
        expect(isStateFileValid(tempDir, fileName)).toBe(true);
      }
    });

    it('should handle corrupted file recovery workflow', () => {
      // Create corrupted file
      const filePath = path.join(tempDir, '.agentful', 'state.json');
      fs.writeFileSync(filePath, '{ invalid json }', 'utf-8');

      // Validate and recover
      const validation = validateAllState(tempDir, {
        autoRecover: true,
        skipOptional: true
      });

      // Should have backed up and recovered
      expect(validation.recovered.some(msg => msg.includes('backed up'))).toBe(true);

      // File should now be valid
      expect(isStateFileValid(tempDir, 'state.json')).toBe(true);
    });
  });
});
