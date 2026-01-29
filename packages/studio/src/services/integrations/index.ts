/**
 * Integration Services
 * Exports for coding CLI tool integration
 */

export { toolDetection, type CLITool, type ToolStatus, type MCPServerStatus } from './tool-detection';
export { 
  mcpConfigManager, 
  UNIVERSAL_MCP_REGISTRY,
  type MCPConfig, 
  type MCPRegistryEntry,
  type MCPServerDefinition 
} from './mcp-config-manager';
