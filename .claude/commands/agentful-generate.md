---
name: agentful-generate
description: Analyze codebase and generate domain agents + tech skills based on your stack
---

# /agentful-generate

Analyze codebase, detect tech stack, discover business domains, generate domain agents and tech skills.

## Key Concepts

**Agents** = Actors that DO work. They have tools, write code, make decisions.
- Core agents: backend, frontend, tester, reviewer, fixer (already included)
- Domain agents: books, auth, billing, orders (generated based on your code)

**Skills** = Knowledge that agents REFERENCE. Documentation and patterns.
- Tech skills: react, express, prisma, nextjs (generated based on your stack)

## Workflow

### Step 1: Detect Tech Stack

**Read**: package.json, requirements.txt, pyproject.toml, go.mod, Cargo.toml, prisma/schema.prisma

**Detect**:
- Language: TypeScript, JavaScript, Python, Go, Rust
- Framework: Next.js, React, Vue, Express, NestJS, Django, Flask, FastAPI
- ORM: Prisma, Drizzle, TypeORM, Mongoose, SQLAlchemy
- Database: PostgreSQL, MySQL, MongoDB, SQLite
- Testing: Vitest, Jest, Playwright, pytest

### Step 2: Discover Business Domains

**Scan**: src/**/*, API routes, services, models, components

**Evidence scoring**:
- Directory named after domain: +10 (src/auth/, src/billing/)
- API routes for domain: +15 (api/auth/*, routes/books.ts)
- Service/controller files: +8 (authService.ts, bookController.ts)
- Database models: +5 (User, Book, Order)
- Frontend pages/components: +5 (Books.tsx, AuthorCard.tsx)

**Confidence** = score / 50 * 100 (max 100%)

**Threshold**: Only generate domain agent if confidence >= 75%

### Step 3: Plan Generation

**Show plan to user**:

```
Tech Stack Detected:
  - TypeScript
  - React 18 + Vite
  - Express 4
  - Prisma + SQLite

Domains Discovered:
  - books (95% confidence) ✓ Will generate agent
  - authors (95% confidence) ✓ Will generate agent
  - stats (85% confidence) ✓ Will generate agent
  - payments (40% confidence) ✗ Below threshold

Will Generate:

  Domain Agents (3):
    .claude/agents/books.md
    .claude/agents/authors.md
    .claude/agents/stats.md

  Tech Skills (4):
    .claude/skills/react/SKILL.md
    .claude/skills/express/SKILL.md
    .claude/skills/prisma/SKILL.md
    .claude/skills/typescript/SKILL.md

Proceed? (y/n)
```

**Wait for confirmation before generating.**

### Step 4: Generate Domain Agents

Create `.claude/agents/<domain>.md` for each domain with confidence >= 75%:

```markdown
---
name: <domain>
description: <Domain> domain - <brief description based on evidence>
model: sonnet
tools: Read, Write, Edit, Glob, Grep, Bash
---

# <Domain> Agent

## Your Scope
[List responsibilities based on discovered files]

## Domain Structure
[List actual files discovered - services, controllers, routes, components]

## Implementation Guidelines
[Patterns specific to this domain, derived from existing code]

## Boundaries
- Handles: [what this agent owns]
- Delegates to @backend: [general backend patterns]
- Delegates to @frontend: [general frontend patterns]
- Delegates to @tester: [testing]

## Rules
1. Stay within domain boundaries
2. Follow existing patterns in this domain
3. Coordinate with related domains via clear interfaces
```

### Step 5: Generate Tech Skills

Create `.claude/skills/<tech>/SKILL.md` for each detected technology:

```markdown
---
name: <tech>
description: <Tech> patterns and best practices for this project
---

# <Tech> Skill

## Overview
[Brief intro - what this tech does in this project]

## Project Configuration
[Detected version, settings from package.json/config files]

## Common Patterns
[3-5 patterns with code examples from THIS project's style]

## Best Practices
[Numbered list specific to this project's usage]

## Common Pitfalls
[What to avoid]

## References
[Official docs links]
```

### Step 6: Create architecture.json

Write to `.agentful/architecture.json`:

```json
{
  "techStack": {
    "languages": ["TypeScript"],
    "frontend": { "framework": "React", "version": "18.x" },
    "backend": { "framework": "Express", "version": "4.x" },
    "database": { "type": "SQLite", "orm": "Prisma" },
    "testing": ["Vitest", "Jest"]
  },
  "domains": [
    { "name": "books", "confidence": 95 },
    { "name": "authors", "confidence": 95 }
  ],
  "generatedAgents": ["books", "authors"],
  "generatedSkills": ["react", "express", "prisma", "typescript"],
  "analyzedAt": "2026-01-20T00:00:00Z"
}
```

### Step 7: Report Results

```
✅ Generation Complete

Domain Agents (2):
  ✓ .claude/agents/books.md (95%)
  ✓ .claude/agents/authors.md (95%)

Tech Skills (4):
  ✓ .claude/skills/react/SKILL.md
  ✓ .claude/skills/express/SKILL.md
  ✓ .claude/skills/prisma/SKILL.md
  ✓ .claude/skills/typescript/SKILL.md

Architecture saved to .agentful/architecture.json

Usage:
  @books add new field to book model
  @authors implement author search
  @backend (uses express, prisma skills automatically)
  @frontend (uses react skill automatically)

Rerun /agentful-generate when codebase structure changes.
```

## Rules

1. **Agents are ACTORS** - Only create agents for business domains (books, auth, billing)
2. **Skills are KNOWLEDGE** - Create skills for technologies (react, express, prisma)
3. **Never create tech agents** - No react.md agent, no express.md agent
4. **Domain threshold is 75%** - Don't create agents for low-confidence domains
5. **Always show plan first** - Wait for user confirmation before generating
6. **Use real code examples** - Sample actual project files for patterns
7. **Don't duplicate core agents** - backend, frontend, tester already exist
8. **Create architecture.json** - Track what was generated for health checks
