---
name: agentful
description: Natural conversational interface to agentful. Ask questions, request features, check status, or continue development.
---

# agentful Conversational Interface

This command provides a natural, conversational way to interact with agentful. Just type what you want in plain English - no need to remember specific commands.

## Core Philosophy

**Natural language → agentful action**

Users should be able to:
- Ask "How's it going?" → Get status
- Say "Add user profiles" → Start feature development
- Request "Run tests" → Execute validation
- Question "What's left?" → See remaining work

The system understands intent and routes to the appropriate specialist agent or command.

## Startup Sequence

### 1. Load Conversation Context

```bash
# Read conversation history
conversation_history = read_json(".agentful/conversation-history.json")

# Initialize if doesn't exist
if !conversation_history:
  conversation_history = {
    "version": "1.0",
    "session_id": generate_uuid(),
    "started_at": current_timestamp(),
    "messages": [],
    "context": {
      "last_intent": null,
      "last_feature": null,
      "last_domain": null,
      "conversation_state": "new"
    }
  }
```

### 2. Load Product State

```bash
# Auto-detect product structure
product_structure = detect_product_structure()

if product_structure == "flat":
  product_spec = read_file("PRODUCT.md")
else if product_structure == "hierarchical":
  product_spec = read_file(".claude/product/index.md")
  domain_structure = scan_directory(".claude/product/domains/")

# Load state files
state = read_json(".agentful/state.json")
completion = read_json(".agentful/completion.json")
decisions = read_json(".agentful/decisions.json")
```

### 3. Classify User Intent

See Intent Classification Algorithm below.

### 4. Execute Action

Route to appropriate handler based on classified intent.

### 5. Update Conversation History

```bash
conversation_history.messages.append({
  "timestamp": current_timestamp(),
  "user_input": user_input,
  "classified_intent": intent,
  "action_taken": action,
  "result": summary
})

conversation_history.context.last_intent = intent
conversation_history.context.conversation_state = "active"

write_json(".agentful/conversation-history.json", conversation_history)
```

## Intent Classification Algorithm

### Decision Tree

```
FUNCTION classify_intent(user_input, conversation_context, product_state):

  # Normalize input
  input_lower = user_input.lower().strip()

  # Check for GREETING patterns
  if matches_any(input_lower, [
    "hi", "hello", "hey", "greetings", "good morning", "good afternoon"
  ]):
    return {
      "intent": "GREETING",
      "confidence": 0.95,
      "action": "show_welcome",
      "response": "greet_user"
    }

  # Check for STATUS/PROGRESS queries
  if matches_any(input_lower, [
    "how's it going", "hows it going", "what's the status", "whats the status",
    "how are things", "progress", "where are we", "current status",
    "what's done", "whats done", "what's left", "whats left",
    "what remains", "how much is complete", "completion",
    "what are you working on", "what're you working on"
  ]):
    return {
      "intent": "STATUS_QUERY",
      "confidence": 0.9,
      "action": "show_status",
      "handler": "agentful-status"
    }

  # Check for WHAT CAN YOU DO queries
  if matches_any(input_lower, [
    "what can you do", "help", "capabilities", "what do you do",
    "how does this work", "explain agentful", "what is agentful",
    "commands available", "available commands"
  ]):
    return {
      "intent": "HELP_QUERY",
      "confidence": 0.95,
      "action": "show_help",
      "response": "display_capabilities"
    }

  # Check for feature requests (KEYWORDS + PATTERNS)
  feature_keywords = extract_feature_keywords(product_spec)
  action_phrases = [
    "add", "create", "build", "implement", "make", "develop",
    "start", "begin", "work on", "do", "add feature", "new feature"
  ]

  if contains_any(input_lower, action_phrases):
    # Extract feature name from input
    mentioned_feature = find_mentioned_feature(input_lower, product_spec)

    if mentioned_feature:
      return {
        "intent": "FEATURE_REQUEST",
        "confidence": 0.85,
        "action": "start_feature",
        "feature": mentioned_feature,
        "handler": "orchestrator",
        "workflow": "FEATURE_DEVELOPMENT"
      }
    else:
      # Ambiguous feature request
      return {
        "intent": "AMBIGUOUS_FEATURE",
        "confidence": 0.6,
        "action": "clarify_feature",
        "response": "ask_which_feature"
      }

  # Check for bug fix requests
  if matches_any(input_lower, [
    "fix", "bug", "issue", "problem", "error", "broken",
    "not working", "doesn't work", "doesnt work"
  ]):
    return {
      "intent": "BUGFIX_REQUEST",
      "confidence": 0.8,
      "action": "start_bugfix",
      "handler": "orchestrator",
      "workflow": "BUGFIX"
    }

  # Check for validation/test requests
  if matches_any(input_lower, [
    "test", "check", "validate", "verify", "run tests", "check quality",
    "quality check", "validation", "audit", "review"
  ]):
    return {
      "intent": "VALIDATION_REQUEST",
      "confidence": 0.9,
      "action": "run_validation",
      "handler": "agentful-validate"
    }

  # Check for decision-related queries
  if matches_any(input_lower, [
    "decisions", "choices", "pending", "blocking", "what needs input",
    "what do you need from me", "what's blocking", "whats blocking"
  ]):
    return {
      "intent": "DECISION_QUERY",
      "confidence": 0.85,
      "action": "show_decisions",
      "handler": "agentful-decide"
    }

  # Check for continue/resume patterns
  if matches_any(input_lower, [
    "continue", "resume", "keep going", "next", "what's next", "whats next",
    "carry on", "proceed", "start working", "begin"
  ]):
    return {
      "intent": "CONTINUE_REQUEST",
      "confidence": 0.85,
      "action": "continue_development",
      "handler": "agentful-start"
    }

  # Check for stop/pause patterns
  if matches_any(input_lower, [
    "stop", "pause", "halt", "wait", "take a break"
  ]):
    return {
      "intent": "STOP_REQUEST",
      "confidence": 0.9,
      "action": "pause_development",
      "response": "confirm_pause"
    }

  # Check for explanation/clarification queries about product
  if matches_any(input_lower, [
    "what are we building", "tell me about", "explain the", "describe the",
    "what does this do", "how does", "tell me more about"
  ]):
    return {
      "intent": "PRODUCT_QUERY",
      "confidence": 0.8,
      "action": "explain_product",
      "response": "product_explanation"
    }

  # Check for tech stack queries
  if matches_any(input_lower, [
    "tech stack", "technologies", "framework", "libraries", "what are we using",
    "what tech", "stack", "dependencies"
  ]):
    return {
      "intent": "TECH_STACK_QUERY",
      "confidence": 0.85,
      "action": "show_tech_stack",
      "response": "tech_stack_summary"
    }

  # Check for architecture/structure queries
  if matches_any(input_lower, [
    "architecture", "structure", "folder", "directory", "organization",
    "how is it organized", "project structure", "code structure"
  ]):
    return {
      "intent": "ARCHITECTURE_QUERY",
      "confidence": 0.8,
      "action": "show_architecture",
      "response": "architecture_explanation"
    }

  # Check for domain/feature listing
  if matches_any(input_lower, [
    "what features", "list features", "show features", "all features",
    "feature list", "domains", "what domains"
  ]):
    return {
      "intent": "FEATURE_LIST_QUERY",
      "confidence": 0.9,
      "action": "list_features",
      "response": "feature_list"
    }

  # Check for configuration/settings
  if matches_any(input_lower, [
    "settings", "config", "configuration", "options", "preferences"
  ]):
    return {
      "intent": "CONFIG_QUERY",
      "confidence": 0.8,
      "action": "show_config",
      "response": "configuration_summary"
    }

  # Check for agent-related queries
  if matches_any(input_lower, [
    "agents", "who is working", "which agent", "agent roles", "specialists"
  ]):
    return {
      "intent": "AGENT_QUERY",
      "confidence": 0.85,
      "action": "show_agents",
      "response": "agent_summary"
    }

  # Default: Generic conversation
  return {
    "intent": "GENERIC_CONVERSATION",
    "confidence": 0.5,
    "action": "conversation_fallback",
    "response": "ask_clarification"
  }
```

## Conversation History Schema

### File: `.agentful/conversation-history.json`

```json
{
  "version": "1.0",
  "session_id": "uuid-v4",
  "started_at": "2026-01-18T10:30:00Z",
  "last_updated": "2026-01-18T10:35:00Z",
  "messages": [
    {
      "id": "msg-001",
      "timestamp": "2026-01-18T10:30:00Z",
      "user_input": "How's it going?",
      "classified_intent": "STATUS_QUERY",
      "confidence": 0.9,
      "action_taken": "show_status",
      "result_summary": "Displayed progress: 65% complete, 3 features done, 2 in progress"
    },
    {
      "id": "msg-002",
      "timestamp": "2026-01-18T10:31:00Z",
      "user_input": "Add user profiles",
      "classified_intent": "FEATURE_REQUEST",
      "confidence": 0.85,
      "action_taken": "start_feature",
      "feature": "user-profiles",
      "result_summary": "Started user-profiles feature, delegated to backend agent"
    }
  ],
  "context": {
    "last_intent": "FEATURE_REQUEST",
    "last_feature": "user-profiles",
    "last_domain": null,
    "conversation_state": "active",
    "thread_continuity": {
      "features_discussed": ["user-profiles", "authentication"],
      "questions_asked": 2,
      "actions_taken": 1
    }
  }
}
```

## Product Structure Detection

```bash
FUNCTION detect_product_structure():
  # Check for hierarchical structure
  if directory_exists(".claude/product/domains/"):
    domains = list_directories(".claude/product/domains/")
    if domains.length > 0:
      return {
        "type": "hierarchical",
        "path": ".claude/product/",
        "domains": domains,
        "index_file": ".claude/product/index.md"
      }

  # Check for flat structure (root PRODUCT.md)
  if file_exists("PRODUCT.md"):
    return {
      "type": "flat",
      "path": "PRODUCT.md",
      "index_file": "PRODUCT.md"
    }

  # Check for flat structure (.claude/product/index.md)
  if file_exists(".claude/product/index.md"):
    return {
      "type": "flat",
      "path": ".claude/product/",
      "index_file": ".claude/product/index.md"
    }

  # No product spec found
  return {
    "type": "none",
    "error": "No product specification found. Please create PRODUCT.md or .claude/product/index.md"
  }
```

## Intent Handlers

### GREETING Handler

```bash
FUNCTION handle_greeting():
  # Check if new conversation
  if conversation_context.conversation_state == "new":
    return """
    Hey! I'm agentful, your autonomous development companion.

    I can help you:
    • Build features - "Add user authentication"
    • Check progress - "How's it going?"
    • Fix bugs - "Fix the login bug"
    • Run tests - "Check if everything works"
    • Answer questions - "What are we building?"

    What would you like to do?
    """
  else:
    # Returning conversation
    last_action = conversation_context.last_intent
    return """
    Hey again! Last we were working on: {last_action}

    Want to continue, or start something new?
    """
```

### STATUS_QUERY Handler

```bash
FUNCTION handle_status_query():
  # Delegate to agentful-status command
  Task("agentful-status", "Display current development status")
```

### FEATURE_REQUEST Handler

```bash
FUNCTION handle_feature_request(feature_name):
  # Validate feature exists in product spec
  if feature_exists(feature_name, product_spec):
    # Update conversation context
    conversation_context.last_feature = feature_name
    conversation_context.last_intent = "FEATURE_REQUEST"

    # Delegate to orchestrator
    Task("orchestrator", "User requested feature: {feature_name}. Start FEATURE_DEVELOPMENT workflow.")
  else:
    # Feature not found in spec
    return """
    I couldn't find "{feature_name}" in the product specification.

    Available features:
    {list_features_from_spec()}

    Which one would you like to build?
    """
```

### AMBIGUOUS_FEATURE Handler

```bash
FUNCTION handle_ambiguous_feature(user_input):
  # Try to find partial matches
  potential_matches = fuzzy_search_features(user_input, product_spec)

  if potential_matches.length > 0:
    return """
    I'm not sure which feature you mean. Did you mean:

    {display_potential_matches(potential_matches)}

    Please clarify, or say "list features" to see all options.
    """
  else:
    return """
    I couldn't find that feature in your product specification.

    Would you like to:
    • See all features - "list features"
    • Add it to the spec - "add {feature} to product spec"
    • Something else - just ask
    """
```

### BUGFIX_REQUEST Handler

```bash
FUNCTION handle_bugfix_request():
  # Extract bug details from conversation
  bug_description = extract_bug_info(user_input, conversation_history)

  # Delegate to orchestrator with BUGFIX workflow
  Task("orchestrator", """
    User reported a bug: {bug_description}

    Start BUGFIX workflow:
    1. Investigate the issue
    2. Identify root cause
    3. Implement fix
    4. Validate fix
    5. Update completion status
  """)
```

### VALIDATION_REQUEST Handler

```bash
FUNCTION handle_validation_request():
  # Delegate to agentful-validate
  Task("agentful-validate", "Run all quality checks and validation gates")
```

### DECISION_QUERY Handler

```bash
FUNCTION handle_decision_query():
  # Check if decisions are pending
  decisions = read_json(".agentful/decisions.json")

  if decisions.pending.length > 0:
    return """
    You have {decisions.pending.length} decisions needed:

    {format_pending_decisions(decisions.pending)}

    Run: /agentful-decide to answer them
    """
  else:
    return "No pending decisions! Development is unblocked."
```

### CONTINUE_REQUEST Handler

```bash
FUNCTION handle_continue_request():
  # Delegate to agentful-start
  Task("agentful-start", "Continue autonomous development loop")
```

### PRODUCT_QUERY Handler

```bash
FUNCTION handle_product_query():
  product_info = parse_product_spec(product_spec)

  return """
  We're building: {product_info.name}

  Overview:
  {product_info.overview}

  Tech Stack:
  {format_tech_stack(product_info.tech_stack)}

  Total Features: {product_info.feature_count}
  Progress: {product_info.completion_percent}%

  Want more details? Try:
  • "list features" - See all features
  • "architecture" - See project structure
  • "tech stack" - Detailed tech info
  """
```

### FEATURE_LIST_QUERY Handler

```bash
FUNCTION handle_feature_list_query():
  features = extract_all_features(product_spec, product_structure)

  return """
  Product Features:

  {format_feature_list(features)}

  Status Legend:
  ✅ Complete  🔄 In Progress  ⏸ Pending  ⚠️ Blocked

  Want to start working on one? Just say: "Add [feature name]"
  """
```

### GENERIC_CONVERSATION Handler

```bash
FUNCTION handle_generic_conversation(user_input):
  return """
  I'm not sure what you mean. Here's what I can do:

  Development:
  • "Add [feature]" - Start building a feature
  • "Fix [bug]" - Fix an issue
  • "Continue" - Resume development
  • "Stop" - Pause development

  Information:
  • "How's it going?" - Check progress
  • "What's left?" - See remaining work
  • "List features" - See all features
  • "What are we building?" - Product overview
  • "Tech stack" - See technologies used

  Quality:
  • "Run tests" - Execute validation
  • "Check quality" - Run quality gates

  Help:
  • "What can you do?" - See capabilities

  What would you like to do?
  """
```

## Orchestrator Integration

When delegating to orchestrator, pass conversation context:

```bash
Task("orchestrator", """
  User Request: {user_input}
  Classified Intent: {intent}
  Feature: {feature_name}

  Conversation Context:
  - Session ID: {session_id}
  - Previous Actions: {action_history}
  - Last Feature: {last_feature}
  - Thread Continuity: {thread_context}

  Execute appropriate workflow based on intent.
  Report back with results for conversation history.
""")
```

## Edge Case Handling

### Edge Case 1: Ambiguous Request

**Scenario**: User says "Add the thing for users"

**Handling**:
```bash
potential_matches = [
  "user-authentication",
  "user-profiles",
  "user-management",
  "user-preferences"
]

return """
I found multiple user-related features:
1. User Authentication
2. User Profiles
3. User Management
4. User Preferences

Which one do you want to add?
"""
```

### Edge Case 2: Feature Not in Spec

**Scenario**: User says "Add payment processing" but it's not in PRODUCT.md

**Handling**:
```bash
return """
"Payment processing" isn't in your product specification.

You have two options:

1. Add it to the spec first:
   - Edit PRODUCT.md or .claude/product/index.md
   - Add the feature with acceptance criteria
   - Then say "Add payment processing" again

2. Build from an existing feature:
   • User Authentication
   • User Profiles
   • Dashboard

Which would you prefer?
"""
```

### Edge Case 3: Context Loss After Long Pause

**Scenario**: User returns after 2 hours, conversation history exists but state changed

**Handling**:
```bash
time_since_last_message = current_time - last_message_timestamp

if time_since_last_message > 30 minutes:
  # Reload all state
  state = read_json(".agentful/state.json")
  completion = read_json(".agentful/completion.json")

  return """
  Welcome back! While you were gone:
  • Completed: {completed_features}
  • Now working on: {current_task}
  • Progress: {progress_percent}%

  Want to continue where we left off?
  """
```

### Edge Case 4: Conflicting Instructions

**Scenario**: User says "Add authentication" but it's already complete

**Handling**:
```bash
feature_status = get_feature_status("authentication")

if feature_status.status == "complete":
  return """
  Authentication is already complete! ✅

  Completed at: {feature_status.completed_at}

  Would you like to:
  • Work on a different feature - "list features"
  • Modify authentication - "Update authentication"
  • Review it - "Review authentication"
  """
```

### Edge Case 5: Multiple Actions in One Message

**Scenario**: User says "Add user profiles and then run tests"

**Handling**:
```bash
actions = parse_multiple_actions(user_input)

return """
I can do both! Here's my plan:

1. Add user profiles
   → Delegate to orchestrator

2. Run tests
   → Delegate to validator

Should I proceed with both, or just one?
"""
```

### Edge Case 6: Product Structure Changed

**Scenario**: Conversation started with flat PRODUCT.md, user migrated to hierarchical

**Handling**:
```bash
current_structure = detect_product_structure()
cached_structure = conversation_context.product_structure

if current_structure != cached_structure:
  return """
  I notice your product structure changed!

  Before: {cached_structure}
  Now: {current_structure}

  I've updated my understanding. What would you like to work on?
  """
```

### Edge Case 7: Low Confidence Classification

**Scenario**: Intent classification returns confidence < 0.6

**Handling**:
```bash
if intent.confidence < 0.6:
  return """
  I'm not sure what you mean by: "{user_input}"

  Did you mean:
  • Feature request - "Add [feature name]"
  • Status check - "How's it going?"
  • Question - "What are we building?"
  • Help - "What can you do?"

  Could you rephrase that?
  """
```

### Edge Case 8: No Product Spec Exists

**Scenario**: New project, no PRODUCT.md or .claude/product/

**Handling**:
```bash
if product_structure.type == "none":
  return """
  Welcome to agentful! I don't see a product specification yet.

  To get started, you need to define what you're building.

  Quick Start:
  1. Create a PRODUCT.md file at your project root
  2. Add your features and requirements
  3. Run this command again

  Or initialize a template:
  ```bash
  npx @itz4blitz/agentful init
  ```

  Need help? Check the docs at https://agentful.app
  """
```

### Edge Case 9: Decision Blocking Development

**Scenario**: User says "Continue" but decisions are pending

**Handling**:
```bash
decisions = read_json(".agentful/decisions.json")

if decisions.pending.length > 0:
  return """
  Can't continue yet - {decisions.pending.length} decisions need your input:

  {format_pending_decisions()}

  Run: /agentful-decide to resolve them

  Once decisions are made, I can continue development.
  """
```

### Edge Case 10: User Wants to Modify Existing Feature

**Scenario**: User says "Change authentication to use OAuth"

**Handling**:
```bash
return """
I can help modify the authentication feature!

Current Implementation:
{read_feature_details("authentication")}

Proposed Change:
  Use OAuth instead of JWT

This requires:
1. Updating the product spec
2. Refactoring existing code
3. Testing the new implementation

Should I:
• Create a plan for the change
• Start implementing it
• Discuss the approach first

What would you prefer?
"""
```

## Example Interactions

### Example 1: Feature Development Flow

```
User: /agentful

agentful: Hey! I'm agentful, your autonomous development companion.
I can help you build features, check progress, fix bugs, and more.
What would you like to do?

User: Add user authentication

agentful: Got it! Starting user authentication development...

[Delegates to orchestrator → backend → tester → reviewer]

agentful: Authentication is now 45% complete!
Backend API is done, starting frontend implementation.

User: How's it going?

agentful: Overall Progress: ████████████░░░░ 45%

Features:
✅ Authentication Backend  100%
🔄 Authentication Frontend  45%
⏸ User Profiles              0%

Currently working on: Login page component
Agent: @frontend
Started: 5 minutes ago

Want to continue or check something else?

User: Continue

agentful: [Delegates to agentful-start]
Continuing authentication frontend...
```

### Example 2: Bug Fix Flow

```
User: The login button isn't working

agentful: I'll help fix that!

[Delegates to orchestrator with BUGFIX workflow]

agentful: Investigating login button issue...
Found: onClick handler is missing in LoginForm.tsx:42
Fixing now...

[Code fix applied]

agentful: Fixed! Login button now properly triggers authentication.
Ran tests - all passing. ✅

Anything else?
```

### Example 3: Status Check Flow

```
User: What's left to build?

agentful: Remaining Work:

High Priority:
• User Profiles - Not started
• Dashboard - 30% complete
• Settings - Not started

Medium Priority:
• Notifications - Not started
• Search - Not started

Overall: 12 of 20 features complete (60%)

Want to start on one of these?
```

### Example 4: Ambiguous Request Resolution

```
User: Add the user thing

agentful: I found multiple user-related features:

1. User Authentication - Login, register, logout
2. User Profiles - Profile editing, avatars
3. User Management - Admin user management
4. User Preferences - Settings, notifications

Which one do you want to add?

User: Number 2

agentful: Got it! Starting User Profiles feature...
```

### Example 5: Product Query Flow

```
User: What are we building?

agentful: We're building: TaskFlow

A task management application that helps teams collaborate on projects.
Users can create projects, add tasks with deadlines, assign team members,
and track progress with real-time updates.

Tech Stack:
• Frontend: Next.js 14 + TypeScript + Tailwind
• Backend: Next.js API Routes
• Database: PostgreSQL + Prisma
• Auth: JWT

12 features defined, 8 complete (60%)

Want more details?
```

### Example 6: Context Loss Recovery

```
User: [Returns after 3 hours]
How's it going?

agentful: Welcome back! While you were gone:

✅ Completed:
  • Authentication Frontend (now 100%)
  • User Profiles Backend (now 100%)

🔄 Now Working On:
  • User Profiles Frontend (75%)

⏸ Up Next:
  • Dashboard

Progress increased from 45% → 70%

Want to continue where we left off?
```

### Example 7: Validation Request

```
User: Check if everything works

agentful: Running all quality checks...

[Delegates to agentful-validate → reviewer agent]

agentful: Validation Results:

TypeScript    ✅ PASS - No errors
Lint          ✅ PASS - No issues
Tests         ✅ PASS - 52 tests passing
Coverage      ⚠️  WARN - 76% (needs 80%)
Security      ✅ PASS - No vulnerabilities
Dead Code     ✅ PASS - No dead code

Overall: ⚠️ MINOR ISSUES

Need 4% more test coverage. Want me to add tests?
```

### Example 8: Feature Not in Spec

```
User: Add dark mode

agentful: "Dark mode" isn't in your product specification.

You have two options:

1. Add it to PRODUCT.md first:
   - Define acceptance criteria
   - Then run this command again

2. Build from existing features:
   • User Authentication
   • User Profiles
   • Dashboard

Which would you prefer?

User: Add it to the spec

agentful: I can't modify PRODUCT.md directly, but here's what to add:

```markdown
### Dark Mode - MEDIUM
**Description**: Toggle between light and dark themes

**Acceptance Criteria**:
- [ ] Dark theme toggle in settings
- [ ] Persists preference across sessions
- [ ] All components support dark mode
- [ ] System preference detection
```

Add this to PRODUCT.md, then say "Add dark mode" again!
```

## Integration with Existing Commands

The /agentful command wraps and enhances existing commands:

```
/agentful "How's it going?"
  → /agentful-status

/agentful "Continue"
  → /agentful-start

/agentful "What needs decisions?"
  → /agentful-decide

/agentful "Run tests"
  → /agentful-validate

/agentful "Add authentication"
  → /agentful-start "Add authentication" → Orchestrator
```

## Ralph Wiggum Loop Support

When running in autonomous mode via `/ralph-loop`:

```bash
/ralph-loop "/agentful Continue" --max-iterations 50

# Each iteration:
# 1. Check conversation context
# 2. Classify "Continue" as CONTINUE_REQUEST
# 3. Delegate to agentful-start
# 4. Update conversation history
# 5. Output promise when complete
```

Output this **ONLY when truly complete** (all features done, all gates passing):

```
<promise>AGENTFUL_COMPLETE</promise>
```

## File Operations

The command reads/writes these files:

**Read**:
- `.agentful/conversation-history.json` - Conversation context
- `.agentful/state.json` - Current work state
- `.agentful/completion.json` - Feature completion status
- `.agentful/decisions.json` - Pending decisions
- `PRODUCT.md` or `.claude/product/index.md` - Product specification
- `.claude/product/domains/*/index.md` - Domain specs (if hierarchical)

**Write**:
- `.agentful/conversation-history.json` - Updated after each message

**Modify** (via delegates):
- `.agentful/state.json` - Updated by orchestrator
- `.agentful/completion.json` - Updated by product tracking skill
- `.agentful/decisions.json` - Updated by decide command

## Conversation State Machine

```
[NEW] → Greeting → [ACTIVE]
[ACTIVE] → Any Intent → [ACTIVE]
[ACTIVE] → Stop → [PAUSED]
[PAUSED] → Continue → [ACTIVE]
[ACTIVE] → Complete → [DONE]
[DONE] → New Request → [ACTIVE]
```

## Best Practices

1. **Always show personality** - Conversational, helpful, slightly informal
2. **Provide context** - Reference previous actions when relevant
3. **Offer next steps** - Suggest actions after each response
4. **Handle errors gracefully** - Never crash, always offer alternatives
5. **Maintain thread continuity** - Remember what was discussed
6. **Ask for clarification** - When uncertain, don't guess
7. **Delegate appropriately** - Use specialist agents for complex tasks
8. **Update conversation history** - After every interaction

## Summary

The /agentful command provides:
- Natural language interface to agentful
- Intent classification with confidence scoring
- Context-aware conversations
- Seamless delegation to specialist agents
- Comprehensive edge case handling
- Both flat and hierarchical product structure support
- Integration with existing commands
- Ralph loop compatibility

Users can just talk naturally - no need to remember specific commands or syntax!
