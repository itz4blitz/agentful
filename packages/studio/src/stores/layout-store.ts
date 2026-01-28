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
  isChatCollapsed: boolean;
  isComponentsCollapsed: boolean;
  isMobile: boolean;

  // Actions
  setChatPanelSize: (size: number) => void;
  setCanvasPanelSize: (size: number) => void;
  setComponentsPanelSize: (size: number) => void;
  setChatCollapsed: (collapsed: boolean) => void;
  setComponentsCollapsed: (collapsed: boolean) => void;
  setIsMobile: (isMobile: boolean) => void;
  resetLayout: () => void;
  updateLayout: (sizes: number[]) => void;
}

export const useLayoutStore = create<LayoutStore>()(
  persist(
    (set) => ({
      // Initial state
      chatPanel: DEFAULT_LAYOUT_STATE.chatPanel,
      canvasPanel: DEFAULT_LAYOUT_STATE.canvasPanel,
      componentsPanel: DEFAULT_LAYOUT_STATE.componentsPanel,
      isChatCollapsed: false,
      isComponentsCollapsed: false,
      isMobile: false,

      // Actions
      setChatPanelSize: (size) => set({ chatPanel: size }),
      setCanvasPanelSize: (size) => set({ canvasPanel: size }),
      setComponentsPanelSize: (size) => set({ componentsPanel: size }),
      setChatCollapsed: (collapsed) => set({ isChatCollapsed: collapsed }),
      setComponentsCollapsed: (collapsed) => set({ isComponentsCollapsed: collapsed }),
      setIsMobile: (isMobile) => set({ isMobile }),

      resetLayout: () =>
        set({
          chatPanel: DEFAULT_LAYOUT_STATE.chatPanel,
          canvasPanel: DEFAULT_LAYOUT_STATE.canvasPanel,
          componentsPanel: DEFAULT_LAYOUT_STATE.componentsPanel,
          isChatCollapsed: false,
          isComponentsCollapsed: false,
        }),

      updateLayout: (sizes) =>
        set((state) => {
          // sizes array comes from react-resizable-panels onLayout callback
          // Update based on current collapse state
          const updates: Partial<LayoutStore> = {};

          if (!state.isChatCollapsed && sizes[0] !== undefined) {
            updates.chatPanel = sizes[0];
          }

          if (!state.isComponentsCollapsed && sizes[2] !== undefined) {
            updates.componentsPanel = sizes[2];
          }

          // Canvas size is derived
          if (sizes[1] !== undefined) {
            updates.canvasPanel = sizes[1];
          }

          return updates;
        }),
    }),
    {
      name: 'visual-builder-layout-storage',
      partialize: (state) => ({
        chatPanel: state.chatPanel,
        canvasPanel: state.canvasPanel,
        componentsPanel: state.componentsPanel,
        isChatCollapsed: state.isChatCollapsed,
        isComponentsCollapsed: state.isComponentsCollapsed,
      }),
    }
  )
);
