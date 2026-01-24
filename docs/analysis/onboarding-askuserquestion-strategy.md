# Agentful Onboarding & AskUserQuestion Integration Strategy

**Date:** 2026-01-23
**Status:** Design Proposal
**Author:** Product Analyzer Agent

---

## Executive Summary

This document provides a comprehensive strategy for transforming agentful's onboarding experience using the `AskUserQuestion` tool to create an interactive, guided setup that gets users from zero-to-shipping in under 5 minutes. The strategy aligns with agentful's core goals: making it the fastest way to ship quality features while minimizing user friction.

**Key Insight:** agentful already has sophisticated product planning (`/agentful-product`) and decision handling (`/agentful-decide`) infrastructure. The opportunity is to **leverage AskUserQuestion proactively** during first-run and critical decision points, rather than passively waiting for users to invoke commands.

---

## 1. Current State Analysis

### 1.1 Existing Onboarding Flow

**Current Experience:**
```bash
# Step 1: User runs init
npx @itz4blitz/agentful init

# Step 2: User manually edits product spec
vim .claude/product/index.md  # Intimidating for new users

# Step 3: User runs Claude Code
claude

# Step 4: User types command
/agentful-start  # May fail if spec incomplete
```

**Pain Points Identified:**

| Pain Point | Impact | Evidence |
|------------|--------|----------|
| **Blank product spec** | Users don't know what to write | Template has placeholders, no guidance |
| **Too many commands** | Analysis paralysis | 8 different `/agentful-*` commands |
| **Passive decision handling** | Work stalls silently | User must remember to run `/agentful-decide` |
| **No validation feedback** | Users ship with blocking issues | Product analyzer runs on-demand only |
| **Copy-paste tech stack** | Boilerplate feels tedious | "Delete what you don't need" approach |

### 1.2 Existing Capabilities (Underutilized)

**Already Built:**
1. **Product Analyzer** (`.claude/agents/product-analyzer.md`)
   - Readiness scoring (0-100%)
   - Blocking issue detection
   - Tech stack validation
   - 5 quality dimensions

2. **Decision Infrastructure** (`.agentful/decisions.json`)
   - Pending/resolved tracking
   - Context preservation
   - Blocking feature references

3. **AskUserQuestion Tool** (orchestrator only)
   - Single question at a time
   - Can chain questions
   - Supports options + custom input
   - **Currently unused except in edge cases**

**Gap:** These powerful tools are disconnected. Product analyzer runs passively, decisions wait for `/agentful-decide`, and AskUserQuestion is barely touched.

---

## 2. Onboarding Flow Design (Interactive First-Run)

### 2.1 The "Killer" First-Run Experience

**Goal:** Zero-to-running in <5 minutes with high-quality product spec output.

**Philosophy:**
- **Smart defaults over configuration**
- **Progressive disclosure** (don't overwhelm)
- **Contextual help** (explain why we're asking)
- **Escape hatches** (allow power users to skip)

### 2.2 Exact Sequence (Step-by-Step)

#### **TRIGGER:** User runs `/agentful-start` for the first time

```javascript
// Detection: First-run logic in /agentful-start
function detectFirstRun() {
  return (
    !exists(".claude/product/index.md") ||                     // No product spec
    fileIsEmpty(".claude/product/index.md") ||                 // Empty spec
    fileContainsPlaceholders(".claude/product/index.md") ||    // Template only
    !exists(".agentful/product-analysis.json")                 // Never analyzed
  );
}
```

#### **Step 1: Welcome & Context Setting**

```javascript
const response = AskUserQuestion({
  question: "Welcome to agentful! Let's set up your project.",
  context: `
I'll ask you a few quick questions to understand what you're building.
This takes about 2 minutes and ensures we generate the right code.

You can always refine this later with /agentful-product.
  `,
  options: [
    { id: 'new', label: "I'm starting a new project", value: 'new' },
    { id: 'existing', label: "I have existing code", value: 'existing' },
    { id: 'skip', label: "Skip setup (I'll configure manually)", value: 'skip' }
  ]
});

if (response.value === 'skip') {
  // Create minimal spec, proceed
  return createMinimalSpec();
}

if (response.value === 'existing') {
  // Reverse-engineer mode
  return reverseEngineerFromCode();
}

// Continue with new project setup...
```

#### **Step 2: Product Vision (1 sentence)**

```javascript
const vision = AskUserQuestion({
  question: "What are you building? (1-2 sentences)",
  context: `
Examples:
- "A task management app for remote teams"
- "An e-commerce store for handmade goods"
- "A developer tool for API monitoring"

This helps me understand your domain and suggest relevant features.
  `,
  input_type: 'text'
});

// Store in memory for context
productContext.vision = vision.text;
```

#### **Step 3: Tech Stack Detection + Confirmation**

```javascript
// Detect from package.json, requirements.txt, etc.
const detected = detectTechStack();

const techStackResponse = AskUserQuestion({
  question: "I detected your tech stack. Is this correct?",
  context: `
Detected:
- Frontend: ${detected.frontend || 'Not detected'}
- Backend: ${detected.backend || 'Not detected'}
- Database: ${detected.database || 'Not detected'}
  `,
  options: [
    { id: 'yes', label: "Yes, this looks right", value: 'confirm' },
    { id: 'no', label: "No, let me specify", value: 'custom' }
  ]
});

if (techStackResponse.value === 'custom') {
  // Ask for each layer
  await askTechStackDetails();
}
```

**Tech Stack Details (if custom selected):**

```javascript
async function askTechStackDetails() {
  // Frontend
  const frontend = AskUserQuestion({
    question: "What frontend framework are you using?",
    options: [
      { id: '1', label: "Next.js 14", value: 'Next.js 14' },
      { id: '2', label: "React + Vite", value: 'React + Vite' },
      { id: '3', label: "Vue + Nuxt", value: 'Vue + Nuxt' },
      { id: '4', label: "SvelteKit", value: 'SvelteKit' },
      { id: '5', label: "No frontend (backend only)", value: null },
      { id: 'custom', label: "Something else...", value: '__CUSTOM__' }
    ]
  });

  // Backend (similar pattern)
  // Database (similar pattern)
  // Auth (similar pattern)

  return { frontend, backend, database, auth };
}
```

#### **Step 4: Core Features (Smart Suggestions)**

```javascript
const features = AskUserQuestion({
  question: "What are the 3-5 core features you need?",
  context: `
Based on "${productContext.vision}", I suggest:

- User authentication (login/signup)
- ${suggestFeatureFromVision(productContext.vision)[0]}
- ${suggestFeatureFromVision(productContext.vision)[1]}

You can add/remove features later in .claude/product/index.md
  `,
  input_type: 'text'
});

// Parse features (comma-separated or numbered list)
productContext.features = parseFeatureList(features.text);
```

#### **Step 5: Development Preferences**

```javascript
const prefs = AskUserQuestion({
  question: "How do you want agentful to work?",
  context: `
Choose your development style:
  `,
  options: [
    {
      id: 'autonomous',
      label: "Autonomous (agentful builds 24/7, I review checkpoints)",
      value: 'autonomous'
    },
    {
      id: 'collaborative',
      label: "Collaborative (I work alongside agents, approve each step)",
      value: 'collaborative'
    },
    {
      id: 'custom',
      label: "Let me configure this later",
      value: 'custom'
    }
  ]
});

// Set state.json defaults based on preference
if (prefs.value === 'autonomous') {
  state.approval_required = false;
  state.auto_commit = true;
  state.checkpoint_interval = 'feature'; // After each feature
}
```

#### **Step 6: Generate + Validate**

```javascript
// Generate product spec from collected context
const productSpec = generateProductSpec({
  vision: productContext.vision,
  techStack: productContext.techStack,
  features: productContext.features,
  preferences: productContext.preferences
});

// Write to .claude/product/index.md
Write(".claude/product/index.md", productSpec);

// IMMEDIATELY run product analyzer
const analysis = await Task("product-analyzer",
  "Analyze newly generated product spec and identify any gaps"
);

// Show results
console.log(`
✓ Product spec created!

Readiness Score: ${analysis.readiness_score}%
${analysis.blocking_issues.length > 0 ?
  `⚠️  ${analysis.blocking_issues.length} issue(s) need your input` :
  '✅ Ready to build!'
}
`);
```

#### **Step 7: Handle Blocking Issues (If Any)**

```javascript
if (analysis.blocking_issues.length > 0) {
  const fix = AskUserQuestion({
    question: "I found some gaps in your product spec. Want to fix them now?",
    context: `
Issues found:
${analysis.blocking_issues.map(i => `- ${i.issue}`).join('\n')}

This takes 1-2 minutes and ensures better code generation.
    `,
    options: [
      { id: 'yes', label: "Yes, walk me through it", value: 'fix' },
      { id: 'no', label: "No, I'll fix manually later", value: 'skip' }
    ]
  });

  if (fix.value === 'fix') {
    // Delegate to refinement mode (already exists in /agentful-product)
    await runRefinementMode(analysis.blocking_issues);
  }
}
```

#### **Step 8: Kickoff**

```javascript
const ready = AskUserQuestion({
  question: "Ready to start building?",
  context: `
Your project is configured:
- ${productContext.features.length} features defined
- Tech stack: ${techStack.frontend}, ${techStack.backend}, ${techStack.database}
- Mode: ${preferences.mode}

I'll start with the highest priority feature and work through your product spec.
  `,
  options: [
    { id: 'yes', label: "Let's build!", value: 'start' },
    { id: 'review', label: "Let me review the spec first", value: 'review' }
  ]
});

if (ready.value === 'start') {
  // Delegate to orchestrator for FEATURE_DEVELOPMENT workflow
  await Task("orchestrator", "Begin autonomous development loop");
} else {
  console.log(`
Review your product spec:
  File: .claude/product/index.md

When ready: /agentful-start
  `);
}
```

### 2.3 Branching Logic Summary

```
First Run Detected
  │
  ├─ New Project
  │   ├─ Collect vision
  │   ├─ Detect/confirm tech stack
  │   ├─ Define features
  │   ├─ Set preferences
  │   ├─ Generate spec
  │   ├─ Analyze spec
  │   └─ Fix blocking issues (if any)
  │
  ├─ Existing Codebase
  │   ├─ Scan codebase
  │   ├─ Show detected domains
  │   ├─ Generate spec from code
  │   ├─ Confirm with user
  │   └─ Proceed to development
  │
  └─ Skip Setup
      └─ Create minimal spec, proceed
```

---

## 3. Proactive Decision Handling (During Development)

### 3.1 The Problem with Passive Decisions

**Current Flow:**
1. Agent encounters blocker (e.g., "How should auth work?")
2. Agent writes to `decisions.json`
3. Agent moves to next feature
4. User eventually runs `/agentful-decide` (maybe)
5. **Work is stalled** until user remembers

**Impact:** Low velocity, poor UX, broken flow.

### 3.2 Proactive Decision Strategy

**New Flow:**

```javascript
// In orchestrator.md - when decision is needed
function needsUserDecision(question, options, blocking) {
  // Write to decisions.json (for history)
  recordDecision(question, options, blocking);

  // IMMEDIATELY ask user (don't wait for /agentful-decide)
  const response = AskUserQuestion({
    question: question,
    context: `
🚧 Development paused - your input needed

This decision affects: ${blocking.join(', ')}

${explainWhyItMatters(question)}
    `,
    options: [
      ...options.map((opt, i) => ({
        id: `opt-${i}`,
        label: opt,
        value: opt
      })),
      { id: 'custom', label: 'Custom solution...', value: '__CUSTOM__' },
      { id: 'later', label: 'Decide later (continue other work)', value: '__SKIP__' }
    ]
  });

  if (response.value === '__SKIP__') {
    // User wants to defer decision
    state.deferred_decisions.push(question);
    // Continue with non-blocked work
    return null;
  }

  // User provided answer - record and continue
  resolveDecision(question, response.value);
  return response.value;
}
```

### 3.3 Context-Aware Question Formatting

**Smart Context Addition:**

```javascript
function explainWhyItMatters(question) {
  // Use LLM knowledge to explain decision impact

  if (question.includes("race condition")) {
    return `
Why this matters:
- Pessimistic locking: Simple but slower (locks database rows)
- Optimistic locking: Fast but requires retry logic
- Queue-based: Best for high traffic but adds complexity

Your product spec indicates: ${getRelevantContext(question)}
    `;
  }

  if (question.includes("authentication")) {
    return `
Why this matters:
- JWT: Stateless, scales well, requires manual refresh logic
- Sessions: Simple, server-side state, doesn't scale horizontally
- OAuth: Delegate to Google/GitHub, faster setup but external dependency

Your tech stack: ${techStack.backend} works well with all options
    `;
  }

  // Generic fallback
  return "This affects how the feature will be implemented.";
}
```

### 3.4 Intelligent Defaults with Explanation

```javascript
function suggestDefaultOption(question, options, context) {
  // Analyze question + context to suggest best default

  const suggestion = analyzeDecision(question, context);

  return {
    recommendedIndex: suggestion.index,
    explanation: `
Recommended: ${options[suggestion.index]}

Why: ${suggestion.rationale}

(You can still choose any option above)
    `
  };
}

// Usage
const { recommendedIndex, explanation } = suggestDefaultOption(
  question,
  options,
  { techStack, features, productGoals }
);

const response = AskUserQuestion({
  question: question,
  context: explanation,
  options: options.map((opt, i) => ({
    id: `opt-${i}`,
    label: i === recommendedIndex ? `${opt} ⭐ Recommended` : opt,
    value: opt
  }))
});
```

---

## 4. UX Principles

### 4.1 Make Questions Feel Helpful, Not Annoying

**Principles:**

| Principle | Implementation | Example |
|-----------|---------------|---------|
| **Explain the "why"** | Always add context about decision impact | "This affects performance under load..." |
| **Show smart defaults** | Recommend based on tech stack/domain | "⭐ Recommended for Next.js projects" |
| **Provide escape hatches** | Always include "decide later" option | Users don't feel trapped |
| **Keep questions focused** | One decision at a time, no compound questions | ❌ "How should auth AND caching work?" |
| **Show progress** | Indicate where in setup flow user is | "Question 3 of 5" |
| **Celebrate completion** | Acknowledge when setup is done | "✓ Product spec ready! Let's build." |

### 4.2 When to Use Defaults vs. Require Input

**Require Input (No Default):**
- Product vision/description
- Core features (can't guess what user wants)
- Critical architectural decisions (auth strategy, database choice)

**Smart Defaults (User can override):**
- Testing framework (match language/framework)
- Deployment platform (detect from existing config)
- Code style/formatting (standard for ecosystem)
- Coverage threshold (80% is good default)

**Auto-Detect (Silent):**
- Tech stack from package.json/requirements.txt
- Git settings
- File structure patterns

**Never Ask:**
- Implementation details (variable names, file locations)
- Anything we can infer from existing code
- Questions with obvious answers given context

### 4.3 Error Handling (Graceful Failures)

**Scenario: User provides invalid/unclear answer**

```javascript
const response = AskUserQuestion({
  question: "What frontend framework?",
  options: frontendOptions
});

// Validate response
if (response.value === '__CUSTOM__') {
  const custom = AskUserQuestion({
    question: "Which frontend framework are you using?",
    input_type: 'text'
  });

  // Validate custom input
  if (!isValidFramework(custom.text)) {
    // Don't error - explain and retry
    const retry = AskUserQuestion({
      question: `I don't recognize "${custom.text}". Could you clarify?`,
      context: `
I support most popular frameworks. If you're using something uncommon,
you can specify it anyway and I'll do my best.

Examples: Next.js, React, Vue, Svelte, Angular, Solid, Qwik
      `,
      input_type: 'text'
    });

    // Accept whatever they say (user knows best)
    techStack.frontend = retry.text;
  }
}
```

**Scenario: User abandons setup mid-flow**

```javascript
// Save progress at each step
function saveSetupProgress(step, data) {
  const progress = readJSON('.agentful/setup-progress.json') || {};
  progress.step = step;
  progress.data = { ...progress.data, ...data };
  progress.timestamp = new Date().toISOString();
  writeJSON('.agentful/setup-progress.json', progress);
}

// Detect abandoned setup on next run
if (exists('.agentful/setup-progress.json')) {
  const progress = readJSON('.agentful/setup-progress.json');

  const resume = AskUserQuestion({
    question: "I see you started setup but didn't finish. Resume?",
    context: `
You were at step ${progress.step}: ${getStepDescription(progress.step)}
    `,
    options: [
      { id: 'resume', label: "Resume where I left off", value: 'resume' },
      { id: 'restart', label: "Start over", value: 'restart' }
    ]
  });

  if (resume.value === 'resume') {
    return continueSetup(progress);
  } else {
    unlinkSync('.agentful/setup-progress.json');
  }
}
```

---

## 5. Implementation Plan

### 5.1 Where This Logic Lives

**Recommendation: New `/agentful-init` command**

**Why?**
- Separation of concerns: `/agentful-start` is for development, `/agentful-init` is for setup
- Clear command name: Users know what it does
- Can be invoked multiple times (e.g., to reconfigure)
- Doesn't bloat orchestrator logic

**File Structure:**

```
.claude/
├── commands/
│   ├── agentful-init.md       # NEW: Interactive onboarding
│   ├── agentful-start.md      # UPDATED: Detect first-run, suggest init
│   ├── agentful-product.md    # UPDATED: Called by init for refinement
│   └── agentful-decide.md     # UPDATED: Show pending + allow manual
└── agents/
    ├── orchestrator.md        # UPDATED: Proactive decision prompts
    └── product-analyzer.md    # No changes needed
```

### 5.2 Implementation Flow

**agentful-init.md** (new command):

```markdown
---
name: agentful-init
description: Interactive product specification setup with guided questions
---

# Agentful Interactive Setup

This command guides users through product specification creation using AskUserQuestion.

## Process

1. Detect context (new project vs existing codebase)
2. Collect product vision (1-2 sentences)
3. Detect/confirm tech stack
4. Define core features
5. Set development preferences
6. Generate product spec
7. Run product analyzer
8. Fix blocking issues (if any)
9. Kickoff development or save for later

## Implementation

[Include detailed step-by-step logic from Section 2.2]
```

**agentful-start.md** (updated):

```markdown
### 1. Detect First Run

If first run detected:

  const init = AskUserQuestion({
    question: "Looks like this is your first time! Run interactive setup?",
    options: [
      { id: 'yes', label: "Yes, guide me through setup (2 min)", value: 'yes' },
      { id: 'no', label: "No, I'll configure manually", value: 'no' }
    ]
  });

  if (init.value === 'yes') {
    // Delegate to /agentful-init
    Task("agentful-init", "Run interactive onboarding");
    return;
  }

// Continue with normal start logic...
```

**orchestrator.md** (updated decision handling):

```markdown
## Decision Handling (Proactive Mode)

When you need user input:

1. Write to decisions.json (for history)
2. **IMMEDIATELY ask user via AskUserQuestion** (don't wait)
3. If user defers, move to next non-blocked work
4. If user answers, resolve and continue

[Include logic from Section 3.2]
```

### 5.3 State Management

**New Files:**

```javascript
// .agentful/setup-progress.json (temporary, deleted after setup)
{
  "step": "tech-stack",
  "data": {
    "vision": "A task management app...",
    "frontend": "Next.js 14"
  },
  "timestamp": "2026-01-23T10:30:00Z"
}

// .agentful/preferences.json (permanent)
{
  "mode": "autonomous",            // autonomous | collaborative
  "approval_required": false,      // require approval for each commit
  "auto_commit": true,             // auto-commit after validation passes
  "checkpoint_interval": "feature" // feature | domain | manual
}
```

**Updated Files:**

```javascript
// .agentful/decisions.json (add metadata)
{
  "pending": [
    {
      "id": "decision-001",
      "question": "...",
      "options": [...],
      "blocking": [...],
      "timestamp": "...",
      "asked_interactively": false,  // NEW: track if user was prompted
      "deferred_count": 0             // NEW: how many times user clicked "later"
    }
  ],
  "resolved": [...]
}
```

### 5.4 Backward Compatibility

**Existing Users:**
- `/agentful-init` is opt-in (never runs automatically)
- `/agentful-start` detects first run but offers choice (setup vs manual)
- Existing product specs are not modified
- Existing `decisions.json` format is preserved (new fields are optional)

**Migration Path:**
```javascript
// If user has old decisions.json format
if (!decision.asked_interactively) {
  decision.asked_interactively = false; // backfill
}
```

---

## 6. Success Metrics

### 6.1 How We Know Onboarding Is Working

**Primary Metrics:**

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Time to First Feature** | <5 minutes | From `agentful init` to first code generated |
| **Setup Completion Rate** | >80% | Users who start `/agentful-init` and finish |
| **Product Spec Quality** | Readiness score >75% | Average score after init |
| **Blocking Issues on First Run** | <1 per user | Average blocking issues after init |
| **Setup Abandonment Rate** | <20% | Users who start but don't finish |

**Secondary Metrics:**

- **Decision Response Time:** How long until user answers proactive prompts
- **Deferred Decisions:** How many decisions get deferred (should be low)
- **Manual Refinement Rate:** % of users who run `/agentful-product` after init
- **Repeat Init Rate:** % of users who run `/agentful-init` multiple times

### 6.2 What to Measure

**Telemetry Events (Optional - User Consent):**

```javascript
// Optional telemetry (off by default, opt-in)
trackEvent('onboarding_started', {
  source: 'first_run' | 'manual',
  project_type: 'new' | 'existing'
});

trackEvent('onboarding_step_completed', {
  step: 'vision' | 'tech_stack' | 'features' | 'preferences',
  duration_seconds: 12
});

trackEvent('onboarding_completed', {
  total_duration_seconds: 180,
  features_defined: 5,
  readiness_score: 85,
  blocking_issues: 0
});

trackEvent('decision_prompted', {
  question_type: 'auth' | 'database' | 'deployment',
  response: 'answered' | 'deferred',
  response_time_seconds: 45
});
```

**No Telemetry Alternatives:**
- Log to `.agentful/metrics.json` (local only)
- Show summary at end of setup
- Allow users to export metrics for sharing (opt-in)

---

## 7. Gaps & Blockers

### 7.1 What's Missing to Make This Perfect

**Technical Gaps:**

1. **AskUserQuestion Chaining**
   - **Gap:** Current implementation is single-question. Onboarding needs multi-step flows.
   - **Workaround:** Chain multiple `AskUserQuestion` calls sequentially.
   - **Ideal:** Support conversation flows with back/forward navigation.

2. **Rich Input Types**
   - **Gap:** Only text + options. No multi-select, checkboxes, or validation.
   - **Impact:** Can't ask "Select all features you need" (must ask one-by-one).
   - **Workaround:** Use text input with comma-separated parsing.

3. **Progress Indicators**
   - **Gap:** No built-in way to show "Question 3 of 5".
   - **Workaround:** Add to context string manually.

4. **Interrupt Handling**
   - **Gap:** If user presses Ctrl+C during setup, state is lost.
   - **Workaround:** Save progress at each step to `.agentful/setup-progress.json`.

### 7.2 Technical Constraints

**Claude Code Limitations:**

1. **Single Message Context:** AskUserQuestion is synchronous - can't show dynamic UI updates.
   - **Impact:** Can't show real-time product spec preview as user answers questions.
   - **Workaround:** Show final spec at end, offer to edit before generating code.

2. **No Streaming:** Question responses are atomic (no typeahead, autocomplete).
   - **Impact:** User can't see suggestions as they type.
   - **Acceptable:** This is fine for onboarding - clarity over polish.

3. **Context Window:** Long product specs might hit token limits.
   - **Impact:** Large projects (50+ features) may need pagination.
   - **Mitigation:** Hierarchical product structure handles this.

**Orchestrator Model:**

- Currently uses `opus` model (more expensive but better reasoning).
- **Consideration:** AskUserQuestion calls are cheap (user input waits, no tokens burned).
- **No change needed:** Stick with opus for orchestrator.

### 7.3 Open Questions

**Design Questions:**

1. **Should `/agentful-init` replace manual spec editing entirely?**
   - **Pro:** Consistency, better UX for 90% of users.
   - **Con:** Power users may prefer direct editing.
   - **Proposal:** Make init the default, but always show file path for manual editing.

2. **How many questions is too many?**
   - **Current:** 7 questions for full setup.
   - **Risk:** Fatigue if >10 questions.
   - **Mitigation:** Allow "skip to minimal" option at any point.

3. **Should we auto-run product analyzer after every spec edit?**
   - **Pro:** Immediate feedback, prevents broken specs.
   - **Con:** May slow down manual editing workflow.
   - **Proposal:** Auto-run on save, but allow disabling via `.agentful/preferences.json`.

4. **What if user provides nonsense answers?**
   - **Example:** Vision = "asdf", Features = "everything"
   - **Current:** Accept whatever user says (LLM will do its best).
   - **Alternative:** Add validation, reject obviously invalid input.
   - **Proposal:** Soft validation (warn but accept).

**Product Questions:**

1. **Should onboarding include a demo/tutorial?**
   - **Pro:** Helps first-time users understand agentful.
   - **Con:** Adds time, may annoy experienced users.
   - **Proposal:** Offer optional 2-min tutorial at start.

2. **Should we support onboarding for team projects?**
   - **Scenario:** Multiple devs working on same agentful project.
   - **Challenge:** Sync product specs across team.
   - **Future:** Git-based spec sharing, collaborative editing.

---

## 8. Recommendations (Prioritized)

### 8.1 Phase 1: MVP (Ship in 1 Week)

**High-Impact, Low-Effort:**

1. **Create `/agentful-init` command** with interactive setup flow (Section 2.2)
   - **Effort:** 2 days
   - **Impact:** 🔥🔥🔥 Transforms first-run experience

2. **Update `/agentful-start`** to detect first run and suggest `/agentful-init`
   - **Effort:** 1 hour
   - **Impact:** 🔥🔥 Ensures users discover new flow

3. **Add proactive decision prompting** to orchestrator (Section 3.2)
   - **Effort:** 1 day
   - **Impact:** 🔥🔥🔥 Eliminates stalled work

4. **Save setup progress** at each step (Section 5.2)
   - **Effort:** 2 hours
   - **Impact:** 🔥 Prevents frustration from abandoned setups

**Deliverables:**
- New `agentful-init.md` command
- Updated `agentful-start.md` with first-run detection
- Updated `orchestrator.md` with AskUserQuestion integration
- New `.agentful/setup-progress.json` state file
- Documentation in CLAUDE.md

### 8.2 Phase 2: Polish (Ship in 2 Weeks)

**Medium-Effort, High-Impact:**

1. **Reverse-engineering mode** for existing codebases (Section 2.2 - Step 1)
   - **Effort:** 3 days
   - **Impact:** 🔥🔥 Expands user base to existing projects

2. **Smart context in decision prompts** (Section 3.3)
   - **Effort:** 2 days
   - **Impact:** 🔥🔥 Improves decision quality

3. **Intelligent default suggestions** based on tech stack (Section 3.4)
   - **Effort:** 2 days
   - **Impact:** 🔥 Reduces cognitive load

4. **Setup metrics tracking** (local .agentful/metrics.json) (Section 6.2)
   - **Effort:** 1 day
   - **Impact:** 🔥 Enables data-driven improvements

**Deliverables:**
- Reverse-engineering logic in product-analyzer
- Context-aware decision explanations
- Default recommendation engine
- Local metrics file

### 8.3 Phase 3: Advanced (Ship in 1 Month)

**High-Effort, High-Impact:**

1. **Multi-step conversation flows** with back/forward navigation
   - **Effort:** 1 week
   - **Impact:** 🔥🔥 Better UX for complex setups

2. **Interactive spec preview** during setup (show partial spec as user progresses)
   - **Effort:** 3 days
   - **Impact:** 🔥 Builds user confidence

3. **Rich input validation** (multi-select, checkboxes, date pickers)
   - **Effort:** 1 week
   - **Impact:** 🔥 Better for advanced configurations

4. **Team collaboration features** (shared specs, conflict resolution)
   - **Effort:** 2 weeks
   - **Impact:** 🔥🔥 Unlocks enterprise use cases

### 8.4 Do NOT Build (Anti-Recommendations)

**What to avoid:**

1. ❌ **Visual UI Builder:** Conflicts with Claude Code's text-first interface
2. ❌ **Third-Party Integrations During Setup:** Keep onboarding focused (add later)
3. ❌ **Complex Branching Logic:** Don't create decision trees >2 levels deep
4. ❌ **AI-Generated Features:** Don't auto-suggest features (users know best)
5. ❌ **Onboarding Analytics Dashboard:** Local metrics are enough for MVP

---

## 9. Example Flows (End-to-End)

### 9.1 Example 1: New User, Task Management App

```
User: /agentful-start

Agent: Welcome to agentful! Let's set up your project.

I'll ask you a few quick questions to understand what you're building.
This takes about 2 minutes and ensures we generate the right code.

Options:
  [A] I'm starting a new project
  [B] I have existing code
  [C] Skip setup (I'll configure manually)

User: A

Agent: What are you building? (1-2 sentences)

Examples:
- "A task management app for remote teams"
- "An e-commerce store for handmade goods"

User: A task management app for remote teams with real-time collaboration

Agent: I detected your tech stack. Is this correct?

Detected:
- Frontend: Next.js 14
- Backend: Next.js API Routes
- Database: PostgreSQL

Options:
  [A] Yes, this looks right
  [B] No, let me specify

User: A

Agent: What are the 3-5 core features you need?

Based on "task management app for remote teams", I suggest:
- User authentication
- Project and task CRUD
- Real-time updates (WebSockets)
- Team collaboration (comments, assignments)

User: User auth, projects, tasks, real-time updates, team permissions

Agent: How do you want agentful to work?

Options:
  [A] Autonomous (agentful builds 24/7, I review checkpoints)
  [B] Collaborative (I work alongside agents, approve each step)

User: A

Agent: ✓ Product spec created!

Readiness Score: 85%
✅ Ready to build!

Would you like to:
  [A] Start building now
  [B] Let me review the spec first

User: A

Agent: 🚀 Starting development...

Building feature: User Authentication
  - Creating auth service with JWT
  - Generating login/signup components
  - Adding password hashing with bcrypt
  ...
```

**Result:** User went from zero to active development in <3 minutes.

### 9.2 Example 2: Existing Codebase, E-Commerce

```
User: /agentful-init

Agent: Welcome to agentful! Let's set up your project.

Options:
  [A] I'm starting a new project
  [B] I have existing code
  [C] Skip setup

User: B

Agent: 🔍 Analyzing your codebase...

Detected:
  • products (87% complete)
    Features: CRUD, search, filtering

  • cart (65% complete)
    Features: Add to cart, checkout flow

  • authentication (40% complete)
    Features: Login, incomplete password reset

Tech Stack detected:
  Language:    TypeScript
  Framework:   Express + React
  Database:    MongoDB with Mongoose

Generate product spec from detected code?

Options:
  [A] Yes, generate spec
  [B] No, I'll create manually

User: A

Agent: ✓ Product spec generated from codebase!

I found 3 domains with 8 features (3 incomplete).

Next steps:
  [A] Start completing incomplete features
  [B] Let me review the spec first
  [C] Add new features to the spec

User: A

Agent: 🚀 Resuming development...

Picking up incomplete work:
- Feature: Password Reset (40% complete)
  Last checkpoint: Email sending logic added
  Next: Build reset token validation

Continuing...
```

**Result:** Existing codebase analyzed, spec auto-generated, work resumed seamlessly.

---

## 10. Alignment with Project Goals

### 10.1 Short-Term Goal: Fastest Way to Ship Features

**How this helps:**
- ✅ **5-minute onboarding** eliminates setup friction
- ✅ **Proactive decisions** eliminate work stalls
- ✅ **Smart defaults** reduce decision fatigue
- ✅ **Auto-validation** catches issues early

**Impact:** Users ship first feature within 10 minutes of installation.

### 10.2 Long-Term Goal: Standard for AI Product Development

**How this helps:**
- ✅ **Best-in-class UX** sets agentful apart from competitors
- ✅ **Interactive guidance** lowers barrier to entry (more users)
- ✅ **Data-driven decisions** (via metrics) enable continuous improvement
- ✅ **Extensible framework** (AskUserQuestion patterns) unlock future features

**Impact:** Agentful becomes the "Rails of AI development" - opinionated, productive, delightful.

### 10.3 Target Audience: Quality + Speed Developers

**How this helps:**
- ✅ **No micromanagement required** (autonomous mode)
- ✅ **Quality gates built-in** (product analyzer, validation)
- ✅ **Clear communication** (context-rich prompts)
- ✅ **Escape hatches** (manual override always available)

**Impact:** Developers trust agentful to build production-ready code autonomously.

### 10.4 Problem Solved: Idea → Production-Ready Code

**How this helps:**
- ✅ **Interactive onboarding** bridges gap from idea to spec
- ✅ **Proactive decisions** bridge gap from spec to implementation
- ✅ **Auto-validation** bridges gap from implementation to production
- ✅ **End-to-end flow** is seamless, no manual steps required

**Impact:** "I have an idea" → production deployment in hours, not days/weeks.

---

## Conclusion

The integration of `AskUserQuestion` into agentful's onboarding and decision-handling flows represents a **paradigm shift** from passive automation to **proactive collaboration**. By asking the right questions at the right time, agentful can eliminate the two biggest sources of friction:

1. **Initial setup confusion** (solved by `/agentful-init`)
2. **Mid-development stalls** (solved by proactive decision prompts)

This strategy is:
- ✅ **Technically feasible** (leverages existing infrastructure)
- ✅ **Low-effort MVP** (can ship Phase 1 in 1 week)
- ✅ **High-impact** (transforms UX, unlocks velocity)
- ✅ **Future-proof** (extensible to advanced features)

**Recommendation:** Prioritize Phase 1 (MVP) immediately. This is the highest ROI change agentful can make to onboarding.

---

**Next Steps:**
1. Review this document with team
2. Validate UX flows with test users
3. Build `/agentful-init` command (Phase 1)
4. Ship and iterate based on metrics

**Questions? Concerns?** Let's discuss in `/agentful-decide` 😉
