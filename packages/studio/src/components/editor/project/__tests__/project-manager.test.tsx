/**
 * ProjectManager Component Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProjectManager } from '../project-manager';
import { useProjectStore } from '@/stores/project-store';

// Mock the project store
vi.mock('@/stores/project-store', () => ({
  useProjectStore: vi.fn(),
}));

describe('ProjectManager Component', () => {
  const mockProjects = [
    {
      id: 'project-1',
      name: 'Project One',
      description: 'First project',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
    },
    {
      id: 'project-2',
      name: 'Project Two',
      description: 'Second project',
      createdAt: '2024-01-03T00:00:00.000Z',
      updatedAt: '2024-01-04T00:00:00.000Z',
      thumbnail: 'data:image/png;base64,placeholder',
    },
  ];

  const mockStore = {
    projects: mockProjects,
    createProject: vi.fn(),
    loadProject: vi.fn(),
    deleteProject: vi.fn(),
    duplicateProject: vi.fn(),
    refreshProjectsList: vi.fn(),
    getStorageStats: vi.fn(),
    storageStats: {
      totalProjects: 2,
      totalSize: 204800,
      availableSize: 5242880,
      usagePercentage: 3.9,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useProjectStore as any).mockReturnValue(mockStore);
  });

  describe('rendering', () => {
    it('should render dialog when open', () => {
      render(
        <ProjectManager open={true} onOpenChange={vi.fn()} />
      );

      expect(screen.getByText('Projects')).toBeInTheDocument();
      expect(screen.getByText(/Manage your website projects/)).toBeInTheDocument();
    });

    it('should not render dialog when closed', () => {
      render(
        <ProjectManager open={false} onOpenChange={vi.fn()} />
      );

      expect(screen.queryByText('Projects')).not.toBeInTheDocument();
    });

    it('should display storage statistics', () => {
      render(
        <ProjectManager open={true} onOpenChange={vi.fn()} />
      );

      expect(screen.getByText('2 projects')).toBeInTheDocument();
      expect(screen.getByText(/0.2 MB/)).toBeInTheDocument();
    });

    it('should render search input', () => {
      render(
        <ProjectManager open={true} onOpenChange={vi.fn()} />
      );

      const searchInput = screen.getByPlaceholderText('Search projects...');
      expect(searchInput).toBeInTheDocument();
    });

    it('should render new project button', () => {
      render(
        <ProjectManager open={true} onOpenChange={vi.fn()} />
      );

      expect(screen.getByText('New Project')).toBeInTheDocument();
    });
  });

  describe('project list', () => {
    it('should render all projects', () => {
      render(
        <ProjectManager open={true} onOpenChange={vi.fn()} />
      );

      expect(screen.getByText('Project One')).toBeInTheDocument();
      expect(screen.getByText('Project Two')).toBeInTheDocument();
    });

    it('should render project descriptions', () => {
      render(
        <ProjectManager open={true} onOpenChange={vi.fn()} />
      );

      expect(screen.getByText('First project')).toBeInTheDocument();
      expect(screen.getByText('Second project')).toBeInTheDocument();
    });

    it('should show empty state when no projects', () => {
      (useProjectStore as any).mockReturnValue({
        ...mockStore,
        projects: [],
      });

      render(
        <ProjectManager open={true} onOpenChange={vi.fn()} />
      );

      expect(screen.getByText(/No projects yet/)).toBeInTheDocument();
      expect(screen.getByText('Create your first project to get started')).toBeInTheDocument();
    });

    it('should show no results for search', () => {
      render(
        <ProjectManager open={true} onOpenChange={vi.fn()} />
      );

      const searchInput = screen.getByPlaceholderText('Search projects...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      expect(screen.getByText('No projects found')).toBeInTheDocument();
    });
  });

  describe('search functionality', () => {
    it('should filter projects by name', () => {
      render(
        <ProjectManager open={true} onOpenChange={vi.fn()} />
      );

      const searchInput = screen.getByPlaceholderText('Search projects...');
      fireEvent.change(searchInput, { target: { value: 'One' } });

      expect(screen.getByText('Project One')).toBeInTheDocument();
      expect(screen.queryByText('Project Two')).not.toBeInTheDocument();
    });

    it('should filter projects by description', () => {
      render(
        <ProjectManager open={true} onOpenChange={vi.fn()} />
      );

      const searchInput = screen.getByPlaceholderText('Search projects...');
      fireEvent.change(searchInput, { target: { value: 'First' } });

      expect(screen.getByText('Project One')).toBeInTheDocument();
      expect(screen.queryByText('Project Two')).not.toBeInTheDocument();
    });

    it('should be case-insensitive', () => {
      render(
        <ProjectManager open={true} onOpenChange={vi.fn()} />
      );

      const searchInput = screen.getByPlaceholderText('Search projects...');
      fireEvent.change(searchInput, { target: { value: 'PROJECT ONE' } });

      expect(screen.getByText('Project One')).toBeInTheDocument();
    });
  });

  describe('project actions', () => {
    it('should open project when clicking Open button', async () => {
      const onProjectOpen = vi.fn();
      const onOpenChange = vi.fn();

      render(
        <ProjectManager
          open={true}
          onOpenChange={onOpenChange}
          onProjectOpen={onProjectOpen}
        />
      );

      const openButton = screen.getAllByText('Open')[0];
      fireEvent.click(openButton);

      await waitFor(() => {
        expect(mockStore.loadProject).toHaveBeenCalledWith('project-1');
      });
    });

    it('should show dropdown menu for more options', () => {
      render(
        <ProjectManager open={true} onOpenChange={vi.fn()} />
      );

      // Click the more options button (appears twice, one for each project)
      const moreButtons = screen.getAllByRole('button').filter(
        button => button.getAttribute('aria-label') === undefined
      );

      fireEvent.click(moreButtons[moreButtons.length - 1]);

      expect(screen.getByText('Duplicate')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should call createProject when clicking New Project', async () => {
      mockStore.createProject.mockResolvedValue({
        id: 'new-project',
        name: 'Untitled Project 3',
      });

      const onOpenChange = vi.fn();

      render(
        <ProjectManager open={true} onOpenChange={onOpenChange} />
      );

      const newButton = screen.getByText('New Project');
      fireEvent.click(newButton);

      await waitFor(() => {
        expect(mockStore.createProject).toHaveBeenCalled();
      });
    });
  });

  describe('delete confirmation', () => {
    it('should show delete confirmation dialog', () => {
      render(
        <ProjectManager open={true} onOpenChange={vi.fn()} />
      );

      // Find and click the delete button (in dropdown)
      const moreButtons = screen.getAllByRole('button');
      const lastButton = moreButtons[moreButtons.length - 1];
      fireEvent.click(lastButton);

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      expect(screen.getByText('Delete Project?')).toBeInTheDocument();
    });

    it('should delete project on confirmation', async () => {
      mockStore.deleteProject.mockResolvedValue(undefined);

      render(
        <ProjectManager open={true} onOpenChange={vi.fn()} />
      );

      // Open dropdown and click delete
      const moreButtons = screen.getAllByRole('button');
      const lastButton = moreButtons[moreButtons.length - 1];
      fireEvent.click(lastButton);

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      // Confirm deletion
      const confirmButton = screen.getByText('Delete');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockStore.deleteProject).toHaveBeenCalled();
      });
    });
  });

  describe('lifecycle', () => {
    it('should refresh projects when opened', () => {
      const { rerender } = render(
        <ProjectManager open={false} onOpenChange={vi.fn()} />
      );

      expect(mockStore.refreshProjectsList).not.toHaveBeenCalled();

      rerender(<ProjectManager open={true} onOpenChange={vi.fn()} />);

      expect(mockStore.refreshProjectsList).toHaveBeenCalled();
    });

    it('should get storage stats when opened', () => {
      const { rerender } = render(
        <ProjectManager open={false} onOpenChange={vi.fn()} />
      );

      expect(mockStore.getStorageStats).not.toHaveBeenCalled();

      rerender(<ProjectManager open={true} onOpenChange={vi.fn()} />);

      expect(mockStore.getStorageStats).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have proper aria labels', () => {
      render(
        <ProjectManager open={true} onOpenChange={vi.fn()} />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      const heading = screen.getByRole('heading', { name: 'Projects' });
      expect(heading).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      render(
        <ProjectManager open={true} onOpenChange={vi.fn()} />
      );

      const searchInput = screen.getByPlaceholderText('Search projects...');
      expect(searchInput).toHaveFocus();

      // Tab to New Project button
      fireEvent.keyDown(searchInput, { key: 'Tab' });
      // Note: Full keyboard navigation testing would require more complex setup
    });
  });
});
