/**
 * MCP Validation Adapter
 *
 * Bridges MCP server to agentful's validation system.
 * Provides access to quality gates: type checking, linting, tests, coverage, security, dead code.
 *
 * @module mcp/adapters/validation-adapter
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import { StateAdapter } from './state-adapter.js';

/**
 * Validation gate names
 */
export const ValidationGates = {
  TYPE_CHECK: 'typeCheck',
  LINT: 'lint',
  TESTS: 'tests',
  COVERAGE: 'coverage',
  SECURITY: 'security',
  DEAD_CODE: 'deadCode',
};

/**
 * Validation Adapter
 *
 * Provides MCP-compatible interface to agentful's validation system.
 * Executes quality gate checks and updates completion.json.
 */
export class ValidationAdapter {
  /**
   * Create validation adapter
   *
   * @param {Object} config - Adapter configuration
   * @param {string} [config.projectRoot=process.cwd()] - Project root directory
   * @param {number} [config.timeout=300000] - Default timeout in ms (5 minutes)
   */
  constructor(config = {}) {
    this.config = {
      projectRoot: config.projectRoot || process.cwd(),
      timeout: config.timeout || 300000,
      ...config,
    };

    // Initialize state adapter for updating validation gates
    this.stateAdapter = new StateAdapter({
      projectRoot: this.config.projectRoot,
    });
  }

  /**
   * Run validation checks
   *
   * @param {string[]} [gates] - Specific gates to run (if omitted, runs all)
   * @returns {Promise<Object>} Validation results
   *
   * Returns:
   * {
   *   passed: boolean,
   *   gates: {
   *     typeCheck: { passed: boolean, message?: string },
   *     lint: { passed: boolean, message?: string },
   *     tests: { passed: boolean, message?: string },
   *     coverage: { passed: boolean, message?: string, percentage?: number },
   *     security: { passed: boolean, message?: string },
   *     deadCode: { passed: boolean, message?: string }
   *   },
   *   summary: string
   * }
   */
  async runValidation(gates = null) {
    const gatesToRun = gates || Object.values(ValidationGates);

    const results = {
      passed: true,
      gates: {},
      summary: '',
    };

    // Run each gate
    for (const gate of gatesToRun) {
      try {
        const result = await this._runGate(gate);
        results.gates[gate] = result;

        if (!result.passed) {
          results.passed = false;
        }
      } catch (error) {
        results.gates[gate] = {
          passed: false,
          message: `Failed to run validation: ${error.message}`,
        };
        results.passed = false;
      }
    }

    // Generate summary
    const passedCount = Object.values(results.gates).filter((g) => g.passed).length;
    const totalCount = Object.keys(results.gates).length;

    results.summary = `${passedCount}/${totalCount} validation gates passed`;

    if (!results.passed) {
      const failedGates = Object.entries(results.gates)
        .filter(([, result]) => !result.passed)
        .map(([name]) => name);
      results.summary += `. Failed: ${failedGates.join(', ')}`;
    }

    // Update completion.json with validation results
    await this._updateValidationGates(results.gates);

    return results;
  }

  /**
   * Run a specific validation gate
   *
   * @private
   * @param {string} gate - Gate name
   * @returns {Promise<Object>} Gate result { passed: boolean, message?: string }
   */
  async _runGate(gate) {
    switch (gate) {
      case ValidationGates.TYPE_CHECK:
        return this._runTypeCheck();

      case ValidationGates.LINT:
        return this._runLint();

      case ValidationGates.TESTS:
        return this._runTests();

      case ValidationGates.COVERAGE:
        return this._runCoverage();

      case ValidationGates.SECURITY:
        return this._runSecurity();

      case ValidationGates.DEAD_CODE:
        return this._runDeadCode();

      default:
        throw new Error(`Unknown validation gate: ${gate}`);
    }
  }

  /**
   * Run type checking (TypeScript, Flow, mypy, etc.)
   *
   * @private
   */
  async _runTypeCheck() {
    // Detect type checker
    const hasTypeScript = existsSync(path.join(this.config.projectRoot, 'tsconfig.json'));
    const hasFlow = existsSync(path.join(this.config.projectRoot, '.flowconfig'));
    const hasPython = existsSync(path.join(this.config.projectRoot, 'pyproject.toml')) ||
                      existsSync(path.join(this.config.projectRoot, 'setup.py'));

    if (hasTypeScript) {
      return this._runCommand('npx', ['tsc', '--noEmit'], 'TypeScript type checking');
    }

    if (hasFlow) {
      return this._runCommand('npx', ['flow', 'check'], 'Flow type checking');
    }

    if (hasPython) {
      return this._runCommand('python', ['-m', 'mypy', '.'], 'mypy type checking');
    }

    // No type checker found - skip
    return {
      passed: true,
      message: 'No type checker configured (skipped)',
    };
  }

  /**
   * Run linting (ESLint, Prettier, etc.)
   *
   * @private
   */
  async _runLint() {
    // Try ESLint first
    if (existsSync(path.join(this.config.projectRoot, '.eslintrc.json')) ||
        existsSync(path.join(this.config.projectRoot, '.eslintrc.js')) ||
        existsSync(path.join(this.config.projectRoot, 'eslint.config.js'))) {
      return this._runCommand('npx', ['eslint', '.'], 'ESLint');
    }

    // Try Prettier
    if (existsSync(path.join(this.config.projectRoot, '.prettierrc'))) {
      return this._runCommand('npx', ['prettier', '--check', '.'], 'Prettier');
    }

    // Try Python linting
    if (existsSync(path.join(this.config.projectRoot, 'setup.py'))) {
      return this._runCommand('python', ['-m', 'flake8', '.'], 'flake8');
    }

    return {
      passed: true,
      message: 'No linter configured (skipped)',
    };
  }

  /**
   * Run tests
   *
   * @private
   */
  async _runTests() {
    const packageJsonPath = path.join(this.config.projectRoot, 'package.json');

    // Check for npm test script
    if (existsSync(packageJsonPath)) {
      return this._runCommand('npm', ['test'], 'npm test');
    }

    // Check for pytest
    if (existsSync(path.join(this.config.projectRoot, 'pytest.ini')) ||
        existsSync(path.join(this.config.projectRoot, 'pyproject.toml'))) {
      return this._runCommand('python', ['-m', 'pytest'], 'pytest');
    }

    return {
      passed: true,
      message: 'No tests configured (skipped)',
    };
  }

  /**
   * Run coverage check
   *
   * @private
   */
  async _runCoverage() {
    const packageJsonPath = path.join(this.config.projectRoot, 'package.json');

    // Check for npm coverage script
    if (existsSync(packageJsonPath)) {
      const result = await this._runCommand('npm', ['run', 'coverage'], 'npm coverage');

      // Try to extract coverage percentage from output
      const coverageMatch = result.message?.match(/(\d+(?:\.\d+)?)\s*%/);
      if (coverageMatch) {
        const percentage = parseFloat(coverageMatch[1]);
        result.percentage = percentage;

        // Require minimum 80% coverage
        if (percentage < 80) {
          result.passed = false;
          result.message = `Coverage ${percentage}% is below minimum 80%`;
        }
      }

      return result;
    }

    // Check for pytest coverage
    if (existsSync(path.join(this.config.projectRoot, 'pytest.ini'))) {
      return this._runCommand(
        'python',
        ['-m', 'pytest', '--cov', '--cov-report=term'],
        'pytest coverage'
      );
    }

    return {
      passed: true,
      message: 'No coverage configured (skipped)',
    };
  }

  /**
   * Run security audit
   *
   * @private
   */
  async _runSecurity() {
    const packageJsonPath = path.join(this.config.projectRoot, 'package.json');

    // Check for npm audit
    if (existsSync(packageJsonPath)) {
      return this._runCommand('npm', ['audit', '--audit-level=moderate'], 'npm audit');
    }

    // Check for Python safety
    if (existsSync(path.join(this.config.projectRoot, 'requirements.txt'))) {
      return this._runCommand('python', ['-m', 'safety', 'check'], 'safety check');
    }

    return {
      passed: true,
      message: 'No security audit configured (skipped)',
    };
  }

  /**
   * Run dead code detection
   *
   * @private
   */
  async _runDeadCode() {
    // Check for ts-prune (TypeScript)
    if (existsSync(path.join(this.config.projectRoot, 'tsconfig.json'))) {
      return this._runCommand('npx', ['ts-prune'], 'ts-prune');
    }

    // Check for depcheck (unused dependencies)
    const packageJsonPath = path.join(this.config.projectRoot, 'package.json');
    if (existsSync(packageJsonPath)) {
      return this._runCommand('npx', ['depcheck'], 'depcheck');
    }

    return {
      passed: true,
      message: 'No dead code detection configured (skipped)',
    };
  }

  /**
   * Run a shell command and return result
   *
   * @private
   * @param {string} command - Command to run
   * @param {string[]} args - Command arguments
   * @param {string} description - Human-readable description
   * @returns {Promise<Object>} Result { passed: boolean, message: string }
   */
  async _runCommand(command, args, description) {
    return new Promise((resolve) => {
      const proc = spawn(command, args, {
        cwd: this.config.projectRoot,
        timeout: this.config.timeout,
      });

      let output = '';
      let errorOutput = '';

      proc.stdout.on('data', (data) => {
        output += data.toString();
      });

      proc.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve({
            passed: true,
            message: `${description} passed`,
            output: output.substring(0, 500), // Truncate for brevity
          });
        } else {
          const message = errorOutput || output || 'Unknown error';
          resolve({
            passed: false,
            message: `${description} failed: ${message.substring(0, 200)}`,
            output: output.substring(0, 500),
          });
        }
      });

      proc.on('error', (error) => {
        resolve({
          passed: false,
          message: `${description} failed to run: ${error.message}`,
        });
      });
    });
  }

  /**
   * Update validation gates in completion.json
   *
   * @private
   * @param {Object} gates - Gate results
   */
  async _updateValidationGates(gates) {
    const gateStatuses = {};

    for (const [name, result] of Object.entries(gates)) {
      gateStatuses[name] = result.passed;
    }

    await this.stateAdapter.updateValidationGates(gateStatuses);
  }

  /**
   * Get current validation gate status from completion.json
   *
   * @returns {Promise<Object>} Current gate statuses
   */
  async getValidationStatus() {
    const completion = await this.stateAdapter.readCompletion();
    return completion.validationGates || {};
  }

  /**
   * Check if all validation gates are passing
   *
   * @returns {Promise<boolean>} True if all gates passing
   */
  async allGatesPassing() {
    const gates = await this.getValidationStatus();
    return Object.values(gates).every((passed) => passed === true);
  }
}

/**
 * Create validation adapter instance
 *
 * @param {Object} config - Adapter configuration
 * @returns {ValidationAdapter} Adapter instance
 */
export function createValidationAdapter(config = {}) {
  return new ValidationAdapter(config);
}

export default ValidationAdapter;
