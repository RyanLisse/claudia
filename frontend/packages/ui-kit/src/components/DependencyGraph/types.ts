export interface GraphNode {
  id: string;
  label: string;
  type: 'task' | 'milestone' | 'blocker';
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  position: { x: number; y: number };
  size: { width: number; height: number };
  metadata?: {
    assignee?: string;
    dueDate?: string;
    description?: string;
    tags?: string[];
    estimatedHours?: number;
    actualHours?: number;
  };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'dependency' | 'blocks' | 'related';
  label?: string;
  strength?: number; // 0-1 for visual weight
  metadata?: {
    createdAt?: string;
    reason?: string;
  };
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata?: {
    layout?: 'force' | 'hierarchical' | 'circular' | 'grid';
    zoomLevel?: number;
    panPosition?: { x: number; y: number };
    version?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

export interface DependencyGraphProps {
  data: GraphData;
  onNodeClick?: (node: GraphNode) => void;
  onNodeHover?: (node: GraphNode | null) => void;
  onNodeDrag?: (node: GraphNode, newPosition: { x: number; y: number }) => void;
  onEdgeClick?: (edge: GraphEdge) => void;
  onGraphUpdate?: (data: GraphData) => void;
  onExport?: (format: 'json' | 'svg' | 'png') => void;
  onImport?: (data: GraphData) => void;
  className?: string;
  width?: number;
  height?: number;
  interactive?: boolean;
  showMinimap?: boolean;
  showControls?: boolean;
  showLegend?: boolean;
  enableZoom?: boolean;
  enablePan?: boolean;
  enableDrag?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  autoLayout?: boolean;
  layoutConfig?: {
    algorithm?: 'force' | 'hierarchical' | 'circular' | 'grid';
    spacing?: number;
    padding?: number;
    iterations?: number;
  };
  filterConfig?: {
    nodeTypes?: Array<'task' | 'milestone' | 'blocker'>;
    statuses?: Array<'pending' | 'in-progress' | 'completed' | 'blocked'>;
    priorities?: Array<'low' | 'medium' | 'high' | 'urgent'>;
    tags?: string[];
  };
  animationConfig?: {
    duration?: number;
    easing?: string;
    enabled?: boolean;
  };
}

export interface GraphViewport {
  zoom: number;
  pan: { x: number; y: number };
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
}

export interface GraphSelection {
  nodes: string[];
  edges: string[];
}

export interface GraphLayout {
  type: 'force' | 'hierarchical' | 'circular' | 'grid';
  config: {
    spacing?: number;
    padding?: number;
    iterations?: number;
    gravity?: number;
    repulsion?: number;
    attraction?: number;
  };
}

export interface GraphInteraction {
  type: 'node-click' | 'node-hover' | 'edge-click' | 'canvas-click' | 'selection';
  data: GraphNode | GraphEdge | { position: { x: number; y: number } };
  modifiers?: {
    shiftKey?: boolean;
    ctrlKey?: boolean;
    altKey?: boolean;
  };
}

export interface GraphExportOptions {
  format: 'json' | 'svg' | 'png' | 'pdf';
  quality?: number;
  width?: number;
  height?: number;
  background?: string;
  includeMetadata?: boolean;
}

export interface GraphImportOptions {
  validateSchema?: boolean;
  mergeStrategy?: 'replace' | 'merge' | 'append';
  preserveLayout?: boolean;
}

export interface GraphFilter {
  nodeTypes?: Array<'task' | 'milestone' | 'blocker'>;
  statuses?: Array<'pending' | 'in-progress' | 'completed' | 'blocked'>;
  priorities?: Array<'low' | 'medium' | 'high' | 'urgent'>;
  tags?: string[];
  search?: string;
  dateRange?: {
    from?: string;
    to?: string;
  };
}

export interface GraphAnimation {
  id: string;
  type: 'node-enter' | 'node-exit' | 'edge-enter' | 'edge-exit' | 'layout-change';
  duration: number;
  easing: string;
  delay?: number;
  onComplete?: () => void;
}

export interface GraphTheme {
  colors: {
    background: string;
    grid: string;
    nodes: {
      task: string;
      milestone: string;
      blocker: string;
    };
    edges: {
      dependency: string;
      blocks: string;
      related: string;
    };
    text: {
      primary: string;
      secondary: string;
    };
    status: {
      pending: string;
      'in-progress': string;
      completed: string;
      blocked: string;
    };
    priority: {
      low: string;
      medium: string;
      high: string;
      urgent: string;
    };
  };
  sizes: {
    nodeRadius: number;
    edgeWidth: number;
    fontSize: number;
    iconSize: number;
  };
  animations: {
    duration: number;
    easing: string;
  };
}