# agentful

**agentful** is an autonomous product development framework that uses specialized AI agents to build software from a product specification. It coordinates architecture, development, testing, and validation through human-in-the-loop checkpoints, ensuring quality while maintaining 24/7 development velocity.

## Installation Options

agentful works with any tech stack (TypeScript, Python, JavaScript, etc.) - the tech stack is auto-detected on first run.

```bash
# Default: Install all components (recommended)
npx @itz4blitz/agentful init

# Minimal: For simple scripts/CLIs
npx @itz4blitz/agentful init --preset=minimal

# Custom: Specify exactly what you want
npx @itz4blitz/agentful init --agents=orchestrator,backend --skills=validation

# View all installation options
npx @itz4blitz/agentful presets
```

## Quick Start

1. Edit `.claude/product/index.md` to define your product requirements
2. Run: `claude`
3. Type: `/agentful-generate`

## Commands

| Command | Description |
|---------|-------------|
| `/agentful-start` | Begin or resume structured development |
| `/agentful-status` | Check current progress and completion % |
| `/agentful-decide` | Answer pending decisions blocking work |
| `/agentful-validate` | Run all quality checks manually |
| `/agentful-product` | Analyze and improve product specification |

## When to Use What

**Starting fresh?**
→ Run `/agentful-product` to analyze your product spec, then `/agentful-start`

**Existing project?**
→ Run `/agentful-start` directly (auto-detects tech stack)

**Need to check progress?**
→ Run `/agentful-status` to see completion % and current phase

**Validation failures?**
→ The `fixer` agent auto-fixes issues, or run `/agentful-validate` manually

**Agent needs your input?**
→ Check `.agentful/decisions.json` or run `/agentful-decide`

**Unclear requirements?**
→ Run `/agentful-product` in reverse-engineering mode or improve `.claude/product/index.md`

**Want to add features?**
→ Edit `.claude/product/index.md`, then run `/agentful-start` (picks up changes automatically)

## File Structure

**Product Specification** (you edit these):
- `.claude/product/index.md` - Flat structure (all features in one file)
- `.claude/product/domains/` - Hierarchical structure (organized by domain)

**Runtime State** (managed by agentful, gitignored):
- `.agentful/state.json` - Current work phase and progress
- `.agentful/completion.json` - Feature completion % and quality gates
- `.agentful/decisions.json` - Pending and resolved decisions
- `.agentful/conversation-state.json` - Natural language conversation context
- `.agentful/conversation-history.json` - Message history for context tracking
- `.agentful/agent-metrics.json` - Agent lifecycle hooks and metrics
- `.agentful/architecture.json` - Detected tech stack and generated agents

**Configuration** (auto-generated, customizable):
- `.claude/agents/` - Specialized agents for your tech stack
- `.claude/commands/` - Slash commands
- `.claude/settings.json` - Hooks and permissions

## Quality Gates

agentful validates code through automated checks:

- **Type checking** - No type errors (TypeScript, Flow, etc.)
- **Linting** - Code follows project style guide
- **Tests** - All tests passing
- **Coverage** - Minimum 80% code coverage
- **Security** - No known vulnerabilities in dependencies
- **Dead code** - No unused exports, files, or dependencies

The `reviewer` agent runs these checks. The `fixer` agent resolves failures.

## Troubleshooting

**"agentful keeps asking me unclear questions"**
→ Your product spec needs more detail. Run `/agentful-product` to analyze and improve it.

**"Validation keeps failing"**
→ The `fixer` agent should auto-resolve issues, or run `/agentful-validate` manually to check details.

**"Agent isn't working on the right feature"**
→ Check priority in `.claude/product/index.md`. CRITICAL > HIGH > MEDIUM > LOW. Run `/agentful-status` to see current focus.

**"State seems stuck or corrupted"**
→ Delete `.agentful/state.json` and run `/agentful-start` to reset.

**"Tech stack not detected correctly"**
→ Add explicit tech stack section to `.claude/product/index.md` or check `.agentful/architecture.json` for what was detected.

**"How do I expand to hierarchical product structure?"**
→ Create `.claude/product/domains/` directories and organize features by domain. Auto-detected.

**"Agent generated wrong type of code"**
→ Check that the right specialized agent was generated in `.claude/agents/`.

**"Want to work on multiple features in parallel?"**
→ Use git worktrees for branch-based parallel development.

## Getting Help

- **Documentation**: See `.claude/commands/` for detailed command documentation
- **Product Planning**: Run `/agentful-product` for product spec analysis
- **GitHub**: [github.com/itz4blitz/agentful](https://github.com/itz4blitz/agentful)
- **Issues**: Report bugs or request features on GitHub Issues

---

## Configuration

### MCP Server (Highly Recommended ⭐)

The **agentful MCP Server** enables pattern learning and error fix reuse across all your projects. It's **highly recommended** for optimal performance.

**What it does:**
- 🔄 Stores successful code patterns for reuse
- 🧠 Learns from error fixes across projects
- 📈 Improves over time with feedback
- ⚡ Faster fixes by finding known solutions

**Enable MCP Server (Simple Method):**

Run this command to add the MCP server to Claude Code:

```bash
# For Claude Desktop
claude mcp add npx @itz4blitz/agentful-mcp-server

# Or for Cline (VS Code)
# Add to MCP settings: npx @itz4blitz/agentful-mcp-server
```

**Enable MCP Server (Manual Method):**

If the simple method doesn't work, configure manually:

1. **Find your Claude Code config:**
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%/Claude/claude_desktop_config.json`
   - Linux: `~/.config/Claude/claude_desktop_config.json`

2. **Add the MCP server:**
   ```json
   {
     "mcpServers": {
       "agentful": {
         "command": "npx",
         "args": ["-y", "@itz4blitz/agentful-mcp-server"]
       }
     }
   }
   ```

3. **Restart Claude Code** to load the MCP server

4. **Verify it's working:**
   - Start a new Claude Code session
   - You should see MCP tools available in agent interactions

**Benefits:**
- Fixer agent finds known error fixes instantly
- Backend/frontend agents reuse successful patterns
- Continuous learning from all your projects
- Reduces repetitive problem-solving

**Without MCP:** Agents work normally but can't learn from past solutions.

**With MCP:** Agents get smarter with every project.

### File Creation Protection Hooks

By default, agentful blocks creation of random files to keep your codebase clean and prevent littering.

#### Block Random Documentation (`block-random-docs`)

Prevents creation of random markdown files outside approved locations.

**Always allowed**:
- ✅ `README.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `LICENSE`
- ✅ `.claude/agents/*.md` - Agent definitions
- ✅ `.claude/skills/*/SKILL.md` - Skill documentation
- ✅ `.claude/product/**/*.md` - Product specifications

**Allowed only if parent directory exists**:
- 📁 `docs/*.md`, `docs/pages/*.mdx` - Requires `docs/` directory
- 📁 `documentation/*.md` - Requires `documentation/` directory
- 📁 `wiki/*.md` - Requires `wiki/` directory
- 📁 `guides/*.md` - Requires `guides/` directory

#### Block Arbitrary File Creation (`block-file-creation`)

Prevents creation of random JSON, TXT, LOG, and other data files outside approved locations.

**Always allowed**:
- ✅ Source code files (`.js`, `.ts`, `.py`, `.go`, `.rs`, etc.)
- ✅ Root config files (`package.json`, `tsconfig.json`, `vite.config.js`, etc.)
- ✅ Test files in test directories

**Allowed in specific directories**:
- 📁 `.agentful/` - Runtime state (validated files only)
- 📁 `fixtures/`, `test/fixtures/` - Test fixtures
- 📁 `mocks/`, `__mocks__/` - Test mocks
- 📁 `public/assets/` - Static assets
- 📁 `config/`, `.config/` - Configuration files

**Blocked everywhere else**:
- ❌ Random `.json` files (e.g., `random-state.json`, `debug-output.json`)
- ❌ Random `.txt` files (e.g., `notes.txt`, `todo.txt`)
- ❌ Random `.log` files (e.g., `debug.log`, `output.log`)
- ❌ Temporary files (`.tmp`, `.temp`, `.bak`, `.old`)

**To disable hooks**:

Option 1: Remove from `.claude/settings.json` (permanent):
```json
{
  "hooks": {
    "PreToolUse": [
      // Remove the hooks you want to disable
    ]
  }
}
```

Option 2: Customize allowed patterns:
- Edit `bin/hooks/block-random-docs.js` for markdown files
- Edit `bin/hooks/block-file-creation.js` for other file types

---

**agentful** - Autonomous product development with Claude Code
