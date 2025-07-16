import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@ui-kit/components';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { AgentSelector } from './AgentSelector';
import { ChatHistory } from './ChatHistory';
import { useChat } from '../hooks/useChat';
import { useAgents } from '../hooks/useAgents';
import { useChatSync } from '../hooks/useChatSync';
import type { Agent, ChatMessage as ChatMessageType } from '../types';

export interface AgentChatProps {
  selectedAgentId?: string;
  onAgentChange?: (agentId: string) => void;
  className?: string;
  showHistory?: boolean;
  showAgentSelector?: boolean;
}

export const AgentChat: React.FC<AgentChatProps> = ({
  selectedAgentId,
  onAgentChange,
  className,
  showHistory = true,
  showAgentSelector = true,
}) => {
  const [currentAgentId, setCurrentAgentId] = useState(selectedAgentId || '');
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [conversationId] = useState(() => `conv-${Date.now()}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { agents } = useAgents();
  const {
    messages,
    loading,
    error,
    sendMessage,
    clearChat,
    isStreaming,
    streamingMessage,
  } = useChat(currentAgentId);

  // Set up real-time chat sync
  useChatSync({
    conversationId,
    agentId: currentAgentId,
    onNewMessage: (message) => {
      console.log('New message received:', message);
      // Messages are handled by useChat hook
    },
    onTypingStart: (agentId) => {
      console.log(`Agent ${agentId} started typing`);
    },
    onTypingStop: (agentId) => {
      console.log(`Agent ${agentId} stopped typing`);
    },
    onError: (error) => console.error('Chat sync error:', error),
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  // Update current agent when prop changes
  useEffect(() => {
    if (selectedAgentId && selectedAgentId !== currentAgentId) {
      setCurrentAgentId(selectedAgentId);
    }
  }, [selectedAgentId, currentAgentId]);

  const handleAgentChange = (agentId: string) => {
    setCurrentAgentId(agentId);
    onAgentChange?.(agentId);
  };

  const handleSendMessage = async (content: string, attachments?: File[]) => {
    if (!currentAgentId) {
      return;
    }

    try {
      await sendMessage({
        content,
        attachments,
        agentId: currentAgentId,
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const currentAgent = agents.find(agent => agent.id === currentAgentId);

  return (
    <div className={`flex h-full ${className}`}>
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Card className="flex-1 flex flex-col">
          {/* Chat Header */}
          <CardHeader className="flex-shrink-0 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {currentAgent ? (
                  <>
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg">
                        {currentAgent.type === 'coder' ? '💻' : 
                         currentAgent.type === 'researcher' ? '🔍' : 
                         currentAgent.type === 'analyst' ? '📊' : '🤖'}
                      </span>
                    </div>
                    <div>
                      <CardTitle size="sm">{currentAgent.name}</CardTitle>
                      <p className="text-sm text-muted-foreground capitalize">
                        {currentAgent.type} Agent
                      </p>
                    </div>
                  </>
                ) : (
                  <div>
                    <CardTitle size="sm">Select an Agent</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Choose an agent to start chatting
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {showHistory && (
                  <button
                    onClick={() => setShowHistoryPanel(!showHistoryPanel)}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                    title="Chat History"
                  >
                    📚
                  </button>
                )}
                
                {messages.length > 0 && (
                  <button
                    onClick={clearChat}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                    title="Clear Chat"
                  >
                    🗑️
                  </button>
                )}

                {showAgentSelector && (
                  <AgentSelector
                    agents={agents}
                    selectedAgentId={currentAgentId}
                    onAgentSelect={handleAgentChange}
                  />
                )}
              </div>
            </div>
          </CardHeader>

          {/* Messages Area */}
          <CardContent className="flex-1 flex flex-col p-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {messages.length === 0 && !error ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-4">💬</div>
                    <p className="text-muted-foreground mb-2">
                      {currentAgent 
                        ? `Start a conversation with ${currentAgent.name}`
                        : 'Select an agent to start chatting'
                      }
                    </p>
                    {currentAgent && (
                      <p className="text-sm text-muted-foreground">
                        Ask questions, request code generation, or get help with your tasks
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      agent={currentAgent}
                    />
                  ))}

                  {/* Streaming message */}
                  {isStreaming && streamingMessage && (
                    <ChatMessage
                      message={streamingMessage}
                      agent={currentAgent}
                      isStreaming
                    />
                  )}

                  {/* Loading indicator */}
                  {loading && !isStreaming && (
                    <div className="flex justify-start">
                      <div className="max-w-xs lg:max-w-md">
                        <div className="bg-muted rounded-lg p-3">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="border-t border-border p-4">
              <ChatInput
                onSendMessage={handleSendMessage}
                disabled={!currentAgentId || loading}
                placeholder={
                  currentAgentId 
                    ? `Message ${currentAgent?.name || 'agent'}...`
                    : 'Select an agent to start chatting'
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat History Panel */}
      {showHistory && showHistoryPanel && (
        <div className="w-80 ml-4">
          <ChatHistory
            agentId={currentAgentId}
            onSelectConversation={(conversationId) => {
              // Load conversation history
              console.log('Load conversation:', conversationId);
            }}
            onClose={() => setShowHistoryPanel(false)}
          />
        </div>
      )}
    </div>
  );
};

export default AgentChat;
