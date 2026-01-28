/**
 * Chat Store
 * Zustand store for managing chat state with persistence
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatState, ChatMessage } from '@/types/chat';
import { DEFAULT_CHAT_STATE } from '@/types/chat';
import { chatStorageService } from '@/services/chat/chat-storage-service';

interface ChatStore extends ChatState {
  // Actions
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  clearMessages: () => void;
  setStreaming: (isStreaming: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentProject: (projectId: string | null) => void;
  retryLastMessage: () => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      // Initial state
      ...DEFAULT_CHAT_STATE,

      // Actions
      addMessage: (message) =>
        set((state) => {
          const newMessages = [...state.messages, message];

          // Persist to localStorage if we have a current project
          if (state.currentProjectId) {
            chatStorageService.saveMessages(state.currentProjectId, newMessages);
          }

          return { messages: newMessages };
        }),

      setMessages: (messages) =>
        set((state) => {
          // Persist to localStorage if we have a current project
          if (state.currentProjectId) {
            chatStorageService.saveMessages(state.currentProjectId, messages);
          }

          return { messages };
        }),

      clearMessages: () =>
        set((state) => {
          // Clear from localStorage if we have a current project
          if (state.currentProjectId) {
            chatStorageService.clearMessages(state.currentProjectId);
          }

          return { messages: [] };
        }),

      setStreaming: (isStreaming) => set({ isStreaming }),

      setError: (error) => set({ error }),

      setCurrentProject: (projectId) =>
        set((state) => {
          // Load messages for the new project
          let messages: ChatMessage[] = [];

          if (projectId) {
            messages = chatStorageService.loadMessages(projectId);
          }

          return {
            currentProjectId: projectId,
            messages,
          };
        }),

      retryLastMessage: () =>
        set((state) => {
          // Remove the last assistant message and keep the user message
          if (state.messages.length >= 2) {
            const lastMessage = state.messages[state.messages.length - 1];
            if (lastMessage.role === 'assistant') {
              const newMessages = state.messages.slice(0, -1);

              if (state.currentProjectId) {
                chatStorageService.saveMessages(state.currentProjectId, newMessages);
              }

              return { messages: newMessages, error: null };
            }
          }
          return state;
        }),
    }),
    {
      name: 'visual-builder-chat-storage',
      partialize: (state) => ({
        currentProjectId: state.currentProjectId,
        // Don't persist messages or temporary state here
        // Messages are persisted per-project in localStorage
      }),
    }
  )
);
