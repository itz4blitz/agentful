/**
 * DnD Store Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDndStore } from '@/stores/dnd-store';
import type { DragData, DropTarget } from '@/types/dnd';
import { DEFAULT_DND_STATE } from '@/types/dnd';

describe('DndStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const { reset } = useDndStore.getState();
    reset();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useDndStore());

      expect(result.current.isDragging).toBe(false);
      expect(result.current.activeId).toBe(null);
      expect(result.current.overId).toBe(null);
      expect(result.current.dragData).toBe(null);
      expect(result.current.dropTarget).toBe(null);
      expect(result.current.draggedElement).toBe(null);
      expect(result.current.pointerCoordinates).toBe(null);
    });
  });

  describe('startDrag', () => {
    it('should start drag with correct data', () => {
      const { result } = renderHook(() => useDndStore());

      const dragData: DragData = {
        type: 'palette',
        source: 'palette',
        componentId: 'button-1',
      };

      act(() => {
        result.current.startDrag('test-id', dragData);
      });

      expect(result.current.isDragging).toBe(true);
      expect(result.current.activeId).toBe('test-id');
      expect(result.current.dragData).toEqual(dragData);
    });
  });

  describe('endDrag', () => {
    it('should clear all drag state', () => {
      const { result } = renderHook(() => useDndStore());

      const dragData: DragData = {
        type: 'palette',
        source: 'palette',
        componentId: 'button-1',
      };

      act(() => {
        result.current.startDrag('test-id', dragData);
        result.current.setOver('over-id');
        result.current.setDropTarget({
          targetId: 'over-id',
          position: 'inside',
          index: 0,
        });
      });

      act(() => {
        result.current.endDrag();
      });

      expect(result.current.isDragging).toBe(false);
      expect(result.current.activeId).toBe(null);
      expect(result.current.overId).toBe(null);
      expect(result.current.dragData).toBe(null);
      expect(result.current.dropTarget).toBe(null);
    });
  });

  describe('setOver', () => {
    it('should set over element', () => {
      const { result } = renderHook(() => useDndStore());

      act(() => {
        result.current.setOver('over-id');
      });

      expect(result.current.overId).toBe('over-id');
    });

    it('should clear over element with null', () => {
      const { result } = renderHook(() => useDndStore());

      act(() => {
        result.current.setOver('over-id');
        result.current.setOver(null);
      });

      expect(result.current.overId).toBe(null);
    });
  });

  describe('setDropTarget', () => {
    it('should set drop target', () => {
      const { result } = renderHook(() => useDndStore());

      const dropTarget: DropTarget = {
        targetId: 'target-id',
        position: 'before',
        index: 0,
      };

      act(() => {
        result.current.setDropTarget(dropTarget);
      });

      expect(result.current.dropTarget).toEqual(dropTarget);
    });
  });

  describe('cancelDrag', () => {
    it('should cancel drag and clear state', () => {
      const { result } = renderHook(() => useDndStore());

      const dragData: DragData = {
        type: 'palette',
        source: 'palette',
        componentId: 'button-1',
      };

      act(() => {
        result.current.startDrag('test-id', dragData);
        result.current.setOver('over-id');
      });

      act(() => {
        result.current.cancelDrag();
      });

      expect(result.current.isDragging).toBe(false);
      expect(result.current.activeId).toBe(null);
      expect(result.current.overId).toBe(null);
    });
  });

  describe('canDrop', () => {
    it('should return true when all conditions met', () => {
      const { result } = renderHook(() => useDndStore());

      const dragData: DragData = {
        type: 'palette',
        source: 'palette',
        componentId: 'button-1',
      };

      const dropTarget: DropTarget = {
        targetId: 'target-id',
        position: 'inside',
        index: 0,
      };

      act(() => {
        result.current.startDrag('test-id', dragData);
        result.current.setOver('over-id');
        result.current.setDropTarget(dropTarget);
      });

      expect(result.current.canDrop()).toBe(true);
    });

    it('should return false when not dragging', () => {
      const { result } = renderHook(() => useDndStore());

      expect(result.current.canDrop()).toBe(false);
    });

    it('should return false when no drop target', () => {
      const { result } = renderHook(() => useDndStore());

      const dragData: DragData = {
        type: 'palette',
        source: 'palette',
        componentId: 'button-1',
      };

      act(() => {
        result.current.startDrag('test-id', dragData);
        result.current.setOver('over-id');
      });

      expect(result.current.canDrop()).toBe(false);
    });
  });

  describe('getDropPosition', () => {
    it('should return drop position', () => {
      const { result } = renderHook(() => useDndStore());

      const dropTarget: DropTarget = {
        targetId: 'target-id',
        position: 'after',
        index: 1,
      };

      act(() => {
        result.current.setDropTarget(dropTarget);
      });

      expect(result.current.getDropPosition()).toBe('after');
    });

    it('should return null when no drop target', () => {
      const { result } = renderHook(() => useDndStore());

      expect(result.current.getDropPosition()).toBe(null);
    });
  });

  describe('isDraggingFrom', () => {
    it('should return true when dragging from specified source', () => {
      const { result } = renderHook(() => useDndStore());

      const dragData: DragData = {
        type: 'palette',
        source: 'palette',
        componentId: 'button-1',
      };

      act(() => {
        result.current.startDrag('test-id', dragData);
      });

      expect(result.current.isDraggingFrom('palette')).toBe(true);
      expect(result.current.isDraggingFrom('canvas')).toBe(false);
    });

    it('should return false when not dragging', () => {
      const { result } = renderHook(() => useDndStore());

      expect(result.current.isDraggingFrom('palette')).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset to default state', () => {
      const { result } = renderHook(() => useDndStore());

      const dragData: DragData = {
        type: 'palette',
        source: 'palette',
        componentId: 'button-1',
      };

      act(() => {
        result.current.startDrag('test-id', dragData);
        result.current.setOver('over-id');
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.isDragging).toBe(DEFAULT_DND_STATE.isDragging);
      expect(result.current.activeId).toBe(DEFAULT_DND_STATE.activeId);
      expect(result.current.overId).toBe(DEFAULT_DND_STATE.overId);
      expect(result.current.dragData).toBe(DEFAULT_DND_STATE.dragData);
      expect(result.current.dropTarget).toBe(DEFAULT_DND_STATE.dropTarget);
    });
  });
});
