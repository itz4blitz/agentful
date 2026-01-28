/**
 * usePersistedLayout Hook
 * Custom hook for managing layout state with persistence
 */

import { useEffect, useState } from 'react';
import { useLayoutStore } from '@/stores/layout-store';
import { layoutPersistenceService } from '@/services/layout/layout-persistence-service';
import type { LayoutState } from '@/types/layout';
import { DEFAULT_LAYOUT_STATE } from '@/types/layout';

export function usePersistedLayout() {
  const {
    chatPanel,
    canvasPanel,
    componentsPanel,
    isChatCollapsed,
    isComponentsCollapsed,
    isMobile,
    setChatPanelSize,
    setCanvasPanelSize,
    setComponentsPanelSize,
    setChatCollapsed,
    setComponentsCollapsed,
    setIsMobile,
    resetLayout,
    updateLayout,
  } = useLayoutStore();

  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize layout from localStorage on mount
  useEffect(() => {
    const storedLayout = layoutPersistenceService.restore();
    if (storedLayout) {
      setChatPanelSize(storedLayout.chatPanel);
      setCanvasPanelSize(storedLayout.canvasPanel);
      setComponentsPanelSize(storedLayout.componentsPanel);
    }
    setIsInitialized(true);
  }, [setChatPanelSize, setCanvasPanelSize, setComponentsPanelSize]);

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setIsMobile]);

  // Handle keyboard shortcuts for resizing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Arrow keys to resize panels
      if (e.ctrlKey || e.metaKey) {
        const resizeAmount = 5;

        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            if (!isChatCollapsed && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
              setChatPanelSize(Math.max(10, chatPanel - resizeAmount));
            }
            break;
          case 'ArrowRight':
            e.preventDefault();
            if (!isChatCollapsed && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
              setChatPanelSize(Math.min(50, chatPanel + resizeAmount));
            }
            break;
        }
      }

      // Escape to cancel drag or reset focus
      if (e.key === 'Escape') {
        // Let the current drag operation handle this
        const activeDrag = document.querySelector('[data-panel-dragging]');
        if (activeDrag) {
          (activeDrag as any).dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [chatPanel, isChatCollapsed, setChatPanelSize]);

  // Save layout to localStorage when it changes
  useEffect(() => {
    if (isInitialized) {
      const layoutState: LayoutState = {
        chatPanel,
        canvasPanel,
        componentsPanel,
      };
      layoutPersistenceService.save(layoutState);
    }
  }, [chatPanel, canvasPanel, componentsPanel, isInitialized]);

  // Handle layout changes from resizable panels
  const handleLayoutChange = (sizes: number[]) => {
    updateLayout(sizes);
  };

  // Toggle chat panel collapse
  const toggleChatPanel = () => {
    setChatCollapsed(!isChatCollapsed);
  };

  // Toggle components panel collapse
  const toggleComponentsPanel = () => {
    setComponentsCollapsed(!isComponentsCollapsed);
  };

  // Reset to defaults
  const handleReset = () => {
    resetLayout();
    layoutPersistenceService.reset();
  };

  return {
    // State
    layout: [chatPanel, canvasPanel, componentsPanel] as [number, number, number],
    isChatCollapsed,
    isComponentsCollapsed,
    isMobile,
    isInitialized,

    // Actions
    handleLayoutChange,
    toggleChatPanel,
    toggleComponentsPanel,
    handleReset,
    setChatPanelSize,
    setCanvasPanelSize,
    setComponentsPanelSize,
  };
}
