/**
 * DndContext
 * Global drag and drop context provider using @dnd-kit
 */

import * as React from 'react';
import {
  DndContext as DndKitContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDndContext,
} from '@dnd-kit/core';
import type {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import { useDndStore } from '@/stores/dnd-store';
import {
  handleDragStart as onDragStart,
  handleDragOver as onDragOver,
  handleDragEnd as onDragEnd,
  handleDragCancel as onDragCancel,
} from '@/services/dnd/drag-drop-manager';
import type { DragData } from '@/types/dnd';
import { cn } from '@/lib/utils';

export interface DndContextProps {
  children: React.ReactNode;
  onDragStart?: (event: DragStartEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
  onDragEnd?: (event: DragEndEvent) => void;
  activationConstraint?: {
    distance?: number;
    delay?: number;
    tolerance?: number;
  };
  className?: string;
}

/**
 * Internal drag start handler
 */
const handleDragStart = (event: DragStartEvent, callback?: (event: DragStartEvent) => void) => {
  const { active } = event;
  const dragData = active.data.current as DragData;

  if (dragData) {
    onDragStart(active.id as string, dragData);
  }

  callback?.(event);
};

/**
 * Internal drag over handler
 */
const handleDragOver = (
  event: DragOverEvent,
  callback?: (event: DragOverEvent) => void
) => {
  const { over, activatorEvent } = event;

  if (!over) {
    useDndStore.getState().setOver(null);
    useDndStore.getState().setDropTarget(null);
    callback?.(event);
    return;
  }

  const targetElement = document.querySelector(
    `[data-droppable-id="${over.id}"]`
  ) as HTMLElement | null;

  // Capture pointer coordinates from the activator event
  let pointerCoordinates = { x: 0, y: 0 };
  if (activatorEvent) {
    const pointerEvent = activatorEvent as PointerEvent;
    pointerCoordinates = {
      x: pointerEvent.clientX,
      y: pointerEvent.clientY,
    };
  }

  onDragOver(over.id as string, targetElement, pointerCoordinates);

  callback?.(event);
};

/**
 * Internal drag end handler
 */
const handleDragEndInternal = (
  event: DragEndEvent,
  callback?: (event: DragEndEvent) => void
) => {
  const { over, activatorEvent } = event;

  if (over) {
    const targetElement = document.querySelector(
      `[data-droppable-id="${over.id}"]`
    ) as HTMLElement | null;

    // Capture pointer coordinates from the activator event
    let pointerCoordinates = { x: 0, y: 0 };
    if (activatorEvent) {
      const pointerEvent = activatorEvent as PointerEvent;
      pointerCoordinates = {
        x: pointerEvent.clientX,
        y: pointerEvent.clientY,
      };
    }

    onDragOver(over.id as string, targetElement, pointerCoordinates);
  }

  onDragEnd();
  callback?.(event);
};

/**
 * DndContext Component
 */
export const DndContext = React.forwardRef<HTMLDivElement, DndContextProps>(
  (
    {
      children,
      onDragStart: onDragStartProp,
      onDragOver: onDragOverProp,
      onDragEnd: onDragEndProp,
      activationConstraint = { distance: 8 },
      className,
    },
    ref
  ) => {
    // Configure sensors
    const pointerSensor = useSensor(PointerSensor, {
      activationConstraint,
      // Ignore elements with data-no-dnd attribute
      activators: [
        {
          eventName: 'onPointerDown',
          handler: (event: Event) => {
            const target = event.target as HTMLElement;
            // Check if element or any parent has data-no-dnd
            const noDndElement = target.closest('[data-no-dnd]');
            if (noDndElement) {
              return false; // Don't activate dnd-kit on this element
            }
            return true;
          },
        },
      ],
    });

    const keyboardSensor = useSensor(KeyboardSensor, {
      coordinateGetter: (event, { context }) => {
        const { over } = context;
        if (!over) {
          return null;
        }

        // Keyboard navigation support
        switch (event.code) {
          case 'ArrowRight':
          case 'ArrowDown':
            return {
              x: 0,
              y: 0,
            };
          case 'ArrowLeft':
          case 'ArrowUp':
            return {
              x: 0,
              y: 0,
            };
          default:
            return undefined;
        }
      },
    });

    const sensors = useSensors(pointerSensor, keyboardSensor);

    // Handle Escape key to cancel drag
    React.useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          const { isDragging } = useDndStore.getState();
          if (isDragging) {
            onDragCancel();
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
      <DndKitContext
        sensors={sensors}
        onDragStart={(event) => handleDragStart(event, onDragStartProp)}
        onDragOver={(event) => handleDragOver(event, onDragOverProp)}
        onDragEnd={(event) => handleDragEndInternal(event, onDragEndProp)}
      >
        <div ref={ref} className={cn('relative', className)}>
          {children}
        </div>
      </DndKitContext>
    );
  }
);

DndContext.displayName = 'DndContext';

/**
 * Hook to access DnD context state
 */
export const useDndContextState = () => {
  const { active, over } = useDndContext();
  const { isDragging, dragData, dropTarget } = useDndStore();

  return {
    active,
    over,
    isDragging,
    dragData,
    dropTarget,
  };
};

/**
 * Hook to check if an element is being dragged
 */
export const useIsDragging = (id: string) => {
  const { active } = useDndContext();
  return active?.id === id;
};

/**
 * Hook to check if an element is being dragged over
 */
export const useIsOver = (id: string) => {
  const { over } = useDndContext();
  return over?.id === id;
};
