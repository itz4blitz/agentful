/**
 * Drag Drop Manager
 * Central service for coordinating drag and drop operations
 */

import type {
  DragData,
  DropTarget,
  DropPosition,
  DndEvent,
  ComponentTemplate,
  CanvasElement,
} from '@/types';
import { useDndStore } from '@/stores/dnd-store';
import { useCanvasStore } from '@/stores/canvas-store';
import { nanoid } from 'nanoid';

/**
 * Convert component template to canvas element
 */
export const componentToCanvasElement = (
  component: ComponentTemplate
): CanvasElement => {
  // Parse HTML to extract element structure
  const parser = new DOMParser();
  const doc = parser.parseFromString(component.html, 'text/html');
  const firstChild = doc.body.firstElementChild;

  if (!firstChild) {
    throw new Error(`Component ${component.id} has no valid HTML structure`);
  }

  return {
    id: nanoid(),
    tagName: firstChild.tagName.toLowerCase(),
    attributes: Array.from(firstChild.attributes)
      .filter((attr) => attr.name !== 'data-canvas-id')
      .reduce((acc, attr) => {
        acc[attr.name] = attr.value;
        return acc;
      }, {} as Record<string, string>),
    styles: {},
    children: [],
    content: firstChild.textContent || undefined,
  };
};

/**
 * Calculate drop position based on pointer location
 */
export const calculateDropPosition = (
  targetElement: HTMLElement,
  pointerY: number,
  pointerX: number
): DropPosition => {
  const rect = targetElement.getBoundingClientRect();
  const relativeY = pointerY - rect.top;
  const relativeX = pointerX - rect.left;
  const height = rect.height;
  const width = rect.width;

  // Check if element is a container (has children or is a block element)
  const isContainer =
    targetElement.children.length > 0 ||
    ['div', 'section', 'article', 'main', 'header', 'footer', 'nav'].includes(
      targetElement.tagName.toLowerCase()
    );

  // If it's a container and pointer is in the center, allow dropping inside
  if (isContainer) {
    const centerThreshold = 0.3; // 30% from edges
    const topThreshold = height * centerThreshold;
    const bottomThreshold = height * (1 - centerThreshold);

    if (relativeY > topThreshold && relativeY < bottomThreshold) {
      return 'inside';
    }
  }

  // Otherwise, drop before or after based on vertical position
  const midPoint = height / 2;
  return relativeY < midPoint ? 'before' : 'after';
};

/**
 * Find closest droppable parent
 */
export const findClosestDroppable = (
  element: HTMLElement | null
): HTMLElement | null => {
  if (!element) return null;

  // Check if element itself is droppable
  if (element.hasAttribute('data-droppable')) {
    return element;
  }

  // Traverse up the DOM tree
  let current = element.parentElement;
  while (current) {
    if (current.hasAttribute('data-droppable')) {
      return current;
    }
    current = current.parentElement;
  }

  return null;
};

/**
 * Get drop index within parent
 */
export const getDropIndex = (
  parent: HTMLElement,
  targetId: string,
  position: DropPosition
): number => {
  const children = Array.from(parent.children);
  const targetIndex = children.findIndex(
    (child) => child.getAttribute('data-canvas-id') === targetId
  );

  if (targetIndex === -1) {
    return children.length;
  }

  return position === 'after' ? targetIndex + 1 : targetIndex;
};

/**
 * Handle drag start
 */
export const handleDragStart = (
  activeId: string,
  dragData: DragData
): void => {
  useDndStore.getState().startDrag(activeId, dragData);
};

/**
 * Handle drag move
 */
export const handleDragMove = (
  overId: string | null,
  pointerCoordinates: { x: number; y: number }
): void => {
  const { setOver, setPointerCoordinates } = useDndStore.getState();
  setOver(overId);
  setPointerCoordinates(pointerCoordinates);
};

/**
 * Handle drag over
 */
export const handleDragOver = (
  overId: string,
  targetElement: HTMLElement | null,
  pointerCoordinates: { x: number; y: number } | null
): void => {
  const { dragData, setOver } = useDndStore.getState();

  if (!dragData) return;

  setOver(overId);

  if (!targetElement || !pointerCoordinates) {
    useDndStore.getState().setDropTarget({
      targetId: overId,
      position: 'inside',
      index: 0,
      parentId: undefined,
    });
    return;
  }

  // Calculate drop position
  const position = calculateDropPosition(
    targetElement,
    pointerCoordinates.y,
    pointerCoordinates.x
  );

  // Get parent ID
  const parentId = targetElement.parentElement?.getAttribute('data-canvas-id') || undefined;

  // Calculate drop index
  const index = getDropIndex(targetElement.parentElement!, overId, position);

  const dropTarget: DropTarget = {
    targetId: overId,
    position,
    index,
    parentId,
  };

  useDndStore.getState().setDropTarget(dropTarget);
};

/**
 * Handle drop
 */
export const handleDrop = (): void => {
  const { dragData, dropTarget, endDrag, pointerCoordinates } = useDndStore.getState();

  if (!dragData || !dropTarget) {
    endDrag();
    return;
  }

  const canvasStore = useCanvasStore.getState();

  // Handle different drag sources
  switch (dragData.type) {
    case 'palette':
      if (dragData.component) {
        const targetId =
          dropTarget.targetId === 'canvas-drop-zone' ? undefined : dropTarget.targetId;
        const dropEvent = new CustomEvent('canvas-drop-component', {
          detail: {
            component: dragData.component,
            targetId,
          },
        });
        window.dispatchEvent(dropEvent);
      }
      break;

    case 'canvas':
    case 'reorder':
      // Dragging within canvas or from layers bar
      if (dragData.elementId) {
        // Check if dropping on canvas root (for absolute positioning)
        if (dropTarget.targetId === 'canvas-drop-zone' && pointerCoordinates) {
          // Calculate position relative to canvas
          const canvasElement = document.querySelector('[data-droppable-id="canvas-drop-zone"]') as HTMLElement;
          if (canvasElement) {
            const rect = canvasElement.getBoundingClientRect();
            const x = pointerCoordinates.x - rect.left;
            const y = pointerCoordinates.y - rect.top;

            // Update element position using absolute positioning
            const updateEvent = new CustomEvent('canvas-update-element', {
              detail: {
                elementId: dragData.elementId,
                updates: {
                  styles: {
                    position: 'absolute',
                    left: `${x}px`,
                    top: `${y}px`,
                  },
                },
              },
            });
            window.dispatchEvent(updateEvent);
          }
        } else {
          // Move element within the DOM hierarchy
          const targetParentId =
            dropTarget.position === 'inside'
              ? dropTarget.targetId
              : dropTarget.parentId;

          if (targetParentId) {
            canvasStore.moveElement(dragData.elementId, targetParentId, dropTarget.index);
          }
        }
      }
      break;
  }

  // Clear drag state
  endDrag();
};

/**
 * Handle drag cancel
 */
export const handleDragCancel = (): void => {
  useDndStore.getState().cancelDrag();
};

/**
 * Handle drag end
 */
export const handleDragEnd = (): void => {
  const { canDrop } = useDndStore.getState();

  if (canDrop()) {
    handleDrop();
  } else {
    handleDragCancel();
  }
};

/**
 * Create drag event for logging/analytics
 */
export const createDndEvent = (
  type: DndEvent['type'],
  dragData: DragData,
  dropTarget?: DropTarget
): DndEvent => {
  return {
    type,
    dragData,
    dropTarget,
    timestamp: new Date(),
  };
};

/**
 * Validate drop target
 */
export const validateDropTarget = (
  dragData: DragData,
  dropTarget: DropTarget
): boolean => {
  // Prevent dropping on self
  if (dragData.elementId && dragData.elementId === dropTarget.targetId) {
    return false;
  }

  // Prevent dropping on descendants
  if (dragData.elementId && dropTarget.parentId) {
    const canvasStore = useCanvasStore.getState();
    const isDescendant = checkIsDescendant(
      canvasStore.elements,
      dragData.elementId,
      dropTarget.parentId
    );
    if (isDescendant) {
      return false;
    }
  }

  return true;
};

/**
 * Check if element is descendant of another
 */
const checkIsDescendant = (
  elements: CanvasElement[],
  elementId: string,
  ancestorId: string
): boolean => {
  const findElement = (els: CanvasElement[], id: string): CanvasElement | null => {
    for (const el of els) {
      if (el.id === id) return el;
      if (el.children.length > 0) {
        const found = findElement(el.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const element = findElement(elements, elementId);
  if (!element) return false;

  const checkAncestor = (el: CanvasElement): boolean => {
    if (el.id === ancestorId) return true;
    if (el.children.length > 0) {
      return el.children.some(checkAncestor);
    }
    return false;
  };

  return checkAncestor(element);
};
