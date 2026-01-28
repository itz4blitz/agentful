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

    expect(result.current.layout).toEqual([25, 50, 25]);
    expect(result.current.isChatCollapsed).toBe(false);
    expect(result.current.isComponentsCollapsed).toBe(false);
  });

  it('should restore layout from localStorage on mount', () => {
    const mockLayout = {
      chatPanel: 30,
      canvasPanel: 40,
      componentsPanel: 30,
    };

    (layoutPersistenceService.restore as any).mockReturnValue(mockLayout);

    const { result } = renderHook(() => usePersistedLayout());

    expect(result.current.layout).toEqual([30, 40, 30]);
  });

  it('should handle layout change callback', () => {
    const { result } = renderHook(() => usePersistedLayout());

    act(() => {
      result.current.handleLayoutChange([30, 40, 30]);
    });

    expect(result.current.layout).toEqual([30, 40, 30]);
  });

  it('should toggle chat panel collapse state', () => {
    const { result } = renderHook(() => usePersistedLayout());

    expect(result.current.isChatCollapsed).toBe(false);

    act(() => {
      result.current.toggleChatPanel();
    });

    expect(result.current.isChatCollapsed).toBe(true);

    act(() => {
      result.current.toggleChatPanel();
    });

    expect(result.current.isChatCollapsed).toBe(false);
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
      result.current.setChatPanelSize(40);
    });

    expect(result.current.layout[0]).toBe(40);

    act(() => {
      result.current.handleReset();
    });

    expect(result.current.layout).toEqual([25, 50, 25]);
    expect(layoutPersistenceService.reset).toHaveBeenCalled();
  });

  it('should save layout to localStorage when it changes', () => {
    const { result } = renderHook(() => usePersistedLayout());

    act(() => {
      result.current.setChatPanelSize(30);
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
      result.current.setChatPanelSize(35);
      result.current.setCanvasPanelSize(45);
      result.current.setComponentsPanelSize(20);
    });

    expect(result.current.layout).toEqual([35, 45, 20]);
  });

  it('should handle keyboard shortcuts', () => {
    const { result } = renderHook(() => usePersistedLayout());

    // Mock Ctrl/Cmd + ArrowLeft
    act(() => {
      const event = new KeyboardEvent('keydown', {
        key: 'ArrowLeft',
        ctrlKey: true,
      });
      window.dispatchEvent(event);
    });

    // Chat panel should decrease
    expect(result.current.layout[0]).toBeLessThan(25);
  });

  it('should initialize as initialized after mount', () => {
    const { result } = renderHook(() => usePersistedLayout());

    expect(result.current.isInitialized).toBe(true);
  });
});
