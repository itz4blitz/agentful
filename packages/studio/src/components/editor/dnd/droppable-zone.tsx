/**
 * DroppableZone
 * Component for creating drop zones in the canvas
 */

import * as React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useIsOver } from '@/components/editor/dnd/dnd-context';
import { cn } from '@/lib/utils';

export interface DroppableZoneProps {
  id: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  acceptTypes?: string[];
  onDrop?: () => void;
}

/**
 * DroppableZone Component
 */
export const DroppableZone = React.forwardRef<HTMLDivElement, DroppableZoneProps>(
  (
    {
      id,
      children,
      disabled = false,
      className,
      style,
      acceptTypes = ['palette', 'canvas', 'reorder'],
      onDrop,
    },
    ref
  ) => {
    const internalRef = React.useRef<HTMLDivElement>(null);

    const { setNodeRef, isOverCurrent } = useDroppable({
      id,
      disabled,
      data: {
        accepts: acceptTypes,
      },
    });

    // Combine refs
    React.useImperativeHandle(ref, () => internalRef.current!);
    React.useEffect(() => {
      if (internalRef.current) {
        setNodeRef(internalRef.current);
      }
    }, [setNodeRef]);

    const isOver = useIsOver(id);

    // Handle drop
    React.useEffect(() => {
      if (isOver && !isOverCurrent) {
        onDrop?.();
      }
    }, [isOver, isOverCurrent, onDrop]);

    return (
      <div
        ref={internalRef}
        style={style}
        className={cn(
          'transition-all duration-200',
          isOver && 'ring-2 ring-primary ring-offset-2 bg-primary/5',
          className
        )}
        data-droppable="true"
        data-droppable-id={id}
      >
        {children}
      </div>
    );
  }
);

DroppableZone.displayName = 'DroppableZone';

/**
 * CanvasDroppableZone - Specialized droppable zone for canvas elements
 */
export interface CanvasDroppableZoneProps {
  id: string;
  elementId: string;
  children: React.ReactNode;
  className?: string;
  canNest?: boolean;
}

export const CanvasDroppableZone = React.forwardRef<
  HTMLDivElement,
  CanvasDroppableZoneProps
>(({ id, elementId, children, className, canNest = true }, ref) => {
  const internalRef = React.useRef<HTMLDivElement>(null);

  const { setNodeRef } = useDroppable({
    id,
    data: {
      elementId,
      canNest,
    },
  });

  React.useImperativeHandle(ref, () => internalRef.current!);
  React.useEffect(() => {
    if (internalRef.current) {
      setNodeRef(internalRef.current);
    }
  }, [setNodeRef]);

  const isOver = useIsOver(id);

  return (
    <div
      ref={internalRef}
      className={cn(
        'relative transition-colors duration-150',
        isOver && canNest && 'bg-primary/10',
        className
      )}
      data-canvas-droppable="true"
      data-element-id={elementId}
    >
      {children}
    </div>
  );
});

CanvasDroppableZone.displayName = 'CanvasDroppableZone';
