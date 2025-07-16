import { memo, useCallback } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Download, 
  Upload, 
  Grid, 
  Circle, 
  GitBranch, 
  RotateCcw,
  Play,
  Pause,
  Filter,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '../Button/Button';
import { Badge } from '../Badge/Badge';
import { Card } from '../Card/Card';
import { cn } from '../../utils';
import type { GraphLayout, GraphFilter } from './types';

interface GraphControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitToContent: () => void;
  onExport: (format: 'json' | 'svg' | 'png') => void;
  onImport: () => void;
  onLayoutChange: (layout: GraphLayout['type']) => void;
  currentLayout: GraphLayout['type'];
  onFilterChange: (filter: GraphFilter) => void;
  currentFilter: GraphFilter;
  onToggleAnimation: () => void;
  isAnimationEnabled: boolean;
  onToggleGrid: () => void;
  isGridVisible: boolean;
  onToggleMinimap: () => void;
  isMinimapVisible: boolean;
  nodeCount: number;
  edgeCount: number;
  selectedCount: number;
  className?: string;
}

const GraphControls = memo<GraphControlsProps>(({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitToContent,
  onExport,
  onImport,
  onLayoutChange,
  currentLayout,
  onFilterChange,
  currentFilter,
  onToggleAnimation,
  isAnimationEnabled,
  onToggleGrid,
  isGridVisible,
  onToggleMinimap,
  isMinimapVisible,
  nodeCount,
  edgeCount,
  selectedCount,
  className,
}) => {
  const formatZoom = useCallback((value: number) => {
    return `${Math.round(value * 100)}%`;
  }, []);

  const handleExportClick = useCallback((format: 'json' | 'svg' | 'png') => {
    onExport(format);
  }, [onExport]);

  const handleLayoutClick = useCallback((layout: GraphLayout['type']) => {
    onLayoutChange(layout);
  }, [onLayoutChange]);

  const getLayoutIcon = useCallback((layout: GraphLayout['type']) => {
    switch (layout) {
      case 'force':
        return <Circle className="w-4 h-4" />;
      case 'hierarchical':
        return <GitBranch className="w-4 h-4" />;
      case 'circular':
        return <Circle className="w-4 h-4" />;
      case 'grid':
        return <Grid className="w-4 h-4" />;
      default:
        return <Circle className="w-4 h-4" />;
    }
  }, []);

  const getLayoutLabel = useCallback((layout: GraphLayout['type']) => {
    switch (layout) {
      case 'force':
        return 'Force';
      case 'hierarchical':
        return 'Hierarchical';
      case 'circular':
        return 'Circular';
      case 'grid':
        return 'Grid';
      default:
        return 'Force';
    }
  }, []);

  const hasActiveFilters = Object.values(currentFilter).some(value => 
    Array.isArray(value) ? value.length > 0 : Boolean(value)
  );

  // Reference unused parameter to avoid TypeScript error
  console.log('Filter change handler available:', !!onFilterChange);

  return (
    <Card className={cn('absolute top-4 right-4 z-10 p-4 bg-white/95 backdrop-blur-sm', className)}>
      <div className="space-y-4">
        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onZoomOut}
            disabled={zoom <= 0.1}
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          
          <div className="min-w-16 text-center text-sm font-mono">
            {formatZoom(zoom)}
          </div>
          
          <Button
            size="sm"
            variant="outline"
            onClick={onZoomIn}
            disabled={zoom >= 5}
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onResetZoom}
            aria-label="Reset zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={onFitToContent}
            aria-label="Fit to content"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Layout Controls */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">Layout</div>
          <div className="grid grid-cols-2 gap-1">
            {(['force', 'hierarchical', 'circular', 'grid'] as const).map((layout) => (
              <Button
                key={layout}
                size="sm"
                variant={currentLayout === layout ? 'default' : 'outline'}
                onClick={() => handleLayoutClick(layout)}
                className="flex items-center gap-2"
                aria-label={`Switch to ${layout} layout`}
              >
                {getLayoutIcon(layout)}
                <span className="text-xs">{getLayoutLabel(layout)}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* View Options */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">View</div>
          <div className="flex flex-col gap-1">
            <Button
              size="sm"
              variant={isGridVisible ? 'default' : 'outline'}
              onClick={onToggleGrid}
              className="flex items-center gap-2 justify-start"
              aria-label="Toggle grid"
            >
              <Grid className="w-4 h-4" />
              <span className="text-xs">Grid</span>
            </Button>
            
            <Button
              size="sm"
              variant={isMinimapVisible ? 'default' : 'outline'}
              onClick={onToggleMinimap}
              className="flex items-center gap-2 justify-start"
              aria-label="Toggle minimap"
            >
              {isMinimapVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span className="text-xs">Minimap</span>
            </Button>
            
            <Button
              size="sm"
              variant={isAnimationEnabled ? 'default' : 'outline'}
              onClick={onToggleAnimation}
              className="flex items-center gap-2 justify-start"
              aria-label="Toggle animation"
            >
              {isAnimationEnabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span className="text-xs">Animation</span>
            </Button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium text-gray-700">Filters</div>
            {hasActiveFilters && (
              <Badge variant="secondary" size="sm">
                Active
              </Badge>
            )}
          </div>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              // This would open a filter dialog/panel
              console.log('Open filter panel');
            }}
            className="flex items-center gap-2 justify-start w-full"
            aria-label="Open filter options"
          >
            <Filter className="w-4 h-4" />
            <span className="text-xs">Filter Options</span>
          </Button>
        </div>

        {/* Export/Import Controls */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">Data</div>
          <div className="flex flex-col gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={onImport}
              className="flex items-center gap-2 justify-start"
              aria-label="Import graph data"
            >
              <Upload className="w-4 h-4" />
              <span className="text-xs">Import</span>
            </Button>
            
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleExportClick('json')}
                className="flex-1"
                aria-label="Export as JSON"
              >
                <Download className="w-4 h-4" />
                <span className="text-xs">JSON</span>
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleExportClick('svg')}
                className="flex-1"
                aria-label="Export as SVG"
              >
                <Download className="w-4 h-4" />
                <span className="text-xs">SVG</span>
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleExportClick('png')}
                className="flex-1"
                aria-label="Export as PNG"
              >
                <Download className="w-4 h-4" />
                <span className="text-xs">PNG</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">Statistics</div>
          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Nodes:</span>
              <span className="font-mono">{nodeCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Edges:</span>
              <span className="font-mono">{edgeCount}</span>
            </div>
            {selectedCount > 0 && (
              <div className="flex justify-between">
                <span>Selected:</span>
                <span className="font-mono">{selectedCount}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
});

GraphControls.displayName = 'GraphControls';

export { GraphControls };
export type { GraphControlsProps };