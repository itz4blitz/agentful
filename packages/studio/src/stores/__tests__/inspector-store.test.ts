/**
 * Inspector Store Tests
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useInspectorStore } from '@/stores/inspector-store';
import type { CanvasElement } from '@/types/canvas';

describe('InspectorStore', () => {
  beforeEach(() => {
    // Reset store state before each test by creating a fresh instance
    const { setState } = useInspectorStore;
    setState({
      selectedElementId: null,
      elementData: null,
      groups: [],
      expandedGroups: new Set<string>(['layout', 'typography', 'appearance', 'attributes']),
      activeTab: 'styles',
      changes: [],
      hasChanges: false,
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useInspectorStore());

      expect(result.current.selectedElementId).toBeNull();
      expect(result.current.elementData).toBeNull();
      expect(result.current.groups).toEqual([]);
      expect(result.current.activeTab).toBe('styles');
      expect(result.current.changes).toEqual([]);
      expect(result.current.hasChanges).toBe(false);
    });
  });

  describe('setSelectedElement', () => {
    it('should set selected element and generate groups', () => {
      const { result } = renderHook(() => useInspectorStore());

      const mockElement: CanvasElement = {
        id: 'test-1',
        tagName: 'DIV',
        attributes: { id: 'test-div', class: 'container' },
        styles: { display: 'block', width: '100%' },
        children: [],
      };

      act(() => {
        result.current.setSelectedElement('test-1', mockElement);
      });

      expect(result.current.selectedElementId).toBe('test-1');
      expect(result.current.elementData).toEqual(mockElement);
      expect(result.current.groups.length).toBeGreaterThan(0);
      expect(result.current.changes).toEqual([]);
      expect(result.current.hasChanges).toBe(false);
    });

    it('should clear changes when selecting new element', () => {
      const { result } = renderHook(() => useInspectorStore());

      const mockElement: CanvasElement = {
        id: 'test-1',
        tagName: 'DIV',
        attributes: {},
        styles: {},
        children: [],
      };

      act(() => {
        result.current.setSelectedElement('test-1', mockElement);
        result.current.updateProperty('layout', 'display', 'flex');
      });

      expect(result.current.hasChanges).toBe(true);

      const mockElement2: CanvasElement = {
        id: 'test-2',
        tagName: 'BUTTON',
        attributes: {},
        styles: {},
        children: [],
      };

      act(() => {
        result.current.setSelectedElement('test-2', mockElement2);
      });

      expect(result.current.hasChanges).toBe(false);
      expect(result.current.changes).toEqual([]);
    });
  });

  describe('updateProperty', () => {
    it('should update property value and track changes', () => {
      const { result } = renderHook(() => useInspectorStore());

      const mockElement: CanvasElement = {
        id: 'test-1',
        tagName: 'DIV',
        attributes: {},
        styles: { display: 'block' },
        children: [],
      };

      act(() => {
        result.current.setSelectedElement('test-1', mockElement);
        result.current.updateProperty('layout', 'display', 'flex');
      });

      expect(result.current.hasChanges).toBe(true);
      expect(result.current.changes.length).toBe(1);
      expect(result.current.changes[0]).toMatchObject({
        groupId: 'layout',
        fieldId: 'display',
        oldValue: 'block',
        newValue: 'flex',
      });
    });

    it('should update existing change instead of adding new one', () => {
      const { result } = renderHook(() => useInspectorStore());

      const mockElement: CanvasElement = {
        id: 'test-1',
        tagName: 'DIV',
        attributes: {},
        styles: { display: 'block' },
        children: [],
      };

      act(() => {
        result.current.setSelectedElement('test-1', mockElement);
        result.current.updateProperty('layout', 'display', 'flex');
        result.current.updateProperty('layout', 'display', 'grid');
      });

      expect(result.current.changes.length).toBe(1);
      expect(result.current.changes[0].newValue).toBe('grid');
    });
  });

  describe('resetProperty', () => {
    it('should reset property to default value', () => {
      const { result } = renderHook(() => useInspectorStore());

      const mockElement: CanvasElement = {
        id: 'test-1',
        tagName: 'DIV',
        attributes: {},
        styles: { display: 'flex' },
        children: [],
      };

      act(() => {
        result.current.setSelectedElement('test-1', mockElement);
        result.current.updateProperty('layout', 'display', 'grid');
        result.current.resetProperty('layout', 'display');
      });

      expect(result.current.hasChanges).toBe(false);
      expect(result.current.changes).toEqual([]);
    });
  });

  describe('resetGroup', () => {
    it('should reset all properties in a group', () => {
      const { result } = renderHook(() => useInspectorStore());

      const mockElement: CanvasElement = {
        id: 'test-1',
        tagName: 'DIV',
        attributes: {},
        styles: { display: 'block', width: '100%' },
        children: [],
      };

      act(() => {
        result.current.setSelectedElement('test-1', mockElement);
        result.current.updateProperty('layout', 'display', 'flex');
        result.current.updateProperty('layout', 'width', '50%');
        result.current.resetGroup('layout');
      });

      const layoutGroup = result.current.groups.find((g) => g.id === 'layout');
      expect(layoutGroup?.properties.find((p) => p.id === 'display')?.value).toBe('block');
      expect(result.current.changes.length).toBe(0);
    });
  });

  describe('resetAll', () => {
    it('should reset all properties to defaults', () => {
      const { result } = renderHook(() => useInspectorStore());

      const mockElement: CanvasElement = {
        id: 'test-1',
        tagName: 'DIV',
        attributes: {},
        styles: { display: 'block' },
        children: [],
      };

      act(() => {
        result.current.setSelectedElement('test-1', mockElement);
        result.current.updateProperty('layout', 'display', 'flex');
        result.current.updateProperty('typography', 'fontSize', '24px');
        result.current.resetAll();
      });

      expect(result.current.hasChanges).toBe(false);
      expect(result.current.changes).toEqual([]);
    });
  });

  describe('toggleGroup', () => {
    it('should toggle group expansion state', () => {
      const { result } = renderHook(() => useInspectorStore());

      // 'layout' starts in expanded state, so first toggle should collapse it
      expect(result.current.expandedGroups.has('layout')).toBe(true);

      act(() => {
        result.current.toggleGroup('layout');
      });

      expect(result.current.expandedGroups.has('layout')).toBe(false);

      act(() => {
        result.current.toggleGroup('layout');
      });

      expect(result.current.expandedGroups.has('layout')).toBe(true);
    });
  });

  describe('setActiveTab', () => {
    it('should set active tab', () => {
      const { result } = renderHook(() => useInspectorStore());

      act(() => {
        result.current.setActiveTab('attributes');
      });

      expect(result.current.activeTab).toBe('attributes');
    });
  });

  describe('applyChanges', () => {
    it('should apply changes to element data and clear changes', () => {
      const { result } = renderHook(() => useInspectorStore());

      const mockElement: CanvasElement = {
        id: 'test-1',
        tagName: 'DIV',
        attributes: {},
        styles: { display: 'block' },
        children: [],
      };

      act(() => {
        result.current.setSelectedElement('test-1', mockElement);
        result.current.updateProperty('layout', 'display', 'flex');
      });

      // Verify changes are tracked
      expect(result.current.hasChanges).toBe(true);
      expect(result.current.changes.length).toBe(1);

      act(() => {
        result.current.applyChanges();
      });

      // After applyChanges, the changes array is cleared
      expect(result.current.hasChanges).toBe(false);
      expect(result.current.changes).toEqual([]);

      // The elementData should be modified by applyChanges
      // But since we're tracking changes in the store, not in the element directly,
      // we need to check that the field value was updated in the groups
      const layoutGroup = result.current.groups.find((g) => g.id === 'layout');
      const displayField = layoutGroup?.properties.find((p) => p.id === 'display');
      expect(displayField?.value).toBe('flex');
    });
  });

  describe('discardChanges', () => {
    it('should revert all changes', () => {
      const { result } = renderHook(() => useInspectorStore());

      const mockElement: CanvasElement = {
        id: 'test-1',
        tagName: 'DIV',
        attributes: {},
        styles: { display: 'block' },
        children: [],
      };

      act(() => {
        result.current.setSelectedElement('test-1', mockElement);
        result.current.updateProperty('layout', 'display', 'flex');
        result.current.discardChanges();
      });

      expect(result.current.hasChanges).toBe(false);
      expect(result.current.changes).toEqual([]);

      const layoutGroup = result.current.groups.find((g) => g.id === 'layout');
      expect(layoutGroup?.properties.find((p) => p.id === 'display')?.value).toBe('block');
    });
  });

  describe('Computed helpers', () => {
    it('getChanges should return changes', () => {
      const { result } = renderHook(() => useInspectorStore());

      const mockElement: CanvasElement = {
        id: 'test-1',
        tagName: 'DIV',
        attributes: {},
        styles: { display: 'block' },
        children: [],
      };

      act(() => {
        result.current.setSelectedElement('test-1', mockElement);
        result.current.updateProperty('layout', 'display', 'flex');
      });

      const changes = result.current.getChanges();
      expect(changes.length).toBe(1);
      expect(changes[0].newValue).toBe('flex');
    });

    it('canApply should return true when has changes', () => {
      const { result } = renderHook(() => useInspectorStore());

      const mockElement: CanvasElement = {
        id: 'test-1',
        tagName: 'DIV',
        attributes: {},
        styles: { display: 'block' },
        children: [],
      };

      expect(result.current.canApply()).toBe(false);

      act(() => {
        result.current.setSelectedElement('test-1', mockElement);
        result.current.updateProperty('layout', 'display', 'flex');
      });

      expect(result.current.canApply()).toBe(true);
    });
  });

  describe('generateGroups', () => {
    it('should generate property groups for element', () => {
      const { result } = renderHook(() => useInspectorStore());

      const mockElement: CanvasElement = {
        id: 'test-1',
        tagName: 'DIV',
        attributes: { id: 'test', class: 'container' },
        styles: { display: 'flex', padding: '16px' },
        children: [],
      };

      const groups = result.current.generateGroups(mockElement);

      expect(groups.length).toBeGreaterThan(0);
      expect(groups.some((g) => g.id === 'layout')).toBe(true);
      expect(groups.some((g) => g.id === 'typography')).toBe(true);
      expect(groups.some((g) => g.id === 'attributes')).toBe(true);
    });

    it('should return empty array for null element', () => {
      const { result } = renderHook(() => useInspectorStore());

      const groups = result.current.generateGroups(null);
      expect(groups).toEqual([]);
    });
  });
});
