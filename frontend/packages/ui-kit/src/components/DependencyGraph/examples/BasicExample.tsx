import React, { useState, useCallback } from 'react';
import { DependencyGraph } from '../DependencyGraph';
import type { GraphData, GraphNode, GraphEdge, GraphFilter } from '../types';

// Example data for a software development project
const exampleData: GraphData = {
  nodes: [
    {
      id: 'requirements',
      label: 'Requirements',
      type: 'task',
      status: 'completed',
      priority: 'high',
      position: { x: 0, y: 0 },
      size: { width: 100, height: 50 },
      metadata: {
        assignee: 'Product Manager',
        dueDate: '2024-01-15',
        description: 'Gather and document requirements',
        tags: ['planning', 'documentation'],
        estimatedHours: 16,
        actualHours: 12,
      },
    },
    {
      id: 'design',
      label: 'UI Design',
      type: 'task',
      status: 'completed',
      priority: 'high',
      position: { x: 200, y: 0 },
      size: { width: 100, height: 50 },
      metadata: {
        assignee: 'UI Designer',
        dueDate: '2024-01-20',
        description: 'Create wireframes and mockups',
        tags: ['design', 'ui'],
        estimatedHours: 24,
        actualHours: 20,
      },
    },
    {
      id: 'api-spec',
      label: 'API Spec',
      type: 'task',
      status: 'in-progress',
      priority: 'high',
      position: { x: 400, y: 0 },
      size: { width: 100, height: 50 },
      metadata: {
        assignee: 'Backend Dev',
        dueDate: '2024-01-25',
        description: 'Define API endpoints and schema',
        tags: ['backend', 'api'],
        estimatedHours: 20,
        actualHours: 15,
      },
    },
    {
      id: 'frontend-dev',
      label: 'Frontend Dev',
      type: 'task',
      status: 'pending',
      priority: 'medium',
      position: { x: 0, y: 150 },
      size: { width: 120, height: 50 },
      metadata: {
        assignee: 'Frontend Dev',
        dueDate: '2024-02-01',
        description: 'Implement UI components',
        tags: ['frontend', 'react'],
        estimatedHours: 40,
      },
    },
    {
      id: 'backend-dev',
      label: 'Backend Dev',
      type: 'task',
      status: 'pending',
      priority: 'medium',
      position: { x: 200, y: 150 },
      size: { width: 120, height: 50 },
      metadata: {
        assignee: 'Backend Dev',
        dueDate: '2024-02-01',
        description: 'Implement API endpoints',
        tags: ['backend', 'nodejs'],
        estimatedHours: 35,
      },
    },
    {
      id: 'testing',
      label: 'Testing',
      type: 'task',
      status: 'pending',
      priority: 'medium',
      position: { x: 400, y: 150 },
      size: { width: 100, height: 50 },
      metadata: {
        assignee: 'QA Engineer',
        dueDate: '2024-02-05',
        description: 'Test all functionality',
        tags: ['testing', 'qa'],
        estimatedHours: 30,
      },
    },
    {
      id: 'deployment',
      label: 'Deployment',
      type: 'milestone',
      status: 'pending',
      priority: 'urgent',
      position: { x: 200, y: 300 },
      size: { width: 80, height: 80 },
      metadata: {
        assignee: 'DevOps',
        dueDate: '2024-02-10',
        description: 'Deploy to production',
        tags: ['deployment', 'production'],
        estimatedHours: 8,
      },
    },
    {
      id: 'security-review',
      label: 'Security Review',
      type: 'blocker',
      status: 'blocked',
      priority: 'urgent',
      position: { x: 400, y: 300 },
      size: { width: 90, height: 90 },
      metadata: {
        assignee: 'Security Team',
        dueDate: '2024-02-08',
        description: 'Security audit required',
        tags: ['security', 'audit'],
        estimatedHours: 16,
      },
    },
  ],
  edges: [
    {
      id: 'req-design',
      source: 'requirements',
      target: 'design',
      type: 'dependency',
      label: 'enables',
      strength: 1.0,
    },
    {
      id: 'req-api',
      source: 'requirements',
      target: 'api-spec',
      type: 'dependency',
      label: 'defines',
      strength: 0.9,
    },
    {
      id: 'design-frontend',
      source: 'design',
      target: 'frontend-dev',
      type: 'dependency',
      label: 'guides',
      strength: 0.8,
    },
    {
      id: 'api-backend',
      source: 'api-spec',
      target: 'backend-dev',
      type: 'dependency',
      label: 'implements',
      strength: 1.0,
    },
    {
      id: 'frontend-testing',
      source: 'frontend-dev',
      target: 'testing',
      type: 'dependency',
      label: 'ready for',
      strength: 0.7,
    },
    {
      id: 'backend-testing',
      source: 'backend-dev',
      target: 'testing',
      type: 'dependency',
      label: 'ready for',
      strength: 0.7,
    },
    {
      id: 'testing-deployment',
      source: 'testing',
      target: 'deployment',
      type: 'dependency',
      label: 'enables',
      strength: 1.0,
    },
    {
      id: 'security-deployment',
      source: 'security-review',
      target: 'deployment',
      type: 'blocks',
      label: 'blocks',
      strength: 1.0,
    },
    {
      id: 'backend-security',
      source: 'backend-dev',
      target: 'security-review',
      type: 'related',
      label: 'triggers',
      strength: 0.6,
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

export const BasicExample: React.FC = () => {
  const [graphData, setGraphData] = useState<GraphData>(exampleData);
  const [filter, setFilter] = useState<GraphFilter>({});

  const handleNodeClick = useCallback((node: GraphNode) => {
    console.log('Node clicked:', node);
    alert(`Clicked on ${node.label}\nStatus: ${node.status}\nAssignee: ${node.metadata?.assignee}`);
  }, []);

  const handleNodeHover = useCallback((node: GraphNode | null) => {
    if (node) {
      console.log('Node hovered:', node.label);
    }
  }, []);

  const handleNodeDrag = useCallback((node: GraphNode, newPosition: { x: number; y: number }) => {
    console.log('Node dragged:', node.label, 'to', newPosition);
    
    // Update the node position in the graph data
    setGraphData(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => 
        n.id === node.id 
          ? { ...n, position: newPosition }
          : n
      ),
    }));
  }, []);

  const handleEdgeClick = useCallback((edge: GraphEdge) => {
    console.log('Edge clicked:', edge);
    alert(`Edge: ${edge.source} → ${edge.target}\nType: ${edge.type}`);
  }, []);

  const handleGraphUpdate = useCallback((newData: GraphData) => {
    console.log('Graph updated:', newData);
    setGraphData(newData);
  }, []);

  const handleExport = useCallback((format: 'json' | 'svg' | 'png') => {
    console.log('Export requested:', format);
    
    if (format === 'json') {
      const dataStr = JSON.stringify(graphData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `graph-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      alert(`Export to ${format} would be implemented here`);
    }
  }, [graphData]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            setGraphData(data);
          } catch (error) {
            alert('Error parsing JSON file');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, []);

  return (
    <div className="w-full">
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Software Development Project</h3>
        <p className="text-sm text-gray-600 mb-4">
          This example shows a typical software development workflow with dependencies between tasks.
          Click on nodes to see details, drag them to rearrange, and use the controls to explore different layouts.
        </p>
        
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span>Task ({graphData.nodes.filter(n => n.type === 'task').length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span>Milestone ({graphData.nodes.filter(n => n.type === 'milestone').length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded transform rotate-45"></div>
            <span>Blocker ({graphData.nodes.filter(n => n.type === 'blocker').length})</span>
          </div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg">
        <DependencyGraph
          data={graphData}
          width={800}
          height={600}
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
          onNodeDrag={handleNodeDrag}
          onEdgeClick={handleEdgeClick}
          onGraphUpdate={handleGraphUpdate}
          onExport={handleExport}
          onImport={handleImport}
          interactive={true}
          showMinimap={true}
          showControls={true}
          showLegend={true}
          enableZoom={true}
          enablePan={true}
          enableDrag={true}
          autoLayout={true}
          layoutConfig={{
            algorithm: 'hierarchical',
            spacing: 120,
            padding: 80,
          }}
          animationConfig={{
            duration: 300,
            easing: 'ease-in-out',
            enabled: true,
          }}
        />
      </div>

      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold mb-2">Instructions:</h4>
        <ul className="text-sm space-y-1">
          <li>• Click on nodes to see detailed information</li>
          <li>• Drag nodes to rearrange the layout</li>
          <li>• Use mouse wheel or controls to zoom in/out</li>
          <li>• Click and drag the background to pan</li>
          <li>• Use the controls panel to change layouts</li>
          <li>• Export/import graph data using the controls</li>
          <li>• Use the minimap for navigation in large graphs</li>
        </ul>
      </div>
    </div>
  );
};

export default BasicExample;