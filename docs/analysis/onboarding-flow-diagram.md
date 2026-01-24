# Agentful Onboarding Flow - Visual Diagram

## Current vs. Proposed Flow

### Current Flow (Passive)

```
┌─────────────────────────────────────────────────────────────┐
│                    USER JOURNEY (Current)                    │
└─────────────────────────────────────────────────────────────┘

Step 1: Init
  npx agentful init
    ↓
  📁 .claude/ created
  📄 Product template copied (with placeholders)

Step 2: Manual Editing (❌ Friction Point)
  vim .claude/product/index.md
    ↓
  User stares at template
  "What should I write here?"
  Copies examples, deletes placeholders

Step 3: Start Claude
  claude
    ↓
  Claude Code starts (no guidance)

Step 4: Run Development (❌ Friction Point)
  /agentful-start
    ↓
  May fail if spec incomplete
  No immediate feedback

Step 5: Wait for Issues (❌ Friction Point)
  Agent writes to decisions.json
  User doesn't know
  Work stalls silently

Step 6: Eventually Discover (❌ Friction Point)
  User runs /agentful-status
  Sees pending decisions
  Runs /agentful-decide (manual)

RESULT: 30+ minutes to first feature, high abandonment
```

### Proposed Flow (Proactive + Interactive)

```
┌─────────────────────────────────────────────────────────────┐
│                   USER JOURNEY (Proposed)                    │
└─────────────────────────────────────────────────────────────┘

Step 1: First Run Detection
  /agentful-start (first time)
    ↓
  ┌──────────────────────────────────────────┐
  │ 💬 "Looks like your first time!          │
  │    Run interactive setup? (2 min)"       │
  │                                          │
  │ [A] Yes, guide me through setup          │
  │ [B] No, I'll configure manually          │
  └──────────────────────────────────────────┘
    ↓ (User: A)

Step 2: Context Detection
  ┌──────────────────────────────────────────┐
  │ 💬 "What type of project?"               │
  │                                          │
  │ [A] Starting new project                 │
  │ [B] Have existing code                   │
  │ [C] Skip setup                           │
  └──────────────────────────────────────────┘
    ↓ (User: A)

Step 3: Product Vision
  ┌──────────────────────────────────────────┐
  │ 💬 "What are you building? (1-2 sent.)"  │
  │                                          │
  │ Examples:                                │
  │ - "Task management for remote teams"     │
  │ - "E-commerce for handmade goods"        │
  │                                          │
  │ [ User types vision ]                    │
  └──────────────────────────────────────────┘
    ↓

Step 4: Tech Stack (Auto-Detected)
  🔍 Scanning package.json...
  ✓ Detected: Next.js 14, PostgreSQL, Prisma
    ↓
  ┌──────────────────────────────────────────┐
  │ 💬 "I detected your tech stack.          │
  │    Is this correct?"                     │
  │                                          │
  │ Detected:                                │
  │ - Frontend: Next.js 14                   │
  │ - Backend: Next.js API Routes            │
  │ - Database: PostgreSQL + Prisma          │
  │                                          │
  │ [A] Yes, looks right                     │
  │ [B] No, let me specify                   │
  └──────────────────────────────────────────┘
    ↓ (User: A)

Step 5: Core Features
  ┌──────────────────────────────────────────┐
  │ 💬 "What are 3-5 core features?"         │
  │                                          │
  │ Based on your vision, I suggest:         │
  │ - User authentication                    │
  │ - Task CRUD operations                   │
  │ - Real-time updates                      │
  │                                          │
  │ [ User confirms or customizes ]          │
  └──────────────────────────────────────────┘
    ↓

Step 6: Development Preferences
  ┌──────────────────────────────────────────┐
  │ 💬 "How should agentful work?"           │
  │                                          │
  │ [A] Autonomous (24/7, review checkpoints)│
  │ [B] Collaborative (approve each step)    │
  └──────────────────────────────────────────┘
    ↓

Step 7: Generate + Validate
  🔄 Generating product spec...
  ✓ Created .claude/product/index.md
    ↓
  🔍 Running product analyzer...
  ✓ Readiness: 85%
  ✓ 0 blocking issues
    ↓
  ┌──────────────────────────────────────────┐
  │ ✅ Product spec ready!                   │
  │                                          │
  │ [A] Start building now                   │
  │ [B] Let me review spec first             │
  └──────────────────────────────────────────┘
    ↓ (User: A)

Step 8: Autonomous Development
  🚀 Starting development...
  📝 Building: User Authentication
     ✓ Created auth service (JWT)
     ✓ Generated login component
     ✓ Tests passing
    ↓
  💬 "Need your input: Which auth strategy?"
     [A] JWT (stateless, scales well) ⭐
     [B] Sessions (simple, server-side)
     [C] Custom solution...
    ↓ (User: A - answered immediately)
  🚀 Continuing...
  ✓ Authentication complete!

RESULT: <5 minutes to first feature, zero abandonment
```

## Decision Handling Comparison

### Current (Passive)

```
Agent encounters decision
    ↓
Writes to decisions.json
    ↓
Moves to next feature
    ↓
[Time passes - work stalls]
    ↓
User eventually runs /agentful-status
    ↓
Sees pending decisions
    ↓
Runs /agentful-decide manually
    ↓
Development resumes

LATENCY: Minutes to hours
RISK: High (user may forget)
```

### Proposed (Proactive)

```
Agent encounters decision
    ↓
Writes to decisions.json (history)
    ↓
IMMEDIATELY prompts user
┌────────────────────────────────┐
│ 🚧 Development paused          │
│                                │
│ Question: Auth strategy?       │
│                                │
│ Why it matters:                │
│ - JWT: Stateless, scales       │
│ - Sessions: Simple, stateful   │
│                                │
│ [A] JWT ⭐ Recommended          │
│ [B] Sessions                   │
│ [C] Decide later               │
└────────────────────────────────┘
    ↓ (User answers in real-time)
Development continues immediately

LATENCY: Seconds
RISK: None (user in the loop)
```

## Architecture Integration Points

```
┌─────────────────────────────────────────────────────────────┐
│                       AGENTFUL SYSTEM                        │
└─────────────────────────────────────────────────────────────┘

Commands Layer
┌───────────────────────────────────────────────────────────┐
│                                                           │
│  /agentful-init ────┐                                     │
│  (NEW)              │                                     │
│                     ├──> AskUserQuestion                  │
│  /agentful-start ───┤     (Interactive Flows)             │
│  (UPDATED)          │                                     │
│                     │                                     │
│  /agentful-decide ──┘                                     │
│  (UPDATED)                                                │
│                                                           │
└───────────────────────────────────────────────────────────┘
           │
           ↓
Orchestrator
┌───────────────────────────────────────────────────────────┐
│                                                           │
│  - Work classification                                    │
│  - Decision prompting (PROACTIVE) ◄── AskUserQuestion     │
│  - State management                                       │
│  - Task delegation                                        │
│                                                           │
└───────────────────────────────────────────────────────────┘
           │
           ↓
Product Analyzer
┌───────────────────────────────────────────────────────────┐
│                                                           │
│  - Readiness scoring                                      │
│  - Blocking issue detection                               │
│  - Tech stack validation                                  │
│  - Quality gates                                          │
│                                                           │
└───────────────────────────────────────────────────────────┘
           │
           ↓
State Files
┌───────────────────────────────────────────────────────────┐
│                                                           │
│  .agentful/                                               │
│  ├── state.json                                           │
│  ├── decisions.json                                       │
│  ├── product-analysis.json                                │
│  ├── setup-progress.json (NEW - temporary)                │
│  └── preferences.json (NEW - permanent)                   │
│                                                           │
│  .claude/product/                                         │
│  └── index.md (auto-generated from interactive setup)     │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

## User Mental Model

### Before (Confusing)

```
User Perspective:
┌────────────────────────────────────────┐
│                                        │
│  "I installed agentful... now what?"   │
│                                        │
│  "What's the difference between        │
│   /agentful-start and /agentful-       │
│   generate?"                           │
│                                        │
│  "Why did development stop?"           │
│                                        │
│  "Which command do I run to fix        │
│   blocking issues?"                    │
│                                        │
└────────────────────────────────────────┘

TOO MANY COMMANDS = COGNITIVE OVERLOAD
```

### After (Clear)

```
User Perspective:
┌────────────────────────────────────────┐
│                                        │
│  "agentful guides me through setup"    │
│  "It asks questions when it needs me"  │
│  "I just answer and it keeps going"    │
│                                        │
│  Simple mental model:                  │
│  1. Run /agentful-start                │
│  2. Answer questions when prompted     │
│  3. Code gets built                    │
│                                        │
└────────────────────────────────────────┘

SINGLE FLOW = ZERO CONFUSION
```

## Implementation Phases

```
Phase 1: MVP (1 week)
┌─────────────────────────────────────────┐
│                                         │
│  ✅ /agentful-init command              │
│  ✅ First-run detection                 │
│  ✅ Proactive decision prompts          │
│  ✅ Setup progress saving               │
│                                         │
│  Impact: 🔥🔥🔥 Transforms UX            │
└─────────────────────────────────────────┘

Phase 2: Polish (2 weeks)
┌─────────────────────────────────────────┐
│                                         │
│  ✅ Reverse-engineering mode            │
│  ✅ Smart context in prompts            │
│  ✅ Intelligent defaults                │
│  ✅ Setup metrics tracking              │
│                                         │
│  Impact: 🔥🔥 Better quality decisions   │
└─────────────────────────────────────────┘

Phase 3: Advanced (1 month)
┌─────────────────────────────────────────┐
│                                         │
│  ✅ Multi-step conversation flows       │
│  ✅ Interactive spec preview            │
│  ✅ Rich input validation               │
│  ✅ Team collaboration                  │
│                                         │
│  Impact: 🔥 Enterprise features         │
└─────────────────────────────────────────┘
```

## Success Metrics Dashboard

```
Onboarding Success Metrics
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  Time to First Feature                                  │
│  ████████████████████████████░░░░░░░░░░ <5 min (80%)    │
│  Target: <5 minutes                                     │
│                                                         │
│  Setup Completion Rate                                  │
│  ███████████████████████████████████░░░ 85%             │
│  Target: >80%                                           │
│                                                         │
│  Product Spec Quality                                   │
│  ███████████████████████████████████░░░ 87%             │
│  Target: >75% readiness score                           │
│                                                         │
│  Blocking Issues on First Run                           │
│  ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0.5/user        │
│  Target: <1 per user                                    │
│                                                         │
│  Setup Abandonment Rate                                 │
│  ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 12%             │
│  Target: <20%                                           │
│                                                         │
└─────────────────────────────────────────────────────────┘

Decision Handling Metrics
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  Decision Response Time                                 │
│  ████████████████████░░░░░░░░░░░░░░░░░ 45 sec avg      │
│  Target: <60 seconds                                    │
│                                                         │
│  Deferred Decisions                                     │
│  ██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 18%             │
│  Target: <25%                                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Example Question Flow (Tech Stack)

```
Question 1: Frontend
┌──────────────────────────────────────────────────────────┐
│ 💬 What frontend framework are you using?                │
│                                                          │
│ [A] Next.js 14 ⭐ (full-stack TypeScript)                │
│ [B] React + Vite (single-page app)                      │
│ [C] Vue + Nuxt (Vue ecosystem)                          │
│ [D] SvelteKit (performance-focused)                     │
│ [E] No frontend (backend only)                          │
│ [F] Something else...                                   │
│                                                          │
│ Context: Your package.json shows Next.js - is this      │
│          correct?                                        │
└──────────────────────────────────────────────────────────┘
    ↓ (User: A)

Question 2: Database
┌──────────────────────────────────────────────────────────┐
│ 💬 What database are you using?                          │
│                                                          │
│ [A] PostgreSQL ⭐ (recommended for Next.js)              │
│ [B] MySQL                                                │
│ [C] MongoDB                                              │
│ [D] SQLite (development/simple apps)                    │
│ [E] Something else...                                   │
│                                                          │
│ Context: PostgreSQL works well with Prisma (detected    │
│          in your dependencies) and scales horizontally   │
└──────────────────────────────────────────────────────────┘
    ↓ (User: A)

Question 3: ORM Confirmation
┌──────────────────────────────────────────────────────────┐
│ 💬 I see Prisma in package.json. Use it for database     │
│    access?                                               │
│                                                          │
│ [A] Yes, use Prisma ⭐                                   │
│ [B] No, use different ORM                               │
│                                                          │
│ Context: Prisma + PostgreSQL + Next.js is a popular     │
│          stack with great TypeScript support             │
└──────────────────────────────────────────────────────────┘
    ↓ (User: A)

Result: Tech stack fully specified in 3 questions (30 sec)
```

## Key Takeaways

1. **Interactive > Passive**: Ask questions proactively, don't wait for user to invoke commands
2. **Context is King**: Every question includes "why" explanation
3. **Smart Defaults**: Recommend based on detected stack, not generic advice
4. **Fail Gracefully**: Save progress, allow resuming, accept custom input
5. **Single Flow**: Consolidate commands into one coherent journey

---

**This visual companion to the strategy document shows:**
- Current vs. proposed user journeys
- Decision handling improvements
- Architecture integration points
- Success metrics visualization
- Example question flows
