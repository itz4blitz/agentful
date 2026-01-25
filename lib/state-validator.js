/**
 * Centralized State Validation Module
 *
 * Provides comprehensive validation and recovery for all agentful state files.
 * Prevents duplication across commands and ensures consistent state management.
 *
 * @module state-validator
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * State file schemas with required fields and default values
 */
export const STATE_SCHEMAS = {
  'state.json': {
    requiredFields: ['initialized', 'version'],
    defaults: {
      initialized: () => new Date().toISOString(),
      version: '1.0.0',
      agents: [],
      skills: []
    },
    description: 'Core initialization state'
  },

  'completion.json': {
    requiredFields: ['features', 'gates', 'overall_progress'],
    defaults: {
      initialized: () => new Date().toISOString(),
      version: '1.0.0',
      structure: 'flat',
      domains: {},
      features: {},
      gates: {
        tests_passing: null,
        no_type_errors: null,
        coverage_80: null,
        no_lint_errors: null,
        no_security_issues: null,
        no_dead_code: null
      },
      overall_progress: 0,
      features_complete: 0,
      features_total: 0,
      last_updated: () => new Date().toISOString()
    },
    description: 'Feature completion tracking and quality gates'
  },

  'decisions.json': {
    requiredFields: ['decisions'],
    defaults: {
      decisions: [],
      lastUpdated: () => new Date().toISOString()
    },
    description: 'Pending and resolved decisions'
  },

  'architecture.json': {
    requiredFields: ['version', 'techStack'],
    defaults: {
      version: '1.0',
      techStack: {
        languages: [],
        runtime: {},
        testing: {},
        linting: {},
        dependencies: {}
      },
      domains: [],
      generatedAgents: [],
      generatedSkills: [],
      analyzedAt: () => new Date().toISOString(),
      detectionMethod: 'manual'
    },
    description: 'Tech stack detection and generated agents',
    optional: true // Architecture is optional, created by agentful-generate
  },

  'conversation-state.json': {
    requiredFields: ['current_phase'],
    defaults: {
      current_phase: 'idle',
      last_message_time: null,
      active_feature: null,
      unresolved_references: [],
      context_history: []
    },
    description: 'Natural language conversation context'
  },

  'conversation-history.json': {
    requiredFields: ['messages'],
    defaults: {
      messages: [],
      created_at: () => new Date().toISOString()
    },
    description: 'Message history for context tracking'
  },

  'agent-metrics.json': {
    requiredFields: ['invocations'],
    defaults: {
      invocations: {},
      last_invocation: null,
      feature_hooks: []
    },
    description: 'Agent lifecycle hooks and metrics',
    optional: true // Created when agents are first invoked
  }
};

/**
 * Validation result object
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether the state file is valid
 * @property {string} [error] - Error message if invalid
 * @property {string} [action] - Recommended action: 'initialize', 'backup_and_reset', 'add_field'
 * @property {string} [missing_field] - Field that was missing (if action is 'add_field')
 * @property {any} [data] - Parsed data if valid
 */

/**
 * Validates a single state file
 *
 * @param {string} filePath - Absolute path to the state file
 * @param {Object} schema - Schema object with requiredFields and defaults
 * @returns {ValidationResult} Validation result with action recommendations
 */
export function validateStateFile(filePath, schema) {
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return {
      valid: false,
      error: `File not found: ${filePath}`,
      action: 'initialize'
    };
  }

  // Check if file is valid JSON
  let content;
  try {
    const rawContent = fs.readFileSync(filePath, 'utf-8');
    content = JSON.parse(rawContent);
  } catch (e) {
    return {
      valid: false,
      error: `Invalid JSON in ${filePath}: ${e.message}`,
      action: 'backup_and_reset'
    };
  }

  // Check required fields exist
  for (const field of schema.requiredFields) {
    if (!(field in content)) {
      return {
        valid: false,
        error: `Missing required field '${field}' in ${filePath}`,
        action: 'add_field',
        missing_field: field
      };
    }
  }

  return {
    valid: true,
    data: content
  };
}

/**
 * Recovers a corrupted or missing state file
 *
 * @param {string} filePath - Absolute path to the state file
 * @param {Object} defaults - Default values for the state file
 * @param {string} action - Recovery action: 'initialize', 'backup_and_reset', or 'add_field'
 * @param {string} [missingField] - Field to add (if action is 'add_field')
 * @returns {Object} Result with success flag and message
 */
export function recoverStateFile(filePath, defaults, action, missingField = null) {
  const fileName = path.basename(filePath);

  try {
    if (action === 'initialize') {
      // Create fresh file with defaults
      const initialState = resolveDefaults(defaults);
      fs.writeFileSync(filePath, JSON.stringify(initialState, null, 2), 'utf-8');

      return {
        success: true,
        message: `✅ Created ${fileName} with default values`
      };
    }

    if (action === 'backup_and_reset') {
      // Backup corrupted file
      const timestamp = Math.floor(Date.now() / 1000);
      const backupPath = `${filePath}.backup-${timestamp}`;

      if (fs.existsSync(filePath)) {
        fs.copyFileSync(filePath, backupPath);
      }

      // Create fresh file
      const initialState = resolveDefaults(defaults);
      fs.writeFileSync(filePath, JSON.stringify(initialState, null, 2), 'utf-8');

      return {
        success: true,
        message: `⚠️  Corrupted ${fileName} backed up to ${path.basename(backupPath)} and reset`
      };
    }

    if (action === 'add_field') {
      // Read existing content, add missing field, write back
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      if (missingField && missingField in defaults) {
        const defaultValue = defaults[missingField];
        content[missingField] = typeof defaultValue === 'function' ? defaultValue() : defaultValue;

        fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf-8');

        return {
          success: true,
          message: `✅ Added missing field '${missingField}' to ${fileName}`
        };
      }

      return {
        success: false,
        message: `❌ Cannot add field '${missingField}' - no default value defined`
      };
    }

    return {
      success: false,
      message: `❌ Unknown recovery action: ${action}`
    };

  } catch (e) {
    return {
      success: false,
      message: `❌ Failed to recover ${fileName}: ${e.message}`
    };
  }
}

/**
 * Validates all state files in a project
 *
 * @param {string} projectRoot - Absolute path to project root directory
 * @param {Object} options - Validation options
 * @param {boolean} [options.autoRecover=false] - Automatically recover invalid files
 * @param {boolean} [options.skipOptional=true] - Skip validation of optional files
 * @param {boolean} [options.verbose=false] - Include detailed validation info
 * @returns {Object} Validation results for all state files
 */
export function validateAllState(projectRoot, options = {}) {
  const {
    autoRecover = false,
    skipOptional = true,
    verbose = false
  } = options;

  const agentfulDir = path.join(projectRoot, '.agentful');
  const results = {
    valid: true,
    files: {},
    errors: [],
    warnings: [],
    recovered: []
  };

  // Ensure .agentful directory exists
  if (!fs.existsSync(agentfulDir)) {
    results.valid = false;
    results.errors.push('❌ .agentful directory does not exist');

    if (autoRecover) {
      fs.mkdirSync(agentfulDir, { recursive: true });
      results.recovered.push('✅ Created .agentful directory');
    } else {
      return results;
    }
  }

  // Validate each state file
  for (const [fileName, schema] of Object.entries(STATE_SCHEMAS)) {
    const filePath = path.join(agentfulDir, fileName);

    // Skip optional files if requested
    if (schema.optional && skipOptional && !fs.existsSync(filePath)) {
      if (verbose) {
        results.warnings.push(`⏭️  Skipped optional file: ${fileName}`);
      }
      continue;
    }

    // Validate file
    const validation = validateStateFile(filePath, schema);
    results.files[fileName] = validation;

    if (!validation.valid) {
      results.errors.push(`❌ ${fileName}: ${validation.error}`);

      // Auto-recover if enabled
      if (autoRecover) {
        const recovery = recoverStateFile(
          filePath,
          schema.defaults,
          validation.action,
          validation.missing_field
        );

        if (recovery.success) {
          results.recovered.push(recovery.message);
          results.files[fileName].recovered = true;
          // Don't mark as invalid if recovery succeeded
        } else {
          results.valid = false;
          results.errors.push(recovery.message);
        }
      } else {
        // No auto-recover, mark as invalid
        results.valid = false;
      }
    } else if (verbose) {
      results.warnings.push(`✅ ${fileName}: Valid`);
    }
  }

  return results;
}

/**
 * Gets the default state for a specific file
 *
 * @param {string} fileName - Name of the state file (e.g., 'state.json')
 * @returns {Object|null} Default state object or null if file not found in schemas
 */
export function getDefaultState(fileName) {
  const schema = STATE_SCHEMAS[fileName];
  if (!schema) {
    return null;
  }

  return resolveDefaults(schema.defaults);
}

/**
 * Checks if a state file exists and is valid
 *
 * @param {string} projectRoot - Absolute path to project root directory
 * @param {string} fileName - Name of the state file (e.g., 'state.json')
 * @returns {boolean} True if file exists and is valid
 */
export function isStateFileValid(projectRoot, fileName) {
  const schema = STATE_SCHEMAS[fileName];
  if (!schema) {
    return false;
  }

  const filePath = path.join(projectRoot, '.agentful', fileName);
  const validation = validateStateFile(filePath, schema);

  return validation.valid;
}

/**
 * Gets state file content with validation
 *
 * @param {string} projectRoot - Absolute path to project root directory
 * @param {string} fileName - Name of the state file (e.g., 'state.json')
 * @param {Object} options - Options
 * @param {boolean} [options.autoRecover=false] - Automatically recover invalid files
 * @returns {Object} Object with { valid: boolean, data: Object|null, error: string|null }
 */
export function getStateFile(projectRoot, fileName, options = {}) {
  const { autoRecover = false } = options;
  const schema = STATE_SCHEMAS[fileName];

  if (!schema) {
    return {
      valid: false,
      data: null,
      error: `Unknown state file: ${fileName}`
    };
  }

  const filePath = path.join(projectRoot, '.agentful', fileName);
  const validation = validateStateFile(filePath, schema);

  if (!validation.valid && autoRecover) {
    const recovery = recoverStateFile(
      filePath,
      schema.defaults,
      validation.action,
      validation.missing_field
    );

    if (recovery.success) {
      // Re-validate after recovery
      const revalidation = validateStateFile(filePath, schema);
      return {
        valid: revalidation.valid,
        data: revalidation.data || null,
        error: revalidation.valid ? null : revalidation.error,
        recovered: true
      };
    }

    return {
      valid: false,
      data: null,
      error: `${validation.error}. Recovery failed: ${recovery.message}`
    };
  }

  return {
    valid: validation.valid,
    data: validation.data || null,
    error: validation.valid ? null : validation.error
  };
}

/**
 * Updates a state file with validation
 *
 * @param {string} projectRoot - Absolute path to project root directory
 * @param {string} fileName - Name of the state file (e.g., 'state.json')
 * @param {Object|Function} updates - Object with updates or function that receives current state
 * @returns {Object} Result with success flag and message
 */
export function updateStateFile(projectRoot, fileName, updates) {
  const schema = STATE_SCHEMAS[fileName];

  if (!schema) {
    return {
      success: false,
      message: `Unknown state file: ${fileName}`
    };
  }

  const filePath = path.join(projectRoot, '.agentful', fileName);

  try {
    // Get current state
    const current = getStateFile(projectRoot, fileName, { autoRecover: true });

    if (!current.valid) {
      return {
        success: false,
        message: `Cannot update invalid state file: ${current.error}`
      };
    }

    // Apply updates
    let newState;
    if (typeof updates === 'function') {
      newState = updates(current.data);
    } else {
      newState = { ...current.data, ...updates };
    }

    // Validate updated state has required fields
    for (const field of schema.requiredFields) {
      if (!(field in newState)) {
        return {
          success: false,
          message: `Update would remove required field '${field}'`
        };
      }
    }

    // Write updated state
    fs.writeFileSync(filePath, JSON.stringify(newState, null, 2), 'utf-8');

    return {
      success: true,
      message: `✅ Updated ${fileName}`,
      data: newState
    };

  } catch (e) {
    return {
      success: false,
      message: `Failed to update ${fileName}: ${e.message}`
    };
  }
}

/**
 * Resolves default values, calling functions if needed
 * @private
 */
function resolveDefaults(defaults) {
  const resolved = {};

  for (const [key, value] of Object.entries(defaults)) {
    if (typeof value === 'function') {
      resolved[key] = value();
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      resolved[key] = resolveDefaults(value);
    } else {
      resolved[key] = value;
    }
  }

  return resolved;
}

/**
 * Formats validation results for display
 *
 * @param {Object} results - Results from validateAllState()
 * @returns {string} Formatted output string
 */
export function formatValidationResults(results) {
  const lines = [];

  if (results.valid) {
    lines.push('✅ All state files are valid');
  } else {
    lines.push('❌ State validation failed');
  }

  if (results.errors.length > 0) {
    lines.push('\n**Errors:**');
    results.errors.forEach(error => lines.push(`  ${error}`));
  }

  if (results.warnings.length > 0) {
    lines.push('\n**Warnings:**');
    results.warnings.forEach(warning => lines.push(`  ${warning}`));
  }

  if (results.recovered.length > 0) {
    lines.push('\n**Recovered:**');
    results.recovered.forEach(recovery => lines.push(`  ${recovery}`));
  }

  return lines.join('\n');
}

export default {
  STATE_SCHEMAS,
  validateStateFile,
  recoverStateFile,
  validateAllState,
  getDefaultState,
  isStateFileValid,
  getStateFile,
  updateStateFile,
  formatValidationResults
};
