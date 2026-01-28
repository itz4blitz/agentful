/**
 * DraggableComponent
 * Wrapper component for making elements draggable
 */

import * as React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useDndStore } from '@/stores/dnd-store';
import type { DragData } from '@/types/dnd';
import { cn } from '@/lib/utils';

export interface DraggableComponentProps {
  id: string;
  children: React.ReactNode;
  data: DragData;
  disabled?: boolean;
  dragHandle?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

/**
 * DraggableComponent
 */
export const DraggableComponent = React.forwardRef<HTMLDivElement, DraggableComponentProps>(
  (
    {
      id,
      children,
      data,
      disabled = false,
      dragHandle = false,
      className,
      style,
      onDragStart,
      onDragEnd,
    },
    ref
  ) => {
    const {
      attributes,
      isDragging,
      listeners,
      setNodeRef,
      transform,
    } = useDraggable({
      id,
      data,
      disabled,
    });

    const internalRef = React.useRef<HTMLDivElement>(null);

    // Combine refs
    React.useImperativeHandle(ref, () => internalRef.current!);
    React.useEffect(() => {
      if (internalRef.current) {
        setNodeRef(internalRef.current);
      }
    }, [setNodeRef]);

    // Handle drag start
    React.useEffect(() => {
      if (isDragging) {
        onDragStart?.();
      } else {
        onDragEnd?.();
      }
    }, [isDragging, onDragStart, onDragEnd]);

    // Update dragged element in store
    React.useEffect(() => {
      if (isDragging && internalRef.current) {
        useDndStore.getState().setDraggedElement(internalRef.current);
      }
    }, [isDragging]);

    // Calculate transform style
    const transformStyle = transform
      ? {
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
          opacity: isDragging ? 0.5 : 1,
        }
      : undefined;

    return (
      <div
        ref={internalRef}
        style={{ ...transformStyle, ...style }}
        className={cn(
          dragHandle ? 'cursor-grab active:cursor-grabbing' : '',
          isDragging && 'opacity-50',
          className
        )}
        {...(!disabled && !dragHandle ? listeners : undefined)}
        {...attributes}
        data-draggable="true"
        data-draggable-id={id}
      >
        {children}
      </div>
    );
  }
);

DraggableComponent.displayName = 'DraggableComponent';

/**
 * DragHandle component for grabbable drag handles
 */
export interface DragHandleProps {
  children: React.ReactNode;
  className?: string;
}

export const DragHandle = React.forwardRef<HTMLDivElement, DragHandleProps>(
  ({ children, className }, ref) => {
    const { attributes, listeners } = useDraggable({
      id: 'drag-handle',
      disabled: false,
    });

    return (
      <div
        ref={ref}
        {...attributes}
        {...listeners}
        className={cn('cursor-grab active:cursor-grabbing', className)}
        data-drag-handle="true"
      >
        {children}
      </div>
    );
  }
);

DragHandle.displayName = 'DragHandle';
