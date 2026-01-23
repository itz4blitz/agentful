# agentful

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/%40itz4blitz%2Fagentful.svg)](https://www.npmjs.com/package/@itz4blitz/agentful)
[![CI Status](https://github.com/itz4blitz/agentful/actions/workflows/pipeline.yml/badge.svg)](https://github.com/itz4blitz/agentful/actions)
[![Node Version](https://img.shields.io/badge/node-%3E%3D22-brightgreen)](https://nodejs.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/itz4blitz/agentful/pulls)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)

[![Downloads](https://img.shields.io/npm/dm/@itz4blitz/agentful.svg)](https://www.npmjs.com/package/@itz4blitz/agentful)
[![GitHub Stars](https://img.shields.io/github/stars/itz4blitz/agentful?style=social)](https://github.com/itz4blitz/agentful)
[![Discord](https://img.shields.io/badge/Discord-Join%20Us-7289da)](https://discord.gg/agentful)
[![Documentation](https://img.shields.io/badge/docs-agentful.app-blue)](https://agentful.app)

**Pre-configured AI agent toolkit with self-hosted remote execution**

[Quick Start](#quick-start) • [Features](#why-agentful) • [Documentation](https://agentful.app) • [Examples](https://github.com/itz4blitz/agentful/tree/main/examples)

</div>

Run specialized AI agents on your infrastructure with full control over data, costs, and integrations. Deploy to Oracle Cloud's free tier ($0/month), integrate with any CI/CD platform, and get agents that understand YOUR codebase.

---

## Why agentful?

### Self-Hosted Remote Agent Execution

Run AI agents on **your infrastructure** with complete control:

- **$0/month on Oracle Cloud free tier**: 4 ARM cores, 24GB RAM, always free
- **Three authentication modes**: Tailscale (recommended), HMAC for public endpoints, SSH tunnel for local development
- **Own your data**: All code analysis and execution happens on your servers
- **No vendor lock-in**: Standard HTTP API, works with any client
- **Secure by default**: WireGuard encryption (Tailscale), request signing (HMAC), or localhost-only (SSH)

```bash
# Deploy to Oracle Cloud free tier
agentful serve --auth=tailscale

# Or run locally with SSH tunnel
ssh -L 3000:localhost:3000 your-server
agentful serve --auth=none
```

### Multi-Platform CI/CD Integration

**Not locked to GitHub Actions** - works with any CI/CD platform:

- **GitHub Actions**: Native integration with workflow examples
- **GitLab CI**: Pipeline templates with caching and artifacts
- **Jenkins**: Groovy pipeline scripts for declarative/scripted pipelines
- **CircleCI, Bitbucket, Travis**: Use the HTTP API from any platform
- **Custom platforms**: Standard REST API for any HTTP client

```bash
# Generate workflow for your CI platform
agentful ci --generate-workflow

# Or integrate via HTTP API from any platform
curl -X POST http://your-server:3000/agent/orchestrator \
  -H "Content-Type: application/json" \
  -d '{"task": "implement feature X"}'
```

### Complete Agent Development Toolkit

Everything you need for structured AI-driven development:

- **8 specialized agents**: orchestrator, architect, backend, frontend, tester, reviewer, fixer, product-analyzer
- **6 reusable skills**: product-tracking, validation, testing, conversation, product-planning, deployment
- **6 quality gates**: Type checking, linting, test execution, coverage, security scanning, dead code detection
- **Interactive product planning**: Smart Q&A to build and validate specifications
- **State management**: Track progress, decisions, and completion across sessions
- **Smart updates**: 3-way merge preserves customizations during upgrades

### Auto-Generates Domain-Specific Agents

Agents that understand **YOUR codebase**, not generic templates:

- **Analyzes your patterns**: File organization, coding conventions, import styles, error handling
- **Detects tech stack**: Framework, language, database, ORM, testing tools
- **Generates specialized agents**: Real code examples from YOUR project
- **Confidence scoring**: See how well agents match your architecture (0.4-1.0)
- **Continuous refinement**: Re-analyzes after implementations to improve accuracy

**New projects**: Start with best-practice templates (0.4 confidence), then auto-refine after first feature.
**Existing projects**: Immediate high-confidence agents (0.8-1.0) from your actual code.

---

## Quick Start

### 1. Install agentful

```bash
npx @itz4blitz/agentful init
```

This installs all components (8 agents, 6 skills, quality gates) and auto-detects your tech stack.

### 2. Define your product

```bash
claude  # Start Claude Code
/agentful-product
```

Interactive Q&A creates your product specification with readiness scoring.

### 3. Generate domain-specific agents

```bash
/agentful-analyze
```

Analyzes your codebase and generates specialized agents matching your patterns.

### 4. Start development

```bash
/agentful-start
```

Orchestrator coordinates agents to implement features with quality gates.

---

## Remote Execution

Run agentful agents on remote servers via secure HTTP API.

### Authentication Modes

#### Tailscale (Recommended)

Uses WireGuard encryption for secure remote access:

```bash
# Install Tailscale
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up

# Start server (listens on Tailscale IP only)
agentful serve --auth=tailscale
```

**Benefits**:
- End-to-end encrypted (WireGuard)
- No public IP needed
- Works across NAT/firewalls
- Access from anywhere securely

#### HMAC (Public Endpoints)

Signature-based authentication with replay protection:

```bash
# Generate secret
export SECRET=$(openssl rand -hex 32)

# Start server with HMAC auth and HTTPS
agentful serve --auth=hmac --secret=$SECRET --https --cert=cert.pem --key=key.pem
```

**Client usage**:

```bash
# Calculate HMAC signature
TIMESTAMP=$(date +%s)
SIGNATURE=$(echo -n "${TIMESTAMP}${PAYLOAD}" | openssl dgst -sha256 -hmac "$SECRET" -binary | base64)

curl -X POST https://your-server:3000/agent/orchestrator \
  -H "Content-Type: application/json" \
  -H "X-Timestamp: $TIMESTAMP" \
  -H "X-Signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

**Benefits**:
- Secure for public endpoints
- Replay attack prevention (timestamp validation)
- No additional infrastructure needed

#### SSH Tunnel (Local Development)

Localhost-only access via SSH tunnel:

```bash
# On server
agentful serve --auth=none

# On client
ssh -L 3000:localhost:3000 your-server
curl http://localhost:3000/agent/orchestrator -d '{"task": "..."}'
```

**Benefits**:
- Simple setup for development
- SSH handles authentication
- No additional configuration

### Oracle Cloud Free Tier Deployment

Deploy agentful to Oracle Cloud's always-free tier: **4 ARM cores, 24GB RAM, $0/month**.

#### 1. Create Oracle Cloud Account

1. Sign up at [cloud.oracle.com](https://cloud.oracle.com)
2. Navigate to **Compute** > **Instances**
3. Click **Create Instance**

#### 2. Configure Instance

- **Image**: Ubuntu 22.04 LTS (ARM)
- **Shape**: VM.Standard.A1.Flex (4 OCPUs, 24GB RAM - always free)
- **Networking**: Create new VCN with default settings
- **SSH Keys**: Upload your public key

#### 3. Install Dependencies

```bash
# SSH into instance
ssh ubuntu@<instance-ip>

# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Tailscale
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

#### 4. Deploy agentful

```bash
# Clone your repository
git clone https://github.com/your-org/your-project.git
cd your-project

# Initialize agentful
npx @itz4blitz/agentful init

# Start server (runs in background)
nohup npx agentful serve --auth=tailscale > agentful.log 2>&1 &
```

#### 5. Configure Systemd (Optional)

Create `/etc/systemd/system/agentful.service`:

```ini
[Unit]
Description=agentful agent server
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/your-project
ExecStart=/usr/bin/npx agentful serve --auth=tailscale
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable agentful
sudo systemctl start agentful
```

### Configuration

Server configuration in `.claude/settings.json`:

```json
{
  "server": {
    "port": 3000,
    "host": "0.0.0.0",
    "auth": "tailscale",
    "https": {
      "enabled": true,
      "cert": "/path/to/cert.pem",
      "key": "/path/to/key.pem"
    },
    "hmac": {
      "secret": "${HMAC_SECRET}",
      "timestampWindow": 300
    }
  }
}
```

---

## CI/CD Integration

Integrate agentful with any CI/CD platform via HTTP API or workflow templates.

### GitHub Actions

```yaml
name: agentful CI/CD
on: [push, pull_request]

jobs:
  agentful:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Initialize agentful
        run: npx @itz4blitz/agentful init

      - name: Run orchestrator
        run: |
          npx agentful agent orchestrator \
            --task "implement pending features" \
            --validate

      - name: Quality gates
        run: npx agentful validate
```

### GitLab CI

```yaml
stages:
  - setup
  - implement
  - validate

setup:
  stage: setup
  script:
    - npx @itz4blitz/agentful init
  cache:
    paths:
      - .claude/
      - node_modules/

implement:
  stage: implement
  script:
    - npx agentful agent orchestrator --task "implement pending features"
  artifacts:
    paths:
      - .agentful/
      - src/

validate:
  stage: validate
  script:
    - npx agentful validate
  dependencies:
    - implement
```

### Jenkins

```groovy
pipeline {
  agent any

  stages {
    stage('Setup') {
      steps {
        sh 'npx @itz4blitz/agentful init'
      }
    }

    stage('Implement') {
      steps {
        sh 'npx agentful agent orchestrator --task "implement pending features"'
      }
    }

    stage('Validate') {
      steps {
        sh 'npx agentful validate'
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: '.agentful/**', allowEmptyArchive: true
    }
  }
}
```

### HTTP API (Any Platform)

Use the REST API from any CI/CD platform:

```bash
# CircleCI, Bitbucket, Travis, etc.
curl -X POST http://agentful-server:3000/agent/orchestrator \
  -H "Content-Type: application/json" \
  -H "X-Timestamp: $(date +%s)" \
  -H "X-Signature: $SIGNATURE" \
  -d '{
    "task": "implement feature X",
    "context": {
      "branch": "'$CI_BRANCH'",
      "commit": "'$CI_COMMIT'"
    }
  }'
```

**API Endpoints**:

- `POST /agent/{agent-name}` - Execute agent task
- `GET /status` - Get current state
- `POST /validate` - Run quality gates
- `GET /health` - Health check

---

## Domain-Specific Agent Generation

agentful generates agents that understand YOUR codebase, not generic templates.

### How It Works

#### 1. Architecture Analysis

The architect agent samples your codebase to detect:

- **Language and framework**: TypeScript + React, Python + Django, etc.
- **File organization**: Feature-based, layer-based, monorepo, etc.
- **Coding conventions**: Naming patterns, import styles, formatting
- **Error handling**: Try/catch patterns, error types, logging
- **Testing patterns**: Framework, test structure, mocking strategies

```bash
/agentful-analyze
```

Analysis output saved to `.agentful/architecture.json`:

```json
{
  "language": "typescript",
  "framework": "react",
  "patterns": {
    "fileOrganization": "feature-based",
    "importStyle": "named-imports",
    "errorHandling": "custom-error-classes",
    "testing": "jest-with-rtl"
  },
  "confidence": 0.85,
  "examples": {
    "componentStructure": "src/features/auth/LoginForm.tsx",
    "apiClient": "src/lib/api/client.ts",
    "errorHandling": "src/lib/errors/ApiError.ts"
  }
}
```

#### 2. Agent Generation Flow

##### New Projects (No Code Yet)

1. **Tech stack prompt**: Architect asks about your choices
   ```
   Frontend framework: React
   Backend framework: Express
   Database: PostgreSQL
   ORM: Prisma
   ```

2. **Template-based generation**: Creates agents using best practices
   - Based on official documentation
   - Common patterns and conventions
   - Marked with `confidence: 0.4`

3. **First feature implementation**: System builds initial feature

4. **Automatic re-analysis**: After completion
   - Analyzes actual code patterns
   - Updates agents with project-specific examples
   - Confidence increases to `0.8+`
   - Remaining features use refined agents

##### Existing Projects (With Code)

1. **Pattern detection**: Immediate analysis of existing code
2. **High-confidence agents**: Real examples from your project (`0.8-1.0`)
3. **Ready to use**: Start implementing features immediately

### Generate Specialized Agents

After analysis, generate domain-specific agents:

```bash
/agentful-generate
```

This creates/updates agents in `.claude/agents/` with:

- **Real code examples** from YOUR project
- **Specific patterns** matching your conventions
- **Framework-specific guidance** for your stack
- **Confidence scores** indicating pattern certainty

Example generated agent (`.claude/agents/backend.md`):

```markdown
# Backend Agent

You are the backend agent for a TypeScript Express application.

## Project Architecture

**Framework**: Express with TypeScript
**Database**: PostgreSQL with Prisma ORM
**Confidence**: 0.87

## Coding Patterns

### API Route Structure
Follow the feature-based organization pattern:

\`\`\`typescript
// src/features/users/routes.ts
import { Router } from 'express';
import { UserController } from './controller';

export const userRouter = Router();
userRouter.post('/users', UserController.create);
\`\`\`

### Error Handling
Use custom error classes with proper HTTP status codes:

\`\`\`typescript
// Example from: src/lib/errors/ApiError.ts
export class ValidationError extends ApiError {
  constructor(message: string, field?: string) {
    super(message, 400, 'VALIDATION_ERROR', { field });
  }
}
\`\`\`

### Database Access
Use Prisma client with transaction patterns:

\`\`\`typescript
// Example from: src/features/orders/service.ts
await prisma.$transaction(async (tx) => {
  await tx.order.create({ data: orderData });
  await tx.inventory.update({ where: { id }, data: { quantity: { decrement: 1 } } });
});
\`\`\`
```

### Confidence Scores

Agents include confidence scores indicating pattern detection certainty:

- **0.4**: Template-based (new projects before first implementation)
- **0.6-0.7**: Partial pattern detection (limited code samples)
- **0.8-0.9**: Strong pattern detection (consistent patterns found)
- **1.0**: Full confidence (comprehensive pattern analysis)

### Continuous Refinement

Agents improve over time:

1. **After each feature**: Architect can re-analyze to update patterns
2. **Manual refinement**: Edit generated agents in `.claude/agents/`
3. **Version control**: Track agent evolution with your codebase

---

## Installation

### Web Configurator

Configure your agentful installation with an interactive web interface:

**[agentful.app](https://agentful.app)**

- Visual component selection
- 2 optimized presets
- Custom configurations
- Shareable setup URLs
- No CLI required

### Default Installation (Recommended)

Install agentful with all components - works with any tech stack:

```bash
npx @itz4blitz/agentful init
```

This installs:
- **8 agents**: orchestrator, architect, backend, frontend, tester, reviewer, fixer, product-analyzer
- **6 skills**: product-tracking, validation, testing, conversation, product-planning, deployment
- **Quality gates**: types, tests, coverage, lint, security, dead-code

**Tech stack is auto-detected** on first run (TypeScript, Python, React, etc.) - no need to specify.

### Minimal Installation

For simple scripts/CLIs that only need backend code:

```bash
npx @itz4blitz/agentful init --preset=minimal
```

This installs only:
- **2 agents**: orchestrator, backend
- **1 skill**: validation

### Custom Installation

Specify exactly what you want:

```bash
# Custom agents and skills
npx @itz4blitz/agentful init --agents=orchestrator,backend,frontend --skills=validation,testing

# View installation options
npx @itz4blitz/agentful presets
```

### Shareable Configurations

Use a configuration from the web configurator:

```bash
npx @itz4blitz/agentful init --config=<shareable-url>
```

**Available Flags:**
- `--preset=<name>` - Use a preset configuration
- `--agents=<list>` - Comma-separated list of agents (orchestrator, backend, frontend, tester, reviewer, fixer, architect, product-analyzer)
- `--skills=<list>` - Comma-separated list of skills (validation, testing, product-tracking, conversation, product-planning, deployment)
- `--gates=<list>` - Comma-separated list of quality gates (types, tests, coverage, lint, security, dead-code)

Flags override preset values when both are specified.

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

---

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
- Start immediately without existing code
- No blocking on pattern detection
- Learns and adapts after first implementation
- Continuously improving agent quality

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

---

## Commands

| Command | Description |
|---------|-------------|
| `/agentful` | Main agentful command - shows help and available commands |
| `/agentful-product` | Smart product planning: create, analyze, and refine requirements |
| `/agentful-start` | Start or resume structured development |
| `/agentful-status` | Display progress and current state |
| `/agentful-validate` | Run all quality checks |
| `/agentful-decide` | Answer pending decisions |
| `/agentful-update` | Smart update mechanism - fetches latest templates and gracefully migrates changes |
| `/agentful-analyze` | Analyze architecture and generate specialized agents for your tech stack |
| `/agentful-generate` | Generate specialized agents from architecture analysis |

---

## Architecture

### Agent System

agentful uses eight specialized agents:

| Agent | Responsibility |
|-------|---------------|
| orchestrator | Coordinates work, routes tasks, tracks state |
| architect | Analyzes project structure and generates specialized agents<br/>• New projects: Prompts for tech stack, generates template agents<br/>• Existing projects: Detects patterns from code<br/>• Re-analyzes after first implementation in new projects |
| backend | Implements server-side logic, APIs, database schemas |
| frontend | Implements UI components, pages, state management |
| tester | Writes unit, integration, and end-to-end tests |
| reviewer | Validates code quality, security, and standards |
| fixer | Resolves validation failures and test errors |
| product-analyzer | Analyzes product specs for gaps, ambiguities, and readiness scoring |

### Quality Gates

Code changes are validated against 6 automated quality gates:

- Type checking (TypeScript, Flow, etc.)
- Linting (ESLint, Biome, etc.)
- Test execution
- Code coverage
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
- `conversation-history.json` - Session tracking

User configuration is stored in `.claude/` (version controlled):

- `agents/` - Agent definitions
- `commands/` - Slash commands
- `product/` - Product specifications
  - `index.md` - Main product spec (user editable)
  - `domains/` - Optional hierarchical structure
- `skills/` - Reusable skill modules
  - `conversation/` - Intent classification and context management
  - `product-tracking/` - Progress calculation and state tracking
  - `product-planning/` - Product specification guidance
  - `validation/` - Quality gate checks and tool detection
  - `testing/` - Test strategy and coverage
  - `deployment/` - Deployment preparation and validation
- `settings.json` - Project configuration

---

## Technology Support

agentful detects and adapts to your technology stack automatically:

- **Languages**: TypeScript, JavaScript, Python, Go, Rust, Java, C#, PHP, Ruby, Elixir
- **Frontend**: React, Vue, Angular, Svelte, Next.js, Astro, SolidJS
- **Backend**: Express, Fastify, NestJS, Hono, Next.js API Routes
- **Databases**: PostgreSQL, MySQL, SQLite, MongoDB
- **ORMs**: Prisma, Drizzle, TypeORM, Mongoose
- **Testing**: Jest, Vitest, Playwright, Cypress, Pytest, JUnit

---

## Requirements

- Claude Code ([code.anthropic.com](https://code.anthropic.com))
- Node.js 22 or higher
- Git

---

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
│   └── conversation-history.json
└── src/                            # Source code
```

---

## Documentation

Full documentation: [agentful.app](https://agentful.app)

---

## License

MIT

---

## Links

- GitHub: [github.com/itz4blitz/agentful](https://github.com/itz4blitz/agentful)
- Issues: [github.com/itz4blitz/agentful/issues](https://github.com/itz4blitz/agentful/issues)
- NPM: [npmjs.com/package/@itz4blitz/agentful](https://www.npmjs.com/package/@itz4blitz/agentful)
