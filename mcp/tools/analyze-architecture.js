/**
 * MCP Tool: Analyze Architecture
 *
 * Analyzes the codebase architecture and detects tech stack, patterns, and conventions.
 * Uses the CodebaseAnalyzer to scan files and generate architecture insights.
 *
 * @module mcp/tools/analyze-architecture
 */

/**
 * Analyze Architecture Tool Definition
 *
 * @type {Object}
 */
export const analyzeArchitectureTool = {
  name: 'analyze_architecture',
  description: 'Analyze codebase architecture to detect tech stack, frameworks, patterns, and conventions. Results are cached in .agentful/architecture.json.',

  inputSchema: {
    type: 'object',
    properties: {
      projectRoot: {
        type: 'string',
        description: 'Root directory of the project to analyze (defaults to current working directory)'
      },
      force: {
        type: 'boolean',
        description: 'Force re-analysis even if cached results exist',
        default: false
      },
      depth: {
        type: 'string',
        enum: ['shallow', 'standard', 'deep'],
        description: 'Analysis depth: shallow (fast, top-level only), standard (balanced), deep (comprehensive)',
        default: 'standard'
      },
      include: {
        type: 'array',
        items: { type: 'string' },
        description: 'Specific file patterns to include (e.g., ["src/**/*.js", "lib/**/*.ts"])'
      },
      exclude: {
        type: 'array',
        items: { type: 'string' },
        description: 'Additional patterns to exclude beyond defaults (e.g., ["vendor/**", "tmp/**"])'
      }
    },
    required: []
  },

  /**
   * Handler function for architecture analysis
   *
   * @param {Object} input - Tool input parameters
   * @param {string} [input.projectRoot] - Project root directory
   * @param {boolean} [input.force=false] - Force re-analysis
   * @param {string} [input.depth='standard'] - Analysis depth
   * @param {string[]} [input.include] - Patterns to include
   * @param {string[]} [input.exclude] - Patterns to exclude
   * @param {Object} adapters - MCP adapters
   * @param {Object} adapters.analyzer - Architecture analyzer adapter
   * @returns {Promise<Object>} MCP response with architecture analysis
   */
  async handler(input, adapters) {
    const {
      projectRoot,
      force = false,
      depth = 'standard',
      include,
      exclude
    } = input;

    // Validate depth parameter
    const allowedDepths = ['shallow', 'standard', 'deep'];
    if (!allowedDepths.includes(depth)) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Invalid depth',
            message: `Depth must be one of: ${allowedDepths.join(', ')}`,
            received: depth
          }, null, 2)
        }],
        isError: true
      };
    }

    // Validate project root if provided
    if (projectRoot) {
      // Basic path validation (no traversal attacks)
      if (projectRoot.includes('..') || projectRoot.startsWith('~')) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: 'Invalid project root',
              message: 'Project root must be an absolute path without ".." or "~"',
              received: projectRoot
            }, null, 2)
          }],
          isError: true
        };
      }
    }

    try {
      const startTime = Date.now();

      // Run architecture analysis using analyzer adapter
      const result = await adapters.analyzer.analyzeArchitecture({
        projectRoot: projectRoot || process.cwd(),
        force,
        depth,
        include,
        exclude
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Build response
      const response = {
        success: true,
        analysis: {
          version: result.version,
          projectRoot: result.projectRoot,
          analyzedAt: result.analyzedAt,
          isNewProject: result.isNewProject || false,
          fileCount: result.fileCount,
          confidence: result.confidence,
          duration,
          durationSeconds: Math.round(duration / 1000)
        },
        techStack: {
          languages: result.languages || [],
          primaryLanguage: result.primaryLanguage || null,
          frameworks: result.frameworks || [],
          runtime: result.runtime || null,
          packageManager: result.packageManager || null
        },
        patterns: {
          architectural: result.patterns || [],
          conventions: result.conventions || {},
          fileOrganization: result.fileOrganization || null
        },
        recommendations: {
          agents: result.recommendations?.agents || [],
          skills: result.recommendations?.skills || [],
          improvements: result.recommendations?.improvements || []
        },
        cached: result.cached || false,
        message: result.cached
          ? 'Using cached analysis results (use force: true to re-analyze)'
          : `Architecture analysis completed in ${Math.round(duration / 1000)}s`
      };

      // Add domains if detected
      if (result.domains && result.domains.length > 0) {
        response.domains = result.domains.map(domain => ({
          name: domain.name,
          confidence: domain.confidence,
          files: domain.files,
          description: domain.description || null
        }));
      }

      // Add warnings if confidence is low
      if (result.confidence < 50) {
        response.warning = 'Low confidence in analysis results. Project may be new, empty, or use uncommon patterns.';
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(response, null, 2)
        }]
      };

    } catch (error) {
      // Handle analyzer errors
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Architecture analysis failed',
            message: error.message,
            projectRoot: projectRoot || process.cwd(),
            suggestion: error.code === 'ENOENT'
              ? 'Project directory does not exist or is not accessible'
              : error.code === 'EACCES'
                ? 'Permission denied. Check directory permissions.'
                : 'Check that the analyzer adapter is properly configured and the project directory is valid.'
          }, null, 2)
        }],
        isError: true
      };
    }
  }
};

export default analyzeArchitectureTool;
