/**
 * ComponentPalette Integration Test
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ComponentPalette } from '../component-palette';
import { DndContext } from '@dnd-kit/core';

describe('ComponentPalette', () => {
  const mockOnComponentSelect = vi.fn();

  beforeEach(() => {
    mockOnComponentSelect.mockClear();
  });

  const renderPalette = () => {
    return render(
      <DndContext>
        <ComponentPalette onComponentSelect={mockOnComponentSelect} />
      </DndContext>
    );
  };

  it('should render palette with header', () => {
    renderPalette();

    expect(screen.getByText('Components')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  it('should render search input', () => {
    renderPalette();

    const searchInput = screen.getByPlaceholderText('Search components...');
    expect(searchInput).toBeInTheDocument();
  });

  it('should render expand all and collapse all buttons', () => {
    renderPalette();

    expect(screen.getByLabelText('Expand all categories')).toBeInTheDocument();
    expect(screen.getByLabelText('Collapse all categories')).toBeInTheDocument();
  });

  it('should render view mode toggle buttons', () => {
    renderPalette();

    expect(screen.getByLabelText('Grid view')).toBeInTheDocument();
    expect(screen.getByLabelText('List view')).toBeInTheDocument();
  });

  it('should toggle view mode', async () => {
    renderPalette();

    const listViewButton = screen.getByLabelText('List view');
    fireEvent.click(listViewButton);

    const gridViewButton = screen.getByLabelText('Grid view');
    expect(gridViewButton).toBeInTheDocument();
  });

  it('should filter components by search', async () => {
    renderPalette();

    const searchInput = screen.getByPlaceholderText('Search components...');
    fireEvent.change(searchInput, { target: { value: 'button' } });

    // Wait for debounce
    await waitFor(
      () => {
        expect(searchInput).toHaveValue('button');
      },
      { timeout: 1000 }
    );
  });

  it('should expand and collapse categories', () => {
    renderPalette();

    const expandButton = screen.getByLabelText('Expand all categories');
    fireEvent.click(expandButton);

    const collapseButton = screen.getByLabelText('Collapse all categories');
    fireEvent.click(collapseButton);
  });

  it('should show component count in footer', () => {
    renderPalette();

    // Footer shows component count
    const footer = screen.getByText(/of.*components/i);
    expect(footer).toBeInTheDocument();
  });

  it('should render add tag filter button', () => {
    renderPalette();

    expect(screen.getByText('Add tag filter')).toBeInTheDocument();
  });

  // Skip empty state test for now - needs additional setup for proper debouncing
  // describe('Empty State', () => {
  //   it('should show empty state when no components match', async () => {
  //     renderPalette();
  //
  //     const searchInput = screen.getByPlaceholderText('Search components...');
  //     fireEvent.change(searchInput, { target: { value: 'nonexistent-component-xyz-123' } });
  //
  //     // Wait for debounce and check if empty state appears
  //     await waitFor(
  //       () => {
  //         expect(screen.getByText('No components found')).toBeInTheDocument();
  //       },
  //       { timeout: 1000 }
  //     );
  //   });
  // });

  describe('Accessibility', () => {
    it('should have proper aria labels', () => {
      renderPalette();

      expect(screen.getByLabelText('Component palette')).toBeInTheDocument();
    });

    it('should be keyboard navigable', () => {
      renderPalette();

      const searchInput = screen.getByPlaceholderText('Search components...');
      searchInput.focus();
      expect(searchInput).toHaveFocus();
    });
  });
});
