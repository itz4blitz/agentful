/**
 * DragOverlay
 * Custom drag preview component shown during drag operations
 */

import * as React from 'react';
import { DragOverlay as DndKitDragOverlay, useDndContext } from '@dnd-kit/core';
import { useDndStore } from '@/stores/dnd-store';
import type { DragData } from '@/types/dnd';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';

const IconMap: Record<string, React.ComponentType<{ className?: string }>> = LucideIcons;

export interface DragOverlayProps {
  className?: string;
}

/**
 * DragOverlayContent
 * Renders the content of the drag overlay based on drag data
 */
const DragOverlayContent = React.memo(({ dragData }: { dragData: DragData | null }) => {
  if (!dragData) {
    return null;
  }

  // Palette component drag
  if (dragData.type === 'palette' && dragData.component) {
    const { component } = dragData;
    const IconComponent = IconMap[component.icon] || LucideIcons.Square;

    return (
      <div className="flex items-center gap-3 p-3 bg-popover border border-border rounded-lg shadow-lg">
        <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
          <IconComponent className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{component.name}</p>
          <p className="text-xs text-muted-foreground truncate">{component.description}</p>
        </div>
      </div>
    );
  }

  // Canvas element drag (including layers bar)
  if ((dragData.type === 'canvas' || dragData.type === 'reorder') && dragData.element) {
    const { element } = dragData;

    // Get element name for display
    const getElementName = () => {
      if (element.content && element.content.trim()) {
        const preview = element.content.trim().slice(0, 25);
        return element.content.length > 25 ? `${preview}...` : preview;
      }
      if (element.attributes.id) {
        return `#${element.attributes.id}`;
      }
      if (element.attributes.class) {
        const classes = element.attributes.class.split(' ')[0];
        return `.${classes}`;
      }
      return element.tagName.toUpperCase();
    };

    // Get icon based on tag name
    const getElementIcon = () => {
      const tagName = element.tagName.toLowerCase();
      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'a'].includes(tagName)) {
        return LucideIcons.Type;
      }
      if (tagName === 'img') {
        return LucideIcons.Image;
      }
      if (tagName === 'button') {
        return LucideIcons.Square;
      }
      return LucideIcons.Box;
    };

    const IconComponent = getElementIcon();

    return (
      <div className="p-3 bg-popover border border-border rounded-lg shadow-lg min-w-[200px]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-muted rounded flex items-center justify-center">
            <IconComponent className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{getElementName()}</p>
            <p className="text-xs text-muted-foreground">Layer</p>
          </div>
        </div>
      </div>
    );
  }

  // Generic drag preview
  return (
    <div className="p-3 bg-popover border border-border rounded-lg shadow-lg">
      <div className="flex items-center gap-2">
        <LucideIcons.GripVertical className="w-4 h-4 text-muted-foreground" />
        <p className="text-sm font-medium">Dragging</p>
      </div>
    </div>
  );
});

DragOverlayContent.displayName = 'DragOverlayContent';

/**
 * GlobalDragOverlay Component
 * Uses DndKit's DragOverlay to show a preview during drag operations
 */
export const GlobalDragOverlay = React.forwardRef<HTMLDivElement, DragOverlayProps>(
  ({ className }, ref) => {
    const { dragData } = useDndStore();
    const { active } = useDndContext();

    return (
      <DndKitDragOverlay
        dropAnimation={{
          duration: 200,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}
      >
        {active ? (
          <div
            ref={ref}
            className={cn('cursor-grabbing', className)}
            data-dnd-overlay="true"
          >
            <DragOverlayContent dragData={dragData} />
          </div>
        ) : null}
      </DndKitDragOverlay>
    );
  }
);

GlobalDragOverlay.displayName = 'GlobalDragOverlay';


