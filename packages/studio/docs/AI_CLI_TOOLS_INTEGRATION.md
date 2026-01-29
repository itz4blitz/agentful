# AI CLI Tools Integration Hub - User Guide

The **Integration Hub** provides a unified interface for managing MCP (Model Context Protocol) servers across multiple AI coding tools. Add, remove, and configure MCP servers with a single click for Claude Code, Gemini CLI, Codex CLI, Kiro, Cursor, and Cline.

## Table of Contents

- [Quick Start](#quick-start)
- [Accessing the Integration Hub](#accessing-the-integration-hub)
- [Supported Tools](#supported-tools)
- [MCP Server Management](#mcp-server-management)
- [Tool-Specific Configuration](#tool-specific-configuration)
- [Available MCP Servers](#available-mcp-servers)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites

1. **Install agentful VS Code extension**
2. **Have at least one AI coding tool installed**:
   - Claude Code (`npm install -g @anthropic-ai/claude-code`)
   - Cursor IDE
   - Cline VS Code extension
   - Other supported tools

### Basic Workflow

1. Open the Integration Hub (see [Accessing](#accessing-the-integration-hub))
2. Select your active tool from the dropdown
3. Click "Add" to install an MCP server
4. Configure required settings (API keys, paths, etc.)
5. Click "Install" - the hub handles all config format differences automatically

---

## Accessing the Integration Hub

There are three ways to open the Integration Hub:

### Method 1: From Sidebar

1. Open the agentful sidebar in VS Code
2. Click **"Integration Hub"** in Quick Actions

### Method 2: From Command Palette

1. Press `Cmd/Ctrl + Shift + P`
2. Type **"Agentful: Open Integration Hub"**
3. Press Enter

### Method 3: From Visual Builder

1. Open agentful Visual Builder
2. Click **"Integrations"** button in the top toolbar

---

## Supported Tools

The Integration Hub supports 6 major AI coding tools:

| Tool | Type | Config Location | MCP Support | Skills | Hooks |
|------|------|----------------|-------------|--------|-------|
| **Claude Code** | CLI | `~/.claude.json` | ✅ | ✅ | ✅ |
| **Gemini CLI** | CLI | `~/.gemini/settings.json` | ✅ | ✅ | ✅ |
| **Codex CLI** | CLI | `~/.codex/config.toml` | ✅ | ✅ | ❌ |
| **Kiro** | CLI | `~/.kiro/settings/mcp.json` | ✅ | ✅ | ✅ |
| **Cursor** | IDE | `.cursor/mcp.json` | ✅ | ✅ | ✅ |
| **Cline** | VS Code Extension | OS-specific* | ✅ | ✅ | ✅ |

*Cline config location varies by OS (see [Cline Configuration](#cline-configuration))

### Feature Support Legend

- **MCP**: Model Context Protocol for external tools
- **Skills**: Custom capabilities (called "Powers" in some tools)
- **Hooks**: Event-driven automation
- **Agents**: Specialized AI agents

---

## MCP Server Management

### Adding an MCP Server

1. Click **"Add"** button in the MCP Servers section
2. Search or browse the MCP registry
3. Select a server (e.g., "GitHub", "PostgreSQL")
4. Fill in required configuration:
   - **API keys** (e.g., `GITHUB_PERSONAL_ACCESS_TOKEN`)
   - **Paths** (e.g., `allowedDirectories` for filesystem)
   - **Connection strings** (e.g., `databaseUrl` for PostgreSQL)
5. Click **"Install"**

The Integration Hub automatically:
- Converts config to the correct format for your tool
- Creates missing directories
- Merges with existing config (preserves other settings)
- Validates JSON syntax (JSON tools only)

### Removing an MCP Server

1. Find the server in the list
2. Click the **trash icon** (🗑️)
3. Confirm removal

The server config is removed from your tool's configuration file.

### Enabling/Disabling Servers

1. Find the server in the list
2. Click the **power icon** (⚡) to toggle

When disabled, the server config remains but won't be used by the tool.

### Server Status

Each server shows a status badge:

- 🟢 **Active**: Server is running and responding
- 🟡 **Connecting**: Server is starting up
- 🔴 **Error**: Server failed to start (click to see error)
- ⚪ **Stopped**: Server is disabled

---

## Tool-Specific Configuration

Each tool uses a different config format and location. The Integration Hub handles all conversions automatically.

### Claude Code

**Config Location:** `~/.claude.json`

**Format:** JSON with `mcpServers` object

**Example:**
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxx"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/you/projects"],
      "env": {}
    }
  }
}
```

**Features:**
- ✅ Full MCP support
- ✅ Hooks for automation
- ✅ Custom skills
- ✅ Multiple agents

**Installation:**
```bash
npm install -g @anthropic-ai/claude-code
```

**Docs:** [docs.anthropic.com](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code)

---

### Gemini CLI

**Config Location:** `~/.gemini/settings.json`

**Format:** JSON with `mcp.servers` array

**Example:**
```json
{
  "mcp": {
    "servers": [
      {
        "name": "github",
        "transport": "stdio",
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-github"],
        "env": {
          "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxx"
        }
      }
    ]
  }
}
```

**Key Differences:**
- Uses array instead of object
- Requires `transport: "stdio"` field
- `name` field instead of object key

**Transport Precedence:**
1. Explicit `transport` field (highest priority)
2. Environment variable `MCP_TRANSPORT`
3. Default: `"stdio"`

**Features:**
- ✅ Full MCP support
- ✅ Hooks system
- ✅ Custom skills
- ✅ Agent specialization

**Installation:**
```bash
npm install -g @google/gemini-cli
```

**Docs:** [ai.google.dev](https://ai.google.dev/gemini-api/docs/cli)

---

### Codex CLI

**Config Location:** `~/.codex/config.toml`

**Format:** TOML with `[[mcpServers]]` array sections

**Example:**
```toml
[[mcpServers]]
name = "github"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-github"]

[mcpServers.env]
GITHUB_PERSONAL_ACCESS_TOKEN = "ghp_xxx"

[[mcpServers]]
name = "filesystem"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem", "/Users/you/projects"]
```

**Key Differences:**
- Uses TOML format (not JSON)
- Array sections with `[[mcpServers]]` syntax
- Environment variables in `[mcpServers.env]` subsection

**Features:**
- ✅ Full MCP support
- ✅ Custom skills
- ❌ No hooks support

**Installation:**
```bash
npm install -g openai-codex-cli
```

**Docs:** [platform.openai.com](https://platform.openai.com/docs/codex)

---

### Kiro

**Config Location:** `~/.kiro/settings/mcp.json`

**Format:** JSON with `powers` object

**Example:**
```json
{
  "powers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxx"
      }
    }
  }
}
```

**Key Differences:**
- Uses `powers` instead of `mcpServers` (Kiro terminology)
- Otherwise identical to Claude Code format

**Terminology:**
- **Powers** = MCP servers
- **Capabilities** = Skills
- **Automations** = Hooks

**Features:**
- ✅ Full MCP support (called "Powers")
- ✅ Custom capabilities
- ✅ Automations (hooks)
- ✅ Agent switching

**Installation:**
```bash
npm install -g kiro-cli
```

**Docs:** [kiro.dev](https://kiro.dev/)

---

### Cursor

**Config Location:** `.cursor/mcp.json` (project-specific)

**Format:** JSON with `servers` array

**Example:**
```json
{
  "servers": [
    {
      "name": "github",
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxx"
      }
    }
  ]
}
```

**Key Differences:**
- Project-specific config (in workspace, not home directory)
- Requires `type: "stdio"` field
- Uses array format like Gemini

**Variable Interpolation:**
Cursor supports environment variable expansion in config:
```json
{
  "servers": [
    {
      "name": "github",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  ]
}
```

Set environment variables in your terminal:
```bash
export GITHUB_TOKEN="ghp_xxx"
cursor  # Will use $GITHUB_TOKEN from environment
```

**Features:**
- ✅ Full MCP support
- ✅ Skills system
- ✅ Hooks (`.cursor/hooks/`)
- ✅ Agent mode
- ✅ Built-in VS Code extension compatibility

**Installation:**
Download from [cursor.com](https://cursor.com/)

**Docs:** [cursor.com/docs](https://cursor.com/docs)

**Skills Location:** `.cursor/skills/` (see [Skills Documentation](https://cursor.com/docs/context/skills))

---

### Cline

**Config Location:** OS-specific global storage location

**Format:** JSON with `mcpServers` object (same as Claude Code)

**Paths by OS:**

**macOS:**
```
~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/cline_mcp_settings.json
```

**Windows:**
```
%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\cline_mcp_settings.json
```

**Linux:**
```
~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/cline_mcp_settings.json
```

**Example:**
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxx"
      }
    }
  }
}
```

**Key Differences:**
- VS Code extension (not standalone CLI)
- Config location varies by OS
- Extension detection via `vscode.extensions.getExtension('saoudrizwan.claude-dev')`
- Same format as Claude Code (both Anthropic-based)

**Features:**
- ✅ Full MCP support
- ✅ Custom skills
- ✅ Hooks system
- ✅ Auto-completion
- ✅ Multi-file editing

**Installation:**
Install from VS Code Marketplace: [Cline Extension](https://marketplace.visualstudio.com/items?itemName=saoudrizwan.claude-dev)

**Docs:** [cline.bot](https://cline.bot/)

---

## Available MCP Servers

The Integration Hub includes a registry of 10 official MCP servers from Anthropic and the community.

### Official Anthropic Servers

| Server | Description | Requirements | Icon |
|--------|-------------|--------------|------|
| **Filesystem** | Secure file access with configurable allowed directories | `allowedDirectories` (comma-separated paths) | 📁 |
| **GitHub** | Repository management, PRs, issues, file operations | `GITHUB_PERSONAL_ACCESS_TOKEN` | 🔗 |
| **PostgreSQL** | Read-only database access with schema inspection | `databaseUrl` (PostgreSQL connection string) | 🐘 |
| **SQLite** | SQLite database operations | `dbPath` (path to .db file) | 🗄️ |
| **Puppeteer** | Browser automation and web scraping | None | 🎭 |
| **Fetch** | Web content fetching and conversion for LLM usage | None | 🌐 |
| **Brave Search** | Web search via Brave Search API | `BRAVE_API_KEY` | 🔍 |
| **Google Maps** | Location services, directions, place details | `GOOGLE_MAPS_API_KEY` | 🗺️ |
| **Sentry** | Error tracking and performance monitoring | `SENTRY_AUTH_TOKEN` | 🐛 |
| **Slack** | Channel management and messaging | `SLACK_BOT_TOKEN`, `SLACK_TEAM_ID` | 💬 |

### Community Servers

Additional community MCP servers can be added manually via direct config editing. The Integration Hub will detect and display them.

---

## Common MCP Server Examples

### Filesystem Server

**Purpose:** Allow AI tools to read/write files in specific directories

**Claude Code:**
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/you/projects", "/Users/you/documents"],
      "env": {}
    }
  }
}
```

**Gemini CLI:**
```json
{
  "mcp": {
    "servers": [
      {
        "name": "filesystem",
        "transport": "stdio",
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/you/projects"],
        "env": {}
      }
    ]
  }
}
```

**Security Tips:**
- Only add directories you trust the AI to access
- Use specific paths instead of `/` or `~`
- Separate multiple directories with spaces in args array

---

### GitHub Server

**Purpose:** Manage repositories, PRs, issues, and files

**Prerequisites:**
1. Create GitHub personal access token: [github.com/settings/tokens](https://github.com/settings/tokens)
2. Grant required scopes: `repo`, `read:org`

**Claude Code:**
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_your_token_here"
      }
    }
  }
}
```

**Cursor (with env var):**
```json
{
  "servers": [
    {
      "name": "github",
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  ]
}
```

Then set in terminal:
```bash
export GITHUB_TOKEN="ghp_your_token_here"
cursor
```

---

### PostgreSQL Server

**Purpose:** Query PostgreSQL databases with read-only access

**Prerequisites:**
- PostgreSQL connection string (URL format)

**Connection String Format:**
```
postgresql://user:password@host:port/database
```

**Example:**
```
postgresql://postgres:secret@localhost:5432/mydb
```

**Claude Code:**
```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://postgres:secret@localhost:5432/mydb"],
      "env": {}
    }
  }
}
```

**Security Notes:**
- Connection string is stored in plain text in config
- Use read-only database user when possible
- Consider environment variables for production

**With Environment Variable (Cursor):**
```json
{
  "servers": [
    {
      "name": "postgres",
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "${DATABASE_URL}"],
      "env": {}
    }
  ]
}
```

Terminal:
```bash
export DATABASE_URL="postgresql://postgres:secret@localhost:5432/mydb"
cursor
```

---

### Brave Search Server

**Purpose:** Web search capabilities via Brave Search API

**Prerequisites:**
1. Get Brave API key: [brave.com/search/api](https://brave.com/search/api/)
2. Free tier: 2,000 requests/month

**Claude Code:**
```json
{
  "mcpServers": {
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "BSYourApiKeyHere"
      }
    }
  }
}
```

**Use Cases:**
- Research and fact-checking
- Finding documentation
- Getting current information beyond training data

---

## Troubleshooting

### Tool Not Detected

**Problem:** Integration Hub shows "No Coding Tools Detected"

**Solutions:**

1. **Verify installation:**
   ```bash
   which claude    # Should show path to Claude Code
   which gemini    # Should show path to Gemini CLI
   which cursor    # Should show path to Cursor
   ```

2. **Check common paths:**
   ```bash
   ls -la ~/.npm-global/bin/
   ls -la /opt/homebrew/bin/
   ls -la /usr/local/bin/
   ```

3. **Install if missing:**
   ```bash
   npm install -g @anthropic-ai/claude-code
   ```

4. **For Cline:** Verify VS Code extension is installed
   - Open VS Code Extensions panel
   - Search "Cline"
   - Install by Saoud Rizwan

5. **For Cursor:** Download from [cursor.com](https://cursor.com/)

6. **Add to PATH (if needed):**
   ```bash
   # Add to ~/.zshrc or ~/.bashrc
   export PATH="$HOME/.npm-global/bin:$PATH"
   ```

---

### Config File Not Found

**Problem:** "Config file not found" error when adding MCP server

**Solutions:**

1. **Create config directory manually:**
   ```bash
   # Claude Code
   mkdir -p ~/.claude
   touch ~/.claude.json

   # Gemini CLI
   mkdir -p ~/.gemini
   echo '{}' > ~/.gemini/settings.json

   # Cursor
   mkdir -p .cursor
   echo '{"servers":[]}' > .cursor/mcp.json
   ```

2. **Check path expansion:**
   - `~` expands to your home directory
   - On macOS: `~/` = `/Users/yourname/`
   - On Windows: `~/` = `C:\Users\yourname\`
   - On Linux: `~/` = `/home/yourname/`

3. **Verify file permissions:**
   ```bash
   ls -la ~/.claude.json
   # Should show -rw-r--r-- (readable/writable by you)
   ```

4. **For Cline:** Check OS-specific path (see [Cline Configuration](#cline-configuration))

---

### Permission Denied Errors

**Problem:** "EACCES: permission denied" when writing config

**Solutions:**

1. **Check file ownership:**
   ```bash
   ls -la ~/.claude.json
   # If owned by root: sudo chown $USER:$(id -gn) ~/.claude.json
   ```

2. **Fix permissions:**
   ```bash
   chmod 644 ~/.claude.json  # Read/write for owner, read for others
   ```

3. **For project-specific configs (Cursor):**
   ```bash
   # In project directory
   ls -la .cursor/mcp.json
   chmod 644 .cursor/mcp.json
   ```

---

### Invalid JSON Format

**Problem:** Config file corrupted after manual edit

**Solutions:**

1. **Validate JSON:**
   ```bash
   # Using Python
   python3 -m json.tool ~/.claude.json

   # Using Node.js
   node -e "console.log(JSON.stringify(JSON.parse(require('fs').readFileSync('~/.claude.json', 'utf8'))))"
   ```

2. **Fix common issues:**
   - Trailing commas (not allowed in JSON)
   - Single quotes (use double quotes)
   - Unescaped special characters
   - Missing brackets/braces

3. **Use JSON linting tools:**
   - VS Code: Install "JSON" extension by Microsoft
   - Online: [jsonlint.com](https://jsonlint.com/)

4. **Restore from backup:**
   ```bash
   cp ~/.claude.json.backup ~/.claude.json
   ```

---

### MCP Server Won't Start

**Problem:** Server shows "Error" status

**Solutions:**

1. **Check server logs:**
   - Click server card in Integration Hub
   - Click "Logs" button
   - Look for error messages

2. **Common errors:**

   **"npx: command not found"**
   - Install Node.js: [nodejs.org](https://nodejs.org/)
   - Or use full path: `/usr/local/bin/npx`

   **"EACCESS: permission denied"**
   - Fix npm permissions: `sudo chown -R $USER ~/.npm`
   - Or use Node version manager (nvm)

   **"API key invalid"**
   - Verify API key is correct
   - Check key has required scopes
   - Regenerate key if expired

   **"Cannot connect to database"**
   - Verify database is running
   - Check connection string format
   - Ensure database allows connections from your IP

3. **Test MCP server manually:**
   ```bash
   # Test filesystem server
   npx -y @modelcontextprotocol/server-filesystem /Users/you/projects

   # Test GitHub server (set env var first)
   export GITHUB_PERSONAL_ACCESS_TOKEN="ghp_xxx"
   npx -y @modelcontextprotocol/server-github
   ```

4. **Reinstall MCP package:**
   ```bash
   npm cache clean --force
   npx -y @modelcontextprotocol/server-filesystem --version
   ```

---

### Cursor Variable Interpolation Not Working

**Problem:** Environment variable `${VAR}` not expanding

**Solutions:**

1. **Verify environment variable is set:**
   ```bash
   echo $GITHUB_TOKEN  # Should show your token
   ```

2. **Set in correct shell:**
   ```bash
   # For zsh (macOS default)
   echo 'export GITHUB_TOKEN="ghp_xxx"' >> ~/.zshrc
   source ~/.zshrc

   # For bash
   echo 'export GITHUB_TOKEN="ghp_xxx"' >> ~/.bashrc
   source ~/.bashrc
   ```

3. **Restart Cursor after setting env vars:**
   - Cursor reads environment variables at launch
   - Quit and reopen Cursor

4. **Use absolute value for testing:**
   ```json
   {
     "env": {
       "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_actual_value_here"
     }
   }
   ```

---

### Cline Config Location Issues

**Problem:** Can't find Cline config file

**Solutions:**

1. **Check OS-specific path:**

   **macOS:**
   ```bash
   cat ~/Library/Application\ Support/Code/User/globalStorage/saoudrizwan.claude-dev/cline_mcp_settings.json
   ```

   **Windows:**
   ```powershell
   cat $env:APPDATA\Code\User\globalStorage\saoudrizwan.claude-dev\cline_mcp_settings.json
   ```

   **Linux:**
   ```bash
   cat ~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/cline_mcp_settings.json
   ```

2. **Create directory if missing:**
   ```bash
   # macOS
   mkdir -p ~/Library/Application\ Support/Code/User/globalStorage/saoudrizwan.claude-dev/
   echo '{"mcpServers":{}}' > ~/Library/Application\ Support/Code/User/globalStorage/saoudrizwan.claude-dev/cline_mcp_settings.json
   ```

3. **Verify Cline extension is installed:**
   - Open VS Code
   - Press `Cmd+Shift+X` (Extensions)
   - Search "Cline"
   - Should show "Cline" by Saoud Rizwan

4. **Check extension version:**
   - Cline MCP support added in version 2.0+
   - Update extension if needed

---

### Format-Specific Issues

#### TOML Syntax Errors (Codex CLI)

**Problem:** Codex config won't parse

**Common issues:**
- Invalid array syntax: Use `[[mcpServers]]` not `[mcpServers]`
- Missing quotes around string values
- Incorrect table nesting

**Validate TOML:**
```bash
# Online: toml-lint.com
# Or use Python
pip install toml
python3 -c "import toml; print(toml.load('~/.codex/config.toml'))"
```

#### Transport Field Missing (Gemini/Cursor)

**Problem:** Server won't start, missing transport type

**Solution:**
```json
{
  "mcp": {
    "servers": [
      {
        "name": "github",
        "transport": "stdio",  // <-- REQUIRED for Gemini
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-github"]
      }
    ]
  }
}
```

---

## Advanced Topics

### Batch MCP Installation

Want to install the same MCP servers across multiple tools? The Integration Hub doesn't yet support batch operations, but you can manually sync configs:

1. **Install MCPs in Claude Code** (easiest format)
2. **Copy config segments** to other tools' configs
3. **Convert format** as needed (object vs array, etc.)

Example conversion scripts coming in future versions.

### Custom MCP Servers

Add community or custom MCP servers not in the registry:

1. Click "Add" in Integration Hub
2. Select "Custom Server" (coming soon)
3. Or edit config directly:
   ```json
   {
     "mcpServers": {
       "my-custom-server": {
         "command": "/path/to/my-server",
         "args": ["--port", "3000"],
         "env": {
           "API_KEY": "xxx"
         }
       }
     }
   }
   ```

### MCP Server Development

Create your own MCP server:

```typescript
// my-mcp-server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server({
  name: 'my-server',
  version: '1.0.0'
});

// Add tools, resources, prompts

const transport = new StdioServerTransport();
await server.connect(transport);
```

See [MCP SDK Docs](https://modelcontextprotocol.io/) for details.

---

## Getting Help

### Resources

- **agentful Docs**: [agentful.app/docs](https://agentful.app/docs)
- **MCP Specification**: [modelcontextprotocol.io](https://modelcontextprotocol.io/)
- **Anthropic Docs**: [docs.anthropic.com](https://docs.anthropic.com/)
- **GitHub Issues**: [github.com/itz4blitz/agentful/issues](https://github.com/itz4blitz/agentful/issues)

### Debug Mode

Enable debug logging in Integration Hub:

1. Click "Debug" button in top-right
2. See detailed detection logs
3. Check "agentful Tools" output channel in VS Code

### Report Issues

When reporting issues, include:

1. Tool name and version
2. Operating system
3. Config file content (sanitize API keys!)
4. Error messages from Debug panel
5. Steps to reproduce

---

## Changelog

### Version 1.0.0 (Current)
- ✅ Support for 6 AI coding tools
- ✅ 10 official MCP servers
- ✅ Automatic format conversion
- ✅ OS-specific path handling
- ✅ Cline extension detection

### Coming Soon
- ⏳ Batch MCP installation
- ⏳ Custom MCP server registry
- ⏳ Config sync across tools
- ⏳ Team config sharing via GitHub Gist
- ⏳ MCP server health monitoring

---

**Last Updated:** January 29, 2026

**Maintained by:** agentful team
