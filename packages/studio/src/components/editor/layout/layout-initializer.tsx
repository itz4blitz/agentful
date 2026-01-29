/**
 * LayoutInitializer
 *
 * Clears corrupted localStorage layouts that cause panels to render incorrectly.
 * This should be rendered once at mount to ensure clean layout state.
 *
 * The issue: react-resizable-panels saves layout to localStorage, and if the
 * saved data has panels with sizes <= minSize, they collapse immediately.
 */

import { useEffect } from 'react';

const LAYOUT_STORAGE_KEY = 'react-resizable-panels:visual-builder-layout-v3';
const MIN_VALID_SIZE = 5; // Panels smaller than 5% are unusable

export function useLayoutInitializer() {
  useEffect(() => {
    const LAYOUT_DEBUG_KEY = 'layout-debug';

    try {
      const savedLayout = localStorage.getItem(LAYOUT_STORAGE_KEY);

      if (savedLayout) {
        const layout = JSON.parse(savedLayout);

        // Log current layout for debugging
        console.group('[Layout] Saved layout check');
        console.table(layout);

        // Check if layout is corrupted (missing panels or invalid sizes)
        const issues: string[] = [];
        const isCorrupted =
          !Array.isArray(layout) ||
          layout.length !== 3 ||
          layout.some((size: unknown) => {
            const isValid = typeof size === 'number' && size >= MIN_VALID_SIZE && size <= 100;
            if (!isValid) {
              issues.push(`size: ${size} (expected >=${MIN_VALID_SIZE} and <=100)`);
            }
            return !isValid;
          });

        if (isCorrupted) {
          console.warn('[Layout] Corrupted layout detected:', issues);
          console.warn('[Layout] Clearing bad layout data');
          localStorage.removeItem(LAYOUT_STORAGE_KEY);

          // Save debug info
          localStorage.setItem(LAYOUT_DEBUG_KEY, JSON.stringify({
            timestamp: new Date().toISOString(),
            issues,
            layout
          }));
        } else {
          console.log('[Layout] Saved layout is valid, using it');
        }

        console.groupEnd();
      } else {
        console.log('[Layout] No saved layout found, will use defaults (20-60-20)');
      }
    } catch (error) {
      console.error('[Layout] Failed to parse saved layout, clearing:', error);
      localStorage.removeItem(LAYOUT_STORAGE_KEY);
    }
  }, []);
}
