/**
 * Palette Store
 * Zustand store for managing component palette state
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  PaletteState,
  ComponentTemplate,
  ComponentCategory,
} from '@/types/components';
import { DEFAULT_PALETTE_STATE } from '@/types/components';
import { componentRegistry } from '@/services/components/component-registry';

interface PaletteStore extends PaletteState {
  // Actions
  setComponents: (components: ComponentTemplate[]) => void;
  toggleCategory: (category: ComponentCategory) => void;
  expandAllCategories: () => void;
  collapseAllCategories: () => void;
  setSelectedComponent: (componentId: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedTags: (tags: string[]) => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  reset: () => void;

  // Computed
  getFilteredComponents: () => ComponentTemplate[];
  getAllTags: () => string[];
  getComponentsByCategory: (category: ComponentCategory) => ComponentTemplate[];
}

export const usePaletteStore = create<PaletteStore>()(
  immer((set, get) => ({
    // Initial state
    ...DEFAULT_PALETTE_STATE,
    components: componentRegistry.getAllComponents(),

    // Actions
    setComponents: (components) =>
      set((state) => {
        state.components = components;
      }),

    toggleCategory: (category) =>
      set((state) => {
        const index = state.expandedCategories.indexOf(category);
        if (index > -1) {
          state.expandedCategories.splice(index, 1);
        } else {
          state.expandedCategories.push(category);
        }
      }),

    expandAllCategories: () =>
      set((state) => {
        state.expandedCategories = componentRegistry.getAllCategories();
      }),

    collapseAllCategories: () =>
      set((state) => {
        state.expandedCategories = [];
      }),

    setSelectedComponent: (componentId) =>
      set((state) => {
        state.selectedComponent = componentId;
      }),

    setSearchQuery: (query) =>
      set((state) => {
        state.searchQuery = query;
      }),

    setSelectedTags: (tags) =>
      set((state) => {
        state.selectedTags = tags;
      }),

    addTag: (tag) =>
      set((state) => {
        if (!state.selectedTags.includes(tag)) {
          state.selectedTags.push(tag);
        }
      }),

    removeTag: (tag) =>
      set((state) => {
        state.selectedTags = state.selectedTags.filter((t) => t !== tag);
      }),

    setViewMode: (mode) =>
      set((state) => {
        state.viewMode = mode;
      }),

    reset: () =>
      set((state) => {
        Object.assign(state, DEFAULT_PALETTE_STATE);
        state.components = componentRegistry.getAllComponents();
      }),

    // Computed
    getFilteredComponents: () => {
      const state = get();
      let filtered = componentRegistry.searchComponents(state.searchQuery);
      filtered = componentRegistry.filterByTags(filtered, state.selectedTags);
      return filtered;
    },

    getAllTags: () => {
      return componentRegistry.getAllTags();
    },

    getComponentsByCategory: (category) => {
      const state = get();
      const filtered = state.getFilteredComponents();
      return filtered.filter((c) => c.category === category);
    },
  }))
);
