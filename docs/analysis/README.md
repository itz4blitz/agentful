# Agentful Onboarding & AskUserQuestion Integration Analysis

**Created:** 2026-01-23
**Status:** Design Proposal
**Sprint Target:** Phase 1 MVP in 1 week

---

## Overview

This analysis provides a comprehensive strategy for transforming agentful's onboarding experience using the `AskUserQuestion` tool. The goal is to create an interactive, guided setup that gets users from zero-to-shipping in under 5 minutes.

**Key Insight:** agentful already has sophisticated infrastructure (product analyzer, decision handling, state management). The opportunity is to **leverage AskUserQuestion proactively** during first-run and critical decision points, rather than passively waiting for users to invoke commands.

---

## Documents in This Analysis

### 1. [Full Strategy Document](./onboarding-askuserquestion-strategy.md)

**What it covers:**
- Current state analysis (pain points, existing capabilities)
- Detailed onboarding flow design (step-by-step with code)
- Proactive decision handling strategy
- UX principles and error handling
- Implementation plan (where code lives, state management)
- Success metrics and measurement strategy
- Gaps, blockers, and open questions
- Recommendations prioritized by impact
- Example end-to-end user flows
- Alignment with project goals

**Read this if you want:** Complete understanding of the strategy, rationale, and design decisions.

### 2. [Visual Flow Diagrams](./onboarding-flow-diagram.md)

**What it covers:**
- Current vs. proposed user journeys (side-by-side comparison)
- Decision handling: passive vs. proactive
- Architecture integration points
- User mental model (before/after)
- Implementation phases visual timeline
- Success metrics dashboard mockup
- Example question flows with screenshots

**Read this if you want:** Quick visual overview, high-level flow understanding, or presentation materials.

### 3. [Implementation Checklist](./onboarding-implementation-checklist.md)

**What it covers:**
- Day-by-day implementation plan (7-day sprint)
- Files to create/update with exact tasks
- Testing checklist for each component
- Validation criteria before shipping
- Rollback plan if issues found
- Success metrics to track post-launch
- Phase 2 and Phase 3 planning

**Read this if you want:** Actionable sprint plan, clear next steps, or task breakdown for implementation.

---

## Quick Summary

### The Problem

**Current onboarding (passive):**
1. User runs `npx agentful init`
2. User manually edits `.claude/product/index.md` (template with placeholders)
3. User runs `/agentful-start` (may fail if spec incomplete)
4. Agent encounters decisions → writes to `decisions.json` → **work stalls**
5. User eventually runs `/agentful-decide` manually (if they remember)

**Pain points:**
- 30+ minutes to first feature
- High abandonment rate
- Confusing command structure
- Silent work stalls
- No validation feedback

### The Solution

**Proposed onboarding (proactive + interactive):**
1. User runs `/agentful-start` (first time)
2. Agent detects first run → **immediately prompts:** "Run interactive setup?"
3. Agent asks 7 guided questions (vision, tech stack, features, preferences)
4. Agent auto-generates product spec
5. Agent runs product analyzer → surfaces issues **immediately**
6. Agent fixes blocking issues with user input (if any)
7. Agent starts development
8. Agent encounters decision → **prompts user immediately** (no waiting)
9. User answers in real-time → development continues

**Impact:**
- <5 minutes to first feature
- >80% completion rate
- Clear, single-flow UX
- Zero work stalls (proactive prompts)
- Immediate validation feedback

---

## Implementation Plan

### Phase 1: MVP (Ship in 1 Week)

**High-impact, low-effort changes:**

| Task | Effort | Impact | Files |
|------|--------|--------|-------|
| Create `/agentful-init` command | 2 days | 🔥🔥🔥 | `agentful-init.md` (new) |
| Update `/agentful-start` first-run detection | 1 hour | 🔥🔥 | `agentful-start.md` (update) |
| Add proactive decision prompts | 1 day | 🔥🔥🔥 | `orchestrator.md` (update) |
| Save setup progress (resume support) | 2 hours | 🔥 | New state file |

**Total effort:** 4 days of focused work
**Total impact:** Transforms onboarding experience completely

### Phase 2: Polish (Ship in 2 Weeks)

**Medium-effort, high-impact improvements:**

- Reverse-engineering mode (analyze existing code → generate spec)
- Smart context in decision prompts (explain why it matters)
- Intelligent default suggestions (based on tech stack)
- Setup metrics tracking (measure success)

### Phase 3: Advanced (Ship in 1 Month)

**High-effort, high-impact features:**

- Multi-step conversation flows (back/forward navigation)
- Interactive spec preview (show partial spec as user progresses)
- Rich input validation (multi-select, checkboxes)
- Team collaboration (shared specs, conflict resolution)

---

## Success Metrics

**Primary Metrics (Track Weekly):**

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Time to First Feature | 30+ min | <5 min | 🔴 |
| Setup Completion Rate | ~50% | >80% | 🔴 |
| Product Spec Quality | ~60% | >75% | 🟡 |
| Blocking Issues (First Run) | 3-5 | <1 | 🔴 |
| Setup Abandonment | 50% | <20% | 🔴 |

**Secondary Metrics:**

- Decision response time (<60 seconds)
- Deferred decision rate (<25%)
- Manual refinement rate (via `/agentful-product`)
- Repeat init rate (user reconfiguration)

---

## Key Design Decisions

### 1. Interactive First, Manual Optional

**Decision:** Default to interactive setup, always provide escape hatch for manual editing.

**Rationale:** 90% of users benefit from guided setup. Power users can skip or edit manually.

### 2. Proactive Prompts, Not Passive

**Decision:** Prompt user immediately when decisions are needed (don't wait for `/agentful-decide`).

**Rationale:** Eliminates work stalls, maintains flow, improves velocity.

### 3. Single Flow, Clear Mental Model

**Decision:** Consolidate onboarding into one coherent journey (`/agentful-start` → setup → build).

**Rationale:** Reduces cognitive overload, eliminates confusion about which command to run.

### 4. Smart Defaults, Not Generic

**Decision:** Recommend based on detected tech stack and domain, not generic advice.

**Rationale:** Context-aware suggestions feel helpful, not annoying.

### 5. Save Progress, Support Resume

**Decision:** Auto-save setup progress, allow resuming after interruption.

**Rationale:** Prevents frustration from abandoned setups, improves completion rate.

---

## Technical Constraints

**AskUserQuestion Limitations (Current):**

1. **Single-question flow** - Can't show multi-step wizards with back/forward
   - **Workaround:** Chain sequential questions, save progress at each step

2. **Text + options only** - No multi-select, checkboxes, or rich validation
   - **Workaround:** Use comma-separated text input, parse intelligently

3. **No progress indicators** - Can't show "Question 3 of 7"
   - **Workaround:** Add to context string manually

4. **Synchronous** - Can't show dynamic UI updates (e.g., live spec preview)
   - **Workaround:** Show final spec at end, offer to edit before proceeding

**None of these are blockers - workarounds are acceptable for MVP.**

---

## Open Questions

**Design Questions:**

1. Should `/agentful-init` replace manual spec editing entirely?
   - **Proposal:** Make init the default, always show file path for manual override

2. How many questions is too many?
   - **Current:** 7 questions for full setup (acceptable)
   - **Mitigation:** Allow "skip to minimal" at any point

3. Should we auto-run product analyzer after every spec edit?
   - **Proposal:** Auto-run on save, allow disabling via preferences

**Product Questions:**

1. Should onboarding include a demo/tutorial?
   - **Proposal:** Offer optional 2-min tutorial at start (skip-able)

2. Should we support team collaboration in Phase 1?
   - **Proposal:** No - defer to Phase 3 (adds significant complexity)

---

## Recommendations (Executive Summary)

### Immediate Actions (This Week)

1. **Approve Phase 1 implementation plan** (4 days focused work)
2. **Assign developer to build `/agentful-init` command**
3. **Create test fixtures** (empty project, existing codebase, corrupted state)
4. **Set up metrics tracking** (local `.agentful/metrics.json`)

### Short-Term (Next 2 Weeks)

1. **Ship Phase 1 MVP** (interactive onboarding + proactive decisions)
2. **Monitor metrics** (time to first feature, completion rate)
3. **Collect user feedback** (GitHub issues, Discord, surveys)
4. **Plan Phase 2** (prioritize based on data + feedback)

### Long-Term (Next Month)

1. **Ship Phase 2 polish** (reverse-engineering, smart context, defaults)
2. **Iterate based on metrics** (optimize slow steps, improve UX)
3. **Plan Phase 3 advanced features** (multi-step flows, team collaboration)

---

## Alignment with Project Goals

### Short-Term: Fastest Way to Ship Features

✅ **5-minute onboarding** eliminates setup friction
✅ **Proactive decisions** eliminate work stalls
✅ **Smart defaults** reduce decision fatigue
✅ **Auto-validation** catches issues early

**Impact:** Users ship first feature within 10 minutes of installation.

### Long-Term: Standard for AI Product Development

✅ **Best-in-class UX** sets agentful apart
✅ **Interactive guidance** lowers barrier to entry
✅ **Data-driven decisions** enable continuous improvement
✅ **Extensible framework** unlocks future features

**Impact:** Agentful becomes the "Rails of AI development."

### Target Audience: Quality + Speed Developers

✅ **No micromanagement** (autonomous mode)
✅ **Quality gates built-in** (analyzer, validation)
✅ **Clear communication** (context-rich prompts)
✅ **Escape hatches** (manual override always available)

**Impact:** Developers trust agentful for production-ready code.

### Problem Solved: Idea → Production-Ready Code

✅ **Interactive onboarding** bridges idea → spec
✅ **Proactive decisions** bridges spec → implementation
✅ **Auto-validation** bridges implementation → production
✅ **End-to-end flow** is seamless

**Impact:** "I have an idea" → production deployment in hours.

---

## Next Steps

1. **Review this analysis** with the team
2. **Validate UX flows** with test users (optional)
3. **Approve Phase 1 implementation** (or request changes)
4. **Assign developer** to build `/agentful-init`
5. **Create GitHub issue** for tracking progress
6. **Schedule demo** after Phase 1 ships (1 week)

---

## Questions or Concerns?

**Contact:** Product Analyzer Agent
**Files:** `/Users/blitz/Development/agentful/docs/analysis/`
**Status:** Awaiting approval to proceed with Phase 1

---

**This is the highest ROI change agentful can make to onboarding. Let's ship it! 🚀**
