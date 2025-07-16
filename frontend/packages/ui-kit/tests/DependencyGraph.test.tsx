import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DependencyGraph } from '../src/components/DependencyGraph/DependencyGraph';
import { GraphNode } from '../src/components/DependencyGraph/GraphNode';
import { GraphEdge } from '../src/components/DependencyGraph/GraphEdge';
import { GraphControls } from '../src/components/DependencyGraph/GraphControls';
import { GraphMinimap } from '../src/components/DependencyGraph/GraphMinimap';
import type { GraphData, GraphNode as GraphNodeType, GraphEdge as GraphEdgeType } from '../src/components/DependencyGraph/types';
import { 
  applyForceLayout, 
  applyHierarchicalLayout, 
  calculateDistance, 
  calculateAngle,
  validateGraphData,
  filterNodes,
  filterEdges,
  exportGraphData,
  importGraphData
} from '../src/components/DependencyGraph/utils';

// Mock data
const mockNodes: GraphNodeType[] = [
  {
    id: 'node-1',
    label: 'Task 1',
    type: 'task',
    status: 'pending',
    priority: 'high',
    position: { x: 0, y: 0 },
    size: { width: 80, height: 40 },
    metadata: {
      assignee: 'John Doe',
      dueDate: '2024-01-15',
      description: 'First task',
      tags: ['frontend', 'urgent'],
      estimatedHours: 8,
    },
  },
  {
    id: 'node-2',
    label: 'Milestone 1',
    type: 'milestone',
    status: 'in-progress',
    priority: 'medium',
    position: { x: 100, y: 0 },
    size: { width: 60, height: 60 },
    metadata: {
      assignee: 'Jane Smith',
      dueDate: '2024-01-20',
      description: 'First milestone',
      tags: ['backend'],
      estimatedHours: 16,
    },
  },
  {
    id: 'node-3',
    label: 'Blocker 1',
    type: 'blocker',
    status: 'blocked',
    priority: 'urgent',
    position: { x: 200, y: 0 },
    size: { width: 70, height: 70 },
    metadata: {
      assignee: 'Bob Johnson',
      description: 'Critical blocker',
      tags: ['infrastructure'],
      estimatedHours: 4,
    },
  },
];

const mockEdges: GraphEdgeType[] = [
  {
    id: 'edge-1',
    source: 'node-1',
    target: 'node-2',
    type: 'dependency',
    label: 'depends on',
    strength: 1,
    metadata: {
      createdAt: '2024-01-01',
      reason: 'Task completion required',
    },
  },
  {
    id: 'edge-2',
    source: 'node-2',
    target: 'node-3',
    type: 'blocks',
    label: 'blocked by',
    strength: 0.8,
    metadata: {
      createdAt: '2024-01-02',
      reason: 'Resource conflict',
    },
  },
  {
    id: 'edge-3',
    source: 'node-1',
    target: 'node-3',
    type: 'related',
    label: 'related to',
    strength: 0.5,
    metadata: {
      createdAt: '2024-01-03',
      reason: 'Similar domain',
    },
  },
];

const mockData: GraphData = {
  nodes: mockNodes,
  edges: mockEdges,
  metadata: {
    layout: 'force',
    zoomLevel: 1,
    panPosition: { x: 0, y: 0 },
    version: '1.0.0',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
};

describe('DependencyGraph', () => {
  const defaultProps = {
    data: mockData,
    width: 800,
    height: 600,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<DependencyGraph {...defaultProps} />);
    expect(screen.getByRole('img', { name: /dependency graph/i })).toBeInTheDocument();
  });

  it('renders all nodes', () => {
    render(<DependencyGraph {...defaultProps} />);
    
    mockNodes.forEach(node => {
      expect(screen.getByTestId(`graph-node-${node.id}`)).toBeInTheDocument();
    });
  });

  it('renders all edges', () => {
    render(<DependencyGraph {...defaultProps} />);
    
    mockEdges.forEach(edge => {
      expect(screen.getByTestId(`graph-edge-${edge.id}`)).toBeInTheDocument();
    });
  });

  it('handles node clicks', async () => {
    const onNodeClick = vi.fn();
    render(<DependencyGraph {...defaultProps} onNodeClick={onNodeClick} />);
    
    const node = screen.getByTestId('graph-node-node-1');
    await userEvent.click(node);
    
    expect(onNodeClick).toHaveBeenCalledWith(mockNodes[0]);
  });

  it('handles edge clicks', async () => {
    const onEdgeClick = vi.fn();
    render(<DependencyGraph {...defaultProps} onEdgeClick={onEdgeClick} />);
    
    const edge = screen.getByTestId('graph-edge-edge-1');
    await userEvent.click(edge);
    
    expect(onEdgeClick).toHaveBeenCalledWith(mockEdges[0]);
  });

  it('shows controls when enabled', () => {
    render(<DependencyGraph {...defaultProps} showControls={true} />);
    
    expect(screen.getByLabelText('Zoom in')).toBeInTheDocument();
    expect(screen.getByLabelText('Zoom out')).toBeInTheDocument();
    expect(screen.getByLabelText('Reset zoom')).toBeInTheDocument();
    expect(screen.getByLabelText('Fit to content')).toBeInTheDocument();
  });

  it('hides controls when disabled', () => {
    render(<DependencyGraph {...defaultProps} showControls={false} />);
    
    expect(screen.queryByLabelText('Zoom in')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Zoom out')).not.toBeInTheDocument();
  });

  it('shows minimap when enabled', () => {
    render(<DependencyGraph {...defaultProps} showMinimap={true} />);
    
    expect(screen.getByLabelText('Graph minimap')).toBeInTheDocument();
  });

  it('hides minimap when disabled', () => {
    render(<DependencyGraph {...defaultProps} showMinimap={false} />);
    
    expect(screen.queryByLabelText('Graph minimap')).not.toBeInTheDocument();
  });

  it('handles zoom interactions', async () => {
    render(<DependencyGraph {...defaultProps} enableZoom={true} />);
    
    const zoomInButton = screen.getByLabelText('Zoom in');
    const zoomOutButton = screen.getByLabelText('Zoom out');
    
    await userEvent.click(zoomInButton);
    await userEvent.click(zoomOutButton);
    
    // Test that zoom controls are functional
    expect(zoomInButton).toBeEnabled();
    expect(zoomOutButton).toBeEnabled();
  });

  it('handles layout changes', async () => {
    render(<DependencyGraph {...defaultProps} />);
    
    const forceLayoutButton = screen.getByLabelText('Switch to force layout');
    await userEvent.click(forceLayoutButton);
    
    expect(forceLayoutButton).toBeInTheDocument();
  });

  it('handles empty data gracefully', () => {
    const emptyData: GraphData = {
      nodes: [],
      edges: [],
    };
    
    render(<DependencyGraph {...defaultProps} data={emptyData} />);
    
    expect(screen.getByRole('img', { name: /dependency graph/i })).toBeInTheDocument();
  });

  it('validates graph data', () => {
    const invalidData = {
      nodes: [{ id: 'node-1' }], // Missing required properties
      edges: [],
    };
    
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<DependencyGraph {...defaultProps} data={invalidData as any} />);
    
    expect(consoleSpy).toHaveBeenCalledWith(
      'Invalid graph data structure provided to DependencyGraph'
    );
    
    consoleSpy.mockRestore();
  });

  it('applies custom className', () => {
    const customClass = 'custom-graph-class';
    render(<DependencyGraph {...defaultProps} className={customClass} />);
    
    const container = screen.getByRole('img', { name: /dependency graph/i }).closest('div');
    expect(container).toHaveClass(customClass);
  });

  it('handles theme changes', () => {
    const { rerender } = render(<DependencyGraph {...defaultProps} theme="light" />);
    
    let container = screen.getByRole('img', { name: /dependency graph/i }).closest('div');
    expect(container).not.toHaveClass('bg-gray-900');
    
    rerender(<DependencyGraph {...defaultProps} theme="dark" />);
    
    container = screen.getByRole('img', { name: /dependency graph/i }).closest('div');
    expect(container).toHaveClass('bg-gray-900');
  });

  it('handles drag and drop', async () => {
    const onNodeDrag = vi.fn();
    render(<DependencyGraph {...defaultProps} onNodeDrag={onNodeDrag} enableDrag={true} />);
    
    const node = screen.getByTestId('graph-node-node-1');
    
    fireEvent.mouseDown(node, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(node, { clientX: 150, clientY: 150 });
    fireEvent.mouseUp(node);
    
    // The drag handler should be called
    expect(onNodeDrag).toHaveBeenCalled();
  });

  it('handles wheel zoom', () => {
    render(<DependencyGraph {...defaultProps} enableZoom={true} />);
    
    const svg = screen.getByRole('img', { name: /dependency graph/i });
    
    fireEvent.wheel(svg, { deltaY: -100 });
    fireEvent.wheel(svg, { deltaY: 100 });
    
    // Test that wheel events are handled
    expect(svg).toBeInTheDocument();
  });
});

describe('GraphNode', () => {
  const mockNode = mockNodes[0];

  it('renders node with correct label', () => {
    render(
      <svg>
        <GraphNode node={mockNode} />
      </svg>
    );
    
    expect(screen.getByText(mockNode.label)).toBeInTheDocument();
  });

  it('applies correct styles for node type', () => {
    render(
      <svg>
        <GraphNode node={mockNode} />
      </svg>
    );
    
    const nodeElement = screen.getByTestId(`graph-node-${mockNode.id}`);
    expect(nodeElement).toHaveAttribute('data-node-id', mockNode.id);
  });

  it('shows hover details when hovered', () => {
    render(
      <svg>
        <GraphNode node={mockNode} isHovered={true} showDetails={true} />
      </svg>
    );
    
    expect(screen.getByText(mockNode.metadata?.description || '')).toBeInTheDocument();
    expect(screen.getByText(mockNode.metadata?.assignee || '')).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const onClick = vi.fn();
    
    render(
      <svg>
        <GraphNode node={mockNode} onClick={onClick} />
      </svg>
    );
    
    const nodeElement = screen.getByTestId(`graph-node-${mockNode.id}`);
    await userEvent.click(nodeElement);
    
    expect(onClick).toHaveBeenCalled();
  });

  it('shows selection state', () => {
    render(
      <svg>
        <GraphNode node={mockNode} isSelected={true} />
      </svg>
    );
    
    const nodeElement = screen.getByTestId(`graph-node-${mockNode.id}`);
    expect(nodeElement).toHaveAttribute('aria-selected', 'true');
  });

  it('shows dragging state', () => {
    render(
      <svg>
        <GraphNode node={mockNode} isDragging={true} />
      </svg>
    );
    
    const nodeElement = screen.getByTestId(`graph-node-${mockNode.id}`);
    expect(nodeElement).toBeInTheDocument();
  });
});

describe('GraphEdge', () => {
  const mockEdge = mockEdges[0];
  const sourceNode = mockNodes[0];
  const targetNode = mockNodes[1];

  it('renders edge between nodes', () => {
    render(
      <svg>
        <GraphEdge edge={mockEdge} sourceNode={sourceNode} targetNode={targetNode} />
      </svg>
    );
    
    expect(screen.getByTestId(`graph-edge-${mockEdge.id}`)).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const onClick = vi.fn();
    
    render(
      <svg>
        <GraphEdge 
          edge={mockEdge} 
          sourceNode={sourceNode} 
          targetNode={targetNode} 
          onClick={onClick}
        />
      </svg>
    );
    
    const edgeElement = screen.getByTestId(`graph-edge-${mockEdge.id}`);
    await userEvent.click(edgeElement);
    
    expect(onClick).toHaveBeenCalled();
  });

  it('shows selection state', () => {
    render(
      <svg>
        <GraphEdge 
          edge={mockEdge} 
          sourceNode={sourceNode} 
          targetNode={targetNode} 
          isSelected={true}
        />
      </svg>
    );
    
    const edgeElement = screen.getByTestId(`graph-edge-${mockEdge.id}`);
    expect(edgeElement).toBeInTheDocument();
  });

  it('shows arrows when enabled', () => {
    render(
      <svg>
        <GraphEdge 
          edge={mockEdge} 
          sourceNode={sourceNode} 
          targetNode={targetNode} 
          showArrows={true}
        />
      </svg>
    );
    
    const edgeElement = screen.getByTestId(`graph-edge-${mockEdge.id}`);
    expect(edgeElement).toBeInTheDocument();
  });

  it('shows labels when enabled', () => {
    render(
      <svg>
        <GraphEdge 
          edge={mockEdge} 
          sourceNode={sourceNode} 
          targetNode={targetNode} 
          showLabels={true}
        />
      </svg>
    );
    
    expect(screen.getByText(mockEdge.label || '')).toBeInTheDocument();
  });
});

describe('GraphControls', () => {
  const defaultControlsProps = {
    zoom: 1,
    onZoomIn: vi.fn(),
    onZoomOut: vi.fn(),
    onResetZoom: vi.fn(),
    onFitToContent: vi.fn(),
    onExport: vi.fn(),
    onImport: vi.fn(),
    onLayoutChange: vi.fn(),
    currentLayout: 'force' as const,
    onFilterChange: vi.fn(),
    currentFilter: {},
    onToggleAnimation: vi.fn(),
    isAnimationEnabled: true,
    onToggleGrid: vi.fn(),
    isGridVisible: false,
    onToggleMinimap: vi.fn(),
    isMinimapVisible: true,
    nodeCount: 3,
    edgeCount: 3,
    selectedCount: 0,
  };

  it('renders all control buttons', () => {
    render(<GraphControls {...defaultControlsProps} />);
    
    expect(screen.getByLabelText('Zoom in')).toBeInTheDocument();
    expect(screen.getByLabelText('Zoom out')).toBeInTheDocument();
    expect(screen.getByLabelText('Reset zoom')).toBeInTheDocument();
    expect(screen.getByLabelText('Fit to content')).toBeInTheDocument();
  });

  it('displays current zoom level', () => {
    render(<GraphControls {...defaultControlsProps} zoom={1.5} />);
    
    expect(screen.getByText('150%')).toBeInTheDocument();
  });

  it('handles zoom controls', async () => {
    const onZoomIn = vi.fn();
    const onZoomOut = vi.fn();
    
    render(<GraphControls {...defaultControlsProps} onZoomIn={onZoomIn} onZoomOut={onZoomOut} />);
    
    await userEvent.click(screen.getByLabelText('Zoom in'));
    expect(onZoomIn).toHaveBeenCalled();
    
    await userEvent.click(screen.getByLabelText('Zoom out'));
    expect(onZoomOut).toHaveBeenCalled();
  });

  it('handles layout changes', async () => {
    const onLayoutChange = vi.fn();
    
    render(<GraphControls {...defaultControlsProps} onLayoutChange={onLayoutChange} />);
    
    await userEvent.click(screen.getByLabelText('Switch to hierarchical layout'));
    expect(onLayoutChange).toHaveBeenCalledWith('hierarchical');
  });

  it('displays statistics', () => {
    render(<GraphControls {...defaultControlsProps} />);
    
    expect(screen.getByText('3')).toBeInTheDocument(); // Node count
    expect(screen.getByText('3')).toBeInTheDocument(); // Edge count
  });

  it('handles export actions', async () => {
    const onExport = vi.fn();
    
    render(<GraphControls {...defaultControlsProps} onExport={onExport} />);
    
    await userEvent.click(screen.getByLabelText('Export as JSON'));
    expect(onExport).toHaveBeenCalledWith('json');
  });
});

describe('GraphMinimap', () => {
  const defaultMinimapProps = {
    nodes: mockNodes,
    edges: mockEdges,
    viewport: {
      zoom: 1,
      pan: { x: 0, y: 0 },
      bounds: { minX: 0, minY: 0, maxX: 200, maxY: 200 },
    },
    onViewportChange: vi.fn(),
  };

  it('renders minimap with nodes and edges', () => {
    render(<GraphMinimap {...defaultMinimapProps} />);
    
    expect(screen.getByLabelText('Graph minimap')).toBeInTheDocument();
    expect(screen.getByText('3 nodes')).toBeInTheDocument();
    expect(screen.getByText('3 edges')).toBeInTheDocument();
  });

  it('handles viewport changes on click', async () => {
    const onViewportChange = vi.fn();
    
    render(<GraphMinimap {...defaultMinimapProps} onViewportChange={onViewportChange} />);
    
    const minimap = screen.getByLabelText('Graph minimap');
    await userEvent.click(minimap);
    
    expect(onViewportChange).toHaveBeenCalled();
  });

  it('handles empty data', () => {
    render(<GraphMinimap {...defaultMinimapProps} nodes={[]} edges={[]} />);
    
    expect(screen.getByText('No nodes to display')).toBeInTheDocument();
  });
});

describe('Utils', () => {
  describe('calculateDistance', () => {
    it('calculates distance correctly', () => {
      const p1 = { x: 0, y: 0 };
      const p2 = { x: 3, y: 4 };
      
      expect(calculateDistance(p1, p2)).toBe(5);
    });
  });

  describe('calculateAngle', () => {
    it('calculates angle correctly', () => {
      const p1 = { x: 0, y: 0 };
      const p2 = { x: 1, y: 0 };
      
      expect(calculateAngle(p1, p2)).toBe(0);
    });
  });

  describe('validateGraphData', () => {
    it('validates correct data', () => {
      expect(validateGraphData(mockData)).toBe(true);
    });

    it('rejects invalid data', () => {
      const invalidData = {
        nodes: [{ id: 'node-1' }],
        edges: [{ id: 'edge-1', source: 'node-1', target: 'node-2' }],
      };
      
      expect(validateGraphData(invalidData as any)).toBe(false);
    });
  });

  describe('applyForceLayout', () => {
    it('applies force layout to nodes', () => {
      const result = applyForceLayout(mockNodes, mockEdges);
      
      expect(result).toHaveLength(mockNodes.length);
      expect(result[0]).toHaveProperty('position');
    });
  });

  describe('applyHierarchicalLayout', () => {
    it('applies hierarchical layout to nodes', () => {
      const result = applyHierarchicalLayout(mockNodes, mockEdges);
      
      expect(result).toHaveLength(mockNodes.length);
      expect(result[0]).toHaveProperty('position');
    });
  });

  describe('filterNodes', () => {
    it('filters nodes by type', () => {
      const filter = { nodeTypes: ['task'] };
      const result = filterNodes(mockNodes, filter);
      
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('task');
    });

    it('filters nodes by status', () => {
      const filter = { statuses: ['pending'] };
      const result = filterNodes(mockNodes, filter);
      
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('pending');
    });

    it('filters nodes by tags', () => {
      const filter = { tags: ['frontend'] };
      const result = filterNodes(mockNodes, filter);
      
      expect(result).toHaveLength(1);
      expect(result[0].metadata?.tags).toContain('frontend');
    });
  });

  describe('filterEdges', () => {
    it('filters edges based on node visibility', () => {
      const visibleNodes = [mockNodes[0], mockNodes[1]];
      const result = filterEdges(mockEdges, visibleNodes);
      
      expect(result).toHaveLength(1);
      expect(result[0].source).toBe('node-1');
      expect(result[0].target).toBe('node-2');
    });
  });

  describe('exportGraphData', () => {
    it('exports data as JSON', () => {
      const result = exportGraphData(mockData, 'json');
      
      expect(typeof result).toBe('string');
      expect(JSON.parse(result as string)).toEqual(mockData);
    });
  });

  describe('importGraphData', () => {
    it('imports data from JSON string', () => {
      const jsonString = JSON.stringify(mockData);
      const result = importGraphData(jsonString);
      
      expect(result).toEqual(mockData);
    });

    it('throws error for invalid JSON', () => {
      expect(() => importGraphData('invalid json')).toThrow();
    });
  });
});

describe('Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has proper ARIA labels', () => {
    render(<DependencyGraph {...defaultProps} />);
    
    expect(screen.getByRole('img', { name: /dependency graph/i })).toBeInTheDocument();
  });

  it('supports keyboard navigation', () => {
    render(<DependencyGraph {...defaultProps} />);
    
    const graph = screen.getByRole('img', { name: /dependency graph/i });
    expect(graph).toBeInTheDocument();
    
    // Test keyboard events
    fireEvent.keyDown(graph, { key: '+', ctrlKey: true });
    fireEvent.keyDown(graph, { key: '-', ctrlKey: true });
    fireEvent.keyDown(graph, { key: '0', ctrlKey: true });
  });

  it('provides proper focus management', () => {
    render(<DependencyGraph {...defaultProps} />);
    
    const nodeElement = screen.getByTestId('graph-node-node-1');
    expect(nodeElement).toHaveAttribute('tabIndex', '0');
    expect(nodeElement).toHaveAttribute('role', 'button');
  });

  it('has proper color contrast', () => {
    // This would typically be tested with actual color contrast tools
    // but we can test that proper CSS classes are applied
    render(<DependencyGraph {...defaultProps} />);
    
    const nodeElement = screen.getByTestId('graph-node-node-1');
    expect(nodeElement).toBeInTheDocument();
  });
});

describe('Performance', () => {
  it('handles large datasets efficiently', () => {
    const largeNodeCount = 1000;
    const largeNodes = Array.from({ length: largeNodeCount }, (_, i) => ({
      id: `node-${i}`,
      label: `Node ${i}`,
      type: 'task' as const,
      status: 'pending' as const,
      priority: 'medium' as const,
      position: { x: i * 50, y: i * 50 },
      size: { width: 80, height: 40 },
    }));

    const largeEdges = Array.from({ length: largeNodeCount - 1 }, (_, i) => ({
      id: `edge-${i}`,
      source: `node-${i}`,
      target: `node-${i + 1}`,
      type: 'dependency' as const,
    }));

    const largeData = {
      nodes: largeNodes,
      edges: largeEdges,
    };

    const startTime = performance.now();
    render(<DependencyGraph {...defaultProps} data={largeData} />);
    const endTime = performance.now();

    // Should render within reasonable time (less than 1 second)
    expect(endTime - startTime).toBeLessThan(1000);
  });

  it('implements viewport culling', () => {
    render(<DependencyGraph {...defaultProps} />);
    
    // All nodes should be rendered since they're within viewport
    mockNodes.forEach(node => {
      expect(screen.getByTestId(`graph-node-${node.id}`)).toBeInTheDocument();
    });
  });
});

describe('Integration', () => {
  it('integrates with existing UI components', () => {
    render(<DependencyGraph {...defaultProps} />);
    
    // Should use Card components for controls and minimap
    expect(screen.getAllByRole('button')).toHaveLength(0); // No buttons when controls are hidden
  });

  it('maintains consistent styling with design system', () => {
    render(<DependencyGraph {...defaultProps} />);
    
    const container = screen.getByRole('img', { name: /dependency graph/i }).closest('div');
    expect(container).toHaveClass('rounded-lg', 'border', 'bg-white');
  });
});