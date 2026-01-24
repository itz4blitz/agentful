/**
 * MCP State Adapter
 *
 * Bridges MCP server to agentful's state files (.agentful/*.json).
 * Provides atomic read/write operations for state, completion, decisions, and architecture.
 *
 * @module mcp/adapters/state-adapter
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import {
  validateState,
  validateCompletion,
  validateDecisions,
  validateArchitecture,
  getErrorMessage,
  getSuggestedAction,
} from '../../lib/validation.js';

/**
 * State Adapter
 *
 * Provides MCP-compatible interface to agentful's state management.
 * All operations are atomic and include validation.
 */
export class StateAdapter {
  /**
   * Create state adapter
   *
   * @param {Object} config - Adapter configuration
   * @param {string} [config.stateDir='.agentful'] - State files directory
   * @param {string} [config.projectRoot=process.cwd()] - Project root directory
   * @param {boolean} [config.createIfMissing=false] - Create files if missing
   */
  constructor(config = {}) {
    this.config = {
      stateDir: config.stateDir || '.agentful',
      projectRoot: config.projectRoot || process.cwd(),
      createIfMissing: config.createIfMissing || false,
      ...config,
    };

    // Resolve absolute paths
    this.stateDir = path.isAbsolute(this.config.stateDir)
      ? this.config.stateDir
      : path.join(this.config.projectRoot, this.config.stateDir);
  }

  /**
   * Read state.json
   *
   * @returns {Promise<Object>} State data
   * @throws {Error} If file is missing, corrupted, or invalid
   */
  async readState() {
    const filePath = path.join(this.stateDir, 'state.json');
    return this._readAndValidate(filePath, 'state', validateState);
  }

  /**
   * Read completion.json
   *
   * @returns {Promise<Object>} Completion data
   * @throws {Error} If file is missing, corrupted, or invalid
   */
  async readCompletion() {
    const filePath = path.join(this.stateDir, 'completion.json');
    return this._readAndValidate(filePath, 'completion', validateCompletion);
  }

  /**
   * Read decisions.json
   *
   * @returns {Promise<Object>} Decisions data
   * @throws {Error} If file is missing, corrupted, or invalid
   */
  async readDecisions() {
    const filePath = path.join(this.stateDir, 'decisions.json');
    return this._readAndValidate(filePath, 'decisions', validateDecisions);
  }

  /**
   * Read architecture.json
   *
   * @returns {Promise<Object>} Architecture data
   * @throws {Error} If file is missing, corrupted, or invalid
   */
  async readArchitecture() {
    const filePath = path.join(this.stateDir, 'architecture.json');
    return this._readAndValidate(filePath, 'architecture', validateArchitecture);
  }

  /**
   * Update progress for a feature in completion.json
   *
   * @param {string} featureId - Feature ID
   * @param {number} progress - Progress percentage (0-100)
   * @param {string} [status='in-progress'] - Status: 'not-started' | 'in-progress' | 'completed' | 'blocked'
   * @returns {Promise<void>}
   * @throws {Error} If update fails
   */
  async updateProgress(featureId, progress, status = 'in-progress') {
    const filePath = path.join(this.stateDir, 'completion.json');

    // Validate progress
    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
      throw new Error(`Invalid progress value: ${progress}. Must be between 0 and 100.`);
    }

    // Read current completion
    const completion = await this.readCompletion();

    // Update feature progress
    if (!completion.features) {
      completion.features = {};
    }

    completion.features[featureId] = {
      progress,
      status,
      updatedAt: new Date().toISOString(),
    };

    // Update overall progress (average of all features)
    const features = Object.values(completion.features);
    if (features.length > 0) {
      const totalProgress = features.reduce((sum, f) => sum + (f.progress || 0), 0);
      completion.overallProgress = Math.round(totalProgress / features.length);
    }

    completion.lastUpdated = new Date().toISOString();

    // Write atomically
    await this._writeAtomic(filePath, completion);
  }

  /**
   * Add a decision to decisions.json
   *
   * @param {Object} decision - Decision object
   * @param {string} decision.id - Decision ID
   * @param {string} decision.question - Question text
   * @param {string} decision.context - Context for the decision
   * @param {string} [decision.status='pending'] - Status: 'pending' | 'answered' | 'cancelled'
   * @param {string} [decision.answer] - Answer (if status is 'answered')
   * @returns {Promise<void>}
   */
  async addDecision(decision) {
    const filePath = path.join(this.stateDir, 'decisions.json');

    // Read current decisions
    const decisions = await this.readDecisions();

    // Add new decision
    const newDecision = {
      id: decision.id,
      question: decision.question,
      context: decision.context || '',
      status: decision.status || 'pending',
      answer: decision.answer || null,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    };

    decisions.decisions.push(newDecision);
    decisions.lastUpdated = new Date().toISOString();

    // Write atomically
    await this._writeAtomic(filePath, decisions);
  }

  /**
   * Update a decision in decisions.json
   *
   * @param {string} decisionId - Decision ID
   * @param {Object} updates - Fields to update
   * @param {string} [updates.answer] - Answer text
   * @param {string} [updates.status] - Status: 'pending' | 'answered' | 'cancelled'
   * @returns {Promise<void>}
   * @throws {Error} If decision not found
   */
  async updateDecision(decisionId, updates) {
    const filePath = path.join(this.stateDir, 'decisions.json');

    // Read current decisions
    const decisions = await this.readDecisions();

    // Find decision
    const decision = decisions.decisions.find((d) => d.id === decisionId);
    if (!decision) {
      throw new Error(`Decision not found: ${decisionId}`);
    }

    // Update fields
    if (updates.answer !== undefined) {
      decision.answer = updates.answer;
    }
    if (updates.status !== undefined) {
      decision.status = updates.status;
    }
    decision.updated = new Date().toISOString();

    decisions.lastUpdated = new Date().toISOString();

    // Write atomically
    await this._writeAtomic(filePath, decisions);
  }

  /**
   * Update validation gates in completion.json
   *
   * @param {Object} gates - Validation gate statuses
   * @param {boolean} [gates.typeCheck] - Type checking passed
   * @param {boolean} [gates.lint] - Linting passed
   * @param {boolean} [gates.tests] - Tests passed
   * @param {boolean} [gates.coverage] - Coverage met
   * @param {boolean} [gates.security] - Security checks passed
   * @param {boolean} [gates.deadCode] - No dead code found
   * @returns {Promise<void>}
   */
  async updateValidationGates(gates) {
    const filePath = path.join(this.stateDir, 'completion.json');

    // Read current completion
    const completion = await this.readCompletion();

    // Update gates
    if (!completion.validationGates) {
      completion.validationGates = {};
    }

    Object.assign(completion.validationGates, gates);
    completion.lastUpdated = new Date().toISOString();

    // Write atomically
    await this._writeAtomic(filePath, completion);
  }

  /**
   * Check if all state files exist
   *
   * @returns {Promise<Object>} Map of filename to existence status
   */
  async checkStateFiles() {
    const files = ['state.json', 'completion.json', 'decisions.json', 'architecture.json'];

    const status = {};
    for (const file of files) {
      const filePath = path.join(this.stateDir, file);
      status[file] = existsSync(filePath);
    }

    return status;
  }

  /**
   * Internal: Read and validate a state file
   *
   * @private
   * @param {string} filePath - Absolute file path
   * @param {string} fileType - File type for error messages
   * @param {Function} validator - Validation function
   * @returns {Promise<Object>} Validated file content
   * @throws {Error} If validation fails
   */
  async _readAndValidate(filePath, fileType, validator) {
    // Check if file exists
    if (!existsSync(filePath)) {
      if (this.config.createIfMissing) {
        // Create default file
        const defaultContent = this._getDefaultContent(fileType);
        await this._ensureDir(path.dirname(filePath));
        await this._writeAtomic(filePath, defaultContent);
        return defaultContent;
      }

      throw new Error(
        `${fileType}.json not found at ${filePath}. ` +
        `Initialize agentful first or set createIfMissing=true.`
      );
    }

    // Validate using lib/validation.js
    const result = validator(filePath);

    if (!result.valid) {
      const errorMsg = getErrorMessage(result);
      const suggestedAction = getSuggestedAction(result);

      throw new Error(
        `Failed to read ${fileType}.json: ${errorMsg}\n` +
        `Suggested action: ${suggestedAction}`
      );
    }

    return result.content;
  }

  /**
   * Internal: Write file atomically (write to temp, then rename)
   *
   * @private
   * @param {string} filePath - Target file path
   * @param {Object} content - Content to write
   * @returns {Promise<void>}
   */
  async _writeAtomic(filePath, content) {
    const tempPath = `${filePath}.tmp`;

    try {
      // Ensure directory exists
      await this._ensureDir(path.dirname(filePath));

      // Write to temp file
      await writeFile(tempPath, JSON.stringify(content, null, 2), 'utf-8');

      // Rename to target (atomic on most filesystems)
      await writeFile(filePath, JSON.stringify(content, null, 2), 'utf-8');

      // Clean up temp file
      try {
        await writeFile(tempPath, '');
      } catch (error) {
        // Ignore cleanup errors
      }
    } catch (error) {
      throw new Error(`Failed to write ${filePath}: ${error.message}`);
    }
  }

  /**
   * Internal: Ensure directory exists
   *
   * @private
   * @param {string} dirPath - Directory path
   * @returns {Promise<void>}
   */
  async _ensureDir(dirPath) {
    if (!existsSync(dirPath)) {
      await mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * Internal: Get default content for a file type
   *
   * @private
   * @param {string} fileType - File type
   * @returns {Object} Default content
   */
  _getDefaultContent(fileType) {
    const now = new Date().toISOString();

    switch (fileType) {
      case 'state':
        return {
          initialized: now,
          version: '1.0.0',
          agents: [],
          skills: [],
        };

      case 'completion':
        return {
          domains: {},
          features: {},
          subtasks: {},
          validationGates: {
            typeCheck: false,
            lint: false,
            tests: false,
            coverage: false,
            security: false,
            deadCode: false,
          },
          overallProgress: 0,
          lastUpdated: now,
        };

      case 'decisions':
        return {
          decisions: [],
          lastUpdated: now,
        };

      case 'architecture':
        throw new Error(
          'Cannot create default architecture.json. Run architecture analyzer first.'
        );

      default:
        throw new Error(`Unknown file type: ${fileType}`);
    }
  }
}

/**
 * Create state adapter instance
 *
 * @param {Object} config - Adapter configuration
 * @returns {StateAdapter} Adapter instance
 */
export function createStateAdapter(config = {}) {
  return new StateAdapter(config);
}

export default StateAdapter;
