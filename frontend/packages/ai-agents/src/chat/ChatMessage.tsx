import React, { useMemo } from 'react';
import { Card, CardContent } from '@ui-kit/components';
import { InputSanitizer } from '../security/inputSanitizer';
import type { ChatMessage as ChatMessageType, Agent } from '../types';

export interface ChatMessageProps {
  message: ChatMessageType;
  agent?: Agent;
  isStreaming?: boolean;
  className?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  agent,
  isStreaming = false,
  className = ''
}) => {
  const isFromUser = message.role === 'user';
  const isFromAgent = message.role === 'assistant';

  // Sanitize message content to prevent XSS
  const sanitizedContent = useMemo(() => {
    if (!message.content) return '';
    
    const validation = InputSanitizer.validateChatMessage(message.content);
    if (!validation.isValid) {
      console.warn('Invalid message content:', validation.error);
      return '[Invalid message content]';
    }
    
    return validation.sanitized;
  }, [message.content]);

  // Sanitize agent name to prevent XSS
  const sanitizedAgentName = useMemo(() => {
    if (!agent?.name) return 'Agent';
    return InputSanitizer.sanitizeText(agent.name);
  }, [agent?.name]);

  // Format timestamp safely
  const formatTimestamp = (timestamp: number): string => {
    try {
      return new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  // Render message attachments securely
  const renderAttachments = () => {
    if (!message.attachments || message.attachments.length === 0) {
      return null;
    }

    return (
      <div className="mt-2 space-y-2">
        {message.attachments.map((attachment, index) => {
          // Validate file information
          const fileName = InputSanitizer.sanitizeText(attachment.name || 'Unknown file');
          const fileType = InputSanitizer.sanitizeText(attachment.type || 'unknown');
          
          return (
            <div 
              key={index}
              className="flex items-center space-x-2 p-2 bg-muted/50 rounded border"
            >
              <div className="flex-shrink-0">
                {fileType.startsWith('image/') ? '🖼️' : '📄'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{fileName}</p>
                <p className="text-xs text-muted-foreground">{fileType}</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render code blocks securely
  const renderCodeBlock = (code: string, language?: string) => {
    const sanitizedCode = InputSanitizer.sanitizeCode(code, language);
    
    return (
      <pre className="bg-muted p-3 rounded-md overflow-x-auto">
        <code className="text-sm">{sanitizedCode}</code>
      </pre>
    );
  };

  // Parse and render message content with basic markdown support
  const renderContent = () => {
    if (!sanitizedContent) return null;

    // Split by code blocks (basic markdown parsing)
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(sanitizedContent)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        const textPart = sanitizedContent.slice(lastIndex, match.index);
        parts.push(
          <span key={`text-${lastIndex}`} className="whitespace-pre-wrap">
            {textPart}
          </span>
        );
      }

      // Add code block
      const language = match[1];
      const code = match[2];
      parts.push(
        <div key={`code-${match.index}`} className="my-2">
          {renderCodeBlock(code, language)}
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < sanitizedContent.length) {
      const remainingText = sanitizedContent.slice(lastIndex);
      parts.push(
        <span key={`text-${lastIndex}`} className="whitespace-pre-wrap">
          {remainingText}
        </span>
      );
    }

    return parts.length > 0 ? parts : (
      <span className="whitespace-pre-wrap">{sanitizedContent}</span>
    );
  };

  return (
    <div className={`flex ${isFromUser ? 'justify-end' : 'justify-start'} ${className}`}>
      <div className={`max-w-[70%] ${isFromUser ? 'ml-auto' : 'mr-auto'}`}>
        <Card className={`
          ${isFromUser 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted'
          }
          ${isStreaming ? 'border-primary/50' : ''}
        `}>
          <CardContent className="p-3">
            {/* Message header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium">
                  {isFromUser ? 'You' : sanitizedAgentName}
                </span>
                {isFromAgent && agent && (
                  <span className="text-xs opacity-75">
                    {agent.type === 'coder' ? '💻' : 
                     agent.type === 'researcher' ? '🔍' : 
                     agent.type === 'analyst' ? '📊' : '🤖'}
                  </span>
                )}
              </div>
              {message.timestamp && (
                <span className="text-xs opacity-75">
                  {formatTimestamp(message.timestamp)}
                </span>
              )}
            </div>

            {/* Message content */}
            <div className="text-sm">
              {renderContent()}
            </div>

            {/* Attachments */}
            {renderAttachments()}

            {/* Streaming indicator */}
            {isStreaming && (
              <div className="mt-2 flex items-center space-x-1">
                <div className="w-1 h-1 bg-current rounded-full animate-pulse" />
                <div className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
            )}

            {/* Error indicator */}
            {message.error && (
              <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded">
                <p className="text-xs text-destructive">
                  {InputSanitizer.sanitizeText(message.error)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChatMessage;