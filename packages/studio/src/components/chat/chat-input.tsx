/**
 * ChatInput
 * Input form with file upload support for the AI chat interface
 */

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip, Send, Square, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChatInputProps {
  input: string;
  isLoading?: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onStop: () => void;
  onFileUpload?: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
}

export const ChatInput = React.forwardRef<HTMLFormElement, ChatInputProps>(
  (
    {
      input,
      isLoading = false,
      onInputChange,
      onSubmit,
      onStop,
      onFileUpload,
      disabled = false,
      className,
    },
    ref
  ) => {
    const [attachments, setAttachments] = React.useState<File[]>([]);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      setAttachments((prev) => [...prev, ...files]);
      onFileUpload?.(files);
    };

    const handleRemoveAttachment = (index: number) => {
      setAttachments((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() && attachments.length === 0) return;
      onSubmit(e);
      setAttachments([]);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    };

    return (
      <form
        ref={ref}
        onSubmit={handleSubmit}
        className={cn('border-t p-4', className)}
      >
        <div className="flex gap-2 items-end">
          <div className="flex-1 space-y-2">
            <Textarea
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe what you want to build... (Shift+Enter for new line)"
              className="min-h-[60px] max-h-[200px] resize-none"
              disabled={disabled || isLoading}
            />

            {attachments.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="text-xs bg-muted px-2 py-1 rounded flex items-center gap-1"
                  >
                    <Paperclip className="w-3 h-3" />
                    <span className="max-w-[100px] truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(index)}
                      className="hover:text-destructive"
                      disabled={disabled || isLoading}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-1">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx"
              className="hidden"
              onChange={handleFileChange}
              disabled={disabled || isLoading}
            />

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isLoading}
            >
              <Paperclip className="w-4 h-4" />
            </Button>

            {isLoading ? (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={onStop}
              >
                <Square className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                disabled={disabled || (!input.trim() && attachments.length === 0)}
              >
                <Send className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </form>
    );
  }
);

ChatInput.displayName = 'ChatInput';
