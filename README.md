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

**AI agent toolkit for autonomous product development with Claude Code**

[Quick Start](#quick-start) • [Documentation](https://agentful.app) • [Discord](https://discord.gg/SMDvJXUe)

</div>

**The Swiss Army Knife of AI Agents** - Works with any LLM (Claude, GLM, DeepSeek, Ollama), any tech stack, any platform. Self-hosted or cloud.

## Features

- **8 specialized agents** - orchestrator, architect, backend, frontend, tester, reviewer, fixer, product-analyzer
- **6 quality gates** - types, tests, coverage, lint, security, dead code
- **Auto-generated domain agents** - learns your codebase patterns and conventions
- **Self-hosted execution** - run agents on your infrastructure (optional)
- **Multi-platform CI/CD** - GitHub Actions, GitLab, Jenkins, or any HTTP client
- **Product-driven workflow** - define specs, agents build features

## Quick Start

```bash
# 1. Install
npx @itz4blitz/agentful init

# 2. Start Claude Code
claude

# 3. Define product spec (interactive)
/agentful-product

# 4. Generate specialized agents
/agentful-generate

# 5. Start development
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
| `/agentful-product` | Create and analyze product specifications |
| `/agentful-start` | Start autonomous development |
| `/agentful-status` | View completion % and current work |
| `/agentful-validate` | Run quality checks |
| `/agentful-decide` | Answer blocking decisions |
| `/agentful-analyze` | Generate domain-specific agents |

## Self-Hosted Remote Execution

Run agents on your infrastructure:

```bash
# Deploy to Oracle Cloud free tier ($0/month)
agentful serve --auth=tailscale

# Or use SSH tunnel for local dev
ssh -L 3000:localhost:3000 your-server
agentful serve
```

See [deployment docs](https://agentful.app/remote-execution) for Tailscale, HMAC auth, and Oracle Cloud setup.

## MCP Server

Use agentful with any MCP-compatible AI tool (Claude Code, Kiro, Aider):

```json
{
  "mcpServers": {
    "agentful": {
      "command": "npx",
      "args": ["-y", "@itz4blitz/agentful-mcp"]
    }
  }
}
```

**Features**:
- Cross-tool compatibility (works with any MCP client)
- Launch specialized agents via MCP tools
- Access product specs and state via MCP resources
- Real-time execution status updates

See [MCP Integration Guide](./docs/mcp-integration.md) for setup with different AI tools.

## CI/CD Integration

Works with any platform via HTTP API or templates:

- [GitHub Actions](https://agentful.app/ci-integration#github-actions)
- [GitLab CI](https://agentful.app/ci-integration#gitlab-ci)
- [Jenkins](https://agentful.app/ci-integration#jenkins)
- [HTTP API](https://agentful.app/ci-integration#http-api) (CircleCI, Bitbucket, Travis, etc.)

## Documentation

- **Full docs**: [agentful.app](https://agentful.app)
- **MCP Integration**: [MCP Server Guide](./mcp/README.md) | [Integration Guide](./docs/mcp-integration.md)
- **Architecture**: [Agent system](https://agentful.app/concepts/architecture)
- **Agents**: [Orchestrator](https://agentful.app/agents/orchestrator), [Backend](https://agentful.app/agents/backend), [Frontend](https://agentful.app/agents/frontend), etc.
- **Skills**: [Product tracking](https://agentful.app/skills/product-tracking), [Validation](https://agentful.app/skills/validation), etc.

## Requirements

- Claude Code ([code.anthropic.com](https://code.anthropic.com))
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
