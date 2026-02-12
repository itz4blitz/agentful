# Agentful Workspace

Current repository layout:

- Root package (`@itz4blitz/agentful`) - CLI/runtime templates
- MCP server package (`packages/mcp-server`)

## Quick Start

```bash
# Install root + MCP dependencies
npm run install:all

# Run root tests
npm test

# Run MCP tests
npm run test:mcp

# Build MCP server
npm run build:mcp
```

## VS Code Workspace

Open `agentful.code-workspace` to load:

- `🚀 Root`
- `🔌 MCP Server`

## Notes

- Studio/extension packages were removed from this workspace.
- Commands/scripts now target the root package and MCP server only.
