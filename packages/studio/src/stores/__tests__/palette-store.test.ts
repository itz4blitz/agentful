/**
 * Palette Store Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePaletteStore } from '@/stores/palette-store';
import { componentRegistry } from '@/services/components/component-registry';

describe('PaletteStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const { reset } = usePaletteStore.getState();
    reset();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => usePaletteStore());

      expect(result.current.components.length).toBeGreaterThan(0);
      expect(result.current.searchQuery).toBe('');
      expect(result.current.selectedTags).toEqual([]);
      expect(result.current.viewMode).toBe('grid');
      expect(result.current.expandedCategories).toContain('layout');
      expect(result.current.expandedCategories).toContain('typography');
    });
  });

  describe('Search Functionality', () => {
    it('should filter components by search query', () => {
      const { result } = renderHook(() => usePaletteStore());

      act(() => {
        result.current.setSearchQuery('button');
      });

      const filtered = result.current.getFilteredComponents();
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every((c) => c.name.toLowerCase().includes('button') || c.description.toLowerCase().includes('button'))).toBe(true);
    });

    it('should return all components when query is empty', () => {
      const { result } = renderHook(() => usePaletteStore());

      act(() => {
        result.current.setSearchQuery('button');
      });

      const withQuery = result.current.getFilteredComponents().length;

      act(() => {
        result.current.setSearchQuery('');
      });

      const withoutQuery = result.current.getFilteredComponents().length;
      expect(withoutQuery).toBeGreaterThan(withQuery);
    });
  });

  describe('Tag Filtering', () => {
    it('should add tag to selected tags', () => {
      const { result } = renderHook(() => usePaletteStore());

      act(() => {
        result.current.addTag('form');
      });

      expect(result.current.selectedTags).toContain('form');
    });

    it('should not add duplicate tags', () => {
      const { result } = renderHook(() => usePaletteStore());

      act(() => {
        result.current.addTag('form');
        result.current.addTag('form');
      });

      expect(result.current.selectedTags.filter((t) => t === 'form').length).toBe(1);
    });

    it('should remove tag from selected tags', () => {
      const { result } = renderHook(() => usePaletteStore());

      act(() => {
        result.current.addTag('form');
        result.current.removeTag('form');
      });

      expect(result.current.selectedTags).not.toContain('form');
    });

    it('should set multiple tags', () => {
      const { result } = renderHook(() => usePaletteStore());

      act(() => {
        result.current.setSelectedTags(['form', 'input']);
      });

      expect(result.current.selectedTags).toEqual(['form', 'input']);
    });
  });

  describe('Category Expansion', () => {
    it('should toggle category expansion', () => {
      const { result } = renderHook(() => usePaletteStore());

      const initialExpanded = result.current.expandedCategories.includes('layout');

      act(() => {
        result.current.toggleCategory('layout');
      });

      const afterToggle = result.current.expandedCategories.includes('layout');
      expect(afterToggle).toBe(!initialExpanded);
    });

    it('should expand all categories', () => {
      const { result } = renderHook(() => usePaletteStore());

      act(() => {
        result.current.expandAllCategories();
      });

      const allCategories = componentRegistry.getAllCategories();
      expect(result.current.expandedCategories.length).toBe(allCategories.length);
    });

    it('should collapse all categories', () => {
      const { result } = renderHook(() => usePaletteStore());

      act(() => {
        result.current.collapseAllCategories();
      });

      expect(result.current.expandedCategories.length).toBe(0);
    });
  });

  describe('View Mode', () => {
    it('should toggle between grid and list view', () => {
      const { result } = renderHook(() => usePaletteStore());

      expect(result.current.viewMode).toBe('grid');

      act(() => {
        result.current.setViewMode('list');
      });

      expect(result.current.viewMode).toBe('list');

      act(() => {
        result.current.setViewMode('grid');
      });

      expect(result.current.viewMode).toBe('grid');
    });
  });

  describe('Component Selection', () => {
    it('should set selected component', () => {
      const { result } = renderHook(() => usePaletteStore());

      act(() => {
        result.current.setSelectedComponent('button-primary');
      });

      expect(result.current.selectedComponent).toBe('button-primary');
    });

    it('should clear selected component', () => {
      const { result } = renderHook(() => usePaletteStore());

      act(() => {
        result.current.setSelectedComponent('button-primary');
        result.current.setSelectedComponent(null);
      });

      expect(result.current.selectedComponent).toBeNull();
    });
  });

  describe('Filter Combinations', () => {
    it('should filter by both search query and tags', () => {
      const { result } = renderHook(() => usePaletteStore());

      act(() => {
        result.current.setSearchQuery('button');
        result.current.setSelectedTags(['form']);
      });

      const filtered = result.current.getFilteredComponents();
      expect(filtered.length).toBeGreaterThan(0);
    });

    it('should return empty array when no components match', () => {
      const { result } = renderHook(() => usePaletteStore());

      act(() => {
        result.current.setSearchQuery('nonexistent-component-xyz');
      });

      const filtered = result.current.getFilteredComponents();
      expect(filtered.length).toBe(0);
    });
  });

  describe('Component Retrieval', () => {
    it('should get all unique tags', () => {
      const { result } = renderHook(() => usePaletteStore());

      const tags = result.current.getAllTags();
      expect(tags.length).toBeGreaterThan(0);
      expect(tags).toEqual(expect.arrayContaining(['form', 'button', 'input']));
    });

    it('should get components by category', () => {
      const { result } = renderHook(() => usePaletteStore());

      const layoutComponents = result.current.getComponentsByCategory('layout');
      expect(layoutComponents.length).toBeGreaterThan(0);
      expect(layoutComponents.every((c) => c.category === 'layout')).toBe(true);
    });
  });

  describe('Reset', () => {
    it('should reset to default state', () => {
      const { result } = renderHook(() => usePaletteStore());

      act(() => {
        result.current.setSearchQuery('test');
        result.current.setSelectedTags(['form']);
        result.current.setViewMode('list');
        result.current.setSelectedComponent('button-primary');
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.searchQuery).toBe('');
      expect(result.current.selectedTags).toEqual([]);
      expect(result.current.viewMode).toBe('grid');
      expect(result.current.selectedComponent).toBeNull();
    });
  });
});
