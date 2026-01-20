---
name: agentful-skills
description: Discovers missing skills based on tech stack, validates existing skills, and generates new skills using parallel sub-agents
---

# agentful Skills Discovery & Generation

This command intelligently discovers, validates, and generates skills for your project based on tech stack analysis and available knowledge sources.

## Command Modes

The command auto-detects the appropriate mode based on arguments:

1. **No arguments** → Discovery mode (analyze and recommend)
2. **`validate`** → Validation mode (check existing skills)
3. **`generate [skill-name]`** → Generate specific skill
4. **`regenerate [skill-name]`** → Regenerate existing skill with latest knowledge

## Mode 1: DISCOVERY (Default)

When run without arguments, analyzes the project and recommends missing skills.

### Process

```
🔍 Discovering Skills for Your Project

Step 1: Analyzing tech stack...
Step 2: Checking available knowledge sources (MCP)...
Step 3: Identifying missing skills...
Step 4: Validating existing skills...
```

### 1. Tech Stack Detection

Detect tech stack from multiple sources in priority order:

```bash
# Priority 1: Read architecture.json if exists
architecture = Read(".agentful/architecture.json")

# Priority 2: Read package.json for Node.js projects
package_json = Read("package.json")

# Priority 3: Read requirements.txt for Python projects
requirements = Read("requirements.txt")

# Priority 4: Read go.mod for Go projects
go_mod = Read("go.mod")

# Priority 5: Read Cargo.toml for Rust projects
cargo_toml = Read("Cargo.toml")

# Priority 6: Scan common config files
config_files = [
  "tsconfig.json",
  "next.config.js",
  "vite.config.ts",
  "django/settings.py",
  "config/routes.rb",
  "pom.xml",
  "build.gradle"
]
```

**Detection Algorithm:**

```typescript
interface TechStack {
  language: string;           // TypeScript, JavaScript, Python, Go, Rust, Java
  runtime: string | null;     // Node.js, Deno, Bun
  framework: string | null;   // Next.js 15, React 19, Vue 3, Django 5, Rails 7
  version: string | null;     // Framework version if detected
  database: string | null;    // PostgreSQL 16, MySQL 8, MongoDB 7
  orm: string | null;         // Prisma, TypeORM, SQLAlchemy, Eloquent
  platform: string | null;    // AWS, Vercel, Cloudflare, Railway
  testing: string[];          // Jest, Vitest, Pytest, Go test
  dependencies: string[];     // All detected dependencies
}

function detectTechStack(): TechStack {
  let stack: TechStack = {
    language: detectLanguage(),
    runtime: null,
    framework: null,
    version: null,
    database: null,
    orm: null,
    platform: null,
    testing: [],
    dependencies: []
  };

  // Read package.json for Node.js projects
  if (exists("package.json")) {
    const pkg = JSON.parse(Read("package.json"));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    stack.dependencies = Object.keys(deps);

    // Detect framework and version
    if (deps["next"]) {
      const version = deps["next"].replace(/[\^~]/g, "");
      stack.framework = `Next.js ${version.split(".")[0]}`;
      stack.version = version;
    } else if (deps["react"]) {
      const version = deps["react"].replace(/[\^~]/g, "");
      stack.framework = `React ${version.split(".")[0]}`;
      stack.version = version;
    } else if (deps["vue"]) {
      const version = deps["vue"].replace(/[\^~]/g, "");
      stack.framework = `Vue ${version.split(".")[0]}`;
      stack.version = version;
    } else if (deps["express"]) {
      stack.framework = "Express";
    } else if (deps["fastify"]) {
      stack.framework = "Fastify";
    } else if (deps["@nestjs/core"]) {
      stack.framework = "NestJS";
    }

    // Detect database
    if (deps["pg"] || deps["postgres"]) {
      stack.database = "PostgreSQL";
    } else if (deps["mysql"] || deps["mysql2"]) {
      stack.database = "MySQL";
    } else if (deps["mongodb"] || deps["mongoose"]) {
      stack.database = "MongoDB";
    } else if (deps["redis"]) {
      stack.database = "Redis";
    }

    // Detect ORM
    if (deps["prisma"] || deps["@prisma/client"]) {
      stack.orm = "Prisma";
    } else if (deps["typeorm"]) {
      stack.orm = "TypeORM";
    } else if (deps["sequelize"]) {
      stack.orm = "Sequelize";
    } else if (deps["drizzle-orm"]) {
      stack.orm = "Drizzle";
    }

    // Detect platform
    if (exists("vercel.json") || deps["@vercel/node"]) {
      stack.platform = "Vercel";
    } else if (exists("netlify.toml")) {
      stack.platform = "Netlify";
    } else if (exists("fly.toml")) {
      stack.platform = "Fly.io";
    } else if (exists("railway.json")) {
      stack.platform = "Railway";
    }

    // Detect testing
    if (deps["jest"]) stack.testing.push("Jest");
    if (deps["vitest"]) stack.testing.push("Vitest");
    if (deps["@playwright/test"]) stack.testing.push("Playwright");
    if (deps["cypress"]) stack.testing.push("Cypress");
  }

  // Python detection
  if (exists("requirements.txt") || exists("pyproject.toml")) {
    stack.language = "Python";
    const requirements = Read("requirements.txt");

    if (requirements.includes("django")) {
      stack.framework = "Django";
      const match = requirements.match(/django==(\d+\.\d+)/);
      if (match) stack.version = match[1];
    } else if (requirements.includes("flask")) {
      stack.framework = "Flask";
    } else if (requirements.includes("fastapi")) {
      stack.framework = "FastAPI";
    }

    if (requirements.includes("psycopg2")) {
      stack.database = "PostgreSQL";
    } else if (requirements.includes("pymongo")) {
      stack.database = "MongoDB";
    }

    if (requirements.includes("sqlalchemy")) {
      stack.orm = "SQLAlchemy";
    }

    if (requirements.includes("pytest")) {
      stack.testing.push("Pytest");
    }
  }

  // Go detection
  if (exists("go.mod")) {
    stack.language = "Go";
    const goMod = Read("go.mod");

    if (goMod.includes("gin-gonic/gin")) {
      stack.framework = "Gin";
    } else if (goMod.includes("fiber")) {
      stack.framework = "Fiber";
    } else if (goMod.includes("echo")) {
      stack.framework = "Echo";
    }
  }

  return stack;
}
```

### 2. Check MCP Knowledge Sources

Check if MCP servers are available for providing up-to-date knowledge:

```typescript
interface MCPSource {
  name: string;
  available: boolean;
  provides: string[];
}

async function checkMCPSources(): Promise<MCPSource[]> {
  const mcpSources = [];

  // Check for Context7 (documentation search)
  // Context7 provides framework documentation, best practices, etc.
  mcpSources.push({
    name: "context7",
    available: await checkMCPServer("context7"),
    provides: ["framework-docs", "api-reference", "best-practices"]
  });

  // Check for Brave Search (web search for latest info)
  mcpSources.push({
    name: "brave-search",
    available: await checkMCPServer("brave-search"),
    provides: ["latest-versions", "breaking-changes", "migration-guides"]
  });

  // Check for MDN (web standards documentation)
  mcpSources.push({
    name: "mdn",
    available: await checkMCPServer("mdn"),
    provides: ["web-apis", "browser-compatibility", "web-standards"]
  });

  return mcpSources;
}

// MCP availability check
async function checkMCPServer(serverName: string): boolean {
  // In actual implementation, this would check .claude/mcp.json
  // or query the MCP registry
  try {
    const mcpConfig = Read(".claude/mcp.json");
    const config = JSON.parse(mcpConfig);
    return config.servers && config.servers[serverName] !== undefined;
  } catch {
    return false;
  }
}
```

### 3. Identify Missing Skills

Map tech stack to required skills:

```typescript
interface SkillRecommendation {
  name: string;
  category: "framework" | "database" | "platform" | "core";
  reason: string;
  priority: "critical" | "high" | "medium" | "low";
  exists: boolean;
  needsUpdate: boolean;
  knowledgeSources: string[];
}

function identifyMissingSkills(
  stack: TechStack,
  mcpSources: MCPSource[]
): SkillRecommendation[] {
  const recommendations: SkillRecommendation[] = [];
  const existingSkills = Glob(".claude/skills/*/SKILL.md");

  // Framework skills
  if (stack.framework) {
    const skillName = frameworkToSkillName(stack.framework);
    const exists = existingSkills.some(path => path.includes(skillName));

    recommendations.push({
      name: skillName,
      category: "framework",
      reason: `Your project uses ${stack.framework}. This skill provides framework-specific patterns, best practices, and API knowledge.`,
      priority: "high",
      exists,
      needsUpdate: exists && stack.version ? checkVersionMismatch(skillName, stack.version) : false,
      knowledgeSources: mcpSources.filter(s => s.provides.includes("framework-docs")).map(s => s.name)
    });
  }

  // Database skills
  if (stack.database) {
    const skillName = databaseToSkillName(stack.database);
    const exists = existingSkills.some(path => path.includes(skillName));

    recommendations.push({
      name: skillName,
      category: "database",
      reason: `Your project uses ${stack.database}. This skill provides database-specific query patterns, optimization techniques, and migration strategies.`,
      priority: "high",
      exists,
      needsUpdate: false,
      knowledgeSources: mcpSources.filter(s => s.provides.includes("api-reference")).map(s => s.name)
    });
  }

  // ORM skills
  if (stack.orm) {
    const skillName = ormToSkillName(stack.orm);
    const exists = existingSkills.some(path => path.includes(skillName));

    recommendations.push({
      name: skillName,
      category: "database",
      reason: `Your project uses ${stack.orm}. This skill provides ORM-specific patterns, relation handling, and query optimization.`,
      priority: "medium",
      exists,
      needsUpdate: false,
      knowledgeSources: ["context7", "brave-search"]
    });
  }

  // Platform skills
  if (stack.platform) {
    const skillName = platformToSkillName(stack.platform);
    const exists = existingSkills.some(path => path.includes(skillName));

    recommendations.push({
      name: skillName,
      category: "platform",
      reason: `Your project deploys to ${stack.platform}. This skill provides deployment patterns, platform-specific optimizations, and best practices.`,
      priority: "medium",
      exists,
      needsUpdate: false,
      knowledgeSources: ["context7", "brave-search"]
    });
  }

  // Core skills (always recommend if missing)
  const coreSkills = [
    {
      name: "validation",
      reason: "Production readiness validation (TypeScript, linting, tests, coverage, security)",
      priority: "critical"
    },
    {
      name: "product-tracking",
      reason: "Track product completion progress across domains, features, and quality gates",
      priority: "critical"
    }
  ];

  for (const coreSkill of coreSkills) {
    const exists = existingSkills.some(path => path.includes(coreSkill.name));
    if (!exists) {
      recommendations.push({
        name: coreSkill.name,
        category: "core",
        reason: coreSkill.reason,
        priority: coreSkill.priority as any,
        exists: false,
        needsUpdate: false,
        knowledgeSources: []
      });
    }
  }

  return recommendations;
}

// Helper functions
function frameworkToSkillName(framework: string): string {
  return framework.toLowerCase().replace(/\s+/g, "-").replace(/\./g, "-");
}

function databaseToSkillName(database: string): string {
  return database.toLowerCase().replace(/\s+/g, "-") + "-db";
}

function ormToSkillName(orm: string): string {
  return orm.toLowerCase().replace(/\s+/g, "-") + "-orm";
}

function platformToSkillName(platform: string): string {
  return platform.toLowerCase().replace(/\s+/g, "-") + "-platform";
}

function checkVersionMismatch(skillName: string, currentVersion: string): boolean {
  // Read existing skill and check if version is outdated
  const skillPath = `.claude/skills/${skillName}/SKILL.md`;
  if (!exists(skillPath)) return false;

  const skillContent = Read(skillPath);
  const versionMatch = skillContent.match(/version:\s*(\d+\.?\d*)/i);

  if (versionMatch) {
    const skillVersion = parseFloat(versionMatch[1]);
    const stackVersion = parseFloat(currentVersion.split(".")[0]);
    return skillVersion < stackVersion;
  }

  return false;
}
```

### 4. Display Findings

```
📊 Tech Stack Detected

Language:     TypeScript
Runtime:      Node.js
Framework:    Next.js 15
Database:     PostgreSQL 16
ORM:          Prisma
Platform:     Vercel
Testing:      Jest, Playwright

────────────────────────────────────────────────────────

🔌 Knowledge Sources Available

✓ Context7 (framework-docs, api-reference, best-practices)
✓ Brave Search (latest-versions, breaking-changes, migration-guides)
✗ MDN (not configured)

────────────────────────────────────────────────────────

🎯 Skill Recommendations

Missing Skills (3):

  1. nextjs-15 (HIGH PRIORITY) - Framework
     Your project uses Next.js 15. This skill provides framework-specific
     patterns, best practices, and API knowledge.

     Knowledge sources: context7, brave-search

  2. postgresql-16-db (HIGH PRIORITY) - Database
     Your project uses PostgreSQL 16. This skill provides database-specific
     query patterns, optimization techniques, and migration strategies.

     Knowledge sources: context7

  3. prisma-orm (MEDIUM PRIORITY) - Database
     Your project uses Prisma. This skill provides ORM-specific patterns,
     relation handling, and query optimization.

     Knowledge sources: context7, brave-search

Existing Skills (2):

  ✓ validation - Up to date
  ✓ product-tracking - Up to date

────────────────────────────────────────────────────────

Would you like to:
  [1] Generate all missing skills (recommended)
  [2] Generate specific skills only
  [3] Skip for now

Your choice: > _______________________________
```

### 5. User Selection & Generation

**If user selects [1] - Generate all:**

```
🚀 Generating Missing Skills

Using parallel sub-agents for faster generation...

Running 3 skill generators in parallel:
  → nextjs-15 (using context7 + brave-search)
  → postgresql-16-db (using context7)
  → prisma-orm (using context7 + brave-search)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Generator 1] nextjs-15
  ✓ Fetching Next.js 15 documentation from context7...
  ✓ Searching for Next.js 15 best practices (brave-search)...
  ✓ Analyzing App Router patterns...
  ✓ Extracting Server Actions guidelines...
  ✓ Generating SKILL.md...
  ✓ Validating skill structure...
  ✓ Created: .claude/skills/nextjs-15/SKILL.md

[Generator 2] postgresql-16-db
  ✓ Fetching PostgreSQL 16 documentation...
  ✓ Extracting query optimization patterns...
  ✓ Analyzing indexing strategies...
  ✓ Generating SKILL.md...
  ✓ Validating skill structure...
  ✓ Created: .claude/skills/postgresql-16-db/SKILL.md

[Generator 3] prisma-orm
  ✓ Fetching Prisma documentation...
  ✓ Searching for Prisma best practices...
  ✓ Extracting relation patterns...
  ✓ Analyzing transaction handling...
  ✓ Generating SKILL.md...
  ✓ Validating skill structure...
  ✓ Created: .claude/skills/prisma-orm/SKILL.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Successfully generated 3 skills

Running validation checks on generated skills...

  ✓ nextjs-15: Valid structure, comprehensive patterns
  ✓ postgresql-16-db: Valid structure, optimization guide included
  ✓ prisma-orm: Valid structure, relation patterns included

────────────────────────────────────────────────────────

Skills ready to use. Your agents now have access to:
  - Next.js 15 App Router patterns and best practices
  - PostgreSQL 16 query optimization and indexing
  - Prisma ORM relation handling and transactions

Run /agentful-start to begin development with enhanced knowledge.
```

**If user selects [2] - Generate specific:**

```
Which skills would you like to generate?

  [1] nextjs-15 (HIGH PRIORITY)
  [2] postgresql-16-db (HIGH PRIORITY)
  [3] prisma-orm (MEDIUM PRIORITY)
  [A] All of the above

Enter numbers separated by commas (e.g., 1,2): > _______________________________
```

## Mode 2: VALIDATION

When run with `validate` argument: `/agentful-skills validate`

### Process

```
🔍 Validating Existing Skills

Checking .claude/skills directory...

Found 3 skills:
  - validation
  - product-tracking
  - nextjs-15

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1/3] Validating: validation

  Structure:
    ✓ SKILL.md exists
    ✓ Valid frontmatter (name, description, model, tools)
    ✓ Content sections present

  Completeness:
    ✓ Description clear
    ✓ Examples provided
    ✓ Tool usage documented

  Tech Stack Alignment:
    ✓ Applicable to TypeScript projects
    ✓ Uses Jest (detected in package.json)

  Status: ✓ VALID

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[2/3] Validating: product-tracking

  Structure:
    ✓ SKILL.md exists
    ✓ Valid frontmatter
    ✓ Content sections present

  Completeness:
    ✓ Description clear
    ✓ Hierarchical structure documented
    ✓ Examples provided

  Tech Stack Alignment:
    ✓ Framework-agnostic
    ✓ Applicable to all projects

  Status: ✓ VALID

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[3/3] Validating: nextjs-15

  Structure:
    ✓ SKILL.md exists
    ✓ Valid frontmatter
    ✓ Content sections present

  Completeness:
    ⚠ Missing: Error handling patterns
    ✓ App Router patterns documented
    ✓ Server Actions included

  Tech Stack Alignment:
    ✓ Matches detected framework (Next.js 15)
    ! Version note: Skill is for Next.js 15.0, project uses 15.1
      Consider regenerating with latest docs

  Status: ⚠ NEEDS UPDATE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Summary:

  ✓ Valid: 2 skills
  ⚠ Needs update: 1 skill (nextjs-15)
  ✗ Invalid: 0 skills

Would you like to:
  [1] Regenerate nextjs-15 with latest documentation
  [2] View detailed validation report
  [3] Exit

Your choice: > _______________________________
```

### Validation Checks

```typescript
interface SkillValidation {
  skill_name: string;
  structure: {
    has_skill_md: boolean;
    valid_frontmatter: boolean;
    has_content: boolean;
  };
  completeness: {
    has_description: boolean;
    has_examples: boolean;
    has_tool_usage: boolean;
    missing_sections: string[];
  };
  tech_stack_alignment: {
    is_relevant: boolean;
    version_matches: boolean;
    version_note?: string;
  };
  status: "valid" | "needs_update" | "invalid";
  issues: string[];
}

function validateSkill(skillPath: string, techStack: TechStack): SkillValidation {
  const skillContent = Read(skillPath);
  const skillName = extractSkillName(skillPath);

  // Parse frontmatter
  const frontmatterMatch = skillContent.match(/^---\n([\s\S]*?)\n---/);
  const hasFrontmatter = frontmatterMatch !== null;

  let frontmatter = {};
  if (hasFrontmatter) {
    frontmatter = parseFrontmatter(frontmatterMatch[1]);
  }

  // Check structure
  const structure = {
    has_skill_md: true,
    valid_frontmatter: hasFrontmatter &&
                       frontmatter.name &&
                       frontmatter.description &&
                       frontmatter.model &&
                       frontmatter.tools,
    has_content: skillContent.length > 500
  };

  // Check completeness
  const missingSections = [];
  if (!skillContent.includes("## ")) {
    missingSections.push("Section headers");
  }
  if (!skillContent.includes("```")) {
    missingSections.push("Code examples");
  }
  if (!skillContent.includes("Read(") && !skillContent.includes("Write(")) {
    missingSections.push("Tool usage examples");
  }

  const completeness = {
    has_description: frontmatter.description?.length > 20,
    has_examples: skillContent.includes("```"),
    has_tool_usage: skillContent.includes("Read(") || skillContent.includes("Write("),
    missing_sections: missingSections
  };

  // Check tech stack alignment
  const isRelevant = checkSkillRelevance(skillName, techStack);
  const versionMatch = checkVersionAlignment(skillName, skillContent, techStack);

  const tech_stack_alignment = {
    is_relevant: isRelevant,
    version_matches: versionMatch.matches,
    version_note: versionMatch.note
  };

  // Determine status
  const issues = [];
  let status: "valid" | "needs_update" | "invalid" = "valid";

  if (!structure.valid_frontmatter || !structure.has_content) {
    status = "invalid";
    issues.push("Invalid structure");
  } else if (missingSections.length > 0) {
    status = "needs_update";
    issues.push(`Missing: ${missingSections.join(", ")}`);
  } else if (!versionMatch.matches) {
    status = "needs_update";
    issues.push(versionMatch.note || "Version mismatch");
  }

  return {
    skill_name: skillName,
    structure,
    completeness,
    tech_stack_alignment,
    status,
    issues
  };
}
```

## Mode 3: GENERATE

When run with `generate [skill-name]`: `/agentful-skills generate nextjs-15`

### Process

Delegate to skill generator sub-agent using Task tool:

```typescript
async function generateSkill(
  skillName: string,
  techStack: TechStack,
  mcpSources: MCPSource[]
): Promise<void> {
  // Determine knowledge sources
  const knowledgeSources = determineKnowledgeSources(skillName, mcpSources);

  // Delegate to skill-generator sub-agent
  const result = await Task("skill-generator", {
    skill_name: skillName,
    tech_stack: techStack,
    knowledge_sources: knowledgeSources,
    output_path: `.claude/skills/${skillName}/SKILL.md`
  });

  // Validate generated skill
  const validation = validateSkill(`.claude/skills/${skillName}/SKILL.md`, techStack);

  if (validation.status === "invalid") {
    console.log(`✗ Skill generation failed validation. Retrying with more context...`);
    // Retry with additional context
    await Task("skill-generator", {
      skill_name: skillName,
      tech_stack: techStack,
      knowledge_sources: knowledgeSources,
      output_path: `.claude/skills/${skillName}/SKILL.md`,
      validation_feedback: validation.issues,
      retry: true
    });
  }

  console.log(`✓ Successfully generated: .claude/skills/${skillName}/SKILL.md`);
}
```

### Skill Generator Sub-Agent Instructions

The skill-generator sub-agent receives:

```json
{
  "skill_name": "nextjs-15",
  "tech_stack": {
    "framework": "Next.js 15",
    "version": "15.1.0"
  },
  "knowledge_sources": ["context7", "brave-search"],
  "output_path": ".claude/skills/nextjs-15/SKILL.md",
  "validation_feedback": null,
  "retry": false
}
```

**Generator Process:**

1. **Fetch Knowledge** (if MCP sources available):
   ```typescript
   if (knowledge_sources.includes("context7")) {
     // Use context7 MCP to fetch official Next.js 15 docs
     const docs = await mcp.query("context7", {
       query: "Next.js 15 App Router best practices",
       source: "official-docs"
     });
   }

   if (knowledge_sources.includes("brave-search")) {
     // Use brave-search to find latest blog posts, migration guides
     const webResults = await mcp.query("brave-search", {
       query: "Next.js 15 migration guide best practices 2024"
     });
   }
   ```

2. **Extract Patterns**:
   - Common patterns for the framework/library
   - Best practices from official docs
   - Common pitfalls to avoid
   - Migration strategies (if applicable)
   - Performance optimizations
   - Testing approaches

3. **Generate SKILL.md**:
   ```markdown
   ---
   name: nextjs-15
   description: Next.js 15 App Router patterns, Server Actions, caching, and deployment best practices
   model: sonnet
   tools: Read, Write, Edit, Glob, Grep, Bash
   version: 15.1
   ---

   # Next.js 15 Skill

   This skill provides Next.js 15-specific patterns and best practices.

   ## App Router Patterns

   ### Server Components (Default)

   ```typescript
   // app/dashboard/page.tsx
   export default async function DashboardPage() {
     // Fetch data directly in Server Component
     const data = await fetchData();

     return <Dashboard data={data} />;
   }
   ```

   **Best Practices:**
   - Server Components are async by default
   - No useState, useEffect, or browser APIs
   - Can directly access backend resources

   ### Client Components

   ```typescript
   'use client'

   import { useState } from 'react'

   export function Counter() {
     const [count, setCount] = useState(0)
     return <button onClick={() => setCount(count + 1)}>{count}</button>
   }
   ```

   **When to use:**
   - Need interactivity (onClick, onChange)
   - Need browser APIs (localStorage, navigator)
   - Need React hooks (useState, useEffect)

   ## Server Actions

   [... extensive patterns and examples ...]

   ## Caching Strategies

   [... cache patterns ...]

   ## Common Pitfalls

   [... mistakes to avoid ...]

   ## Performance Optimizations

   [... optimization techniques ...]
   ```

4. **Write to file**:
   ```typescript
   Write(output_path, skillContent);
   ```

5. **Return success/failure**

### Parallel Generation

When generating multiple skills, use parallel Task calls:

```typescript
async function generateMultipleSkills(
  skillNames: string[],
  techStack: TechStack,
  mcpSources: MCPSource[]
): Promise<void> {
  console.log(`🚀 Generating ${skillNames.length} skills in parallel...`);

  // Create parallel tasks
  const tasks = skillNames.map(skillName =>
    Task("skill-generator", {
      skill_name: skillName,
      tech_stack: techStack,
      knowledge_sources: determineKnowledgeSources(skillName, mcpSources),
      output_path: `.claude/skills/${skillName}/SKILL.md`
    })
  );

  // Wait for all to complete
  await Promise.all(tasks);

  console.log(`✅ Successfully generated ${skillNames.length} skills`);

  // Validate all generated skills
  for (const skillName of skillNames) {
    const validation = validateSkill(
      `.claude/skills/${skillName}/SKILL.md`,
      techStack
    );
    console.log(`  ${validation.status === "valid" ? "✓" : "✗"} ${skillName}: ${validation.status}`);
  }
}
```

## Mode 4: REGENERATE

When run with `regenerate [skill-name]`: `/agentful-skills regenerate nextjs-15`

Same as generate but:
1. Backs up existing skill to `.claude/skills/nextjs-15/SKILL.md.backup`
2. Regenerates with latest knowledge sources
3. Preserves any custom additions (if possible)

```typescript
async function regenerateSkill(skillName: string): Promise<void> {
  const skillPath = `.claude/skills/${skillName}/SKILL.md`;
  const backupPath = `${skillPath}.backup`;

  // Backup existing
  const existing = Read(skillPath);
  Write(backupPath, existing);

  console.log(`Backed up existing skill to: ${backupPath}`);

  // Regenerate
  await generateSkill(skillName, detectTechStack(), await checkMCPSources());

  console.log(`✓ Regenerated: ${skillPath}`);
  console.log(`Original preserved at: ${backupPath}`);
}
```

## Knowledge Source Priority

When generating skills:

1. **MCP Sources** (if available):
   - context7 → Official documentation
   - brave-search → Latest blog posts, migration guides
   - mdn → Web standards and APIs

2. **Built-in Knowledge** (fallback):
   - Claude's training data
   - Common patterns library
   - Best practices database

3. **Web Search** (if MCP unavailable):
   - Use web search to find latest information
   - Focus on official docs and trusted sources

## Skill Template Structure

All generated skills follow this structure:

```markdown
---
name: [skill-name]
description: [Brief description of what this skill provides]
model: sonnet
tools: Read, Write, Edit, Glob, Grep, Bash
version: [version if applicable]
---

# [Skill Name] Skill

[Overview paragraph]

## Core Concepts

[Fundamental concepts for this tech]

## Common Patterns

### Pattern 1: [Name]

[Description]

```[language]
[Code example]
```

**Best Practices:**
- [Guideline 1]
- [Guideline 2]

**Common Pitfalls:**
- [Mistake to avoid 1]
- [Mistake to avoid 2]

### Pattern 2: [Name]

[... repeat ...]

## Advanced Techniques

[... advanced patterns ...]

## Performance Optimization

[... optimization strategies ...]

## Testing Strategies

[... testing approaches ...]

## Migration Guide

[... migration from previous version if applicable ...]

## Integration with Other Tools

[... how this integrates with other parts of the stack ...]

## Troubleshooting

Common issues and solutions:

### Issue 1: [Problem]
**Symptoms:** [What user sees]
**Cause:** [Why it happens]
**Solution:** [How to fix]

## References

- [Official documentation link]
- [Best practices guide]
- [Community resources]
```

## File Locations

```
.claude/skills/
├── [skill-name]/
│   ├── SKILL.md               # Main skill file
│   └── SKILL.md.backup        # Backup (if regenerated)
```

## Example Flows

### Flow 1: New Project Discovery

```
User: /agentful-skills

Command: [Detects tech stack from package.json]
         [Checks MCP sources - context7 available]
         [Identifies 3 missing skills]
         [Shows recommendations]

User: [Selects "1" - Generate all]

Command: [Generates 3 skills in parallel using context7]
         [Validates generated skills]
         [Reports success]
```

### Flow 2: Validate Existing Skills

```
User: /agentful-skills validate

Command: [Finds 3 existing skills]
         [Validates each one]
         [Detects nextjs-15 is outdated]
         [Suggests regeneration]

User: [Selects "1" - Regenerate]

Command: [Backs up existing skill]
         [Regenerates with latest docs]
         [Validates new skill]
```

### Flow 3: Generate Specific Skill

```
User: /agentful-skills generate postgresql-16-db

Command: [Detects PostgreSQL 16 in dependencies]
         [Checks knowledge sources]
         [Generates skill using context7]
         [Validates structure]
         [Reports success]
```

## Integration with Other Commands

- **`/agentful-start`**: Uses generated skills to enhance agent knowledge
- **`/agentful-validate`**: Uses validation skill
- **`/agentful-product`**: Uses product-tracking skill

## Best Practices

1. **Always run discovery** after updating dependencies
2. **Regenerate skills** when framework versions change
3. **Validate regularly** to ensure skills are up to date
4. **Use MCP sources** when available for latest information
5. **Review generated skills** before first use
6. **Backup before regenerating** (done automatically)

## Error Handling

### MCP Source Unavailable

```
⚠️  MCP source 'context7' not available

Falling back to:
  - Built-in knowledge (may be outdated)
  - Web search (if available)

For best results, configure MCP sources in .claude/mcp.json

Learn more: https://docs.agentful.dev/mcp-setup
```

### Skill Generation Failed

```
✗ Failed to generate skill: nextjs-15

Error: Insufficient knowledge sources

Suggestions:
  1. Configure MCP sources for latest documentation
  2. Provide custom skill template
  3. Manually create skill at .claude/skills/nextjs-15/SKILL.md

Would you like to:
  [1] Configure MCP sources
  [2] Use fallback generation (may be incomplete)
  [3] Skip this skill

Your choice: > _______________________________
```

## Success Criteria

This command is successful when:

1. **Discovery**: Accurately detects tech stack and identifies missing skills
2. **Validation**: Correctly identifies outdated or invalid skills
3. **Generation**: Creates comprehensive, well-structured skills
4. **Parallelization**: Generates multiple skills efficiently
5. **Knowledge Integration**: Uses MCP sources when available
6. **Error Handling**: Gracefully handles missing knowledge sources
