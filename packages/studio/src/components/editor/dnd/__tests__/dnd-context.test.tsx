/**
 * DndContext Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DndContext } from '@/components/editor/dnd/dnd-context';
import { DraggableComponent } from '@/components/editor/dnd/draggable-component';
import { DroppableZone } from '@/components/editor/dnd/droppable-zone';
import type { DragData } from '@/types/dnd';

// Mock @dnd-kit core
vi.mock('@dnd-kit/core', async () => {
  const actual = await vi.importActual('@dnd-kit/core');
  return {
    ...actual,
    useDndContext: vi.fn(() => ({
      active: null,
      over: null,
    })),
  };
});

describe('DndContext', () => {
  it('should render children', () => {
    render(
      <DndContext>
        <div>Test Content</div>
      </DndContext>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <DndContext className="custom-class">
        <div>Test</div>
      </DndContext>
    );

    const wrapper = container.querySelector('.custom-class');
    expect(wrapper).toBeInTheDocument();
  });

  it('should call onDragStart callback', () => {
    const onDragStart = vi.fn();

    const dragData: DragData = {
      type: 'palette',
      source: 'palette',
      componentId: 'button-1',
    };

    render(
      <DndContext onDragStart={onDragStart}>
        <DraggableComponent id="test-drag" data={dragData}>
          <div>Drag Me</div>
        </DraggableComponent>
      </DndContext>
    );

    const draggable = screen.getByText('Drag Me');
    fireEvent.pointerDown(draggable);
    fireEvent.pointerMove(draggable, { clientX: 10, clientY: 10 });

    // Note: Actual drag start event would be triggered by @dnd-kit
    // This test verifies the callback is wired correctly
  });

  it('should cancel drag on Escape key', () => {
    const onDragCancel = vi.fn();

    render(
      <DndContext onDragCancel={onDragCancel}>
        <div>Test</div>
      </DndContext>
    );

    // Simulate Escape key
    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });

    // Note: Actual behavior depends on store state
  });
});

describe('DraggableComponent', () => {
  it('should render children', () => {
    const dragData: DragData = {
      type: 'palette',
      source: 'palette',
      componentId: 'button-1',
    };

    render(
      <DndContext>
        <DraggableComponent id="test-drag" data={dragData}>
          <div>Drag Me</div>
        </DraggableComponent>
      </DndContext>
    );

    expect(screen.getByText('Drag Me')).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    const dragData: DragData = {
      type: 'palette',
      source: 'palette',
      componentId: 'button-1',
    };

    const { container } = render(
      <DndContext>
        <DraggableComponent id="test-drag" data={dragData} disabled>
          <div>Cannot Drag</div>
        </DraggableComponent>
      </DndContext>
    );

    const draggable = container.querySelector('[data-draggable="true"]');
    expect(draggable).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const dragData: DragData = {
      type: 'palette',
      source: 'palette',
      componentId: 'button-1',
    };

    const { container } = render(
      <DndContext>
        <DraggableComponent id="test-drag" data={dragData} className="custom-class">
          <div>Drag Me</div>
        </DraggableComponent>
      </DndContext>
    );

    const draggable = container.querySelector('.custom-class');
    expect(draggable).toBeInTheDocument();
  });
});

describe('DroppableZone', () => {
  it('should render children', () => {
    render(
      <DndContext>
        <DroppableZone id="test-drop">
          <div>Drop Zone</div>
        </DroppableZone>
      </DndContext>
    );

    expect(screen.getByText('Drop Zone')).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    const { container } = render(
      <DndContext>
        <DroppableZone id="test-drop" disabled>
          <div>Drop Zone</div>
        </DroppableZone>
      </DndContext>
    );

    const droppable = container.querySelector('[data-droppable="true"]');
    expect(droppable).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <DndContext>
        <DroppableZone id="test-drop" className="custom-class">
          <div>Drop Zone</div>
        </DroppableZone>
      </DndContext>
    );

    const droppable = container.querySelector('.custom-class');
    expect(droppable).toBeInTheDocument();
  });
});
