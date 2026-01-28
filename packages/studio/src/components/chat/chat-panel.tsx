/**
 * ChatPanel
 * Main chat interface component using Vercel AI SDK with streaming support
 */

import * as React from 'react';
import { useChat } from '@ai-sdk/react';
import { PanelLeftClose } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChatMessages } from './chat-messages';
import { ChatInput } from './chat-input';
import { useChatStore } from '@/stores/chat-store';
import { useMediaQuery } from '@/hooks/use-media-query';
import { PanelCollapseContext } from '@/components/editor/layout/resizable-layout';
import type { ChatMessage } from '@/types/chat';

export interface ChatPanelProps {
  projectId?: string;
  className?: string;
}

export const ChatPanel = React.forwardRef<HTMLDivElement, ChatPanelProps>(
  ({ projectId = 'default', className }, ref) => {
    const {
      addMessage,
      setMessages,
      clearMessages: clearStoreMessages,
      setError,
      currentProjectId,
      setCurrentProject,
    } = useChatStore();

    // Load persisted messages when project changes
    React.useEffect(() => {
      if (currentProjectId !== projectId) {
        setCurrentProject(projectId);
      }
    }, [projectId, currentProjectId, setCurrentProject]);

    const {
      messages,
      input,

      handleSubmit,
      isLoading,
      error,
      stop,
      reload,
      setInput,
    } = useChat({
      api: '/api/chat',
      initialMessages: [],
      body: {
        projectId,
      },
      onError: (error) => {
        console.error('Chat error:', error);
        setError(error.message);
      },
      onFinish: (message) => {
        // Message is already added by useChat, but we persist it
        const chatMessage: ChatMessage = {
          ...message,
          timestamp: new Date(),
        };
        addMessage(chatMessage);
      },
    });

    const handleRetry = React.useCallback(() => {
      reload();
      setError(null);
    }, [reload, setError]);

    const handleClearHistory = React.useCallback(() => {
      clearStoreMessages();
      setMessages([]);
    }, [clearStoreMessages, setMessages, setError]);

    const handleFileUpload = React.useCallback((files: File[]) => {
      // TODO: Implement file upload logic
      console.log('Files uploaded:', files);
    }, []);

    // Safely get collapse context (may not exist on mobile)
    const context = React.useContext(PanelCollapseContext);
    const toggleChat = context?.toggleChat;

    // Mobile detection - don't show collapse button on mobile
    const isMobile = useMediaQuery('(max-width: 768px)');

    return (
      <div
        ref={ref}
        className={cn('h-full flex flex-col bg-card text-card-foreground border-r', className)}
      >
        {/* Header */}
        <div className="border-b px-4 py-3 flex items-center justify-between">
          <div>
            <h3 className="font-semibold">AI Assistant</h3>
            <p className="text-xs text-muted-foreground">
              Describe what you want to build
            </p>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearHistory}
                className="text-xs"
              >
                Clear
              </Button>
            )}
            {toggleChat && !isMobile && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={toggleChat}
                aria-label="Collapse panel"
                title="Collapse panel"
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Messages */}
        <ChatMessages messages={messages} isLoading={isLoading} />

        {/* Error Display */}
        {error && (
          <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm flex items-center justify-between">
            <span>Error: {error}</span>
            <Button
              variant="link"
              size="sm"
              onClick={handleRetry}
              className="ml-2 h-auto p-0 text-destructive"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Input */}
        <ChatInput
          input={input}
          isLoading={isLoading}
          onInputChange={setInput}
          onSubmit={handleSubmit}
          onStop={stop}
          onFileUpload={handleFileUpload}
        />
      </div>
    );
  }
);

ChatPanel.displayName = 'ChatPanel';
