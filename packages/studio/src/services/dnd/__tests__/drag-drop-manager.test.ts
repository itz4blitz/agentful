/**
 * Drag Drop Manager Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  componentToCanvasElement,
  calculateDropPosition,
  findClosestDroppable,
  getDropIndex,
  handleDragStart,
  handleDragCancel,
  validateDropTarget,
} from '@/services/dnd/drag-drop-manager';
import { useDndStore } from '@/stores/dnd-store';
import type { ComponentTemplate } from '@/types/components';

// Mock stores
vi.mock('@/stores/dnd-store');
vi.mock('@/stores/canvas-store');

describe('componentToCanvasElement', () => {
  it('should convert component template to canvas element', () => {
    const component: ComponentTemplate = {
      id: 'button-1',
      name: 'Button',
      description: 'A button component',
      category: 'forms',
      tags: ['button', 'form'],
      icon: 'Square',
      html: '<button class="btn btn-primary">Click me</button>',
    };

    const element = componentToCanvasElement(component);

    expect(element.tagName).toBe('button');
    expect(element.attributes.class).toBe('btn btn-primary');
    expect(element.content).toBe('Click me');
    expect(element).toHaveProperty('id');
  });

  it('should throw error for invalid HTML', () => {
    const component: ComponentTemplate = {
      id: 'invalid-1',
      name: 'Invalid',
      description: 'Invalid component',
      category: 'forms',
      tags: [],
      icon: 'Square',
      html: '',
    };

    expect(() => componentToCanvasElement(component)).toThrow();
  });
});

describe('calculateDropPosition', () => {
  it('should return "before" when pointer is in top half of non-container', () => {
    const element = document.createElement('span'); // Use non-container element
    element.getBoundingClientRect = vi.fn(() => ({
      top: 100,
      left: 100,
      width: 200,
      height: 100,
      bottom: 200,
      right: 300,
      x: 100,
      y: 100,
      toJSON: vi.fn(),
    }));

    const position = calculateDropPosition(element, 120, 200);

    expect(position).toBe('before');
  });

  it('should return "after" when pointer is in bottom half of non-container', () => {
    const element = document.createElement('span'); // Use non-container element
    element.getBoundingClientRect = vi.fn(() => ({
      top: 100,
      left: 100,
      width: 200,
      height: 100,
      bottom: 200,
      right: 300,
      x: 100,
      y: 100,
      toJSON: vi.fn(),
    }));

    const position = calculateDropPosition(element, 180, 200);

    expect(position).toBe('after');
  });

  it('should return "inside" for container elements when centered', () => {
    const element = document.createElement('section');
    element.appendChild(document.createElement('div'));
    element.getBoundingClientRect = vi.fn(() => ({
      top: 100,
      left: 100,
      width: 400,
      height: 300,
      bottom: 400,
      right: 500,
      x: 100,
      y: 100,
      toJSON: vi.fn(),
    }));

    const position = calculateDropPosition(element, 250, 300);

    expect(position).toBe('inside');
  });
});

describe('findClosestDroppable', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should find droppable element', () => {
    const parent = document.createElement('div');
    parent.setAttribute('data-droppable', 'true');

    const child = document.createElement('span');
    parent.appendChild(child);

    document.body.appendChild(parent);

    const found = findClosestDroppable(child);
    expect(found).toBe(parent);
  });

  it('should return null if no droppable found', () => {
    const element = document.createElement('div');
    document.body.appendChild(element);

    const found = findClosestDroppable(element);
    expect(found).toBeNull();
  });
});

describe('getDropIndex', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should calculate index for "before" position', () => {
    const parent = document.createElement('div');
    const child1 = document.createElement('div');
    const child2 = document.createElement('div');
    const child3 = document.createElement('div');

    child1.setAttribute('data-canvas-id', 'child-1');
    child2.setAttribute('data-canvas-id', 'child-2');
    child3.setAttribute('data-canvas-id', 'child-3');

    parent.appendChild(child1);
    parent.appendChild(child2);
    parent.appendChild(child3);

    document.body.appendChild(parent);

    const index = getDropIndex(parent, 'child-2', 'before');
    expect(index).toBe(1);
  });

  it('should calculate index for "after" position', () => {
    const parent = document.createElement('div');
    const child1 = document.createElement('div');
    const child2 = document.createElement('div');
    const child3 = document.createElement('div');

    child1.setAttribute('data-canvas-id', 'child-1');
    child2.setAttribute('data-canvas-id', 'child-2');
    child3.setAttribute('data-canvas-id', 'child-3');

    parent.appendChild(child1);
    parent.appendChild(child2);
    parent.appendChild(child3);

    document.body.appendChild(parent);

    const index = getDropIndex(parent, 'child-2', 'after');
    expect(index).toBe(2);
  });
});

describe('handleDragStart', () => {
  it('should start drag in store', () => {
    const mockStartDrag = vi.fn();
    vi.mocked(useDndStore).getState = vi.fn(() => ({
      startDrag: mockStartDrag,
    })) as any;

    const dragData = {
      type: 'palette' as const,
      source: 'palette' as const,
      componentId: 'button-1',
    };

    handleDragStart('test-id', dragData);

    expect(mockStartDrag).toHaveBeenCalledWith('test-id', dragData);
  });
});

describe('handleDragCancel', () => {
  it('should cancel drag in store', () => {
    const mockCancelDrag = vi.fn();
    vi.mocked(useDndStore).getState = vi.fn(() => ({
      cancelDrag: mockCancelDrag,
    })) as any;

    handleDragCancel();

    expect(mockCancelDrag).toHaveBeenCalled();
  });
});

describe('validateDropTarget', () => {
  it('should prevent dropping on self', () => {
    const dragData = {
      type: 'canvas' as const,
      source: 'canvas' as const,
      elementId: 'element-1',
    };

    const dropTarget = {
      targetId: 'element-1',
      position: 'after' as const,
      index: 0,
    };

    const valid = validateDropTarget(dragData, dropTarget);
    expect(valid).toBe(false);
  });

  it('should allow valid drop target', () => {
    const dragData = {
      type: 'palette' as const,
      source: 'palette' as const,
      componentId: 'button-1',
    };

    const dropTarget = {
      targetId: 'element-1',
      position: 'inside' as const,
      index: 0,
    };

    const valid = validateDropTarget(dragData, dropTarget);
    expect(valid).toBe(true);
  });
});
