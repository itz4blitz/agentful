/**
 * ExportDialog Component Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ExportDialog } from '../export-dialog';
import { useProjectStore } from '@/stores/project-store';

// Mock the project store
vi.mock('@/stores/project-store', () => ({
  useProjectStore: vi.fn(),
}));

describe('ExportDialog Component', () => {
  const mockProject = {
    id: 'project-1',
    name: 'Test Project',
    description: 'A test project',
    html: '<div>Test</div>',
    canvasState: {
      elements: [],
      selectedElement: null,
      hoveredElement: null,
      html: '<div>Test</div>',
      isDirty: false,
      history: [],
      historyIndex: -1,
      clipboard: null,
    },
    settings: {
      theme: {
        id: 'default',
        name: 'Default',
        mode: 'light',
        colors: {},
        description: 'Default theme',
      },
      autoSave: true,
      autoSaveInterval: 30000,
      exportFormat: 'html',
      includeComments: false,
      useSemanticHTML: true,
    },
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  };

  const mockStore = {
    currentProject: mockProject,
    exportProject: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useProjectStore as any).mockReturnValue(mockStore);
  });

  describe('rendering', () => {
    it('should render dialog when open', () => {
      render(
        <ExportDialog open={true} onOpenChange={vi.fn()} />
      );

      expect(screen.getByText('Export Project')).toBeInTheDocument();
      expect(screen.getByText(/Export "Test Project"/)).toBeInTheDocument();
    });

    it('should not render dialog when closed', () => {
      render(
        <ExportDialog open={false} onOpenChange={vi.fn()} />
      );

      expect(screen.queryByText('Export Project')).not.toBeInTheDocument();
    });

    it('should display format options', () => {
      render(
        <ExportDialog open={true} onOpenChange={vi.fn()} />
      );

      expect(screen.getByText('HTML')).toBeInTheDocument();
      expect(screen.getByText('REACT')).toBeInTheDocument();
      expect(screen.getByText('ZIP')).toBeInTheDocument();
    });

    it('should display export options', () => {
      render(
        <ExportDialog open={true} onOpenChange={vi.fn()} />
      );

      expect(screen.getByText('Minify code')).toBeInTheDocument();
      expect(screen.getByText('Inline CSS')).toBeInTheDocument();
      expect(screen.getByText('Include assets')).toBeInTheDocument();
      expect(screen.getByText('Include comments')).toBeInTheDocument();
      expect(screen.getByText('Source map')).toBeInTheDocument();
    });
  });

  describe('format selection', () => {
    it('should select HTML format by default', () => {
      render(
        <ExportDialog open={true} onOpenChange={vi.fn()} />
      );

      // Check if HTML is selected (should have primary border or visual indication)
      const htmlButton = screen.getByText('HTML').closest('button');
      expect(htmlButton).toHaveClass('border-primary');
    });

    it('should change format on click', () => {
      render(
        <ExportDialog open={true} onOpenChange={vi.fn()} />
      );

      const reactButton = screen.getByText('REACT').closest('button');
      fireEvent.click(reactButton!);

      expect(reactButton).toHaveClass('border-primary');
    });

    it('should show format description', () => {
      render(
        <ExportDialog open={true} onOpenChange={vi.fn()} />
      );

      expect(screen.getByText('Standalone HTML file ready to deploy')).toBeInTheDocument();
    });

    it('should update description when format changes', () => {
      render(
        <ExportDialog open={true} onOpenChange={vi.fn()} />
      );

      const reactButton = screen.getByText('REACT').closest('button');
      fireEvent.click(reactButton!);

      expect(screen.getByText('React component with separate styles')).toBeInTheDocument();
    });
  });

  describe('export options', () => {
    it('should toggle minify option', () => {
      render(
        <ExportDialog open={true} onOpenChange={vi.fn()} />
      );

      const minifyToggle = screen.getByLabelText('Minify code');
      expect(minifyToggle).not.toBeChecked();

      fireEvent.click(minifyToggle);
      expect(minifyToggle).toBeChecked();
    });

    it('should toggle inline CSS option', () => {
      render(
        <ExportDialog open={true} onOpenChange={vi.fn()} />
      );

      const inlineCSSToggle = screen.getByLabelText('Inline CSS');
      expect(inlineCSSToggle).not.toBeChecked();

      fireEvent.click(inlineCSSToggle);
      expect(inlineCSSToggle).toBeChecked();
    });

    it('should toggle include assets option', () => {
      render(
        <ExportDialog open={true} onOpenChange={vi.fn()} />
      );

      const includeAssetsToggle = screen.getByLabelText('Include assets');
      expect(includeAssetsToggle).toBeChecked();

      fireEvent.click(includeAssetsToggle);
      expect(includeAssetsToggle).not.toBeChecked();
    });

    it('should toggle include comments option', () => {
      render(
        <ExportDialog open={true} onOpenChange={vi.fn()} />
      );

      const commentsToggle = screen.getByLabelText('Include comments');
      expect(commentsToggle).not.toBeChecked();

      fireEvent.click(commentsToggle);
      expect(commentsToggle).toBeChecked();
    });

    it('should toggle source map option', () => {
      render(
        <ExportDialog open={true} onOpenChange={vi.fn()} />
      );

      const sourceMapToggle = screen.getByLabelText('Source map');
      expect(sourceMapToggle).not.toBeChecked();

      fireEvent.click(sourceMapToggle);
      expect(sourceMapToggle).toBeChecked();
    });
  });

  describe('format-specific options', () => {
    it('should disable inline CSS for ZIP format', () => {
      render(
        <ExportDialog open={true} onOpenChange={vi.fn()} />
      );

      const zipButton = screen.getByText('ZIP').closest('button');
      fireEvent.click(zipButton!);

      const inlineCSSToggle = screen.getByLabelText('Inline CSS');
      expect(inlineCSSToggle).toBeDisabled();
    });

    it('should disable include assets for non-ZIP formats', () => {
      render(
        <ExportDialog open={true} onOpenChange={vi.fn()} />
      );

      // Default is HTML, assets should be disabled
      const includeAssetsToggle = screen.getByLabelText('Include assets');
      expect(includeAssetsToggle).toBeDisabled();
    });

    it('should disable source map for HTML format', () => {
      render(
        <ExportDialog open={true} onOpenChange={vi.fn()} />
      );

      const sourceMapToggle = screen.getByLabelText('Source map');
      expect(sourceMapToggle).toBeDisabled();
    });
  });

  describe('export action', () => {
    it('should call exportProject with correct options', async () => {
      mockStore.exportProject.mockResolvedValue(new Blob());

      const onOpenChange = vi.fn();

      render(
        <ExportDialog open={true} onOpenChange={onOpenChange} />
      );

      const exportButton = screen.getByText('Export HTML');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(mockStore.exportProject).toHaveBeenCalledWith({
          format: 'html',
          minify: false,
          inlineCSS: false,
          includeAssets: true,
          includeComments: false,
          sourceMap: false,
        });
      });
    });

    it('should show custom settings indicator when options change', () => {
      render(
        <ExportDialog open={true} onOpenChange={vi.fn()} />
      );

      // Initially no custom indicator
      expect(screen.queryByText('(Custom settings applied)')).not.toBeInTheDocument();

      // Change an option
      const minifyToggle = screen.getByLabelText('Minify code');
      fireEvent.click(minifyToggle);

      expect(screen.getByText('(Custom settings applied)')).toBeInTheDocument();
    });

    it('should show progress during export', async () => {
      mockStore.exportProject.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 500))
      );

      render(
        <ExportDialog open={true} onOpenChange={vi.fn()} />
      );

      const exportButton = screen.getByText('Export HTML');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(screen.getByText('Exporting...')).toBeInTheDocument();
        expect(screen.getByText(/Exporting\.\.\./)).toBeInTheDocument();
      });
    });

    it('should close dialog after successful export', async () => {
      mockStore.exportProject.mockResolvedValue(new Blob());

      const onOpenChange = vi.fn();

      render(
        <ExportDialog open={true} onOpenChange={onOpenChange} />
      );

      const exportButton = screen.getByText('Export HTML');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      }, { timeout: 2000 });
    });

    it('should be disabled when no project is loaded', () => {
      (useProjectStore as any).mockReturnValue({
        ...mockStore,
        currentProject: null,
      });

      render(
        <ExportDialog open={true} onOpenChange={vi.fn()} />
      );

      const exportButton = screen.getByText('Export HTML');
      expect(exportButton).toBeDisabled();
    });
  });

  describe('cancel action', () => {
    it('should close dialog when clicking Cancel', () => {
      const onOpenChange = vi.fn();

      render(
        <ExportDialog open={true} onOpenChange={onOpenChange} />
      );

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('reset on close', () => {
    it('should reset all options when dialog closes', () => {
      const onOpenChange = vi.fn();

      const { rerender } = render(
        <ExportDialog open={true} onOpenChange={onOpenChange} />
      );

      // Change some options
      const minifyToggle = screen.getByLabelText('Minify code');
      fireEvent.click(minifyToggle);

      const reactButton = screen.getByText('REACT').closest('button');
      fireEvent.click(reactButton!);

      // Close and reopen
      onOpenChange(false);
      rerender(<ExportDialog open={false} onOpenChange={onOpenChange} />);

      onOpenChange(true);
      rerender(<ExportDialog open={true} onOpenChange={onOpenChange} />);

      // Should be back to defaults
      expect(screen.getByLabelText('Minify code')).not.toBeChecked();
      const htmlButton = screen.getByText('HTML').closest('button');
      expect(htmlButton).toHaveClass('border-primary');
    });
  });

  describe('accessibility', () => {
    it('should have proper aria labels', () => {
      render(
        <ExportDialog open={true} onOpenChange={vi.fn()} />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      const heading = screen.getByRole('heading', { name: 'Export Project' });
      expect(heading).toBeInTheDocument();
    });

    it('should have accessible form labels', () => {
      render(
        <ExportDialog open={true} onOpenChange={vi.fn()} />
      );

      expect(screen.getByLabelText('Minify code')).toBeInTheDocument();
      expect(screen.getByLabelText('Inline CSS')).toBeInTheDocument();
      expect(screen.getByLabelText('Include assets')).toBeInTheDocument();
      expect(screen.getByLabelText('Include comments')).toBeInTheDocument();
      expect(screen.getByLabelText('Source map')).toBeInTheDocument();
    });
  });
});
