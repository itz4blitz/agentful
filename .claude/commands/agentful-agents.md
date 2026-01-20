---
name: agentful-agents
description: Discover domain patterns and generate specialized domain agents with comprehensive documentation
---

# agentful Agents

This command discovers domain patterns in your codebase and generates specialized domain agents with validation and documentation.

## What It Does

1. **Discovers domain patterns** by analyzing code cohesion (NOT hardcoded terms)
2. **Identifies logical domains** based on actual project structure
3. **Checks existing agents** for gaps or missing coverage
4. **Presents findings** with confidence scores
5. **Asks for confirmation** before generating anything
6. **Generates agents in parallel** with validation and documentation

## Auto-Detection Process

```bash
# Step 1: Check current state
has_code = check_codebase_exists()
has_architecture = exists(".agentful/architecture.json")

if !has_code:
  mode = "NO_CODEBASE"
  goto NO_CODEBASE_MODE

if !has_architecture:
  mode = "NEED_ARCHITECTURE"
  goto NEED_ARCHITECTURE_MODE

# Step 2: Run domain discovery
mode = "DISCOVERY"
goto DISCOVERY_MODE
```

---

## Mode 1: NO_CODEBASE (No Code to Analyze)

When no substantial codebase exists.

```
⚠️  No Codebase Detected

I can't discover domain agents because there's no code to analyze yet.

Options:
  [1] Start building features first (Run /agentful-start)
  [2] Manually define domains
  [3] Skip for now

Your choice: > _______________________________
```

---

## Mode 2: NEED_ARCHITECTURE (Missing Architecture Analysis)

When `.agentful/architecture.json` doesn't exist.

```
🔍 Architecture Analysis Needed

Before discovering domain agents, I need to understand your tech stack
and code patterns.

Run /agentful-start first, which will:
  1. Trigger architect agent to analyze your project
  2. Generate tech stack agents
  3. Then you can run /agentful-agents to discover domain agents

Would you like to run /agentful-start now? (y/n): > _______________________________
```

---

## Mode 3: DISCOVERY (Main Workflow)

When codebase exists and architecture analyzed.

### Step 1: Explore Codebase for Domain Patterns

Use **parallel explorer agents** to analyze different aspects:

```bash
# Launch parallel exploration tasks
Task("domain-explorer-cohesion", "Analyze code cohesion to identify logical domains based on file groupings and dependencies.")

Task("domain-explorer-naming", "Analyze naming patterns to identify business domain terminology.")

Task("domain-explorer-database", "Analyze database schemas and models to identify data domains.")

Task("domain-explorer-api", "Analyze API routes and endpoints to identify domain boundaries.")
```

**Explorer Agent Guidelines:**

1. **Cohesion Explorer**:
   - Looks for file clusters with high internal coupling
   - Analyzes import graphs
   - Outputs confidence based on coupling strength

2. **Naming Explorer**:
   - Scans for business domain terms
   - Detects consistent naming patterns
   - Outputs confidence based on naming consistency

3. **Database Explorer**:
   - Analyzes database schemas/models
   - Identifies entity relationships
   - Outputs confidence based on entity cohesion

4. **API Explorer**:
   - Maps API routes to business capabilities
   - Identifies controller/handler groupings
   - Outputs confidence based on route organization

**Explorer Output Format:**

```json
{
  "explorer": "cohesion",
  "domains_found": [
    {
      "name": "billing",
      "confidence": 0.87,
      "evidence": [
        "Cohesive file cluster in src/billing/",
        "15 files with high internal coupling",
        "Shared imports: stripe, payments, invoices"
      ],
      "files": [
        "src/billing/subscription.service.ts",
        "src/billing/invoice.service.ts"
      ]
    }
  ]
}
```

### Step 2: Aggregate and Validate Findings

After all explorers complete, **aggregate their results**:

```bash
Task("domain-validator", "Aggregate findings from all explorers. Merge overlapping domains. Validate each domain has sufficient evidence. Check against existing agents to identify gaps.")
```

**Validator Agent Guidelines:**

1. **Merge overlapping domains**:
   - If "billing" found by 3 explorers → strong signal
   - If single file detected as domain → probably false positive

2. **Calculate composite confidence**:
   ```
   confidence = (
     cohesion_score * 0.3 +
     naming_score * 0.2 +
     database_score * 0.3 +
     api_score * 0.2
   )

   Only include if confidence >= 0.6
   ```

3. **Check existing agents**:
   - Read `.claude/agents/` directory
   - Identify which domains already have agents
   - Flag gaps where domain exists but no agent

**Validator Output Format:**

```json
{
  "discovered_domains": [
    {
      "name": "billing",
      "confidence": 0.89,
      "sources": ["cohesion", "naming", "database", "api"],
      "has_existing_agent": false,
      "recommendation": "CREATE_AGENT"
    },
    {
      "name": "authentication",
      "confidence": 0.92,
      "has_existing_agent": true,
      "recommendation": "SKIP"
    }
  ]
}
```

### Step 3: Present Findings to User

Display comprehensive analysis:

```
🔍 Domain Discovery Complete

════════════════════════════════════════════════════════

📊 Domains Discovered

1. billing                  ████████░░ 89%
   Evidence:
   • 15 cohesive files in src/billing/
   • Clear API boundaries (/api/billing/*)
   • Dedicated database tables
   • Consistent naming (BillingService, InvoiceController)

   Files: subscription.service.ts, invoice.service.ts, payment.controller.ts
   Status: No agent exists
   Recommendation: CREATE AGENT

2. inventory               ██████████ 94%
   Evidence:
   • 22 files in src/inventory/
   • Complex API structure (/api/inventory/*)
   • 8 database models
   • High internal coupling

   Status: No agent exists
   Recommendation: CREATE AGENT

3. authentication          █████████░ 87%
   Evidence:
   • 8 files in src/auth/
   • Well-defined API (/api/auth/*)

   Status: ✅ Agent exists (.claude/agents/auth.md)
   Recommendation: SKIP

════════════════════════════════════════════════════════

📋 Summary

Domains to create agents for:
  • billing (89% confidence)
  • inventory (94% confidence)

Existing domain agents:
  • authentication (already covered)

════════════════════════════════════════════════════════

Would you like to generate agents for the discovered domains?

This will create:
  • .claude/agents/billing.md
  • .claude/agents/inventory.md

Generate agents? (y/n): > _______________________________
```

### Step 4: Generate Agents (If Confirmed)

If user confirms, use **parallel generator agents**:

```bash
# For each domain, spawn parallel generators
Task("agent-generator-billing", "Generate .claude/agents/billing.md by analyzing src/billing/ code patterns.")

Task("agent-generator-inventory", "Generate .claude/agents/inventory.md by analyzing src/inventory/ code patterns.")

# Validate all generated agents
Task("agent-validator", "Validate all newly generated agents.")
```

**Generator Agent Guidelines:**

For each domain agent being generated:

1. **Analyze domain files**:
   ```bash
   Read("src/billing/subscription.service.ts")
   Read("src/billing/invoice.service.ts")
   Read("src/billing/payment.controller.ts")
   ```

2. **Extract real examples** (NEVER use placeholders):
   ```markdown
   ## Real Examples from This Project

   ```typescript
   // Actual pattern from src/billing/subscription.service.ts
   export class SubscriptionService {
     async createSubscription(userId: string, planId: string) {
       const plan = await this.plans.findById(planId);
       const customer = await this.stripe.customers.create({
         metadata: { userId }
       });
       // ... actual implementation
     }
   }
   ```
   ```

3. **Document domain-specific rules**:
   ```markdown
   ## Business Rules

   1. **Subscription Lifecycle**:
      - All subscriptions must have a Stripe subscription ID
      - Status changes: trial → active → past_due → canceled
      - Cancellations are soft deletes

   2. **Proration**:
      - Always use Stripe's built-in proration
      - Never calculate proration manually
   ```

4. **Follow agent template structure**:
   ```markdown
   ---
   name: billing
   description: Handles all billing, subscriptions, and payment logic
   model: sonnet
   tools: Read, Write, Edit, Glob, Grep, Bash
   ---

   # Billing Agent

   You implement billing features for this project.

   ## Your Scope

   - Subscription management (create, update, cancel)
   - Invoice generation and handling
   - Payment processing via Stripe
   - Webhook handling for Stripe events

   ## NOT Your Scope

   - User authentication → @backend or @auth
   - Frontend components → @frontend
   - Tests → @tester

   ## Project-Specific Patterns

   [Real patterns extracted from code]

   ## Real Examples from This Project

   [Real code examples]

   ## Business Rules

   [Domain-specific rules]

   ## Integration Patterns

   [How this domain integrates with others]

   ## Rules

   1. ALWAYS follow patterns from real examples
   2. NEVER introduce new patterns without user approval
   3. ALWAYS use Stripe for payment processing
   4. ALWAYS handle webhook idempotency
   ```

**Validator Agent Guidelines:**

After generation, validate each agent:

1. **Structural validation**:
   - Has frontmatter with name, description, model, tools
   - Has clear sections: Scope, Patterns, Examples, Rules
   - Markdown is well-formed

2. **Content validation**:
   - Contains REAL examples (not placeholders)
   - Examples are from actual project files
   - Patterns match project conventions

3. **Completeness validation**:
   - Domain boundaries clearly defined
   - Integration patterns documented
   - Error handling covered

If validation fails, **regenerate** that agent.

### Step 5: Display Results

After all agents generated and validated:

```
✅ Domain Agents Generated

Created agents for 2 domains:

  • .claude/agents/billing.md ✓
  • .claude/agents/inventory.md ✓

════════════════════════════════════════════════════════

📋 Agent Summary

Billing Agent:
  • Handles subscriptions, payments, invoices
  • Integrates with Stripe
  • 6 real code examples included

Inventory Agent:
  • Manages products, stock, warehouses
  • Handles allocation and reservations
  • 8 real code examples included

════════════════════════════════════════════════════════

🎯 How to Use

In your prompts, mention the domain agent:

  "Hey @billing, add a feature to pause subscriptions"
  "Hey @inventory, implement low-stock alerts"

════════════════════════════════════════════════════════

Next Steps:

  1. Review generated agents in .claude/agents/
  2. Customize if needed
  3. Run /agentful-start to use them in development

────────────────────────────────────────────────────────

Updated architecture.json with discovered domains.
```

### Step 6: Update Architecture

Update `.agentful/architecture.json`:

```json
{
  "analysis_date": "2026-01-20T00:00:00Z",
  "domains": [
    {
      "name": "billing",
      "confidence": 0.89,
      "agent_path": ".claude/agents/billing.md",
      "file_count": 15,
      "key_files": ["src/billing/subscription.service.ts"],
      "external_services": ["Stripe"]
    },
    {
      "name": "inventory",
      "confidence": 0.94,
      "agent_path": ".claude/agents/inventory.md",
      "file_count": 22
    }
  ]
}
```

---

## Re-running Discovery

User can run `/agentful-agents` again to discover new domains as codebase grows:

```
🔍 Re-analyzing Domains

Last discovery: 3 days ago

Changes detected:
  • 12 new files in src/notifications/
  • New API routes: /api/notifications/*

New domain discovered:

1. notifications           ████████░░ 82%
   Status: No agent exists
   Recommendation: CREATE AGENT

Would you like to generate an agent for notifications? (y/n)
```

---

## Agent Types Identified

This command discovers:

### Domain Agents (Discovered)

Based on actual code patterns:
- **billing** - Subscription, payments, invoicing
- **inventory** - Stock management, allocation
- **authentication** - Login, sessions, tokens
- **notifications** - Email, push, SMS
- **content** - CMS, articles, media
- **analytics** - Tracking, reporting
- **messaging** - Chat, comments
- **search** - Indexing, querying
- **admin** - Admin panel, user management

**Key:** Domains are DISCOVERED, not hardcoded.

### Missing Core Agents (Checked)

Standard agentful agents that should exist:
- `backend.md` - General backend implementation
- `frontend.md` - General frontend implementation
- `tester.md` - Test generation
- `reviewer.md` - Code review
- `fixer.md` - Bug fixes
- `architect.md` - Tech stack analysis
- `orchestrator.md` - Task coordination

---

## Output Structure

Generated agents go in:

```
.claude/agents/
├── billing.md              # Domain agent
├── inventory.md            # Domain agent
└── [domain].md             # More domains as discovered
```

---

## Example Flows

### Flow 1: First-Time Discovery

```
User: /agentful-agents

Command: → Detects codebase exists
         → Spawns 4 parallel explorers
         → Validator aggregates findings
         → Presents 3 domains discovered
         → 2 need agents, 1 already has agent

User: [Confirms generation]

Command: → Spawns 2 parallel generators
         → Spawns validator
         → All tasks complete
         → Displays results
         → Updates architecture.json
```

### Flow 2: No Codebase Yet

```
User: /agentful-agents

Command: → Detects no code exists
         → NO_CODEBASE mode
         → Shows options

User: [Chooses option 1]

Command: "Run /agentful-start to begin."
```

### Flow 3: Missing Architecture

```
User: /agentful-agents

Command: → Detects no architecture.json
         → NEED_ARCHITECTURE mode
         → Suggests /agentful-start

User: [Confirms]

Command: → Delegates to /agentful-start
```

### Flow 4: Re-Discovery

```
User: /agentful-agents [Ran before, codebase grew]

Command: → Detects previous discovery
         → Compares current vs last
         → Finds 1 new domain
         → Offers to generate agent

User: [Confirms]

Command: → Generates notification agent
         → Updates architecture.json
```

---

## Quality Checklist

Generated agents must have:

- [ ] Real code examples (NO placeholders)
- [ ] Domain-specific business rules
- [ ] Clear scope definition
- [ ] Integration patterns
- [ ] Error handling strategies
- [ ] Database schema documentation
- [ ] Proper markdown formatting
- [ ] Valid frontmatter

---

## Important Rules

1. **NEVER hardcode domain names** - discover from code
2. **ALWAYS use parallel sub-agents** for exploration
3. **ALWAYS validate with user** before generating
4. **ALWAYS use real code examples** (never placeholders)
5. **ALWAYS validate generated agents** before reporting success
6. **NEVER assume** - if evidence is weak, flag as low confidence
7. **ALWAYS respect existing agents** - don't overwrite without asking
8. **ALWAYS update architecture.json** with discovery results

---

## Success Criteria

This command succeeds when:

1. **Discovery**: Domains accurately identified from code patterns
2. **Validation**: User confirms findings before generation
3. **Generation**: All agents contain real examples from the project
4. **Validation**: All generated agents pass structural and content checks
5. **Integration**: Architecture updated with domain metadata
6. **Usability**: User can immediately use generated agents with @mentions

---

## Advanced: Custom Explorers

Users can add custom exploration logic:

Create `.agentful/explorers/custom-explorer.md`:

```markdown
---
name: custom-domain-explorer
description: Custom logic for discovering domains specific to this project
---

# Custom Domain Explorer

[User's custom exploration logic]
```

The command will automatically detect and use custom explorers alongside built-in ones.

---

## Notes

- Domain discovery is **heuristic-based** - confidence scores reflect uncertainty
- Low confidence domains (< 60%) are filtered out
- High confidence domains (> 85%) are strong candidates
- Generated agents are **starting points** - users should customize
- Re-run discovery as codebase evolves
