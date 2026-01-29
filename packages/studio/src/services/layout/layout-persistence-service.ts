/**
 * Layout Persistence Service
 * Handles localStorage operations for layout state persistence
 */

import type { LayoutState } from '@/types/layout';
import { DEFAULT_LAYOUT_STATE, LAYOUT_STORAGE_KEY } from '@/types/layout';

export class LayoutPersistenceService {
  private storageKey: string;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private debounceMs: number;

  constructor(storageKey: string = LAYOUT_STORAGE_KEY, debounceMs: number = 500) {
    this.storageKey = storageKey;
    this.debounceMs = debounceMs;
  }

  /**
   * Save layout state to localStorage with debouncing
   */
  save(state: LayoutState): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(state));
      } catch (error) {
        console.error('Failed to save layout state:', error);
      }
    }, this.debounceMs);
  }

  /**
   * Restore layout state from localStorage
   */
  restore(): LayoutState | null {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<LayoutState>;

        // Validate that we have all required fields
        if (
          typeof parsed.chatPanel === 'number' &&
          typeof parsed.canvasPanel === 'number' &&
          typeof parsed.componentsPanel === 'number'
        ) {
          return parsed as LayoutState;
        }
      }
    } catch (error) {
      console.warn('Invalid layout state in localStorage:', error);
    }

    return null;
  }

  /**
   * Reset layout state to defaults
   */
  reset(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Failed to reset layout state:', error);
    }
  }

  /**
   * Get default layout state
   */
  getDefaults(): LayoutState {
    return { ...DEFAULT_LAYOUT_STATE };
  }

  /**
   * Clean up debounce timer
   */
  destroy(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }
}

// Singleton instance
export const layoutPersistenceService = new LayoutPersistenceService();
