import type { GraphNode, GraphEdge, GraphData, GraphLayout, GraphFilter } from './types';

export const GRAPH_CONSTANTS = {
  NODE_RADIUS: 20,
  NODE_SPACING: 80,
  EDGE_WIDTH: 2,
  ZOOM_MIN: 0.1,
  ZOOM_MAX: 5,
  ZOOM_STEP: 0.1,
  ANIMATION_DURATION: 300,
  FORCE_ITERATIONS: 100,
  GRID_SIZE: 20,
} as const;

export const NODE_COLORS = {
  task: '#3b82f6',
  milestone: '#10b981',
  blocker: '#ef4444',
} as const;

export const STATUS_COLORS = {
  pending: '#6b7280',
  'in-progress': '#f59e0b',
  completed: '#10b981',
  blocked: '#ef4444',
} as const;

export const PRIORITY_COLORS = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#f97316',
  urgent: '#ef4444',
} as const;

export const EDGE_COLORS = {
  dependency: '#6b7280',
  blocks: '#ef4444',
  related: '#8b5cf6',
} as const;

/**
 * Calculate the distance between two points
 */
export function calculateDistance(
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate the angle between two points
 */
export function calculateAngle(
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.atan2(dy, dx);
}

/**
 * Get the intersection point of a line and a circle
 */
export function getCircleIntersection(
  center: { x: number; y: number },
  radius: number,
  point: { x: number; y: number }
): { x: number; y: number } {
  const angle = calculateAngle(center, point);
  return {
    x: center.x + Math.cos(angle) * radius,
    y: center.y + Math.sin(angle) * radius,
  };
}

/**
 * Generate a unique ID for nodes and edges
 */
export function generateGraphId(prefix = 'item'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate graph data structure
 */
export function validateGraphData(data: GraphData): boolean {
  if (!data.nodes || !Array.isArray(data.nodes)) return false;
  if (!data.edges || !Array.isArray(data.edges)) return false;

  // Check for duplicate node IDs
  const nodeIds = new Set();
  for (const node of data.nodes) {
    if (!node.id || nodeIds.has(node.id)) return false;
    nodeIds.add(node.id);
  }

  // Check for valid edge references
  for (const edge of data.edges) {
    if (!edge.id || !edge.source || !edge.target) return false;
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) return false;
  }

  return true;
}

/**
 * Force-directed layout algorithm
 */
export function applyForceLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  config: { 
    iterations?: number;
    gravity?: number;
    repulsion?: number;
    attraction?: number;
    spacing?: number;
  } = {}
): GraphNode[] {
  const {
    iterations = GRAPH_CONSTANTS.FORCE_ITERATIONS,
    gravity = 0.1,
    repulsion = 100,
    attraction = 0.1,
    spacing = GRAPH_CONSTANTS.NODE_SPACING,
  } = config;

  const updatedNodes = nodes.map(node => ({ ...node }));
  const center = { x: 0, y: 0 };

  for (let i = 0; i < iterations; i++) {
    // Calculate repulsion forces
    for (let j = 0; j < updatedNodes.length; j++) {
      const node1 = updatedNodes[j];
      if (!node1) continue;
      let fx = 0;
      let fy = 0;

      // Repulsion from other nodes
      for (let k = 0; k < updatedNodes.length; k++) {
        if (j === k) continue;
        const node2 = updatedNodes[k];
        if (!node2) continue;
        const dx = node1.position.x - node2.position.x;
        const dy = node1.position.y - node2.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
          const force = repulsion / (distance * distance);
          fx += (dx / distance) * force;
          fy += (dy / distance) * force;
        }
      }

      // Gravity toward center
      const centerDx = center.x - node1.position.x;
      const centerDy = center.y - node1.position.y;
      fx += centerDx * gravity;
      fy += centerDy * gravity;

      // Apply forces
      node1.position.x += fx;
      node1.position.y += fy;
    }

    // Calculate attraction forces for connected nodes
    for (const edge of edges) {
      const sourceNode = updatedNodes.find(n => n.id === edge.source);
      const targetNode = updatedNodes.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode) {
        const dx = targetNode.position.x - sourceNode.position.x;
        const dy = targetNode.position.y - sourceNode.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > spacing) {
          const force = (distance - spacing) * attraction;
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;
          
          sourceNode.position.x += fx;
          sourceNode.position.y += fy;
          targetNode.position.x -= fx;
          targetNode.position.y -= fy;
        }
      }
    }
  }

  return updatedNodes;
}

/**
 * Hierarchical layout algorithm
 */
export function applyHierarchicalLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  config: { spacing?: number; padding?: number } = {}
): GraphNode[] {
  const { spacing = GRAPH_CONSTANTS.NODE_SPACING, padding = 50 } = config;
  
  // Build adjacency list
  const adjacency = new Map<string, string[]>();
  const inDegree = new Map<string, number>();
  
  for (const node of nodes) {
    adjacency.set(node.id, []);
    inDegree.set(node.id, 0);
  }
  
  for (const edge of edges) {
    adjacency.get(edge.source)?.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  }
  
  // Topological sort to determine levels
  const levels: string[][] = [];
  const queue: string[] = [];
  
  for (const [nodeId, degree] of inDegree) {
    if (degree === 0) {
      queue.push(nodeId);
    }
  }
  
  while (queue.length > 0) {
    const currentLevel: string[] = [];
    const nextQueue: string[] = [];
    
    for (const nodeId of queue) {
      currentLevel.push(nodeId);
      
      for (const neighbor of adjacency.get(nodeId) || []) {
        const newDegree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, newDegree);
        
        if (newDegree === 0) {
          nextQueue.push(neighbor);
        }
      }
    }
    
    levels.push(currentLevel);
    queue.length = 0;
    queue.push(...nextQueue);
  }
  
  // Position nodes based on levels
  const updatedNodes = nodes.map(node => ({ ...node }));
  
  for (let levelIndex = 0; levelIndex < levels.length; levelIndex++) {
    const level = levels[levelIndex];
    if (!level) continue;
    const y = levelIndex * spacing + padding;
    
    for (let nodeIndex = 0; nodeIndex < level.length; nodeIndex++) {
      const nodeId = level[nodeIndex];
      const node = updatedNodes.find(n => n.id === nodeId);
      
      if (node) {
        node.position.x = (nodeIndex - (level.length - 1) / 2) * spacing;
        node.position.y = y;
      }
    }
  }
  
  return updatedNodes;
}

/**
 * Circular layout algorithm
 */
export function applyCircularLayout(
  nodes: GraphNode[],
  config: { radius?: number } = {}
): GraphNode[] {
  const { radius = Math.max(nodes.length * 15, 100) } = config;
  
  const updatedNodes = nodes.map(node => ({ ...node }));
  const angleStep = (2 * Math.PI) / nodes.length;
  
  for (let i = 0; i < updatedNodes.length; i++) {
    const node = updatedNodes[i];
    if (!node) continue;
    const angle = i * angleStep;
    node.position.x = Math.cos(angle) * radius;
    node.position.y = Math.sin(angle) * radius;
  }
  
  return updatedNodes;
}

/**
 * Grid layout algorithm
 */
export function applyGridLayout(
  nodes: GraphNode[],
  config: { spacing?: number; columns?: number } = {}
): GraphNode[] {
  const { spacing = GRAPH_CONSTANTS.NODE_SPACING, columns = Math.ceil(Math.sqrt(nodes.length)) } = config;
  
  const updatedNodes = nodes.map(node => ({ ...node }));
  
  for (let i = 0; i < updatedNodes.length; i++) {
    const node = updatedNodes[i];
    if (!node) continue;
    const row = Math.floor(i / columns);
    const col = i % columns;
    
    node.position.x = col * spacing;
    node.position.y = row * spacing;
  }
  
  return updatedNodes;
}

/**
 * Apply layout algorithm to graph
 */
export function applyLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  layout: GraphLayout
): GraphNode[] {
  switch (layout.type) {
    case 'force':
      return applyForceLayout(nodes, edges, layout.config);
    case 'hierarchical':
      return applyHierarchicalLayout(nodes, edges, layout.config);
    case 'circular':
      return applyCircularLayout(nodes, layout.config as { radius?: number });
    case 'grid':
      return applyGridLayout(nodes, layout.config as { spacing?: number; columns?: number });
    default:
      return nodes;
  }
}

/**
 * Filter nodes based on criteria
 */
export function filterNodes(nodes: GraphNode[], filter: GraphFilter): GraphNode[] {
  return nodes.filter(node => {
    // Filter by node types
    if (filter.nodeTypes && !filter.nodeTypes.includes(node.type)) {
      return false;
    }
    
    // Filter by status
    if (filter.statuses && !filter.statuses.includes(node.status)) {
      return false;
    }
    
    // Filter by priority
    if (filter.priorities && !filter.priorities.includes(node.priority)) {
      return false;
    }
    
    // Filter by tags
    if (filter.tags && filter.tags.length > 0) {
      const nodeTags = node.metadata?.tags || [];
      const hasMatchingTag = filter.tags.some(tag => nodeTags.includes(tag));
      if (!hasMatchingTag) {
        return false;
      }
    }
    
    // Filter by search term
    if (filter.search) {
      const searchTerm = filter.search.toLowerCase();
      const matchesLabel = node.label.toLowerCase().includes(searchTerm);
      const matchesDescription = node.metadata?.description?.toLowerCase().includes(searchTerm);
      const matchesAssignee = node.metadata?.assignee?.toLowerCase().includes(searchTerm);
      
      if (!matchesLabel && !matchesDescription && !matchesAssignee) {
        return false;
      }
    }
    
    // Filter by date range
    if (filter.dateRange) {
      const nodeDate = node.metadata?.dueDate;
      if (nodeDate) {
        const date = new Date(nodeDate);
        const fromDate = filter.dateRange.from ? new Date(filter.dateRange.from) : null;
        const toDate = filter.dateRange.to ? new Date(filter.dateRange.to) : null;
        
        if (fromDate && date < fromDate) {
          return false;
        }
        
        if (toDate && date > toDate) {
          return false;
        }
      }
    }
    
    return true;
  });
}

/**
 * Filter edges based on filtered nodes
 */
export function filterEdges(edges: GraphEdge[], nodes: GraphNode[]): GraphEdge[] {
  const nodeIds = new Set(nodes.map(node => node.id));
  return edges.filter(edge => 
    nodeIds.has(edge.source) && nodeIds.has(edge.target)
  );
}

/**
 * Calculate graph bounds
 */
export function calculateGraphBounds(nodes: GraphNode[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  if (nodes.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
  
  const firstNode = nodes[0];
  if (!firstNode) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
  
  let minX = firstNode.position.x;
  let minY = firstNode.position.y;
  let maxX = firstNode.position.x;
  let maxY = firstNode.position.y;
  
  for (const node of nodes) {
    minX = Math.min(minX, node.position.x - node.size.width / 2);
    minY = Math.min(minY, node.position.y - node.size.height / 2);
    maxX = Math.max(maxX, node.position.x + node.size.width / 2);
    maxY = Math.max(maxY, node.position.y + node.size.height / 2);
  }
  
  return { minX, minY, maxX, maxY };
}

/**
 * Export graph data to different formats
 */
export function exportGraphData(
  data: GraphData,
  format: 'json' | 'svg' | 'png',
  options: { width?: number; height?: number } = {}
): string | Blob {
  switch (format) {
    case 'json':
      return JSON.stringify(data, null, 2);
    case 'svg':
      // This would need to be implemented with actual SVG generation
      // For now, return a placeholder
      return generateSVGString(data, options);
    case 'png':
      // This would need to be implemented with canvas rendering
      // For now, return a placeholder
      return generatePNGBlob(data, options);
    default:
      return JSON.stringify(data, null, 2);
  }
}

/**
 * Generate SVG string from graph data
 */
function generateSVGString(data: GraphData, options: { width?: number; height?: number }): string {
  const { width = 800, height = 600 } = options;
  const bounds = calculateGraphBounds(data.nodes);
  
  // Reference bounds for potential future use
  console.log('Graph bounds:', bounds);
  
  const svgElements: string[] = [];
  
  // Add edges
  for (const edge of data.edges) {
    const sourceNode = data.nodes.find(n => n.id === edge.source);
    const targetNode = data.nodes.find(n => n.id === edge.target);
    
    if (sourceNode && targetNode) {
      svgElements.push(`
        <line 
          x1="${sourceNode.position.x}" 
          y1="${sourceNode.position.y}" 
          x2="${targetNode.position.x}" 
          y2="${targetNode.position.y}" 
          stroke="${EDGE_COLORS[edge.type]}" 
          stroke-width="2"
        />
      `);
    }
  }
  
  // Add nodes
  for (const node of data.nodes) {
    const color = NODE_COLORS[node.type];
    svgElements.push(`
      <circle 
        cx="${node.position.x}" 
        cy="${node.position.y}" 
        r="${GRAPH_CONSTANTS.NODE_RADIUS}" 
        fill="${color}"
      />
      <text 
        x="${node.position.x}" 
        y="${node.position.y + 5}" 
        text-anchor="middle" 
        fill="white" 
        font-size="12"
      >
        ${node.label}
      </text>
    `);
  }
  
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(${width / 2}, ${height / 2})">
        ${svgElements.join('')}
      </g>
    </svg>
  `;
}

/**
 * Generate PNG blob from graph data
 */
function generatePNGBlob(data: GraphData, options: { width?: number; height?: number }): Blob {
  // This is a placeholder implementation
  // In a real implementation, you would use Canvas API to render the graph
  console.log('Generating PNG for data:', data);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Canvas context not available');
  }
  
  canvas.width = options.width || 800;
  canvas.height = options.height || 600;
  
  // Clear canvas
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // This would contain the actual rendering logic
  // For now, return empty blob
  return new Blob([''], { type: 'image/png' });
}

/**
 * Import graph data from JSON
 */
export function importGraphData(
  jsonString: string,
  options: { validateSchema?: boolean; mergeStrategy?: 'replace' | 'merge' } = {}
): GraphData {
  const { validateSchema = true, mergeStrategy = 'replace' } = options;
  
  // Reference merge strategy for potential future use
  console.log('Import merge strategy:', mergeStrategy);
  
  try {
    const data = JSON.parse(jsonString) as GraphData;
    
    if (validateSchema && !validateGraphData(data)) {
      throw new Error('Invalid graph data structure');
    }
    
    return data;
  } catch (error) {
    throw new Error(`Failed to import graph data: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Merge two graph datasets
 */
export function mergeGraphData(existing: GraphData, incoming: GraphData): GraphData {
  const nodeMap = new Map<string, GraphNode>();
  const edgeMap = new Map<string, GraphEdge>();
  
  // Add existing nodes and edges
  for (const node of existing.nodes) {
    nodeMap.set(node.id, node);
  }
  
  for (const edge of existing.edges) {
    edgeMap.set(edge.id, edge);
  }
  
  // Add or update incoming nodes and edges
  for (const node of incoming.nodes) {
    nodeMap.set(node.id, node);
  }
  
  for (const edge of incoming.edges) {
    edgeMap.set(edge.id, edge);
  }
  
  return {
    nodes: Array.from(nodeMap.values()),
    edges: Array.from(edgeMap.values()),
    metadata: {
      ...existing.metadata,
      ...incoming.metadata,
      updatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Find shortest path between two nodes
 */
export function findShortestPath(
  nodes: GraphNode[],
  edges: GraphEdge[],
  startId: string,
  endId: string
): string[] {
  const adjacency = new Map<string, string[]>();
  
  // Build adjacency list
  for (const node of nodes) {
    adjacency.set(node.id, []);
  }
  
  for (const edge of edges) {
    adjacency.get(edge.source)?.push(edge.target);
    adjacency.get(edge.target)?.push(edge.source);
  }
  
  // BFS to find shortest path
  const queue = [startId];
  const visited = new Set<string>([startId]);
  const parent = new Map<string, string>();
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    
    if (current === endId) {
      // Reconstruct path
      const path: string[] = [];
      let node = endId;
      
      while (node !== startId) {
        path.unshift(node);
        node = parent.get(node)!;
      }
      
      path.unshift(startId);
      return path;
    }
    
    for (const neighbor of adjacency.get(current) || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        parent.set(neighbor, current);
        queue.push(neighbor);
      }
    }
  }
  
  return []; // No path found
}

/**
 * Detect cycles in the graph
 */
export function detectCycles(nodes: GraphNode[], edges: GraphEdge[]): string[][] {
  const adjacency = new Map<string, string[]>();
  const cycles: string[][] = [];
  
  // Build adjacency list
  for (const node of nodes) {
    adjacency.set(node.id, []);
  }
  
  for (const edge of edges) {
    adjacency.get(edge.source)?.push(edge.target);
  }
  
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const path: string[] = [];
  
  function dfs(nodeId: string): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);
    
    for (const neighbor of adjacency.get(nodeId) || []) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) {
          return true;
        }
      } else if (recursionStack.has(neighbor)) {
        // Found a cycle
        const cycleStart = path.indexOf(neighbor);
        const cycle = path.slice(cycleStart);
        cycles.push([...cycle, neighbor]);
        return true;
      }
    }
    
    recursionStack.delete(nodeId);
    path.pop();
    return false;
  }
  
  for (const node of nodes) {
    if (!visited.has(node.id)) {
      dfs(node.id);
    }
  }
  
  return cycles;
}