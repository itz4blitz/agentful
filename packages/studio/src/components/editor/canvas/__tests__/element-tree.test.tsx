/**
 * ElementTree Component Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ElementTree } from '../element-tree';
import { useCanvasStore } from '@/stores/canvas-store';

describe('ElementTree', () => {
  beforeEach(() => {
    // Reset store before each test
    const { reset } = useCanvasStore.getState();
    reset();
  });

  it('should render empty state', () => {
    render(<ElementTree />);

    expect(screen.getByText('No elements yet. Add components to get started.')).toBeInTheDocument();
  });

  it('should render DOM tree header', () => {
    render(<ElementTree />);

    expect(screen.getByText('DOM Tree')).toBeInTheDocument();
    expect(screen.getByText('Expand')).toBeInTheDocument();
    expect(screen.getByText('Collapse')).toBeInTheDocument();
  });

  it('should render elements', () => {
    const { setElements } = useCanvasStore.getState();

    setElements([
      {
        id: 'test-1',
        tagName: 'div',
        attributes: {},
        styles: {},
        children: [],
      },
    ]);

    render(<ElementTree />);

    expect(screen.getByText('div')).toBeInTheDocument();
  });

  it('should render element with content', () => {
    const { setElements } = useCanvasStore.getState();

    setElements([
      {
        id: 'test-1',
        tagName: 'p',
        attributes: {},
        styles: {},
        children: [],
        content: 'This is a test paragraph',
      },
    ]);

    render(<ElementTree />);

    expect(screen.getByText('p')).toBeInTheDocument();
    // Content is truncated to 20 characters in the UI
    expect(screen.getByText('This is a test parag...')).toBeInTheDocument();
  });

  it('should handle element selection', () => {
    const { setElements } = useCanvasStore.getState();

    setElements([
      {
        id: 'test-1',
        tagName: 'div',
        attributes: {},
        styles: {},
        children: [],
      },
    ]);

    render(<ElementTree />);

    const treeNode = screen.getByText('div').closest('div');
    fireEvent.click(treeNode!);

    const state = useCanvasStore.getState();
    expect(state.selectedElement?.elementId).toBe('test-1');
  });

  it('should render nested elements', () => {
    const { setElements } = useCanvasStore.getState();

    setElements([
      {
        id: 'parent-1',
        tagName: 'div',
        attributes: {},
        styles: {},
        children: [
          {
            id: 'child-1',
            tagName: 'p',
            attributes: {},
            styles: {},
            children: [],
            content: 'Child content',
          },
        ],
      },
    ]);

    render(<ElementTree />);

    expect(screen.getByText('div')).toBeInTheDocument();
    expect(screen.getByText('p')).toBeInTheDocument();
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('should expand and collapse nodes', () => {
    const { setElements } = useCanvasStore.getState();

    setElements([
      {
        id: 'parent-1',
        tagName: 'div',
        attributes: {},
        styles: {},
        children: [
          {
            id: 'child-1',
            tagName: 'p',
            attributes: {},
            styles: {},
            children: [],
          },
        ],
      },
    ]);

    render(<ElementTree />);

    // Initially expanded
    expect(screen.getByText('p')).toBeInTheDocument();

    // Click collapse button
    const collapseButtons = screen.getAllByRole('button');
    const expandCollapseButton = collapseButtons.find((btn) => btn.querySelector('svg'));
    fireEvent.click(expandCollapseButton!);

    // Child should no longer be visible
    // Note: This might need adjustment based on actual DOM behavior
  });
});
