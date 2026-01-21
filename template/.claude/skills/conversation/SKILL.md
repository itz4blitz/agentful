---
name: conversation
description: Natural language understanding, intent classification, context management, reference resolution, and conversation history analysis for agentful
model: sonnet
tools: Read, Write, Edit, Glob, Grep
---

# Conversation Skill

Provides natural language processing for understanding user intent, managing conversation context, resolving references, and maintaining conversation history.

## Responsibilities

1. **Intent Classification** - Determine what the user wants
2. **Reference Resolution** - Resolve "it", "that", "this" to actual feature names
3. **Entity Extraction** - Extract features, domains, subtasks mentioned
4. **Ambiguity Detection** - Identify unclear requests and ask clarifying questions
5. **Context Management** - Track conversation state, detect context loss
6. **Routing** - Route to appropriate handler
7. **History Tracking** - Maintain conversation history for context

## Intent Classification

```typescript
function classify_intent(
  message: string,
  conversation_history: ConversationMessage[],
  product_spec: ProductSpec
): IntentClassification {
  const patterns = {
    feature_request: /(?:add|create|implement|build|new|feature|support|enable)/i,
    bug_report: /(?:bug|broken|error|issue|problem|wrong|doesn't work|fix)/i,
    question: /(?:how|what|where|when|why|who|which|can you|explain)/i,
    clarification: /(?:what do you mean|clarify|elaborate|more detail)/i,
    status_update: /(?:status|progress|where are we|what's left)/i,
    mind_change: /(?:actually|wait|never mind|forget that|change|instead)/i,
    context_switch: /(?:let's talk about|switching to|moving on|about)/i,
    approval: /(?:yes|ok|sure|go ahead|approved|sounds good|let's do it)/i,
    rejection: /(?:no|stop|don't|cancel|never mind)/i,
    pause: /(?:pause|hold on|wait|brb|later)/i,
    continue: /(?:continue|resume|let's continue|back)/i
  };

  const scores = {};
  for (const [intent, pattern] of Object.entries(patterns)) {
    const matches = message.match(pattern);
    scores[intent] = matches ? matches.length * 0.3 : 0;
  }

  const topIntent = Object.entries(scores).reduce((a, b) => a[1] > b[1] ? a : b);

  return {
    intent: topIntent[0],
    confidence: topIntent[1],
    alternative_intents: Object.entries(scores)
      .filter(([_, score]) => score > 0.3)
      .sort((a, b) => b[1] - a[1])
      .slice(1, 4)
      .map(([intent, score]) => ({ intent, confidence: score }))
  };
}
```

## Entity Extraction

```typescript
function extract_feature_mention(
  message: string,
  product_spec: ProductSpec
): FeatureMention {
  const mentioned = [];

  // Direct feature name matches
  if (product_spec.features) {
    for (const [featureId, feature] of Object.entries(product_spec.features)) {
      const featureName = feature.name || featureId;
      if (message.toLowerCase().includes(featureName.toLowerCase())) {
        mentioned.push({
          type: 'direct',
          feature_id: featureId,
          feature_name: featureName,
          confidence: 0.9
        });
      }
    }
  }

  // Domain and nested feature matches
  if (product_spec.domains) {
    for (const [domainId, domain] of Object.entries(product_spec.domains)) {
      if (message.toLowerCase().includes(domain.name.toLowerCase())) {
        mentioned.push({
          type: 'domain',
          domain_id: domainId,
          domain_name: domain.name,
          confidence: 0.85
        });
      }

      if (domain.features) {
        for (const [featureId, feature] of Object.entries(domain.features)) {
          const featureName = feature.name || featureId;
          if (message.toLowerCase().includes(featureName.toLowerCase())) {
            mentioned.push({
              type: 'feature',
              domain_id: domainId,
              feature_id: featureId,
              feature_name: featureName,
              confidence: 0.9
            });
          }
        }
      }
    }
  }

  // Subtask references
  const subtaskMatch = message.match(/(?:subtask|task|item)\s+(\d+)/i);
  if (subtaskMatch) {
    mentioned.push({
      type: 'subtask_reference',
      reference: subtaskMatch[1],
      confidence: 0.7
    });
  }

  if (mentioned.length === 0) return { type: 'none', confidence: 0 };
  return mentioned.sort((a, b) => b.confidence - a.confidence)[0];
}
```

## Ambiguity Detection

```typescript
function detect_ambiguity(message: string): AmbiguityAnalysis {
  const ambiguities = [];
  let confidence = 0;

  // Pronouns without context
  const pronouns = message.match(/\b(it|that|this|they|them|those)\b/gi);
  if (pronouns && /^(it|that|this|they|them)/i.test(message.trim())) {
    ambiguities.push({
      type: 'pronoun_without_antecedent',
      severity: 'high',
      text: pronouns[0],
      message: 'Pronoun at start of message without clear referent'
    });
    confidence = 0.8;
  }

  // Vague actions
  const vagueMatch = message.match(/\b(fix|update|change|improve|handle)\b\s+(?:it|that|this)/i);
  if (vagueMatch) {
    ambiguities.push({
      type: 'vague_action',
      severity: 'medium',
      text: vagueMatch[0],
      message: 'Action verb without specific target'
    });
    confidence = Math.max(confidence, 0.6);
  }

  // Multiple actions
  const actionWords = message.split(/\s+/).filter(word =>
    /^(add|create|fix|update|delete|remove|test|check|verify|deploy|build|run)/i.test(word)
  );
  if (actionWords.length > 2) {
    ambiguities.push({
      type: 'multiple_actions',
      severity: 'medium',
      text: actionWords.join(', '),
      message: 'Multiple actions detected, unclear priority'
    });
    confidence = Math.max(confidence, 0.7);
  }

  return {
    is_ambiguous: ambiguities.length > 0,
    confidence,
    ambiguities,
    suggestion: ambiguities.length > 0 ? 'Could you please provide more specific details?' : null
  };
}
```

## Reference Resolution

```typescript
function resolve_references(
  message: string,
  conversation_history: ConversationMessage[],
  state: ConversationState
): ResolvedMessage {
  let resolved = message;
  const references = [];

  // Replace pronouns with actual referents
  const pronounMap = {
    'it': state.current_feature?.feature_name,
    'that': state.last_action?.description,
    'this': state.current_feature?.feature_name
  };

  for (const [pronoun, referent] of Object.entries(pronounMap)) {
    if (referent) {
      const pattern = new RegExp(`\\b${pronoun}\\b`, 'gi');
      if (pattern.test(message)) {
        resolved = resolved.replace(pattern, referent);
        references.push({ original: pronoun, resolved: referent, type: 'pronoun' });
      }
    }
  }

  // Replace definite references
  const definiteReferences = {
    'the feature': state.current_feature?.feature_name,
    'the bug': state.last_action?.type === 'bug_fix' ? state.last_action.description : null,
    'the task': state.current_feature?.subtask_id
  };

  for (const [phrase, referent] of Object.entries(definiteReferences)) {
    if (referent) {
      resolved = resolved.replace(new RegExp(phrase, 'gi'), referent);
      references.push({ original: phrase, resolved: referent, type: 'definite_reference' });
    }
  }

  return {
    original: message,
    resolved,
    references,
    confidence: references.length > 0 ? 0.85 : 1.0
  };
}
```

## Context Management

```typescript
interface ConversationState {
  current_feature: {
    domain_id?: string;
    feature_id?: string;
    feature_name?: string;
    subtask_id?: string;
  } | null;
  current_phase: 'idle' | 'planning' | 'implementing' | 'testing' | 'reviewing' | 'deploying';
  last_action: {
    type: string;
    description: string;
    timestamp: string;
    result?: any;
  } | null;
  related_features: Array<{
    feature_id: string;
    feature_name: string;
    relationship: 'dependency' | 'similar' | 'related';
  }>;
  session_start: string;
  last_message_time: string;
  message_count: number;
}

function detect_context_loss(
  conversation_history: ConversationMessage[],
  state: ConversationState
): ContextRecovery {
  const now = new Date();
  const lastMessage = conversation_history[conversation_history.length - 1];
  const lastMessageTime = new Date(lastMessage?.timestamp || state.session_start);
  const hoursDiff = (now.getTime() - lastMessageTime.getTime()) / (1000 * 60 * 60);

  if (hoursDiff > 24) {
    return {
      is_stale: true,
      hours_since_last_message: Math.round(hoursDiff),
      recommendation: 'summarize_and_confirm',
      message: `It's been ${Math.round(hoursDiff)} hours since our last conversation.`,
      suggested_confirmation: `We were working on ${state.current_feature?.feature_name || 'a feature'}. Continue or start new?`
    };
  }

  return {
    is_stale: false,
    hours_since_last_message: Math.round(hoursDiff),
    recommendation: 'continue',
    message: null
  };
}
```

## Routing Logic

```typescript
function route_to_handler(
  intent: IntentClassification,
  entities: FeatureMention,
  state: ConversationState
): RoutingDecision {
  const intentName = intent.intent;

  // Feature development or bug fixes → orchestrator
  if (intentName === 'feature_request' || intentName === 'bug_report') {
    return {
      handler: 'orchestrator',
      skill: null,
      context: {
        intent: intentName,
        feature_id: entities.feature_id,
        domain_id: entities.domain_id,
        work_type: intentName === 'feature_request' ? 'FEATURE_DEVELOPMENT' : 'BUGFIX'
      }
    };
  }

  // Status inquiries → product-tracking
  if (intentName === 'status_update') {
    return {
      handler: 'product-tracking',
      skill: 'product-tracking',
      context: {
        intent: intentName,
        feature_filter: entities.feature_id || null,
        domain_filter: entities.domain_id || null
      }
    };
  }

  // Validation → validation skill
  if (/test|validate|check/i.test(intentName)) {
    return {
      handler: 'validation',
      skill: 'validation',
      context: {
        intent: intentName,
        scope: entities.feature_id ? 'feature' : 'all'
      }
    };
  }

  // Product planning → reference product-planning skill guidance (inline)
  // Note: product-planning is a skill, not a separate agent
  // When user asks planning/requirements questions, use product-planning skill's guidance
  if (/plan|requirements|spec|analyze/i.test(intentName)) {
    return {
      handler: 'inline',
      skill: 'product-planning',
      context: {
        intent: intentName,
        use_skill_guidance: 'product-planning',
        action: 'answer_with_planning_guidance'
      }
    };
  }

  // Approval/continue → orchestrator (resume)
  if (intentName === 'approval' || intentName === 'continue') {
    return {
      handler: 'orchestrator',
      skill: null,
      context: {
        intent: 'continue',
        resume_feature: state.current_feature
      }
    };
  }

  // Rejection/pause → inline
  if (intentName === 'rejection' || intentName === 'pause') {
    return {
      handler: 'inline',
      skill: null,
      context: {
        intent: intentName,
        action: 'pause_work'
      }
    };
  }

  // Questions → inline
  if (intentName === 'question' || intentName === 'clarification') {
    return {
      handler: 'inline',
      skill: null,
      context: {
        intent: intentName,
        answer_from: ['conversation_history', 'product_spec', 'completion_status']
      }
    };
  }

  // Default: inline with clarification
  return {
    handler: 'inline',
    skill: null,
    context: {
      intent: intentName,
      needs_clarification: true
    }
  };
}
```

## History Management

```typescript
// Stored in: .agentful/conversation-history.json
interface ConversationHistory {
  version: "1.0";
  session_id: string;
  started_at: string;
  messages: ConversationMessage[];
  context_snapshot: any;
}

function add_message_to_history(
  message: ConversationMessage,
  history_path: string = '.agentful/conversation-history.json'
): void {
  let history = read_conversation_history(history_path);

  history.messages.push({
    ...message,
    id: message.id || generate_uuid(),
    timestamp: message.timestamp || new Date().toISOString()
  });

  // Keep last 100 messages
  if (history.messages.length > 100) {
    history.messages = history.messages.slice(-100);
  }

  Write(history_path, JSON.stringify(history, null, 2));
}

function read_conversation_history(
  history_path: string = '.agentful/conversation-history.json'
): ConversationHistory {
  try {
    const content = Read(history_path);
    return JSON.parse(content);
  } catch (error) {
    return {
      version: "1.0",
      session_id: generate_uuid(),
      started_at: new Date().toISOString(),
      messages: [],
      context_snapshot: null
    };
  }
}
```

## Complete Processing Flow

```typescript
async function process_conversation(userMessage: string): Promise<ConversationResponse> {
  // 1. Load state and history
  const state = load_conversation_state('.agentful/conversation-state.json');
  const history = read_conversation_history('.agentful/conversation-history.json');
  const productSpec = load_product_spec('.claude/product/');

  // 2. Check context loss
  const contextRecovery = detect_context_loss(history.messages, state);
  if (contextRecovery.is_stale) {
    return {
      type: 'context_recovery',
      message: contextRecovery.message,
      confirmation_needed: true
    };
  }

  // 3. Detect mind changes
  const mindChange = detect_mind_change(userMessage, state);
  if (mindChange.detected && mindChange.reset_context) {
    state.current_feature = null;
    state.current_phase = 'idle';
    save_conversation_state(state);
  }

  // 4. Resolve references
  const resolved = resolve_references(userMessage, history.messages, state);

  // 5. Classify intent
  const intent = classify_intent(resolved.resolved, history.messages, productSpec);

  // 6. Extract entities
  const entities = extract_feature_mention(resolved.resolved, productSpec);

  // 7. Detect ambiguity
  const ambiguity = detect_ambiguity(resolved.resolved);
  if (ambiguity.is_ambiguous && ambiguity.confidence > 0.6) {
    return {
      type: 'clarification_needed',
      message: ambiguity.suggestion,
      suggestions: []
    };
  }

  // 8. Route to handler
  const routing = route_to_handler(intent, entities, state);

  // 9. Add to history
  add_message_to_history({
    role: 'user',
    content: userMessage,
    intent: intent.intent,
    entities: entities,
    references_resolved: resolved.references
  }, '.agentful/conversation-history.json');

  // 10. Execute routing
  execute_routing(routing, userMessage, resolved);

  // 11. Update state
  state.last_message_time = new Date().toISOString();
  state.message_count++;
  if (entities.feature_id) {
    state.current_feature = {
      feature_id: entities.feature_id,
      feature_name: entities.feature_name,
      domain_id: entities.domain_id
    };
  }
  save_conversation_state(state);

  return {
    type: 'routed',
    handler: routing.handler,
    context: routing.context
  };
}

function execute_routing(
  routing: RoutingDecision,
  userMessage: string,
  resolved: ResolvedMessage
): void {
  switch (routing.handler) {
    case 'orchestrator':
      Task('orchestrator', `${routing.context.message || userMessage}
Work Type: ${routing.context.work_type || 'FEATURE_DEVELOPMENT'}
${routing.context.feature_id ? `Feature: ${routing.context.feature_id}` : ''}
${routing.context.domain_id ? `Domain: ${routing.context.domain_id}` : ''}`);
      break;

    case 'product-tracking':
      Task('product-tracking', `Show status and progress.
${routing.context.feature_filter ? `Filter: feature ${routing.context.feature_filter}` : ''}
${routing.context.domain_filter ? `Filter: domain ${routing.context.domain_filter}` : ''}`);
      break;

    case 'validation':
      Task('validation', `Run quality gates. Scope: ${routing.context.scope || 'all'}`);
      break;

    case 'inline':
      if (routing.context.needs_clarification) {
        return 'Could you please provide more details about what you\'d like me to do?';
      } else if (routing.context.action === 'pause_work') {
        pause_current_work();
        return 'Work paused. Run `/agentful` when ready to continue.';
      } else if (routing.context.action === 'answer_with_planning_guidance') {
        // Use product-planning skill guidance to answer planning/requirements questions
        // The skill provides structured approach to product planning, requirements analysis
        return answer_planning_question(userMessage, routing.context);
      } else if (routing.context.intent === 'question') {
        return answer_question(userMessage, routing.context);
      }
      break;
  }
}
```

## File Locations

```
.agentful/
├── conversation-state.json       # Current conversation state
├── conversation-history.json     # Full message history
└── user-preferences.json         # Learned user preferences
```

## Flow Diagram

```
User Input → Load State/History → Context Loss Check → Mind Change Detection →
Reference Resolution → Intent Classification → Entity Extraction →
Ambiguity Detection → Route to Handler → Add to History → Update State → Done
```
