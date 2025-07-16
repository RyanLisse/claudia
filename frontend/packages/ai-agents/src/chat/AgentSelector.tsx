import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@ui-kit/components';
import { InputSanitizer } from '../security/inputSanitizer';
import type { Agent } from '../types';

export interface AgentSelectorProps {
  agents: Agent[];
  selectedAgentId?: string;
  onAgentSelect: (agentId: string) => void;
  className?: string;
  disabled?: boolean;
}

export const AgentSelector: React.FC<AgentSelectorProps> = ({
  agents,
  selectedAgentId,
  onAgentSelect,
  className = '',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Sanitize and validate agents
  const sanitizedAgents = agents.map(agent => ({
    ...agent,
    id: InputSanitizer.sanitizeText(agent.id || ''),
    name: InputSanitizer.sanitizeText(agent.name || 'Unknown Agent'),
    type: InputSanitizer.sanitizeText(agent.type || 'unknown'),
    description: agent.description ? InputSanitizer.sanitizeText(agent.description) : undefined
  })).filter(agent => agent.id && agent.name);

  // Filter agents based on search term
  const filteredAgents = sanitizedAgents.filter(agent => {
    if (!searchTerm) return true;
    
    const sanitizedSearchTerm = InputSanitizer.sanitizeText(searchTerm).toLowerCase();
    return (
      agent.name.toLowerCase().includes(sanitizedSearchTerm) ||
      agent.type.toLowerCase().includes(sanitizedSearchTerm) ||
      (agent.description && agent.description.toLowerCase().includes(sanitizedSearchTerm))
    );
  });

  // Get selected agent safely
  const selectedAgent = sanitizedAgents.find(agent => agent.id === selectedAgentId);

  // Handle agent selection
  const handleAgentSelect = (agentId: string) => {
    if (disabled) return;
    
    // Validate agent ID
    const sanitizedAgentId = InputSanitizer.sanitizeText(agentId);
    if (!sanitizedAgentId) return;
    
    // Verify agent exists
    const agent = sanitizedAgents.find(a => a.id === sanitizedAgentId);
    if (!agent) return;

    onAgentSelect(sanitizedAgentId);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Limit search term length
    if (value.length > 100) return;
    
    setSearchTerm(value);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  // Get agent emoji based on type
  const getAgentEmoji = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'coder':
        return '💻';
      case 'researcher':
        return '🔍';
      case 'analyst':
        return '📊';
      case 'tester':
        return '🧪';
      case 'reviewer':
        return '👁️';
      case 'coordinator':
        return '🎯';
      default:
        return '🤖';
    }
  };

  // Render agent status indicator
  const renderAgentStatus = (agent: Agent) => {
    const isOnline = agent.status === 'online' || agent.status === 'active';
    const isOffline = agent.status === 'offline' || agent.status === 'inactive';
    
    return (
      <div className={`w-2 h-2 rounded-full ${
        isOnline ? 'bg-green-500' : 
        isOffline ? 'bg-gray-400' : 
        'bg-yellow-500'
      }`} />
    );
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center space-x-2"
      >
        {selectedAgent ? (
          <>
            <span>{getAgentEmoji(selectedAgent.type)}</span>
            <span className="truncate max-w-[120px]">{selectedAgent.name}</span>
          </>
        ) : (
          <>
            <span>🤖</span>
            <span>Select Agent</span>
          </>
        )}
        <span className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </Button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          {/* Search input */}
          <div className="p-3 border-b border-border">
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              placeholder="Search agents..."
              className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary/50"
              maxLength={100}
            />
          </div>

          {/* Agent list */}
          <div className="max-h-64 overflow-y-auto">
            {filteredAgents.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                {searchTerm ? 'No agents found' : 'No agents available'}
              </div>
            ) : (
              filteredAgents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => handleAgentSelect(agent.id)}
                  className={`w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors ${
                    selectedAgentId === agent.id ? 'bg-muted' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getAgentEmoji(agent.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium truncate">{agent.name}</span>
                          {renderAgentStatus(agent)}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <span className="capitalize">{agent.type}</span>
                          {agent.description && (
                            <>
                              <span>•</span>
                              <span className="truncate">{agent.description}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {selectedAgentId === agent.id && (
                      <span className="text-primary">✓</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-border bg-muted/30">
            <div className="text-xs text-muted-foreground">
              {filteredAgents.length} of {sanitizedAgents.length} agents
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentSelector;