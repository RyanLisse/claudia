import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@claudia/ui-kit';
import { InputSanitizer } from '../security/inputSanitizer';

export interface ChatInputProps {
  onSendMessage: (content: string, attachments?: File[]) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  maxLength?: number;
  allowAttachments?: boolean;
  allowedFileTypes?: string[];
  maxFileSize?: number;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = 'Type your message...',
  className = '',
  maxLength = 5000,
  allowAttachments = true,
  allowedFileTypes = ['image/*', 'text/*', 'application/pdf', 'application/json'],
  maxFileSize = 10 * 1024 * 1024 // 10MB
}) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle message input changes with validation
  const handleMessageChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    
    // Basic length validation
    if (value.length > maxLength) {
      setError(`Message too long (max ${maxLength} characters)`);
      return;
    }

    // Clear error if exists
    if (error) {
      setError(null);
    }

    setMessage(value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [maxLength, error]);

  // Handle file uploads with security validation
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    setIsUploading(true);
    setError(null);

    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of files) {
      // Validate file with security checks
      const validation = InputSanitizer.validateFileUpload(file);
      
      if (!validation.isValid) {
        errors.push(`${file.name}: ${validation.error}`);
        continue;
      }

      // Additional size check
      if (file.size > maxFileSize) {
        errors.push(`${file.name}: File too large (max ${maxFileSize / (1024 * 1024)}MB)`);
        continue;
      }

      // Check file type against allowed types
      const isAllowedType = allowedFileTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.slice(0, -1));
        }
        return file.type === type;
      });

      if (!isAllowedType) {
        errors.push(`${file.name}: File type not allowed`);
        continue;
      }

      validFiles.push(file);
    }

    // Update state with results
    if (errors.length > 0) {
      setError(errors.join(', '));
    }

    if (validFiles.length > 0) {
      setAttachments(prev => [...prev, ...validFiles]);
    }

    setIsUploading(false);
    
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [allowedFileTypes, maxFileSize]);

  // Remove attachment
  const removeAttachment = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Handle form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (disabled || isUploading) return;

    const trimmedMessage = message.trim();
    
    if (!trimmedMessage && attachments.length === 0) return;

    // Validate message content
    if (trimmedMessage) {
      const validation = InputSanitizer.validateChatMessage(trimmedMessage);
      
      if (!validation.isValid) {
        setError(validation.error || 'Invalid message content');
        return;
      }
    }

    // Send message
    try {
      onSendMessage(trimmedMessage, attachments.length > 0 ? attachments : undefined);
      
      // Clear form
      setMessage('');
      setAttachments([]);
      setError(null);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (err) {
      setError('Failed to send message');
    }
  }, [message, attachments, disabled, isUploading, onSendMessage]);

  // Handle key press for submit
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  // Render file attachments
  const renderAttachments = () => {
    if (attachments.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 mb-2">
        {attachments.map((file, index) => (
          <div
            key={index}
            className="flex items-center space-x-2 bg-muted px-3 py-1 rounded-full text-sm"
          >
            <span className="truncate max-w-[200px]">
              {InputSanitizer.sanitizeText(file.name)}
            </span>
            <button
              type="button"
              onClick={() => removeAttachment(index)}
              className="text-muted-foreground hover:text-foreground"
              title="Remove attachment"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-2 ${className}`}>
      {/* Error message */}
      {error && (
        <div className="p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
          {InputSanitizer.sanitizeText(error)}
        </div>
      )}

      {/* File attachments */}
      {renderAttachments()}

      {/* Input area */}
      <div className="flex items-end space-x-2">
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleMessageChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled || isUploading}
            className="w-full p-3 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[44px] max-h-[200px] overflow-y-auto"
            rows={1}
            maxLength={maxLength}
            autoComplete="off"
            spellCheck="true"
          />
          
          {/* Character count */}
          <div className="flex justify-between items-center mt-1 text-xs text-muted-foreground">
            <span>{message.length}/{maxLength}</span>
            
            {/* File upload button */}
            {allowAttachments && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isUploading}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Attach file"
              >
                📎
              </button>
            )}
          </div>
        </div>

        {/* Send button */}
        <Button
          type="submit"
          disabled={disabled || isUploading || (!message.trim() && attachments.length === 0)}
          size="sm"
          className="mb-1"
        >
          {isUploading ? '⏳' : '📤'}
        </Button>
      </div>

      {/* Hidden file input */}
      {allowAttachments && (
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedFileTypes.join(',')}
          onChange={handleFileUpload}
          className="hidden"
        />
      )}
    </form>
  );
};

export default ChatInput;