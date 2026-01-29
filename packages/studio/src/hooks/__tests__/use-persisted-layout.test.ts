/**
 * usePersistedLayout Hook Tests
 */

import { renderHook, act } from '@testing-library/react';
import { usePersistedLayout } from '../use-persisted-layout';
import { useLayoutStore } from '@/stores/layout-store';
import { layoutPersistenceService } from '@/services/layout/layout-persistence-service';

// Mock the layout persistence service
vi.mock('@/services/layout/layout-persistence-service', () => ({
  layoutPersistenceService: {
    restore: vi.fn(),
    save: vi.fn(),
    reset: vi.fn(),
  },
}));

describe('usePersistedLayout', () => {
  beforeEach(() => {
    // Reset store state before each test
    useLayoutStore.getState().resetLayout();
    vi.clearAllMocks();
  });

  it('should initialize with default layout values', () => {
    const { result } = renderHook(() => usePersistedLayout());

    expect(result.current.layout).toEqual([70, 30]);
    expect(result.current.isComponentsCollapsed).toBe(false);
  });

  it('should restore layout from localStorage on mount', () => {
    const mockLayout = {
      canvasPanel: 75,
      componentsPanel: 25,
    };

    (layoutPersistenceService.restore as any).mockReturnValue(mockLayout);

    const { result } = renderHook(() => usePersistedLayout());

    expect(result.current.layout).toEqual([75, 25]);
  });

  it('should handle layout change callback', () => {
    const { result } = renderHook(() => usePersistedLayout());

    act(() => {
      result.current.handleLayoutChange([60, 40]);
    });

    expect(result.current.layout).toEqual([60, 40]);
  });

  it('should toggle components panel collapse state', () => {
    const { result } = renderHook(() => usePersistedLayout());

    expect(result.current.isComponentsCollapsed).toBe(false);

    act(() => {
      result.current.toggleComponentsPanel();
    });

    expect(result.current.isComponentsCollapsed).toBe(true);
  });

  it('should reset layout to defaults', () => {
    const { result } = renderHook(() => usePersistedLayout());

    act(() => {
      result.current.setCanvasPanelSize(60);
    });

    expect(result.current.layout[0]).toBe(60);

    act(() => {
      result.current.handleReset();
    });

    expect(result.current.layout).toEqual([70, 30]);
    expect(layoutPersistenceService.reset).toHaveBeenCalled();
  });

  it('should save layout to localStorage when it changes', () => {
    const { result } = renderHook(() => usePersistedLayout());

    act(() => {
      result.current.setCanvasPanelSize(60);
    });

    // Wait for initialization and debounce
    setTimeout(() => {
      expect(layoutPersistenceService.save).toHaveBeenCalled();
    }, 600);
  });

  it('should detect mobile screen size', () => {
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    // Trigger resize event
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    const { result } = renderHook(() => usePersistedLayout());

    expect(result.current.isMobile).toBe(true);
  });

  it('should provide panel size setters', () => {
    const { result } = renderHook(() => usePersistedLayout());

    act(() => {
      result.current.setCanvasPanelSize(65);
      result.current.setComponentsPanelSize(35);
    });

    expect(result.current.layout).toEqual([65, 35]);
  });

  it('should initialize as initialized after mount', () => {
    const { result } = renderHook(() => usePersistedLayout());

    expect(result.current.isInitialized).toBe(true);
  });
});
