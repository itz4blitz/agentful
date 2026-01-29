/**
 * shadcn/ui Palette Store
 * Manages shadcn components + user components
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { shadcnRegistry, getShadcnComponent } from '@/services/components/shadcn-registry';
import type { ComponentDefinition, UserComponent } from '@/types/component-system';

interface ShadcnPaletteState {
  // Component sources
  shadcnComponents: ComponentDefinition[];
  userComponents: UserComponent[];
  
  // UI State
  expandedCategories: string[];
  selectedComponent: string | null;
  searchQuery: string;
  selectedTags: string[];
  viewMode: 'grid' | 'list';
  activeCategory: string | null;
  
  // Actions
  setUserComponents: (components: UserComponent[]) => void;
  addUserComponent: (component: UserComponent) => void;
  removeUserComponent: (id: string) => void;
  toggleCategory: (category: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  setSelectedComponent: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedTags: (tags: string[]) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setActiveCategory: (category: string | null) => void;
  reset: () => void;
  
  // Computed (as functions)
  getAllComponents: () => (ComponentDefinition | UserComponent)[];
  getFilteredComponents: () => (ComponentDefinition | UserComponent)[];
  getComponentById: (id: string) => ComponentDefinition | UserComponent | undefined;
  getAllTags: () => string[];
  getCategories: () => string[];
}

const DEFAULT_EXPANDED = ['layout', 'forms'];

export const useShadcnPaletteStore = create<ShadcnPaletteState>()(
  immer((set, get) => ({
    // Initial state
    shadcnComponents: shadcnRegistry,
    userComponents: [],
    expandedCategories: DEFAULT_EXPANDED,
    selectedComponent: null,
    searchQuery: '',
    selectedTags: [],
    viewMode: 'grid',
    activeCategory: null,

    // Actions
    setUserComponents: (components) =>
      set((state) => {
        state.userComponents = components;
      }),

    addUserComponent: (component) =>
      set((state) => {
        const exists = state.userComponents.find(c => c.id === component.id);
        if (!exists) {
          state.userComponents.push(component);
        }
      }),

    removeUserComponent: (id) =>
      set((state) => {
        state.userComponents = state.userComponents.filter(c => c.id !== id);
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

    expandAll: () =>
      set((state) => {
        const allCategories = [...new Set([
          ...state.shadcnComponents.map(c => c.category),
          ...state.userComponents.map(c => c.category),
        ])];
        state.expandedCategories = allCategories;
      }),

    collapseAll: () =>
      set((state) => {
        state.expandedCategories = [];
      }),

    setSelectedComponent: (id) =>
      set((state) => {
        state.selectedComponent = id;
      }),

    setSearchQuery: (query) =>
      set((state) => {
        state.searchQuery = query;
      }),

    setSelectedTags: (tags) =>
      set((state) => {
        state.selectedTags = tags;
      }),

    setViewMode: (mode) =>
      set((state) => {
        state.viewMode = mode;
      }),

    setActiveCategory: (category) =>
      set((state) => {
        state.activeCategory = category;
      }),

    reset: () =>
      set((state) => {
        state.expandedCategories = DEFAULT_EXPANDED;
        state.selectedComponent = null;
        state.searchQuery = '';
        state.selectedTags = [];
        state.viewMode = 'grid';
        state.activeCategory = null;
      }),

    // Computed functions
    getAllComponents: () => {
      const state = get();
      return [...state.shadcnComponents, ...state.userComponents];
    },

    getFilteredComponents: () => {
      const state = get();
      const all = [...state.shadcnComponents, ...state.userComponents];
      
      if (!state.searchQuery && state.selectedTags.length === 0 && !state.activeCategory) {
        return all;
      }

      return all.filter((component) => {
        // Filter by search query
        if (state.searchQuery) {
          const query = state.searchQuery.toLowerCase();
          const matchesSearch =
            component.name.toLowerCase().includes(query) ||
            component.description.toLowerCase().includes(query) ||
            component.tags.some(tag => tag.toLowerCase().includes(query));
          
          if (!matchesSearch) return false;
        }

        // Filter by tags
        if (state.selectedTags.length > 0) {
          const hasTag = state.selectedTags.some(tag => 
            component.tags.includes(tag)
          );
          if (!hasTag) return false;
        }

        // Filter by category
        if (state.activeCategory && component.category !== state.activeCategory) {
          return false;
        }

        return true;
      });
    },

    getComponentById: (id) => {
      const state = get();
      return getShadcnComponent(id) || state.userComponents.find(c => c.id === id);
    },

    getAllTags: () => {
      const state = get();
      const all = [...state.shadcnComponents, ...state.userComponents];
      const tags = new Set<string>();
      all.forEach(c => c.tags.forEach(t => tags.add(t)));
      return Array.from(tags).sort();
    },

    getCategories: () => {
      const state = get();
      const all = [...state.shadcnComponents, ...state.userComponents];
      const categories = new Set<string>();
      all.forEach(c => categories.add(c.category));
      return Array.from(categories).sort();
    },
  }))
);

// Export helper hooks for components
export const useComponentById = (id: string | null) => {
  return useShadcnPaletteStore(state => 
    id ? state.getComponentById(id) : undefined
  );
};

export const useFilteredComponents = () => {
  return useShadcnPaletteStore(state => state.getFilteredComponents());
};
