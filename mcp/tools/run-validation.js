/**
 * MCP Tool: Run Validation
 *
 * Executes quality gate validations (type checking, linting, tests, coverage, security).
 * Returns detailed validation results with pass/fail status for each gate.
 *
 * @module mcp/tools/run-validation
 */

/**
 * Run Validation Tool Definition
 *
 * @type {Object}
 */
export const runValidationTool = {
  name: 'run_validation',
  description: 'Run quality gate validations including type checking, linting, tests, coverage, and security checks. Returns pass/fail status for each gate.',

  inputSchema: {
    type: 'object',
    properties: {
      gates: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['types', 'lint', 'tests', 'coverage', 'security', 'deadcode']
        },
        description: 'Specific gates to run. If not specified, runs all gates.',
        uniqueItems: true
      },
      fix: {
        type: 'boolean',
        description: 'Attempt to auto-fix issues where possible (e.g., lint, formatting)',
        default: false
      },
      failFast: {
        type: 'boolean',
        description: 'Stop on first failure instead of running all gates',
        default: false
      },
      coverage: {
        type: 'object',
        properties: {
          threshold: {
            type: 'number',
            description: 'Minimum coverage percentage required (0-100)',
            minimum: 0,
            maximum: 100,
            default: 80
          }
        }
      },
      context: {
        type: 'object',
        properties: {
          files: {
            type: 'array',
            items: { type: 'string' },
            description: 'Specific files to validate (if not provided, validates entire codebase)'
          },
          directories: {
            type: 'array',
            items: { type: 'string' },
            description: 'Specific directories to validate'
          }
        }
      }
    },
    required: []
  },

  /**
   * Handler function for running validations
   *
   * @param {Object} input - Tool input parameters
   * @param {string[]} [input.gates] - Specific gates to run
   * @param {boolean} [input.fix=false] - Auto-fix issues
   * @param {boolean} [input.failFast=false] - Stop on first failure
   * @param {Object} [input.coverage] - Coverage settings
   * @param {Object} [input.context] - Validation context
   * @param {Object} adapters - MCP adapters
   * @param {Object} adapters.validation - Validation adapter
   * @returns {Promise<Object>} MCP response with validation results
   */
  async handler(input, adapters) {
    const {
      gates,
      fix = false,
      failFast = false,
      coverage = { threshold: 80 },
      context = {}
    } = input;

    // Define all available gates
    const allGates = ['types', 'lint', 'tests', 'coverage', 'security', 'deadcode'];
    const gatesToRun = gates && gates.length > 0 ? gates : allGates;

    // Validate gate names
    const invalidGates = gatesToRun.filter(gate => !allGates.includes(gate));
    if (invalidGates.length > 0) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Invalid gates',
            message: `Invalid gate names: ${invalidGates.join(', ')}`,
            allowedGates: allGates,
            received: invalidGates
          }, null, 2)
        }],
        isError: true
      };
    }

    // Validate coverage threshold
    if (coverage.threshold !== undefined && (coverage.threshold < 0 || coverage.threshold > 100)) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Invalid coverage threshold',
            message: 'Coverage threshold must be between 0 and 100',
            received: coverage.threshold
          }, null, 2)
        }],
        isError: true
      };
    }

    try {
      const startTime = Date.now();

      // Run validations using validation adapter
      const results = await adapters.validation.runValidation({
        gates: gatesToRun,
        fix,
        failFast,
        coverage,
        context
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Calculate summary statistics
      const summary = {
        total: results.gates.length,
        passed: results.gates.filter(g => g.passed).length,
        failed: results.gates.filter(g => !g.passed).length,
        skipped: results.gates.filter(g => g.skipped).length,
        duration,
        durationSeconds: Math.round(duration / 1000)
      };

      // Build response
      const response = {
        success: results.allPassed,
        summary,
        gates: results.gates.map(gate => ({
          name: gate.name,
          passed: gate.passed,
          skipped: gate.skipped || false,
          duration: gate.duration,
          errors: gate.errors || [],
          warnings: gate.warnings || [],
          metadata: gate.metadata || {}
        })),
        timestamp: new Date().toISOString(),
        message: results.allPassed
          ? `All validation gates passed (${summary.passed}/${summary.total})`
          : `Validation failed: ${summary.failed} gate(s) failed, ${summary.passed} passed`
      };

      // Add fix information if fix mode was enabled
      if (fix) {
        response.fixAttempted = true;
        response.fixedIssues = results.gates.reduce((sum, gate) => sum + (gate.fixed || 0), 0);
      }

      // Add detailed error messages for failed gates
      const failedGates = results.gates.filter(g => !g.passed && !g.skipped);
      if (failedGates.length > 0) {
        response.failures = failedGates.map(gate => ({
          gate: gate.name,
          errorCount: gate.errors ? gate.errors.length : 0,
          firstError: gate.errors && gate.errors.length > 0 ? gate.errors[0] : null,
          suggestion: gate.suggestion || null
        }));
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(response, null, 2)
        }]
      };

    } catch (error) {
      // Handle validation errors
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Validation execution failed',
            message: error.message,
            gates: gatesToRun,
            suggestion: error.code === 'ENOENT'
              ? 'Required validation tools may not be installed. Check package.json for test/lint scripts.'
              : 'Check that the validation adapter is properly configured and validation tools are available.'
          }, null, 2)
        }],
        isError: true
      };
    }
  }
};

export default runValidationTool;
