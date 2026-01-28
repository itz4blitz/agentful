/**
 * LayerItem
 * Individual layer item in the layers bar
 */

import * as React from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { CanvasElement } from '@/types/canvas';
import type { DragData } from '@/types/dnd';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Trash2, Type, Image, Box, Square, Circle, GripVertical } from 'lucide-react';

export interface LayerItemProps {
  element: CanvasElement;
  isSelected: boolean;
  onSelect: (elementId: string) => void;
  onDelete: (elementId: string) => void;
}

const ELEMENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  h1: Type,
  h2: Type,
  h3: Type,
  h4: Type,
  h5: Type,
  h6: Type,
  p: Type,
  span: Type,
  a: Type,
  img: Image,
  div: Box,
  section: Box,
  article: Box,
  header: Box,
  footer: Box,
  nav: Box,
  aside: Box,
  button: Square,
  circle: Circle,
};

const getElementName = (element: CanvasElement): string => {
  // If element has content, use a preview of it
  if (element.content && element.content.trim()) {
    const preview = element.content.trim().slice(0, 20);
    return element.content.length > 20 ? `${preview}...` : preview;
  }

  // If element has an ID or class attribute, use that
  if (element.attributes.id) {
    return `#${element.attributes.id}`;
  }

  if (element.attributes.class) {
    const classes = element.attributes.class.split(' ')[0];
    return `.${classes}`;
  }

  // Default to tag name
  return element.tagName.toUpperCase();
};

export const LayerItem = React.memo(
  ({ element, isSelected, onSelect, onDelete }: LayerItemProps) => {
    // Setup draggable functionality
    const {
      attributes,
      listeners,
      setNodeRef,
      isDragging,
    } = useDraggable({
      id: `layer-${element.id}`,
      data: {
        type: 'canvas',
        source: 'canvas',
        elementId: element.id,
        element: element,
      } as DragData,
    });

    const handleClick = React.useCallback(() => {
      onSelect(element.id);
    }, [element.id, onSelect]);

    const handleDelete = React.useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(element.id);
      },
      [element.id, onDelete]
    );

    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(element.id);
        }
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          onDelete(element.id);
        }
      },
      [element.id, onSelect, onDelete]
    );

    const IconComponent =
      ELEMENT_ICONS[element.tagName.toLowerCase()] || Square;

    return (
      <div
        ref={setNodeRef}
        className={cn(
          'group relative flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200 cursor-pointer border border-transparent',
          'hover:bg-accent hover:border-border',
          isSelected && 'bg-accent border-border shadow-sm',
          isDragging && 'opacity-50 cursor-grabbing'
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label={`Select ${getElementName(element)}`}
        aria-selected={isSelected}
        {...listeners}
        {...attributes}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        {/* Drag Handle Indicator */}
        <div
          className={cn(
            'flex-shrink-0 text-muted-foreground opacity-0 group-hover:opacity-50 transition-opacity',
            isDragging && 'opacity-100'
          )}
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Icon */}
        <div
          className={cn(
            'flex-shrink-0 w-6 h-6 flex items-center justify-center rounded',
            'bg-muted/50 group-hover:bg-muted transition-colors'
          )}
        >
          <IconComponent className="w-3.5 h-3.5 text-muted-foreground" />
        </div>

        {/* Element Name */}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              'text-xs font-medium truncate',
              isSelected ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            {getElementName(element)}
          </p>
        </div>

        {/* Delete Button */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'flex-shrink-0 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity',
            'hover:bg-destructive/10 hover:text-destructive'
          )}
          onClick={handleDelete}
          aria-label={`Delete ${getElementName(element)}`}
          title="Delete element"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    );
  }
);

LayerItem.displayName = 'LayerItem';
