# DependencyGraph Component

A comprehensive, interactive dependency graph component for visualizing task dependencies with advanced features like multiple layouts, real-time updates, and professional animations.

## Features

- **Interactive Visualization**: Click, hover, and drag interactions
- **Multiple Layout Algorithms**: Force-directed, hierarchical, circular, and grid layouts
- **Real-time Updates**: Dynamic data updates with smooth animations
- **Zoom and Pan**: Full viewport control with mouse and keyboard
- **Minimap Navigation**: Overview map for large graphs
- **Export/Import**: JSON, SVG, and PNG export capabilities
- **Filtering**: Advanced filtering by node type, status, priority, and tags
- **Accessibility**: Full keyboard navigation and screen reader support
- **Performance Optimized**: Viewport culling and efficient rendering
- **Customizable**: Extensive theming and configuration options

## Installation

```bash
npm install @claudia/ui-kit
```

## Basic Usage

```tsx
import { DependencyGraph } from '@claudia/ui-kit';
import type { GraphData } from '@claudia/ui-kit';

const graphData: GraphData = {
  nodes: [
    {
      id: 'task-1',
      label: 'Frontend Setup',
      type: 'task',
      status: 'completed',
      priority: 'high',
      position: { x: 0, y: 0 },
      size: { width: 100, height: 50 },
      metadata: {
        assignee: 'Alice',
        dueDate: '2024-01-15',
        description: 'Set up frontend environment',
        tags: ['frontend', 'setup'],
        estimatedHours: 8,
      },
    },
    {
      id: 'task-2',
      label: 'API Integration',
      type: 'task',
      status: 'in-progress',
      priority: 'medium',
      position: { x: 200, y: 0 },
      size: { width: 100, height: 50 },
      metadata: {
        assignee: 'Bob',
        dueDate: '2024-01-20',
        description: 'Integrate with backend API',
        tags: ['api', 'integration'],
        estimatedHours: 12,
      },
    },
  ],
  edges: [
    {
      id: 'edge-1',
      source: 'task-1',
      target: 'task-2',
      type: 'dependency',
      label: 'depends on',
      strength: 1.0,
    },
  ],
};

function MyComponent() {
  return (
    <DependencyGraph
      data={graphData}
      width={800}
      height={600}
      onNodeClick={(node) => console.log('Node clicked:', node)}
      onNodeDrag={(node, position) => console.log('Node dragged:', node, position)}
      onEdgeClick={(edge) => console.log('Edge clicked:', edge)}
    />
  );
}
```

## Props

### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `data` | `GraphData` | Graph data containing nodes and edges |

### Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `width` | `number` | `800` | Width of the graph container |
| `height` | `number` | `600` | Height of the graph container |
| `className` | `string` | - | Additional CSS classes |
| `interactive` | `boolean` | `true` | Enable interactive features |
| `showMinimap` | `boolean` | `true` | Show minimap for navigation |
| `showControls` | `boolean` | `true` | Show control panel |
| `showLegend` | `boolean` | `true` | Show legend |
| `enableZoom` | `boolean` | `true` | Enable zoom functionality |
| `enablePan` | `boolean` | `true` | Enable pan functionality |
| `enableDrag` | `boolean` | `true` | Enable drag functionality |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'light'` | Visual theme |
| `autoLayout` | `boolean` | `true` | Automatically apply layout |

### Event Handlers

| Prop | Type | Description |
|------|------|-------------|
| `onNodeClick` | `(node: GraphNode) => void` | Called when a node is clicked |
| `onNodeHover` | `(node: GraphNode \| null) => void` | Called when a node is hovered |
| `onNodeDrag` | `(node: GraphNode, position: {x: number, y: number}) => void` | Called when a node is dragged |
| `onEdgeClick` | `(edge: GraphEdge) => void` | Called when an edge is clicked |
| `onGraphUpdate` | `(data: GraphData) => void` | Called when graph data is updated |
| `onExport` | `(format: 'json' \| 'svg' \| 'png') => void` | Called when export is requested |
| `onImport` | `(data: GraphData) => void` | Called when import is requested |

### Configuration Objects

#### Layout Configuration

```tsx
const layoutConfig = {
  algorithm: 'force', // 'force' | 'hierarchical' | 'circular' | 'grid'
  spacing: 100,
  padding: 50,
  iterations: 100,
  gravity: 0.1,
  repulsion: 120,
  attraction: 0.1,
};
```

#### Filter Configuration

```tsx
const filterConfig = {
  nodeTypes: ['task', 'milestone'], // Filter by node types
  statuses: ['pending', 'in-progress'], // Filter by status
  priorities: ['high', 'urgent'], // Filter by priority
  tags: ['frontend', 'backend'], // Filter by tags
  search: 'search term', // Text search
  dateRange: {
    from: '2024-01-01',
    to: '2024-12-31',
  },
};
```

#### Animation Configuration

```tsx
const animationConfig = {
  duration: 300,
  easing: 'ease-in-out',
  enabled: true,
};
```

## Data Types

### GraphNode

```tsx
interface GraphNode {
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
```

### GraphEdge

```tsx
interface GraphEdge {
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
```

### GraphData

```tsx
interface GraphData {
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
```

## Layout Algorithms

### Force-Directed Layout

Simulates physical forces between nodes to create natural-looking layouts:

```tsx
<DependencyGraph
  data={graphData}
  layoutConfig={{
    algorithm: 'force',
    spacing: 100,
    iterations: 150,
    gravity: 0.1,
    repulsion: 120,
    attraction: 0.1,
  }}
/>
```

### Hierarchical Layout

Organizes nodes in levels based on dependencies:

```tsx
<DependencyGraph
  data={graphData}
  layoutConfig={{
    algorithm: 'hierarchical',
    spacing: 120,
    padding: 80,
  }}
/>
```

### Circular Layout

Arranges nodes in a circle:

```tsx
<DependencyGraph
  data={graphData}
  layoutConfig={{
    algorithm: 'circular',
    spacing: 100,
  }}
/>
```

### Grid Layout

Arranges nodes in a regular grid:

```tsx
<DependencyGraph
  data={graphData}
  layoutConfig={{
    algorithm: 'grid',
    spacing: 150,
  }}
/>
```

## Interaction Patterns

### Node Interactions

- **Click**: Select and view details
- **Double-click**: Edit node (if enabled)
- **Drag**: Move node position
- **Hover**: Show tooltip with details
- **Right-click**: Context menu (if enabled)

### Edge Interactions

- **Click**: Select edge
- **Hover**: Show edge details
- **Right-click**: Context menu (if enabled)

### Viewport Interactions

- **Mouse wheel**: Zoom in/out
- **Click and drag**: Pan viewport
- **Double-click**: Reset zoom
- **Keyboard shortcuts**: Various actions

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + +` | Zoom in |
| `Ctrl/Cmd + -` | Zoom out |
| `Ctrl/Cmd + 0` | Reset zoom |
| `Ctrl/Cmd + F` | Fit to content |
| `Delete` | Delete selected items |
| `Ctrl/Cmd + A` | Select all |
| `Ctrl/Cmd + C` | Copy selected |
| `Ctrl/Cmd + V` | Paste |

## Accessibility

The component follows WCAG 2.1 AA guidelines:

- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: ARIA labels and roles
- **Color Contrast**: High contrast ratios
- **Focus Management**: Visible focus indicators
- **Alternative Text**: Descriptive labels

## Performance Optimization

### Viewport Culling

Only renders visible nodes and edges:

```tsx
<DependencyGraph
  data={largeGraphData}
  // Automatically enabled for large datasets
/>
```

### Animation Control

Disable animations for better performance:

```tsx
<DependencyGraph
  data={graphData}
  animationConfig={{
    enabled: false,
  }}
/>
```

### Lazy Loading

Load data progressively for very large graphs:

```tsx
// Implementation depends on your data source
const [graphData, setGraphData] = useState(initialData);

useEffect(() => {
  // Load additional data based on viewport
  loadDataForViewport(viewport);
}, [viewport]);
```

## Theming

### Light Theme (Default)

```tsx
<DependencyGraph
  data={graphData}
  theme="light"
/>
```

### Dark Theme

```tsx
<DependencyGraph
  data={graphData}
  theme="dark"
/>
```

### Auto Theme

Follows system preference:

```tsx
<DependencyGraph
  data={graphData}
  theme="auto"
/>
```

## Export/Import

### Export Data

```tsx
const handleExport = (format: 'json' | 'svg' | 'png') => {
  if (format === 'json') {
    const dataStr = JSON.stringify(graphData, null, 2);
    downloadFile(dataStr, 'graph.json', 'application/json');
  }
  // SVG and PNG exports handled internally
};

<DependencyGraph
  data={graphData}
  onExport={handleExport}
/>
```

### Import Data

```tsx
const handleImport = (importedData: GraphData) => {
  // Validate and set new data
  if (validateGraphData(importedData)) {
    setGraphData(importedData);
  }
};

<DependencyGraph
  data={graphData}
  onImport={handleImport}
/>
```

## Advanced Usage

### Custom Node Rendering

```tsx
// Custom node types can be added by extending the component
const customNodeTypes = {
  'custom-task': CustomTaskNode,
  'custom-milestone': CustomMilestoneNode,
};
```

### Real-time Updates

```tsx
// Update graph data in real-time
const [graphData, setGraphData] = useState(initialData);

useEffect(() => {
  const subscription = subscribeToUpdates((update) => {
    setGraphData(prevData => applyUpdate(prevData, update));
  });
  
  return () => subscription.unsubscribe();
}, []);
```

### Integration with State Management

```tsx
// Redux/Zustand integration
const graphData = useSelector(selectGraphData);
const dispatch = useDispatch();

const handleGraphUpdate = (newData: GraphData) => {
  dispatch(updateGraphData(newData));
};
```

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Performance Considerations

- Use `React.memo` for large datasets
- Implement virtual scrolling for huge graphs
- Consider server-side layout calculation
- Use web workers for complex computations

## Troubleshooting

### Common Issues

1. **Layout not updating**: Ensure `autoLayout` is enabled
2. **Performance issues**: Disable animations or use viewport culling
3. **Data not rendering**: Validate data structure with `validateGraphData`
4. **Interactions not working**: Check `interactive` prop is true

### Debug Mode

Enable debug logging:

```tsx
<DependencyGraph
  data={graphData}
  // Add debug prop when available
  debug={true}
/>
```

## Contributing

See the main UI kit documentation for contribution guidelines.

## License

Part of the @claudia/ui-kit package - see package.json for license information.