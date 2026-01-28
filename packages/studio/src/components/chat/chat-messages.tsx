/**
 * ChatMessages
 * Container for displaying chat messages with auto-scroll functionality
 */

import * as React from 'react';
import type { CoreMessage } from 'ai';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './message-bubble';
import { cn } from '@/lib/utils';

export interface ChatMessagesProps {
  messages: CoreMessage[];
  isLoading?: boolean;
  className?: string;
}

export const ChatMessages = React.forwardRef<HTMLDivElement, ChatMessagesProps>(
  ({ messages, isLoading, className }, ref) => {
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const scrollAreaRef = React.useRef<HTMLDivElement>(null);
    const [isAutoScrollEnabled, setIsAutoScrollEnabled] = React.useState(true);
    const prevMessagesLength = React.useRef(messages.length);

    // Auto-scroll to bottom when new messages arrive
    React.useEffect(() => {
      if (isAutoScrollEnabled && scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, [messages, isAutoScrollEnabled]);

    // Detect if user manually scrolled up
    React.useEffect(() => {
      const scrollArea = scrollAreaRef.current;
      if (!scrollArea) return;

      const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = scrollArea;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;

        // Enable auto-scroll if near bottom, disable if scrolled up
        setIsAutoScrollEnabled(isAtBottom);
      };

      scrollArea.addEventListener('scroll', handleScroll);
      return () => scrollArea.removeEventListener('scroll', handleScroll);
    }, []);

    // Reset auto-scroll when new messages arrive
    React.useEffect(() => {
      if (messages.length > prevMessagesLength.current) {
        setIsAutoScrollEnabled(true);
        prevMessagesLength.current = messages.length;
      }
    }, [messages.length]);

    return (
      <ScrollArea ref={scrollAreaRef} className={cn('flex-1 p-4', className)}>
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p className="text-sm">
                Start a conversation to build your website with AI
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          )}

          {isLoading && (
            <MessageBubble
              message={{
                id: 'loading',
                role: 'assistant',
                content: '',
              }}
              isLoading
            />
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>
    );
  }
);

ChatMessages.displayName = 'ChatMessages';
