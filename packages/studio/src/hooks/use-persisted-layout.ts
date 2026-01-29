/**
 * usePersistedLayout Hook
 * Custom hook for managing layout state with persistence
 */

import { useEffect, useState } from 'react';
import { useLayoutStore } from '@/stores/layout-store';
import { layoutPersistenceService } from '@/services/layout/layout-persistence-service';
import type { LayoutState } from '@/types/layout';

export function usePersistedLayout() {
  const {
    canvasPanel,
    componentsPanel,
    isComponentsCollapsed,
    isMobile,
    setCanvasPanelSize,
    setComponentsPanelSize,
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
      setCanvasPanelSize(storedLayout.canvasPanel);
      setComponentsPanelSize(storedLayout.componentsPanel);
    }
    setIsInitialized(true);
  }, [setCanvasPanelSize, setComponentsPanelSize]);

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setIsMobile]);

  // Save layout to localStorage when it changes
  useEffect(() => {
    if (isInitialized) {
      const layoutState: LayoutState = {
        canvasPanel,
        componentsPanel,
      };
      layoutPersistenceService.save(layoutState);
    }
  }, [canvasPanel, componentsPanel, isInitialized]);

  // Handle layout changes from resizable panels
  const handleLayoutChange = (sizes: number[]) => {
    updateLayout(sizes);
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
    layout: [canvasPanel, componentsPanel] as [number, number],
    isComponentsCollapsed,
    isMobile,
    isInitialized,

    // Actions
    handleLayoutChange,
    toggleComponentsPanel,
    handleReset,
    setCanvasPanelSize,
    setComponentsPanelSize,
  };
}
