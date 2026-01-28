/**
 * Chat Types
 * Type definitions for AI Chat Interface
 */

import type { CoreMessage } from 'ai';

export interface ChatMessage extends CoreMessage {
  timestamp: Date;
  metadata?: {
    projectId?: string;
    elementId?: string;
    editType?: 'create' | 'update' | 'delete';
  };
}

export interface ChatSession {
  id: string;
  projectId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MessagePart {
  type: 'text' | 'image' | 'code' | 'tool-use';
  content: string;
  language?: string; // For code blocks
}

export interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  error: string | null;
  currentProjectId: string | null;
}

export const DEFAULT_CHAT_STATE: ChatState = {
  messages: [],
  isStreaming: false,
  error: null,
  currentProjectId: null,
};

export const CHAT_STORAGE_KEY = 'visual-builder-chat-messages';
