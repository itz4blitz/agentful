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

| Priority | Source | Detects |
|----------|--------|---------|
| 1 | `.agentful/architecture.json` | Complete tech stack from previous analysis |
| 2 | `package.json` | Node.js dependencies and frameworks |
| 3 | `requirements.txt` / `pyproject.toml` | Python packages |
| 4 | `go.mod` | Go modules |
| 5 | `Cargo.toml` | Rust crates |
| 6 | Config files | Framework-specific configs |

**Detection Algorithm:**

```typescript
interface TechStack {
  language: string;           // TypeScript, Python, Go, Rust, Java
  framework: string | null;   // Next.js 15, Django 5, etc.
  database: string | null;    // PostgreSQL, MySQL, MongoDB
  orm: string | null;         // Prisma, TypeORM, SQLAlchemy
  testing: string[];          // Jest, Pytest, etc.
}

function detectTechStack(): TechStack {
  // Priority 1: Read architecture.json if exists
  if (exists(".agentful/architecture.json")) {
    return parseArchitecture();
  }

  // Priority 2-5: Parse dependency files
  if (exists("package.json")) {
    return detectNodeStack();
  } else if (exists("requirements.txt")) {
    return detectPythonStack();
  } else if (exists("go.mod")) {
    return detectGoStack();
  }

  return defaultStack();
}
```

### 2. Check MCP Knowledge Sources

Check if MCP servers are available for providing up-to-date knowledge:

| MCP Server | Provides |
|------------|----------|
| context7 | Framework docs, API reference, best practices |
| brave-search | Latest versions, breaking changes, migration guides |
| mdn | Web APIs, browser compatibility, web standards |

```typescript
async function checkMCPSources(): Promise<MCPSource[]> {
  const mcpSources = [];

  // Check MCP config
  try {
    const mcpConfig = Read(".claude/mcp.json");
    const config = JSON.parse(mcpConfig);

    if (config.servers?.context7) {
      mcpSources.push({
        name: "context7",
        available: true,
        provides: ["framework-docs", "api-reference"]
      });
    }
    // Check other servers...
  } catch {
    return []; // No MCP configured
  }

  return mcpSources;
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
  knowledgeSources: string[];
}

function identifyMissingSkills(stack: TechStack): SkillRecommendation[] {
  const recommendations = [];
  const existingSkills = Glob(".claude/skills/*/SKILL.md");

  // Framework skills
  if (stack.framework) {
    const skillName = frameworkToSkillName(stack.framework);
    recommendations.push({
      name: skillName,
      category: "framework",
      reason: `Your project uses ${stack.framework}`,
      priority: "high",
      exists: existingSkills.includes(skillName)
    });
  }

  // Database skills
  if (stack.database) {
    recommendations.push({
      name: `${stack.database.toLowerCase()}-db`,
      category: "database",
      reason: `Your project uses ${stack.database}`,
      priority: "high",
      exists: existingSkills.includes(`${stack.database}-db`)
    });
  }

  // Core skills (always recommend if missing)
  const coreSkills = [
    { name: "validation", reason: "Production readiness validation" },
    { name: "product-tracking", reason: "Track product completion progress" }
  ];

  for (const core of coreSkills) {
    if (!existingSkills.includes(core.name)) {
      recommendations.push({
        name: core.name,
        category: "core",
        reason: core.reason,
        priority: "critical"
      });
    }
  }

  return recommendations;
}
```

### 4. Display Findings

```
📊 Tech Stack Detected

Language:     TypeScript
Framework:    Next.js 15
Database:     PostgreSQL
ORM:          Prisma
Testing:      Jest, Playwright

────────────────────────────────────────────────────────

🔌 Knowledge Sources Available

✓ Context7 (framework-docs, best-practices)
✓ Brave Search (latest-versions, migration-guides)
✗ MDN (not configured)

────────────────────────────────────────────────────────

🎯 Skill Recommendations

Missing Skills (3):

  1. nextjs-15 (HIGH PRIORITY) - Framework
     Your project uses Next.js 15. This skill provides
     framework-specific patterns and best practices.

  2. postgresql-db (HIGH PRIORITY) - Database
     Your project uses PostgreSQL. This skill provides
     query patterns and optimization techniques.

  3. prisma-orm (MEDIUM PRIORITY) - Database
     Your project uses Prisma. This skill provides
     ORM-specific patterns and relation handling.

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
  → nextjs-15 (using context7)
  → postgresql-db (using context7)
  → prisma-orm (using context7)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Generator 1] nextjs-15
  ✓ Fetching Next.js 15 documentation...
  ✓ Generating SKILL.md...
  ✓ Created: .claude/skills/nextjs-15/SKILL.md

[Generator 2] postgresql-db
  ✓ Fetching PostgreSQL documentation...
  ✓ Created: .claude/skills/postgresql-db/SKILL.md

[Generator 3] prisma-orm
  ✓ Fetching Prisma documentation...
  ✓ Created: .claude/skills/prisma-orm/SKILL.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Successfully generated 3 skills

Skills ready to use. Run /agentful-start to begin development.
```

## Mode 2: VALIDATION

When run with `validate` argument: `/agentful-skills validate`

### Process

```
🔍 Validating Existing Skills

Found 3 skills: validation, product-tracking, nextjs-15

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1/3] Validating: validation
  ✓ SKILL.md exists
  ✓ Valid frontmatter
  ✓ Content sections present
  Status: ✓ VALID

[2/3] Validating: nextjs-15
  ✓ Structure valid
  ⚠ Version mismatch (Skill: 15.0, Project: 15.1)
  Status: ⚠ NEEDS UPDATE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Summary:
  ✓ Valid: 2 skills
  ⚠ Needs update: 1 skill

Would you like to:
  [1] Regenerate nextjs-15 with latest documentation
  [2] Exit

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
    missing_sections: string[];
  };
  status: "valid" | "needs_update" | "invalid";
}

function validateSkill(skillPath: string, techStack: TechStack): SkillValidation {
  const skillContent = Read(skillPath);

  // Check structure
  const hasFrontmatter = skillContent.match(/^---\n([\s\S]*?)\n---/);
  const hasContent = skillContent.length > 500;
  const hasExamples = skillContent.includes("```");

  // Check version alignment
  const versionMatch = checkVersionAlignment(skillContent, techStack);

  return {
    skill_name: extractSkillName(skillPath),
    structure: {
      has_skill_md: true,
      valid_frontmatter: !!hasFrontmatter,
      has_content: hasContent
    },
    completeness: {
      has_description: hasFrontmatter?.description?.length > 20,
      has_examples: hasExamples,
      missing_sections: []
    },
    status: versionMatch ? "valid" : "needs_update"
  };
}
```

## Mode 3: GENERATE

When run with `generate [skill-name]`: `/agentful-skills generate nextjs-15`

### Process

Delegate to skill generator sub-agent using Task tool:

```typescript
async function generateSkill(skillName: string): Promise<void> {
  const techStack = detectTechStack();
  const mcpSources = await checkMCPSources();

  // Delegate to skill-generator sub-agent
  await Task("skill-generator", {
    skill_name: skillName,
    tech_stack: techStack,
    knowledge_sources: mcpSources,
    output_path: `.claude/skills/${skillName}/SKILL.md`
  });

  console.log(`✓ Successfully generated: .claude/skills/${skillName}/SKILL.md`);
}
```

### Skill Generator Sub-Agent Instructions

**Generator Process:**

1. **Fetch Knowledge** (if MCP sources available):
   - Use context7 to fetch official documentation
   - Use brave-search for latest guides and best practices

2. **Extract Patterns**:
   - Common patterns for the framework/library
   - Best practices from official docs
   - Common pitfalls to avoid
   - Performance optimizations

3. **Generate SKILL.md** following template:

```markdown
---
name: nextjs-15
description: Next.js 15 App Router patterns, Server Actions, and best practices
model: sonnet
tools: Read, Write, Edit, Glob, Grep, Bash
version: 15.1
---

# Next.js 15 Skill

## App Router Patterns

### Server Components (Default)

```typescript
// Async Server Component
export default async function Page() {
  const data = await fetchData();
  return <Dashboard data={data} />;
}
```

**Best Practices:**
- Server Components are async by default
- Can directly access backend resources
- No useState or browser APIs

### Client Components

```typescript
'use client'

export function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

## Server Actions

[Patterns and examples...]

## Caching Strategies

[Cache patterns...]

## Common Pitfalls

[Mistakes to avoid...]
```

4. **Write to file**: `Write(output_path, skillContent)`

### Parallel Generation

When generating multiple skills:

```typescript
async function generateMultipleSkills(skillNames: string[]): Promise<void> {
  // Create parallel tasks
  const tasks = skillNames.map(skillName =>
    Task("skill-generator", {
      skill_name: skillName,
      output_path: `.claude/skills/${skillName}/SKILL.md`
    })
  );

  // Wait for all to complete
  await Promise.all(tasks);
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

  // Regenerate
  await generateSkill(skillName);

  console.log(`✓ Regenerated: ${skillPath}`);
  console.log(`Original preserved at: ${backupPath}`);
}
```

## Knowledge Source Priority

When generating skills:

1. **MCP Sources** (if available):
   - context7 → Official documentation
   - brave-search → Latest guides and best practices

2. **Built-in Knowledge** (fallback):
   - Claude's training data
   - Common patterns library

## Skill Template Structure

All generated skills follow this structure:

```markdown
---
name: [skill-name]
description: [Brief description]
model: sonnet
tools: Read, Write, Edit, Glob, Grep, Bash
version: [version if applicable]
---

# [Skill Name] Skill

[Overview paragraph]

## Core Concepts
[Fundamental concepts]

## Common Patterns
[Pattern examples with code]

## Advanced Techniques
[Advanced patterns]

## Performance Optimization
[Optimization strategies]

## Testing Strategies
[Testing approaches]

## Common Pitfalls
[Mistakes to avoid]

## References
- [Official documentation link]
- [Best practices guide]
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

Command: → Detects tech stack
         → Checks MCP sources
         → Identifies 3 missing skills
         → Shows recommendations

User: [Selects "1" - Generate all]

Command: → Generates 3 skills in parallel
         → Validates generated skills
         → Reports success
```

### Flow 2: Validate Existing Skills

```
User: /agentful-skills validate

Command: → Finds 3 existing skills
         → Validates each one
         → Detects outdated skill
         → Suggests regeneration

User: [Selects "1" - Regenerate]

Command: → Backs up existing skill
         → Regenerates with latest docs
```

### Flow 3: Generate Specific Skill

```
User: /agentful-skills generate postgresql-db

Command: → Detects PostgreSQL in dependencies
         → Generates skill using context7
         → Reports success
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

## Error Handling

### MCP Source Unavailable

```
⚠️  MCP source 'context7' not available

Falling back to built-in knowledge (may be outdated)

For best results, configure MCP sources in .claude/mcp.json
```

### Skill Generation Failed

```
✗ Failed to generate skill: nextjs-15

Would you like to:
  [1] Configure MCP sources
  [2] Use fallback generation
  [3] Skip this skill
```

## Success Criteria

This command is successful when:

1. **Discovery**: Accurately detects tech stack and identifies missing skills
2. **Validation**: Correctly identifies outdated or invalid skills
3. **Generation**: Creates comprehensive, well-structured skills
4. **Parallelization**: Generates multiple skills efficiently
5. **Knowledge Integration**: Uses MCP sources when available
