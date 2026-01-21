/**
 * Conversation History State Management
 *
 * TypeScript interfaces for conversation-history.json schema
 * Provides type safety for Agentful CLI conversation tracking
 */

// ============================================================
// Core Types
// ============================================================

export interface ConversationHistoryState {
  _comment?: string;
  _doc?: string;
  _schema_version: string;

  version: string;
  schema: 'conversation-history';

  session: SessionInfo;
  conversation: ConversationData;
  context: WorkContext;
  state_integration: StateIntegration;
  product_context: ProductContext;
  user: UserPreferences;
  agents: AgentHistory;
  skills_invoked: SkillsTracking;
  metadata: Metadata;
}

// ============================================================
// Session Tracking
// ============================================================

export interface SessionInfo {
  id: string | null;
  started_at: string | null; // ISO-8601
  last_updated: string | null; // ISO-8601
  message_count: number;
  active: boolean;
  mode: 'interactive' | 'autonomous';
}

// ============================================================
// Conversation Messages
// ============================================================

export interface ConversationData {
  messages: ConversationMessage[];
  summary: string | null;
  key_topics: string[];
  user_goals: string[];
}

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ConversationMessage {
  role: MessageRole;
  content: string;
  timestamp: string; // ISO-8601
  agent?: string; // For assistant messages
  context?: {
    feature?: string;
    phase?: string;
    [key: string]: any;
  };
  actions_taken?: string[];
  files_modified?: string[];
  metadata?: Record<string, any>;
}

// ============================================================
// Work Context
// ============================================================

export interface WorkContext {
  current_feature: string | null;
  current_phase: string | null;
  current_agent: string | null;
  last_action: string | null;
  last_action_time: string | null; // ISO-8601
  active_files: string[];
  active_branch: string | null;
}

// ============================================================
// State Integration - References to External State Files
// ============================================================

/**
 * Instead of duplicating state data, this provides references to
 * the authoritative state files. Read these files to get current state.
 */
export interface StateIntegration {
  _comment?: string;
  state_file: string;       // Path to state.json (e.g., ".agentful/state.json")
  completion_file: string;  // Path to completion.json (e.g., ".agentful/completion.json")
  decisions_file: string;   // Path to decisions.json (e.g., ".agentful/decisions.json")
}

// ============================================================
// Product Context
// ============================================================

export type ProductStructure = 'flat' | 'hierarchical';

export interface ProductContext {
  structure: ProductStructure;
  current_feature_path: string | null;
  domain: string | null; // For hierarchical structures
  all_features: string[];
  feature_dependencies: Record<string, string[]>;
}

// ============================================================
// User Preferences
// ============================================================

export interface UserPreferences {
  preferences: Preferences;
  goals: string[];
  constraints: string[];
  avoidances: string[];
  tech_preferences: string[];
  architecture_notes: string[];
}

export interface Preferences {
  verbosity: 'minimal' | 'normal' | 'verbose';
  auto_approve: boolean;
  show_thinking: boolean;
  save_intermediate: boolean;
  confirmation_style: 'explicit' | 'implicit';
  error_handling: 'interactive' | 'auto' | 'fail';
  output_format: 'markdown' | 'json' | 'plain';
}

// ============================================================
// Agent History
// ============================================================

export interface AgentHistory {
  active: string | null;
  history: AgentSession[];
}

export interface AgentSession {
  agent: string;
  activated_at: string; // ISO-8601
  deactivated_at: string | null; // ISO-8601
  tasks_completed: number;
}

// ============================================================
// Skills Tracking
// ============================================================

export type SkillName =
  | 'conversation'
  | 'product'
  | 'architecture'
  | 'development'
  | 'testing'
  | 'documentation'
  | 'review';

export interface SkillsTracking {
  conversation: SkillInvocation;
  product: SkillInvocation;
  architecture: SkillInvocation;
  development: SkillInvocation;
  testing: SkillInvocation;
  documentation: SkillInvocation;
  review: SkillInvocation;
}

export interface SkillInvocation {
  count: number;
  last_invoked: string | null; // ISO-8601
  parameters?: Record<string, any>;
}

// ============================================================
// Metadata
// ============================================================

export interface Metadata {
  created_at: string | null; // ISO-8601
  created_by: string;
  environment: EnvironmentInfo;
  git_info: GitInfo;
  project_root: string | null;
}

export interface EnvironmentInfo {
  node_version?: string;
  platform?: 'darwin' | 'linux' | 'win32';
  agentful_version?: string;
  [key: string]: any;
}

export interface GitInfo {
  branch: string | null;
  commit: string | null;
  remote: string | null;
}

// ============================================================
// Utility Types
// ============================================================

export type ConversationHistoryUpdate = Partial<ConversationHistoryState>;

export interface MessageInput {
  role: MessageRole;
  content: string;
  agent?: string;
  context?: Record<string, any>;
  actions_taken?: string[];
  files_modified?: string[];
}

export interface ContextUpdate {
  current_feature?: string;
  current_phase?: string;
  current_agent?: string;
  last_action?: string;
  active_files?: string[];
  active_branch?: string;
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Creates a new conversation history state with default values
 */
export function createInitialConversationHistory(
  projectRoot: string,
  gitInfo?: Partial<GitInfo>
): ConversationHistoryState {
  const now = new Date().toISOString();

  return {
    _comment: 'Agentful Conversation History State - Tracks all interactions, context, and user preferences',
    _doc: 'This file maintains the complete conversation history with the Agentful CLI.',
    _schema_version: '1.0',

    version: '1.0',
    schema: 'conversation-history',

    session: {
      id: null,
      started_at: null,
      last_updated: null,
      message_count: 0,
      active: false,
      mode: 'interactive'
    },

    conversation: {
      messages: [],
      summary: null,
      key_topics: [],
      user_goals: []
    },

    context: {
      current_feature: null,
      current_phase: null,
      current_agent: null,
      last_action: null,
      last_action_time: null,
      active_files: [],
      active_branch: null
    },

    state_integration: {
      _comment: 'References to external state files - read these files for current state',
      state_file: '.agentful/state.json',
      completion_file: '.agentful/completion.json',
      decisions_file: '.agentful/decisions.json'
    },

    product_context: {
      structure: 'flat',
      current_feature_path: null,
      domain: null,
      all_features: [],
      feature_dependencies: {}
    },

    user: {
      preferences: {
        verbosity: 'normal',
        auto_approve: false,
        show_thinking: false,
        save_intermediate: false,
        confirmation_style: 'explicit',
        error_handling: 'interactive',
        output_format: 'markdown'
      },
      goals: [],
      constraints: [],
      avoidances: [],
      tech_preferences: [],
      architecture_notes: []
    },

    agents: {
      active: null,
      history: []
    },

    skills_invoked: {
      conversation: { count: 0, last_invoked: null },
      product: { count: 0, last_invoked: null },
      architecture: { count: 0, last_invoked: null },
      development: { count: 0, last_invoked: null },
      testing: { count: 0, last_invoked: null },
      documentation: { count: 0, last_invoked: null },
      review: { count: 0, last_invoked: null }
    },

    metadata: {
      created_at: now,
      created_by: 'agentful-cli',
      environment: {
        platform: process.platform as 'darwin' | 'linux' | 'win32',
        node_version: process.version
      },
      git_info: {
        branch: gitInfo?.branch || null,
        commit: gitInfo?.commit || null,
        remote: gitInfo?.remote || null
      },
      project_root: projectRoot
    }
  };
}

/**
 * Adds a message to the conversation history
 */
export function addMessage(
  state: ConversationHistoryState,
  message: MessageInput
): ConversationHistoryState {
  const newMessage: ConversationMessage = {
    ...message,
    timestamp: new Date().toISOString()
  };

  return {
    ...state,
    conversation: {
      ...state.conversation,
      messages: [...state.conversation.messages, newMessage]
    },
    session: {
      ...state.session,
      message_count: state.session.message_count + 1,
      last_updated: newMessage.timestamp
    }
  };
}

/**
 * Updates the work context
 */
export function updateContext(
  state: ConversationHistoryState,
  context: ContextUpdate
): ConversationHistoryState {
  return {
    ...state,
    context: {
      ...state.context,
      ...context,
      last_action_time: context.last_action ? new Date().toISOString() : state.context.last_action_time
    },
    session: {
      ...state.session,
      last_updated: new Date().toISOString()
    }
  };
}

/**
 * Records skill invocation
 */
export function recordSkillInvocation(
  state: ConversationHistoryState,
  skill: SkillName,
  parameters?: Record<string, any>
): ConversationHistoryState {
  const now = new Date().toISOString();

  return {
    ...state,
    skills_invoked: {
      ...state.skills_invoked,
      [skill]: {
        count: state.skills_invoked[skill].count + 1,
        last_invoked: now,
        parameters: parameters || {}
      }
    },
    session: {
      ...state.session,
      last_updated: now
    }
  };
}

/**
 * Starts a new session
 */
export function startSession(
  state: ConversationHistoryState,
  sessionId: string
): ConversationHistoryState {
  const now = new Date().toISOString();

  return {
    ...state,
    session: {
      ...state.session,
      id: sessionId,
      started_at: now,
      last_updated: now,
      active: true,
      message_count: 0
    }
  };
}

/**
 * Ends the current session
 */
export function endSession(state: ConversationHistoryState): ConversationHistoryState {
  return {
    ...state,
    session: {
      ...state.session,
      active: false,
      last_updated: new Date().toISOString()
    }
  };
}

export default ConversationHistoryState;
