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
3. Type: `/agentful-start`

For extended sessions:
```bash
claude --dangerously-skip-permissions
/ralph-loop "/agentful-start" --max-iterations 50 --completion-promise "AGENTFUL_COMPLETE"
```

## Commands

| Command | Description |
|---------|-------------|
| `/agentful-start` | Begin or resume structured development |
| `/agentful-status` | Check current progress and completion % |
| `/agentful-decide` | Answer pending decisions blocking work |
| `/agentful-validate` | Run all quality checks manually |
| `/agentful-product` | Analyze and improve product specification |
| `/agentful-serve` | Start secure remote execution server |
| `/agents` | List all available specialized agents |

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

**Need remote execution?**
→ Run `/agentful-serve` to start an HTTP API server with Tailscale, HMAC, or SSH tunnel authentication

## File Structure

**Product Specification** (you edit these):
- `.claude/product/index.md` - Flat structure (all features in one file)
- `.claude/product/domains/` - Hierarchical structure (organized by domain)

**Runtime State** (managed by agentful, gitignored):
- `.agentful/state.json` - Current work phase and progress
- `.agentful/completion.json` - Feature completion % and quality gates
- `.agentful/decisions.json` - Pending and resolved decisions
- `.agentful/last-validation.json` - Most recent validation report
- `.agentful/architecture.json` - Detected tech stack and generated agents

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

## Getting Help

**Documentation**: See `.claude/commands/` for detailed command documentation
**Product Planning**: Run `/agentful-product --help` for comprehensive product analysis
**Agent Reference**: Run `/agents` to see all specialized agents and their roles
**GitHub**: [github.com/itz4blitz/agentful](https://github.com/itz4blitz/agentful)
**Issues**: Report bugs or request features on GitHub Issues
**Version**: Check `package.json` for your agentful version

---

## Configuration

### Documentation Hook

By default, agentful blocks creation of random markdown files to keep your codebase clean.

**Always allowed**:
- ✅ `README.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `LICENSE.md`
- ✅ `.claude/agents/*.md` - Agent definitions
- ✅ `.claude/skills/*/SKILL.md` - Skill documentation
- ✅ `.claude/product/**/*.md` - Product specifications

**Allowed only if parent directory exists**:
- 📁 `docs/*.md`, `docs/pages/*.mdx` - Requires `docs/` directory
- 📁 `documentation/*.md` - Requires `documentation/` directory
- 📁 `wiki/*.md` - Requires `wiki/` directory
- 📁 `guides/*.md` - Requires `guides/` directory

This prevents accidental creation of `docs/pages/foo.mdx` when you don't have a docs site.

**To disable the hook**:

Option 1: Set environment variable (temporary):
```bash
export AGENTFUL_ALLOW_RANDOM_DOCS=true
claude
```

Option 2: Remove from `.claude/settings.json` (permanent):
```json
{
  "hooks": {
    "PreToolUse": [
      // Remove or comment out the block-random-docs hook
    ]
  }
}
```

Option 3: Customize allowed patterns:
Edit `bin/hooks/block-random-docs.js` and modify the `ALLOWED_PATTERNS` array.

---

**agentful** - Autonomous product development with Claude Code
