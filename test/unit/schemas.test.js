import { describe, it, expect } from 'vitest';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..', '..');

/**
 * JSON Schema Validation Tests
 *
 * Validates that JSON state files conform to expected schemas
 */

describe('JSON Schemas', () => {
  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);

  describe('state.json schema', () => {
    const stateSchema = {
      type: 'object',
      required: ['initialized', 'version', 'agents', 'skills'],
      properties: {
        initialized: {
          type: 'string',
          format: 'date-time'
        },
        version: {
          type: 'string',
          pattern: '^\\d+\\.\\d+\\.\\d+$'
        },
        agents: {
          type: 'array',
          items: {
            type: 'string'
          }
        },
        skills: {
          type: 'array',
          items: {
            type: 'string'
          }
        }
      },
      additionalProperties: false
    };

    const validate = ajv.compile(stateSchema);

    it('should have valid schema definition', () => {
      expect(validate).toBeDefined();
      expect(typeof validate).toBe('function');
    });

    it('should validate correct state.json structure', () => {
      const validState = {
        initialized: new Date().toISOString(),
        version: '1.0.0',
        agents: [],
        skills: []
      };

      const isValid = validate(validState);
      expect(isValid).toBe(true);
    });

    it('should reject state.json without required fields', () => {
      const invalidState = {
        initialized: new Date().toISOString()
        // Missing version, agents, skills
      };

      const isValid = validate(invalidState);
      expect(isValid).toBe(false);
      expect(validate.errors).toBeTruthy();
    });

    it('should reject state.json with wrong types', () => {
      const invalidState = {
        initialized: new Date().toISOString(),
        version: '1.0.0',
        agents: 'not-an-array', // Should be array
        skills: []
      };

      const isValid = validate(invalidState);
      expect(isValid).toBe(false);
    });

    it('should validate state.json with agents and skills', () => {
      const validState = {
        initialized: new Date().toISOString(),
        version: '1.0.0',
        agents: ['frontend', 'backend', 'tester'],
        skills: ['react', 'nodejs', 'testing']
      };

      const isValid = validate(validState);
      expect(isValid).toBe(true);
    });
  });

  describe('completion.json schema', () => {
    const completionSchema = {
      type: 'object',
      required: ['agents', 'skills', 'lastUpdated'],
      properties: {
        agents: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              completed: { type: 'boolean' },
              progress: { type: 'number', minimum: 0, maximum: 100 }
            }
          }
        },
        skills: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              completed: { type: 'boolean' },
              progress: { type: 'number', minimum: 0, maximum: 100 }
            }
          }
        },
        lastUpdated: {
          type: 'string',
          format: 'date-time'
        }
      },
      additionalProperties: true
    };

    const validate = ajv.compile(completionSchema);

    it('should validate empty completion.json', () => {
      const validCompletion = {
        agents: {},
        skills: {},
        lastUpdated: new Date().toISOString()
      };

      const isValid = validate(validCompletion);
      expect(isValid).toBe(true);
    });

    it('should validate completion.json with progress data', () => {
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

      const isValid = validate(validCompletion);
      expect(isValid).toBe(true);
    });

    it('should reject completion.json without lastUpdated', () => {
      const invalidCompletion = {
        agents: {},
        skills: {}
        // Missing lastUpdated
      };

      const isValid = validate(invalidCompletion);
      expect(isValid).toBe(false);
    });
  });

  describe('decisions.json schema', () => {
    const decisionsSchema = {
      type: 'object',
      required: ['decisions', 'lastUpdated'],
      properties: {
        decisions: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'question', 'status'],
            properties: {
              id: { type: 'string' },
              question: { type: 'string' },
              status: {
                type: 'string',
                enum: ['pending', 'answered', 'cancelled']
              },
              answer: { type: 'string' },
              context: { type: 'string' },
              created: { type: 'string', format: 'date-time' },
              updated: { type: 'string', format: 'date-time' }
            }
          }
        },
        lastUpdated: {
          type: 'string',
          format: 'date-time'
        }
      },
      additionalProperties: false
    };

    const validate = ajv.compile(decisionsSchema);

    it('should validate empty decisions.json', () => {
      const validDecisions = {
        decisions: [],
        lastUpdated: new Date().toISOString()
      };

      const isValid = validate(validDecisions);
      expect(isValid).toBe(true);
    });

    it('should validate decisions.json with pending decision', () => {
      const validDecisions = {
        decisions: [
          {
            id: 'decision-1',
            question: 'Which database should we use?',
            status: 'pending',
            created: new Date().toISOString()
          }
        ],
        lastUpdated: new Date().toISOString()
      };

      const isValid = validate(validDecisions);
      expect(isValid).toBe(true);
    });

    it('should validate decisions.json with answered decision', () => {
      const validDecisions = {
        decisions: [
          {
            id: 'decision-1',
            question: 'Which database should we use?',
            status: 'answered',
            answer: 'PostgreSQL',
            context: 'Need relational database',
            created: new Date().toISOString(),
            updated: new Date().toISOString()
          }
        ],
        lastUpdated: new Date().toISOString()
      };

      const isValid = validate(validDecisions);
      expect(isValid).toBe(true);
    });

    it('should reject decisions.json with invalid status', () => {
      const invalidDecisions = {
        decisions: [
          {
            id: 'decision-1',
            question: 'Which database?',
            status: 'invalid-status' // Not in enum
          }
        ],
        lastUpdated: new Date().toISOString()
      };

      const isValid = validate(invalidDecisions);
      expect(isValid).toBe(false);
    });
  });

  describe('conversation-state.json schema', () => {
    const conversationStateSchema = {
      type: 'object',
      required: ['current_phase', 'last_message_time', 'active_feature', 'unresolved_references', 'context_history'],
      properties: {
        current_phase: {
          type: 'string'
        },
        last_message_time: {
          oneOf: [
            { type: 'string', format: 'date-time' },
            { type: 'null' }
          ]
        },
        active_feature: {
          oneOf: [
            { type: 'string' },
            { type: 'null' }
          ]
        },
        unresolved_references: {
          type: 'array',
          items: { type: 'string' }
        },
        context_history: {
          type: 'array',
          items: { type: 'object' }
        }
      },
      additionalProperties: false
    };

    const validate = ajv.compile(conversationStateSchema);

    it('should validate initial conversation state', () => {
      const validState = {
        current_phase: 'idle',
        last_message_time: null,
        active_feature: null,
        unresolved_references: [],
        context_history: []
      };

      const isValid = validate(validState);
      expect(isValid).toBe(true);
    });

    it('should validate active conversation state', () => {
      const validState = {
        current_phase: 'implementation',
        last_message_time: new Date().toISOString(),
        active_feature: 'user-authentication',
        unresolved_references: ['auth-service', 'user-model'],
        context_history: [
          { timestamp: new Date().toISOString(), message: 'Started implementation' }
        ]
      };

      const isValid = validate(validState);
      expect(isValid).toBe(true);
    });
  });

  describe('conversation-history.json schema', () => {
    const conversationHistorySchema = {
      type: 'object',
      required: ['messages', 'created_at'],
      properties: {
        messages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              timestamp: { type: 'string', format: 'date-time' },
              role: { type: 'string', enum: ['user', 'assistant'] },
              content: { type: 'string' },
              agent: { type: 'string' },
              context: { type: 'object' }
            }
          }
        },
        created_at: {
          type: 'string',
          format: 'date-time'
        }
      },
      additionalProperties: false
    };

    const validate = ajv.compile(conversationHistorySchema);

    it('should validate empty conversation history', () => {
      const validHistory = {
        messages: [],
        created_at: new Date().toISOString()
      };

      const isValid = validate(validHistory);
      expect(isValid).toBe(true);
    });

    it('should validate conversation history with messages', () => {
      const validHistory = {
        messages: [
          {
            timestamp: new Date().toISOString(),
            role: 'user',
            content: 'Create a login page',
            context: {}
          },
          {
            timestamp: new Date().toISOString(),
            role: 'assistant',
            content: 'I will create a login page',
            agent: 'frontend',
            context: {}
          }
        ],
        created_at: new Date().toISOString()
      };

      const isValid = validate(validHistory);
      expect(isValid).toBe(true);
    });
  });

  describe('package.json', () => {
    it('should have valid package.json', () => {
      const packagePath = path.join(projectRoot, 'package.json');
      const content = fs.readFileSync(packagePath, 'utf-8');

      // Should parse without errors
      expect(() => JSON.parse(content)).not.toThrow();

      const pkg = JSON.parse(content);
      expect(pkg).toHaveProperty('name');
      expect(pkg).toHaveProperty('version');
    });
  });

  describe('version.json', () => {
    it('should have valid version.json', () => {
      const versionPath = path.join(projectRoot, 'version.json');
      const content = fs.readFileSync(versionPath, 'utf-8');

      expect(() => JSON.parse(content)).not.toThrow();

      const version = JSON.parse(content);
      expect(version).toHaveProperty('version');
      expect(typeof version.version).toBe('string');
    });
  });

  describe('template/.claude/settings.json', () => {
    it('should have valid settings.json', () => {
      const settingsPath = path.join(projectRoot, 'template', '.claude', 'settings.json');

      if (fs.existsSync(settingsPath)) {
        const content = fs.readFileSync(settingsPath, 'utf-8');
        expect(() => JSON.parse(content)).not.toThrow();

        const settings = JSON.parse(content);
        expect(settings).toBeDefined();
      }
    });
  });
});
