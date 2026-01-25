---
name: agentful-product
description: Intelligently handles all product planning scenarios - init, analysis, refinement, status, and Q&A
---

# agentful Product Planning

This command intelligently handles all product planning scenarios with auto-detection.

## Auto-Detection Logic

The command detects the current state and acts accordingly:

1. **No product spec exists** → Check if codebase exists to reverse-engineer, else interactive init
2. **Product spec exists, never analyzed** → Run analysis
3. **Analysis exists with unresolved blocking issues** → Refinement mode
4. **Analysis exists, ready** → Show status report
5. **User provides text after command** → Discussion/Q&A mode

## Detection Algorithm

```bash
# Step 1: Check for user text argument
user_text = extract_argument_from_command()

if user_text:
  mode = "DISCUSSION"
  goto DISCUSSION_MODE

# Step 2: Check if product spec exists
product_spec_exists = exists(".claude/product/index.md")

if !product_spec_exists:
  has_substantial_codebase = check_codebase_exists()

  if has_substantial_codebase:
    mode = "REVERSE_ENGINEER"
    goto REVERSE_ENGINEER_MODE
  else:
    mode = "INIT"
    goto INIT_MODE

# Step 3: Check if analysis exists
analysis_exists = exists(".agentful/product-analysis.json")

if !analysis_exists:
  mode = "ANALYSIS"
  goto ANALYSIS_MODE

# Step 4: Read analysis to check for blocking issues
Read(".agentful/product-analysis.json")
blocking_issues = analysis.issues.filter(i => i.severity === "blocking" && !i.resolved)

if blocking_issues.length > 0:
  mode = "REFINEMENT"
  goto REFINEMENT_MODE

# Step 5: Analysis exists and ready
mode = "STATUS"
goto STATUS_MODE
```

---

## Mode 0: REVERSE_ENGINEER (Codebase Analysis)

When no product spec exists but substantial codebase detected, offer to reverse-engineer the product spec from existing code.

### Detection Criteria

A "substantial codebase" is detected when:
- Project has source directories (src/, app/, lib/, etc.)
- Contains actual implementation files (not just config)
- Has at least 10+ code files

### Process

```
🔍 Analyzing Existing Codebase

I detected an existing codebase without a product specification.

Would you like me to:

  [A] Analyze your codebase and generate a product spec
  [B] Create product spec from scratch (ignore existing code)

Your choice: > _______________________________
```

**If user chooses [A]:**

Use the project analyzer to scan the codebase and show detected domains:

```
📊 Detected Domains & Features

  • authentication       ████████░░ 82%
    Features: JWT tokens, login/logout, password reset

  • user-management      █████████░ 87%
    Features: CRUD operations, profile management, roles

Tech Stack detected:
  Language:    TypeScript
  Framework:   Next.js 15
  Database:    PostgreSQL with Prisma

Generate product spec? (y/n): > _______________________________
```

Generate `.claude/product/index.md` with hierarchical structure based on detected domains, then immediately run ANALYSIS mode.

**If user chooses [B]:** Fall through to INIT mode.

---

## Mode 1: INIT (Interactive Initialization)

When no product spec exists and no substantial codebase detected, guide the user through creation.

### Process

```
📋 Product Specification Setup

Q1: What are you building?
    > _______________________________

Q2: What tech stack are you using?
    [1] Next.js + Prisma + PostgreSQL
    [2] Django + PostgreSQL
    [3] Express + MongoDB
    [4] Spring Boot + MySQL
    [5] Rails + PostgreSQL
    [6] Let me specify my own stack
    > _______________________________

Q3: What are the core features?
    > _______________________________

Q4: Any constraints or requirements?
    > _______________________________
```

Generate product spec at `.claude/product/index.md` with user's input, then immediately run ANALYSIS mode.

---

## Mode 2: ANALYSIS (Run Product Analyzer)

When product spec exists but never analyzed, or re-analysis requested.

### Validation

Before running analysis, check if product spec exists and is readable:

```javascript
function validate_product_spec(file_path) {
  // Check file exists
  if (!exists(file_path)) {
    return { valid: false, error: `Product spec not found: ${file_path}` };
  }

  // Check file is readable (not corrupted)
  try {
    const content = Read(file_path);
    if (content.length < 50) {
      return { valid: false, error: `Product spec is too short (likely empty or corrupted)` };
    }
  } catch (e) {
    return { valid: false, error: `Cannot read product spec: ${e.message}` };
  }

  return { valid: true };
}
```

```bash
# Validate product spec before analysis
validation = validate_product_spec(".claude/product/index.md")

if !validation.valid:
  console.log(`❌ ${validation.error}`)
  console.log("Run /agentful-product to initialize product specification.")
  return
```

### Process

```
🔍 Analyzing Product Specification

Reading product spec and analyzing readiness...
```

Use the Task tool to delegate to a product analyzer agent:

```bash
Task("product-analyzer", "Analyze .claude/product/index.md and generate product-analysis.json with readiness score and issues.")
```

### Product Analyzer Agent Instructions

The product analyzer should:

1. **Read product specification**: `.claude/product/index.md`

2. **Analyze for completeness and clarity**:
   - Tech stack: All stack choices specified (not placeholders)
   - Features: Clear descriptions and acceptance criteria
   - Architecture: Clear folder structure and patterns

3. **Generate analysis file** at `.agentful/product-analysis.json`:

```json
{
  "analyzed_at": "2026-01-19T00:00:00Z",
  "product_file": ".claude/product/index.md",
  "readiness_score": 65,
  "issues": [
    {
      "id": "issue-001",
      "type": "tech_stack",
      "severity": "blocking",
      "title": "Database not specified",
      "description": "Tech stack section shows [Database placeholder]",
      "suggestions": [
        {
          "option": "A",
          "label": "PostgreSQL with Prisma",
          "description": "Robust relational database"
        },
        {
          "option": "B",
          "label": "MongoDB with Mongoose",
          "description": "Flexible document database"
        },
        {
          "option": "CUSTOM",
          "label": "Specify my own approach"
        }
      ],
      "resolved": false
    }
  ],
  "summary": {
    "total_issues": 3,
    "blocking_issues": 2,
    "ready_for_development": false
  }
}
```

4. **Display results**:

```
📊 Analysis Complete

Readiness Score: 65/100

❌ Not ready for development
   2 blocking issues must be resolved

🚨 Blocking Issues:
  1. Database not specified
  2. Login feature has no acceptance criteria

To resolve: Run /agentful-product
```

---

## Mode 3: REFINEMENT (Walk Through Issues)

When analysis exists with unresolved blocking issues.

### Validation

Before reading analysis, validate the file:

```javascript
function validate_state_file(file_path, required_fields) {
  // Check file exists
  if (!exists(file_path)) {
    return { valid: false, error: `File not found: ${file_path}`, action: "not_found" };
  }

  // Check file is valid JSON
  let content;
  try {
    content = JSON.parse(Read(file_path));
  } catch (e) {
    return { valid: false, error: `Invalid JSON in ${file_path}`, action: "corrupted" };
  }

  // Check required fields exist
  for (const field of required_fields) {
    if (!(field in content)) {
      return { valid: false, error: `Missing field '${field}' in ${file_path}`, action: "incomplete" };
    }
  }

  return { valid: true, content };
}
```

```bash
# Validate product-analysis.json
validation = validate_state_file(".agentful/product-analysis.json", ["issues", "readiness_score"])

if !validation.valid:
  if validation.action == "not_found":
    console.log("❌ No analysis found. Re-running analysis...")
    # Fall back to ANALYSIS mode
    goto ANALYSIS_MODE
  else if validation.action == "corrupted":
    console.log("❌ Corrupted analysis file. Re-running analysis...")
    # Backup and re-analyze
    Bash("cp .agentful/product-analysis.json .agentful/product-analysis.json.backup-$(date +%s)")
    goto ANALYSIS_MODE
  else if validation.action == "incomplete":
    console.log("❌ Incomplete analysis file. Re-running analysis...")
    goto ANALYSIS_MODE
```

### Process

Read `.agentful/product-analysis.json` and walk through each blocking issue:

```
🔧 Product Specification Refinement

You have 2 blocking issues to resolve.

════════════════════════════════════════════════════════

Issue 1 of 2: Database not specified

Choose an option:

  [A] PostgreSQL with Prisma
  [B] MongoDB with Mongoose
  [C] SQLite with Prisma
  [CUSTOM] Specify my own approach

Your choice: > _______________________________
```

For each issue:
1. Update `.claude/product/index.md` with chosen option
2. Mark issue as resolved in `product-analysis.json`
3. Continue to next issue

**After all blocking issues resolved:**

```
✅ All blocking issues resolved!

Re-running analysis to validate...

🎉 Product specification ready for development!

Readiness Score: 92/100

⚠️  You still have 1 warning:
  - API structure not defined

Would you like to resolve warnings? (y/n)
```

If yes, walk through warnings. If no:

```
Ready to start development:
  Run: /agentful-start
```

---

## Mode 4: STATUS (Show Status Report)

When analysis exists and product spec is ready (no blocking issues).

```
📊 Product Specification Status

Last analyzed: 2 hours ago
Readiness Score: 92/100
✅ Ready for development

────────────────────────────────────────────────────────

Summary:
  ✅ Tech stack: Complete and specified
  ✅ Features: 5 features well-defined
  ✅ Architecture: Clear structure and patterns
  ⚠️  API design: Not defined (1 warning)

Would you like to:
  [1] Resolve remaining warnings
  [2] Re-run analysis
  [3] Start development
  [4] Show product specification

Your choice: > _______________________________
```

---

## Mode 5: DISCUSSION (Q&A and Planning)

When user provides text after the command: `/agentful-product "How should I..."`

### Process

Analyze the user's question in context of current product spec:

```
💬 Product Planning Discussion

Your question: "How should I handle user permissions?"

Context Analysis:
  - Your product: Task management app
  - Tech stack: Next.js + Prisma + PostgreSQL
  - Stage: Ready for development

────────────────────────────────────────────────────────

💡 Recommendation:

For your task management app, I recommend role-based
access control (RBAC) with these roles:

1. Owner: Full permissions, billing, team management
2. Admin: User management, all task operations
3. Member: Create/edit own tasks, view team tasks
4. Guest: View-only access

Implementation approach:

1. Add to product spec:
   - New feature: "User Roles & Permissions" (HIGH priority)
   - Database: Add 'role' enum to User model
   - Use Prisma enums (not third-party)

Would you like me to:
  [A] Add this as a feature to your product spec
  [B] Show implementation example
  [C] Discuss alternatives
```

**Key principles for discussion mode:**
- Read and reference current product spec
- Provide context-aware recommendations
- Prefer in-stack solutions over third-party
- Offer to update product spec if helpful

---

## Important Rules

### Always Prefer In-Stack Solutions

When suggesting approaches, ALWAYS prefer solutions using the existing tech stack:

**Good:**
- "Use Prisma's built-in validation instead of a separate library"
- "Next.js middleware can handle this without adding a package"

**Bad:**
- "Install this third-party auth library"
- "Add Clerk for authentication"

**Only suggest third-party when:**
- Truly complex (payment processing → Stripe)
- Security-critical (OAuth → established providers)
- No good in-stack alternative

### No Time Estimates

**Never provide time estimates** like:
- ❌ "This will take 2-3 days"

Instead:
- ✅ "This is a straightforward feature"
- ✅ "This is complex and will require careful planning"

### Context-Aware Options

When presenting options in refinement mode:
- Option A: Most common/recommended approach
- Option B: Alternative approach for different use case
- Option C: Another viable alternative
- CUSTOM: Always include this option

Make options specific to their context, NOT generic.

### Using the Task Tool

To invoke the product analyzer agent:

```bash
Task("product-analyzer", "Analyze .claude/product/index.md and generate product-analysis.json with readiness score and issues. For each blocking issue, provide 3-4 context-aware suggestions with CUSTOM option.")
```

---

## File Locations

- **Product spec**: `.claude/product/index.md`
- **Analysis results**: `.agentful/product-analysis.json`
- **Domain structure**: `.claude/product/domains/*/index.md` (optional hierarchical)

---

## Example Flows

### Flow 1: Reverse Engineer from Codebase

```
User: /agentful-product [Has code, no spec]

Command: → REVERSE_ENGINEER mode
         → Shows detected domains
         → Generates spec
         → Runs ANALYSIS

User: /agentful-product [If issues exist]

Command: → REFINEMENT mode
         → Walks through issues
```

### Flow 2: New User, Empty Project

```
User: /agentful-product

Command: → INIT mode
         → Asks 4 questions
         → Generates spec
         → Runs ANALYSIS
         → Shows issues

User: /agentful-product

Command: → REFINEMENT mode
         → Resolves issues
         → Re-runs analysis
         → Ready!
```

### Flow 3: User Has Question

```
User: /agentful-product "Should I use REST or GraphQL?"

Command: → DISCUSSION mode
         → Reads product spec
         → Provides recommendation
         → Offers to update spec
```

---

## Quality Checklist

Before marking analysis as "ready for development", verify:

**Tech Stack:**
- [ ] All placeholders replaced with actual choices
- [ ] Database and ORM specified
- [ ] Authentication method chosen

**Features:**
- [ ] All critical features have descriptions
- [ ] All critical features have acceptance criteria
- [ ] Acceptance criteria are specific and testable

**Architecture:**
- [ ] Folder structure defined
- [ ] API design approach specified
- [ ] Error handling strategy mentioned

---

## Success Criteria

This command is successful when:

1. **INIT**: User can create a well-structured product spec through guided questions
2. **ANALYSIS**: Clear readiness score and actionable issues identified
3. **REFINEMENT**: Each blocking issue resolved with context-aware options
4. **STATUS**: Current state clearly communicated with next steps
5. **DISCUSSION**: User questions answered with specific, in-stack recommendations
6. **HANDOFF**: Product spec ready → `/agentful-start` can begin development
