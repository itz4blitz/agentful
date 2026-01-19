<div align="center">

# agentful

### The Autonomous Product Development Kit for Claude Code

Transform any project into an intelligent, self-building product with specialized AI agents that work 24/7 to write, test, and validate your code.

**[📚 Full Documentation →](https://agentful.app)**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/%40itz4blitz%2Fagentful.svg)](https://www.npmjs.com/package/@itz4blitz/agentful)
[![Claude Code](https://img.shields.io/badge/Claude_Code-Compatible-blue)](https://code.anthropic.com)

</div>

---

## What is agentful?

**agentful** is an opinionated setup for Claude Code that transforms it into a powerful autonomous development system. It's not just another AI coding assistant—it's a complete product development framework that coordinates specialized agents to build your entire application autonomously.

Think of it as having a team of expert developers available 24/7, each with their own specialty, working together to build your product while you sleep.

### What Makes agentful Different?

Unlike single-purpose AI tools, agentful provides:

- **7 Specialized Agents** working in concert (Orchestrator, Architect, Backend, Frontend, Tester, Reviewer, Fixer)
- **Intelligent Init** that automatically detects your project structure (flat vs hierarchical)
- **Natural Conversation Interface**—just talk to agentful like a senior developer
- **24/7 Autonomous Development** that works while you sleep
- **Built-in Quality Gates** ensuring production-ready code
- **Tech Stack Auto-Detection** generating agents for your specific stack
- **Progress Tracking** showing exactly what's done and what's next

---

## How agentful Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        1. DEFINE YOUR PRODUCT                               │
│  Edit PRODUCT.md with your requirements, tech stack, and features           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                     2. INTELLIGENT INIT (Automatic)                         │
│  • Analyzes your project structure                                         │
│  • Detects tech stack (Next.js, React, Prisma, etc.)                       │
│  • Creates optimal product structure (flat or hierarchical)                │
│  • Generates specialized agents for your stack                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                     3. AUTONOMOUS DEVELOPMENT                               │
│  • Orchestrator coordinates work                                           │
│  • Specialized agents implement features                                   │
│  • Tester writes and runs tests                                            │
│  • Reviewer validates quality gates                                        │
│  • Fixer resolves any issues                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                        4. 24/7 ITERATION                                    │
│  Loop continues until all features complete and quality gates pass         │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                      ✅ PRODUCTION-READY CODE                                │
│  All tests passing • No type errors • Coverage ≥80% • Secure               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Quick Start (30 seconds)

### Step 1: Initialize in Your Project

```bash
npx @itz4blitz/agentful init
```

**Intelligent Structure Detection:**

agentful automatically analyzes your project and creates the optimal product structure:

- **Simple Projects** → Creates `PRODUCT.md` at root (flat, single-file)
- **Large/Complex Projects** → Creates `.claude/product/` with domain directories (hierarchical)

**Detection Logic:**
- ≥3 detected domains → Hierarchical structure
- ≥2 frameworks detected → Hierarchical structure
- Monorepo detected → Hierarchical structure
- Otherwise → Flat structure (recommended for beginners)

### Step 2: Edit Your Product Specification

**For Simple Projects (Flat Structure)** - Edit `PRODUCT.md`:

```markdown
## Overview
A task management app for remote teams with real-time collaboration.

## Tech Stack
- Frontend: Next.js 14 + TypeScript + Tailwind CSS
- Backend: Next.js API Routes
- Database: Prisma + PostgreSQL
- Testing: Vitest + Playwright

## Features

### Domain: Authentication

#### User Registration - CRITICAL
**Description**: Allow new users to create accounts

**Subtasks**:
1. Create registration form UI - CRITICAL
   - [ ] Email validation with regex
   - [ ] Password minimum 8 characters
   - [ ] Responsive design

2. Implement registration API endpoint - CRITICAL
   - [ ] POST /api/auth/register
   - [ ] Hash passwords with bcrypt
   - [ ] Rate limiting

#### User Login - CRITICAL
[... more features]
```

**For Large Projects (Hierarchical Structure)** - Edit `.claude/product/index.md`:

```markdown
## Overview
E-commerce platform with multi-vendor support.

## Domains
1. **Authentication** - See `.claude/product/domains/auth/` for details
2. **Product Catalog** - See `.claude/product/domains/products/` for details
3. **Order Processing** - See `.claude/product/domains/orders/` for details
4. **Vendor Management** - See `.claude/product/domains/vendors/` for details
```

Then edit domain-specific files in `.claude/product/domains/{domain-name}/`.

### Step 3: Start Autonomous Development

```bash
claude
```

Then inside Claude Code:

```
/agentful-start
```

That's it! agentful will:

1. **Analyze** your product specification
2. **Detect** your tech stack from `package.json` and code
3. **Generate** specialized agents for your stack
4. **Begin** autonomous development immediately

---

## Key Features

### 🧠 Intelligent Init

Smart initialization that adapts to your project:

- **Automatic Structure Detection** - Chooses flat vs hierarchical based on project complexity
- **Tech Stack Detection** - Analyzes dependencies, frameworks, and code patterns
- **Dynamic Agent Generation** - Creates specialized agents for your specific stack
- **Zero Configuration** - Works out of the box, no setup needed

**Example:**

```bash
$ npx @itz4blitz/agentful init

✓ Detected project type: Next.js App Router
✓ Detected tech stack: Next.js 14, TypeScript, Prisma, Tailwind CSS
✓ Analyzing project structure...
✓ Detected 5 domains → Using hierarchical structure
✓ Created .claude/product/domains/ with 5 domain directories
✓ Generated specialized agents: nextjs-agent, prisma-agent, tailwind-agent

Next: Edit .claude/product/index.md to define your product, then run 'claude' and '/agentful-start'
```

### 💬 Natural Conversation Interface

Talk to agentful like a senior developer:

```bash
/agentful

You: I need to add user authentication
agentful: I'll help you add authentication. I can see you have Next.js set up.
        Would you like to use NextAuth.js or implement custom JWT?

You: Let's use NextAuth.js with Google provider
agentful: Perfect. I'll:
        1. Install next-auth
        2. Configure Google OAuth
        3. Create login/logout pages
        4. Add session management
        5. Write tests
        Ready to proceed?

You: Yes, go ahead
agentful: Starting implementation...
```

### 🤖 Specialized Agents

Seven AI agents working together:

| Agent | Role | Expertise |
|-------|------|-----------|
| **@orchestrator** | Project Manager | Coordinates all work, manages decisions, tracks progress |
| **@architect** | System Architect | Analyzes tech stack, generates specialized agents |
| **@backend** | Backend Developer | Services, repositories, controllers, APIs |
| **@frontend** | Frontend Developer | Components, pages, hooks, styling |
| **@tester** | QA Engineer | Unit, integration, E2E tests |
| **@reviewer** | Code Reviewer | Code review, dead code detection, quality validation |
| **@fixer** | DevOps Engineer | Auto-fixes validation failures |

### 🌙 24/7 Autonomous Development

Use the Ralph Wiggum plugin for overnight autonomous development:

```bash
# Inside Claude Code
/plugin install ralph-wiggum@anthropics

# Run autonomous development loop
/ralph-loop "/agentful-start" --max-iterations 50 --completion-promise "AGENTFUL_COMPLETE"
```

**What happens overnight:**
- agentful works while you sleep
- Continues until all features complete (100%)
- Stops when all quality gates pass
- Or reaches max iterations

Wake up to a working product!

### 📊 Quality Gates

Code must pass ALL gates before completion:

- ✅ **All tests passing** - Unit, integration, and E2E
- ✅ **Type checking** - Adapts to your stack (TypeScript, Flow, etc.)
- ✅ **Linting** - Zero lint errors
- ✅ **Dead code elimination** - No unused exports, files, or dependencies
- ✅ **Test coverage** - Minimum 80% coverage
- ✅ **Security** - No vulnerabilities or security issues

Quality gates automatically adapt to your tech stack. Using JavaScript instead of TypeScript? No type checking. Using ESLint instead of Biome? Linting adapts accordingly.

### 📈 Progress Tracking

Real-time visibility into development:

```bash
/agentful-status
```

**Output:**
```
🔧 Working on: User authentication feature
   Phase: implementation
   Iterations: 12
   Current task: Implementing JWT service

Progress:
   ████████░░░░░░░░░░░ 40%

Quality Gates:
   ✅ Tests Passing (47/47)
   ❌ Type Checking (3 errors found)
   ⚠️  Coverage (76% - target: 80%)
   ✅ Linting (0 errors)
   ✅ Dead Code (0 issues)
   ✅ Security (0 vulnerabilities)

Pending Decisions (2):
   1. ⚠️  Which auth library? (NextAuth.js or custom JWT?)
   2. ⚠️  Session duration? (7 days or 30 days?)

Completed:
   ✅ User registration (100%)
   ✅ Password reset (100%)
   🔄 User authentication (40%)
   ⏳ User profile (0%)
```

### 🎯 Smart Decision Handling

agentful asks when it needs clarification:

1. **Question added** to `decisions.json`
2. **Continues work** on unblocked features
3. **You answer** when convenient via `/agentful-decide`
4. **Resumes** blocked work automatically

Never interrupt flow—agentful keeps working on what it can.

---

## Example Flow

Here's a real example of agentful building authentication:

```bash
# You: Initialize agentful
$ npx @itz4blitz/agentful init
✓ Detected project type: Next.js App Router
✓ Detected tech stack: Next.js 14, TypeScript, Prisma, Tailwind CSS
✓ Created PRODUCT.md (flat structure)

# You: Edit PRODUCT.md with authentication requirements

# You: Start Claude Code
$ claude

# You: Start autonomous development
> /agentful-start

# agentful responds:
🔍 Analyzing PRODUCT.md...
📋 Detected domains: Authentication, User Management
🛠️  Detected tech stack: Next.js 14, TypeScript, Prisma, Tailwind CSS, Vitest
🤖 Generating specialized agents: nextjs-agent, typescript-agent, prisma-agent, tailwind-agent

🚀 Starting autonomous development...

📌 Feature: User Registration (CRITICAL)
   → @backend implementing JWT service
   → @backend creating user schema in Prisma
   → @backend implementing registration API route
   → @frontend creating registration form
   → @tester writing unit tests
   → @tester writing integration tests

✅ User Registration complete (100%)
   Tests: ✅ 12/12 passing
   Type check: ✅ 0 errors
   Coverage: ✅ 87%

📌 Feature: User Login (CRITICAL)
   → @backend implementing login API
   → @frontend creating login page
   → @tester writing auth tests

⚠️  Decision needed: Which session duration?
   Options: 7 days, 30 days, or custom
   → @orchestrator continuing with unblocked features...

📌 Feature: Password Reset (HIGH)
   → @backend implementing reset token flow
   → @backend creating email service
   → @frontend creating reset form

> /agentful-decide

📝 Pending Decisions:
1. Which session duration for JWT tokens?
   a) 7 days (recommended for better security)
   b) 30 days (more convenient)
   c) Custom duration

   Your choice: a

✅ Decision resolved: Using 7-day session duration
🔄 @orchestrator resuming login feature...

📌 Feature: User Login (resuming)
   → @backend implementing 7-day session duration
   → @frontend adding session persistence

✅ User Login complete (100%)
   Tests: ✅ 18/18 passing
   Type check: ✅ 0 errors
   Coverage: ✅ 91%

📊 Progress Update:
   ████████░░░░░░░░░░░ 33% (3/9 features complete)

🔄 Continuing with next feature: User Profile...

[Continues 24/7 until complete]
```

---

## Why Use agentful?

### vs. Manual Development

| Manual Development | agentful |
|-------------------|----------|
| Write every line yourself | AI agents write code autonomously |
| Forget to write tests | Tests written automatically |
| Debug for hours | Issues caught and fixed automatically |
| Works only when you work | Works 24/7 |
| Inconsistent code quality | Enforced quality standards |
| Context switching overhead | Specialized agents maintain focus |

### vs. Other AI Tools

| Other AI Coding Assistants | agentful |
|---------------------------|----------|
| Single-purpose (code completion) | Complete product development system |
| No coordination between agents | 7 specialized agents working together |
| Requires constant supervision | Autonomous 24/7 operation |
| No quality enforcement | Built-in quality gates |
| Generic code | Tech stack-specific agents |
| No progress tracking | Real-time progress visibility |
| Manual testing | Automatic test generation |

### Key Differentiators

1. **Agent Coordination** - Unlike single AI tools, agentful orchestrates 7 specialized agents working together
2. **Intelligent Init** - Automatically detects optimal project structure (flat vs hierarchical)
3. **Natural Conversation** - Talk to agentful like a senior developer, not a tool
4. **Quality Built-In** - Every feature includes tests, type checking, linting, coverage, security
5. **24/7 Development** - Works while you sleep via Ralph Wiggum loops
6. **Tech Stack Adaptation** - Dynamically generates agents for your specific stack
7. **Progress Visibility** - Always know what's done, what's next, and what's blocked

---

## Product Structures

agentful supports two product structure formats:

### Flat Structure (Recommended for Beginners)

**Best for:** Simple projects, MVPs, prototypes

```
your-project/
├── PRODUCT.md          # Single file with all features
├── .claude/            # agentful configuration
└── src/                # Your code
```

**Advantages:**
- Simple to get started
- Everything in one file
- Easy to understand
- Great for small teams

### Hierarchical Structure (For Large Projects)

**Best for:** Complex projects, multiple domains, large teams

```
your-project/
├── .claude/
│   └── product/
│       ├── index.md           # Product overview
│       └── domains/
│           ├── authentication/
│           │   ├── index.md   # Domain overview
│           │   └── features/
│           │       ├── login.md
│           │       └── register.md
│           ├── user-management/
│           │   └── features/
│           └── payments/
│               └── features/
└── src/
```

**Advantages:**
- Organized by domain
- Multiple team members can edit simultaneously
- Easier to navigate large specs
- Better for complex products

### Automatic Detection

agentful automatically detects which structure you're using. No configuration needed!

**Start with flat, migrate to hierarchical as you grow.** Both formats work identically.

---

## Commands

| Command | Description |
|---------|-------------|
| `/agentful` | **Natural conversation** - Just talk to agentful |
| `/agentful-start` | Begin or resume autonomous development |
| `/agentful-status` | Check current progress and what's being worked on |
| `/agentful-decide` | Answer pending decisions that block development |
| `/agentful-validate` | Run all quality checks (tests, type check, lint, coverage, security) |

---

## Tech Stack Support

agentful automatically detects and supports:

### Frontend Frameworks
- Next.js (App Router & Pages Router)
- React + Vite
- Vue + Nuxt
- SvelteKit
- Solid.js
- Astro

### Backend Frameworks
- Next.js API Routes
- Express
- Fastify
- NestJS
- Hono
- tRPC

### Databases & ORMs
- PostgreSQL, MySQL, SQLite, MongoDB
- Prisma, Drizzle, TypeORM, Mongoose

### Styling
- Tailwind CSS, CSS Modules, styled-components, shadcn/ui

### Testing
- Vitest, Jest, Playwright, Cypress

### Authentication
- NextAuth.js, Clerk, Auth0, Lucia, custom JWT

**And many more!** agentful generates specialized agents for whatever stack you're using.

---

## Use Cases

### Perfect For:

- **MVP Development** - Ship your minimum viable product in days, not weeks
- **Prototyping** - Quickly test ideas with working code
- **Full-Stack Projects** - Build complete applications from scratch
- **Legacy Migration** - Modernize old codebases with test coverage
- **SaaS Products** - Build complete SaaS applications autonomously
- **Internal Tools** - Create tools for your team automatically
- **Learning Projects** - Learn best practices from autonomously written code
- **Open Source** - Generate boilerplate and scaffolding automatically

### Not Ideal For:

- Highly experimental research projects
- Projects requiring proprietary algorithms
- Applications needing human creative direction
- Simple one-off scripts (overkill)

---

## Requirements

- **Claude Code** - [Install here](https://code.anthropic.com)
- **Node.js 22+** - For CLI tool
- **Git** - For version control

---

## Documentation

Full documentation at **[agentful.app](https://agentful.app)**

### Getting Started
- **[Quick Start Guide](https://agentful.app/getting-started/quick-start)** - 5-minute walkthrough
- **[Your First Project](https://agentful.app/getting-started/first-project)** - Build your first project
- **[Product Specification](https://agentful.app/getting-started/product-specification)** - How to write effective specs

### Core Concepts
- **[Agents](https://agentful.app/agents)** - Specialized agents and their roles
- **[Commands](https://agentful.app/core-concepts/commands)** - All available commands
- **[Quality Gates](https://agentful.app/autonomous-development/quality-gates)** - Quality checks explained
- **[Progress Tracking](https://agentful.app/core-concepts/progress-tracking)** - State management
- **[Decision Handling](https://agentful.app/core-concepts/decisions)** - How agentful handles decisions

### Advanced
- **[24/7 Development](https://agentful.app/autonomous-development/24-7-development)** - Overnight autonomous loops
- **[Product Structures](https://agentful.app/core-concepts/product-structures)** - Flat vs hierarchical
- **[Tech Stack Detection](https://agentful.app/core-concepts/tech-stack-detection)** - How it works
- **[Customization](https://agentful.app/advanced/customization)** - Customize agents and commands

---

## Architecture

```
your-project/
├── PRODUCT.md              # Your product spec (flat structure)
├── CLAUDE.md               # Project-specific Claude instructions
├── .claude/                # agentful configuration
│   ├── product/            # Product spec (hierarchical structure)
│   │   ├── index.md        # Product overview
│   │   └── domains/        # Domain-specific specs
│   ├── agents/             # Specialized agents
│   │   ├── orchestrator.md
│   │   ├── architect.md
│   │   ├── backend.md
│   │   ├── frontend.md
│   │   ├── tester.md
│   │   ├── reviewer.md
│   │   └── fixer.md
│   ├── commands/           # Slash commands
│   │   ├── agentful.md
│   │   ├── agentful-start.md
│   │   ├── agentful-status.md
│   │   ├── agentful-decide.md
│   │   └── agentful-validate.md
│   ├── skills/             # Domain-specific skills
│   │   ├── conversation/
│   │   ├── product-tracking/
│   │   └── validation/
│   └── settings.json       # Hooks and permissions
├── .agentful/              # Runtime state (gitignored)
│   ├── state.json          # Current work state
│   ├── completion.json     # Feature completion percentages
│   ├── decisions.json      # Pending and resolved decisions
│   ├── architecture.json   # Detected tech stack
│   └── last-validation.json # Most recent validation report
└── src/                    # Your code (generated by agentful)
```

---

## Links

- **GitHub**: [github.com/itz4blitz/agentful](https://github.com/itz4blitz/agentful)
- **Issues**: [github.com/itz4blitz/agentful/issues](https://github.com/itz4blitz/agentful/issues)
- **Website**: [agentful.app](https://agentful.app)
- **Documentation**: [agentful.app](https://agentful.app)
- **NPM**: [npmjs.com/@itz4blitz/agentful](https://www.npmjs.com/package/@itz4blitz/agentful)
- **Claude Code**: [code.anthropic.com](https://code.anthropic.com)

---

## License

MIT

---

## Links

- **GitHub**: [github.com/itz4blitz/agentful](https://github.com/itz4blitz/agentful)
- **Issues**: [github.com/itz4blitz/agentful/issues](https://github.com/itz4blitz/agentful/issues)
- **Website**: [agentful.app](https://agentful.app)
- **Documentation**: [agentful.app](https://agentful.app)
- **NPM**: [npmjs.com/@itz4blitz/agentful](https://www.npmjs.com/package/@itz4blitz/agentful)
- **Claude Code**: [code.anthropic.com](https://code.anthropic.com)

---

## License

MIT
