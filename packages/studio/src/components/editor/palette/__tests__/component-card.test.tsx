/**
 * ComponentCard Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentCard } from '../component-card';
import { componentRegistry } from '@/services/components/component-registry';

describe('ComponentCard', () => {
  const mockComponent = componentRegistry.getComponent('container')!;
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  describe('Grid View', () => {
    it('should render component card in grid mode', () => {
      render(
        <ComponentCard
          component={mockComponent}
          viewMode="grid"
          onSelect={mockOnSelect}
          isDraggable={false}
        />
      );

      expect(screen.getByText(mockComponent.name)).toBeInTheDocument();
      expect(screen.getByText(mockComponent.description)).toBeInTheDocument();
    });

    it('should render tags', () => {
      render(
        <ComponentCard
          component={mockComponent}
          viewMode="grid"
          onSelect={mockOnSelect}
          isDraggable={false}
        />
      );

      mockComponent.tags.slice(0, 3).forEach((tag) => {
        expect(screen.getByText(tag)).toBeInTheDocument();
      });
    });

    it('should call onSelect when clicked', () => {
      render(
        <ComponentCard
          component={mockComponent}
          viewMode="grid"
          onSelect={mockOnSelect}
          isDraggable={false}
        />
      );

      const card = screen.getByRole('button', { name: new RegExp(mockComponent.name, 'i') });
      fireEvent.click(card);

      expect(mockOnSelect).toHaveBeenCalledWith(mockComponent.id);
    });

    it('should be keyboard accessible', () => {
      render(
        <ComponentCard
          component={mockComponent}
          viewMode="grid"
          onSelect={mockOnSelect}
          isDraggable={false}
        />
      );

      const card = screen.getByRole('button', { name: new RegExp(mockComponent.name, 'i') });
      fireEvent.keyDown(card, { key: 'Enter' });

      expect(mockOnSelect).toHaveBeenCalledWith(mockComponent.id);
    });
  });

  describe('List View', () => {
    it('should render component card in list mode', () => {
      render(
        <ComponentCard
          component={mockComponent}
          viewMode="list"
          onSelect={mockOnSelect}
          isDraggable={false}
        />
      );

      expect(screen.getByText(mockComponent.name)).toBeInTheDocument();
      expect(screen.getByText(mockComponent.description)).toBeInTheDocument();
    });

    it('should render limited tags in list view', () => {
      render(
        <ComponentCard
          component={mockComponent}
          viewMode="list"
          onSelect={mockOnSelect}
          isDraggable={false}
        />
      );

      mockComponent.tags.slice(0, 2).forEach((tag) => {
        expect(screen.getByText(tag)).toBeInTheDocument();
      });
    });
  });

  // Skip draggable tests for now - need proper DnD context setup
  // describe('Draggable', () => {
  //   it('should have draggable attributes when draggable is true', () => {
  //     const { container } = render(
  //       <DndContext>
  //         <ComponentCard
  //           component={mockComponent}
  //           viewMode="grid"
  //           onSelect={mockOnSelect}
  //           isDraggable={true}
  //         />
  //       </DndContext>
  //     );
  //
  //     const card = container.querySelector('[data-dnd-kit-draggable]');
  //     expect(card).toBeInTheDocument();
  //   });
  //
  //   it('should not be clickable when draggable', () => {
  //     const { container } = render(
  //       <DndContext>
  //         <ComponentCard
  //           component={mockComponent}
  //           viewMode="grid"
  //           onSelect={mockOnSelect}
  //           isDraggable={true}
  //         />
  //       </DndContext>
  //     );
  //
  //     const card = container.querySelector('[role="button"]');
  //     expect(card).not.toBeInTheDocument();
  //   });
  // });

  describe('Accessibility', () => {
    it('should have proper aria-label', () => {
      render(
        <ComponentCard
          component={mockComponent}
          viewMode="grid"
          onSelect={mockOnSelect}
          isDraggable={false}
        />
      );

      const card = screen.getByRole('button', { name: new RegExp(mockComponent.name, 'i') });
      expect(card).toHaveAttribute('aria-label', expect.stringContaining(mockComponent.name));
    });

    it('should be focusable when not draggable', () => {
      render(
        <ComponentCard
          component={mockComponent}
          viewMode="grid"
          onSelect={mockOnSelect}
          isDraggable={false}
        />
      );

      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('tabIndex', '0');
    });
  });
});
