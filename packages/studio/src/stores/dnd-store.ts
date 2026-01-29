/**
 * DnD Store
 * Zustand store for managing drag and drop state
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  DndState,
  DragData,
  DropTarget,
  DropPosition,
} from '@/types/dnd';
import { DEFAULT_DND_STATE } from '@/types/dnd';

interface DndStore extends DndState {
  // Actions
  startDrag: (activeId: string, dragData: DragData) => void;
  endDrag: () => void;
  setOver: (overId: string | null) => void;
  setDropTarget: (target: DropTarget | null) => void;
  setDraggedElement: (element: HTMLElement | null) => void;
  setPointerCoordinates: (coordinates: { x: number; y: number } | null) => void;
  cancelDrag: () => void;
  reset: () => void;

  // Computed
  canDrop: () => boolean;
  getDropPosition: () => DropPosition | null;
  isDraggingFrom: (source: string) => boolean;
}

export const useDndStore = create<DndStore>()(
  immer((set, get) => ({
    // Initial state
    ...DEFAULT_DND_STATE,

    // Actions
    startDrag: (activeId, dragData) =>
      set((state) => {
        state.isDragging = true;
        state.activeId = activeId;
        state.dragData = dragData;
      }),

    endDrag: () =>
      set((state) => {
        state.isDragging = false;
        state.activeId = null;
        state.overId = null;
        state.dragData = null;
        state.dropTarget = null;
        state.draggedElement = null;
        state.pointerCoordinates = null;
      }),

    setOver: (overId) =>
      set((state) => {
        state.overId = overId;
      }),

    setDropTarget: (target) =>
      set((state) => {
        state.dropTarget = target;
      }),

    setDraggedElement: (element) =>
      set((state) => {
        state.draggedElement = element;
      }),

    setPointerCoordinates: (coordinates) =>
      set((state) => {
        state.pointerCoordinates = coordinates;
      }),

    cancelDrag: () =>
      set((state) => {
        state.isDragging = false;
        state.activeId = null;
        state.overId = null;
        state.dragData = null;
        state.dropTarget = null;
        state.draggedElement = null;
        state.pointerCoordinates = null;
      }),

    reset: () =>
      set((state) => {
        Object.assign(state, DEFAULT_DND_STATE);
      }),

    // Computed
    canDrop: () => {
      const state = get();
      return (
        state.isDragging &&
        state.activeId !== null &&
        state.overId !== null &&
        state.dropTarget !== null
      );
    },

    getDropPosition: () => {
      const state = get();
      return state.dropTarget?.position || null;
    },

    isDraggingFrom: (source) => {
      const state = get();
      return state.dragData?.source === source;
    },
  }))
);
