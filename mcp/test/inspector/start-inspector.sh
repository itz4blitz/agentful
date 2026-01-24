#!/bin/bash
echo "🚀 Starting MCP Inspector for agentful..."
echo "UI will be available at: http://localhost:6274"
echo ""
cd /Users/blitz/Development/agentful/mcp
npx @modelcontextprotocol/inspector node bin/mcp-server.js
