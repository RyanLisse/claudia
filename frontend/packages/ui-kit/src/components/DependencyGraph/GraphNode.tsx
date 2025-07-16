import React, { memo, useCallback } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { 
  User, 
  Calendar, 
  Clock, 
  Flag, 
  AlertCircle, 
  CheckCircle, 
  Circle, 
  Play,
  Square,
  Triangle,
  Hexagon
} from 'lucide-react';
import { Badge } from '../Badge/Badge';
import { cn } from '../../utils';
import type { GraphNode as GraphNodeType } from './types';
import { NODE_COLORS, PRIORITY_COLORS } from './utils';

const nodeVariants = cva(
  'relative cursor-pointer select-none transition-all duration-200 ease-in-out',
  {
    variants: {
      type: {
        task: 'rounded-lg',
        milestone: 'rounded-full',
        blocker: 'rounded-md rotate-45',
      },
      status: {
        pending: 'opacity-70',
        'in-progress': 'opacity-90 animate-pulse',
        completed: 'opacity-100',
        blocked: 'opacity-60',
      },
      priority: {
        low: 'ring-2 ring-green-200',
        medium: 'ring-2 ring-yellow-200',
        high: 'ring-2 ring-orange-200',
        urgent: 'ring-2 ring-red-200',
      },
      interactive: {
        true: 'hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
        false: '',
      },
      selected: {
        true: 'ring-4 ring-blue-500 shadow-lg',
        false: '',
      },
      dragging: {
        true: 'z-50 scale-110 shadow-2xl',
        false: '',
      },
    },
    defaultVariants: {
      type: 'task',
      status: 'pending',
      priority: 'medium',
      interactive: true,
      selected: false,
      dragging: false,
    },
  }
);

const nodeContentVariants = cva(
  'flex items-center justify-center p-3 border-2 transition-colors duration-200',
  {
    variants: {
      type: {
        task: 'rounded-lg',
        milestone: 'rounded-full',
        blocker: 'rounded-md',
      },
      status: {
        pending: 'bg-gray-100 border-gray-300',
        'in-progress': 'bg-blue-100 border-blue-300',
        completed: 'bg-green-100 border-green-300',
        blocked: 'bg-red-100 border-red-300',
      },
    },
    defaultVariants: {
      type: 'task',
      status: 'pending',
    },
  }
);

interface GraphNodeProps extends VariantProps<typeof nodeVariants> {
  node: GraphNodeType;
  isSelected?: boolean;
  isDragging?: boolean;
  isHovered?: boolean;
  scale?: number;
  onMouseDown?: (event: React.MouseEvent) => void;
  onMouseUp?: (event: React.MouseEvent) => void;
  onMouseEnter?: (event: React.MouseEvent) => void;
  onMouseLeave?: (event: React.MouseEvent) => void;
  onClick?: (event: React.MouseEvent) => void;
  onDoubleClick?: (event: React.MouseEvent) => void;
  className?: string;
  showDetails?: boolean;
  showTooltip?: boolean;
}

const GraphNode = memo<GraphNodeProps>(({
  node,
  isSelected = false,
  isDragging = false,
  isHovered = false,
  scale = 1,
  onMouseDown,
  onMouseUp,
  onMouseEnter,
  onMouseLeave,
  onClick,
  onDoubleClick,
  className,
  showDetails = true,
  showTooltip = true,
}) => {
  const getNodeIcon = useCallback(() => {
    switch (node.type) {
      case 'task':
        return <Square className="w-4 h-4" />;
      case 'milestone':
        return <Triangle className="w-4 h-4" />;
      case 'blocker':
        return <Hexagon className="w-4 h-4" />;
      default:
        return <Circle className="w-4 h-4" />;
    }
  }, [node.type]);

  const getStatusIcon = useCallback(() => {
    switch (node.status) {
      case 'pending':
        return <Circle className="w-3 h-3 text-gray-500" />;
      case 'in-progress':
        return <Play className="w-3 h-3 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'blocked':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return <Circle className="w-3 h-3 text-gray-500" />;
    }
  }, [node.status]);

  const getPriorityColor = useCallback(() => {
    return PRIORITY_COLORS[node.priority];
  }, [node.priority]);


  const getTypeColor = useCallback(() => {
    return NODE_COLORS[node.type];
  }, [node.type]);

  const nodeStyle = {
    transform: `translate(${node.position.x - node.size.width / 2}px, ${node.position.y - node.size.height / 2}px) scale(${scale})`,
    width: node.size.width,
    height: node.size.height,
    transformOrigin: 'center',
  };

  return (
    <div
      className={cn(
        nodeVariants({
          type: node.type,
          status: node.status,
          priority: node.priority,
          interactive: true,
          selected: isSelected,
          dragging: isDragging,
        }),
        className
      )}
      style={nodeStyle}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      role="button"
      tabIndex={0}
      aria-label={`${node.type} node: ${node.label}`}
      aria-selected={isSelected}
      data-node-id={node.id}
      data-testid={`graph-node-${node.id}`}
    >
      {/* Main node content */}
      <div
        className={cn(
          nodeContentVariants({
            type: node.type,
            status: node.status,
          }),
          'relative w-full h-full'
        )}
        style={{ backgroundColor: getTypeColor() }}
      >
        {/* Node icon */}
        <div className="absolute top-1 left-1 text-white">
          {getNodeIcon()}
        </div>

        {/* Status indicator */}
        <div className="absolute top-1 right-1">
          {getStatusIcon()}
        </div>

        {/* Priority indicator */}
        <div 
          className="absolute bottom-1 left-1 w-2 h-2 rounded-full"
          style={{ backgroundColor: getPriorityColor() }}
          aria-label={`Priority: ${node.priority}`}
        />

        {/* Node label */}
        <div className="text-white text-sm font-medium text-center px-2 py-1 truncate">
          {node.label}
        </div>

        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute -inset-1 border-2 border-blue-500 rounded-lg animate-pulse" />
        )}

        {/* Drag indicator */}
        {isDragging && (
          <div className="absolute -inset-2 border-2 border-blue-400 rounded-lg opacity-50" />
        )}
      </div>

      {/* Hover details */}
      {showDetails && isHovered && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50">
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-48 max-w-80">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900">{node.label}</h4>
              <Badge variant="outline" size="sm">
                {node.type}
              </Badge>
            </div>
            
            {node.metadata?.description && (
              <p className="text-sm text-gray-600 mb-2">
                {node.metadata.description}
              </p>
            )}

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Flag className="w-3 h-3" />
                <span>Priority: {node.priority}</span>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Circle className="w-3 h-3" />
                <span>Status: {node.status}</span>
              </div>

              {node.metadata?.assignee && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <User className="w-3 h-3" />
                  <span>Assignee: {node.metadata.assignee}</span>
                </div>
              )}

              {node.metadata?.dueDate && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>Due: {new Date(node.metadata.dueDate).toLocaleDateString()}</span>
                </div>
              )}

              {node.metadata?.estimatedHours && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>Estimated: {node.metadata.estimatedHours}h</span>
                </div>
              )}
            </div>

            {node.metadata?.tags && node.metadata.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {node.metadata.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" size="sm">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tooltip for minimal details */}
      {showTooltip && !showDetails && (
        <div 
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap pointer-events-none"
          style={{
            visibility: isHovered ? 'visible' : 'hidden',
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.2s, visibility 0.2s',
          }}
        >
          {node.label}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
});

GraphNode.displayName = 'GraphNode';

export { GraphNode, nodeVariants, nodeContentVariants };
export type { GraphNodeProps };