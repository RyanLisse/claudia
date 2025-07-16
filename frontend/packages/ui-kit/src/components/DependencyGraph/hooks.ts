import { useCallback, useEffect, useRef, useState } from 'react';
import type { 
  GraphData, 
  GraphNode, 
  GraphEdge, 
  GraphViewport, 
  GraphSelection, 
  GraphLayout,
  GraphFilter
} from './types';
import { 
  applyLayout, 
  filterNodes, 
  filterEdges, 
  calculateGraphBounds, 
  GRAPH_CONSTANTS,
  validateGraphData
} from './utils';

/**
 * Hook for managing graph data and interactions
 */
export function useGraphData(initialData: GraphData) {
  const [data, setData] = useState<GraphData>(initialData);
  const [filteredData, setFilteredData] = useState<GraphData>(initialData);
  const [selection, setSelection] = useState<GraphSelection>({ nodes: [], edges: [] });
  const [filter, setFilter] = useState<GraphFilter>({});

  // Update filtered data when data or filter changes
  useEffect(() => {
    const filtered = {
      ...data,
      nodes: filterNodes(data.nodes, filter),
      edges: filterEdges(data.edges, filterNodes(data.nodes, filter)),
    };
    setFilteredData(filtered);
  }, [data, filter]);

  const updateNode = useCallback((nodeId: string, updates: Partial<GraphNode>) => {
    setData(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => 
        node.id === nodeId ? { ...node, ...updates } : node
      ),
    }));
  }, []);

  const updateEdge = useCallback((edgeId: string, updates: Partial<GraphEdge>) => {
    setData(prev => ({
      ...prev,
      edges: prev.edges.map(edge => 
        edge.id === edgeId ? { ...edge, ...updates } : edge
      ),
    }));
  }, []);

  const addNode = useCallback((node: GraphNode) => {
    setData(prev => ({
      ...prev,
      nodes: [...prev.nodes, node],
    }));
  }, []);

  const addEdge = useCallback((edge: GraphEdge) => {
    setData(prev => ({
      ...prev,
      edges: [...prev.edges, edge],
    }));
  }, []);

  const removeNode = useCallback((nodeId: string) => {
    setData(prev => ({
      ...prev,
      nodes: prev.nodes.filter(node => node.id !== nodeId),
      edges: prev.edges.filter(edge => 
        edge.source !== nodeId && edge.target !== nodeId
      ),
    }));
  }, []);

  const removeEdge = useCallback((edgeId: string) => {
    setData(prev => ({
      ...prev,
      edges: prev.edges.filter(edge => edge.id !== edgeId),
    }));
  }, []);

  const applyLayoutToData = useCallback((layout: GraphLayout) => {
    const updatedNodes = applyLayout(data.nodes, data.edges, layout);
    setData(prev => ({
      ...prev,
      nodes: updatedNodes,
      metadata: {
        ...prev.metadata,
        layout: layout.type,
        updatedAt: new Date().toISOString(),
      },
    }));
  }, [data.nodes, data.edges]);

  const selectNodes = useCallback((nodeIds: string[]) => {
    setSelection(prev => ({
      ...prev,
      nodes: nodeIds,
    }));
  }, []);

  const selectEdges = useCallback((edgeIds: string[]) => {
    setSelection(prev => ({
      ...prev,
      edges: edgeIds,
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setSelection({ nodes: [], edges: [] });
  }, []);

  const getNodeById = useCallback((id: string) => {
    return data.nodes.find(node => node.id === id);
  }, [data.nodes]);

  const getEdgeById = useCallback((id: string) => {
    return data.edges.find(edge => edge.id === id);
  }, [data.edges]);

  return {
    data,
    filteredData,
    selection,
    filter,
    setData,
    setFilter,
    updateNode,
    updateEdge,
    addNode,
    addEdge,
    removeNode,
    removeEdge,
    applyLayoutToData,
    selectNodes,
    selectEdges,
    clearSelection,
    getNodeById,
    getEdgeById,
  };
}

/**
 * Hook for managing graph viewport (zoom and pan)
 */
export function useGraphViewport(
  initialViewport: GraphViewport = {
    zoom: 1,
    pan: { x: 0, y: 0 },
    bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
  }
) {
  const [viewport, setViewport] = useState<GraphViewport>(initialViewport);

  const zoom = useCallback((factor: number, center?: { x: number; y: number }) => {
    setViewport(prev => {
      const newZoom = Math.max(
        GRAPH_CONSTANTS.ZOOM_MIN,
        Math.min(GRAPH_CONSTANTS.ZOOM_MAX, prev.zoom * factor)
      );

      if (center) {
        // Zoom toward a specific point
        const zoomRatio = newZoom / prev.zoom;
        const newPan = {
          x: prev.pan.x + (center.x - prev.pan.x) * (1 - zoomRatio),
          y: prev.pan.y + (center.y - prev.pan.y) * (1 - zoomRatio),
        };

        return {
          ...prev,
          zoom: newZoom,
          pan: newPan,
        };
      }

      return {
        ...prev,
        zoom: newZoom,
      };
    });
  }, []);

  const pan = useCallback((delta: { x: number; y: number }) => {
    setViewport(prev => ({
      ...prev,
      pan: {
        x: prev.pan.x + delta.x,
        y: prev.pan.y + delta.y,
      },
    }));
  }, []);

  const resetViewport = useCallback(() => {
    setViewport({
      zoom: 1,
      pan: { x: 0, y: 0 },
      bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
    });
  }, []);

  const fitToContent = useCallback((nodes: GraphNode[]) => {
    if (nodes.length === 0) return;

    const bounds = calculateGraphBounds(nodes);
    const padding = 50;
    
    // Calculate zoom to fit content
    const contentWidth = bounds.maxX - bounds.minX + padding * 2;
    const contentHeight = bounds.maxY - bounds.minY + padding * 2;
    
    // Assuming viewport size (this should be passed from component)
    const viewportWidth = 800;
    const viewportHeight = 600;
    
    const zoomX = viewportWidth / contentWidth;
    const zoomY = viewportHeight / contentHeight;
    const newZoom = Math.min(zoomX, zoomY, GRAPH_CONSTANTS.ZOOM_MAX);
    
    // Calculate pan to center content
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    
    setViewport({
      zoom: newZoom,
      pan: {
        x: -centerX * newZoom,
        y: -centerY * newZoom,
      },
      bounds,
    });
  }, []);

  const screenToWorld = useCallback((screenPoint: { x: number; y: number }) => {
    return {
      x: (screenPoint.x - viewport.pan.x) / viewport.zoom,
      y: (screenPoint.y - viewport.pan.y) / viewport.zoom,
    };
  }, [viewport]);

  const worldToScreen = useCallback((worldPoint: { x: number; y: number }) => {
    return {
      x: worldPoint.x * viewport.zoom + viewport.pan.x,
      y: worldPoint.y * viewport.zoom + viewport.pan.y,
    };
  }, [viewport]);

  return {
    viewport,
    setViewport,
    zoom,
    pan,
    resetViewport,
    fitToContent,
    screenToWorld,
    worldToScreen,
  };
}

/**
 * Hook for managing graph interactions (drag, hover, click)
 */
export function useGraphInteractions(
  onNodeClick?: (node: GraphNode) => void,
  onNodeHover?: (node: GraphNode | null) => void,
  onNodeDrag?: (node: GraphNode, newPosition: { x: number; y: number }) => void,
  onEdgeClick?: (edge: GraphEdge) => void
) {
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    draggedNode: GraphNode | null;
    dragOffset: { x: number; y: number };
  }>({
    isDragging: false,
    draggedNode: null,
    dragOffset: { x: 0, y: 0 },
  });

  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<GraphEdge | null>(null);

  const handleNodeMouseDown = useCallback((node: GraphNode, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const offsetX = event.clientX - rect.left - rect.width / 2;
    const offsetY = event.clientY - rect.top - rect.height / 2;

    setDragState({
      isDragging: true,
      draggedNode: node,
      dragOffset: { x: offsetX, y: offsetY },
    });
  }, []);

  const handleNodeMouseMove = useCallback((event: React.MouseEvent) => {
    if (!dragState.isDragging || !dragState.draggedNode) return;

    event.preventDefault();
    event.stopPropagation();

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const newPosition = {
      x: event.clientX - rect.left - dragState.dragOffset.x,
      y: event.clientY - rect.top - dragState.dragOffset.y,
    };

    onNodeDrag?.(dragState.draggedNode, newPosition);
  }, [dragState, onNodeDrag]);

  const handleNodeMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedNode: null,
      dragOffset: { x: 0, y: 0 },
    });
  }, []);

  const handleNodeClick = useCallback((node: GraphNode, event: React.MouseEvent) => {
    if (dragState.isDragging) return;
    
    event.preventDefault();
    event.stopPropagation();
    onNodeClick?.(node);
  }, [dragState.isDragging, onNodeClick]);

  const handleNodeHover = useCallback((node: GraphNode | null) => {
    setHoveredNode(node);
    onNodeHover?.(node);
  }, [onNodeHover]);

  const handleEdgeClick = useCallback((edge: GraphEdge, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onEdgeClick?.(edge);
  }, [onEdgeClick]);

  const handleEdgeHover = useCallback((edge: GraphEdge | null) => {
    setHoveredEdge(edge);
  }, []);

  return {
    dragState,
    hoveredNode,
    hoveredEdge,
    handleNodeMouseDown,
    handleNodeMouseMove,
    handleNodeMouseUp,
    handleNodeClick,
    handleNodeHover,
    handleEdgeClick,
    handleEdgeHover,
  };
}

/**
 * Hook for managing graph animations
 */
export function useGraphAnimations(enabled = true) {
  const [animatingNodes, setAnimatingNodes] = useState<Set<string>>(new Set());
  const [animatingEdges, setAnimatingEdges] = useState<Set<string>>(new Set());

  const animateNode = useCallback((
    nodeId: string,
    duration = GRAPH_CONSTANTS.ANIMATION_DURATION,
    onComplete?: () => void
  ) => {
    if (!enabled) {
      onComplete?.();
      return;
    }

    setAnimatingNodes(prev => new Set(prev).add(nodeId));

    setTimeout(() => {
      setAnimatingNodes(prev => {
        const next = new Set(prev);
        next.delete(nodeId);
        return next;
      });
      onComplete?.();
    }, duration);
  }, [enabled]);

  const animateEdge = useCallback((
    edgeId: string,
    duration = GRAPH_CONSTANTS.ANIMATION_DURATION,
    onComplete?: () => void
  ) => {
    if (!enabled) {
      onComplete?.();
      return;
    }

    setAnimatingEdges(prev => new Set(prev).add(edgeId));

    setTimeout(() => {
      setAnimatingEdges(prev => {
        const next = new Set(prev);
        next.delete(edgeId);
        return next;
      });
      onComplete?.();
    }, duration);
  }, [enabled]);

  const isNodeAnimating = useCallback((nodeId: string) => {
    return animatingNodes.has(nodeId);
  }, [animatingNodes]);

  const isEdgeAnimating = useCallback((edgeId: string) => {
    return animatingEdges.has(edgeId);
  }, [animatingEdges]);

  return {
    animateNode,
    animateEdge,
    isNodeAnimating,
    isEdgeAnimating,
  };
}

/**
 * Hook for managing graph performance optimization
 */
export function useGraphPerformance(data: GraphData) {
  const [visibleNodes, setVisibleNodes] = useState<GraphNode[]>([]);
  const [visibleEdges, setVisibleEdges] = useState<GraphEdge[]>([]);
  const lastRenderTime = useRef<number>(0);

  const updateVisibleElements = useCallback((viewport: GraphViewport) => {
    const now = performance.now();
    
    // Throttle updates to 60fps
    if (now - lastRenderTime.current < 16) {
      return;
    }
    
    lastRenderTime.current = now;

    // Calculate visible bounds with padding
    const padding = 100;
    const visibleBounds = {
      minX: (-viewport.pan.x - padding) / viewport.zoom,
      minY: (-viewport.pan.y - padding) / viewport.zoom,
      maxX: (-viewport.pan.x + 800 + padding) / viewport.zoom,
      maxY: (-viewport.pan.y + 600 + padding) / viewport.zoom,
    };

    // Filter nodes within visible bounds
    const visible = data.nodes.filter(node => {
      const { x, y } = node.position;
      return (
        x >= visibleBounds.minX &&
        x <= visibleBounds.maxX &&
        y >= visibleBounds.minY &&
        y <= visibleBounds.maxY
      );
    });

    setVisibleNodes(visible);

    // Filter edges connected to visible nodes
    const visibleNodeIds = new Set(visible.map(node => node.id));
    const visibleEdgesList = data.edges.filter(edge =>
      visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
    );

    setVisibleEdges(visibleEdgesList);
  }, [data]);

  return {
    visibleNodes,
    visibleEdges,
    updateVisibleElements,
  };
}

/**
 * Hook for managing graph export/import
 */
export function useGraphExport(data: GraphData) {
  const exportData = useCallback((format: 'json' | 'svg' | 'png' = 'json') => {
    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'svg':
        // Would need SVG generation logic
        return '<svg>...</svg>';
      case 'png':
        // Would need canvas rendering logic
        return new Blob([''], { type: 'image/png' });
      default:
        return JSON.stringify(data, null, 2);
    }
  }, [data]);

  const importData = useCallback((
    input: string | File,
    options: { validate?: boolean } = {}
  ): Promise<GraphData> => {
    return new Promise((resolve, reject) => {
      if (typeof input === 'string') {
        try {
          const parsed = JSON.parse(input) as GraphData;
          
          if (options.validate && !validateGraphData(parsed)) {
            reject(new Error('Invalid graph data structure'));
            return;
          }
          
          resolve(parsed);
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`));
        }
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const parsed = JSON.parse(e.target?.result as string) as GraphData;
            
            if (options.validate && !validateGraphData(parsed)) {
              reject(new Error('Invalid graph data structure'));
              return;
            }
            
            resolve(parsed);
          } catch (error) {
            reject(new Error(`Failed to parse file: ${error instanceof Error ? error.message : String(error)}`));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(input);
      }
    });
  }, []);

  const downloadAs = useCallback((format: 'json' | 'svg' | 'png' = 'json') => {
    const content = exportData(format);
    const blob = new Blob([content], { 
      type: format === 'json' ? 'application/json' : 'image/svg+xml' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `graph-${Date.now()}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportData]);

  return {
    exportData,
    importData,
    downloadAs,
  };
}

/**
 * Hook for managing graph keyboard shortcuts
 */
export function useGraphKeyboard(
  onZoomIn?: () => void,
  onZoomOut?: () => void,
  onResetZoom?: () => void,
  onFitToContent?: () => void,
  onDelete?: () => void,
  onSelectAll?: () => void,
  onCopy?: () => void,
  onPaste?: () => void
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { key, ctrlKey, metaKey } = event;
      const isModifierPressed = ctrlKey || metaKey;

      switch (key) {
        case '+':
        case '=':
          if (isModifierPressed) {
            event.preventDefault();
            onZoomIn?.();
          }
          break;
        case '-':
          if (isModifierPressed) {
            event.preventDefault();
            onZoomOut?.();
          }
          break;
        case '0':
          if (isModifierPressed) {
            event.preventDefault();
            onResetZoom?.();
          }
          break;
        case 'f':
          if (isModifierPressed) {
            event.preventDefault();
            onFitToContent?.();
          }
          break;
        case 'Delete':
        case 'Backspace':
          if (!isModifierPressed) {
            event.preventDefault();
            onDelete?.();
          }
          break;
        case 'a':
          if (isModifierPressed) {
            event.preventDefault();
            onSelectAll?.();
          }
          break;
        case 'c':
          if (isModifierPressed) {
            event.preventDefault();
            onCopy?.();
          }
          break;
        case 'v':
          if (isModifierPressed) {
            event.preventDefault();
            onPaste?.();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onZoomIn, onZoomOut, onResetZoom, onFitToContent, onDelete, onSelectAll, onCopy, onPaste]);
}