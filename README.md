# agentful

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/%40itz4blitz%2Fagentful.svg)](https://www.npmjs.com/package/@itz4blitz/agentful)
[![CI Status](https://github.com/itz4blitz/agentful/actions/workflows/pipeline.yml/badge.svg)](https://github.com/itz4blitz/agentful/actions)
[![Node Version](https://img.shields.io/badge/node-%3E%3D22-brightgreen)](https://nodejs.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/itz4blitz/agentful/pulls)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2024-yellow)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

[![Downloads](https://img.shields.io/npm/dm/@itz4blitz/agentful.svg)](https://www.npmjs.com/package/@itz4blitz/agentful)
[![GitHub Stars](https://img.shields.io/github/stars/itz4blitz/agentful?style=social)](https://github.com/itz4blitz/agentful)
[![Discord](https://img.shields.io/badge/Discord-Join%20Us-7289da)](https://discord.gg/SMDvJXUe)
[![Documentation](https://img.shields.io/badge/docs-agentful.app-blue)](https://agentful.app)

**Pre-configured development toolkit for Claude Code**

Orchestrates specialized agents in parallel with inter-agent communication to build features from product specs.

[Quick Start](#quick-start) • [Documentation](https://agentful.app) • [Discord](https://discord.gg/SMDvJXUe)

</div>

## Features

- **Parallel execution** - Multiple agents work simultaneously in git worktrees (frontend + backend + tests running concurrently)
- **Three-tier architecture** - Core agents (pre-built), domain agents (generated for your stack), ephemeral agents (task-specific)
- **Shared skills** - Reusable capabilities like validation, testing, and research across all agents
- **Quality gates** - Automated validation for every change (types, lint, tests, coverage, security, dead code)
- **Tech stack agnostic** - Works with any language/framework
- **Human checkpoints** - You decide, agents execute

## Quick Start

```bash
# 1. Install
npx @itz4blitz/agentful init

# 2. Start Claude Code
claude

# 3. Define product spec (choose one):
/agentful-init       # Interactive 7-question wizard (recommended for new users)
# OR
/agentful-product    # Manual spec creation/analysis

# 4. Start development (auto-generates agents on first run)
/agentful-start
```

## Installation Options

```bash
# Default: All components (recommended)
npx @itz4blitz/agentful init

# Minimal: Simple scripts/CLIs
npx @itz4blitz/agentful init --preset=minimal

# Custom: Choose components
npx @itz4blitz/agentful init --agents=orchestrator,backend --skills=validation

# Web configurator
https://agentful.app/configure
```

## Commands

| Command | Description |
|---------|-------------|
| `/agentful-init` | Interactive onboarding - 7 guided questions |
| `/agentful-product` | Create and analyze product specifications |
| `/agentful-generate` | Generate domain-specific agents for your stack |
| `/agentful-start` | Start autonomous development |
| `/agentful-status` | View completion % and current work |
| `/agentful-validate` | Run quality checks |
| `/agentful-decide` | Answer blocking decisions |

## Documentation

- **Full docs**: [agentful.app](https://agentful.app)
- **Architecture**: [Three-tier system](https://agentful.app/concepts/architecture) | [Background agents](https://agentful.app/concepts/background-agents)
- **Agents**: [Orchestrator](https://agentful.app/agents/orchestrator), [Backend](https://agentful.app/agents/backend), [Frontend](https://agentful.app/agents/frontend), [Reviewer](https://agentful.app/agents/reviewer), [Fixer](https://agentful.app/agents/fixer)
- **Skills**: [Validation](https://agentful.app/skills/validation), [Testing](https://agentful.app/skills/testing), [Research](https://agentful.app/skills/research), [Product Planning](https://agentful.app/skills/product-planning)

## Requirements

- [Claude Code](https://claude.ai/download)
- Node.js 22+
- Git

## Tech Stack Support

Auto-detects and adapts to your stack:

- **Languages**: JavaScript, TypeScript, Python, Go, Rust, Java, C#, PHP, Ruby, etc.
- **Frontend**: React, Vue, Angular, Svelte, Next.js, Astro, SolidJS, etc.
- **Backend**: Express, Fastify, NestJS, Django, Flask, Spring Boot, etc.
- **Databases**: PostgreSQL, MySQL, MongoDB, SQLite, etc.
- **Testing**: Jest, Vitest, Playwright, Cypress, Pytest, JUnit, etc.

## Links

- **Docs**: [agentful.app](https://agentful.app)
- **GitHub**: [github.com/itz4blitz/agentful](https://github.com/itz4blitz/agentful)
- **Discord**: [discord.gg/SMDvJXUe](https://discord.gg/SMDvJXUe)
- **Issues**: [github.com/itz4blitz/agentful/issues](https://github.com/itz4blitz/agentful/issues)
- **NPM**: [npmjs.com/package/@itz4blitz/agentful](https://www.npmjs.com/package/@itz4blitz/agentful)

## License

MIT
