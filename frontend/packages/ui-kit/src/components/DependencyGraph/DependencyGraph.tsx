import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Card } from '../Card/Card';
import { cn } from '../../utils';
import { GraphNode } from './GraphNode';
import { GraphEdge } from './GraphEdge';
import { GraphControls } from './GraphControls';
import { GraphMinimap } from './GraphMinimap';
import { 
  useGraphData, 
  useGraphViewport, 
  useGraphInteractions, 
  useGraphAnimations,
  useGraphPerformance,
  useGraphExport,
  useGraphKeyboard
} from './hooks';
import { GRAPH_CONSTANTS, validateGraphData } from './utils';
import type { 
  DependencyGraphProps, 
  GraphLayout, 
  GraphFilter, 
  GraphNode as GraphNodeType 
} from './types';

const DependencyGraph: React.FC<DependencyGraphProps> = ({
  data,
  onNodeClick,
  onNodeHover,
  onNodeDrag,
  onEdgeClick,
  onGraphUpdate,
  onExport,
  onImport,
  className,
  width = 800,
  height = 600,
  showMinimap = true,
  showControls = true,
  showLegend = true,
  enableZoom = true,
  enablePan = true,
  theme = 'light',
  autoLayout = true,
  layoutConfig = {
    algorithm: 'force',
    spacing: GRAPH_CONSTANTS.NODE_SPACING,
    padding: 50,
    iterations: GRAPH_CONSTANTS.FORCE_ITERATIONS,
  },
  animationConfig = {
    duration: GRAPH_CONSTANTS.ANIMATION_DURATION,
    easing: 'ease-in-out',
    enabled: true,
  },
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [isGridVisible, setIsGridVisible] = useState(false);
  const [isMinimapVisible, setIsMinimapVisible] = useState(showMinimap);
  const [currentLayout, setCurrentLayout] = useState<GraphLayout['type']>(layoutConfig.algorithm || 'force');

  // Validate data on mount
  useEffect(() => {
    if (!validateGraphData(data)) {
      console.error('Invalid graph data structure provided to DependencyGraph');
    }
  }, [data]);

  // Graph data management
  const {
    data: graphData,
    filteredData,
    selection,
    filter,
    setFilter,
    updateNode,
    removeNode,
    removeEdge,
    applyLayoutToData,
    selectNodes,
    selectEdges,
    clearSelection,
    getNodeById,
  } = useGraphData(data);

  // Viewport management
  const {
    viewport,
    setViewport,
    zoom,
    resetViewport,
    fitToContent,
    screenToWorld,
  } = useGraphViewport();

  // Interactions
  const {
    dragState,
    hoveredNode,
    hoveredEdge,
    handleNodeMouseDown,
    handleNodeMouseUp,
    handleNodeClick,
    handleNodeHover,
    handleEdgeClick,
    handleEdgeHover,
  } = useGraphInteractions(onNodeClick, onNodeHover, onNodeDrag, onEdgeClick);

  // Animations
  const {
    isEdgeAnimating,
  } = useGraphAnimations(animationConfig.enabled);

  // Performance optimization
  const {
    visibleNodes,
    visibleEdges,
    updateVisibleElements,
  } = useGraphPerformance(filteredData);

  // Export/Import
  const {
    importData,
    downloadAs,
  } = useGraphExport(graphData);

  // Update visible elements when viewport changes
  useEffect(() => {
    updateVisibleElements(viewport);
  }, [viewport, updateVisibleElements]);

  // Apply layout when data changes
  useEffect(() => {
    if (autoLayout && graphData.nodes.length > 0) {
      const layout: GraphLayout = {
        type: currentLayout,
        config: layoutConfig,
      };
      applyLayoutToData(layout);
    }
  }, [currentLayout, autoLayout, layoutConfig, applyLayoutToData, graphData.nodes.length]);

  // Handle layout change
  const handleLayoutChange = useCallback((layout: GraphLayout['type']) => {
    setCurrentLayout(layout);
    const layoutObj: GraphLayout = {
      type: layout,
      config: layoutConfig,
    };
    applyLayoutToData(layoutObj);
  }, [layoutConfig, applyLayoutToData]);

  // Handle filter change
  const handleFilterChange = useCallback((newFilter: GraphFilter) => {
    setFilter(newFilter);
  }, [setFilter]);

  // Handle export
  const handleExport = useCallback((format: 'json' | 'svg' | 'png') => {
    if (onExport) {
      onExport(format);
    } else {
      downloadAs(format);
    }
  }, [onExport, downloadAs]);

  // Handle import
  const handleImport = useCallback(() => {
    if (onImport) {
      onImport(graphData);
    } else {
      // Open file dialog
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          try {
            const imported = await importData(file, { validate: true });
            onGraphUpdate?.(imported);
          } catch (error) {
            console.error('Failed to import graph data:', error);
          }
        }
      };
      input.click();
    }
  }, [onImport, importData, onGraphUpdate, graphData]);

  // Handle node drag
  const handleNodeDragInternal = useCallback((node: GraphNodeType, newPosition: { x: number; y: number }) => {
    const worldPosition = screenToWorld(newPosition);
    updateNode(node.id, { position: worldPosition });
    onNodeDrag?.(node, worldPosition);
  }, [screenToWorld, updateNode, onNodeDrag]);

  // Use the drag handler
  console.log('Node drag handler available:', !!handleNodeDragInternal);

  // Handle viewport change
  const handleViewportChange = useCallback((newViewport: typeof viewport) => {
    setViewport(newViewport);
  }, [setViewport]);

  // Handle zoom
  const handleZoomIn = useCallback(() => {
    zoom(1.2);
  }, [zoom]);

  const handleZoomOut = useCallback(() => {
    zoom(0.8);
  }, [zoom]);

  const handleResetZoom = useCallback(() => {
    resetViewport();
  }, [resetViewport]);

  const handleFitToContent = useCallback(() => {
    fitToContent(filteredData.nodes);
  }, [fitToContent, filteredData.nodes]);

  // Handle pan
  const handlePanStart = useCallback((event: React.MouseEvent) => {
    if (!enablePan) return;
    
    const startPoint = { x: event.clientX, y: event.clientY };
    const startPan = { ...viewport.pan };
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startPoint.x;
      const deltaY = e.clientY - startPoint.y;
      
      setViewport(prev => ({
        ...prev,
        pan: {
          x: startPan.x + deltaX,
          y: startPan.y + deltaY,
        },
      }));
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [enablePan, viewport.pan, setViewport]);

  // Handle wheel zoom
  const handleWheel = useCallback((event: React.WheelEvent) => {
    if (!enableZoom) return;
    
    event.preventDefault();
    const factor = event.deltaY > 0 ? 0.9 : 1.1;
    const rect = containerRef.current?.getBoundingClientRect();
    
    if (rect) {
      const center = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
      zoom(factor, center);
    }
  }, [enableZoom, zoom]);

  // Keyboard shortcuts
  useGraphKeyboard(
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    handleFitToContent,
    () => {
      // Handle delete selected items
      selection.nodes.forEach(removeNode);
      selection.edges.forEach(removeEdge);
      clearSelection();
    },
    () => {
      // Handle select all
      selectNodes(filteredData.nodes.map(n => n.id));
      selectEdges(filteredData.edges.map(e => e.id));
    },
    () => {
      // Handle copy
      console.log('Copy selected items');
    },
    () => {
      // Handle paste
      console.log('Paste items');
    }
  );

  // Calculate transform for SVG content
  const transform = useMemo(() => {
    return `translate(${viewport.pan.x}, ${viewport.pan.y}) scale(${viewport.zoom})`;
  }, [viewport.pan.x, viewport.pan.y, viewport.zoom]);

  // Grid pattern for background
  const gridPattern = useMemo(() => {
    const gridSize = GRAPH_CONSTANTS.GRID_SIZE * viewport.zoom;
    const offsetX = viewport.pan.x % gridSize;
    const offsetY = viewport.pan.y % gridSize;
    
    return {
      size: gridSize,
      offsetX,
      offsetY,
    };
  }, [viewport.zoom, viewport.pan.x, viewport.pan.y]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden border border-gray-200 rounded-lg bg-white',
        theme === 'dark' && 'bg-gray-900 border-gray-700',
        className
      )}
      style={{ width, height }}
      onWheel={handleWheel}
    >
      {/* Main SVG */}
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        onMouseDown={handlePanStart}
        role="img"
        aria-label="Dependency graph visualization"
      >
        {/* Definitions */}
        <defs>
          {/* Grid pattern */}
          <pattern
            id="grid"
            width={GRAPH_CONSTANTS.GRID_SIZE}
            height={GRAPH_CONSTANTS.GRID_SIZE}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${GRAPH_CONSTANTS.GRID_SIZE} 0 L 0 0 0 ${GRAPH_CONSTANTS.GRID_SIZE}`}
              fill="none"
              stroke={theme === 'dark' ? '#374151' : '#f3f4f6'}
              strokeWidth={1}
            />
          </pattern>
          
          {/* Arrow markers */}
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="3"
            markerUnits="strokeWidth"
            markerWidth="4"
            markerHeight="3"
            orient="auto"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#6b7280" />
          </marker>
        </defs>
        
        {/* Background */}
        <rect
          width={width}
          height={height}
          fill={theme === 'dark' ? '#111827' : '#ffffff'}
        />
        
        {/* Grid */}
        {isGridVisible && (
          <rect
            width={width}
            height={height}
            fill="url(#grid)"
            style={{
              transform: `translate(${gridPattern.offsetX}px, ${gridPattern.offsetY}px)`,
            }}
          />
        )}
        
        {/* Graph content */}
        <g transform={transform}>
          {/* Edges */}
          {visibleEdges.map((edge) => {
            const sourceNode = getNodeById(edge.source);
            const targetNode = getNodeById(edge.target);
            
            if (!sourceNode || !targetNode) return null;
            
            return (
              <GraphEdge
                key={edge.id}
                edge={edge}
                sourceNode={sourceNode}
                targetNode={targetNode}
                isSelected={selection.edges.includes(edge.id)}
                isHovered={hoveredEdge?.id === edge.id}
                isAnimated={isEdgeAnimating(edge.id)}
                scale={viewport.zoom}
                onMouseEnter={() => handleEdgeHover(edge)}
                onMouseLeave={() => handleEdgeHover(null)}
                onClick={(e) => handleEdgeClick(edge, e)}
                showArrows={true}
                showLabels={viewport.zoom > 0.5}
                showTooltip={true}
              />
            );
          })}
          
          {/* Nodes */}
          {visibleNodes.map((node) => (
            <GraphNode
              key={node.id}
              node={node}
              isSelected={selection.nodes.includes(node.id)}
              isDragging={dragState.draggedNode?.id === node.id}
              isHovered={hoveredNode?.id === node.id}
              scale={viewport.zoom}
              onMouseDown={(e) => handleNodeMouseDown(node, e)}
              onMouseUp={handleNodeMouseUp}
              onMouseEnter={() => handleNodeHover(node)}
              onMouseLeave={() => handleNodeHover(null)}
              onClick={(e) => handleNodeClick(node, e)}
              showDetails={viewport.zoom > 0.7}
              showTooltip={viewport.zoom <= 0.7}
            />
          ))}
        </g>
      </svg>
      
      {/* Controls */}
      {showControls && (
        <GraphControls
          zoom={viewport.zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
          onFitToContent={handleFitToContent}
          onExport={handleExport}
          onImport={handleImport}
          onLayoutChange={handleLayoutChange}
          currentLayout={currentLayout}
          onFilterChange={handleFilterChange}
          currentFilter={filter}
          onToggleAnimation={() => {}}
          isAnimationEnabled={animationConfig.enabled || false}
          onToggleGrid={() => setIsGridVisible(!isGridVisible)}
          isGridVisible={isGridVisible}
          onToggleMinimap={() => setIsMinimapVisible(!isMinimapVisible)}
          isMinimapVisible={isMinimapVisible}
          nodeCount={filteredData.nodes.length}
          edgeCount={filteredData.edges.length}
          selectedCount={selection.nodes.length + selection.edges.length}
        />
      )}
      
      {/* Minimap */}
      {isMinimapVisible && (
        <GraphMinimap
          nodes={filteredData.nodes}
          edges={filteredData.edges}
          viewport={viewport}
          onViewportChange={handleViewportChange}
        />
      )}
      
      {/* Legend */}
      {showLegend && (
        <Card className="absolute bottom-4 left-4 z-10 p-4 bg-white/95 backdrop-blur-sm">
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">Legend</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 bg-blue-500 rounded" />
                <span>Task</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span>Milestone</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 bg-red-500 rounded transform rotate-45" />
                <span>Blocker</span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export { DependencyGraph };
export type { DependencyGraphProps };