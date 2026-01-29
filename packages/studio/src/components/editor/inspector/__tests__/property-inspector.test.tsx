/**
 * PropertyInspector Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PropertyInspector } from '../property-inspector';

// Mock the stores
vi.mock('@/stores/inspector-store', () => ({
  useInspectorStore: vi.fn(),
}));

vi.mock('@/stores/canvas-store', () => ({
  useCanvasStore: vi.fn(),
}));

import { useInspectorStore } from '@/stores/inspector-store';
import { useCanvasStore } from '@/stores/canvas-store';

describe('PropertyInspector', () => {
  const mockInspectorStore = {
    selectedElementId: 'test-1',
    elementData: {
      id: 'test-1',
      tagName: 'DIV',
      attributes: { id: 'test-div', class: 'container' },
      styles: { display: 'flex', padding: '16px' },
      children: [],
    },
    groups: [],
    activeTab: 'styles',
    hasChanges: false,
    setActiveTab: vi.fn(),
    applyChanges: vi.fn(),
    discardChanges: vi.fn(),
    resetAll: vi.fn(),
    setSelectedElement: vi.fn(),
  };

  const mockCanvasStore = {
    updateElement: vi.fn(),
  };

  beforeEach(() => {
    vi.mocked(useInspectorStore).mockReturnValue(mockInspectorStore);
    vi.mocked(useCanvasStore).mockReturnValue(mockCanvasStore);
  });

  describe('Empty State', () => {
    it('should render empty state when no element is selected', () => {
      mockInspectorStore.selectedElementId = null;
      mockInspectorStore.elementData = null;

      render(<PropertyInspector />);

      expect(screen.getByText('Properties')).toBeInTheDocument();
      expect(screen.getByText('No element selected')).toBeInTheDocument();
      expect(
        screen.getByText('Select an element in the canvas to view and edit its properties')
      ).toBeInTheDocument();
    });
  });

  describe('With Selected Element', () => {
    beforeEach(() => {
      mockInspectorStore.selectedElementId = 'test-1';
      mockInspectorStore.elementData = {
        id: 'test-1',
        tagName: 'DIV',
        attributes: { id: 'test-div', class: 'container' },
        styles: { display: 'flex' },
        children: [],
      };
    });

    it('should render header with element info', () => {
      render(<PropertyInspector />);

      expect(screen.getByText('Properties')).toBeInTheDocument();
      expect(screen.getByText('DIV')).toBeInTheDocument();
      expect(screen.getByText('#test-div')).toBeInTheDocument();
      expect(screen.getByText('.container')).toBeInTheDocument();
    });

    it('should render tabs', () => {
      render(<PropertyInspector />);

      expect(screen.getByText('Styles')).toBeInTheDocument();
      expect(screen.getByText('Attrs')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
      expect(screen.getByText('A11y')).toBeInTheDocument();
    });

    it('should switch tabs when clicked', () => {
      render(<PropertyInspector />);

      const attributesTab = screen.getByText('Attrs');
      fireEvent.click(attributesTab);

      expect(mockInspectorStore.setActiveTab).toHaveBeenCalledWith('attributes');
    });

    it('should disable content tab', () => {
      render(<PropertyInspector />);

      const contentTab = screen.getByText('Content').closest('button');
      expect(contentTab).toBeDisabled();
    });

    it('should close inspector when close button is clicked', () => {
      render(<PropertyInspector />);

      const closeButton = screen.getByLabelText('Close inspector');
      fireEvent.click(closeButton);

      expect(mockInspectorStore.setSelectedElement).toHaveBeenCalledWith(null, null);
    });
  });

  describe('Changes Actions', () => {
    beforeEach(() => {
      mockInspectorStore.selectedElementId = 'test-1';
      mockInspectorStore.elementData = {
        id: 'test-1',
        tagName: 'DIV',
        attributes: {},
        styles: { display: 'flex' },
        children: [],
      };
    });

    it('should show action buttons when there are changes', () => {
      mockInspectorStore.hasChanges = true;

      render(<PropertyInspector />);

      expect(screen.getByText('Discard')).toBeInTheDocument();
      expect(screen.getByText('Reset All')).toBeInTheDocument();
      expect(screen.getByText('Apply')).toBeInTheDocument();
    });

    it('should not show action buttons when there are no changes', () => {
      mockInspectorStore.hasChanges = false;

      render(<PropertyInspector />);

      expect(screen.queryByText('Discard')).not.toBeInTheDocument();
      expect(screen.queryByText('Reset All')).not.toBeInTheDocument();
      expect(screen.queryByText('Apply')).not.toBeInTheDocument();
    });

    it('should call discardChanges when Discard is clicked', () => {
      mockInspectorStore.hasChanges = true;

      render(<PropertyInspector />);

      const discardButton = screen.getByText('Discard');
      fireEvent.click(discardButton);

      expect(mockInspectorStore.discardChanges).toHaveBeenCalled();
    });

    it('should call resetAll when Reset All is clicked', () => {
      mockInspectorStore.hasChanges = true;

      render(<PropertyInspector />);

      const resetButton = screen.getByText('Reset All');
      fireEvent.click(resetButton);

      expect(mockInspectorStore.resetAll).toHaveBeenCalled();
    });

    it('should apply changes to canvas store when Apply is clicked', () => {
      mockInspectorStore.hasChanges = true;
      mockInspectorStore.groups = [
        {
          id: 'layout',
          label: 'Layout',
          icon: 'Layout',
          properties: [
            { id: 'display', label: 'Display', type: 'text', value: 'grid', defaultValue: 'block' },
          ],
        },
      ];

      render(<PropertyInspector />);

      const applyButton = screen.getByText('Apply');
      fireEvent.click(applyButton);

      expect(mockCanvasStore.updateElement).toHaveBeenCalled();
      expect(mockInspectorStore.applyChanges).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      mockInspectorStore.selectedElementId = 'test-1';
      mockInspectorStore.elementData = {
        id: 'test-1',
        tagName: 'DIV',
        attributes: {},
        styles: { display: 'flex' },
        children: [],
      };
    });

    it('should have proper aria-label', () => {
      render(<PropertyInspector />);

      const inspector = screen.getByLabelText('Property inspector');
      expect(inspector).toBeInTheDocument();
    });

    it('should have accessible close button', () => {
      render(<PropertyInspector />);

      const closeButton = screen.getByLabelText('Close inspector');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      mockInspectorStore.selectedElementId = 'test-1';
      mockInspectorStore.elementData = {
        id: 'test-1',
        tagName: 'DIV',
        attributes: {},
        styles: { display: 'flex' },
        children: [],
      };
    });

    it('should show full tab labels on larger screens', () => {
      render(<PropertyInspector />);

      expect(screen.getByText('Styles')).toBeInTheDocument();
    });
  });
});
