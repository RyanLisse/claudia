import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { DependencyGraph } from '../src/components/DependencyGraph/DependencyGraph';
import type { GraphData, GraphNode, GraphEdge } from '../src/components/DependencyGraph/types';

// Sample data for stories
const createSampleNodes = (count: number): GraphNode[] => {
  const types: Array<'task' | 'milestone' | 'blocker'> = ['task', 'milestone', 'blocker'];
  const statuses: Array<'pending' | 'in-progress' | 'completed' | 'blocked'> = ['pending', 'in-progress', 'completed', 'blocked'];
  const priorities: Array<'low' | 'medium' | 'high' | 'urgent'> = ['low', 'medium', 'high', 'urgent'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `node-${i + 1}`,
    label: `${types[i % 3]} ${i + 1}`,
    type: types[i % 3],
    status: statuses[i % 4],
    priority: priorities[i % 4],
    position: { x: (i % 5) * 100, y: Math.floor(i / 5) * 100 },
    size: { width: 80, height: 40 },
    metadata: {
      assignee: `User ${i + 1}`,
      dueDate: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString(),
      description: `Description for ${types[i % 3]} ${i + 1}`,
      tags: [`tag-${i % 3 + 1}`, `category-${i % 2 + 1}`],
      estimatedHours: (i % 10 + 1) * 2,
      actualHours: (i % 8 + 1) * 2,
    },
  }));
};

const createSampleEdges = (nodeCount: number): GraphEdge[] => {
  const types: Array<'dependency' | 'blocks' | 'related'> = ['dependency', 'blocks', 'related'];
  const edges: GraphEdge[] = [];
  
  for (let i = 0; i < nodeCount - 1; i++) {
    edges.push({
      id: `edge-${i + 1}`,
      source: `node-${i + 1}`,
      target: `node-${i + 2}`,
      type: types[i % 3],
      label: `${types[i % 3]} ${i + 1}`,
      strength: Math.random() * 0.5 + 0.5,
      metadata: {
        createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        reason: `Reason for ${types[i % 3]} relationship`,
      },
    });
  }
  
  // Add some additional cross-connections
  for (let i = 0; i < Math.min(nodeCount / 3, 5); i++) {
    const sourceIndex = Math.floor(Math.random() * nodeCount) + 1;
    const targetIndex = Math.floor(Math.random() * nodeCount) + 1;
    
    if (sourceIndex !== targetIndex) {
      edges.push({
        id: `edge-cross-${i + 1}`,
        source: `node-${sourceIndex}`,
        target: `node-${targetIndex}`,
        type: 'related',
        label: `cross-ref ${i + 1}`,
        strength: Math.random() * 0.3 + 0.2,
        metadata: {
          createdAt: new Date().toISOString(),
          reason: 'Cross-reference relationship',
        },
      });
    }
  }
  
  return edges;
};

const smallData: GraphData = {
  nodes: createSampleNodes(5),
  edges: createSampleEdges(5),
  metadata: {
    layout: 'force',
    zoomLevel: 1,
    panPosition: { x: 0, y: 0 },
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

const mediumData: GraphData = {
  nodes: createSampleNodes(15),
  edges: createSampleEdges(15),
  metadata: {
    layout: 'hierarchical',
    zoomLevel: 1,
    panPosition: { x: 0, y: 0 },
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

const largeData: GraphData = {
  nodes: createSampleNodes(50),
  edges: createSampleEdges(50),
  metadata: {
    layout: 'force',
    zoomLevel: 0.8,
    panPosition: { x: 0, y: 0 },
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

const complexData: GraphData = {
  nodes: [
    {
      id: 'frontend-setup',
      label: 'Frontend Setup',
      type: 'task',
      status: 'completed',
      priority: 'high',
      position: { x: 0, y: 0 },
      size: { width: 100, height: 50 },
      metadata: {
        assignee: 'Alice Johnson',
        dueDate: '2024-01-15',
        description: 'Set up the frontend development environment',
        tags: ['frontend', 'setup'],
        estimatedHours: 8,
        actualHours: 6,
      },
    },
    {
      id: 'api-design',
      label: 'API Design',
      type: 'task',
      status: 'in-progress',
      priority: 'high',
      position: { x: 200, y: 0 },
      size: { width: 100, height: 50 },
      metadata: {
        assignee: 'Bob Smith',
        dueDate: '2024-01-20',
        description: 'Design RESTful API endpoints',
        tags: ['backend', 'api'],
        estimatedHours: 16,
        actualHours: 12,
      },
    },
    {
      id: 'database-setup',
      label: 'Database Setup',
      type: 'task',
      status: 'pending',
      priority: 'medium',
      position: { x: 400, y: 0 },
      size: { width: 100, height: 50 },
      metadata: {
        assignee: 'Charlie Brown',
        dueDate: '2024-01-25',
        description: 'Set up database schema and migrations',
        tags: ['database', 'setup'],
        estimatedHours: 12,
      },
    },
    {
      id: 'integration-tests',
      label: 'Integration Tests',
      type: 'task',
      status: 'blocked',
      priority: 'medium',
      position: { x: 0, y: 100 },
      size: { width: 120, height: 50 },
      metadata: {
        assignee: 'Diana Prince',
        dueDate: '2024-02-01',
        description: 'Write integration tests for API',
        tags: ['testing', 'integration'],
        estimatedHours: 20,
      },
    },
    {
      id: 'mvp-milestone',
      label: 'MVP Ready',
      type: 'milestone',
      status: 'pending',
      priority: 'urgent',
      position: { x: 200, y: 100 },
      size: { width: 80, height: 80 },
      metadata: {
        assignee: 'Team Lead',
        dueDate: '2024-02-15',
        description: 'Minimum viable product ready for testing',
        tags: ['milestone', 'mvp'],
        estimatedHours: 0,
      },
    },
    {
      id: 'performance-blocker',
      label: 'Performance Issue',
      type: 'blocker',
      status: 'blocked',
      priority: 'urgent',
      position: { x: 400, y: 100 },
      size: { width: 90, height: 90 },
      metadata: {
        assignee: 'Eve Wilson',
        dueDate: '2024-01-30',
        description: 'Critical performance issue in API',
        tags: ['performance', 'critical'],
        estimatedHours: 24,
      },
    },
  ],
  edges: [
    {
      id: 'frontend-api',
      source: 'frontend-setup',
      target: 'api-design',
      type: 'dependency',
      label: 'needs API',
      strength: 0.9,
      metadata: {
        createdAt: '2024-01-01',
        reason: 'Frontend needs API endpoints',
      },
    },
    {
      id: 'api-database',
      source: 'api-design',
      target: 'database-setup',
      type: 'dependency',
      label: 'needs DB',
      strength: 1.0,
      metadata: {
        createdAt: '2024-01-02',
        reason: 'API needs database schema',
      },
    },
    {
      id: 'api-tests',
      source: 'api-design',
      target: 'integration-tests',
      type: 'dependency',
      label: 'enables testing',
      strength: 0.8,
      metadata: {
        createdAt: '2024-01-03',
        reason: 'API must be ready for testing',
      },
    },
    {
      id: 'tests-mvp',
      source: 'integration-tests',
      target: 'mvp-milestone',
      type: 'dependency',
      label: 'required for MVP',
      strength: 0.9,
      metadata: {
        createdAt: '2024-01-04',
        reason: 'Tests required before MVP',
      },
    },
    {
      id: 'perf-blocker',
      source: 'performance-blocker',
      target: 'mvp-milestone',
      type: 'blocks',
      label: 'blocks MVP',
      strength: 1.0,
      metadata: {
        createdAt: '2024-01-05',
        reason: 'Performance issue must be resolved',
      },
    },
    {
      id: 'db-perf',
      source: 'database-setup',
      target: 'performance-blocker',
      type: 'related',
      label: 'may affect',
      strength: 0.6,
      metadata: {
        createdAt: '2024-01-06',
        reason: 'Database setup may impact performance',
      },
    },
  ],
  metadata: {
    layout: 'hierarchical',
    zoomLevel: 1,
    panPosition: { x: 0, y: 0 },
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

const emptyData: GraphData = {
  nodes: [],
  edges: [],
  metadata: {
    layout: 'force',
    zoomLevel: 1,
    panPosition: { x: 0, y: 0 },
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

const meta: Meta<typeof DependencyGraph> = {
  title: 'Components/DependencyGraph',
  component: DependencyGraph,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A comprehensive dependency graph component for visualizing task dependencies with interactive features, multiple layouts, and real-time updates.',
      },
    },
  },
  argTypes: {
    data: {
      description: 'Graph data containing nodes and edges',
      control: false,
    },
    width: {
      description: 'Width of the graph container',
      control: { type: 'range', min: 400, max: 1200, step: 50 },
    },
    height: {
      description: 'Height of the graph container',
      control: { type: 'range', min: 300, max: 800, step: 50 },
    },
    theme: {
      description: 'Visual theme for the graph',
      control: { type: 'select' },
      options: ['light', 'dark', 'auto'],
    },
    interactive: {
      description: 'Enable interactive features',
      control: { type: 'boolean' },
    },
    showMinimap: {
      description: 'Show minimap for navigation',
      control: { type: 'boolean' },
    },
    showControls: {
      description: 'Show control panel',
      control: { type: 'boolean' },
    },
    showLegend: {
      description: 'Show legend',
      control: { type: 'boolean' },
    },
    enableZoom: {
      description: 'Enable zoom functionality',
      control: { type: 'boolean' },
    },
    enablePan: {
      description: 'Enable pan functionality',
      control: { type: 'boolean' },
    },
    enableDrag: {
      description: 'Enable drag functionality',
      control: { type: 'boolean' },
    },
    autoLayout: {
      description: 'Automatically apply layout algorithm',
      control: { type: 'boolean' },
    },
    onNodeClick: { action: 'node-clicked' },
    onNodeHover: { action: 'node-hovered' },
    onNodeDrag: { action: 'node-dragged' },
    onEdgeClick: { action: 'edge-clicked' },
    onGraphUpdate: { action: 'graph-updated' },
    onExport: { action: 'export-requested' },
    onImport: { action: 'import-requested' },
  },
  args: {
    width: 800,
    height: 600,
    theme: 'light',
    interactive: true,
    showMinimap: true,
    showControls: true,
    showLegend: true,
    enableZoom: true,
    enablePan: true,
    enableDrag: true,
    autoLayout: true,
    onNodeClick: action('node-clicked'),
    onNodeHover: action('node-hovered'),
    onNodeDrag: action('node-dragged'),
    onEdgeClick: action('edge-clicked'),
    onGraphUpdate: action('graph-updated'),
    onExport: action('export-requested'),
    onImport: action('import-requested'),
  },
};

export default meta;
type Story = StoryObj<typeof DependencyGraph>;

export const Default: Story = {
  args: {
    data: smallData,
  },
};

export const SmallGraph: Story = {
  args: {
    data: smallData,
  },
  parameters: {
    docs: {
      description: {
        story: 'A small graph with 5 nodes and basic connections, perfect for simple task dependencies.',
      },
    },
  },
};

export const MediumGraph: Story = {
  args: {
    data: mediumData,
  },
  parameters: {
    docs: {
      description: {
        story: 'A medium-sized graph with 15 nodes showing more complex relationships.',
      },
    },
  },
};

export const LargeGraph: Story = {
  args: {
    data: largeData,
  },
  parameters: {
    docs: {
      description: {
        story: 'A large graph with 50 nodes demonstrating performance and scalability.',
      },
    },
  },
};

export const ComplexWorkflow: Story = {
  args: {
    data: complexData,
  },
  parameters: {
    docs: {
      description: {
        story: 'A complex workflow showing different node types (tasks, milestones, blockers) and relationship types.',
      },
    },
  },
};

export const EmptyGraph: Story = {
  args: {
    data: emptyData,
  },
  parameters: {
    docs: {
      description: {
        story: 'An empty graph state, useful for new projects or when all tasks are filtered out.',
      },
    },
  },
};

export const DarkTheme: Story = {
  args: {
    data: complexData,
    theme: 'dark',
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: 'Dark theme variant with adjusted colors for better contrast.',
      },
    },
  },
};

export const ForceLayout: Story = {
  args: {
    data: mediumData,
    layoutConfig: {
      algorithm: 'force',
      spacing: 100,
      iterations: 150,
      gravity: 0.1,
      repulsion: 120,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Force-directed layout that simulates physical forces between nodes.',
      },
    },
  },
};

export const HierarchicalLayout: Story = {
  args: {
    data: mediumData,
    layoutConfig: {
      algorithm: 'hierarchical',
      spacing: 120,
      padding: 80,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Hierarchical layout that organizes nodes in levels based on dependencies.',
      },
    },
  },
};

export const CircularLayout: Story = {
  args: {
    data: smallData,
    layoutConfig: {
      algorithm: 'circular',
      spacing: 100,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Circular layout that arranges nodes in a circle.',
      },
    },
  },
};

export const GridLayout: Story = {
  args: {
    data: mediumData,
    layoutConfig: {
      algorithm: 'grid',
      spacing: 150,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Grid layout that arranges nodes in a regular grid pattern.',
      },
    },
  },
};

export const MinimalView: Story = {
  args: {
    data: smallData,
    showMinimap: false,
    showControls: false,
    showLegend: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Minimal view without controls, minimap, or legend for embedding in other interfaces.',
      },
    },
  },
};

export const ReadOnlyMode: Story = {
  args: {
    data: complexData,
    interactive: false,
    enableZoom: false,
    enablePan: false,
    enableDrag: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Read-only mode with all interactions disabled, useful for reports or presentations.',
      },
    },
  },
};

export const CustomDimensions: Story = {
  args: {
    data: mediumData,
    width: 1000,
    height: 400,
  },
  parameters: {
    docs: {
      description: {
        story: 'Custom dimensions for different container sizes.',
      },
    },
  },
};

export const WithFilters: Story = {
  args: {
    data: complexData,
    filterConfig: {
      nodeTypes: ['task', 'milestone'],
      statuses: ['pending', 'in-progress'],
      priorities: ['high', 'urgent'],
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Graph with applied filters showing only specific node types, statuses, and priorities.',
      },
    },
  },
};

export const AnimationsEnabled: Story = {
  args: {
    data: smallData,
    animationConfig: {
      duration: 500,
      easing: 'ease-in-out',
      enabled: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Graph with smooth animations enabled for layout changes and interactions.',
      },
    },
  },
};

export const PerformanceOptimized: Story = {
  args: {
    data: largeData,
    animationConfig: {
      enabled: false,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Performance-optimized configuration for large graphs with animations disabled.',
      },
    },
  },
};

export const Interactive: Story = {
  args: {
    data: complexData,
    onNodeClick: action('node-clicked'),
    onNodeHover: action('node-hovered'),
    onNodeDrag: action('node-dragged'),
    onEdgeClick: action('edge-clicked'),
    onGraphUpdate: action('graph-updated'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Fully interactive graph with all event handlers enabled. Check the Actions panel for interaction events.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    // This would be used for interaction testing in Storybook
    console.log('Interactive story loaded');
  },
};

export const ResponsiveLayout: Story = {
  args: {
    data: mediumData,
    width: 600,
    height: 400,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Responsive layout optimized for smaller screens.',
      },
    },
  },
};

export const HighContrast: Story = {
  args: {
    data: complexData,
    theme: 'light',
  },
  parameters: {
    docs: {
      description: {
        story: 'High contrast version for better accessibility.',
      },
    },
  },
};

export const PrintFriendly: Story = {
  args: {
    data: mediumData,
    showMinimap: false,
    showControls: false,
    theme: 'light',
  },
  parameters: {
    docs: {
      description: {
        story: 'Print-friendly version with minimal UI elements.',
      },
    },
  },
};