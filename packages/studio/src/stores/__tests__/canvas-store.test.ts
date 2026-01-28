/**
 * Canvas Store Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCanvasStore } from '@/stores/canvas-store';
import type { CanvasElement } from '@/types/canvas';

describe('CanvasStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const { reset } = useCanvasStore.getState();
    reset();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useCanvasStore());

      expect(result.current.elements).toEqual([]);
      expect(result.current.selectedElement).toBeNull();
      expect(result.current.hoveredElement).toBeNull();
      expect(result.current.html).toBe('');
      expect(result.current.isDirty).toBe(false);
      expect(result.current.history).toEqual([]);
      expect(result.current.historyIndex).toBe(-1);
      expect(result.current.clipboard).toBeNull();
    });
  });

  describe('setElements', () => {
    it('should set elements and mark as dirty', () => {
      const { result } = renderHook(() => useCanvasStore());
      const elements: CanvasElement[] = [
        {
          id: 'test-1',
          tagName: 'div',
          attributes: {},
          styles: {},
          children: [],
        },
      ];

      act(() => {
        result.current.setElements(elements);
      });

      expect(result.current.elements).toEqual(elements);
      expect(result.current.isDirty).toBe(true);
    });
  });

  describe('setSelectedElement', () => {
    it('should set selected element', () => {
      const { result } = renderHook(() => useCanvasStore());
      const selection = {
        elementId: 'test-1',
        element: {} as CanvasElement,
        path: [],
      };

      act(() => {
        result.current.setSelectedElement(selection);
      });

      expect(result.current.selectedElement).toEqual(selection);
    });

    it('should clear selection when null is passed', () => {
      const { result } = renderHook(() => useCanvasStore());

      act(() => {
        result.current.setSelectedElement({
          elementId: 'test-1',
          element: {} as CanvasElement,
          path: [],
        });
      });

      act(() => {
        result.current.setSelectedElement(null);
      });

      expect(result.current.selectedElement).toBeNull();
    });
  });

  describe('setHoveredElement', () => {
    it('should set hovered element', () => {
      const { result } = renderHook(() => useCanvasStore());

      act(() => {
        result.current.setHoveredElement('test-1');
      });

      expect(result.current.hoveredElement).toBe('test-1');
    });

    it('should clear hover when null is passed', () => {
      const { result } = renderHook(() => useCanvasStore());

      act(() => {
        result.current.setHoveredElement('test-1');
      });

      act(() => {
        result.current.setHoveredElement(null);
      });

      expect(result.current.hoveredElement).toBeNull();
    });
  });

  describe('setHTML', () => {
    it('should set HTML and mark as dirty', () => {
      const { result } = renderHook(() => useCanvasStore());
      const html = '<div>Test</div>';

      act(() => {
        result.current.setHTML(html);
      });

      expect(result.current.html).toBe(html);
      expect(result.current.isDirty).toBe(true);
    });
  });

  describe('addElement', () => {
    it('should add element to root', () => {
      const { result } = renderHook(() => useCanvasStore());
      const element: CanvasElement = {
        id: 'test-1',
        tagName: 'div',
        attributes: {},
        styles: {},
        children: [],
      };

      act(() => {
        result.current.addElement(element);
      });

      expect(result.current.elements).toHaveLength(1);
      expect(result.current.elements[0].id).toBe('test-1');
      expect(result.current.isDirty).toBe(true);
    });

    it('should add element as child of parent', () => {
      const { result } = renderHook(() => useCanvasStore());
      const parent: CanvasElement = {
        id: 'parent-1',
        tagName: 'div',
        attributes: {},
        styles: {},
        children: [],
      };
      const child: CanvasElement = {
        id: 'child-1',
        tagName: 'p',
        attributes: {},
        styles: {},
        children: [],
      };

      act(() => {
        result.current.addElement(parent);
      });

      act(() => {
        result.current.addElement(child, 'parent-1');
      });

      expect(result.current.elements[0].children).toHaveLength(1);
      expect(result.current.elements[0].children[0].id).toBe('child-1');
    });

    it('should record history when adding element', () => {
      const { result } = renderHook(() => useCanvasStore());
      const element: CanvasElement = {
        id: 'test-1',
        tagName: 'div',
        attributes: {},
        styles: {},
        children: [],
      };

      act(() => {
        result.current.addElement(element);
      });

      expect(result.current.history).toHaveLength(1);
      expect(result.current.historyIndex).toBe(0);
    });
  });

  describe('removeElement', () => {
    it('should remove element from root', () => {
      const { result } = renderHook(() => useCanvasStore());
      const element: CanvasElement = {
        id: 'test-1',
        tagName: 'div',
        attributes: {},
        styles: {},
        children: [],
      };

      act(() => {
        result.current.addElement(element);
      });

      act(() => {
        result.current.removeElement('test-1');
      });

      expect(result.current.elements).toHaveLength(0);
      expect(result.current.isDirty).toBe(true);
    });

    it('should remove child element', () => {
      const { result } = renderHook(() => useCanvasStore());
      const parent: CanvasElement = {
        id: 'parent-1',
        tagName: 'div',
        attributes: {},
        styles: {},
        children: [],
      };
      const child: CanvasElement = {
        id: 'child-1',
        tagName: 'p',
        attributes: {},
        styles: {},
        children: [],
      };

      act(() => {
        result.current.addElement(parent);
      });

      act(() => {
        result.current.addElement(child, 'parent-1');
      });

      act(() => {
        result.current.removeElement('child-1');
      });

      expect(result.current.elements[0].children).toHaveLength(0);
    });

    it('should clear selection when removing selected element', () => {
      const { result } = renderHook(() => useCanvasStore());
      const element: CanvasElement = {
        id: 'test-1',
        tagName: 'div',
        attributes: {},
        styles: {},
        children: [],
      };

      act(() => {
        result.current.addElement(element);
      });

      act(() => {
        result.current.setSelectedElement({
          elementId: 'test-1',
          element,
          path: [],
        });
      });

      act(() => {
        result.current.removeElement('test-1');
      });

      expect(result.current.selectedElement).toBeNull();
    });
  });

  describe('duplicateElement', () => {
    it('should duplicate element', () => {
      const { result } = renderHook(() => useCanvasStore());
      const element: CanvasElement = {
        id: 'test-1',
        tagName: 'div',
        attributes: { class: 'test' },
        styles: {},
        children: [],
      };

      act(() => {
        result.current.addElement(element);
      });

      act(() => {
        result.current.duplicateElement('test-1');
      });

      expect(result.current.elements).toHaveLength(2);
      expect(result.current.elements[0].id).toBe('test-1');
      expect(result.current.elements[1].id).not.toBe('test-1');
      expect(result.current.elements[1].attributes).toEqual({ class: 'test' });
    });

    it('should generate unique IDs for duplicated elements', () => {
      const { result } = renderHook(() => useCanvasStore());
      const element: CanvasElement = {
        id: 'test-1',
        tagName: 'div',
        attributes: {},
        styles: {},
        children: [
          {
            id: 'child-1',
            tagName: 'p',
            attributes: {},
            styles: {},
            children: [],
          },
        ],
      };

      act(() => {
        result.current.addElement(element);
      });

      act(() => {
        result.current.duplicateElement('test-1');
      });

      const duplicated = result.current.elements[1];
      expect(duplicated.id).not.toBe('test-1');
      expect(duplicated.children[0].id).not.toBe('child-1');
    });
  });

  describe('copyToClipboard and pasteFromClipboard', () => {
    it('should copy element to clipboard', () => {
      const { result } = renderHook(() => useCanvasStore());
      const element: CanvasElement = {
        id: 'test-1',
        tagName: 'div',
        attributes: { class: 'test' },
        styles: {},
        children: [],
      };

      act(() => {
        result.current.addElement(element);
      });

      act(() => {
        result.current.copyToClipboard('test-1');
      });

      expect(result.current.clipboard).toEqual(element);
    });

    it('should paste from clipboard', () => {
      const { result } = renderHook(() => useCanvasStore());
      const element: CanvasElement = {
        id: 'test-1',
        tagName: 'div',
        attributes: { class: 'test' },
        styles: {},
        children: [],
      };

      act(() => {
        result.current.addElement(element);
      });

      act(() => {
        result.current.copyToClipboard('test-1');
      });

      act(() => {
        result.current.pasteFromClipboard();
      });

      expect(result.current.elements).toHaveLength(2);
      expect(result.current.elements[0].id).toBe('test-1');
      expect(result.current.elements[1].id).not.toBe('test-1');
    });
  });

  describe('undo and redo', () => {
    it('should undo element addition', () => {
      const { result } = renderHook(() => useCanvasStore());
      const element: CanvasElement = {
        id: 'test-1',
        tagName: 'div',
        attributes: {},
        styles: {},
        children: [],
      };

      act(() => {
        result.current.addElement(element);
      });

      expect(result.current.elements).toHaveLength(1);

      act(() => {
        result.current.undo();
      });

      expect(result.current.elements).toHaveLength(0);
    });

    it('should redo undone action', () => {
      const { result } = renderHook(() => useCanvasStore());
      const element: CanvasElement = {
        id: 'test-1',
        tagName: 'div',
        attributes: {},
        styles: {},
        children: [],
      };

      act(() => {
        result.current.addElement(element);
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.elements).toHaveLength(0);

      act(() => {
        result.current.redo();
      });

      expect(result.current.elements).toHaveLength(1);
    });

    it('should clear history', () => {
      const { result } = renderHook(() => useCanvasStore());
      const element: CanvasElement = {
        id: 'test-1',
        tagName: 'div',
        attributes: {},
        styles: {},
        children: [],
      };

      act(() => {
        result.current.addElement(element);
      });

      expect(result.current.history).toHaveLength(1);

      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.history).toHaveLength(0);
      expect(result.current.historyIndex).toBe(-1);
    });
  });

  describe('reset', () => {
    it('should reset store to initial state', () => {
      const { result } = renderHook(() => useCanvasStore());
      const element: CanvasElement = {
        id: 'test-1',
        tagName: 'div',
        attributes: {},
        styles: {},
        children: [],
      };

      act(() => {
        result.current.addElement(element);
      });

      act(() => {
        result.current.setSelectedElement({
          elementId: 'test-1',
          element,
          path: [],
        });
      });

      act(() => {
        result.current.setHoveredElement('test-1');
      });

      act(() => {
        result.current.setHTML('<div>test</div>');
      });

      expect(result.current.elements).toHaveLength(1);
      expect(result.current.selectedElement).not.toBeNull();
      expect(result.current.hoveredElement).not.toBeNull();
      expect(result.current.html).not.toBe('');

      act(() => {
        result.current.reset();
      });

      expect(result.current.elements).toEqual([]);
      expect(result.current.selectedElement).toBeNull();
      expect(result.current.hoveredElement).toBeNull();
      expect(result.current.html).toBe('');
      expect(result.current.isDirty).toBe(false);
    });
  });
});
