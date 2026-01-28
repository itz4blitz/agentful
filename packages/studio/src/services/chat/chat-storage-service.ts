/**
 * Chat Storage Service
 * Handles localStorage operations for chat message persistence
 */

import type { ChatMessage } from '@/types/chat';
import { CHAT_STORAGE_KEY } from '@/types/chat';

export class ChatStorageService {
  private storageKey: string;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private debounceMs: number;

  constructor(storageKey: string = CHAT_STORAGE_KEY, debounceMs: number = 1000) {
    this.storageKey = storageKey;
    this.debounceMs = debounceMs;
  }

  /**
   * Save chat messages to localStorage with debouncing
   */
  saveMessages(projectId: string, messages: ChatMessage[]): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      try {
        const key = `${this.storageKey}-${projectId}`;
        localStorage.setItem(key, JSON.stringify(messages));
      } catch (error) {
        console.error('Failed to save chat messages:', error);
      }
    }, this.debounceMs);
  }

  /**
   * Restore chat messages from localStorage
   */
  loadMessages(projectId: string): ChatMessage[] {
    try {
      const key = `${this.storageKey}-${projectId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored) as ChatMessage[];
        // Convert timestamp strings back to Date objects
        return parsed.map((msg) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
      }
    } catch (error) {
      console.warn('Invalid chat messages in localStorage:', error);
    }

    return [];
  }

  /**
   * Clear chat messages for a specific project
   */
  clearMessages(projectId: string): void {
    try {
      const key = `${this.storageKey}-${projectId}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to clear chat messages:', error);
    }
  }

  /**
   * Clear all chat messages across all projects
   */
  clearAllMessages(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(this.storageKey)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Failed to clear all chat messages:', error);
    }
  }

  /**
   * Get all project IDs with stored messages
   */
  getProjectIds(): string[] {
    try {
      const keys = Object.keys(localStorage);
      return keys
        .filter((key) => key.startsWith(this.storageKey))
        .map((key) => key.replace(`${this.storageKey}-`, ''));
    } catch (error) {
      console.error('Failed to get project IDs:', error);
      return [];
    }
  }

  /**
   * Clean up debounce timer
   */
  destroy(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }
}

// Singleton instance
export const chatStorageService = new ChatStorageService();
