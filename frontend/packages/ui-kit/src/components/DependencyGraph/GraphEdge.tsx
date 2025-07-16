import React, { memo, useCallback, useMemo } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { ArrowRight, Ban, Link } from 'lucide-react';
import { cn } from '../../utils';
import type { GraphEdge as GraphEdgeType, GraphNode } from './types';
import { 
  calculateAngle, 
  calculateDistance, 
  getCircleIntersection, 
  EDGE_COLORS, 
  GRAPH_CONSTANTS 
} from './utils';

const edgeVariants = cva(
  'pointer-events-auto cursor-pointer transition-all duration-200 ease-in-out',
  {
    variants: {
      type: {
        dependency: 'stroke-gray-500',
        blocks: 'stroke-red-500',
        related: 'stroke-purple-500',
      },
      interactive: {
        true: 'hover:stroke-2 hover:opacity-80',
        false: 'pointer-events-none',
      },
      selected: {
        true: 'stroke-4 stroke-blue-500',
        false: '',
      },
      animated: {
        true: 'animate-pulse',
        false: '',
      },
    },
    defaultVariants: {
      type: 'dependency',
      interactive: true,
      selected: false,
      animated: false,
    },
  }
);

interface GraphEdgeProps extends VariantProps<typeof edgeVariants> {
  edge: GraphEdgeType;
  sourceNode: GraphNode;
  targetNode: GraphNode;
  isSelected?: boolean;
  isHovered?: boolean;
  isAnimated?: boolean;
  scale?: number;
  onMouseEnter?: (event: React.MouseEvent) => void;
  onMouseLeave?: (event: React.MouseEvent) => void;
  onClick?: (event: React.MouseEvent) => void;
  onDoubleClick?: (event: React.MouseEvent) => void;
  className?: string;
  showArrows?: boolean;
  showLabels?: boolean;
  showTooltip?: boolean;
}

const GraphEdge = memo<GraphEdgeProps>(({
  edge,
  sourceNode,
  targetNode,
  isSelected = false,
  isHovered = false,
  isAnimated = false,
  scale = 1,
  onMouseEnter,
  onMouseLeave,
  onClick,
  onDoubleClick,
  className,
  showArrows = true,
  showLabels = true,
  showTooltip = true,
}) => {
  const getEdgeColor = useCallback(() => {
    if (isSelected) return '#3b82f6';
    if (isHovered) return '#1d4ed8';
    return EDGE_COLORS[edge.type];
  }, [edge.type, isSelected, isHovered]);

  const getEdgeWidth = useCallback(() => {
    const baseWidth = GRAPH_CONSTANTS.EDGE_WIDTH;
    const strengthMultiplier = edge.strength || 1;
    let width = baseWidth * strengthMultiplier;
    
    if (isSelected) width += 2;
    if (isHovered) width += 1;
    
    return width * scale;
  }, [edge.strength, isSelected, isHovered, scale]);

  const getEdgeOpacity = useCallback(() => {
    if (isSelected) return 1;
    if (isHovered) return 0.8;
    return 0.6;
  }, [isSelected, isHovered]);

  // Icon mapping for different edge types
  const getEdgeIcon = useCallback(() => {
    switch (edge.type) {
      case 'dependency':
        return ArrowRight;
      case 'blocks':
        return Ban;
      case 'related':
        return Link;
      default:
        return ArrowRight;
    }
  }, [edge.type]);

  // Get the icon component
  const IconComponent = getEdgeIcon();

  const pathData = useMemo(() => {
    const sourceRadius = Math.max(sourceNode.size.width, sourceNode.size.height) / 2;
    const targetRadius = Math.max(targetNode.size.width, targetNode.size.height) / 2;
    
    // Calculate intersection points with node boundaries
    const sourceIntersection = getCircleIntersection(
      sourceNode.position,
      sourceRadius,
      targetNode.position
    );
    
    const targetIntersection = getCircleIntersection(
      targetNode.position,
      targetRadius,
      sourceNode.position
    );

    const distance = calculateDistance(sourceIntersection, targetIntersection);
    const angle = calculateAngle(sourceIntersection, targetIntersection);

    // Create curved path if nodes are close
    if (distance < 100) {
      const midX = (sourceIntersection.x + targetIntersection.x) / 2;
      const midY = (sourceIntersection.y + targetIntersection.y) / 2;
      const curveOffset = 20;
      const controlX = midX + Math.cos(angle + Math.PI / 2) * curveOffset;
      const controlY = midY + Math.sin(angle + Math.PI / 2) * curveOffset;
      
      return `M ${sourceIntersection.x} ${sourceIntersection.y} Q ${controlX} ${controlY} ${targetIntersection.x} ${targetIntersection.y}`;
    }

    // Straight line for distant nodes
    return `M ${sourceIntersection.x} ${sourceIntersection.y} L ${targetIntersection.x} ${targetIntersection.y}`;
  }, [sourceNode, targetNode]);

  const arrowData = useMemo(() => {
    if (!showArrows) return null;

    const targetRadius = Math.max(targetNode.size.width, targetNode.size.height) / 2;
    
    const targetIntersection = getCircleIntersection(
      targetNode.position,
      targetRadius,
      sourceNode.position
    );

    const angle = calculateAngle(sourceNode.position, targetNode.position);
    const arrowSize = 8 * scale;
    const arrowAngle = Math.PI / 6;

    const arrowPoint1 = {
      x: targetIntersection.x - Math.cos(angle - arrowAngle) * arrowSize,
      y: targetIntersection.y - Math.sin(angle - arrowAngle) * arrowSize,
    };

    const arrowPoint2 = {
      x: targetIntersection.x - Math.cos(angle + arrowAngle) * arrowSize,
      y: targetIntersection.y - Math.sin(angle + arrowAngle) * arrowSize,
    };

    return `M ${targetIntersection.x} ${targetIntersection.y} L ${arrowPoint1.x} ${arrowPoint1.y} M ${targetIntersection.x} ${targetIntersection.y} L ${arrowPoint2.x} ${arrowPoint2.y}`;
  }, [sourceNode, targetNode, showArrows, scale]);

  const labelPosition = useMemo(() => {
    const midX = (sourceNode.position.x + targetNode.position.x) / 2;
    const midY = (sourceNode.position.y + targetNode.position.y) / 2;
    const angle = calculateAngle(sourceNode.position, targetNode.position);
    
    // Offset label to avoid overlapping with edge
    const offset = 20;
    const labelX = midX + Math.cos(angle + Math.PI / 2) * offset;
    const labelY = midY + Math.sin(angle + Math.PI / 2) * offset;
    
    return { x: labelX, y: labelY };
  }, [sourceNode, targetNode]);

  return (
    <g
      className={cn(
        edgeVariants({
          type: edge.type,
          interactive: true,
          selected: isSelected,
          animated: isAnimated,
        }),
        className
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      data-edge-id={edge.id}
      data-testid={`graph-edge-${edge.id}`}
    >
      {/* Main edge path */}
      <path
        d={pathData}
        fill="none"
        stroke={getEdgeColor()}
        strokeWidth={getEdgeWidth()}
        strokeOpacity={getEdgeOpacity()}
        strokeDasharray={edge.type === 'related' ? '5,5' : undefined}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Arrow marker */}
      {showArrows && arrowData && (
        <path
          d={arrowData}
          fill="none"
          stroke={getEdgeColor()}
          strokeWidth={getEdgeWidth()}
          strokeOpacity={getEdgeOpacity()}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Invisible wider path for better interaction */}
      <path
        d={pathData}
        fill="none"
        stroke="transparent"
        strokeWidth={Math.max(getEdgeWidth() * 3, 10)}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ pointerEvents: 'stroke' }}
      />

      {/* Edge label */}
      {showLabels && edge.label && (
        <g>
          <text
            x={labelPosition.x}
            y={labelPosition.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={12 * scale}
            fill={getEdgeColor()}
            className="pointer-events-none select-none"
          >
            {edge.label}
          </text>
          {/* Edge type icon */}
          <foreignObject
            x={labelPosition.x + 20}
            y={labelPosition.y - 8}
            width={16}
            height={16}
            className="pointer-events-none"
          >
            <IconComponent className="w-4 h-4" style={{ color: getEdgeColor() }} />
          </foreignObject>
        </g>
      )}

      {/* Selection indicator */}
      {isSelected && (
        <path
          d={pathData}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={getEdgeWidth() + 4}
          strokeOpacity={0.3}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-pulse"
        />
      )}

      {/* Hover tooltip */}
      {showTooltip && isHovered && (
        <foreignObject
          x={labelPosition.x - 60}
          y={labelPosition.y - 30}
          width="120"
          height="60"
          className="pointer-events-none"
        >
          <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 text-center">
            <div className="font-semibold capitalize">{edge.type}</div>
            {edge.label && <div className="text-gray-300">{edge.label}</div>}
            {edge.strength && (
              <div className="text-gray-300">
                Strength: {Math.round(edge.strength * 100)}%
              </div>
            )}
          </div>
        </foreignObject>
      )}

      {/* Animation flow */}
      {isAnimated && (
        <circle
          r={3}
          fill={getEdgeColor()}
          opacity={0.8}
        >
          <animateMotion
            dur="2s"
            repeatCount="indefinite"
            path={pathData}
          />
        </circle>
      )}
    </g>
  );
});

GraphEdge.displayName = 'GraphEdge';

export { GraphEdge, edgeVariants };
export type { GraphEdgeProps };