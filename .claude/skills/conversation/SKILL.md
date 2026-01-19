---
name: conversation
description: Natural language understanding, intent classification, context management, reference resolution, and conversation history analysis for agentful
model: sonnet
tools: Read, Write, Edit, Glob, Grep
---

# Conversation Skill

This skill provides natural language processing capabilities for understanding user intent, managing conversation context, resolving references, and maintaining conversation history.

## Core Functions

### 1. Intent Classification

```typescript
/**
 * Classify user intent with confidence score
 * @param message - User's current message
 * @param conversation_history - Recent conversation context
 * @param product_spec - Product features and requirements
 * @returns Intent classification with confidence
 */
function classify_intent(
  message: string,
  conversation_history: ConversationMessage[],
  product_spec: ProductSpec
): IntentClassification {
  const intents = [
    'feature_request',
    'bug_report',
    'question',
    'clarification',
    'status_update',
    'mind_change',
    'context_switch',
    'approval',
    'rejection',
    'pause',
    'continue'
  ];

  // Analyze message patterns
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

  // Score each intent
  const scores = {};
  for (const [intent, pattern] of Object.entries(patterns)) {
    const matches = message.match(pattern);
    const baseScore = matches ? matches.length * 0.3 : 0;

    // Context-aware scoring
    let contextBonus = 0;
    if (conversation_history.length > 0) {
      const lastMessage = conversation_history[conversation_history.length - 1];
      if (lastMessage.role === 'assistant' && intent === 'clarification') {
        contextBonus += 0.2; // User asking for clarification after assistant response
      }
      if (lastMessage.intent === 'question' && intent === 'clarification') {
        contextBonus += 0.15; // Follow-up clarification
      }
    }

    scores[intent] = Math.min(0.95, baseScore + contextBonus);
  }

  // Find highest scoring intent
  const topIntent = Object.entries(scores).reduce((a, b) =>
    a[1] > b[1] ? a : b
  );

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

interface IntentClassification {
  intent: string;
  confidence: number;
  alternative_intents: Array<{ intent: string; confidence: number }>;
}
```

### 2. Feature Extraction

```typescript
/**
 * Extract which feature/user is talking about
 * @param message - User's current message
 * @param product_spec - Product features and requirements
 * @returns Extracted feature reference
 */
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

  // Hierarchical structure
  if (product_spec.domains) {
    for (const [domainId, domain] of Object.entries(product_spec.domains)) {
      // Check domain mention
      if (message.toLowerCase().includes(domain.name.toLowerCase())) {
        mentioned.push({
          type: 'domain',
          domain_id: domainId,
          domain_name: domain.name,
          confidence: 0.85
        });
      }

      // Check feature mentions within domain
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

  // Subtask mentions
  const subtaskPattern = /(?:subtask|task|item)\s+(\d+)/i;
  const subtaskMatch = message.match(subtaskPattern);
  if (subtaskMatch) {
    mentioned.push({
      type: 'subtask_reference',
      reference: subtaskMatch[1],
      confidence: 0.7
    });
  }

  // Return highest confidence mention or null
  if (mentioned.length === 0) {
    return { type: 'none', confidence: 0 };
  }

  return mentioned.sort((a, b) => b.confidence - a.confidence)[0];
}

interface FeatureMention {
  type: 'direct' | 'domain' | 'feature' | 'subtask_reference' | 'none';
  domain_id?: string;
  domain_name?: string;
  feature_id?: string;
  feature_name?: string;
  reference?: string;
  confidence: number;
}
```

### 3. Bug Description Extraction

```typescript
/**
 * Extract bug details from conversation context
 * @param message - User's current message
 * @param conversation_history - Recent conversation context
 * @returns Bug description with context
 */
function extract_bug_description(
  message: string,
  conversation_history: ConversationMessage[]
): BugDescription {
  const bugInfo = {
    description: message,
    steps_to_reproduce: [],
    expected_behavior: null,
    actual_behavior: null,
    related_feature: null,
    severity: 'unknown',
    context_messages: []
  };

  // Look for "expected" vs "actual" patterns
  const expectedPattern = /(?:expected|should|supposed to):\s*(.+?)(?:\.|$)/i;
  const actualPattern = /(?:actually|but it|instead):\s*(.+?)(?:\.|$)/i;

  const expectedMatch = message.match(expectedPattern);
  const actualMatch = message.match(actualPattern);

  if (expectedMatch) {
    bugInfo.expected_behavior = expectedMatch[1].trim();
  }
  if (actualMatch) {
    bugInfo.actual_behavior = actualMatch[1].trim();
  }

  // Look for numbered steps
  const stepPattern = /^\d+\.\s*(.+)$/gm;
  const steps = message.match(stepPattern);
  if (steps) {
    bugInfo.steps_to_reproduce = steps.map(step => step.replace(/^\d+\.\s*/, ''));
  }

  // Infer severity from keywords
  const severeKeywords = ['crash', 'broken', 'fail', 'critical', 'blocking'];
  const minorKeywords = ['typo', 'cosmetic', 'minor', 'polish'];

  if (severeKeywords.some(kw => message.toLowerCase().includes(kw))) {
    bugInfo.severity = 'high';
  } else if (minorKeywords.some(kw => message.toLowerCase().includes(kw))) {
    bugInfo.severity = 'low';
  }

  // Gather relevant context from conversation history
  const relevantContext = conversation_history
    .filter(msg => {
      const msgTime = new Date(msg.timestamp);
      const now = new Date();
      const hoursDiff = (now.getTime() - msgTime.getTime()) / (1000 * 60 * 60);
      return hoursDiff < 2; // Last 2 hours
    })
    .slice(-5); // Last 5 messages

  bugInfo.context_messages = relevantContext;

  return bugInfo;
}

interface BugDescription {
  description: string;
  steps_to_reproduce: string[];
  expected_behavior: string | null;
  actual_behavior: string | null;
  related_feature: string | null;
  severity: 'high' | 'medium' | 'low' | 'unknown';
  context_messages: ConversationMessage[];
}
```

### 4. Ambiguity Detection

```typescript
/**
 * Detect unclear or ambiguous requests
 * @param message - User's current message
 * @returns Ambiguity analysis
 */
function detect_ambiguity(message: string): AmbiguityAnalysis {
  const ambiguities = [];
  let confidence = 0;

  // Check for pronouns without context
  const pronounPattern = /\b(it|that|this|they|them|those)\b/gi;
  const pronouns = message.match(pronounPattern);
  if (pronouns && pronouns.length > 0) {
    // If message starts with pronoun, highly likely needs context
    if (/^(it|that|this|they|them)/i.test(message.trim())) {
      ambiguities.push({
        type: 'pronoun_without_antecedent',
        severity: 'high',
        text: pronouns[0],
        message: 'Pronoun at start of message without clear referent'
      });
      confidence = Math.max(confidence, 0.8);
    }
  }

  // Check for vague verbs
  const vagueVerbs = ['fix', 'update', 'change', 'improve', 'handle'];
  const vagueVerbPattern = new RegExp(`\\b(${vagueVerbs.join('|')})\\b\\s+(?:it|that|this)`, 'i');
  const vagueMatch = message.match(vagueVerbPattern);
  if (vagueMatch) {
    ambiguities.push({
      type: 'vague_action',
      severity: 'medium',
      text: vagueMatch[0],
      message: 'Action verb without specific target'
    });
    confidence = Math.max(confidence, 0.6);
  }

  // Check for short messages (< 10 words)
  const wordCount = message.split(/\s+/).length;
  if (wordCount < 10 && wordCount > 1) {
    ambiguities.push({
      type: 'insufficient_detail',
      severity: 'low',
      text: message,
      message: 'Message is very short, may lack detail'
    });
    confidence = Math.max(confidence, 0.4);
  }

  // Check for multiple possible intents
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
    suggestion: ambiguities.length > 0 ? generate_clarification_suggestion(ambiguities) : null
  };
}

interface AmbiguityAnalysis {
  is_ambiguous: boolean;
  confidence: number;
  ambiguities: Array<{
    type: string;
    severity: 'high' | 'medium' | 'low';
    text: string;
    message: string;
  }>;
  suggestion: string | null;
}

function generate_clarification_suggestion(ambiguities: any[]): string {
  const highSeverity = ambiguities.find(a => a.severity === 'high');
  if (highSeverity) {
    return 'Could you please provide more specific details? What specifically are you referring to?';
  }
  return 'I want to make sure I understand correctly. Could you provide a bit more detail?';
}
```

### 5. Clarification Suggestions

```typescript
/**
 * Generate helpful clarifying questions
 * @param ambiguous_message - The ambiguous user message
 * @param product_spec - Product features and requirements
 * @returns Suggested clarifying questions
 */
function suggest_clarification(
  ambiguous_message: string,
  product_spec: ProductSpec
): ClarificationSuggestion {
  const questions = [];

  // Feature-specific clarification
  const featureMention = extract_feature_mention(ambiguous_message, product_spec);
  if (featureMention.type === 'none') {
    // No feature mentioned, ask which one
    if (product_spec.features) {
      const featureNames = Object.values(product_spec.features)
        .map(f => f.name || f.id)
        .slice(0, 5);
      questions.push({
        type: 'feature_selection',
        question: `Which feature are you referring to? For example: ${featureNames.join(', ')}`,
        options: featureNames
      });
    } else if (product_spec.domains) {
      const domainNames = Object.values(product_spec.domains)
        .map(d => d.name)
        .slice(0, 5);
      questions.push({
        type: 'domain_selection',
        question: `Which domain would you like to work on? For example: ${domainNames.join(', ')}`,
        options: domainNames
      });
    }
  }

  // Action-specific clarification
  const actions = ambiguous_message.match(/(?:add|create|fix|update|delete|remove|test|check)/gi);
  if (actions && actions.length > 1) {
    questions.push({
      type: 'action_priority',
      question: `I see multiple actions: ${actions.join(', ')}. Which would you like me to focus on first?`,
      options: actions
    });
  }

  // Bug report clarification
  if (/bug|broken|error|issue/i.test(ambiguous_message)) {
    questions.push({
      type: 'bug_details',
      question: 'Could you provide more details about the bug? What should happen vs. what actually happens?',
      options: null
    });
  }

  // Generic clarification if no specific ones
  if (questions.length === 0) {
    questions.push({
      type: 'generic',
      question: 'Could you please provide more details about what you\'d like me to do?',
      options: null
    });
  }

  return {
    primary_question: questions[0].question,
    follow_up_questions: questions.slice(1),
    suggested_responses: questions[0].options || []
  };
}

interface ClarificationSuggestion {
  primary_question: string;
  follow_up_questions: Array<{ type: string; question: string; options: string[] | null }>;
  suggested_responses: string[];
}
```

## Conversation State Management

### State Structure

```typescript
/**
 * Conversation state schema
 * Stored in: .agentful/conversation-state.json
 */
interface ConversationState {
  // Current context
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

  // Related features context
  related_features: Array<{
    feature_id: string;
    feature_name: string;
    relationship: 'dependency' | 'similar' | 'related';
  }>;

  // User preferences
  user_preferences: {
    communication_style: 'concise' | 'detailed' | 'balanced';
    update_frequency: 'immediate' | 'summary' | 'on_completion';
    ask_before_deleting: boolean;
    test_automatically: boolean;
  };

  // Session tracking
  session_start: string;
  last_message_time: string;
  message_count: number;

  // Context health
  context_health: {
    is_stale: boolean;
    last_confirmed_intent: string;
    ambiguity_count: number;
    clarification_count: number;
  };
}
```

### Reference Resolution

```typescript
/**
 * Resolve pronouns and references to previous messages
 * @param message - Current message with potential references
 * @param conversation_history - Message history
 * @param state - Current conversation state
 * @returns Resolved message with references expanded
 */
function resolve_references(
  message: string,
  conversation_history: ConversationMessage[],
  state: ConversationState
): ResolvedMessage {
  let resolved = message;
  const references = [];

  // Replace "it", "that", "this" with actual referents
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
        references.push({
          original: pronoun,
          resolved: referent,
          type: 'pronoun'
        });
      }
    }
  }

  // Resolve "the feature", "the bug", etc.
  const definiteReferences = {
    'the feature': state.current_feature?.feature_name,
    'the bug': state.last_action?.type === 'bug_fix' ? state.last_action.description : null,
    'the task': state.current_feature?.subtask_id
  };

  for (const [phrase, referent] of Object.entries(definiteReferences)) {
    if (referent) {
      resolved = resolved.replace(new RegExp(phrase, 'gi'), referent);
      references.push({
        original: phrase,
        resolved: referent,
        type: 'definite_reference'
      });
    }
  }

  return {
    original: message,
    resolved,
    references,
    confidence: references.length > 0 ? 0.85 : 1.0
  };
}

interface ResolvedMessage {
  original: string;
  resolved: string;
  references: Array<{
    original: string;
    resolved: string;
    type: string;
  }>;
  confidence: number;
}
```

### Context Loss Recovery

```typescript
/**
 * Detect and handle context loss (>24h gaps)
 * @param conversation_history - Full conversation history
 * @param state - Current conversation state
 * @returns Context recovery recommendation
 */
function detect_context_loss(
  conversation_history: ConversationMessage[],
  state: ConversationState
): ContextRecovery {
  const now = new Date();
  const lastMessage = conversation_history[conversation_history.length - 1];
  const lastMessageTime = new Date(lastMessage?.timestamp || state.session_start);

  const hoursDiff = (now.getTime() - lastMessageTime.getTime()) / (1000 * 60 * 60);

  if (hoursDiff > 24) {
    // Context is stale
    return {
      is_stale: true,
      hours_since_last_message: Math.round(hoursDiff),
      recommendation: 'summarize_and_confirm',
      message: `It's been ${Math.round(hoursDiff)} hours since our last conversation. Before I continue, let me confirm what we were working on.`,
      context_summary: {
        last_feature: state.current_feature?.feature_name,
        last_phase: state.current_phase,
        last_action: state.last_action?.description
      },
      suggested_confirmation: `We were working on ${state.current_feature?.feature_name || 'a feature'}. Would you like to continue with that, or would you prefer to start something new?`
    };
  }

  return {
    is_stale: false,
    hours_since_last_message: Math.round(hoursDiff),
    recommendation: 'continue',
    message: null
  };
}

interface ContextRecovery {
  is_stale: boolean;
  hours_since_last_message: number;
  recommendation: 'summarize_and_confirm' | 'continue' | 'reset';
  message: string | null;
  context_summary?: {
    last_feature?: string;
    last_phase?: string;
    last_action?: string;
  };
  suggested_confirmation?: string;
}
```

### User Preference Learning

```typescript
/**
 * Learn and adapt to user preferences
 * @param conversation_history - Recent conversation history
 * @param state - Current conversation state
 * @returns Updated user preferences
 */
function learn_user_preferences(
  conversation_history: ConversationMessage[],
  state: ConversationState
): UserPreferences {
  const preferences = { ...state.user_preferences };

  // Analyze user's communication style
  const userMessages = conversation_history.filter(m => m.role === 'user').slice(-20);
  const avgMessageLength = userMessages.reduce((sum, m) =>
    sum + m.content.split(/\s+/).length, 0
  ) / userMessages.length;

  if (avgMessageLength < 10) {
    preferences.communication_style = 'concise';
  } else if (avgMessageLength > 30) {
    preferences.communication_style = 'detailed';
  } else {
    preferences.communication_style = 'balanced';
  }

  // Detect preference for updates
  const statusRequests = userMessages.filter(m =>
    /status|progress|where are we|what's left/i.test(m.content)
  ).length;

  if (statusRequests > 3) {
    preferences.update_frequency = 'summary';
  } else if (statusRequests === 0 && userMessages.length > 10) {
    preferences.update_frequency = 'on_completion';
  }

  // Detect safety preference
  const confirmationRequests = userMessages.filter(m =>
    /are you sure|double check|verify|confirm/i.test(m.content)
  ).length;

  preferences.ask_before_deleting = confirmationRequests > 2;

  // Detect testing preference
  const testMentions = userMessages.filter(m =>
    /test|testing|tests|coverage/i.test(m.content)
  ).length;

  preferences.test_automatically = testMentions > 2;

  return preferences;
}

interface UserPreferences {
  communication_style: 'concise' | 'detailed' | 'balanced';
  update_frequency: 'immediate' | 'summary' | 'on_completion';
  ask_before_deleting: boolean;
  test_automatically: boolean;
}
```

## Conversation History Management

### History File Structure

```bash
# Stored in: .agentful/conversation-history.json
{
  "version": "1.0",
  "session_id": "uuid",
  "started_at": "2026-01-18T00:00:00Z",
  "messages": [
    {
      "id": "msg-uuid",
      "role": "user|assistant|system",
      "content": "Message text",
      "timestamp": "2026-01-18T00:00:00Z",
      "intent": "feature_request",
      "entities": {
        "feature_id": "login",
        "domain_id": "authentication"
      },
      "references_resolved": ["it -> login feature"]
    }
  ],
  "context_snapshot": {
    "current_feature": "login",
    "current_phase": "implementing",
    "related_features": ["register", "logout"]
  }
}
```

### History Operations

```typescript
/**
 * Add message to conversation history
 */
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

  // Keep only last 100 messages to prevent file bloat
  if (history.messages.length > 100) {
    history.messages = history.messages.slice(-100);
  }

  Write(history_path, JSON.stringify(history, null, 2));
}

/**
 * Read conversation history
 */
function read_conversation_history(
  history_path: string = '.agentful/conversation-history.json'
): ConversationHistory {
  try {
    const content = Read(history_path);
    return JSON.parse(content);
  } catch (error) {
    // Initialize new history
    return {
      version: "1.0",
      session_id: generate_uuid(),
      started_at: new Date().toISOString(),
      messages: [],
      context_snapshot: null
    };
  }
}

/**
 * Get recent conversation context
 */
function get_recent_context(
  history_path: string = '.agentful/conversation-history.json',
  message_count: number = 10
): ConversationMessage[] {
  const history = read_conversation_history(history_path);
  return history.messages.slice(-message_count);
}
```

## Integration with Orchestrator

### Delegation Interface

```typescript
/**
 * Determine if delegation to another skill is needed
 * @param intent - Classified intent from user message
 * @param entities - Extracted entities (features, domains, etc.)
 * @returns Delegation decision
 */
function determine_delegation(
  intent: IntentClassification,
  entities: FeatureMention
): DelegationDecision {
  // Feature-related intents -> delegate to appropriate agent
  if (['feature_request', 'bug_report', 'status_update'].includes(intent.intent)) {
    if (entities.type === 'feature' || entities.type === 'direct') {
      return {
        should_delegate: true,
        target_skill: determine_skill_for_feature(entities),
        context: {
          intent: intent.intent,
          feature_id: entities.feature_id,
          domain_id: entities.domain_id
        }
      };
    }
  }

  // Validation request -> delegate to validation skill
  if (/test|check|validate|verify/i.test(intent.intent)) {
    return {
      should_delegate: true,
      target_skill: 'validation',
      context: {
        intent: intent.intent
      }
    };
  }

  // Product tracking -> delegate to product-tracking skill
  if (['status_update', 'progress'].includes(intent.intent)) {
    return {
      should_delegate: true,
      target_skill: 'product-tracking',
      context: {
        intent: intent.intent
      }
    };
  }

  return {
    should_delegate: false,
    target_skill: null,
    context: null
  };
}

interface DelegationDecision {
  should_delegate: boolean;
  target_skill: string | null;
  context: any;
}

function determine_skill_for_feature(entities: FeatureMention): string {
  // Map domains/features to appropriate skills
  const domainSkillMap = {
    'authentication': 'backend',
    'user-management': 'backend',
    'database': 'backend',
    'frontend': 'frontend',
    'ui': 'frontend',
    'testing': 'tester'
  };

  if (entities.domain_name) {
    const domainKey = Object.keys(domainSkillMap).find(key =>
      entities.domain_name.toLowerCase().includes(key)
    );
    if (domainKey) {
      return domainSkillMap[domainKey];
    }
  }

  return 'backend'; // Default
}
```

### Completion Tracking Integration

```typescript
/**
 * Update conversation state after action completion
 * @param state - Current conversation state
 * @param action_result - Result from delegated skill
 * @returns Updated conversation state
 */
function update_conversation_state(
  state: ConversationState,
  action_result: ActionResult
): ConversationState {
  const updated = { ...state };

  // Update last action
  updated.last_action = {
    type: action_result.type,
    description: action_result.description,
    timestamp: new Date().toISOString(),
    result: action_result
  };

  // Update phase based on action result
  if (action_result.status === 'complete') {
    if (state.current_phase === 'implementing') {
      updated.current_phase = 'testing';
    } else if (state.current_phase === 'testing') {
      updated.current_phase = 'reviewing';
    }
  }

  // Update message count and time
  updated.message_count++;
  updated.last_message_time = new Date().toISOString();

  // Clear ambiguity count on successful action
  if (action_result.status === 'success') {
    updated.context_health.ambiguity_count = 0;
    updated.context_health.clarification_count = 0;
  }

  return updated;
}
```

## Edge Case Handling

### Mind Changes

```typescript
/**
 * Detect and handle user mind changes
 * @param message - Current message
 * @param state - Current conversation state
 * @returns Mind change detection result
 */
function detect_mind_change(
  message: string,
  state: ConversationState
): MindChangeDetection {
  const mindChangePatterns = [
    /actually/i,
    /wait/i,
    /never mind/i,
    /forget that/i,
    /change\s+my\s+mind/i,
    /instead/i,
    /stop\s+(?:that|it)/i
  ];

  const hasMindChange = mindChangePatterns.some(pattern => pattern.test(message));

  if (hasMindChange) {
    return {
      detected: true,
      confidence: 0.8,
      previous_intent: state.last_action?.type,
      suggestion: 'I understand you\'d like to change direction. What would you like to do instead?',
      reset_context: /never mind|forget that|stop/i.test(message)
    };
  }

  return {
    detected: false,
    confidence: 0,
    previous_intent: null,
    suggestion: null,
    reset_context: false
  };
}

interface MindChangeDetection {
  detected: boolean;
  confidence: number;
  previous_intent: string | null;
  suggestion: string | null;
  reset_context: boolean;
}
```

### Stale Context Handling

```typescript
/**
 * Handle stale context when references no longer make sense
 * @param message - Current message
 * @param state - Current conversation state
 * @returns Stale context handling response
 */
function handle_stale_context(
  message: string,
  state: ConversationState
): StaleContextResponse {
  // Check if current feature is referenced but stale
  const featureReference = extract_feature_mention(message, null);

  if (featureReference.type === 'none' && state.current_feature) {
    // User said "it" but current feature is old
    const hoursSinceLastAction = state.last_action
      ? (Date.now() - new Date(state.last_action.timestamp).getTime()) / (1000 * 60 * 60)
      : Infinity;

    if (hoursSinceLastAction > 4) {
      return {
        is_stale: true,
        suggestion: `I'm not sure what you're referring to. We last worked on ${state.current_feature.feature_name} ${Math.round(hoursSinceLastAction)} hours ago. Are you still referring to that?`,
        confirm_needed: true
      };
    }
  }

  return {
    is_stale: false,
    suggestion: null,
    confirm_needed: false
  };
}

interface StaleContextResponse {
  is_stale: boolean;
  suggestion: string | null;
  confirm_needed: boolean;
}
```

## Usage Example

```typescript
// Complete conversation processing flow
async function process_conversation(userMessage: string): Promise<ConversationResponse> {
  // 1. Load conversation state and history
  const state = load_conversation_state();
  const history = read_conversation_history();
  const productSpec = load_product_spec();

  // 2. Check for context loss
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
    const clarification = suggest_clarification(resolved.resolved, productSpec);
    return {
      type: 'clarification_needed',
      message: clarification.primary_question,
      suggestions: clarification.suggested_responses
    };
  }

  // 8. Determine delegation
  const delegation = determine_delegation(intent, entities);

  // 9. Add user message to history
  add_message_to_history({
    role: 'user',
    content: userMessage,
    intent: intent.intent,
    entities: entities,
    references_resolved: resolved.references
  });

  // 10. Return delegation decision or response
  if (delegation.should_delegate) {
    return {
      type: 'delegate',
      target_skill: delegation.target_skill,
      context: delegation.context
    };
  }

  return {
    type: 'response',
    message: generate_response(intent, entities, state)
  };
}
```

## File Locations

```
.agentful/
├── conversation-state.json       # Current conversation state
├── conversation-history.json     # Full message history
└── user-preferences.json         # Learned user preferences (optional)
```

## Best Practices

1. **Always resolve references** before processing intent
2. **Check for context loss** after long gaps (>24h)
3. **Detect ambiguity early** and ask clarifying questions
4. **Learn user preferences** over time
5. **Track related features** for better context
6. **Handle mind changes gracefully** without losing all context
7. **Delegate appropriately** based on intent and entities
8. **Keep history manageable** (last 100 messages)
9. **Update state after every action**
10. **Provide summaries** after context recovery
