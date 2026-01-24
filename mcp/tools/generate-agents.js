/**
 * MCP Tool: Generate Agents
 *
 * Generates specialized agent definitions based on architecture analysis.
 * Creates agents tailored to the detected tech stack and project patterns.
 *
 * @module mcp/tools/generate-agents
 */

/**
 * Generate Agents Tool Definition
 *
 * @type {Object}
 */
export const generateAgentsTool = {
  name: 'generate_agents',
  description: 'Generate specialized agent definitions based on detected architecture and tech stack. Agents are written to .claude/agents/ directory.',

  inputSchema: {
    type: 'object',
    properties: {
      architecture: {
        type: 'object',
        description: 'Architecture analysis data (if not provided, will run analysis first)',
        additionalProperties: true
      },
      agents: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['orchestrator', 'backend', 'frontend', 'tester', 'reviewer', 'fixer', 'architect', 'all']
        },
        description: 'Specific agents to generate. Use "all" to generate all recommended agents.',
        uniqueItems: true
      },
      force: {
        type: 'boolean',
        description: 'Overwrite existing agent files (preserves custom agents)',
        default: false
      },
      preserveCustom: {
        type: 'boolean',
        description: 'Preserve user-modified agents in .claude/agents/custom/',
        default: true
      },
      outputDir: {
        type: 'string',
        description: 'Output directory for generated agents (defaults to .claude/agents/)'
      }
    },
    required: []
  },

  /**
   * Handler function for generating agents
   *
   * @param {Object} input - Tool input parameters
   * @param {Object} [input.architecture] - Architecture data
   * @param {string[]} [input.agents] - Specific agents to generate
   * @param {boolean} [input.force=false] - Overwrite existing files
   * @param {boolean} [input.preserveCustom=true] - Preserve custom agents
   * @param {string} [input.outputDir] - Output directory
   * @param {Object} adapters - MCP adapters
   * @param {Object} adapters.generator - Agent generator adapter
   * @param {Object} adapters.analyzer - Architecture analyzer adapter
   * @returns {Promise<Object>} MCP response with generation results
   */
  async handler(input, adapters) {
    const {
      architecture,
      agents,
      force = false,
      preserveCustom = true,
      outputDir
    } = input;

    // Validate agent names if provided
    const allowedAgents = ['orchestrator', 'backend', 'frontend', 'tester', 'reviewer', 'fixer', 'architect', 'all'];
    if (agents) {
      const invalidAgents = agents.filter(agent => !allowedAgents.includes(agent));
      if (invalidAgents.length > 0) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: 'Invalid agent names',
              message: `Invalid agent names: ${invalidAgents.join(', ')}`,
              allowedAgents,
              received: invalidAgents
            }, null, 2)
          }],
          isError: true
        };
      }
    }

    // Validate output directory if provided
    if (outputDir) {
      if (outputDir.includes('..') || outputDir.startsWith('~')) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: 'Invalid output directory',
              message: 'Output directory must not contain ".." or "~"',
              received: outputDir
            }, null, 2)
          }],
          isError: true
        };
      }
    }

    try {
      const startTime = Date.now();

      // Get architecture data if not provided
      let archData = architecture;
      if (!archData) {
        archData = await adapters.analyzer.analyzeArchitecture({
          projectRoot: process.cwd(),
          force: false,
          depth: 'standard'
        });
      }

      // Determine which agents to generate
      let agentsToGenerate = agents || ['all'];
      if (agentsToGenerate.includes('all')) {
        // Use recommended agents from architecture analysis
        agentsToGenerate = archData.recommendations?.agents || [
          'orchestrator',
          'backend',
          'frontend',
          'tester',
          'reviewer',
          'fixer'
        ];
      }

      // Generate agents using generator adapter
      const result = await adapters.generator.generateAgents({
        architecture: archData,
        agents: agentsToGenerate,
        force,
        preserveCustom,
        outputDir: outputDir || '.claude/agents/'
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Build response
      const response = {
        success: true,
        generated: result.generated.map(agent => ({
          name: agent.name,
          path: agent.path,
          type: agent.type || 'generated',
          overwritten: agent.overwritten || false
        })),
        preserved: result.preserved || [],
        skipped: result.skipped || [],
        summary: {
          total: result.generated.length,
          new: result.generated.filter(a => !a.overwritten).length,
          overwritten: result.generated.filter(a => a.overwritten).length,
          preserved: (result.preserved || []).length,
          skipped: (result.skipped || []).length
        },
        outputDir: result.outputDir,
        duration,
        durationSeconds: Math.round(duration / 1000),
        timestamp: new Date().toISOString(),
        message: `Generated ${result.generated.length} agent(s) in ${Math.round(duration / 1000)}s`
      };

      // Add tech stack info for context
      response.techStack = {
        primaryLanguage: archData.primaryLanguage,
        frameworks: archData.frameworks?.slice(0, 3).map(f => f.name) || [],
        confidence: archData.confidence
      };

      // Add warnings if any
      if (result.warnings && result.warnings.length > 0) {
        response.warnings = result.warnings;
      }

      // Add preservation notice
      if (preserveCustom && result.preserved && result.preserved.length > 0) {
        response.preservationNotice = `${result.preserved.length} custom agent(s) were preserved and not overwritten`;
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(response, null, 2)
        }]
      };

    } catch (error) {
      // Handle generation errors
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Agent generation failed',
            message: error.message,
            agents: agents || ['all'],
            suggestion: error.code === 'ENOENT'
              ? 'Output directory does not exist and could not be created'
              : error.code === 'EACCES'
                ? 'Permission denied. Check directory write permissions.'
                : error.message.includes('architecture')
                  ? 'Run analyze_architecture first or provide architecture data'
                  : 'Check that the generator adapter is properly configured.'
          }, null, 2)
        }],
        isError: true
      };
    }
  }
};

export default generateAgentsTool;
