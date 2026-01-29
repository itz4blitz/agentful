/**
 * LayoutPersistenceService Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LayoutPersistenceService } from '../layout-persistence-service';
import { DEFAULT_LAYOUT_STATE } from '@/types/layout';

describe('LayoutPersistenceService', () => {
  let service: LayoutPersistenceService;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    service = new LayoutPersistenceService('test-layout', 0);
  });

  afterEach(() => {
    service.destroy();
  });

  describe('save', () => {
    it('should save layout state to localStorage', () => {
      const state = {
        chatPanel: 30,
        canvasPanel: 50,
        componentsPanel: 20,
      };

      service.save(state);

      const stored = localStorage.getItem('test-layout');
      expect(stored).toBe(JSON.stringify(state));
    });

    it('should debounce save operations', (done) => {
      const state = {
        chatPanel: 30,
        canvasPanel: 50,
        componentsPanel: 20,
      };

      service.save(state);

      // Immediately save again
      const newState = { ...state, chatPanel: 35 };
      service.save(newState);

      // Check that only the latest state is saved after debounce
      setTimeout(() => {
        const stored = localStorage.getItem('test-layout');
        expect(stored).toBe(JSON.stringify(newState));
        done();
      }, 100);
    });

    it('should handle save errors gracefully', () => {
      // Mock localStorage.setItem to throw an error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const state = {
        chatPanel: 30,
        canvasPanel: 50,
        componentsPanel: 20,
      };

      expect(() => service.save(state)).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();

      localStorage.setItem = originalSetItem;
      consoleSpy.mockRestore();
    });
  });

  describe('restore', () => {
    it('should restore layout state from localStorage', () => {
      const state = {
        chatPanel: 30,
        canvasPanel: 50,
        componentsPanel: 20,
      };

      localStorage.setItem('test-layout', JSON.stringify(state));

      const restored = service.restore();
      expect(restored).toEqual(state);
    });

    it('should return null if no state in localStorage', () => {
      const restored = service.restore();
      expect(restored).toBeNull();
    });

    it('should return null for invalid state', () => {
      localStorage.setItem('test-layout', 'invalid-json');

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const restored = service.restore();
      expect(restored).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should validate required fields', () => {
      const invalidState = {
        chatPanel: 30,
        canvasPanel: 50,
        // Missing componentsPanel
      };

      localStorage.setItem('test-layout', JSON.stringify(invalidState));

      const restored = service.restore();
      expect(restored).toBeNull();
    });
  });

  describe('reset', () => {
    it('should remove layout state from localStorage', () => {
      const state = {
        chatPanel: 30,
        canvasPanel: 50,
        componentsPanel: 20,
      };

      localStorage.setItem('test-layout', JSON.stringify(state));
      expect(localStorage.getItem('test-layout')).toBe(JSON.stringify(state));

      service.reset();
      expect(localStorage.getItem('test-layout')).toBeNull();
    });

    it('should handle reset errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => service.reset()).not.toThrow();

      consoleSpy.mockRestore();
    });
  });

  describe('getDefaults', () => {
    it('should return default layout state', () => {
      const defaults = service.getDefaults();
      expect(defaults).toEqual(DEFAULT_LAYOUT_STATE);
    });

    it('should return a new object each time', () => {
      const defaults1 = service.getDefaults();
      const defaults2 = service.getDefaults();

      expect(defaults1).not.toBe(defaults2);
      expect(defaults1).toEqual(defaults2);
    });
  });

  describe('destroy', () => {
    it('should clear debounce timer', () => {
      const state = {
        chatPanel: 30,
        canvasPanel: 50,
        componentsPanel: 20,
      };

      service.save(state);
      service.destroy();

      // Wait to ensure no save occurs after destroy
      setTimeout(() => {
        expect(localStorage.getItem('test-layout')).toBeNull();
      }, 100);
    });
  });
});
