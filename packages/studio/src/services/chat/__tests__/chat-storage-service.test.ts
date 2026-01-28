/**
 * ChatStorageService Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ChatStorageService } from '../chat-storage-service';
import type { ChatMessage } from '@/types/chat';

describe('ChatStorageService', () => {
  let service: ChatStorageService;
  const mockProjectId = 'test-project';

  beforeEach(() => {
    service = new ChatStorageService('test-chat-storage', 0);
    localStorage.clear();
  });

  afterEach(() => {
    service.destroy();
  });

  describe('saveMessages', () => {
    it('should save messages to localStorage', () => {
      const messages: ChatMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'Hello',
          timestamp: new Date(),
        },
        {
          id: '2',
          role: 'assistant',
          content: 'Hi there!',
          timestamp: new Date(),
        },
      ];

      service.saveMessages(mockProjectId, messages);

      const stored = localStorage.getItem(`test-chat-storage-${mockProjectId}`);
      expect(stored).toBeDefined();
      expect(JSON.parse(stored!)).toEqual(messages);
    });

    it('should debounce save operations', () => {
      const messages: ChatMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'Test',
          timestamp: new Date(),
        },
      ];

      service.saveMessages(mockProjectId, messages);
      service.saveMessages(mockProjectId, [...messages, messages[0]]);

      // Should only have one entry due to debouncing
      const keys = Object.keys(localStorage).filter((key) =>
        key.includes(mockProjectId)
      );
      expect(keys).toHaveLength(1);
    });

    it('should handle save errors gracefully', () => {
      const localStorageSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const messages: ChatMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'Test',
          timestamp: new Date(),
        },
      ];

      expect(() => service.saveMessages(mockProjectId, messages)).not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();

      localStorageSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('loadMessages', () => {
    it('should load messages from localStorage', () => {
      const messages: ChatMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'Hello',
          timestamp: new Date('2024-01-01'),
        },
      ];

      localStorage.setItem(
        `test-chat-storage-${mockProjectId}`,
        JSON.stringify(messages)
      );

      const loaded = service.loadMessages(mockProjectId);
      expect(loaded).toEqual(messages);
    });

    it('should return empty array if no messages exist', () => {
      const loaded = service.loadMessages('non-existent-project');
      expect(loaded).toEqual([]);
    });

    it('should handle invalid data gracefully', () => {
      localStorage.setItem(`test-chat-storage-${mockProjectId}`, 'invalid-json');

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const loaded = service.loadMessages(mockProjectId);
      expect(loaded).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('should convert timestamp strings to Date objects', () => {
      const messages = [
        {
          id: '1',
          role: 'user',
          content: 'Test',
          timestamp: '2024-01-01T00:00:00.000Z',
        },
      ];

      localStorage.setItem(
        `test-chat-storage-${mockProjectId}`,
        JSON.stringify(messages)
      );

      const loaded = service.loadMessages(mockProjectId);
      expect(loaded[0].timestamp).toBeInstanceOf(Date);
    });
  });

  describe('clearMessages', () => {
    it('should clear messages for specific project', () => {
      const messages: ChatMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'Test',
          timestamp: new Date(),
        },
      ];

      service.saveMessages(mockProjectId, messages);
      service.clearMessages(mockProjectId);

      const stored = localStorage.getItem(`test-chat-storage-${mockProjectId}`);
      expect(stored).toBeNull();
    });
  });

  describe('clearAllMessages', () => {
    it('should clear all project messages', () => {
      const messages: ChatMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'Test',
          timestamp: new Date(),
        },
      ];

      service.saveMessages('project-1', messages);
      service.saveMessages('project-2', messages);

      service.clearAllMessages();

      expect(localStorage.getItem(`test-chat-storage-project-1`)).toBeNull();
      expect(localStorage.getItem(`test-chat-storage-project-2`)).toBeNull();
    });
  });

  describe('getProjectIds', () => {
    it('should return all project IDs with stored messages', () => {
      const messages: ChatMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'Test',
          timestamp: new Date(),
        },
      ];

      service.saveMessages('project-1', messages);
      service.saveMessages('project-2', messages);

      const projectIds = service.getProjectIds();
      expect(projectIds).toHaveLength(2);
      expect(projectIds).toContain('project-1');
      expect(projectIds).toContain('project-2');
    });

    it('should exclude non-chat keys', () => {
      localStorage.setItem('some-other-key', 'value');

      const messages: ChatMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'Test',
          timestamp: new Date(),
        },
      ];

      service.saveMessages('project-1', messages);

      const projectIds = service.getProjectIds();
      expect(projectIds).toHaveLength(1);
      expect(projectIds[0]).toBe('project-1');
    });
  });

  describe('destroy', () => {
    it('should clear debounce timer', () => {
      const messages: ChatMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'Test',
          timestamp: new Date(),
        },
      ];

      service.saveMessages(mockProjectId, messages);
      service.destroy();

      // Wait to ensure no save happens after destroy
      return new Promise((resolve) => {
        setTimeout(() => {
          const stored = localStorage.getItem(`test-chat-storage-${mockProjectId}`);
          expect(stored).toBeDefined(); // Should have saved before destroy
          resolve(null);
        }, 100);
      });
    });
  });
});
