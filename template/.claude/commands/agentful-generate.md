---
name: agentful-generate
description: Analyze codebase and generate domain agents + tech skills based on your stack
---

# /agentful-generate

Analyze codebase, detect tech stack, discover business domains, generate domain agents and tech skills.

## Relationship to /agentful-analyze

**Important**: This command has overlapping functionality with `/agentful-analyze`. Here's the distinction:

- **`/agentful-analyze`** (RECOMMENDED): Comprehensive analysis command that:
  - Detects tech stack
  - Generates specialized agents (backend, frontend, domain agents)
  - Creates tech skills
  - Analyzes product requirements
  - Is the primary command for project setup

- **`/agentful-generate`** (LEGACY/SPECIALIZED): Domain-focused generation that:
  - Only generates domain agents and tech skills
  - Doesn't handle product analysis
  - Narrower scope than analyze

**Recommendation**: Use `/agentful-analyze` for most cases. This command may be merged into analyze in a future version.

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

### Step 6: Validate Generated Agents

After creating agents, validate they are properly formatted:

```javascript
function validate_generated_agent(agentPath) {
  try {
    const content = Read(agentPath);

    // Check for frontmatter
    if (!content.startsWith('---')) {
      return { valid: false, error: "Missing frontmatter" };
    }

    // Check for required frontmatter fields
    const requiredFields = ['name', 'description'];
    for (const field of requiredFields) {
      if (!content.includes(`${field}:`)) {
        return { valid: false, error: `Missing required field: ${field}` };
      }
    }

    // Check for basic sections
    const requiredSections = ['## Your Scope', '## Domain Structure'];
    for (const section of requiredSections) {
      if (!content.includes(section)) {
        return { valid: false, error: `Missing section: ${section}` };
      }
    }

    return { valid: true };

  } catch (error) {
    return { valid: false, error: error.message };
  }
}

// Validate each generated agent
const validationResults = [];

for (const agentName of generatedAgents) {
  const agentPath = `.claude/agents/${agentName}.md`;
  const validation = validate_generated_agent(agentPath);

  if (!validation.valid) {
    validationResults.push({
      agent: agentName,
      path: agentPath,
      valid: false,
      error: validation.error
    });
  } else {
    validationResults.push({
      agent: agentName,
      path: agentPath,
      valid: true
    });
  }
}

// Check for failures
const failed = validationResults.filter(r => !r.valid);

if (failed.length > 0) {
  console.error(`
⚠️  Some generated agents have issues:

${failed.map(f => `  - ${f.agent}: ${f.error}`).join('\n')}

Rolling back generation...
`);
  rollback_generation(generatedAgents, generatedSkills);
  throw new Error("Agent generation failed validation");
}
```

### Step 7: Rollback Mechanism

If generation fails halfway, clean up:

```javascript
function rollback_generation(agentsToRemove, skillsToRemove) {
  console.log("\n🔄 Rolling back partial generation...\n");

  // Remove generated agents
  for (const agentName of agentsToRemove) {
    const agentPath = `.claude/agents/${agentName}.md`;
    if (exists(agentPath)) {
      Bash(`rm "${agentPath}"`);
      console.log(`  Removed: ${agentPath}`);
    }
  }

  // Remove generated skills
  for (const skillName of skillsToRemove) {
    const skillPath = `.claude/skills/${skillName}/SKILL.md`;
    if (exists(skillPath)) {
      Bash(`rm -rf ".claude/skills/${skillName}"`);
      console.log(`  Removed: .claude/skills/${skillName}/`);
    }
  }

  // Remove architecture.json if it was created
  if (exists('.agentful/architecture.json')) {
    Bash('rm .agentful/architecture.json');
    console.log(`  Removed: .agentful/architecture.json`);
  }

  console.log("\n✅ Rollback complete. No partial state left.\n");
}
```

### Step 8: Create Standardized architecture.json

Use consistent schema:

```javascript
// Standard schema for architecture.json
const architectureSchema = {
  version: "1.0", // Schema version for future compatibility
  techStack: {
    languages: ["TypeScript"],
    frontend: {
      framework: "React",
      version: "18.x",
      buildTool: "Vite"
    },
    backend: {
      framework: "Express",
      version: "4.x",
      runtime: "Node.js"
    },
    database: {
      type: "SQLite",
      orm: "Prisma",
      version: "5.x"
    },
    testing: {
      frameworks: ["Vitest", "Jest"],
      coverage: true
    }
  },
  domains: [
    { name: "books", confidence: 95, files: 12 },
    { name: "authors", confidence: 95, files: 8 }
  ],
  generatedAgents: ["books", "authors"],
  generatedSkills: ["react", "express", "prisma", "typescript"],
  analyzedAt: "2026-01-20T00:00:00Z",
  detectionMethod: "codebase-analysis"
};

Write('.agentful/architecture.json', JSON.stringify(architectureSchema, null, 2));
```

### Step 9: Report Results

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
