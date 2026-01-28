/**
 * ChatStore Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChatStore } from '../chat-store';
import type { ChatMessage } from '@/types/chat';

describe('useChatStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useChatStore.setState({
      messages: [],
      isStreaming: false,
      error: null,
      currentProjectId: null,
    });
    localStorage.clear();
  });

  it('should have initial state', () => {
    const { result } = renderHook(() => useChatStore());

    expect(result.current.messages).toEqual([]);
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.currentProjectId).toBeNull();
  });

  it('should add a message', () => {
    const { result } = renderHook(() => useChatStore());

    const message: ChatMessage = {
      id: '1',
      role: 'user',
      content: 'Hello',
      timestamp: new Date(),
    };

    act(() => {
      result.current.addMessage(message);
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]).toEqual(message);
  });

  it('should set messages', () => {
    const { result } = renderHook(() => useChatStore());

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

    act(() => {
      result.current.setMessages(messages);
    });

    expect(result.current.messages).toEqual(messages);
  });

  it('should clear messages', () => {
    const { result } = renderHook(() => useChatStore());

    const message: ChatMessage = {
      id: '1',
      role: 'user',
      content: 'Hello',
      timestamp: new Date(),
    };

    act(() => {
      result.current.addMessage(message);
    });

    expect(result.current.messages).toHaveLength(1);

    act(() => {
      result.current.clearMessages();
    });

    expect(result.current.messages).toHaveLength(0);
  });

  it('should set streaming state', () => {
    const { result } = renderHook(() => useChatStore());

    act(() => {
      result.current.setStreaming(true);
    });

    expect(result.current.isStreaming).toBe(true);

    act(() => {
      result.current.setStreaming(false);
    });

    expect(result.current.isStreaming).toBe(false);
  });

  it('should set error', () => {
    const { result } = renderHook(() => useChatStore());

    act(() => {
      result.current.setError('API Error');
    });

    expect(result.current.error).toBe('API Error');

    act(() => {
      result.current.setError(null);
    });

    expect(result.current.error).toBeNull();
  });

  it('should set current project and load its messages', () => {
    const { result } = renderHook(() => useChatStore());

    // Add messages for project-1
    const messages1: ChatMessage[] = [
      {
        id: '1',
        role: 'user',
        content: 'Project 1 message',
        timestamp: new Date(),
      },
    ];

    // Manually set up localStorage
    localStorage.setItem(
      'visual-builder-chat-messages-project-1',
      JSON.stringify(messages1)
    );

    act(() => {
      result.current.setCurrentProject('project-1');
    });

    expect(result.current.currentProjectId).toBe('project-1');
    expect(result.current.messages).toEqual(messages1);
  });

  it('should retry last message', () => {
    const { result } = renderHook(() => useChatStore());

    const userMessage: ChatMessage = {
      id: '1',
      role: 'user',
      content: 'Hello',
      timestamp: new Date(),
    };

    const assistantMessage: ChatMessage = {
      id: '2',
      role: 'assistant',
      content: 'Hi there!',
      timestamp: new Date(),
    };

    act(() => {
      result.current.addMessage(userMessage);
      result.current.addMessage(assistantMessage);
    });

    expect(result.current.messages).toHaveLength(2);

    act(() => {
      result.current.retryLastMessage();
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]).toEqual(userMessage);
  });

  it('should not retry if last message is from user', () => {
    const { result } = renderHook(() => useChatStore());

    const userMessage: ChatMessage = {
      id: '1',
      role: 'user',
      content: 'Hello',
      timestamp: new Date(),
    };

    act(() => {
      result.current.addMessage(userMessage);
    });

    act(() => {
      result.current.retryLastMessage();
    });

    expect(result.current.messages).toHaveLength(1);
  });

  it('should persist messages to localStorage when project is set', () => {
    const { result } = renderHook(() => useChatStore());

    act(() => {
      result.current.setCurrentProject('test-project');
    });

    const message: ChatMessage = {
      id: '1',
      role: 'user',
      content: 'Test',
      timestamp: new Date(),
    };

    act(() => {
      result.current.addMessage(message);
    });

    // Wait for debounced save
    setTimeout(() => {
      const stored = localStorage.getItem(
        'visual-builder-chat-messages-test-project'
      );
      expect(stored).toBeDefined();
    }, 1100);
  });
});
