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

**[agentful.app/configure](https://agentful.app/configure)** - Interactive web configurator for shareable configurations

## Quick Start

1. Edit `.claude/product/index.md` to define your product requirements
2. Run: `claude`
3. **Intelligent Context Awareness** - agentful will automatically show you project status and suggest next steps
4. Type: `/agentful-generate`

For extended sessions:
```bash
claude --dangerously-skip-permissions
/ralph-loop "/agentful-start" --max-iterations 50 --completion-promise "AGENTFUL_COMPLETE"
```

### Smart Session Start

When you start a Claude Code session, agentful automatically:
- ✅ Shows project completion status (features completed, progress %)
- ⚠️ Highlights blocking issues (pending decisions, invalid architecture)
- 💡 Suggests numbered next steps based on current project state

**Example:**
```
✅ Agentful ready (parallel execution: ON)

📊 Project Status: 47% complete (6/13 features)
⚠️  Architecture needs attention
⚠️  2 pending decision(s)

💡 Suggested next steps:
   1. ⚠️ Fix architecture → /agentful-generate
      Architecture older than package.json - may need regeneration
   2. ⚠️ Answer pending decisions → /agentful-decide
      2 decision(s) blocking progress
   3. Check progress → /agentful-status
      Current: 47% complete (6/13 features)
```

No need to remember commands - just pick a numbered action!

## Pattern Learning (MCP Server)

Enable cross-session pattern learning so agents compound knowledge over time:

```bash
claude mcp add agentful -- npx -y @itz4blitz/agentful-mcp-server
```

**What this enables:**
- **Reviewer** stores error patterns so the fixer can look up known fixes instantly
- **Fixer** queries known fixes before attempting manual repairs, then stores successful fixes
- **Orchestrator** stores successful implementation patterns after features pass all quality gates

Without MCP: agents start from scratch every session. With MCP: agents compound across sessions.

See [Hooks System](#hooks-system) below for manual setup or other editors.

## Commands

| Command | Description | When to Use |
|---------|-------------|-------------|
| `/agentful-start` | Start/continue development loop | Always start here |
| `/agentful-status` | Show completion % and current work | Check progress |
| `/agentful-decide` | Answer blocking decisions | When prompted |

## When-Needed Commands

These appear only when relevant:
- `/agentful-validate` - Run quality gates (shown when validation fails)
- `/agentful-product` - Analyze and improve product spec (use before starting or when stuck)
- `/agentful-generate` - Regenerate agents (shown when tech stack changes)

## Advanced Commands

- `/agentful-analyze` - Deep project analysis and setup
- `/agentful-init` - Interactive guided setup (run automatically by `npx init`)
- `/agents` - List all available specialized agents

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
- `.agentful/learnings.json` - Compound engineering retrospectives
- `.agentful/last-validation.json` - Latest validation report from reviewer

**Configuration** (auto-generated, customizable):
- `.claude/agents/` - Specialized agents for your tech stack
- `.claude/commands/` - Slash commands
- `.claude/settings.json` - Hooks and permissions

## Quality Gates

Every feature must pass 6 core automated quality gates before marked complete:

- **Type checking** - No type errors (TypeScript, Flow, etc.)
- **Linting** - Code follows project style guide
- **Tests** - All tests passing
- **Coverage** - Minimum 80% code coverage
- **Security** - No known vulnerabilities in dependencies
- **Dead code** - No unused exports, files, or dependencies

The `reviewer` agent runs these checks automatically. The `fixer` agent resolves failures.

## Troubleshooting

**"agentful keeps asking me unclear questions"**
→ Your product spec needs more detail. Run `/agentful-product` to analyze and improve it.

**"Validation keeps failing"**
→ Check `.agentful/last-validation.json` for details. The `fixer` agent should auto-resolve, but you can run `/agentful-validate` manually.

**"Agent isn't working on the right feature"**
→ Check priority in `.claude/product/index.md`. CRITICAL > HIGH > MEDIUM > LOW. Run `/agentful-status` to see current focus.

**"State seems stuck or corrupted"**
→ Delete `.agentful/state.json` and run `/agentful-start` to reset. Completion progress is preserved.

**"Tech stack not detected correctly"**
→ Add explicit tech stack section to `.claude/product/index.md` or check `.agentful/architecture.json` for what was detected.

**"How do I expand to hierarchical product structure?"**
→ Create `.claude/product/domains/` directories and organize features by domain. Auto-detected.

**"Agent generated wrong type of code"**
→ Check that the right specialized agent was generated. Run `/agents` to list all agents.

**"Need to rollback or restart a feature"**
→ Edit completion % in `.agentful/completion.json` for specific feature, then run `/agentful-start`.

**"Want to work on multiple features in parallel?"**
→ Use git worktrees for branch-based parallel development.

**"Circuit breaker keeps tripping"**
→ The orchestrator has a built-in circuit breaker that prevents infinite loops. After 3 consecutive failures on the same task, it will:
- Add the issue to `.agentful/decisions.json`
- Skip the blocked task and continue with other work
- Allow you to decide how to proceed (break into smaller tasks, provide more requirements, etc.)

**"Agents seem stuck or taking too long"**
→ Agents now show progress indicators while working. You should see:
- Phase updates (Planning → Implementation → Testing → Complete)
- Specific files being created
- Estimated remaining work
→ If no progress for 2+ minutes, the task may be stuck. Check `.agentful/state.json` for circuit breaker status.

## Getting Help

**Documentation**: See `.claude/commands/` for detailed command documentation
**Product Planning**: Run `/agentful-product --help` for comprehensive product analysis
**Agent Reference**: Run `/agents` to see all specialized agents and their roles
**GitHub**: [github.com/itz4blitz/agentful](https://github.com/itz4blitz/agentful)
**Issues**: Report bugs or request features on GitHub Issues
**Version**: Check `package.json` for your agentful version

---

## Hooks System

Agentful uses Claude Code hooks for automation, protection, and intelligent context awareness. Hooks run at specific lifecycle events to enhance the development experience.

### Context Awareness Hooks

**session-start** (`SessionStart` event)
- **What it does**: Provides intelligent session startup with project status and smart suggestions
- **When it runs**: Every time you start a new Claude Code session
- **Features**:
  - Shows project completion percentage and feature progress
  - Detects parallel execution capability (TeammateTool)
  - Highlights blocking issues (pending decisions, invalid architecture)
  - Suggests numbered next steps based on current project state
- **Output example**:
  ```
  ✅ Agentful ready (parallel execution: ON)

  📊 Project Status: 47% complete (6/13 features)
  ⚠️  Architecture needs attention
  ⚠️  2 pending decision(s)

  💡 Suggested next steps:
     1. ⚠️ Fix architecture → /agentful-generate
        Architecture older than package.json - may need regeneration
     2. ⚠️ Answer pending decisions → /agentful-decide
        2 decision(s) blocking progress
     3. Check progress → /agentful-status
        Current: 47% complete (6/13 features)
  ```
- **How to disable**: Remove from `SessionStart` hooks in `.claude/settings.json`

**post-action-suggestions** (`PostToolUse` event - currently inactive)
- **What it does**: Suggests smart follow-up actions after completing slash commands
- **When it runs**: After `/agentful-*` commands complete
- **Features**: Context-aware suggestions based on what you just did
- **Status**: Module exists but not currently hooked (future enhancement)

### File Protection Hooks

**block-random-docs** (`PreToolUse` event on `Write`/`Edit`)
- **What it does**: Prevents creation of random markdown files outside approved locations
- **When it runs**: Before any `Write` or `Edit` operation on `.md` or `.mdx` files
- **Always allowed**:
  - ✅ `README.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `LICENSE.md`
  - ✅ `.claude/agents/*.md` - Agent definitions
  - ✅ `.claude/skills/*/SKILL.md` - Skill documentation
  - ✅ `.claude/product/**/*.md` - Product specifications
  - ✅ `template/**/*.md` - Template files
  - ✅ `examples/**/*.md` - Example documentation
- **Allowed if parent directory exists**:
  - 📁 `docs/*.md`, `docs/pages/*.mdx` - Requires `docs/` directory
  - 📁 `documentation/*.md` - Requires `documentation/` directory
  - 📁 `wiki/*.md` - Requires `wiki/` directory
  - 📁 `guides/*.md` - Requires `guides/` directory
- **How to disable**:
  - Temporary: `export AGENTFUL_ALLOW_RANDOM_DOCS=true`
  - Permanent: Remove from `.claude/settings.json` `PreToolUse` hooks
  - Customize: Edit `bin/hooks/block-random-docs.js` and modify `ALLOWED_PATTERNS`

**block-file-creation** (`PreToolUse` event on `Write`)
- **What it does**: Prevents creation of arbitrary data files outside approved directories
- **When it runs**: Before any `Write` operation (not `Edit`)
- **Always allowed**:
  - ✅ Source code files (`.js`, `.ts`, `.py`, `.go`, `.rs`, `.java`, `.c`, `.cpp`, `.rb`, `.php`, etc.)
  - ✅ Root config files (`package.json`, `tsconfig.json`, `vite.config.js`, etc.)
  - ✅ Test files in test directories
  - ✅ Markdown files (handled by `block-random-docs` hook)
- **Allowed in specific directories**:
  - 📁 `.agentful/` - Runtime state (validated files only: `state.json`, `completion.json`, `decisions.json`, etc.)
  - 📁 `fixtures/`, `test/fixtures/` - Test fixtures
  - 📁 `mocks/`, `__mocks__/` - Test mocks
  - 📁 `public/assets/`, `static/assets/` - Static assets
  - 📁 `config/`, `.config/` - Configuration files
  - 📁 `dist/`, `build/`, `out/` - Build output (with warning)
- **Blocked everywhere else**:
  - ❌ Random `.json` files (e.g., `random-state.json`, `debug-output.json`)
  - ❌ Random `.txt` files (e.g., `notes.txt`, `todo.txt`)
  - ❌ Random `.log` files (e.g., `debug.log`, `output.log`)
  - ❌ Temporary files (`.tmp`, `.temp`, `.bak`, `.old`)
- **How to disable**: Remove from `.claude/settings.json` `PreToolUse` hooks
- **Customize**: Edit `bin/hooks/block-file-creation.js` to modify allowed directories/extensions

### Monitoring & Detection Hooks

**health-check** (`SessionStart` event)
- **What it does**: Runs comprehensive startup health check for agentful
- **When it runs**: Every session start (after `session-start` hook)
- **Checks**:
  - ✅ `.agentful/` directory exists
  - ✅ Core state files present (`state.json`, `completion.json`, `decisions.json`)
  - ✅ `.claude/` directory structure complete
  - ✅ Core agents exist (orchestrator, backend, frontend, tester, reviewer, fixer, architect, product-analyzer)
  - ✅ Product specification exists (flat or hierarchical)
  - ✅ Settings file valid JSON
  - ⚠️ Architecture analysis exists and is valid
  - ⚠️ Node.js version >= 22.0.0
- **Output**: Shows errors (critical) and warnings (nice-to-have)
- **How to disable**: Remove from `SessionStart` hooks in `.claude/settings.json`

**architect-drift-detector** (`PostToolUse` event on `Write`/`Edit`)
- **What it does**: Detects when project changes require architecture re-analysis
- **When it runs**: After any `Write` or `Edit` operation
- **Triggers re-analysis when**:
  - 📦 Dependencies changed (`package.json`, `requirements.txt`, `go.mod`, `Gemfile`, `Cargo.toml`, etc.)
  - ⚙️ Tech stack config modified (`tsconfig.json`, `next.config.js`, `vite.config.js`, etc.)
  - 📈 Significant code growth (20%+ new files)
  - ⏰ Analysis is stale (>7 days old)
- **Action**: Updates `.agentful/architecture.json` with `needs_reanalysis: true` and drift reasons
- **Output**: `⚠️ Architect drift detected: dependencies_changed, tech_stack_modified`
- **How to disable**: Remove from `PostToolUse` hooks in `.claude/settings.json`

**product-spec-watcher** (`PostToolUse` event on `Write`/`Edit`)
- **What it does**: Watches for product specification changes and suggests agent regeneration
- **When it runs**: After any `Write` or `Edit` to `.claude/product/` files
- **Behavior**:
  - After `/agentful-init` flow: Auto-suggests agent generation with tech stack + requirements
  - Manual edit (no agents): Suggests running `/agentful-generate` or `/agentful-init`
  - Agents already exist: Suggests regenerating agents or continuing with existing
- **Use case**: Ensures agents stay aligned with product requirements
- **How to disable**: Remove from `PostToolUse` hooks in `.claude/settings.json`

**analyze-trigger** (`PostToolUse` event on `Write`/`Edit`)
- **What it does**: Suggests `/agentful-analyze` when critical config files change
- **When it runs**: After any `Write` or `Edit` operation
- **Triggers suggestions for**:
  - `package.json` - Dependencies changed
  - `tsconfig.json`, `jsconfig.json` - TypeScript/JavaScript config changed
  - `vite.config.*`, `webpack.config.*`, `next.config.*` - Build config changed
  - `docker-compose.yml`, `Dockerfile` - Docker config changed
  - `.env.example` - Environment template changed
- **Output**: Helpful message like "Dependencies changed in package.json. Consider running /agentful-analyze to update architecture understanding."
- **How to disable**: Remove from `PostToolUse` hooks in `.claude/settings.json`

### Advanced Hooks

**TypeScript type checking** (`PostToolUse` event on `Write`/`Edit`)
- **What it does**: Runs `tsc --noEmit` after file changes to detect type errors
- **When it runs**: After any `Write` or `Edit` operation
- **Output**: First 5 lines of TypeScript errors (if any)
- **How to disable**: Remove inline command hook from `PostToolUse` in `.claude/settings.json`

**Similar documentation detector** (`PostToolUse` event on `Write`/`Edit` of `*.md` files)
- **What it does**: Warns if similar documentation already exists
- **When it runs**: After writing/editing markdown files
- **Output**: `⚠️ Similar doc exists: docs/guide.md - consider updating instead`
- **How to disable**: Remove inline command hook from `PostToolUse` in `.claude/settings.json`

**Phase tracker** (`UserPromptSubmit` event)
- **What it does**: Tracks current agentful phase from `.agentful/state.json`
- **When it runs**: Every time user submits a prompt
- **Output**: Silent (logs phase for internal use)
- **How to disable**: Remove from `UserPromptSubmit` hooks in `.claude/settings.json`

### Disabling Hooks

**Option 1: Temporary disable (environment variable)**
```bash
# Disable random docs hook
export AGENTFUL_ALLOW_RANDOM_DOCS=true
claude
```

**Option 2: Permanent disable (edit settings)**

Edit `.claude/settings.json` and remove specific hook from `hooks` object:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          // Keep session-start, remove health-check
          {
            "type": "command",
            "command": "node bin/hooks/session-start.js",
            "timeout": 3,
            "description": "Intelligent context awareness"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "tools": ["Write", "Edit"],
        "hooks": [
          // Remove block-random-docs to allow any markdown file
        ]
      }
    ]
  }
}
```

**Option 3: Customize hook behavior**

Edit the hook file directly in `bin/hooks/`:
- `bin/hooks/block-random-docs.js` - Modify `ALLOWED_PATTERNS`
- `bin/hooks/block-file-creation.js` - Modify `SOURCE_CODE_EXTENSIONS` or `ALLOWED_DIRECTORY_PATTERNS`
- `bin/hooks/architect-drift-detector.js` - Change `STALE_THRESHOLD_DAYS`

### Hook Event Types

- **SessionStart**: Runs once when Claude Code session starts
- **PreToolUse**: Runs before a tool executes (can block execution)
- **PostToolUse**: Runs after a tool executes (informational only)
- **UserPromptSubmit**: Runs when user submits a prompt

---

**agentful** - Autonomous product development with Claude Code
