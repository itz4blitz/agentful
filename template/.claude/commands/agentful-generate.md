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

### Step 0: Check Prerequisites

Before generating agents, ensure we have BOTH:
1. **Tech stack** (detected from code)
2. **Product requirements** (from .claude/product/index.md or /agentful-init)

**Without both, agent generation is premature.**

```javascript
// Check if product spec exists and has content
const hasProductSpec = exists('.claude/product/index.md') &&
                       Read('.claude/product/index.md').length > 200;

// Check if tech stack can be detected
const canDetectTechStack = exists('package.json') ||
                          exists('requirements.txt') ||
                          exists('go.mod') ||
                          exists('Cargo.toml');

if (!hasProductSpec && canDetectTechStack) {
  // Fresh project - need requirements first
  const response = AskUserQuestion({
    question: `
I detected a fresh project with no product requirements yet.

Tech Stack Detected:
${formatDetectedStack()}

To generate specialized agents, I need product requirements:
- What you're building
- Key features
- Business domains

Would you like to:
`,
    options: [
      'Use guided setup (/agentful-init) - recommended',
      'Manually edit .claude/product/index.md first',
      'Generate generic agents anyway (not recommended)'
    ]
  });

  if (response.includes('guided setup')) {
    console.log(`
Launching guided setup...

This will ask 7 quick questions to understand your product.
`);
    // User should run /agentful-init
    // SlashCommand('/agentful-init');
    return;
  } else if (response.includes('Manually edit')) {
    console.log(`
Please edit .claude/product/index.md with:
- Product description
- Key features
- Business domains

When done, run /agentful-generate again.

The PostToolUse hook will auto-detect changes and re-run this command.
`);
    return;
  }
  // Otherwise continue with generic agents (user chose option 3)
}

if (!canDetectTechStack && !hasProductSpec) {
  // No tech stack AND no product spec
  throw new Error(`
❌ Cannot generate agents - missing both tech stack and product requirements.

Please either:
1. Run /agentful-init for guided setup
2. Ensure you're in a project directory with package.json, requirements.txt, etc.
`);
}
```

### Step 1: Detect Tech Stack

**Read**: package.json, requirements.txt, pyproject.toml, go.mod, Cargo.toml, prisma/schema.prisma

**Detect**:
- Language: TypeScript, JavaScript, Python, Go, Rust
- Framework: Next.js, React, Vue, Express, NestJS, Django, Flask, FastAPI
- ORM: Prisma, Drizzle, TypeORM, Mongoose, SQLAlchemy
- Database: PostgreSQL, MySQL, MongoDB, SQLite
- Testing: Vitest, Jest, Playwright, pytest

### Step 2: Discover Business Domains

#### Option A: From Product Specification (Fresh Projects)

If no code exists yet, extract domains from `.claude/product/index.md`:

```javascript
const productSpec = Read('.claude/product/index.md');
const domains = extractDomainsFromProductSpec(productSpec);

// Extract from:
// - Feature headings: "## Authentication System", "### User Management"
// - Explicit domain sections: "# Domains", "## Product Domains"
// - Feature descriptions mentioning domains
// - Tech stack descriptions (auth, users, billing, etc.)

// Example domains found:
// - authentication (from "Authentication System" feature)
// - tasks (from "Task Management" features)
// - users (from "User Profile" features)
// - payments (from "Payment Processing" feature)

console.log(`
Domains extracted from product specification:
${domains.map(d => `- ${d.name} (${d.features.length} features)`).join('\n')}

Since this is a fresh project (no code yet), using product spec
as source of truth for domain generation.
`);
```

**Confidence**: 100% (explicitly defined in product spec)

#### Option B: From Existing Code (Active Projects)

**Scan**: src/**/*, API routes, services, models, components

**Evidence scoring**:
- Directory named after domain: +10 (src/auth/, src/billing/)
- API routes for domain: +15 (api/auth/*, routes/books.ts)
- Service/controller files: +8 (authService.ts, bookController.ts)
- Database models: +5 (User, Book, Order)
- Frontend pages/components: +5 (Books.tsx, AuthorCard.tsx)

**Confidence** = score / 50 * 100 (max 100%)

**Threshold**: Only generate domain agent if confidence >= 75%

#### Hybrid Approach

For projects with both code AND product specs:

1. Extract domains from code (Option B)
2. Extract domains from product spec (Option A)
3. Merge and reconcile:
   - Code domains take precedence (actual implementation)
   - Product spec domains fill gaps (planned but not built)
   - Flag discrepancies (code exists but not in spec, or vice versa)

### Step 3: Research Best Practices

**NEW**: Before generating agents, research best practices for the detected stack + product domains.

```javascript
console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Researching Best Practices
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Analyzing:
  Tech Stack: ${techStack.join(', ')}
  Product Type: ${productType}
  Domains: ${domains.join(', ')}

This takes 30-60 seconds...
`);

// Check if Context7 MCP is available
const hasContext7 = checkMCPAvailable('context7');
const researchMethod = hasContext7 ? 'Context7 MCP' : 'WebSearch';

console.log(`Research method: ${researchMethod}`);

// Research queries
const researchQueries = [
  `${techStack.framework} best practices ${new Date().getFullYear()}`,
  `${techStack.framework} project structure patterns`,
  `${productType} application architecture`,
  ...domains.map(d => `${d} domain implementation patterns`)
];

// Execute research
const findings = [];

for (const query of researchQueries) {
  if (hasContext7) {
    // Use Context7 for more accurate, curated results
    const result = await mcp_context7_search(query);
    findings.push(result);
  } else {
    // Fallback to WebSearch
    const result = await WebSearch({ query });
    findings.push(result);
  }
}

// Synthesize findings
const synthesis = synthesizeResearch(findings, {
  techStack,
  productType,
  domains
});

console.log(`
✅ Research Complete

Key Findings:
${formatFindings(synthesis)}
`);
```

### Step 4: Plan Generation

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

### Step 5: Generate Domain Agents

Create `.claude/agents/<domain>.md` for each domain with confidence >= 75%:

**IMPORTANT**: Use research findings to inform agent generation.

```markdown
---
name: <domain>
description: <Domain> domain - <brief description based on evidence + research>
model: sonnet
tools: Read, Write, Edit, Glob, Grep, Bash
---

# <Domain> Agent

## Your Scope
[List responsibilities based on discovered files AND research findings]

## Domain Structure
[List actual files discovered - services, controllers, routes, components]

## Implementation Guidelines
[Patterns specific to this domain, derived from existing code + research best practices]

**From Research**:
${synthesis.domainPatterns[domain]}

## Best Practices
[Research findings for this domain type]

## Boundaries
- Handles: [what this agent owns]
- Delegates to @backend: [general backend patterns]
- Delegates to @frontend: [general frontend patterns]
- Delegates to @tester: [testing]

## Rules
1. Stay within domain boundaries
2. Follow existing patterns in this domain
3. Apply best practices from research
4. Coordinate with related domains via clear interfaces
```

### Step 6: Generate Tech Skills

Create `.claude/skills/<tech>/SKILL.md` for each detected technology:

**IMPORTANT**: Incorporate research findings for current best practices.

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

## Best Practices (${new Date().getFullYear()})
[Current best practices from research, specific to detected version]

${synthesis.techStackPatterns[tech]}

## Common Pitfalls
[What to avoid - from research + project experience]

## References
- Official docs: [Link]
- Best practices: [Research sources]
```

### Step 7: Create architecture.json

Write to `.agentful/architecture.json`:

**Include research metadata**:

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
  "research": {
    "method": "Context7",
    "performedAt": "2026-01-23T00:00:00Z",
    "queriesExecuted": 6,
    "findingsSynthesized": true
  },
  "analyzedAt": "2026-01-23T00:00:00Z"
}
```

### Step 8: Report Results

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
