---
name: agentful-product
description: Intelligently handles all product planning scenarios - init, analysis, refinement, status, and Q&A
---

# agentful Product Planning

This command intelligently handles all product planning scenarios with auto-detection.

## Auto-Detection Logic

The command detects the current state and acts accordingly:

1. **No product spec exists** → Interactive init mode
2. **Product spec exists, never analyzed** → Run analysis
3. **Analysis exists with unresolved blocking issues** → Refinement mode
4. **Analysis exists, ready** → Show status report
5. **User provides text after command** → Discussion/Q&A mode

## Detection Algorithm

```bash
# Step 1: Check for user text argument
user_text = extract_argument_from_command()

if user_text:
  # User asked a question or wants to discuss
  mode = "DISCUSSION"
  goto DISCUSSION_MODE

# Step 2: Check if product spec exists
product_spec_exists = exists(".claude/product/index.md") OR exists("PRODUCT.md")

if !product_spec_exists:
  # No product spec found
  mode = "INIT"
  goto INIT_MODE

# Step 3: Check if analysis exists
analysis_exists = exists(".claude/product/product-analysis.json")

if !analysis_exists:
  # Product spec exists but never analyzed
  mode = "ANALYSIS"
  goto ANALYSIS_MODE

# Step 4: Read analysis to check for blocking issues
Read(".claude/product/product-analysis.json")
blocking_issues = analysis.issues.filter(i => i.severity === "blocking" && !i.resolved)

if blocking_issues.length > 0:
  # Analysis exists but has unresolved blocking issues
  mode = "REFINEMENT"
  goto REFINEMENT_MODE

# Step 5: Analysis exists and ready
mode = "STATUS"
goto STATUS_MODE
```

---

## Mode 1: INIT (Interactive Initialization)

When no product spec exists, guide the user through creation.

### Process

```
📋 Product Specification Setup

Let's define your product specification. This will guide development.

────────────────────────────────────────────────────────

Q1: What are you building?
    Describe in 1-2 sentences what your product does.

    Example: "A task management app that helps teams collaborate
    on projects with real-time updates and deadline tracking."

    Your description:
    > _______________________________

────────────────────────────────────────────────────────

Q2: What tech stack are you using?

    Common stacks:
    [1] Next.js + Prisma + PostgreSQL
    [2] Django + PostgreSQL
    [3] Express + MongoDB
    [4] Spring Boot + MySQL
    [5] Rails + PostgreSQL
    [6] Let me specify my own stack

    Your choice:
    > _______________________________

────────────────────────────────────────────────────────

Q3: What are the core features?
    List your main features (comma-separated).

    Example: user authentication, task creation, team collaboration, notifications

    Your features:
    > _______________________________

────────────────────────────────────────────────────────

Q4: Any constraints or requirements?
    (Optional) Performance, accessibility, browser support, etc.

    Your constraints:
    > _______________________________

────────────────────────────────────────────────────────
```

### After Input Collection

1. Generate product spec at `.claude/product/index.md`:

```markdown
# Product Specification

## Overview

[User's description from Q1]

## Goals

- [ ] [Derived from description]
- [ ] [Derived from description]
- [ ] [Derived from description]

## Tech Stack

### Frontend
- **Framework**: [From Q2]
- **Language**: TypeScript
- **Styling**: [Inferred from stack]
- **State Management**: [Inferred from stack]

### Backend
- **Runtime**: [From Q2]
- **Framework**: [From Q2]
- **Language**: [From Q2]

### Database
- **Database**: [From Q2]
- **ORM**: [From Q2]

### Authentication
- **Method**: [Default: JWT or framework default]

### Testing
- **Unit**: [Inferred from stack]
- **E2E**: [Playwright]

### Deployment
- **Hosting**: [Inferred from stack]

## Features (Priority Order)

[For each feature from Q3, create a section]

### 1. [Feature Name] - CRITICAL
**Description**: [What this feature does]

**Acceptance Criteria**:
- [ ] [Specific requirement 1]
- [ ] [Specific requirement 2]
- [ ] [Specific requirement 3]

**User Stories**:
- As a [user type], I want [feature] so that [benefit]

**Technical Notes**:
- [Any technical details or constraints from Q4]

---

## Constraints

[Content from Q4]

## Success Criteria

The product is complete when:

1. All critical features implemented and tested
2. All tests passing with 80%+ coverage
3. No TypeScript errors
4. No security vulnerabilities
5. Deployed to production
```

2. **Immediately run analysis**:
   ```
   ✅ Product spec created at .claude/product/index.md

   Running analysis to check readiness...
   ```

3. Delegate to ANALYSIS_MODE (see below)

---

## Mode 2: ANALYSIS (Run Product Analyzer)

When product spec exists but never analyzed, or re-analysis requested.

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

1. **Read product specification**:
   - `.claude/product/index.md` or `PRODUCT.md`
   - Check for hierarchical structure (`.claude/product/domains/*/`)

2. **Analyze for completeness and clarity**:

   **Tech Stack Analysis:**
   - ✅ All stack choices specified (not placeholders)
   - ⚠️ Missing authentication method
   - ❌ Database not specified

   **Feature Analysis:**
   - ✅ Feature description clear
   - ⚠️ Acceptance criteria vague
   - ❌ No acceptance criteria defined
   - ⚠️ Missing user stories
   - ⚠️ Technical constraints unclear

   **Architecture Analysis:**
   - ✅ Clear folder structure defined
   - ⚠️ No architecture notes
   - ❌ API structure undefined

   **Blocking Issues** (must resolve before dev):
   - Database technology not specified
   - Authentication method not chosen
   - API structure completely undefined
   - No acceptance criteria for critical features

   **Warnings** (should address but not blocking):
   - Missing user stories (context helpful)
   - Vague acceptance criteria (need more specificity)
   - No performance requirements specified
   - Missing error handling strategy

3. **Generate analysis file** at `.claude/product/product-analysis.json`:

```json
{
  "analyzed_at": "2026-01-19T00:00:00Z",
  "product_file": ".claude/product/index.md",
  "structure_type": "flat",
  "readiness_score": 65,
  "issues": [
    {
      "id": "issue-001",
      "type": "tech_stack",
      "severity": "blocking",
      "title": "Database not specified",
      "description": "Tech stack section shows [Database placeholder] instead of actual database choice",
      "context": "The authentication and user management features require database persistence",
      "suggestions": [
        {
          "option": "A",
          "label": "PostgreSQL with Prisma",
          "description": "Robust relational database, excellent TypeScript support with Prisma ORM"
        },
        {
          "option": "B",
          "label": "MongoDB with Mongoose",
          "description": "Flexible document database, good for evolving schemas"
        },
        {
          "option": "C",
          "label": "SQLite with Prisma",
          "description": "Lightweight, serverless database, perfect for prototypes and small apps"
        },
        {
          "option": "CUSTOM",
          "label": "Specify my own approach",
          "description": "I want to use a different database or configuration"
        }
      ],
      "resolved": false
    },
    {
      "id": "issue-002",
      "type": "feature",
      "severity": "blocking",
      "title": "Login feature has no acceptance criteria",
      "description": "Feature 1 (User Login) description is present but acceptance criteria section is empty",
      "context": "Without clear acceptance criteria, implementation will be ambiguous and validation impossible",
      "suggestions": [
        {
          "option": "A",
          "label": "Standard email/password login",
          "description": "Email field, password field, remember me checkbox, submit button, error handling, session management"
        },
        {
          "option": "B",
          "label": "OAuth + email/password",
          "description": "Email/password login plus Google/GitHub OAuth options"
        },
        {
          "option": "C",
          "label": "Magic link login",
          "description": "Passwordless authentication via email magic links"
        },
        {
          "option": "CUSTOM",
          "label": "Specify my own approach",
          "description": "I have specific requirements for login functionality"
        }
      ],
      "resolved": false
    },
    {
      "id": "issue-003",
      "type": "architecture",
      "severity": "warning",
      "title": "API structure not defined",
      "description": "No REST endpoint conventions or API design patterns specified",
      "context": "Defining API structure upfront prevents inconsistencies and rework",
      "suggestions": [
        {
          "option": "A",
          "label": "RESTful conventions",
          "description": "Standard REST: /api/users, /api/auth/login, JSON responses, HTTP status codes"
        },
        {
          "option": "B",
          "label": "GraphQL",
          "description": "Single endpoint with GraphQL schema, type-safe queries and mutations"
        },
        {
          "option": "C",
          "label": "tRPC",
          "description": "End-to-end type-safe APIs, no code generation, perfect for TypeScript monorepos"
        },
        {
          "option": "CUSTOM",
          "label": "Specify my own approach",
          "description": "I have a specific API design in mind"
        }
      ],
      "resolved": false
    }
  ],
  "warnings": [
    {
      "id": "warning-001",
      "type": "feature",
      "title": "Missing user stories",
      "description": "Features lack user stories for context",
      "recommendation": "Add 'As a [user], I want [goal] so that [benefit]' for each feature"
    }
  ],
  "summary": {
    "total_issues": 3,
    "blocking_issues": 2,
    "warning_issues": 1,
    "tech_stack_complete": false,
    "features_well_defined": false,
    "architecture_clear": false,
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

⚠️  Warnings (1):
  1. API structure not defined

────────────────────────────────────────────────────────

To resolve issues and refine your product spec:

  Run: /agentful-product

This will walk you through each blocking issue with context-aware options.
```

---

## Mode 3: REFINEMENT (Walk Through Issues)

When analysis exists with unresolved blocking issues.

### Process

Read `.claude/product/product-analysis.json` and walk through each blocking issue one by one.

```
🔧 Product Specification Refinement

You have 2 blocking issues to resolve before development can begin.

Let's walk through each one...

════════════════════════════════════════════════════════

Issue 1 of 2: Database not specified

Context:
  The authentication and user management features require
  database persistence. Tech stack section shows [Database
  placeholder] instead of actual database choice.

Choose an option:

  [A] PostgreSQL with Prisma
      Robust relational database, excellent TypeScript support
      with Prisma ORM. Best for: Structured data, complex queries,
      referential integrity.

  [B] MongoDB with Mongoose
      Flexible document database, good for evolving schemas.
      Best for: Rapid prototyping, flexible data models.

  [C] SQLite with Prisma
      Lightweight, serverless database, perfect for prototypes
      and small apps. Best for: Local development, demos, MVPs.

  [CUSTOM] Specify my own approach
      I want to use a different database or configuration

Your choice: > _______________________________
```

**If user selects A, B, or C:**

1. Update `.claude/product/index.md` with the chosen option
2. Mark issue as resolved in `product-analysis.json`
3. Continue to next issue

**If user selects CUSTOM:**

```
Custom Approach Selected

Please specify:
  - Database: > _______________________________
  - ORM (if any): > _______________________________
  - Any special configuration: > _______________________________
```

Then update the product spec and mark resolved.

**After all blocking issues resolved:**

```
════════════════════════════════════════════════════════

✅ All blocking issues resolved!

Re-running analysis to validate...
```

Re-run analysis mode. If still has blocking issues, continue refinement. If ready:

```
════════════════════════════════════════════════════════

🎉 Product specification ready for development!

Readiness Score: 92/100

✅ Tech stack complete
✅ Features well-defined
✅ Architecture clear

⚠️  You still have 1 warning:
  - API structure not defined

This is not blocking, but addressing it now will prevent
rework later. Would you like to resolve warnings? (y/n)

> _______________________________
```

If yes, walk through warnings with same option pattern.

If no:

```
────────────────────────────────────────────────────────

Ready to start development:

  Run: /agentful-start

This will analyze your tech stack, generate specialized
agents, and begin implementing your product.
```

---

## Mode 4: STATUS (Show Status Report)

When analysis exists and product spec is ready (no blocking issues).

### Process

Read `.claude/product/product-analysis.json` and display status.

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

────────────────────────────────────────────────────────

Quality Checklist:
  ✅ Database specified: PostgreSQL with Prisma
  ✅ Authentication method: JWT tokens
  ✅ All features have acceptance criteria
  ✅ Critical features have user stories
  ⚠️  API structure not defined
  ✅ Folder structure defined
  ✅ Constraints documented

────────────────────────────────────────────────────────

⚠️  1 Warning Remaining:
  - API structure not defined

Would you like to:
  [1] Resolve remaining warnings
  [2] Re-run analysis (if you updated the spec)
  [3] Start development (warnings won't block)
  [4] Show product specification

Your choice: > _______________________________
```

Handle user's choice:
- **[1]**: Enter REFINEMENT_MODE for warnings only
- **[2]**: Enter ANALYSIS_MODE
- **[3]**: Show how to run `/agentful-start`
- **[4]**: Display the product spec content

---

## Mode 5: DISCUSSION (Q&A and Planning)

When user provides text after the command: `/agentful-product "How should I..."`

### Process

Analyze the user's question in context of current product spec.

```
💬 Product Planning Discussion

Your question: "How should I handle user permissions and roles?"

Let me analyze this in context of your product...

────────────────────────────────────────────────────────

Context Analysis:
  - Your product: Task management app for teams
  - Current features: User auth, task creation, team collab
  - Tech stack: Next.js + Prisma + PostgreSQL
  - Stage: Product spec defined, ready for development

────────────────────────────────────────────────────────

💡 Recommendation:

For your task management app, I recommend a role-based
access control (RBAC) system with these roles:

1. Owner: Full permissions, billing, team management
2. Admin: User management, all task operations
3. Member: Create/edit own tasks, view team tasks
4. Guest: View-only access

Implementation approach:

1. Add to product spec:
   - New feature: "User Roles & Permissions" (HIGH priority)
   - Acceptance criteria:
     * Define role hierarchy
     * Implement role checks in API
     * Add role selection in team invites
     * UI updates based on role

2. Database schema:
   - Add 'role' enum to User model
   - Consider TeamMember join table with role per team

3. Prefer in-stack solution:
   - Use Prisma enums for roles (not third-party)
   - Implement permission checks in API middleware
   - Use Next.js middleware for route protection

Would you like me to:
  [A] Add this as a feature to your product spec
  [B] Show implementation example for your stack
  [C] Discuss alternative approaches
  [D] Continue discussion

Your choice: > _______________________________
```

**Key principles for discussion mode:**
- Read and reference current product spec
- Provide context-aware recommendations
- Prefer in-stack solutions over third-party
- Offer to update product spec if helpful
- Ask clarifying questions when needed
- No time estimates

---

## Important Rules

### Always Prefer In-Stack Solutions

When suggesting approaches, ALWAYS prefer solutions using the existing tech stack:

**Good:**
- "Use Prisma's built-in validation instead of a separate library"
- "Next.js middleware can handle this without adding a package"
- "Django's permissions system covers this use case"

**Bad:**
- "Install this third-party auth library"
- "Use this npm package for validation"
- "Add Clerk for authentication"

**Only suggest third-party when:**
- Truly complex (payment processing → Stripe)
- Security-critical (OAuth → established providers)
- Significant development time saved
- No good in-stack alternative

### No Time Estimates

**Never provide time estimates** like:
- ❌ "This will take 2-3 days"
- ❌ "Implement in 4 hours"
- ❌ "Should be done by next week"

Instead:
- ✅ "This is a straightforward feature"
- ✅ "This is complex and will require careful planning"
- ✅ "This depends on X being completed first"

### Context-Aware Options

When presenting options in refinement mode:
- Option A: Most common/recommended approach
- Option B: Alternative approach for different use case
- Option C: Another viable alternative
- CUSTOM: Always include this option

Make options specific to their context, NOT generic.

**Bad (generic):**
```
[A] Use a library
[B] Build it yourself
[C] Use a service
```

**Good (context-aware):**
```
[A] PostgreSQL with Prisma
    Robust relational database, excellent TypeScript support.
    Best for: Structured data, complex queries.

[B] MongoDB with Mongoose
    Flexible document database, good for evolving schemas.
    Best for: Rapid prototyping, flexible data models.
```

### Using the Task Tool

To invoke the product analyzer agent, use:

```bash
Task("product-analyzer", "Analyze .claude/product/index.md and generate product-analysis.json with readiness score and issues. For each blocking issue, provide 3-4 context-aware suggestions with CUSTOM option.")
```

Since the product-analyzer agent doesn't exist as a file, the Task tool will use the conversation skill to interpret the instructions and execute them.

---

## File Locations

- **Product spec**: `.claude/product/index.md` (or `PRODUCT.md` for legacy)
- **Analysis results**: `.claude/product/product-analysis.json`
- **Domain structure**: `.claude/product/domains/*/index.md` (optional hierarchical)
- **Feature specs**: `.claude/product/domains/*/features/*.md` (optional hierarchical)

---

## Example Flows

### Flow 1: New User, Empty Project

```
User: /agentful-product

Command: [Detects no product spec exists]
         [Enters INIT mode]

Command: "📋 Product Specification Setup..."
         [Asks 4 questions]

User: [Answers questions]

Command: [Generates .claude/product/index.md]
         [Runs ANALYSIS mode]
         [Analysis finds 2 blocking issues]
         [Shows analysis results]

User: /agentful-product

Command: [Detects blocking issues exist]
         [Enters REFINEMENT mode]
         [Walks through each issue]

User: [Resolves issues with options]

Command: [Updates product spec]
         [Marks issues resolved]
         [Re-runs analysis]
         [Shows ready status]
         [Suggests running /agentful-start]
```

### Flow 2: Existing Product Spec, Never Analyzed

```
User: /agentful-product

Command: [Detects product spec exists]
         [Detects no analysis file]
         [Enters ANALYSIS mode]
         [Runs analyzer]
         [Shows readiness score and issues]
```

### Flow 3: Ready Product, Status Check

```
User: /agentful-product

Command: [Detects product spec exists]
         [Detects analysis exists]
         [No blocking issues]
         [Enters STATUS mode]
         [Shows readiness score, warnings, next steps]
```

### Flow 4: User Has Question

```
User: /agentful-product "Should I use REST or GraphQL?"

Command: [Detects user text provided]
         [Enters DISCUSSION mode]
         [Reads product spec for context]
         [Analyzes question]
         [Provides context-aware recommendation]
         [Offers to update spec or continue discussion]
```

---

## Quality Checklist

Before marking analysis as "ready for development", verify:

**Tech Stack:**
- [ ] All placeholders replaced with actual choices
- [ ] Framework/runtime specified
- [ ] Database and ORM specified
- [ ] Authentication method chosen
- [ ] Testing tools identified

**Features:**
- [ ] All critical features have descriptions
- [ ] All critical features have acceptance criteria
- [ ] Acceptance criteria are specific and testable
- [ ] At least one feature has user stories (for context)

**Architecture:**
- [ ] Folder structure defined (or will use framework defaults)
- [ ] API design approach specified (REST/GraphQL/tRPC)
- [ ] Error handling strategy mentioned
- [ ] Deployment target identified

**Constraints:**
- [ ] Any performance requirements documented
- [ ] Accessibility requirements noted (if applicable)
- [ ] Browser/platform support specified

---

## Success Criteria

This command is successful when:

1. **INIT**: User can create a well-structured product spec through guided questions
2. **ANALYSIS**: Clear readiness score and actionable issues identified
3. **REFINEMENT**: Each blocking issue resolved with context-aware options
4. **STATUS**: Current state clearly communicated with next steps
5. **DISCUSSION**: User questions answered with specific, in-stack recommendations
6. **HANDOFF**: Product spec ready → `/agentful-start` can begin development
