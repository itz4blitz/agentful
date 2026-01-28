/**
 * MCP Protocol Types
 * Type definitions for Model Context Protocol integration
 */

/**
 * MCP resource type
 */
export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
  metadata?: Record<string, unknown>;
}

/**
 * MCP tool type
 */
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

/**
 * MCP tool call result
 */
export interface MCPToolResult {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}

/**
 * Canvas element context for MCP
 */
export interface CanvasElementContext {
  id: string;
  type: string;
  tagName: string;
  props: Record<string, unknown>;
  styles: Record<string, string>;
  children: CanvasElementContext[];
  parentId?: string;
  position?: {
    index: number;
    siblingCount: number;
  };
}

/**
 * Canvas state for MCP
 */
export interface CanvasStateContext {
  elements: CanvasElementContext[];
  selectedElement: string | null;
  theme: {
    mode: 'light' | 'dark';
    colorScheme: string;
    borderRadius: string;
  };
  metadata: {
    version: string;
    lastModified: string;
    componentCount: number;
  };
}

/**
 * Component template context for MCP
 */
export interface ComponentTemplateContext {
  id: string;
  name: string;
  category: string;
  description: string;
  tags: string[];
  code: string;
  props?: Record<string, unknown>;
}
