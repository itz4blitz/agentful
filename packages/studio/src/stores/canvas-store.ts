/**
 * Canvas Store
 * Zustand store for managing canvas state with undo/redo support
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  CanvasState,
  CanvasSelection,
  CanvasElement,
  ElementChange,
} from '@/types/canvas';
import { DEFAULT_CANVAS_STATE } from '@/types/canvas';
import { nanoid } from 'nanoid';

interface CanvasStore extends CanvasState {
  // Computed properties
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Actions
  setElements: (elements: CanvasElement[]) => void;
  setSelectedElement: (selection: CanvasSelection | null) => void;
  setHoveredElement: (elementId: string | null) => void;
  setHTML: (html: string) => void;
  updateElement: (
    elementId: string,
    updates: Partial<CanvasElement>,
    recordHistory?: boolean
  ) => void;
  addElement: (element: CanvasElement, parentId?: string) => void;
  removeElement: (elementId: string) => void;
  duplicateElement: (elementId: string) => void;
  moveElement: (elementId: string, newParentId: string, index?: number) => void;
  wrapElement: (elementId: string, wrapperTag?: string) => void;
  unwrapElement: (elementId: string) => void;
  reorderElement: (elementId: string, direction: 'up' | 'down') => void;
  lockElement: (elementId: string) => void;
  unlockElement: (elementId: string) => void;
  hideElement: (elementId: string) => void;
  showElement: (elementId: string) => void;
  bringToFront: (elementId: string) => void;
  sendToBack: (elementId: string) => void;
  bringForward: (elementId: string) => void;
  sendBackward: (elementId: string) => void;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
  copyToClipboard: (elementId: string) => void;
  pasteFromClipboard: (parentId?: string) => void;
  reset: () => void;
}

export const useCanvasStore = create<CanvasStore>()(
  immer((set, get) => ({
    // Initial state
    ...DEFAULT_CANVAS_STATE,

    // Computed properties
    canUndo: () => get().historyIndex >= 0,
    canRedo: () => get().historyIndex < get().history.length - 1,

    // Actions
    setElements: (elements) =>
      set((state) => {
        state.elements = elements;
        state.isDirty = true;
      }),

    setSelectedElement: (selection) =>
      set((state) => {
        state.selectedElement = selection;
      }),

    setHoveredElement: (elementId) =>
      set((state) => {
        state.hoveredElement = elementId;
      }),

    setHTML: (html) =>
      set((state) => {
        state.html = html;
        state.isDirty = true;
      }),

    updateElement: (elementId, updates, recordHistory = true) =>
      set((state) => {
        const updateRecursive = (elements: CanvasElement[]): boolean => {
          for (const element of elements) {
            if (element.id === elementId) {
              // Record change for undo/redo
              if (recordHistory) {
                const change: ElementChange = {
                  type: 'attribute',
                  elementId,
                  oldValue: { ...element },
                  newValue: { ...element, ...updates },
                  timestamp: new Date(),
                };
                state.history = state.history.slice(0, state.historyIndex + 1);
                state.history.push(change);
                state.historyIndex = state.history.length - 1;
              }

              // Apply updates
              Object.assign(element, updates);
              state.isDirty = true;
              return true;
            }
            if (element.children.length > 0) {
              if (updateRecursive(element.children)) {
                return true;
              }
            }
          }
          return false;
        };

        updateRecursive(state.elements);
      }),

    addElement: (element, parentId) =>
      set((state) => {
        const newElement = {
          ...element,
          id: element.id || nanoid(),
        };

        if (parentId) {
          const addToParent = (elements: CanvasElement[]): boolean => {
            for (const el of elements) {
              if (el.id === parentId) {
                el.children.push(newElement);
                return true;
              }
              if (el.children.length > 0) {
                if (addToParent(el.children)) {
                  return true;
                }
              }
            }
            return false;
          };
          addToParent(state.elements);
        } else {
          state.elements.push(newElement);
        }

        // Record history
        const change: ElementChange = {
          type: 'structure',
          elementId: newElement.id,
          newValue: newElement,
          timestamp: new Date(),
        };
        state.history = state.history.slice(0, state.historyIndex + 1);
        state.history.push(change);
        state.historyIndex = state.history.length - 1;
        state.isDirty = true;
      }),

    removeElement: (elementId) =>
      set((state) => {
        const removeFromParent = (elements: CanvasElement[]): CanvasElement[] => {
          return elements.filter((element) => {
            if (element.id === elementId) {
              // Record history
              const change: ElementChange = {
                type: 'structure',
                elementId,
                oldValue: element,
                timestamp: new Date(),
              };
              state.history = state.history.slice(0, state.historyIndex + 1);
              state.history.push(change);
              state.historyIndex = state.history.length - 1;
              return false;
            }
            if (element.children.length > 0) {
              element.children = removeFromParent(element.children);
            }
            return true;
          });
        };

        state.elements = removeFromParent(state.elements);
        state.isDirty = true;

        // Clear selection if we removed the selected element
        if (state.selectedElement?.elementId === elementId) {
          state.selectedElement = null;
        }
      }),

    duplicateElement: (elementId) =>
      set((state) => {
        let elementToDuplicate: CanvasElement | null = null;
        let parentId: string | null = null;
        let insertIndex = -1;

        // Find element and its parent
        const findElement = (
          elements: CanvasElement[],
          parent: CanvasElement | null = null
        ): boolean => {
          for (let i = 0; i < elements.length; i++) {
            if (elements[i].id === elementId) {
              elementToDuplicate = elements[i];
              parentId = parent?.id || null;
              insertIndex = i + 1;
              return true;
            }
            if (elements[i].children.length > 0) {
              if (findElement(elements[i].children, elements[i])) {
                return true;
              }
            }
          }
          return false;
        };

        findElement(state.elements);

        if (elementToDuplicate) {
          const duplicated: CanvasElement = JSON.parse(
            JSON.stringify(elementToDuplicate)
          );
          duplicated.id = nanoid();

          // Update IDs in children
          const updateChildrenIds = (element: CanvasElement) => {
            element.id = nanoid();
            if (element.children) {
              element.children.forEach(updateChildrenIds);
            }
          };
          duplicated.children.forEach(updateChildrenIds);

          // Add duplicated element
          if (parentId) {
            const addToParent = (elements: CanvasElement[]): boolean => {
              for (const element of elements) {
                if (element.id === parentId) {
                  element.children.splice(insertIndex, 0, duplicated);
                  return true;
                }
                if (element.children.length > 0) {
                  if (addToParent(element.children)) {
                    return true;
                  }
                }
              }
              return false;
            };
            addToParent(state.elements);
          } else {
            state.elements.splice(insertIndex, 0, duplicated);
          }

          // Record history
          const change: ElementChange = {
            type: 'structure',
            elementId: duplicated.id,
            newValue: duplicated,
            timestamp: new Date(),
          };
          state.history = state.history.slice(0, state.historyIndex + 1);
          state.history.push(change);
          state.historyIndex = state.history.length - 1;
          state.isDirty = true;
        }
      }),

    moveElement: (elementId, newParentId, index) =>
      set((state) => {
        let elementToMove: CanvasElement | null = null;
        let oldParentId: string | null = null;

        // Find and remove element from current location
        const findAndRemove = (
          elements: CanvasElement[],
          parent: CanvasElement | null = null
        ): boolean => {
          for (let i = 0; i < elements.length; i++) {
            if (elements[i].id === elementId) {
              elementToMove = elements[i];
              oldParentId = parent?.id || null;
              elements.splice(i, 1);
              return true;
            }
            if (elements[i].children.length > 0) {
              if (findAndRemove(elements[i].children, elements[i])) {
                return true;
              }
            }
          }
          return false;
        };

        findAndRemove(state.elements);

        if (elementToMove) {
          const element = elementToMove;

          // Add to new parent
          const addToParent = (elements: CanvasElement[]): boolean => {
            for (const el of elements) {
              if (el.id === newParentId) {
                if (index !== undefined) {
                  el.children.splice(index, 0, element);
                } else {
                  el.children.push(element);
                }
                return true;
              }
              if (el.children.length > 0) {
                if (addToParent(el.children)) {
                  return true;
                }
              }
            }
            return false;
          };

          // If no parent found, add to root
          if (!addToParent(state.elements)) {
            if (index !== undefined) {
              state.elements.splice(index, 0, elementToMove);
            } else {
              state.elements.push(elementToMove);
            }
          }

          // Record history
          const change: ElementChange = {
            type: 'structure',
            elementId,
            oldValue: { oldParentId },
            newValue: { newParentId },
            timestamp: new Date(),
          };
          state.history = state.history.slice(0, state.historyIndex + 1);
          state.history.push(change);
          state.historyIndex = state.history.length - 1;
          state.isDirty = true;
        }
      }),

    wrapElement: (elementId, wrapperTag = 'div') =>
      set((state) => {
        let elementToWrap: CanvasElement | null = null;
        let parentRef: { element: CanvasElement | null; index: number } | null = null;
        let elementIndex = -1;
        let isRoot = false;

        // Find element and its parent
        const findElement = (
          elements: CanvasElement[],
          parentElement: CanvasElement | null = null
        ): boolean => {
          for (let i = 0; i < elements.length; i++) {
            if (elements[i].id === elementId) {
              elementToWrap = elements[i];
              if (parentElement) {
                parentRef = { element: parentElement, index: i };
              }
              elementIndex = i;
              isRoot = parentElement === null;
              return true;
            }
            if (elements[i].children.length > 0) {
              if (findElement(elements[i].children, elements[i])) {
                return true;
              }
            }
          }
          return false;
        };

        findElement(state.elements);

        if (elementToWrap) {
          const wrapperId = nanoid();

          // Create wrapper element
          const wrapper: CanvasElement = {
            id: wrapperId,
            tagName: wrapperTag,
            attributes: {
              'data-wrapper': 'true',
              class: 'canvas-wrapper',
            },
            styles: {},
            children: [],
          };

          // Create wrapped element copy
          const wrappedElement: CanvasElement = JSON.parse(JSON.stringify(elementToWrap));
          wrappedElement.parentId = wrapperId;
          wrapper.children.push(wrappedElement);

          // Record history before wrapping
          const originalElement: CanvasElement = JSON.parse(JSON.stringify(elementToWrap));
          const change: ElementChange = {
            type: 'structure',
            elementId,
            oldValue: originalElement,
            newValue: { wrapperId },
            timestamp: new Date(),
          };
          state.history = state.history.slice(0, state.historyIndex + 1);
          state.history.push(change);
          state.historyIndex = state.history.length - 1;

          // Replace element with wrapper in parent or root
          if (isRoot) {
            state.elements[elementIndex] = wrapper;
          // @ts-ignore - Immer draft type inference issue
          } else if (parentRef && parentRef.element) {
            // @ts-ignore - Immer draft type inference issue
            const parentId = parentRef.element.id;
            // @ts-ignore - Immer draft type inference issue
            const pIndex = parentRef.index;
            const findAndUpdateParent = (elements: CanvasElement[]): boolean => {
              for (const el of elements) {
                if (el.id === parentId) {
                  el.children[pIndex] = wrapper;
                  return true;
                }
                if (el.children.length > 0) {
                  if (findAndUpdateParent(el.children)) {
                    return true;
                  }
                }
              }
              return false;
            };
            findAndUpdateParent(state.elements);
          }

          state.isDirty = true;
        }
      }),

    unwrapElement: (elementId) =>
      set((state) => {
        let parentRef: { element: CanvasElement; index: number; gpId?: string } | null = null;
        let isRoot = false;

        // Find the parent wrapper and its parent
        const findWrapper = (
          elements: CanvasElement[],
          grandParentElement: CanvasElement | null = null
        ): boolean => {
          for (let i = 0; i < elements.length; i++) {
            if (elements[i].children.length > 0) {
              for (let j = 0; j < elements[i].children.length; j++) {
                if (elements[i].children[j].id === elementId) {
                  parentRef = {
                    element: elements[i].children[j],
                    index: j,
                    gpId: grandParentElement?.id,
                  };
                  isRoot = false;
                  return true;
                }
              }
              if (findWrapper(elements[i].children, elements[i])) {
                return true;
              }
            }
          }
          return false;
        };

        // Also check root level
        for (let i = 0; i < state.elements.length; i++) {
          if (state.elements[i].id === elementId) {
            parentRef = { element: state.elements[i], index: i };
            isRoot = true;
            break;
          }
        }

        if (!parentRef && !isRoot) {
          findWrapper(state.elements);
        }

        if (parentRef && parentRef.element.attributes['data-wrapper'] === 'true') {
          // Get all children to promote
          const childrenToPromote: CanvasElement[] = parentRef.element.children.map(
            child => JSON.parse(JSON.stringify(child))
          );

          // Record history before unwrapping
          const wrapperCopy: CanvasElement = JSON.parse(JSON.stringify(parentRef.element));
          const change: ElementChange = {
            type: 'structure',
            elementId,
            oldValue: { wrapper: wrapperCopy },
            newValue: { unwrapped: true },
            timestamp: new Date(),
          };
          state.history = state.history.slice(0, state.historyIndex + 1);
          state.history.push(change);
          state.historyIndex = state.history.length - 1;

          // Remove wrapper and promote children
          if (!isRoot && parentRef.gpId) {
            // Need to find the grandparent again to modify it
            const findAndUpdateGrandParent = (
              elements: CanvasElement[],
            ): boolean => {
              for (let i = 0; i < elements.length; i++) {
                if (elements[i].id === parentRef!.gpId) {
                  // Remove wrapper from grandparent
                  elements[i].children.splice(parentRef!.index, 1);
                  // Add all children at the wrapper's position
                  elements[i].children.splice(parentRef!.index, 0, ...childrenToPromote);
                  return true;
                }
                if (elements[i].children.length > 0) {
                  if (findAndUpdateGrandParent(elements[i].children)) {
                    return true;
                  }
                }
              }
              return false;
            };
            findAndUpdateGrandParent(state.elements);

            // Update parentId for promoted children
            const updateParentIds = (elements: CanvasElement[], parentId: string | undefined) => {
              for (const child of elements) {
                child.parentId = parentId;
                if (child.children.length > 0) {
                  updateParentIds(child.children, child.id);
                }
              }
            };
            updateParentIds(childrenToPromote, parentRef.gpId);
          } else if (isRoot) {
            // Remove wrapper from root
            state.elements.splice(parentRef.index, 1);
            // Add all children at the wrapper's position
            state.elements.splice(parentRef.index, 0, ...childrenToPromote);

            // Update parentId for promoted children (no parent)
            const updateParentIds = (elements: CanvasElement[], parentId: string | undefined) => {
              for (const child of elements) {
                child.parentId = parentId;
                if (child.children.length > 0) {
                  updateParentIds(child.children, child.id);
                }
              }
            };
            updateParentIds(childrenToPromote, undefined);
          }

          state.isDirty = true;
        }
      }),

    reorderElement: (elementId, direction) =>
      set((state) => {
        let elementInfo: {
          element: CanvasElement;
          parentId: string | null;
          index: number;
          isRoot: boolean;
        } | null = null;

        // Find element and its parent
        const findElement = (
          elements: CanvasElement[],
          parentElement: CanvasElement | null = null
        ): boolean => {
          for (let i = 0; i < elements.length; i++) {
            if (elements[i].id === elementId) {
              elementInfo = {
                element: elements[i],
                parentId: parentElement?.id || null,
                index: i,
                isRoot: parentElement === null,
              };
              return true;
            }
            if (elements[i].children.length > 0) {
              if (findElement(elements[i].children, elements[i])) {
                return true;
              }
            }
          }
          return false;
        };

        findElement(state.elements);

        if (elementInfo) {
          // Extract values to avoid draft type issues
          // @ts-ignore - Immer draft type inference issue
          const infoIsRoot = elementInfo.isRoot;
          // @ts-ignore - Immer draft type inference issue
          const infoParentId = elementInfo.parentId;
          // @ts-ignore - Immer draft type inference issue
          const infoIndex = elementInfo.index;
          // @ts-ignore - Immer draft type inference issue
          const infoElement = elementInfo.element;

          if (!infoIsRoot && infoParentId) {
            // Find parent and reorder
            const findAndReorderInParent = (elements: CanvasElement[]): boolean => {
            for (const el of elements) {
              if (el.id === infoParentId) {
                const siblings = el.children;
                const currentIndex = infoIndex;
                const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

                // Validate bounds
                if (newIndex < 0 || newIndex >= siblings.length) {
                  return true; // Invalid move, handled
                }

                // Record history before reordering
                const change: ElementChange = {
                  type: 'structure',
                  elementId,
                  oldValue: { oldIndex: currentIndex },
                  newValue: { newIndex },
                  timestamp: new Date(),
                };
                state.history = state.history.slice(0, state.historyIndex + 1);
                state.history.push(change);
                state.historyIndex = state.history.length - 1;

                // Remove from current position
                siblings.splice(currentIndex, 1);
                // Insert at new position
                siblings.splice(newIndex, 0, infoElement);

                state.isDirty = true;
                return true;
              }
              if (el.children.length > 0) {
                if (findAndReorderInParent(el.children)) {
                  return true;
                }
              }
            }
            return false;
          };

          findAndReorderInParent(state.elements);
        } else if (infoIsRoot) {
          const siblings = state.elements;
          const currentIndex = infoIndex;
          const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

          // Validate bounds
          if (newIndex < 0 || newIndex >= siblings.length) {
            return; // Invalid move, would go out of bounds
          }

          // Record history before reordering
          const change: ElementChange = {
            type: 'structure',
            elementId,
            oldValue: { oldIndex: currentIndex },
            newValue: { newIndex },
            timestamp: new Date(),
          };
          state.history = state.history.slice(0, state.historyIndex + 1);
          state.history.push(change);
          state.historyIndex = state.history.length - 1;

          // Remove from current position
          siblings.splice(currentIndex, 1);
          // Insert at new position
          siblings.splice(newIndex, 0, infoElement);

          state.isDirty = true;
          }
        }
      }),

    lockElement: (elementId) =>
      set((state) => {
        const updateRecursive = (elements: CanvasElement[]): boolean => {
          for (const element of elements) {
            if (element.id === elementId) {
              // Record change for undo/redo
              const change: ElementChange = {
                type: 'attribute',
                elementId,
                oldValue: { locked: element.locked },
                newValue: { locked: true },
                timestamp: new Date(),
              };
              state.history = state.history.slice(0, state.historyIndex + 1);
              state.history.push(change);
              state.historyIndex = state.history.length - 1;

              // Lock the element
              element.locked = true;
              element.attributes['data-locked'] = 'true';
              state.isDirty = true;
              return true;
            }
            if (element.children.length > 0) {
              if (updateRecursive(element.children)) {
                return true;
              }
            }
          }
          return false;
        };

        updateRecursive(state.elements);
      }),

    unlockElement: (elementId) =>
      set((state) => {
        const updateRecursive = (elements: CanvasElement[]): boolean => {
          for (const element of elements) {
            if (element.id === elementId) {
              // Record change for undo/redo
              const change: ElementChange = {
                type: 'attribute',
                elementId,
                oldValue: { locked: element.locked },
                newValue: { locked: false },
                timestamp: new Date(),
              };
              state.history = state.history.slice(0, state.historyIndex + 1);
              state.history.push(change);
              state.historyIndex = state.history.length - 1;

              // Unlock the element
              element.locked = false;
              delete element.attributes['data-locked'];
              state.isDirty = true;
              return true;
            }
            if (element.children.length > 0) {
              if (updateRecursive(element.children)) {
                return true;
              }
            }
          }
          return false;
        };

        updateRecursive(state.elements);
      }),

    hideElement: (elementId) =>
      set((state) => {
        const updateRecursive = (elements: CanvasElement[]): boolean => {
          for (const element of elements) {
            if (element.id === elementId) {
              // Record change for undo/redo
              const change: ElementChange = {
                type: 'attribute',
                elementId,
                oldValue: { hidden: element.hidden, display: element.styles.display },
                newValue: { hidden: true, display: 'none' },
                timestamp: new Date(),
              };
              state.history = state.history.slice(0, state.historyIndex + 1);
              state.history.push(change);
              state.historyIndex = state.history.length - 1;

              // Hide the element
              element.hidden = true;
              element.attributes['data-hidden'] = 'true';
              element.styles.display = 'none';
              state.isDirty = true;
              return true;
            }
            if (element.children.length > 0) {
              if (updateRecursive(element.children)) {
                return true;
              }
            }
          }
          return false;
        };

        updateRecursive(state.elements);
      }),

    showElement: (elementId) =>
      set((state) => {
        const updateRecursive = (elements: CanvasElement[]): boolean => {
          for (const element of elements) {
            if (element.id === elementId) {
              // Record change for undo/redo
              const oldDisplay = element.styles.display;
              const change: ElementChange = {
                type: 'attribute',
                elementId,
                oldValue: { hidden: element.hidden, display: oldDisplay },
                newValue: { hidden: false, display: undefined },
                timestamp: new Date(),
              };
              state.history = state.history.slice(0, state.historyIndex + 1);
              state.history.push(change);
              state.historyIndex = state.history.length - 1;

              // Show the element
              element.hidden = false;
              delete element.attributes['data-hidden'];
              if (oldDisplay === 'none') {
                delete element.styles.display;
              }
              state.isDirty = true;
              return true;
            }
            if (element.children.length > 0) {
              if (updateRecursive(element.children)) {
                return true;
              }
            }
          }
          return false;
        };

        updateRecursive(state.elements);
      }),

    bringToFront: (elementId) =>
      set((state) => {
        // Find the highest z-index across all elements
        let maxZIndex = 0;
        const findMaxZIndex = (elements: CanvasElement[]) => {
          for (const element of elements) {
            if (element.zIndex !== undefined && element.zIndex > maxZIndex) {
              maxZIndex = element.zIndex;
            }
            if (element.children.length > 0) {
              findMaxZIndex(element.children);
            }
          }
        };
        findMaxZIndex(state.elements);

        const updateRecursive = (elements: CanvasElement[]): boolean => {
          for (const element of elements) {
            if (element.id === elementId) {
              // Record change for undo/redo
              const change: ElementChange = {
                type: 'attribute',
                elementId,
                oldValue: { zIndex: element.zIndex },
                newValue: { zIndex: maxZIndex + 1 },
                timestamp: new Date(),
              };
              state.history = state.history.slice(0, state.historyIndex + 1);
              state.history.push(change);
              state.historyIndex = state.history.length - 1;

              // Bring to front
              element.zIndex = maxZIndex + 1;
              state.isDirty = true;
              return true;
            }
            if (element.children.length > 0) {
              if (updateRecursive(element.children)) {
                return true;
              }
            }
          }
          return false;
        };

        updateRecursive(state.elements);
      }),

    sendToBack: (elementId) =>
      set((state) => {
        const updateRecursive = (elements: CanvasElement[]): boolean => {
          for (const element of elements) {
            if (element.id === elementId) {
              // Record change for undo/redo
              const change: ElementChange = {
                type: 'attribute',
                elementId,
                oldValue: { zIndex: element.zIndex },
                newValue: { zIndex: 0 },
                timestamp: new Date(),
              };
              state.history = state.history.slice(0, state.historyIndex + 1);
              state.history.push(change);
              state.historyIndex = state.history.length - 1;

              // Send to back
              element.zIndex = 0;
              state.isDirty = true;
              return true;
            }
            if (element.children.length > 0) {
              if (updateRecursive(element.children)) {
                return true;
              }
            }
          }
          return false;
        };

        updateRecursive(state.elements);
      }),

    bringForward: (elementId) =>
      set((state) => {
        const updateRecursive = (elements: CanvasElement[]): boolean => {
          for (const element of elements) {
            if (element.id === elementId) {
              const currentZIndex = element.zIndex ?? 0;

              // Record change for undo/redo
              const change: ElementChange = {
                type: 'attribute',
                elementId,
                oldValue: { zIndex: element.zIndex },
                newValue: { zIndex: currentZIndex + 1 },
                timestamp: new Date(),
              };
              state.history = state.history.slice(0, state.historyIndex + 1);
              state.history.push(change);
              state.historyIndex = state.history.length - 1;

              // Bring forward by 1
              element.zIndex = currentZIndex + 1;
              state.isDirty = true;
              return true;
            }
            if (element.children.length > 0) {
              if (updateRecursive(element.children)) {
                return true;
              }
            }
          }
          return false;
        };

        updateRecursive(state.elements);
      }),

    sendBackward: (elementId) =>
      set((state) => {
        const updateRecursive = (elements: CanvasElement[]): boolean => {
          for (const element of elements) {
            if (element.id === elementId) {
              const currentZIndex = element.zIndex ?? 0;
              const newZIndex = Math.max(0, currentZIndex - 1);

              // Record change for undo/redo
              const change: ElementChange = {
                type: 'attribute',
                elementId,
                oldValue: { zIndex: element.zIndex },
                newValue: { zIndex: newZIndex },
                timestamp: new Date(),
              };
              state.history = state.history.slice(0, state.historyIndex + 1);
              state.history.push(change);
              state.historyIndex = state.history.length - 1;

              // Send backward by 1 (minimum 0)
              element.zIndex = newZIndex;
              state.isDirty = true;
              return true;
            }
            if (element.children.length > 0) {
              if (updateRecursive(element.children)) {
                return true;
              }
            }
          }
          return false;
        };

        updateRecursive(state.elements);
      }),

    undo: () =>
      set((state) => {
        if (state.historyIndex >= 0) {
          const change = state.history[state.historyIndex];

          // Reverse the change
          switch (change.type) {
            case 'attribute':
            case 'style':
              if (change.oldValue) {
                // Find and update element
                const updateElement = (elements: CanvasElement[]): boolean => {
                  for (const element of elements) {
                    if (element.id === change.elementId) {
                      Object.assign(element, change.oldValue);
                      state.isDirty = true;
                      return true;
                    }
                    if (element.children.length > 0) {
                      if (updateElement(element.children)) {
                        return true;
                      }
                    }
                  }
                  return false;
                };
                updateElement(state.elements);
              }
              break;
            case 'structure':
              if (change.newValue && !change.oldValue) {
                // Element was added, so remove it on undo
                const removeElement = (elements: CanvasElement[]): CanvasElement[] => {
                  return elements.filter((element) => {
                    if (element.id === change.elementId) {
                      return false;
                    }
                    if (element.children.length > 0) {
                      element.children = removeElement(element.children);
                    }
                    return true;
                  });
                };
                state.elements = removeElement(state.elements);
              } else if (change.oldValue && !change.newValue) {
                // Element was removed, so restore it on undo
                const elementToRestore = change.oldValue as CanvasElement;
                state.elements.push(elementToRestore);
              }
              state.isDirty = true;
              break;
          }

          state.historyIndex--;
        }
      }),

    redo: () =>
      set((state) => {
        if (state.historyIndex < state.history.length - 1) {
          state.historyIndex++;
          const change = state.history[state.historyIndex];

          // Re-apply the change
          switch (change.type) {
            case 'attribute':
            case 'style':
              if (change.newValue) {
                // Find and update element
                const updateElement = (elements: CanvasElement[]): boolean => {
                  for (const element of elements) {
                    if (element.id === change.elementId) {
                      Object.assign(element, change.newValue);
                      state.isDirty = true;
                      return true;
                    }
                    if (element.children.length > 0) {
                      if (updateElement(element.children)) {
                        return true;
                      }
                    }
                  }
                  return false;
                };
                updateElement(state.elements);
              }
              break;
            case 'structure':
              if (change.newValue) {
                // Add element
                const elementToAdd = change.newValue as CanvasElement;
                state.elements.push(elementToAdd);
              }
              state.isDirty = true;
              break;
          }
        }
      }),

    clearHistory: () =>
      set((state) => {
        state.history = [];
        state.historyIndex = -1;
      }),

    copyToClipboard: (elementId) =>
      set((state) => {
        const findElement = (elements: CanvasElement[]): CanvasElement | null => {
          for (const element of elements) {
            if (element.id === elementId) {
              return element;
            }
            if (element.children.length > 0) {
              const found = findElement(element.children);
              if (found) return found;
            }
          }
          return null;
        };

        state.clipboard = findElement(state.elements);
      }),

    pasteFromClipboard: (parentId) =>
      set((state) => {
        if (state.clipboard) {
          const duplicated: CanvasElement = JSON.parse(
            JSON.stringify(state.clipboard)
          );
          duplicated.id = nanoid();

          const updateChildrenIds = (element: CanvasElement) => {
            element.id = nanoid();
            if (element.children) {
              element.children.forEach(updateChildrenIds);
            }
          };
          duplicated.children.forEach(updateChildrenIds);

          // Add duplicated element
          if (parentId) {
            const addToParent = (elements: CanvasElement[]): boolean => {
              for (const element of elements) {
                if (element.id === parentId) {
                  element.children.push(duplicated);
                  return true;
                }
                if (element.children.length > 0) {
                  if (addToParent(element.children)) {
                    return true;
                  }
                }
              }
              return false;
            };
            addToParent(state.elements);
          } else {
            state.elements.push(duplicated);
          }

          // Record history
          const change: ElementChange = {
            type: 'structure',
            elementId: duplicated.id,
            newValue: duplicated,
            timestamp: new Date(),
          };
          state.history = state.history.slice(0, state.historyIndex + 1);
          state.history.push(change);
          state.historyIndex = state.history.length - 1;
          state.isDirty = true;
        }
      }),

    reset: () =>
      set((state) => {
        Object.assign(state, DEFAULT_CANVAS_STATE);
      }),
  }))
);
