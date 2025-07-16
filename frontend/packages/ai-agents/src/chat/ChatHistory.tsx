import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@ui-kit/components';
import { Button } from '@ui-kit/components';
import { InputSanitizer } from '../security/inputSanitizer';

export interface ChatConversation {
  id: string;
  title: string;
  timestamp: number;
  messageCount: number;
  lastMessage?: string;
  agentId?: string;
  agentName?: string;
}

export interface ChatHistoryProps {
  agentId?: string;
  conversations?: ChatConversation[];
  onSelectConversation: (conversationId: string) => void;
  onDeleteConversation?: (conversationId: string) => void;
  onClose: () => void;
  className?: string;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({
  agentId,
  conversations = [],
  onSelectConversation,
  onDeleteConversation,
  onClose,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'timestamp' | 'title' | 'messageCount'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Sanitize and validate conversations
  const sanitizedConversations = useMemo(() => {
    return conversations.map(conv => ({
      ...conv,
      id: InputSanitizer.sanitizeText(conv.id || ''),
      title: InputSanitizer.sanitizeText(conv.title || 'Untitled Conversation'),
      lastMessage: conv.lastMessage ? InputSanitizer.sanitizeText(conv.lastMessage) : undefined,
      agentId: conv.agentId ? InputSanitizer.sanitizeText(conv.agentId) : undefined,
      agentName: conv.agentName ? InputSanitizer.sanitizeText(conv.agentName) : undefined,
      messageCount: Math.max(0, conv.messageCount || 0),
      timestamp: conv.timestamp || 0
    })).filter(conv => conv.id && conv.title);
  }, [conversations]);

  // Filter conversations based on search term and agent
  const filteredConversations = useMemo(() => {
    let filtered = sanitizedConversations;

    // Filter by agent if specified
    if (agentId) {
      filtered = filtered.filter(conv => conv.agentId === agentId);
    }

    // Filter by search term
    if (searchTerm) {
      const sanitizedSearchTerm = InputSanitizer.sanitizeText(searchTerm).toLowerCase();
      filtered = filtered.filter(conv => 
        conv.title.toLowerCase().includes(sanitizedSearchTerm) ||
        (conv.lastMessage && conv.lastMessage.toLowerCase().includes(sanitizedSearchTerm)) ||
        (conv.agentName && conv.agentName.toLowerCase().includes(sanitizedSearchTerm))
      );
    }

    // Sort conversations
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'messageCount':
          aValue = a.messageCount;
          bValue = b.messageCount;
          break;
        case 'timestamp':
        default:
          aValue = a.timestamp;
          bValue = b.timestamp;
          break;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [sanitizedConversations, agentId, searchTerm, sortBy, sortOrder]);

  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Limit search term length
    if (value.length > 100) return;
    
    setSearchTerm(value);
  }, []);

  // Handle conversation selection
  const handleConversationSelect = useCallback((conversationId: string) => {
    const sanitizedId = InputSanitizer.sanitizeText(conversationId);
    if (!sanitizedId) return;
    
    // Verify conversation exists
    const conversation = sanitizedConversations.find(c => c.id === sanitizedId);
    if (!conversation) return;

    onSelectConversation(sanitizedId);
  }, [sanitizedConversations, onSelectConversation]);

  // Handle conversation deletion
  const handleConversationDelete = useCallback((conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!onDeleteConversation) return;
    
    const sanitizedId = InputSanitizer.sanitizeText(conversationId);
    if (!sanitizedId) return;
    
    // Verify conversation exists
    const conversation = sanitizedConversations.find(c => c.id === sanitizedId);
    if (!conversation) return;

    if (confirm(`Delete conversation "${conversation.title}"?`)) {
      onDeleteConversation(sanitizedId);
    }
  }, [sanitizedConversations, onDeleteConversation]);

  // Handle sort change
  const handleSortChange = useCallback((newSortBy: typeof sortBy) => {
    if (newSortBy === sortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  }, [sortBy, sortOrder]);

  // Format timestamp
  const formatTimestamp = (timestamp: number): string => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      const diffDays = diffHours / 24;

      if (diffHours < 1) {
        return 'Less than 1 hour ago';
      } else if (diffHours < 24) {
        return `${Math.floor(diffHours)} hours ago`;
      } else if (diffDays < 7) {
        return `${Math.floor(diffDays)} days ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch {
      return 'Unknown time';
    }
  };

  // Get sort indicator
  const getSortIndicator = (column: typeof sortBy) => {
    if (column !== sortBy) return null;
    return sortOrder === 'asc' ? '▲' : '▼';
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle size="sm">Chat History</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-1"
          >
            ✕
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search and filters */}
        <div className="space-y-2">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search conversations..."
            className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary/50"
            maxLength={100}
          />
          
          {/* Sort buttons */}
          <div className="flex space-x-1">
            <Button
              variant={sortBy === 'timestamp' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSortChange('timestamp')}
              className="text-xs"
            >
              Date {getSortIndicator('timestamp')}
            </Button>
            <Button
              variant={sortBy === 'title' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSortChange('title')}
              className="text-xs"
            >
              Title {getSortIndicator('title')}
            </Button>
            <Button
              variant={sortBy === 'messageCount' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSortChange('messageCount')}
              className="text-xs"
            >
              Messages {getSortIndicator('messageCount')}
            </Button>
          </div>
        </div>

        {/* Conversations list */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              {searchTerm ? 'No conversations found' : 'No chat history'}
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => handleConversationSelect(conversation.id)}
                className="p-3 border border-border rounded cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-sm truncate">
                        {conversation.title}
                      </h4>
                      {conversation.agentName && (
                        <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
                          {conversation.agentName}
                        </span>
                      )}
                    </div>
                    
                    {conversation.lastMessage && (
                      <p className="text-xs text-muted-foreground truncate mb-1">
                        {conversation.lastMessage}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <span>{formatTimestamp(conversation.timestamp)}</span>
                      <span>•</span>
                      <span>{conversation.messageCount} messages</span>
                    </div>
                  </div>
                  
                  {onDeleteConversation && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleConversationDelete(conversation.id, e)}
                      className="p-1 text-muted-foreground hover:text-destructive"
                      title="Delete conversation"
                    >
                      🗑️
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
          Showing {filteredConversations.length} of {sanitizedConversations.length} conversations
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatHistory;