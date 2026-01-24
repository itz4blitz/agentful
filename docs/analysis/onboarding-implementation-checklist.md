# Agentful Onboarding - Implementation Checklist

**Sprint Goal:** Ship interactive onboarding in 1 week (Phase 1 MVP)

---

## Phase 1: MVP - Ship in 1 Week

### Day 1-2: Core `/agentful-init` Command

**Files to Create:**

- [ ] `.claude/commands/agentful-init.md` - Main interactive setup command
  - [ ] Step 1: Welcome + context detection (new vs existing)
  - [ ] Step 2: Product vision (1-2 sentence input)
  - [ ] Step 3: Tech stack detection + confirmation
  - [ ] Step 4: Core features collection
  - [ ] Step 5: Development preferences
  - [ ] Step 6: Generate product spec
  - [ ] Step 7: Run product analyzer
  - [ ] Step 8: Handle blocking issues (if any)
  - [ ] Step 9: Kickoff or save for later

**AskUserQuestion Patterns:**

```markdown
## Question Template

const response = AskUserQuestion({
  question: "Clear, specific question?",
  context: `
Why we're asking:
- Reason 1
- Reason 2

What happens with your answer:
- Impact explanation
  `,
  options: [
    { id: 'opt1', label: "Option 1 ⭐ Recommended", value: 'value1' },
    { id: 'opt2', label: "Option 2", value: 'value2' },
    { id: 'custom', label: "Custom...", value: '__CUSTOM__' }
  ]
});

if (response.value === '__CUSTOM__') {
  // Handle custom input
}
```

**Testing:**

- [ ] Test new project flow
- [ ] Test custom tech stack input
- [ ] Test abandoned setup (Ctrl+C mid-flow)
- [ ] Test invalid/nonsense input handling

---

### Day 3: First-Run Detection in `/agentful-start`

**Files to Update:**

- [ ] `.claude/commands/agentful-start.md`
  - [ ] Add first-run detection logic
  - [ ] Suggest `/agentful-init` if first run
  - [ ] Allow skip to manual configuration
  - [ ] Maintain backward compatibility

**Detection Logic:**

```javascript
function detectFirstRun() {
  return (
    !exists(".claude/product/index.md") ||
    fileIsEmpty(".claude/product/index.md") ||
    fileContainsPlaceholders(".claude/product/index.md") ||
    !exists(".agentful/product-analysis.json")
  );
}
```

**Testing:**

- [ ] Test first-run detection accuracy
- [ ] Test skip flow (manual setup)
- [ ] Test with existing product specs (should not trigger)
- [ ] Test with placeholder-filled specs (should trigger)

---

### Day 4: Proactive Decision Prompts in Orchestrator

**Files to Update:**

- [ ] `.claude/agents/orchestrator.md`
  - [ ] Add `needsUserDecision()` function
  - [ ] Integrate AskUserQuestion for immediate prompts
  - [ ] Add "decide later" option
  - [ ] Update decision recording with metadata
  - [ ] Add context-aware explanations

**Implementation:**

```javascript
function needsUserDecision(question, options, blocking) {
  // Write to decisions.json (history)
  recordDecision(question, options, blocking);

  // IMMEDIATELY prompt user
  const response = AskUserQuestion({
    question: question,
    context: `
🚧 Development paused - your input needed

Affects: ${blocking.join(', ')}

${explainWhyItMatters(question)}
    `,
    options: [
      ...options,
      { id: 'later', label: 'Decide later', value: '__SKIP__' }
    ]
  });

  if (response.value === '__SKIP__') {
    // Continue other work
    return null;
  }

  // Resolve and continue
  resolveDecision(question, response.value);
  return response.value;
}
```

**Testing:**

- [ ] Test decision prompt during development
- [ ] Test "decide later" flow
- [ ] Test custom answer input
- [ ] Test decision history recording

---

### Day 5: Setup Progress Saving

**Files to Create:**

- [ ] `.agentful/setup-progress.json` (temporary state file)
  - Schema: `{ step, data, timestamp }`
  - Auto-save after each question
  - Auto-delete after completion

**Files to Update:**

- [ ] `.claude/commands/agentful-init.md`
  - [ ] Add `saveSetupProgress()` after each step
  - [ ] Add resume logic on restart
  - [ ] Add progress indicators ("Question 3 of 7")

**Implementation:**

```javascript
function saveSetupProgress(step, data) {
  const progress = {
    step: step,
    data: { ...currentData, ...data },
    timestamp: new Date().toISOString()
  };
  Write('.agentful/setup-progress.json', JSON.stringify(progress, null, 2));
}

function checkForResume() {
  if (exists('.agentful/setup-progress.json')) {
    const progress = Read('.agentful/setup-progress.json');

    const resume = AskUserQuestion({
      question: "Resume previous setup?",
      context: `You were at: ${progress.step}`,
      options: [
        { id: 'yes', label: 'Resume', value: 'resume' },
        { id: 'no', label: 'Start over', value: 'restart' }
      ]
    });

    if (resume.value === 'resume') {
      return continueSetup(progress);
    } else {
      unlinkSync('.agentful/setup-progress.json');
    }
  }
  return null;
}
```

**Testing:**

- [ ] Test mid-setup interruption (Ctrl+C)
- [ ] Test resume flow
- [ ] Test restart flow
- [ ] Test progress file cleanup after completion

---

### Day 6: Documentation + Polish

**Files to Update:**

- [ ] `CLAUDE.md` (main user-facing docs)
  - [ ] Add section: "Interactive Setup"
  - [ ] Update "When to Use What" table
  - [ ] Add example onboarding flow
  - [ ] Update Quick Start section

- [ ] `.gitignore`
  - [ ] Add `.agentful/setup-progress.json` (temporary)
  - [ ] Keep `.agentful/preferences.json` (should be tracked)

**Create Examples:**

- [ ] Example onboarding transcript (task management app)
- [ ] Example onboarding transcript (e-commerce app)
- [ ] Example decision prompt (auth strategy)
- [ ] Example decision prompt (database choice)

**Testing:**

- [ ] End-to-end test: New user, full flow
- [ ] End-to-end test: Existing codebase
- [ ] End-to-end test: Skip setup
- [ ] End-to-end test: Resume after abandon

---

### Day 7: Integration Testing + Ship

**Integration Tests:**

- [ ] Test full onboarding → development flow
- [ ] Test decision prompts during development
- [ ] Test product analyzer integration
- [ ] Test state file consistency

**Edge Cases:**

- [ ] Empty product vision
- [ ] All "custom" tech stack answers
- [ ] No features defined
- [ ] Interrupted setup 3 times
- [ ] Decisions.json corruption
- [ ] Setup-progress.json corruption

**Performance:**

- [ ] Onboarding completes in <5 minutes
- [ ] No noticeable lag between questions
- [ ] Product spec generation < 2 seconds
- [ ] Product analyzer runs < 5 seconds

**Ship Checklist:**

- [ ] All tests passing
- [ ] Documentation complete
- [ ] Example flows documented
- [ ] Backward compatibility verified
- [ ] Git commit with clear message
- [ ] Tag release: `v1.1.0-interactive-onboarding`

---

## Phase 2: Polish - Ship in 2 Weeks (Optional)

### Week 2: Reverse-Engineering Mode

**Files to Update:**

- [ ] `.claude/commands/agentful-init.md`
  - [ ] Add codebase detection
  - [ ] Add domain extraction
  - [ ] Add feature reverse-engineering
  - [ ] Add tech stack inference

- [ ] `.claude/agents/product-analyzer.md`
  - [ ] Add reverse-engineering capability
  - [ ] Add code-to-spec generation
  - [ ] Add confidence scoring

**Implementation:**

```javascript
function reverseEngineerFromCode() {
  // Scan codebase
  const detected = detectCodebaseStructure();

  // Show detected domains
  const confirm = AskUserQuestion({
    question: "I detected these domains. Generate spec?",
    context: `
Detected:
${detected.domains.map(d => `- ${d.name} (${d.confidence}% confidence)`).join('\n')}

Tech stack: ${detected.techStack}
    `,
    options: [
      { id: 'yes', label: 'Generate spec', value: 'yes' },
      { id: 'no', label: 'Manual setup', value: 'no' }
    ]
  });

  if (confirm.value === 'yes') {
    return generateSpecFromCode(detected);
  }
}
```

---

### Week 3: Smart Context + Defaults

**Files to Update:**

- [ ] `.claude/agents/orchestrator.md`
  - [ ] Add `explainWhyItMatters()` function
  - [ ] Add `suggestDefaultOption()` function
  - [ ] Add tech stack-aware recommendations

**Implementation:**

```javascript
function explainWhyItMatters(question) {
  // Use LLM knowledge to explain decision impact
  if (question.includes("auth")) {
    return `
JWT: Stateless, scales horizontally, requires refresh logic
Sessions: Simple, server-side, doesn't scale horizontally
OAuth: Delegate to provider, faster but external dependency

Your stack (${techStack.backend}) works with all options.
    `;
  }
  // ... more patterns
}

function suggestDefaultOption(question, context) {
  // Analyze question + context to recommend
  // Example: If Next.js detected, recommend NextAuth for auth
}
```

---

### Week 4: Metrics + Analytics

**Files to Create:**

- [ ] `.agentful/metrics.json` (local only, gitignored)
  - [ ] Track onboarding duration
  - [ ] Track setup completion rate
  - [ ] Track decision response times
  - [ ] Track readiness scores

**Files to Update:**

- [ ] `.claude/commands/agentful-init.md`
  - [ ] Add telemetry calls (opt-in)
  - [ ] Track key events

**Schema:**

```json
{
  "onboarding": {
    "total_starts": 15,
    "total_completions": 13,
    "avg_duration_seconds": 240,
    "abandonment_rate": 0.13
  },
  "decisions": {
    "total_prompted": 45,
    "total_deferred": 8,
    "avg_response_time_seconds": 42
  }
}
```

---

## Validation Criteria (Before Ship)

### Functional Requirements

- [ ] User can complete onboarding in <5 minutes
- [ ] User can resume interrupted setup
- [ ] User can skip setup entirely
- [ ] Product spec is auto-generated correctly
- [ ] Product analyzer runs automatically
- [ ] Blocking issues are surfaced immediately
- [ ] Decision prompts appear in real-time
- [ ] "Decide later" option always available

### Non-Functional Requirements

- [ ] No breaking changes to existing users
- [ ] All state files have valid JSON schemas
- [ ] Error messages are clear and actionable
- [ ] Progress indicators show current step
- [ ] Questions have helpful context
- [ ] Recommended options are marked
- [ ] Custom input is always allowed

### User Experience

- [ ] Questions feel helpful, not annoying
- [ ] Context explains "why" for each question
- [ ] Smart defaults reduce decision fatigue
- [ ] Escape hatches prevent feeling trapped
- [ ] Progress is visible throughout
- [ ] Completion is celebrated

---

## Rollback Plan (If Issues Found)

**Emergency Rollback:**

1. Remove `/agentful-init` command
2. Revert `/agentful-start` to previous version
3. Revert `orchestrator.md` to passive decision handling
4. Delete `.agentful/setup-progress.json` files
5. Tag rollback commit: `v1.0.5-rollback-interactive`

**Partial Rollback:**

- Keep `/agentful-init` as opt-in
- Disable first-run detection in `/agentful-start`
- Make proactive decisions opt-in via preferences

---

## Success Metrics (Post-Launch)

**Track These (Week 1):**

- Time to first feature (target: <5 min)
- Setup completion rate (target: >80%)
- Product spec readiness score (target: >75%)
- Blocking issues on first run (target: <1)
- Setup abandonment rate (target: <20%)

**Track These (Week 2-4):**

- Decision response time (target: <60 sec)
- Deferred decision rate (target: <25%)
- Manual refinement rate (via `/agentful-product`)
- Repeat init rate (users reconfiguring)

**User Feedback:**

- Collect feedback via GitHub issues
- Monitor Discord/Slack channels
- Track support questions about onboarding
- Survey users: "How was onboarding? (1-5)"

---

## Post-Ship TODO

**Immediate (Day 1-7):**

- [ ] Monitor error rates
- [ ] Fix critical bugs
- [ ] Update documentation based on feedback
- [ ] Create video walkthrough

**Short-term (Week 2-4):**

- [ ] Implement most-requested improvements
- [ ] Optimize slow steps
- [ ] Add more context explanations
- [ ] Improve error messages

**Long-term (Month 2+):**

- [ ] Phase 2: Reverse-engineering mode
- [ ] Phase 2: Smart context + defaults
- [ ] Phase 2: Metrics tracking
- [ ] Phase 3: Multi-step flows
- [ ] Phase 3: Rich input validation

---

## Resources

**Reference Documents:**

- `/Users/blitz/Development/agentful/docs/analysis/onboarding-askuserquestion-strategy.md` - Full strategy
- `/Users/blitz/Development/agentful/docs/analysis/onboarding-flow-diagram.md` - Visual diagrams
- `.claude/agents/orchestrator.md` - Orchestrator patterns
- `.claude/agents/product-analyzer.md` - Analysis logic

**Test Projects:**

- Create test fixture: Empty Next.js project
- Create test fixture: Existing e-commerce codebase
- Create test fixture: Corrupted state files
- Create test fixture: Minimal CLI project

---

## Questions for Team

**Before Implementation:**

1. Should `/agentful-init` run automatically on first `/agentful-start`?
   - Pro: Zero-config onboarding
   - Con: May surprise users

2. Should we make reverse-engineering mode part of MVP?
   - Pro: Expands use cases immediately
   - Con: Adds complexity

3. How should we handle team projects (shared product specs)?
   - Phase 1: Single-user only
   - Future: Git-based sync

4. Should metrics be opt-in or opt-out?
   - Recommendation: Opt-in (privacy-first)

**After MVP:**

1. Which Phase 2 features should we prioritize?
2. What pain points did early users report?
3. Should we create video tutorials?
4. Should we build a web-based config generator?

---

**Ready to build? Let's ship this! 🚀**
