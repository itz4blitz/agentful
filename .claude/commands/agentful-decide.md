---
name: agentful-decide
description: Answer pending decisions that are blocking development progress.
---

# agentful Decide

This command helps you resolve pending decisions that are blocking development.

## Process

### 0. Validate Decisions File

Before reading decisions, validate the file structure:

```javascript
function validate_state_file(file_path, required_fields) {
  // Check file exists
  if (!exists(file_path)) {
    return { valid: false, error: `File not found: ${file_path}`, action: "initialize" };
  }

  // Check file is valid JSON
  let content;
  try {
    content = JSON.parse(Read(file_path));
  } catch (e) {
    return { valid: false, error: `Invalid JSON in ${file_path}`, action: "backup_and_reset" };
  }

  // Check required fields exist
  for (const field of required_fields) {
    if (!(field in content)) {
      return { valid: false, error: `Missing field '${field}' in ${file_path}`, action: "add_field", missing_field: field };
    }
  }

  return { valid: true, content };
}
```

```bash
# Validate decisions.json
validation = validate_state_file(".agentful/decisions.json", ["pending", "resolved"])

if !validation.valid:
  if validation.action == "initialize":
    # Create default decisions.json with empty arrays
    Write(".agentful/decisions.json", JSON.stringify({
      pending: [],
      resolved: []
    }))
    console.log(`
✅ No pending decisions!

All features are unblocked. Run /agentful-start to continue development.
`)
    return  # Exit - no decisions to process
  else if validation.action == "backup_and_reset":
    # Backup corrupted file
    Bash("cp .agentful/decisions.json .agentful/decisions.json.backup-$(date +%s)")
    # Create fresh file
    Write(".agentful/decisions.json", JSON.stringify({
      pending: [],
      resolved: []
    }))
    console.log("⚠️  Corrupted decisions.json backed up and reset. No decisions to process.")
    return
  else if validation.action == "add_field":
    content = JSON.parse(Read(".agentful/decisions.json"))
    if validation.missing_field == "pending":
      content.pending = []
    else if validation.missing_field == "resolved":
      content.resolved = []
    Write(".agentful/decisions.json", JSON.stringify(content))
    console.log("✓ Repaired decisions.json with missing fields")
```

### 1. Read Decisions

Read `.agentful/decisions.json`:

```json
{
  "pending": [
    {
      "id": "decision-001",
      "question": "How should we handle inventory race conditions during flash sales?",
      "options": [
        "Pessimistic locking (database row locks during checkout)",
        "Optimistic locking with automatic retry on conflict",
        "Queue-based processing (serialize checkout requests)"
      ],
      "context": "Shopfinity e-commerce platform expects 1000+ concurrent checkouts during Black Friday. Current implementation allows overselling when multiple users attempt to purchase the same item simultaneously.",
      "blocking": ["checkout-feature", "order-history-feature"],
      "timestamp": "2026-01-18T00:00:00Z"
    }
  ],
  "resolved": []
}
```

### 2. Validate Blocked Features

Before presenting decisions, validate that blocked features referenced actually exist:

```javascript
function validate_blocking_references(decision, productSpec) {
  const invalidRefs = [];

  for (const blockedFeature of decision.blocking || []) {
    // Check if feature exists in product spec
    let found = false;

    // Check flat features
    if (productSpec.features && productSpec.features[blockedFeature]) {
      found = true;
    }

    // Check domain-nested features
    if (productSpec.domains) {
      for (const [domainId, domain] of Object.entries(productSpec.domains)) {
        if (domain.features && domain.features[blockedFeature]) {
          found = true;
          break;
        }
        // Check with domain prefix (e.g., "checkout-feature" vs just "feature")
        if (blockedFeature.startsWith(domainId + '-')) {
          const featureName = blockedFeature.substring(domainId.length + 1);
          if (domain.features && domain.features[featureName]) {
            found = true;
            break;
          }
        }
      }
    }

    if (!found) {
      invalidRefs.push(blockedFeature);
    }
  }

  if (invalidRefs.length > 0) {
    console.warn(`⚠️  Decision ${decision.id} references non-existent features: ${invalidRefs.join(', ')}`);
    console.warn(`   These features are not found in .claude/product/`);
    console.warn(`   Decision may be stale or product spec changed.`);
  }

  return invalidRefs;
}
```

### 3. Present to User

For each pending decision, use AskUserQuestion tool:

```javascript
// Load product spec to validate blocked features
const productSpec = load_product_spec('.claude/product/');

// For each decision
for (const decision of decisions.pending) {
  // Validate blocking references
  const invalidRefs = validate_blocking_references(decision, productSpec);

  // Present using AskUserQuestion
  const response = AskUserQuestion({
    question: decision.question,
    context: `
${decision.context}

${invalidRefs.length > 0 ? `⚠️ Warning: Some blocked features not found in product spec: ${invalidRefs.join(', ')}` : ''}

Blocking: ${decision.blocking.join(', ')}
`,
    options: [
      ...decision.options.map((opt, idx) => ({
        id: `option-${idx + 1}`,
        label: opt,
        value: opt
      })),
      {
        id: 'custom',
        label: 'Custom input...',
        value: '__CUSTOM__'
      }
    ]
  });

  // Handle response (see next section)
  process_decision_response(decision, response);
}
```

### 4. Process Decision Response

Handle user's choice, including custom input:

```javascript
function process_decision_response(decision, response) {
  let finalAnswer;

  if (response.value === '__CUSTOM__') {
    // Option 4: Custom input handling
    const customAnswer = AskUserQuestion({
      question: `Please provide your custom solution for: ${decision.question}`,
      context: decision.context,
      input_type: 'text' // Free-form text input
    });

    finalAnswer = customAnswer.text || customAnswer.value;

    // Validate custom answer is not empty
    if (!finalAnswer || finalAnswer.trim().length === 0) {
      console.log("❌ Custom answer cannot be empty. Decision not recorded.");
      return;
    }
  } else {
    // User selected a predefined option
    finalAnswer = response.value;
  }

  // Record the decision
  record_decision(decision, finalAnswer);
}
```

### 5. Record Decision with History

Append to history instead of overwriting:

```javascript
function record_decision(decision, answer) {
  // Read current decisions
  const decisionsFile = Read('.agentful/decisions.json');
  const decisions = JSON.parse(decisionsFile);

  // Create resolved entry with full history
  const resolvedEntry = {
    id: decision.id,
    question: decision.question,
    options: decision.options || [],
    context: decision.context || "",
    blocking: decision.blocking || [],
    answer: answer,
    timestamp_asked: decision.timestamp,
    timestamp_resolved: new Date().toISOString()
  };

  // Remove from pending
  decisions.pending = decisions.pending.filter(d => d.id !== decision.id);

  // Append to resolved history (don't overwrite)
  if (!decisions.resolved) {
    decisions.resolved = [];
  }
  decisions.resolved.push(resolvedEntry);

  // Keep last 100 resolved decisions (prevent unbounded growth)
  if (decisions.resolved.length > 100) {
    decisions.resolved = decisions.resolved.slice(-100);
  }

  // Save updated decisions
  Write('.agentful/decisions.json', JSON.stringify(decisions, null, 2));

  console.log(`✅ Decision ${decision.id} resolved: ${answer}`);

  // Update state.json to unblock features
  update_blocked_features(decision.blocking);
}

function update_blocked_features(blockedFeatures) {
  if (!blockedFeatures || blockedFeatures.length === 0) return;

  const stateFile = Read('.agentful/state.json');
  const state = JSON.parse(stateFile);

  // Remove these features from blocked_on array
  if (state.blocked_on) {
    state.blocked_on = state.blocked_on.filter(
      feature => !blockedFeatures.includes(feature)
    );
  }

  state.last_updated = new Date().toISOString();

  Write('.agentful/state.json', JSON.stringify(state, null, 2));
}
```

### 6. Summary Output

After all decisions are resolved:

```
✅ All decisions resolved!

Resolved:
  1. How should we handle inventory race conditions? → Queue-based processing
  2. Which payment gateway should we use? → Stripe

Unblocked features: checkout-feature, order-history-feature, payment-integration

Run /agentful-start to continue development.
```

## Example Decisions Across Different Domains

**SaaS Billing Platform:**
```
Question: How should we prorate subscription changes mid-cycle?

Options:
  [1] Prorate to the day (calculate daily rate)
  [2] Prorate to the week (simpler calculation)
  [3] Charge full amount, credit next cycle
  [4] Custom input...

Context: Startup plan users frequently upgrade/downgrade.
Complex daily proration may confuse customers on invoices.

Blocking: subscription-management, invoice-generation
```

**Content Management System:**
```
Question: How should we handle concurrent content edits?

Options:
  [1] Last write wins (overwrite without warning)
  [2] Optimistic locking (show conflict, let user merge)
  [3] Pessimistic locking (lock document on edit)
  [4] Google Docs-style real-time collaboration

Context: Marketing team of 12 editors reports frequent
conflicts when updating blog posts and landing pages.

Blocking: content-editor, version-control
```

**Project Management Tool:**
```
Question: How should we calculate project completion percentage?

Options:
  [1] Equal weight (all tasks count equally)
  [2] Story points (weighted by effort estimate)
  [3] Time spent (weighted by actual hours logged)
  [4] Custom (manual percentage per task)

Context: Developers complain that completing 10 small tasks
shows same progress as 1 complex architectural change.

Blocking: dashboard, reporting-metrics
```

## Interactive Mode

If there are multiple pending decisions, process them one at a time:

```
You have 3 pending decisions to resolve:

[1/3] How should we handle inventory race conditions?
  > 3 (Queue-based processing)

[2/3] Which payment gateway should we use?
  > 1

[3/3] Should we support international shipping from day 1?
  > 4 (custom: "Only US and Canada, expand in Q2")

✅ All decisions resolved! Run /agentful-start to continue.
```

## No Pending Decisions

If decisions.json is empty or pending array is empty:

```
✅ No pending decisions!

All features are unblocked. Run /agentful-start to continue development.
```

## Complete Implementation Flow

```javascript
async function execute_decide_command() {
  // 1. Validate decisions.json
  const validation = validate_state_file('.agentful/decisions.json', ['pending', 'resolved']);

  if (!validation.valid) {
    handle_invalid_file(validation);
    return;
  }

  const decisions = validation.content;

  // 2. Check if there are pending decisions
  if (!decisions.pending || decisions.pending.length === 0) {
    console.log(`
✅ No pending decisions!

All features are unblocked. Run /agentful-start to continue development.
`);
    return;
  }

  // 3. Load product spec for validation
  const productSpec = load_product_spec('.claude/product/');

  // 4. Process each decision
  const resolved = [];

  for (let i = 0; i < decisions.pending.length; i++) {
    const decision = decisions.pending[i];

    console.log(`\n[${i + 1}/${decisions.pending.length}] ${decision.question}`);

    // Validate blocked features exist
    const invalidRefs = validate_blocking_references(decision, productSpec);

    // Present decision to user
    const response = AskUserQuestion({
      question: decision.question,
      context: `
${decision.context}

${invalidRefs.length > 0 ? `⚠️ Warning: Some blocked features not found in product spec: ${invalidRefs.join(', ')}` : ''}

Blocking: ${decision.blocking.join(', ')}
`,
      options: [
        ...decision.options.map((opt, idx) => ({
          id: `option-${idx + 1}`,
          label: opt,
          value: opt
        })),
        {
          id: 'custom',
          label: 'Custom input...',
          value: '__CUSTOM__'
        }
      ]
    });

    // Handle response
    const answer = process_decision_response(decision, response);

    if (answer) {
      record_decision(decision, answer);
      resolved.push({ question: decision.question, answer });
    }
  }

  // 5. Show summary
  if (resolved.length > 0) {
    console.log(`
✅ All decisions resolved!

Resolved:
${resolved.map((r, i) => `  ${i + 1}. ${r.question} → ${r.answer}`).join('\n')}

Run /agentful-start to continue development.
`);
  }
}
```
