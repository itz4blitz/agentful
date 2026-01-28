/**
 * ElementSelector
 * Click-to-select elements with hover detection and visual indicators
 */

import * as React from 'react';
import { useCanvasStore } from '@/stores/canvas-store';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export interface ElementSelectorProps {
  className?: string;
}

export const ElementSelector = React.forwardRef<HTMLDivElement, ElementSelectorProps>(
  ({ className }, ref) => {
    const { hoveredElement, selectedElement, setSelectedElement } = useCanvasStore();

    return (
      <div
        ref={ref}
        className={cn('flex items-center gap-2', className)}
        role="toolbar"
        aria-label="Element selector"
      >
        {/* Selected element indicator */}
        {selectedElement && (
          <div className="flex items-center gap-2">
            <Badge variant="default" className="text-xs">
              Selected: {selectedElement.element?.tagName || 'Element'}
            </Badge>
            <button
              type="button"
              onClick={() => setSelectedElement(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
              aria-label="Clear selection"
            >
              Clear
            </button>
          </div>
        )}

        {/* Hovered element indicator */}
        {hoveredElement && hoveredElement !== selectedElement?.elementId && (
          <Badge variant="outline" className="text-xs">
            Hovering: {hoveredElement}
          </Badge>
        )}

        {/* Instructions */}
        {!selectedElement && !hoveredElement && (
          <span className="text-xs text-muted-foreground">
            Click on elements in the canvas to select them
          </span>
        )}
      </div>
    );
  }
);

ElementSelector.displayName = 'ElementSelector';
