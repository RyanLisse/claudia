import React, { memo, useCallback, useMemo } from 'react';
import { Card } from '../Card/Card';
import { cn } from '../../utils';
import type { GraphNode, GraphEdge, GraphViewport } from './types';
import { calculateGraphBounds, NODE_COLORS, EDGE_COLORS } from './utils';

interface GraphMinimapProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  viewport: GraphViewport;
  width?: number;
  height?: number;
  onViewportChange: (viewport: GraphViewport) => void;
  className?: string;
}

const GraphMinimap = memo<GraphMinimapProps>(({
  nodes,
  edges,
  viewport,
  width = 200,
  height = 150,
  onViewportChange,
  className,
}) => {
  const bounds = useMemo(() => {
    if (nodes.length === 0) {
      return { minX: 0, minY: 0, maxX: 100, maxY: 100 };
    }
    
    const graphBounds = calculateGraphBounds(nodes);
    const padding = 20;
    
    return {
      minX: graphBounds.minX - padding,
      minY: graphBounds.minY - padding,
      maxX: graphBounds.maxX + padding,
      maxY: graphBounds.maxY + padding,
    };
  }, [nodes]);

  const scale = useMemo(() => {
    const boundsWidth = bounds.maxX - bounds.minX;
    const boundsHeight = bounds.maxY - bounds.minY;
    
    if (boundsWidth === 0 || boundsHeight === 0) {
      return { x: 1, y: 1 };
    }
    
    return {
      x: width / boundsWidth,
      y: height / boundsHeight,
    };
  }, [bounds, width, height]);

  const transformPoint = useCallback((point: { x: number; y: number }) => {
    return {
      x: (point.x - bounds.minX) * scale.x,
      y: (point.y - bounds.minY) * scale.y,
    };
  }, [bounds, scale]);

  const viewportRect = useMemo(() => {
    const viewportWidth = 800 / viewport.zoom; // Assuming main viewport is 800px wide
    const viewportHeight = 600 / viewport.zoom; // Assuming main viewport is 600px tall
    
    const topLeft = transformPoint({
      x: -viewport.pan.x / viewport.zoom,
      y: -viewport.pan.y / viewport.zoom,
    });
    
    const bottomRight = transformPoint({
      x: (-viewport.pan.x + viewportWidth) / viewport.zoom,
      y: (-viewport.pan.y + viewportHeight) / viewport.zoom,
    });
    
    return {
      x: Math.max(0, Math.min(width, topLeft.x)),
      y: Math.max(0, Math.min(height, topLeft.y)),
      width: Math.max(0, Math.min(width - topLeft.x, bottomRight.x - topLeft.x)),
      height: Math.max(0, Math.min(height - topLeft.y, bottomRight.y - topLeft.y)),
    };
  }, [viewport, transformPoint, width, height]);

  const handleMinimapClick = useCallback((event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    // Convert minimap click to world coordinates
    const worldX = bounds.minX + (clickX / scale.x);
    const worldY = bounds.minY + (clickY / scale.y);
    
    // Center the viewport on the clicked point
    const viewportWidth = 800; // Assuming main viewport is 800px wide
    const viewportHeight = 600; // Assuming main viewport is 600px tall
    
    const newPan = {
      x: -(worldX * viewport.zoom - viewportWidth / 2),
      y: -(worldY * viewport.zoom - viewportHeight / 2),
    };
    
    onViewportChange({
      ...viewport,
      pan: newPan,
    });
  }, [bounds, scale, viewport, onViewportChange]);

  const handleViewportDrag = useCallback((event: React.MouseEvent) => {
    if (event.buttons !== 1) return; // Only handle left mouse button
    
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    // Convert minimap coordinates to world coordinates
    const worldX = bounds.minX + (clickX / scale.x);
    const worldY = bounds.minY + (clickY / scale.y);
    
    // Update viewport pan
    const viewportWidth = 800;
    const viewportHeight = 600;
    
    const newPan = {
      x: -(worldX * viewport.zoom - viewportWidth / 2),
      y: -(worldY * viewport.zoom - viewportHeight / 2),
    };
    
    onViewportChange({
      ...viewport,
      pan: newPan,
    });
  }, [bounds, scale, viewport, onViewportChange]);

  if (nodes.length === 0) {
    return (
      <Card className={cn('absolute bottom-4 right-4 z-10 p-4 bg-white/95 backdrop-blur-sm', className)}>
        <div 
          className="flex items-center justify-center text-gray-500 text-sm"
          style={{ width, height }}
        >
          No nodes to display
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('absolute bottom-4 right-4 z-10 p-2 bg-white/95 backdrop-blur-sm', className)}>
      <div className="relative">
        <div className="text-xs font-medium text-gray-700 mb-2">Overview</div>
        
        <svg
          width={width}
          height={height}
          className="border border-gray-200 rounded cursor-pointer"
          onClick={handleMinimapClick}
          onMouseMove={handleViewportDrag}
          onMouseDown={handleViewportDrag}
          role="img"
          aria-label="Graph minimap"
        >
          {/* Background */}
          <rect width={width} height={height} fill="white" />
          
          {/* Grid lines */}
          <defs>
            <pattern id="minimap-grid" width={20} height={20} patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth={1} />
            </pattern>
          </defs>
          <rect width={width} height={height} fill="url(#minimap-grid)" />
          
          {/* Edges */}
          {edges.map((edge) => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);
            
            if (!sourceNode || !targetNode) return null;
            
            const sourcePoint = transformPoint(sourceNode.position);
            const targetPoint = transformPoint(targetNode.position);
            
            return (
              <line
                key={edge.id}
                x1={sourcePoint.x}
                y1={sourcePoint.y}
                x2={targetPoint.x}
                y2={targetPoint.y}
                stroke={EDGE_COLORS[edge.type] || '#6b7280'}
                strokeWidth={1}
                strokeOpacity={0.6}
              />
            );
          })}
          
          {/* Nodes */}
          {nodes.map((node) => {
            const point = transformPoint(node.position);
            const radius = Math.max(2, Math.min(6, node.size.width * scale.x / 10));
            
            return (
              <circle
                key={node.id}
                cx={point.x}
                cy={point.y}
                r={radius}
                fill={NODE_COLORS[node.type] || '#3b82f6'}
                stroke="white"
                strokeWidth={0.5}
                opacity={0.8}
              />
            );
          })}
          
          {/* Viewport rectangle */}
          <rect
            x={viewportRect.x}
            y={viewportRect.y}
            width={viewportRect.width}
            height={viewportRect.height}
            fill="rgba(59, 130, 246, 0.1)"
            stroke="#3b82f6"
            strokeWidth={1}
            strokeDasharray="2,2"
            rx={2}
            ry={2}
          />
        </svg>
        
        {/* Minimap controls */}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>{nodes.length} nodes</span>
          <span>{edges.length} edges</span>
        </div>
      </div>
    </Card>
  );
});

GraphMinimap.displayName = 'GraphMinimap';

export { GraphMinimap };
export type { GraphMinimapProps };