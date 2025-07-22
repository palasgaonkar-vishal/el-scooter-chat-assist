
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Send, Paperclip, Loader2 } from 'lucide-react';
import { FileUpload } from './FileUpload';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ChatInputProps {
  onSendMessage: (message: string, files: File[]) => void;
  disabled?: boolean;
  isLoading?: boolean;
  initialMessage?: string;
  onMessageUsed?: () => void;
}

export const ChatInput = ({ onSendMessage, disabled = false, isLoading = false, initialMessage = '', onMessageUsed }: ChatInputProps) => {
  const [message, setMessage] = useState(initialMessage);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [hasUsedInitialMessage, setHasUsedInitialMessage] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() && selectedFiles.length === 0) return;
    if (disabled || isLoading) return;

    // Clear the URL params if this is the initial message being used
    if (initialMessage && !hasUsedInitialMessage && onMessageUsed) {
      onMessageUsed();
      setHasUsedInitialMessage(true);
    }

    onSendMessage(message.trim(), selectedFiles);
    setMessage('');
    setSelectedFiles([]);
    setShowFileUpload(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [message]);

  // Set initial message when it changes
  useEffect(() => {
    if (initialMessage && !hasUsedInitialMessage) {
      setMessage(initialMessage);
    }
  }, [initialMessage, hasUsedInitialMessage]);

  const canSend = (message.trim() || selectedFiles.length > 0) && !disabled && !isLoading;

  return (
    <Card className="border-t">
      <CardContent className="p-3 sm:p-4 space-y-3">
        {/* File Upload Section */}
        <Collapsible open={showFileUpload} onOpenChange={setShowFileUpload}>
          <CollapsibleContent>
            <div className="pb-3">
              <FileUpload
                onFilesSelected={setSelectedFiles}
                maxFiles={3}
                maxSize={10}
                disabled={disabled || isLoading}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Message Input */}
        <form onSubmit={handleSubmit} className="flex items-end space-x-2">
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message here... (Shift+Enter for new line)"
              className="min-h-[40px] sm:min-h-[44px] max-h-[100px] sm:max-h-[120px] resize-none text-sm sm:text-base"
              disabled={disabled || isLoading}
            />
          </div>
          
          <div className="flex space-x-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0"
              disabled={disabled || isLoading}
              onClick={() => setShowFileUpload(!showFileUpload)}
            >
              <Paperclip className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            
            <Button
              type="submit"
              size="icon"
              className="h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0"
              disabled={!canSend}
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
              ) : (
                <Send className="h-3 w-3 sm:h-4 sm:w-4" />
              )}
            </Button>
          </div>
        </form>

        {/* Input Helper Text */}
        <div className="text-xs text-muted-foreground">
          <p className="hidden sm:block">
            • Ask questions about your Ather scooter
            • Upload images or documents for better assistance
            • Press Enter to send, Shift+Enter for new line
          </p>
          <p className="sm:hidden">
            Tap the attachment icon to upload files
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
