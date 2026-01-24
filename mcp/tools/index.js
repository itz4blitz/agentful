/**
 * MCP Tools Index
 *
 * Exports all agentful MCP tools for use in the MCP server.
 * Each tool follows the MCP protocol specification with inputSchema and handler.
 *
 * @module mcp/tools
 */

import { launchSpecialistTool } from './launch-specialist.js';
import { getStatusTool } from './get-status.js';
import { updateProgressTool } from './update-progress.js';
import { runValidationTool } from './run-validation.js';
import { resolveDecisionTool } from './resolve-decision.js';
import { analyzeArchitectureTool } from './analyze-architecture.js';
import { generateAgentsTool } from './generate-agents.js';
import { manageStateTool } from './manage-state.js';

/**
 * All available MCP tools
 *
 * Array of tool definitions that can be registered with an MCP server.
 * Each tool includes:
 * - name: Unique tool identifier
 * - description: Human-readable description
 * - inputSchema: JSON schema for input validation
 * - handler: Async function that executes the tool
 *
 * @type {Array<Object>}
 */
export const tools = [
  launchSpecialistTool,
  getStatusTool,
  updateProgressTool,
  runValidationTool,
  resolveDecisionTool,
  analyzeArchitectureTool,
  generateAgentsTool,
  manageStateTool
];

/**
 * Get tool by name
 *
 * @param {string} name - Tool name
 * @returns {Object|null} Tool definition or null if not found
 */
export function getToolByName(name) {
  return tools.find(tool => tool.name === name) || null;
}

/**
 * Get all tool names
 *
 * @returns {string[]} Array of tool names
 */
export function getToolNames() {
  return tools.map(tool => tool.name);
}

/**
 * Validate tool configuration
 *
 * Checks that all tools have required properties and valid schemas.
 *
 * @returns {Object} Validation result { valid: boolean, errors: string[] }
 */
export function validateTools() {
  const errors = [];

  for (const tool of tools) {
    // Check required properties
    if (!tool.name) {
      errors.push('Tool missing "name" property');
    }
    if (!tool.description) {
      errors.push(`Tool "${tool.name || 'unknown'}" missing "description" property`);
    }
    if (!tool.inputSchema) {
      errors.push(`Tool "${tool.name || 'unknown'}" missing "inputSchema" property`);
    }
    if (!tool.handler || typeof tool.handler !== 'function') {
      errors.push(`Tool "${tool.name || 'unknown'}" missing or invalid "handler" function`);
    }

    // Validate schema structure
    if (tool.inputSchema) {
      if (tool.inputSchema.type !== 'object') {
        errors.push(`Tool "${tool.name}" inputSchema must be type "object"`);
      }
      if (!tool.inputSchema.properties) {
        errors.push(`Tool "${tool.name}" inputSchema missing "properties"`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Export individual tools for direct import
 */
export {
  launchSpecialistTool,
  getStatusTool,
  updateProgressTool,
  runValidationTool,
  resolveDecisionTool,
  analyzeArchitectureTool,
  generateAgentsTool,
  manageStateTool
};

/**
 * Default export
 */
export default {
  tools,
  getToolByName,
  getToolNames,
  validateTools
};
