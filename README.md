# agentful

Human-in-the-loop development framework for Claude Code.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/%40itz4blitz%2Fagentful.svg)](https://www.npmjs.com/package/@itz4blitz/agentful)
[![Tests](https://img.shields.io/badge/tests-370%20passing-brightgreen)](https://github.com/itz4blitz/agentful)
[![Coverage](https://img.shields.io/badge/coverage-98.26%25-brightgreen)](https://github.com/itz4blitz/agentful)

## Overview

agentful is a production-ready Claude Code configuration that provides structured development through specialized AI agents. It coordinates multiple agents to implement features, write tests, and validate code quality according to a defined product specification, with human checkpoints for key decisions.

**Production Quality**: Enterprise-grade testing (370 tests), 98.26% code coverage, comprehensive error handling, and lifecycle hooks for validation and metrics.

## Installation

```bash
npx @itz4blitz/agentful init
```

This command creates the necessary directory structure and configuration files in your project.

### Updating

After initial installation, use the `/agentful-update` command to update your configuration:

```bash
claude  # Start Claude Code
/agentful-update
```

This command:
- Fetches the latest templates from the current agentful version
- Performs a 3-way merge to preserve your customizations
- Creates backups before applying changes
- Gracefully handles conflicts and reports issues

**Important**: Run `npx @itz4blitz/agentful init` only once during initial setup. For all subsequent updates, use `/agentful-update` instead of re-running init.

## Usage

### 1. Define Product Specification

After initialization, define your product requirements:

#### Option A: Interactive Planning (Recommended)

```bash
claude  # Start Claude Code
```

Use `/agentful-product` for guided product planning:
- **New projects**: Interactive Q&A creates your product spec
- **Existing specs**: Analyzes for gaps, ambiguities, blocking issues
- **Readiness scoring**: Get a score (0-100) before development
- **Issue resolution**: Walk through blocking issues with smart suggestions
- **Q&A mode**: Ask planning questions in context

#### Option B: Manual Creation

Create your specification manually in `.claude/product/`:

**Flat structure** (single file):
- `.claude/product/index.md` - All features in one file

**Hierarchical structure** (organized by domain):
- `.claude/product/index.md` - Product overview
- `.claude/product/domains/*/features/` - Feature definitions organized by domain

### 2. Start Development

```bash
claude  # Start Claude Code
```

Then use the `/agentful-start` command to begin structured development.

#### New Projects (No Existing Code)

For brand new projects with no code yet:

1. **Tech Stack Selection**: On first run, the architect agent will ask about your tech stack:
   - Frontend framework (React, Vue, Next.js, etc.)
   - Backend framework (Express, Django, Spring Boot, etc.)
   - Database (PostgreSQL, MongoDB, MySQL, etc.)
   - Additional tools (ORM, testing framework, styling)

2. **Initial Agent Generation**: Specialized agents are generated using **best practices** for your chosen stack:
   - Based on official framework documentation
   - Using common patterns and conventions
   - Marked with `confidence: 0.4` (template-based)

3. **First Feature Implementation**: The system builds your first feature using these template agents

4. **Automatic Re-Analysis**: After the first feature is complete:
   - Architect re-analyzes your **actual code**
   - Updates agents with **your project's specific patterns**
   - Confidence increases (`0.4 → 0.8+`)
   - Remaining features use refined, project-specific agents

**Benefits**:
- ✅ Start immediately without existing code
- ✅ No blocking on pattern detection
- ✅ Learns and adapts after first implementation
- ✅ Continuously improving agent quality

#### Existing Projects (With Code)

For projects with existing code:

1. **Pattern Detection**: Architect samples your codebase to detect:
   - Language and framework
   - File organization patterns
   - Coding conventions
   - Import/export styles
   - Error handling patterns

2. **Agent Generation**: Creates specialized agents matching **your exact conventions**
   - Real code examples from your project
   - Your specific patterns and styles
   - High confidence (`0.8-1.0`)

### 3. Monitor Progress

- `/agentful-status` - View completion percentage and current work
- `/agentful-validate` - Run quality checks
- `/agentful-decide` - Answer blocking questions

## Architecture

### Agent System

agentful uses seven specialized agents:

| Agent | Responsibility |
|-------|---------------|
| orchestrator | Coordinates work, routes tasks, tracks state |
| architect | Analyzes project structure and generates specialized agents<br/>• New projects: Prompts for tech stack, generates template agents<br/>• Existing projects: Detects patterns from code<br/>• Re-analyzes after first implementation in new projects |
| backend | Implements server-side logic, APIs, database schemas |
| frontend | Implements UI components, pages, state management |
| tester | Writes unit, integration, and end-to-end tests |
| reviewer | Validates code quality, security, and standards |
| fixer | Resolves validation failures and test errors |

### Quality Gates

Code changes are validated against 6 core automated quality gates:

- Type checking (TypeScript, Flow, etc.)
- Linting (ESLint, Biome, etc.)
- Test execution (all tests must pass)
- Code coverage (minimum 80%)
- Security scanning
- Dead code detection

### State Tracking

Runtime state is stored in `.agentful/` (gitignored, managed by npm package):

- `state.json` - Current task and phase
- `completion.json` - Feature completion status
- `decisions.json` - Pending and resolved decisions
- `architecture.json` - Technology stack (declared or detected)
  - New projects: Starts with declared stack (`confidence: 0.4`)
  - Existing projects: Detected from code (`confidence: 0.8-1.0`)
  - Re-analyzed after first implementation in new projects
- `last-validation.json` - Latest test/lint results
- `conversation-history.json` - Session tracking
- `product-analysis.json` - Readiness analysis (generated by `/agentful-product`)

User configuration is stored in `.claude/` (version controlled):

- `agents/` - Agent definitions (core + custom + ephemeral)
- `commands/` - Slash commands
- `product/` - Product specifications
  - `index.md` - Main product spec (user editable)
  - `domains/` - Optional hierarchical structure
- `skills/` - Reusable skill modules
  - `conversation/` - Intent classification and context management
  - `product-tracking/` - Progress calculation and state tracking
  - `product-planning/` - Product specification guidance
  - `validation/` - Quality gate checks and tool detection
- `settings.json` - Project configuration

**See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed explanation of file organization.**

## Commands

| Command | Description |
|---------|-------------|
| `/agentful-product` | Smart product planning: create, analyze, and refine requirements |
| `/agentful-start` | Start or resume structured development |
| `/agentful-status` | Display progress and current state |
| `/agentful-validate` | Run all quality checks |
| `/agentful-decide` | Answer pending decisions |
| `/agentful-update` | Smart update mechanism - fetches latest templates and gracefully migrates changes |

## Technology Support

agentful detects and adapts to your technology stack automatically:

- **Languages**: TypeScript, JavaScript, Python, Go, Rust, Java, C#, PHP, Ruby, Elixir
- **Frontend**: React, Vue, Angular, Svelte, Next.js, Astro, SolidJS
- **Backend**: Express, Fastify, NestJS, Hono, Next.js API Routes
- **Databases**: PostgreSQL, MySQL, SQLite, MongoDB
- **ORMs**: Prisma, Drizzle, TypeORM, Mongoose
- **Testing**: Jest, Vitest, Playwright, Cypress, Pytest, JUnit

## Requirements

- Claude Code ([code.anthropic.com](https://code.anthropic.com))
- Node.js 22 or higher
- Git

## Documentation

Full documentation: [agentful.app](https://agentful.app)

## Project Structure

```
your-project/
├── CLAUDE.md                       # Project instructions
├── .claude/
│   ├── product/                    # Product specification
│   │   ├── index.md                # Product spec (flat or hierarchical)
│   │   └── domains/                # Optional: hierarchical structure
│   ├── agents/                     # Agent definitions
│   ├── commands/                   # Slash commands
│   ├── skills/                     # Reusable skills
│   └── settings.json               # Configuration
├── .agentful/                      # Runtime state (gitignored)
│   ├── state.json
│   ├── completion.json
│   ├── decisions.json
│   ├── architecture.json
│   ├── last-validation.json
│   └── conversation-history.json
└── src/                            # Source code
```

## License

MIT

## Links

- GitHub: [github.com/itz4blitz/agentful](https://github.com/itz4blitz/agentful)
- Issues: [github.com/itz4blitz/agentful/issues](https://github.com/itz4blitz/agentful/issues)
- Documentation: [agentful.app](https://agentful.app)
- NPM: [npmjs.com/@itz4blitz/agentful](https://www.npmjs.com/package/@itz4blitz/agentful)
