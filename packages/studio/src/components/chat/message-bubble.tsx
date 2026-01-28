/**
 * MessageBubble
 * Displays a single chat message with user/AI styling and markdown rendering
 */

import * as React from 'react';
import type { CoreMessage } from 'ai';
import { Bot, User, Loader2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export interface MessageBubbleProps {
  message: CoreMessage;
  isLoading?: boolean;
}

export const MessageBubble = React.forwardRef<HTMLDivElement, MessageBubbleProps>(
  ({ message, isLoading }, ref) => {
    const isUser = message.role === 'user';
    const [copied, setCopied] = React.useState(false);

    const handleCopy = React.useCallback(() => {
      if (message.content) {
        navigator.clipboard.writeText(message.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }, [message.content]);

    return (
      <div
        ref={ref}
        className={cn(
          'flex gap-3 mb-4 group animate-in fade-in slide-in-from-bottom-2 duration-300',
          isUser ? 'justify-end' : 'justify-start'
        )}
      >
        {!isUser && (
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
          </div>
        )}

        <div
          className={cn(
            'max-w-[80%] rounded-lg px-4 py-2.5 relative',
            isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
          )}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          ) : (
            <>
              <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                {isUser ? (
                  <div className="whitespace-pre-wrap break-words">
                    {message.content}
                  </div>
                ) : (
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <div className="relative group/code">
                            <SyntaxHighlighter
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                              className="rounded-md"
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute right-2 top-2 opacity-0 group-hover/code:opacity-100 transition-opacity"
                              onClick={handleCopy}
                            >
                              {copied ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      },
                      p({ children }) {
                        return <p className="mb-2 last:mb-0">{children}</p>;
                      },
                      ul({ children }) {
                        return <ul className="list-disc list-inside mb-2">{children}</ul>;
                      },
                      ol({ children }) {
                        return <ol className="list-decimal list-inside mb-2">{children}</ol>;
                      },
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                )}
              </div>

              {!isUser && message.content && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              )}
            </>
          )}
        </div>

        {isUser && (
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <User className="w-4 h-4 text-primary-foreground" />
            </div>
          </div>
        )}
      </div>
    );
  }
);

MessageBubble.displayName = 'MessageBubble';
