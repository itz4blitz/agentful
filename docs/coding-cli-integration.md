# Coding CLI Integration Hub

## Overview
Unified integration layer for all AI coding CLI tools (Claude Code, Gemini CLI, Codex CLI, Kiro CLI, Cursor, etc.) enabling seamless MCP server management, skill marketplace, and cross-tool synchronization.

## Architecture

### 1. Tool Detection Service
```typescript
interface CLITool {
  id: string;
  name: string;
  command: string;
  configPath: string;
  mcpFormat: 'claude' | 'gemini' | 'codex' | 'kiro' | 'cursor' | 'roo';
  version?: string;
  isInstalled: boolean;
}

class ToolDetectionService {
  async detectInstalledTools(): Promise<CLITool[]> {
    // Check for each tool's binary
    // Parse version if available
    // Return list of detected tools
  }
  
  async getToolStatus(tool: CLITool): Promise<ToolStatus> {
    // Check if running
    // Get process info
    // Check MCP health
  }
}
```

### 2. MCP Config Manager
Each tool has different config formats:

#### Claude Code (`~/.claude/settings.json`)
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path"]
    }
  }
}
```

#### Gemini CLI (`~/.gemini/config.json`)
```json
{
  "mcp": {
    "servers": [{
      "name": "filesystem",
      "transport": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem"]
    }]
  }
}
```

#### Cursor (`.cursor/mcp.json`)
```json
{
  "servers": [{
    "name": "filesystem",
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem"]
  }]
}
```

### 3. Unified MCP Registry
```typescript
interface MCPServer {
  id: string;
  name: string;
  description: string;
  publisher: string;
  npmPackage?: string;
  githubUrl?: string;
  configTemplate: Record<string, any>;
  requirements: string[];
  envVars?: string[];
  tags: string[];
}

// MCPs work across ALL tools
const UNIVERSAL_MCPs: MCPServer[] = [
  {
    id: 'filesystem',
    name: 'File System',
    npmPackage: '@modelcontextprotocol/server-filesystem',
    // Template varies per tool format
  },
  {
    id: 'github',
    name: 'GitHub',
    npmPackage: '@modelcontextprotocol/server-github',
  },
  // ... more
];
```

### 4. Sync Engine
Deep integration to read MCP status from each tool:

```typescript
interface MCPSyncEngine {
  // Read MCP config from tool
  readConfig(tool: CLITool): Promise<MCPConfig>;
  
  // Write MCP config to tool
  writeConfig(tool: CLITool, config: MCPConfig): Promise<void>;
  
  // Get live status from tool
  getMCPStatus(tool: CLITool): Promise<MCPStatus[]>;
  
  // Watch for changes
  onConfigChange(tool: CLITool, callback: (config: MCPConfig) => void): void;
}
```

### 5. Skills/Agents Marketplace
```typescript
interface MarketplaceItem {
  id: string;
  type: 'skill' | 'agent' | 'hook' | 'mcp';
  name: string;
  description: string;
  author: string;
  installs: number;
  rating: number;
  tags: string[];
  
  // Installation config
  install: {
    npm?: string;
    github?: string;
    files?: { path: string; content: string }[];
    postInstall?: string[];
  };
  
  // Which tools support this
  compatibleTools: string[];
}
```

## UI Design

### Tool Selector Dropdown
```
┌────────────────────────────────────────┐
│ 🛠️ Active Tool: [Claude Code      ▼]  │
│                                        │
│ Detected Tools:                        │
│ ✅ Claude Code v0.2.14                │
│ ✅ Gemini CLI v1.0.2                  │
│ ⚠️  Cursor (needs MCP config)         │
│ ➕ Install another tool...            │
└────────────────────────────────────────┘
```

### MCP Status Panel
```
┌────────────────────────────────────────────────────┐
│ MCP Servers                    [+ Add Server]     │
├────────────────────────────────────────────────────┤
│                                                    │
│ 📁 Filesystem    ✅ Active    [Logs] [Configure]  │
│    @modelcontextprotocol/server-filesystem         │
│    Allowed: /Users/dev/projects                   │
│                                                    │
│ 🔗 GitHub        ❌ Error     [Logs] [Restart]    │
│    Token expired - click to re-authenticate       │
│                                                    │
│ 🗄️ PostgreSQL    ✅ Active    [Logs] [Configure]  │
│    Connected to: localhost:5432                   │
│                                                    │
│ ➕ Discover more MCP servers...                   │
└────────────────────────────────────────────────────┘
```

### 1-Click Install Flow
1. User clicks "Install" on marketplace item
2. Detect which tools are available
3. If multiple: "Install for: [Claude] [Gemini] [Both]"
4. Run install command (npm install / git clone)
5. Update tool's config file with MCP/skill configuration
6. Restart tool if running (or notify user)
7. Show success + logs

## Implementation Phases

### Phase 1: Tool Detection (Week 1)
- Detect installed CLI tools
- Read their versions
- Show tool selector UI

### Phase 2: MCP Config Management (Week 2)
- Read/write MCP configs for each tool format
- Add/remove MCP servers
- Config validation

### Phase 3: Status Sync (Week 3)
- Read MCP status from tools
- Parse tool logs
- Show connection health
- Error notifications

### Phase 4: Marketplace (Week 4)
- Skills/agents/hooks registry
- 1-click install
- Tool-specific installation
- Post-install hooks

### Phase 5: Advanced Features
- Auto-detect tool from project
- Sync configs across tools
- Import/export MCP bundles
- Team sharing

## Technical Challenges

1. **Config Format Differences**: Each tool uses different JSON structure
   - Solution: Adapter pattern with format converters

2. **Live Status**: Tools don't expose APIs for MCP status
   - Solution: Parse log files, process inspection, or wrapper scripts

3. **Restart Required**: Most tools need restart after MCP changes
   - Solution: Detect if running, offer restart, show pending changes

4. **Environment Variables**: MCPs often need env vars
   - Solution: .env file integration, secure storage for secrets

5. **Tool Conflicts**: Multiple tools with different MCP versions
   - Solution: Isolation, version management, conflict warnings

## Success Metrics
- Users can see all installed coding tools
- 1-click MCP install works for 5+ tools
- MCP status visible in real-time
- Skills marketplace has 50+ items
- User can switch tools without reconfiguring MCPs
