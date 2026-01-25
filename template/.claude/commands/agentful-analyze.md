---
name: agentful-analyze
description: Unified analysis of agentful setup - detects gaps, validates configuration, identifies stale settings, and suggests/applies fixes
---

# agentful Analyze

Unified analysis command that detects gaps in skills, agents, and configuration. Can be triggered manually or via hooks.

## Command Syntax

```bash
/agentful-analyze           # Quick health check (default)
/agentful-analyze full      # Comprehensive analysis
/agentful-analyze fix       # Analyze and auto-fix issues
```

## Modes

### Mode 1: QUICK (Default)

Fast health check (under 10 seconds). No deep codebase scanning.

#### State File Validation

Use centralized state validator for all core state files:

```javascript
import { validateAllState, getStateFile, formatValidationResults } from './lib/state-validator.js';

// Validate all state files without auto-recovery (diagnostic mode)
const validationResults = validateAllState(process.cwd(), {
  autoRecover: false,     // Don't auto-fix, just report issues
  skipOptional: false,    // Check optional files too
  verbose: true           // Show detailed results
});

// Extract validation issues for reporting
const issues = [];

if (!validationResults.valid) {
  for (const [fileName, result] of Object.entries(validationResults.files)) {
    if (!result.valid) {
      if (result.action === 'initialize') {
        issues.push({
          type: 'warning',
          msg: `Missing state file: ${fileName}`,
          fix: `initialize_state:${fileName}`
        });
      } else if (result.action === 'backup_and_reset') {
        issues.push({
          type: 'error',
          msg: `Corrupted state file: ${fileName}`,
          fix: `reset_state:${fileName}`
        });
      } else if (result.action === 'add_field') {
        issues.push({
          type: 'warning',
          msg: `Incomplete state file: ${fileName} (missing: ${result.missing_field})`,
          fix: `repair_state:${fileName}`
        });
      }
    }
  }
}
```

**What it checks:**

1. **Core Setup**
   - `.agentful/architecture.json` exists and is valid JSON
   - Core agents exist (backend, frontend, tester, reviewer, fixer, orchestrator)
   - Skills directory structure is valid
   - State files are valid JSON (state.json, completion.json, etc.)

2. **Tech Stack Alignment**
   - Read `package.json` or equivalent dependency file
   - Check if detected frameworks have corresponding skills
   - Identify major mismatches (e.g., using Next.js 15 but skill is for v14)

3. **State Files**
   - Check state files exist and are valid JSON
   - Verify no corrupted state

**Process:**

```typescript
// 1. Check architecture.json using centralized validator
const archResult = getStateFile(process.cwd(), 'architecture.json', { autoRecover: false });

if (!archResult.valid) {
  issues.push({
    type: "critical",
    msg: "Missing or invalid architecture.json - run /agentful-generate",
    fix: "reset_architecture"
  });
} else {
  const arch = archResult.data;
  if (!arch.techStack || !arch.techStack.languages || arch.techStack.languages.length === 0) {
    issues.push({ type: "warning", msg: "Incomplete architecture analysis - no languages detected" });
  }
}

// 2. Check core agents
const coreAgents = ["backend", "frontend", "tester", "reviewer", "fixer", "orchestrator", "architect", "product-analyzer"];
const existingAgents = Glob(".claude/agents/*.md").map(extractName);
const missingAgents = coreAgents.filter(a => !existingAgents.includes(a));
if (missingAgents.length > 0) {
  issues.push({ type: "critical", msg: `Missing core agents: ${missingAgents.join(", ")}` });
}

// 3. Check tech stack alignment
const deps = detectDependencies();
const skills = Glob(".claude/skills/*/SKILL.md").map(extractSkillName);

for (const dep of deps) {
  const expectedSkill = frameworkToSkill(dep.name);
  if (!skills.includes(expectedSkill)) {
    issues.push({
      type: "warning",
      msg: `Framework ${dep.name} detected but no skill found`,
      fix: `generate_skill:${expectedSkill}`
    });
  } else {
    // Check version alignment
    const skillVersion = extractSkillVersion(expectedSkill);
    if (skillVersion && dep.version && skillVersion < dep.version.split('.')[0]) {
      issues.push({
        type: "warning",
        msg: `Skill ${expectedSkill} is outdated (v${skillVersion} vs v${dep.version})`,
        fix: `regenerate_skill:${expectedSkill}`
      });
    }
  }
}

// 4. State file validation already done above - issues already populated
```

**Output Format:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       agentful Health Check (Quick)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Status: ⚠️  WARNINGS

Core Setup:
  ✓ architecture.json valid
  ✓ All core agents present (8/8)
  ✓ State files intact

Tech Stack Alignment:
  Detected: Next.js 15.1, PostgreSQL, Prisma 5
  Skills:
    ⚠️  nextjs (outdated v14, current v15)
    ✗  postgresql (missing)
    ✓ prisma (ok)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Issues Found (2):

  1. Skill 'nextjs' is outdated (v14 vs v15)
     Fix: Regenerate skill with latest docs

  2. Missing skill for PostgreSQL
     Fix: Generate postgresql-db skill

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Run `/agentful-analyze fix` to auto-apply fixes.
Run `/agentful-analyze full` for comprehensive analysis.
```

### Mode 2: FULL

Comprehensive analysis including codebase scanning.

**Additional checks beyond QUICK:**

1. **Domain Analysis**
   - Scan codebase for new domains (like `/agentful-agents` does)
   - Check if discovered domains have agents
   - Identify stale domain agents (domain no longer exists in code)

2. **Skill Content Validation**
   - Validate skill content matches current framework versions
   - Check for deprecated patterns in skills
   - Verify skills have comprehensive content (not placeholders)

3. **Architecture Drift**
   - Compare current codebase patterns vs architecture.json
   - Detect if new frameworks/libraries added but not in architecture
   - Identify removed dependencies still in architecture

4. **Configuration Consistency**
   - Check if product spec exists but not referenced in state
   - Verify completion.json aligns with product spec structure
   - Detect orphaned state files

**Process:**

```typescript
// Run quick checks first
await runQuickChecks();

// 1. Domain discovery (inline lightweight scan)
// Scan common domain directories for structure
const srcDirs = Glob("src/**/").filter(d =>
  !d.includes("node_modules") &&
  !d.includes("test") &&
  !d.includes("__")
);

const domains = [];
for (const dir of srcDirs) {
  const files = Glob(`${dir}/*.{ts,tsx,js,jsx}`);
  if (files.length >= 3) {  // At least 3 files suggests a domain
    const domainName = extractDomainName(dir);
    domains.push({ name: domainName, path: dir, fileCount: files.length });
  }
}

const coreAgents = ["backend", "frontend", "tester", "reviewer", "fixer", "orchestrator", "architect", "product-analyzer"];
const domainAgents = Glob(".claude/agents/*.md")
  .filter(p => !coreAgents.includes(extractName(p)));

// Check for missing domain agents
for (const domain of domains) {
  if (!domainAgents.some(a => extractName(a) === domain.name)) {
    issues.push({
      type: "info",
      msg: `Domain '${domain.name}' detected (${domain.fileCount} files) but no agent exists`,
      fix: `generate_domain_agent:${domain.name}`
    });
  }
}

// Check for stale domain agents
for (const agent of domainAgents) {
  const name = extractName(agent);
  if (!domains.some(d => d.name === name)) {
    issues.push({
      type: "info",
      msg: `Domain agent '${name}' exists but domain not found in codebase`,
      fix: `archive_agent:${name}`
    });
  }
}

// 2. Skill content validation (inline basic checks)
const skills = Glob(".claude/skills/*/SKILL.md");
for (const skillPath of skills) {
  const content = Read(skillPath);
  const skillName = extractSkillName(skillPath);
  const validationIssues = [];

  // Check if skill is just a placeholder
  if (content.length < 500) {
    validationIssues.push("too short (likely placeholder)");
  }

  // Check if skill has TODO markers
  if (content.includes("TODO") || content.includes("PLACEHOLDER")) {
    validationIssues.push("contains TODOs/placeholders");
  }

  // Check if skill has basic structure
  if (!content.includes("## Overview") && !content.includes("## Usage")) {
    validationIssues.push("missing standard sections");
  }

  if (validationIssues.length > 0) {
    issues.push({
      type: "warning",
      msg: `Skill '${skillName}' has issues: ${validationIssues.join(", ")}`,
      fix: `regenerate_skill:${skillName}`
    });
  }
}

// 3. Architecture drift detection
const currentDeps = detectDependencies();
const archDeps = architecture.dependencies || [];

const newDeps = currentDeps.filter(d => !archDeps.includes(d.name));
const removedDeps = archDeps.filter(d => !currentDeps.some(c => c.name === d));

for (const dep of newDeps) {
  issues.push({
    type: "info",
    msg: `New dependency '${dep.name}' not in architecture.json`,
    fix: `update_architecture:add:${dep.name}`
  });
}

for (const dep of removedDeps) {
  issues.push({
    type: "info",
    msg: `Dependency '${dep}' removed from project but still in architecture.json`,
    fix: `update_architecture:remove:${dep}`
  });
}
```

**Output Format:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    agentful Health Check (Full Analysis)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Status: ⚠️  WARNINGS

[... Quick check results ...]

Domain Analysis:
  Discovered: 3 domains
    ✓ authentication (92% confidence) - agent exists
    ✓ billing (87% confidence) - agent exists
    ⚠️  notifications (81% confidence) - no agent

  Stale agents: 1
    ⚠️  legacy-payments - domain no longer exists

Skill Validation:
  ✓ 4 skills valid
  ⚠️  1 skill needs update (nextjs)

Architecture Drift:
  New dependencies: 2
    • @tanstack/react-query (not in architecture)
    • stripe (not in architecture)

  Removed dependencies: 1
    • axios (removed from project)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Recommendations (6):

  1. Regenerate 'nextjs' skill for v15
  2. Generate 'postgresql-db' skill
  3. Generate domain agent for 'notifications'
  4. Archive stale agent 'legacy-payments'
  5. Update architecture.json with new dependencies
  6. Remove outdated dependencies from architecture.json

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Run `/agentful-analyze fix` to auto-apply fixes.
```

### Mode 3: FIX

Auto-fix detected issues with user confirmation.

**Process:**

```typescript
// 1. Run full analysis
const issues = await runFullAnalysis();

// 2. Group fixes by category
const fixGroups = {
  critical: issues.filter(i => i.type === "critical"),
  skills: issues.filter(i => i.fix?.startsWith("generate_skill") || i.fix?.startsWith("regenerate_skill")),
  agents: issues.filter(i => i.fix?.startsWith("generate_domain_agent") || i.fix?.startsWith("archive_agent")),
  architecture: issues.filter(i => i.fix?.startsWith("update_architecture")),
  state: issues.filter(i => i.fix?.startsWith("reset_state"))
};

// 3. Show user what will be fixed
console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           Auto-Fix Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Critical issues (${fixGroups.critical.length}):
${fixGroups.critical.map(i => `  • ${i.msg}`).join("\n")}

Skills (${fixGroups.skills.length}):
${fixGroups.skills.map(i => `  • ${i.msg}`).join("\n")}

Agents (${fixGroups.agents.length}):
${fixGroups.agents.map(i => `  • ${i.msg}`).join("\n")}

Architecture (${fixGroups.architecture.length}):
${fixGroups.architecture.map(i => `  • ${i.msg}`).join("\n")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Apply these fixes? (y/n): `);

// 4. Wait for user confirmation
const confirmed = await getUserConfirmation();
if (!confirmed) {
  console.log("Cancelled. No changes made.");
  return;
}

// 5. Apply fixes in parallel where possible
const fixTasks = [];

// Critical fixes first (sequential)
for (const issue of fixGroups.critical) {
  await applyFix(issue.fix);
}

// Skills (delegate to architect)
if (fixGroups.skills.length > 0) {
  console.log("\n🔧 Fixing skills...");
  for (const issue of fixGroups.skills) {
    await Task("architect", {
      action: "manage_skills",
      fix: issue.fix,
      msg: issue.msg
    });
  }
}

// Agents (delegate to architect)
if (fixGroups.agents.length > 0) {
  console.log("\n🔧 Fixing agents...");
  for (const issue of fixGroups.agents) {
    await Task("architect", {
      action: "manage_agents",
      fix: issue.fix,
      msg: issue.msg
    });
  }
}

// Architecture updates (sequential)
for (const issue of fixGroups.architecture) {
  await applyFix(issue.fix);
}

// 6. Re-run analysis to verify
console.log("\n✓ Fixes applied. Re-running analysis...\n");
await runQuickChecks();
```

**Output Format:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           Auto-Fix Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Skills (2):
  • Regenerate 'nextjs' skill for v15
  • Generate 'postgresql-db' skill

Agents (1):
  • Generate domain agent for 'notifications'

Architecture (2):
  • Add @tanstack/react-query to architecture.json
  • Remove axios from architecture.json

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Apply these fixes? (y/n): y

🔧 Fixing skills...
  ✓ Regenerated nextjs skill (v15)
  ✓ Generated postgresql-db skill

🔧 Fixing agents...
  ✓ Generated notifications domain agent

🔧 Updating architecture...
  ✓ Updated architecture.json

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ All fixes applied successfully.

Re-running health check...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       agentful Health Check (Quick)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Status: ✓ HEALTHY

Core Setup:
  ✓ architecture.json valid
  ✓ All core agents present (8/8)
  ✓ State files intact

Tech Stack Alignment:
  Detected: Next.js 15.1, PostgreSQL, Prisma 5
  Skills:
    ✓ nextjs (v15)
    ✓ postgresql-db (ok)
    ✓ prisma (ok)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All checks passed!
```

## Fix Implementation

The `applyFix` function handles different fix types:

```typescript
async function applyFix(fixString: string): Promise<void> {
  const [action, ...params] = fixString.split(":");

  switch (action) {
    case "generate_skill":
      // Delegate to architect agent
      await Task("architect", {
        action: "generate_skill",
        skill_name: params[0],
        context: "detected missing skill for framework"
      });
      break;

    case "regenerate_skill":
      // Delegate to architect agent
      await Task("architect", {
        action: "regenerate_skill",
        skill_name: params[0],
        context: "skill outdated or has quality issues"
      });
      break;

    case "generate_domain_agent":
      // Delegate to architect agent
      await Task("architect", {
        action: "generate_agent",
        domain: params[0],
        context: "domain detected in codebase without agent"
      });
      break;

    case "archive_agent":
      // Inline archival logic
      const agentPath = `.claude/agents/${params[0]}.md`;
      const archivePath = `.claude/agents/archived/${params[0]}.md`;
      const content = Read(agentPath);
      Write(archivePath, content);
      Bash(`rm ${agentPath}`);
      break;

    case "update_architecture":
      // Inline architecture update logic
      const arch = JSON.parse(Read(".agentful/architecture.json"));
      if (params[0] === "add") {
        arch.dependencies = arch.dependencies || [];
        arch.dependencies.push(params[1]);
      } else if (params[0] === "remove") {
        arch.dependencies = arch.dependencies.filter(d => d !== params[1]);
      }
      Write(".agentful/architecture.json", JSON.stringify(arch, null, 2));
      break;

    case "reset_state":
      // Inline state reset logic
      const statePath = params[0];
      const backup = Read(statePath);
      Write(`${statePath}.backup`, backup);
      Write(statePath, "{}");
      break;
  }
}
```

## Hook Integration

This command can be called from PostToolUse hooks:

### Hook: After package.json Changes

```typescript
// .claude/hooks/post-edit-package-json.ts
if (file_path.includes("package.json")) {
  // Trigger quick analysis via /agentful-analyze command
  console.log("Dependency file changed - run /agentful-analyze to check alignment");
}
```

### Hook: After Architecture Changes

```typescript
// .claude/hooks/post-architecture-update.ts
if (file_path === ".agentful/architecture.json") {
  // Trigger quick analysis via /agentful-analyze command
  console.log("Architecture updated - run /agentful-analyze to validate setup");
}
```

## Usage Examples

### Example 1: Quick Check During Development

```bash
/agentful-analyze
# Takes 5-10 seconds
# Reports any immediate issues
```

### Example 2: After Dependency Update

```bash
npm install next@15
/agentful-analyze
# Detects Next.js version change
# Suggests regenerating nextjs skill
```

### Example 3: Periodic Maintenance

```bash
/agentful-analyze full
# Comprehensive analysis
# Finds stale agents, missing skills, drift
```

### Example 4: Auto-Fix Everything

```bash
/agentful-analyze fix
# Runs full analysis
# Shows what will be fixed
# Applies fixes after confirmation
```

## Important Notes

1. **Quick mode** is non-invasive and fast - suitable for hooks
2. **Full mode** scans codebase - takes longer but thorough
3. **Fix mode** requires user confirmation before changes
4. All fixes are delegated to the architect agent or applied inline
5. State files are backed up before reset
6. Agents are archived (not deleted) when stale

## Integration with Other Commands

- **`/agentful-skills`**: Used for skill generation/regeneration
- **`/agentful-agents`**: Used for domain agent discovery/generation
- **`/agentful-validate`**: Complementary - validates code quality, this validates agentful setup
- **`/agentful-status`**: Shows progress, this shows health

## Success Criteria

Command succeeds when:

1. **Detection**: Accurately identifies gaps and issues
2. **Prioritization**: Critical issues flagged first
3. **Actionability**: Every issue has a clear fix path
4. **Speed**: Quick mode completes in under 10 seconds
5. **Safety**: Fix mode requires confirmation, backs up data
6. **Integration**: Works seamlessly with hooks and other commands
