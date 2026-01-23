import fs from 'fs';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

/**
 * Centralized Validation Library
 *
 * Provides unified validation functions for state files with:
 * - File existence checks
 * - JSON parsing validation
 * - Schema validation using AJV
 * - Required field validation
 *
 * Standardized action codes:
 * - "missing": File does not exist
 * - "corrupted": File exists but is not valid JSON
 * - "invalid": JSON is valid but doesn't match schema
 * - "incomplete": Schema is valid but required fields are missing
 */

// Initialize AJV with formats support
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

/**
 * JSON Schemas for state files
 */
export const schemas = {
  state: {
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
    additionalProperties: true
  },

  completion: {
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
  },

  decisions: {
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
  },

  architecture: {
    type: 'object',
    required: ['version', 'analyzedAt', 'projectRoot', 'fileCount', 'confidence', 'languages', 'frameworks', 'patterns', 'conventions', 'recommendations'],
    properties: {
      version: { type: 'string' },
      analyzedAt: {
        type: 'string',
        format: 'date-time'
      },
      duration: { type: 'number' },
      projectRoot: { type: 'string' },
      fileCount: { type: 'number', minimum: 0 },
      isNewProject: { type: 'boolean' },
      confidence: { type: 'number', minimum: 0, maximum: 100 },
      languages: {
        type: 'array',
        items: {
          type: 'object',
          required: ['name', 'confidence', 'files'],
          properties: {
            name: { type: 'string' },
            confidence: { type: 'number' },
            files: { type: 'number' },
            percentage: { type: 'number' },
            extensions: { type: 'array', items: { type: 'string' } }
          }
        }
      },
      primaryLanguage: { type: ['string', 'null'] },
      frameworks: {
        type: 'array',
        items: {
          type: 'object',
          required: ['name', 'confidence'],
          properties: {
            name: { type: 'string' },
            version: { type: 'string' },
            type: { type: 'string' },
            category: { type: 'string' },
            confidence: { type: 'number' },
            source: { type: 'string' }
          }
        }
      },
      patterns: {
        type: 'object',
        properties: {
          components: { type: 'object' },
          api: { type: 'object' },
          database: { type: 'object' },
          tests: { type: 'object' },
          auth: { type: 'object' }
        }
      },
      conventions: {
        type: 'object'
      },
      recommendations: {
        type: 'array',
        items: {
          type: 'object',
          required: ['type', 'priority', 'message', 'action'],
          properties: {
            type: { type: 'string' },
            priority: { type: 'string' },
            message: { type: 'string' },
            action: { type: 'string' }
          }
        }
      }
    },
    additionalProperties: true
  },

  product: {
    type: 'object',
    required: ['name', 'description', 'features', 'lastUpdated'],
    properties: {
      name: { type: 'string' },
      description: { type: 'string' },
      features: {
        type: 'array',
        items: {
          type: 'object',
          required: ['id', 'name'],
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            priority: {
              type: 'string',
              enum: ['high', 'medium', 'low']
            }
          }
        }
      },
      lastUpdated: {
        type: 'string',
        format: 'date-time'
      }
    },
    additionalProperties: true
  }
};

// Compile all schemas
const compiledSchemas = {
  state: ajv.compile(schemas.state),
  completion: ajv.compile(schemas.completion),
  decisions: ajv.compile(schemas.decisions),
  architecture: ajv.compile(schemas.architecture),
  product: ajv.compile(schemas.product)
};

/**
 * Unified validation function for state files
 *
 * @param {string} filePath - Absolute path to the file to validate
 * @param {string} schemaName - Name of schema to use ('state', 'completion', 'decisions', 'architecture', 'product')
 * @param {string[]} requiredFields - Additional required fields to check beyond schema
 * @returns {Object} Validation result with standardized structure
 *
 * Return format for invalid:
 * { valid: false, action: "missing" | "corrupted" | "invalid" | "incomplete", errors?: array, missing_field?: string }
 *
 * Return format for valid:
 * { valid: true, content: object }
 */
export function validateStateFile(filePath, schemaName, requiredFields = []) {
  // 1. Check file exists
  if (!fs.existsSync(filePath)) {
    return {
      valid: false,
      action: 'missing',
      error: `File not found: ${filePath}`
    };
  }

  // 2. Parse JSON
  let content;
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    content = JSON.parse(fileContent);
  } catch (error) {
    return {
      valid: false,
      action: 'corrupted',
      error: `Invalid JSON in ${filePath}: ${error.message}`
    };
  }

  // 3. Validate against schema using AJV
  const validator = compiledSchemas[schemaName];
  if (!validator) {
    throw new Error(`Unknown schema name: ${schemaName}. Valid schemas: ${Object.keys(compiledSchemas).join(', ')}`);
  }

  const schemaValid = validator(content);
  if (!schemaValid) {
    return {
      valid: false,
      action: 'invalid',
      errors: validator.errors,
      error: `Schema validation failed for ${filePath}`
    };
  }

  // 4. Check additional required fields
  for (const field of requiredFields) {
    if (!(field in content)) {
      return {
        valid: false,
        action: 'incomplete',
        missing_field: field,
        error: `Missing required field '${field}' in ${filePath}`
      };
    }
  }

  // 5. Success
  return {
    valid: true,
    content
  };
}

/**
 * Validate state.json file
 *
 * @param {string} filePath - Path to state.json (defaults to .agentful/state.json)
 * @param {string[]} additionalFields - Additional required fields beyond schema
 * @returns {Object} Validation result
 */
export function validateState(filePath = '.agentful/state.json', additionalFields = []) {
  return validateStateFile(filePath, 'state', additionalFields);
}

/**
 * Validate completion.json file
 *
 * @param {string} filePath - Path to completion.json (defaults to .agentful/completion.json)
 * @param {string[]} additionalFields - Additional required fields beyond schema
 * @returns {Object} Validation result
 */
export function validateCompletion(filePath = '.agentful/completion.json', additionalFields = []) {
  return validateStateFile(filePath, 'completion', additionalFields);
}

/**
 * Validate decisions.json file
 *
 * @param {string} filePath - Path to decisions.json (defaults to .agentful/decisions.json)
 * @param {string[]} additionalFields - Additional required fields beyond schema
 * @returns {Object} Validation result
 */
export function validateDecisions(filePath = '.agentful/decisions.json', additionalFields = []) {
  return validateStateFile(filePath, 'decisions', additionalFields);
}

/**
 * Validate architecture.json file
 *
 * @param {string} filePath - Path to architecture.json (defaults to .agentful/architecture.json)
 * @param {string[]} additionalFields - Additional required fields beyond schema
 * @returns {Object} Validation result
 */
export function validateArchitecture(filePath = '.agentful/architecture.json', additionalFields = []) {
  return validateStateFile(filePath, 'architecture', additionalFields);
}

/**
 * Validate product.json file
 *
 * @param {string} filePath - Path to product.json (defaults to .agentful/product.json)
 * @param {string[]} additionalFields - Additional required fields beyond schema
 * @returns {Object} Validation result
 */
export function validateProduct(filePath = '.agentful/product.json', additionalFields = []) {
  return validateStateFile(filePath, 'product', additionalFields);
}

/**
 * Batch validate multiple state files
 *
 * @param {Object[]} files - Array of {filePath, schemaName, requiredFields?}
 * @returns {Object} Map of filePath to validation result
 *
 * Example:
 * const results = validateBatch([
 *   { filePath: '.agentful/state.json', schemaName: 'state' },
 *   { filePath: '.agentful/completion.json', schemaName: 'completion', requiredFields: ['gates'] }
 * ]);
 */
export function validateBatch(files) {
  const results = {};

  for (const { filePath, schemaName, requiredFields = [] } of files) {
    results[filePath] = validateStateFile(filePath, schemaName, requiredFields);
  }

  return results;
}

/**
 * Get human-readable error message for validation result
 *
 * @param {Object} validationResult - Result from validateStateFile
 * @returns {string} Human-readable error message
 */
export function getErrorMessage(validationResult) {
  if (validationResult.valid) {
    return 'Validation passed';
  }

  switch (validationResult.action) {
    case 'missing':
      return `File not found. Initialize it first.`;

    case 'corrupted':
      return `File is corrupted (invalid JSON). Backup and reset recommended.`;

    case 'invalid':
      if (validationResult.errors && validationResult.errors.length > 0) {
        const errorDetails = validationResult.errors
          .map(err => `  - ${err.instancePath || 'root'}: ${err.message}`)
          .join('\n');
        return `Schema validation failed:\n${errorDetails}`;
      }
      return `Schema validation failed.`;

    case 'incomplete':
      return `Missing required field: '${validationResult.missing_field}'`;

    default:
      return validationResult.error || 'Unknown validation error';
  }
}

/**
 * Suggested action for validation result
 *
 * @param {Object} validationResult - Result from validateStateFile
 * @returns {string} Suggested action to fix the issue
 */
export function getSuggestedAction(validationResult) {
  if (validationResult.valid) {
    return 'No action needed';
  }

  switch (validationResult.action) {
    case 'missing':
      return 'Run initialization command to create the file';

    case 'corrupted':
      return 'Backup the file and create a new one with valid JSON';

    case 'invalid':
      return 'Fix schema validation errors in the file';

    case 'incomplete':
      return `Add the missing field: '${validationResult.missing_field}'`;

    default:
      return 'Check the file and fix any issues';
  }
}

/**
 * Export AJV instance for custom schemas
 */
export { ajv };

/**
 * Export action constants for easy reference
 */
export const ValidationActions = {
  MISSING: 'missing',
  CORRUPTED: 'corrupted',
  INVALID: 'invalid',
  INCOMPLETE: 'incomplete'
};
