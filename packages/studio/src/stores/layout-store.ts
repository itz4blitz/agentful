/**
 * Layout Store
 * Zustand store for managing layout state with persistence
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LayoutState } from '@/types/layout';
import { DEFAULT_LAYOUT_STATE } from '@/types/layout';

interface LayoutStore extends LayoutState {
  // State
  isComponentsCollapsed: boolean;
  isMobile: boolean;

  // Actions
  setCanvasPanelSize: (size: number) => void;
  setComponentsPanelSize: (size: number) => void;
  setComponentsCollapsed: (collapsed: boolean) => void;
  setIsMobile: (isMobile: boolean) => void;
  resetLayout: () => void;
  updateLayout: (sizes: number[]) => void;
}

export const useLayoutStore = create<LayoutStore>()(
  persist(
    (set) => ({
      // Initial state
      canvasPanel: DEFAULT_LAYOUT_STATE.canvasPanel,
      componentsPanel: DEFAULT_LAYOUT_STATE.componentsPanel,
      isComponentsCollapsed: false,
      isMobile: false,

      // Actions
      setCanvasPanelSize: (size) => set({ canvasPanel: size }),
      setComponentsPanelSize: (size) => set({ componentsPanel: size }),
      setComponentsCollapsed: (collapsed) => set({ isComponentsCollapsed: collapsed }),
      setIsMobile: (isMobile) => set({ isMobile }),

      resetLayout: () =>
        set({
          canvasPanel: DEFAULT_LAYOUT_STATE.canvasPanel,
          componentsPanel: DEFAULT_LAYOUT_STATE.componentsPanel,
          isComponentsCollapsed: false,
        }),

      updateLayout: (sizes) =>
        set((state) => {
          // sizes array comes from react-resizable-panels onLayout callback
          // Update based on current collapse state
          const updates: Partial<LayoutStore> = {};

          if (!state.isComponentsCollapsed && sizes[1] !== undefined) {
            updates.componentsPanel = sizes[1];
          }

          // Canvas size is derived
          if (sizes[0] !== undefined) {
            updates.canvasPanel = sizes[0];
          }

          return updates;
        }),
    }),
    {
      name: 'visual-builder-layout-storage',
      partialize: (state) => ({
        canvasPanel: state.canvasPanel,
        componentsPanel: state.componentsPanel,
        isComponentsCollapsed: state.isComponentsCollapsed,
      }),
    }
  )
);
