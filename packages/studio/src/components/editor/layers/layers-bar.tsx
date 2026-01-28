/**
 * LayersBar
 * Top bar showing all elements on the canvas (layers panel)
 */

import * as React from 'react';
import { useCanvasStore } from '@/stores/canvas-store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LayerItem } from './layer-item';
import { ChevronDown, Layers } from 'lucide-react';
import { flattenElements } from '@/lib/canvas-utils';

export interface LayersBarProps {
  className?: string;
}

export const LayersBar = React.memo(({ className }: LayersBarProps) => {
  const [isOpen, setIsOpen] = React.useState(true);
  const { elements, selectedElement, removeElement } = useCanvasStore();

  // Flatten all elements into a single list
  const flattenedElements = React.useMemo(() => {
    return flattenElements(elements);
  }, [elements]);

  const handleSelectElement = React.useCallback(
    (elementId: string) => {
      // TODO: Implement selection logic
      console.log('Select element:', elementId);
    },
    []
  );

  const handleDeleteElement = React.useCallback(
    (elementId: string) => {
      removeElement(elementId);
    },
    [removeElement]
  );

  const isEmpty = flattenedElements.length === 0;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div
        className={cn(
          'border-b bg-background',
          isOpen ? 'min-h-0' : 'h-auto',
          className
        )}
      >
        {/* Header with Toggle */}
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Layers</h3>
            <span className="text-xs text-muted-foreground">
              ({flattenedElements.length})
            </span>
          </div>

          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label={isOpen ? 'Collapse layers' : 'Expand layers'}
            >
              <ChevronDown
                className={cn(
                  'w-4 h-4 transition-transform',
                  isOpen && 'transform rotate-180'
                )}
              />
            </Button>
          </CollapsibleTrigger>
        </div>

        {/* Collapsible Content */}
        <CollapsibleContent>
          <div className="min-h-0">
            {isEmpty ? (
              <div className="flex items-center justify-center py-8 px-4">
                <p className="text-xs text-muted-foreground text-center">
                  No elements on canvas yet. Drag components from the palette to
                  get started.
                </p>
              </div>
            ) : (
              <ScrollArea className="h-auto max-h-32">
                <div className="flex gap-2 px-4 py-2">
                  {flattenedElements.map((element) => (
                    <div
                      key={element.id}
                      className="flex-shrink-0"
                      style={{ minWidth: '140px', maxWidth: '200px' }}
                    >
                      <LayerItem
                        element={element}
                        isSelected={
                          selectedElement?.elementId === element.id
                        }
                        onSelect={handleSelectElement}
                        onDelete={handleDeleteElement}
                      />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
});

LayersBar.displayName = 'LayersBar';
