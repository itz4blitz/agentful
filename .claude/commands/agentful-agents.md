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
has_custom_agents = exists(".claude/agents/") && count_custom_agents() > 0

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

### Process

```
⚠️  No Codebase Detected

I can't discover domain agents because there's no code to analyze yet.

Domain agents are specialized agents for your project's business domains
(e.g., billing, authentication, inventory, content management).

Options:

  [1] Start building features first
      Run /agentful-start to implement features.
      I'll discover domains as your code grows.

  [2] Manually define domains
      You can create domain agents yourself in .claude/agents/

  [3] Skip for now
      Continue with core agents (backend, frontend, tester, etc.)

Your choice: > _______________________________
```

If user chooses [1]:
```
Run /agentful-start to begin feature implementation.

After you have some code, run /agentful-agents again to discover domains.
```

If user chooses [2]:
```
Create domain agents manually in:
  .claude/agents/your-domain-name.md

Example structure:
  ---
  name: billing
  description: Handles all billing and payment logic
  ---

  # Billing Agent

  [Your domain-specific patterns and rules]
```

---

## Mode 2: NEED_ARCHITECTURE (Missing Architecture Analysis)

When `.agentful/architecture.json` doesn't exist.

### Process

```
🔍 Architecture Analysis Needed

Before discovering domain agents, I need to understand your tech stack
and code patterns.

This will:
  - Detect your programming language and frameworks
  - Identify code organization patterns
  - Generate specialized tech stack agents (e.g., nextjs-specialist)

Run /agentful-start first, which will:
  1. Trigger architect agent to analyze your project
  2. Generate tech stack agents
  3. Then you can run /agentful-agents to discover domain agents

Would you like to run /agentful-start now? (y/n): > _______________________________
```

If yes:
```
Delegating to /agentful-start...
```

If no:
```
Run /agentful-start when you're ready.
After architecture analysis completes, run /agentful-agents to discover domains.
```

---

## Mode 3: DISCOVERY (Main Workflow)

When codebase exists and architecture analyzed.

### Step 1: Explore Codebase for Domain Patterns

Use **parallel explorer agents** to analyze different aspects:

```bash
# Launch parallel exploration tasks
Task("domain-explorer-cohesion", "Analyze code cohesion to identify logical domains based on file groupings, imports, and dependencies. Output domain candidates with confidence scores.")

Task("domain-explorer-naming", "Analyze naming patterns in files, folders, classes, and modules to identify business domain terminology. Output domain candidates from naming analysis.")

Task("domain-explorer-database", "Analyze database schemas, models, and entities to identify data domains. Output domain candidates from data analysis.")

Task("domain-explorer-api", "Analyze API routes, controllers, and endpoints to identify domain boundaries. Output domain candidates from API structure.")
```

**Explorer Agent Guidelines:**

Each explorer uses different heuristics:

1. **Cohesion Explorer**:
   - Looks for file clusters with high internal coupling
   - Analyzes import graphs to find modules that depend on each other
   - Identifies folders with cohesive purpose
   - Outputs confidence based on coupling strength

2. **Naming Explorer**:
   - Scans for business domain terms (billing, auth, inventory, etc.)
   - Detects consistent naming patterns across files
   - Finds domain prefixes (BillingService, AuthController, etc.)
   - Outputs confidence based on naming consistency

3. **Database Explorer**:
   - Analyzes database schemas/models
   - Identifies entity relationships that define domains
   - Finds bounded contexts in data layer
   - Outputs confidence based on entity cohesion

4. **API Explorer**:
   - Maps API routes to business capabilities
   - Identifies controller/handler groupings
   - Finds REST resource patterns
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
        "Shared imports: stripe, payments, invoices",
        "Low coupling to other domains"
      ],
      "files": [
        "src/billing/subscription.service.ts",
        "src/billing/invoice.service.ts",
        "src/billing/payment.controller.ts"
      ]
    }
  ]
}
```

### Step 2: Aggregate and Validate Findings

After all explorers complete, **aggregate their results**:

```bash
Task("domain-validator", "Aggregate findings from all explorers. Merge overlapping domain candidates. Validate each domain has sufficient evidence. Rank by confidence. Check against existing agents in .claude/agents/ to identify gaps.")
```

**Validator Agent Guidelines:**

1. **Merge overlapping domains**:
   - If "billing" found by 3 explorers → strong signal
   - If "payments" and "billing" overlap → consolidate
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

4. **Identify missing core agents**:
   - Check for standard agentful agents: backend, frontend, tester, reviewer, fixer, architect, orchestrator
   - Flag if any are missing (user might have deleted them)

**Validator Output Format:**

```json
{
  "discovered_domains": [
    {
      "name": "billing",
      "confidence": 0.89,
      "sources": ["cohesion", "naming", "database", "api"],
      "has_existing_agent": false,
      "evidence_summary": "Strong domain detected: 15 files, clear API boundaries, dedicated database tables",
      "recommendation": "CREATE_AGENT"
    },
    {
      "name": "authentication",
      "confidence": 0.92,
      "sources": ["cohesion", "naming", "api"],
      "has_existing_agent": true,
      "existing_agent_path": ".claude/agents/auth.md",
      "evidence_summary": "Well-established domain with existing agent",
      "recommendation": "SKIP"
    }
  ],
  "missing_core_agents": [],
  "agent_gaps": [
    {
      "domain": "billing",
      "type": "domain",
      "reason": "Domain detected but no agent exists"
    }
  ]
}
```

### Step 3: Present Findings to User

Display comprehensive analysis:

```
🔍 Domain Discovery Complete

Analyzed your codebase to identify logical domains.

════════════════════════════════════════════════════════

📊 Domains Discovered

1. billing                  ████████░░ 89%
   Evidence:
   • 15 cohesive files in src/billing/
   • Clear API boundaries (/api/billing/*, /api/subscriptions/*)
   • Dedicated database tables (subscriptions, invoices, payments)
   • Consistent naming (BillingService, InvoiceController)

   Files involved:
   - src/billing/subscription.service.ts
   - src/billing/invoice.service.ts
   - src/billing/payment.controller.ts
   - src/billing/proration.ts
   - ... 11 more files

   Status: No agent exists
   Recommendation: CREATE AGENT

2. inventory               ██████████ 94%
   Evidence:
   • 22 files in src/inventory/
   • Complex API structure (/api/inventory/*, /api/stock/*)
   • 8 database models (Product, Stock, Warehouse, Allocation)
   • High internal coupling, low external coupling

   Status: No agent exists
   Recommendation: CREATE AGENT

3. authentication          █████████░ 87%
   Evidence:
   • 8 files in src/auth/
   • Well-defined API (/api/auth/*)
   • Database tables (users, sessions, tokens)

   Status: ✅ Agent exists (.claude/agents/auth.md)
   Recommendation: SKIP

════════════════════════════════════════════════════════

📋 Summary

Domains to create agents for:
  • billing (89% confidence)
  • inventory (94% confidence)

Existing domain agents:
  • authentication (already covered)

Core agents status: ✅ All present
  • backend, frontend, tester, reviewer, fixer, architect, orchestrator

════════════════════════════════════════════════════════

Would you like to generate agents for the discovered domains?

This will create:
  • .claude/agents/billing.md
  • .claude/agents/inventory.md

Each agent will include:
  - Domain-specific patterns from your code
  - Real examples from your codebase
  - Business logic guidelines
  - Integration patterns
  - Documentation

Generate agents? (y/n): > _______________________________
```

### Step 4: Generate Agents (If Confirmed)

If user confirms, use **parallel generator agents**:

```bash
# For each domain to create, spawn parallel generators
Task("agent-generator-billing", "Generate .claude/agents/billing.md by analyzing src/billing/ code patterns. Include real examples, business rules, integration patterns. Follow agent template structure.")

Task("agent-generator-inventory", "Generate .claude/agents/inventory.md by analyzing src/inventory/ code patterns. Include real examples, business rules, integration patterns. Follow agent template structure.")

# In parallel, generate documentation
Task("doc-generator-billing", "Generate .claude/agents/billing.README.md with domain overview, responsibilities, when to use this agent, and integration examples.")

Task("doc-generator-inventory", "Generate .claude/agents/inventory.README.md with domain overview, responsibilities, when to use this agent, and integration examples.")

# Validate all generated agents
Task("agent-validator", "Validate all newly generated agents. Check they follow template structure, have real examples (not placeholders), follow project conventions, are syntactically correct markdown.")
```

**Generator Agent Guidelines:**

For each domain agent being generated:

1. **Analyze domain files**:
   ```bash
   # Read representative files from the domain
   Read("src/billing/subscription.service.ts")
   Read("src/billing/invoice.service.ts")
   Read("src/billing/payment.controller.ts")

   # Understand patterns
   - How are services structured?
   - What are common patterns?
   - How is error handling done?
   - What external services are used?
   ```

2. **Extract real examples** (NEVER use placeholders):
   ```markdown
   ## Real Examples from This Project

   ```typescript
   // Actual pattern from src/billing/subscription.service.ts
   export class SubscriptionService {
     async createSubscription(userId: string, planId: string) {
       const plan = await this.plans.findById(planId);
       if (!plan) {
         throw new NotFoundError('Plan not found');
       }

       const customer = await this.stripe.customers.create({
         metadata: { userId }
       });

       const subscription = await this.stripe.subscriptions.create({
         customer: customer.id,
         items: [{ price: plan.stripePriceId }]
       });

       return this.subscriptions.create({
         userId,
         planId,
         stripeSubscriptionId: subscription.id,
         status: 'active'
       });
     }
   }
   ```
   ```

3. **Document domain-specific rules**:
   ```markdown
   ## Business Rules

   From analyzing this project's billing domain:

   1. **Subscription Lifecycle**:
      - All subscriptions must have a Stripe subscription ID
      - Status changes go through: trial → active → past_due → canceled
      - Cancellations are soft deletes (canceled_at timestamp)

   2. **Proration**:
      - Always use Stripe's built-in proration
      - Never calculate proration manually
      - Proration credits are applied automatically

   3. **Invoice Generation**:
      - Invoices are created via Stripe webhooks
      - Store invoices locally for faster queries
      - Sync every 24 hours to catch missed webhooks
   ```

4. **Follow agent template structure**:
   ```markdown
   ---
   name: billing
   description: Handles all billing, subscriptions, and payment logic for this project
   model: sonnet
   tools: Read, Write, Edit, Glob, Grep, Bash
   ---

   # Billing Agent

   You implement billing features for this project.

   ## Your Scope

   - Subscription management (create, update, cancel, upgrade/downgrade)
   - Invoice generation and handling
   - Payment processing via Stripe
   - Proration calculations
   - Usage tracking and metering
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

   ## External Services

   [Stripe, payment gateways, etc.]

   ## Error Handling

   [Domain-specific error patterns]

   ## Database Schema

   [Relevant models/tables]

   ## Rules

   1. ALWAYS follow patterns from real examples
   2. NEVER introduce new patterns without user approval
   3. ALWAYS use Stripe for payment processing (don't roll your own)
   4. ALWAYS handle webhook idempotency
   5. NEVER expose Stripe internals to other domains
   ```

**Documentation Generator Guidelines:**

For each domain, create a `README.md`:

```markdown
# Billing Agent

> Domain agent for billing, subscriptions, and payment processing

## Overview

This agent handles all billing-related functionality in the project, including:
- Subscription lifecycle management
- Payment processing via Stripe
- Invoice generation and management
- Proration and usage tracking

## When to Use This Agent

Use `@billing` when:
- ✅ Implementing subscription features
- ✅ Adding payment processing
- ✅ Handling Stripe webhooks
- ✅ Calculating proration or usage charges
- ✅ Generating invoices

Do NOT use this agent for:
- ❌ User authentication (use @auth or @backend)
- ❌ UI components (use @frontend)
- ❌ Testing (use @tester)

## Domain Boundaries

**Owns:**
- `src/billing/` - All billing services and logic
- `src/stripe/` - Stripe integration
- Database tables: subscriptions, invoices, payments

**Integrates with:**
- `@auth` - For user identification
- `@backend` - For API endpoints
- `@frontend` - Provides data for billing UI

## Architecture

```
┌─────────────────────────────────────┐
│         Frontend (UI)               │
│  - Pricing page                     │
│  - Checkout flow                    │
│  - Account/Billing                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      API Layer (Controllers)        │
│  - POST /api/subscriptions          │
│  - PUT /api/subscriptions/:id       │
│  - POST /api/webhooks/stripe        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      Billing Domain (Services)      │ ◄─── @billing manages this
│  - SubscriptionService              │
│  - InvoiceService                   │
│  - PaymentService                   │
│  - ProrationService                 │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│       Stripe Integration            │
│  - Stripe API client                │
│  - Webhook handlers                 │
│  - Event processing                 │
└─────────────────────────────────────┘
```

## Example Usage

### Creating a subscription

```typescript
// @billing handles this implementation
const subscription = await billingService.createSubscription({
  userId: user.id,
  planId: 'pro-monthly',
  paymentMethodId: 'pm_xxx'
});
```

### Handling upgrades/downgrades

```typescript
// @billing knows to use Stripe proration
const updated = await billingService.updateSubscription({
  subscriptionId: sub.id,
  newPlanId: 'enterprise-yearly',
  prorationBehavior: 'create_prorations' // Stripe handles this
});
```

### Processing webhooks

```typescript
// @billing implements webhook idempotency
const event = await billingService.processStripeWebhook({
  signature: req.headers['stripe-signature'],
  payload: req.body
});
```

## Key Responsibilities

1. **Subscription Management**
   - Create subscriptions with Stripe
   - Update/upgrade/downgrade plans
   - Cancel subscriptions (with proper lifecycle)
   - Handle trial periods

2. **Payment Processing**
   - Process payments via Stripe
   - Handle payment failures
   - Retry failed payments
   - Update payment methods

3. **Invoice Management**
   - Generate invoices
   - Store invoice data locally
   - Sync with Stripe
   - Handle invoice disputes

4. **Webhook Handling**
   - Process Stripe events
   - Ensure idempotency
   - Update local state
   - Trigger notifications

5. **Proration**
   - Calculate proration for plan changes
   - Apply credits correctly
   - Handle timing edge cases

## Common Patterns

See the agent file (`.claude/agents/billing.md`) for:
- Real code examples from this project
- Business rules specific to this domain
- Integration patterns with other domains
- Error handling strategies
- Database schema details

## Testing

When implementing billing features:
- Write unit tests for business logic
- Integration tests for Stripe API calls
- Mock Stripe webhooks for testing
- Test proration calculations
- Verify idempotency

Use `@tester` to generate appropriate tests.

## Related Agents

- `@backend` - Implements API controllers
- `@frontend` - Implements billing UI
- `@tester` - Writes tests for billing features
- `@reviewer` - Reviews billing code for security
```

**Validator Agent Guidelines:**

After generation, validate each agent:

1. **Structural validation**:
   - Has frontmatter with name, description, model, tools
   - Has clear sections: Scope, Patterns, Examples, Rules
   - Markdown is well-formed

2. **Content validation**:
   - Contains REAL examples (not "[paste code here]" placeholders)
   - Examples are from actual project files
   - Patterns match project conventions
   - No generic/template content

3. **Completeness validation**:
   - Domain boundaries clearly defined
   - Integration patterns documented
   - Error handling covered
   - External services documented (if any)

4. **Report issues**:
   ```json
   {
     "agent": "billing",
     "valid": false,
     "issues": [
       "Contains placeholder '[Insert example here]' instead of real code",
       "Missing error handling section",
       "No database schema documentation"
     ]
   }
   ```

If validation fails, **regenerate** that agent.

### Step 5: Display Results

After all agents generated and validated:

```
✅ Domain Agents Generated

Created agents for 2 domains:

  • .claude/agents/billing.md ✓
  • .claude/agents/inventory.md ✓

Documentation:

  • .claude/agents/billing.README.md ✓
  • .claude/agents/inventory.README.md ✓

════════════════════════════════════════════════════════

📋 Agent Summary

Billing Agent:
  • Handles subscriptions, payments, invoices
  • Integrates with Stripe
  • Manages proration and usage tracking
  • 6 real code examples included
  • 12 business rules documented

Inventory Agent:
  • Manages products, stock, warehouses
  • Handles allocation and reservations
  • Prevents overselling with locking
  • 8 real code examples included
  • 15 business rules documented

════════════════════════════════════════════════════════

🎯 How to Use

In your prompts, mention the domain agent:

  "Hey @billing, add a feature to pause subscriptions"
  "Hey @inventory, implement low-stock alerts"

The orchestrator will automatically delegate to the specialized agent.

════════════════════════════════════════════════════════

Next Steps:

  1. Review generated agents in .claude/agents/
  2. Customize if needed (they're markdown files)
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
      "key_files": [
        "src/billing/subscription.service.ts",
        "src/billing/invoice.service.ts"
      ],
      "external_services": ["Stripe"],
      "database_models": ["Subscription", "Invoice", "Payment"]
    },
    {
      "name": "inventory",
      "confidence": 0.94,
      "agent_path": ".claude/agents/inventory.md",
      "file_count": 22,
      "key_files": [
        "src/inventory/allocation.service.ts",
        "src/inventory/stock.service.ts"
      ],
      "database_models": ["Product", "Stock", "Warehouse", "Allocation"]
    },
    {
      "name": "authentication",
      "confidence": 0.87,
      "agent_path": ".claude/agents/auth.md",
      "file_count": 8,
      "key_files": [
        "src/auth/auth.service.ts"
      ],
      "external_services": ["NextAuth"],
      "database_models": ["User", "Session"]
    }
  ],
  "domain_discovery": {
    "last_run": "2026-01-20T00:00:00Z",
    "method": "multi-explorer",
    "explorers_used": ["cohesion", "naming", "database", "api"],
    "domains_discovered": 3,
    "agents_generated": 2,
    "agents_skipped": 1
  }
}
```

---

## Re-running Discovery

User can run `/agentful-agents` again to:
- Discover new domains as codebase grows
- Update existing domain agents with new patterns
- Find domains that were missed

On re-run:
```
🔍 Re-analyzing Domains

Last discovery: 3 days ago

Changes detected:
  • 12 new files in src/notifications/
  • New API routes: /api/notifications/*
  • Database tables added: notifications, preferences

Running discovery again...

════════════════════════════════════════════════════════

New domain discovered:

1. notifications           ████████░░ 82%
   Evidence:
   • 12 files in src/notifications/
   • API endpoints for push/email/sms
   • Database tables for notifications

   Status: No agent exists
   Recommendation: CREATE AGENT

════════════════════════════════════════════════════════

Would you like to generate an agent for notifications? (y/n)
```

---

## Agent Types Identified

This command discovers:

### 1. Domain Agents (Discovered)

Based on actual code patterns:
- **billing** - Subscription, payments, invoicing
- **inventory** - Stock management, allocation
- **authentication** - Login, sessions, tokens
- **notifications** - Email, push, SMS
- **content** - CMS, articles, media
- **analytics** - Tracking, reporting, dashboards
- **compliance** - GDPR, audit logs, data privacy
- **messaging** - Chat, comments, threads
- **search** - Indexing, querying, filtering
- **admin** - Admin panel, user management

**Key:** Domains are DISCOVERED, not hardcoded. Every project is different.

### 2. Missing Core Agents (Checked)

Standard agentful agents that should exist:
- `backend.md` - General backend implementation
- `frontend.md` - General frontend implementation
- `tester.md` - Test generation and execution
- `reviewer.md` - Code review and quality
- `fixer.md` - Bug fixes and corrections
- `architect.md` - Tech stack analysis
- `orchestrator.md` - Task coordination

If any are missing (user deleted them), flag as gap.

---

## Output Structure

Generated agents go in:

```
.claude/agents/
├── billing.md              # Domain agent
├── billing.README.md       # Domain documentation
├── inventory.md            # Domain agent
├── inventory.README.md     # Domain documentation
└── [domain].md             # More domains as discovered
```

**NOT** in `auto-generated/` because:
- These are domain agents (not tech stack agents)
- They contain business logic (not framework patterns)
- They should be customized by users

---

## Example Flows

### Flow 1: First-Time Discovery

```
User: /agentful-agents

Command: [Detects codebase exists]
         [Detects architecture.json exists]
         [Enters DISCOVERY mode]

         [Spawns 4 parallel explorers]
         [Explorers analyze code]
         [Validator aggregates findings]

         [Presents 3 domains discovered]
         [2 need agents, 1 already has agent]

User: [Confirms generation]

Command: [Spawns 2 parallel generators]
         [Spawns 2 parallel doc generators]
         [Spawns validator]

         [All tasks complete]
         [Validation passes]

         [Displays results]
         [Updates architecture.json]
```

### Flow 2: No Codebase Yet

```
User: /agentful-agents

Command: [Detects no code exists]
         [Enters NO_CODEBASE mode]

         "⚠️ No Codebase Detected

         Options:
           [1] Start building features first
           [2] Manually define domains
           [3] Skip for now"

User: [Chooses option 1]

Command: "Run /agentful-start to begin.
         After you have code, run /agentful-agents."
```

### Flow 3: Missing Architecture

```
User: /agentful-agents

Command: [Detects no architecture.json]
         [Enters NEED_ARCHITECTURE mode]

         "🔍 Architecture Analysis Needed

         Run /agentful-start first."

User: [Confirms]

Command: [Delegates to /agentful-start]
         [Architecture analysis runs]
         [Returns]

         "Architecture analysis complete.
         Run /agentful-agents again to discover domains."
```

### Flow 4: Re-Discovery

```
User: /agentful-agents
      [Ran before, codebase grew]

Command: [Detects previous discovery]
         [Compares current vs last analysis]

         "🔍 Re-analyzing Domains

         Changes detected: 12 new files in src/notifications/

         [Runs discovery]
         [Finds 1 new domain]

         New domain: notifications (82%)

         Generate agent? (y/n)"

User: [Confirms]

Command: [Generates notification agent]
         [Updates architecture.json]
```

---

## Quality Checklist

Generated agents must have:

- [ ] Real code examples (NO placeholders like "[insert code]")
- [ ] Domain-specific business rules
- [ ] Clear scope definition
- [ ] Integration patterns with other domains
- [ ] Error handling strategies
- [ ] Database schema documentation (if applicable)
- [ ] External service documentation (if applicable)
- [ ] Proper markdown formatting
- [ ] Valid frontmatter

Documentation must have:

- [ ] Domain overview
- [ ] When to use this agent
- [ ] Architecture diagram (if complex)
- [ ] Common patterns and examples
- [ ] Integration points
- [ ] Key responsibilities

---

## Important Rules

1. **NEVER hardcode domain names** - discover from code
2. **ALWAYS use parallel sub-agents** for exploration
3. **ALWAYS validate with user** before generating
4. **ALWAYS use real code examples** (never placeholders)
5. **ALWAYS generate documentation** alongside agents
6. **ALWAYS validate generated agents** before reporting success
7. **NEVER assume** - if evidence is weak, flag as low confidence
8. **ALWAYS respect existing agents** - don't overwrite without asking
9. **ALWAYS update architecture.json** with discovery results
10. **NEVER skip validation** - all generated agents must pass checks

---

## Success Criteria

This command succeeds when:

1. **Discovery**: Domains accurately identified from code patterns (not guesses)
2. **Validation**: User confirms findings before generation
3. **Generation**: All agents contain real examples from the project
4. **Documentation**: Each agent has comprehensive README
5. **Validation**: All generated agents pass structural and content checks
6. **Integration**: Architecture updated with domain metadata
7. **Usability**: User can immediately use generated agents with @mentions

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
- Low confidence domains (< 60%) are filtered out to avoid false positives
- High confidence domains (> 85%) are strong candidates for agent generation
- Generated agents are **starting points** - users should customize them
- Re-run discovery as codebase evolves to find new domains
- Domain agents complement tech stack agents (generated by architect)

---

## Integration with Other Commands

- **Before**: Run `/agentful-start` to ensure architecture analyzed
- **After**: Use generated agents in development with `@domain-name`
- **Continuous**: Re-run periodically as codebase grows
- **Refinement**: Manually edit agents in `.claude/agents/` as needed
