/**
 * Project Storage Service Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProjectStorageService } from '../project-storage';
import type { Project } from '@/types/project';
import { DEFAULT_PROJECT_SETTINGS } from '@/types/project';

describe('ProjectStorageService', () => {
  let service: ProjectStorageService;
  let mockProject: Project;

  beforeEach(() => {
    service = new ProjectStorageService({
      backend: 'localStorage',
      debounceMs: 0, // Disable debouncing for tests
    });

    mockProject = {
      id: 'test-project-1',
      name: 'Test Project',
      description: 'A test project',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      html: '<div>Test HTML</div>',
      canvasState: {
        elements: [],
        selectedElement: null,
        hoveredElement: null,
        html: '<div>Test HTML</div>',
        isDirty: false,
        history: [],
        historyIndex: -1,
        clipboard: null,
      },
      settings: DEFAULT_PROJECT_SETTINGS,
    };

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    service.destroy();
  });

  describe('createProject', () => {
    it('should create a new project with generated ID', async () => {
      const project = await service.createProject('New Project', 'Description');

      expect(project.id).toBeDefined();
      expect(project.name).toBe('New Project');
      expect(project.description).toBe('Description');
      expect(project.createdAt).toBeDefined();
      expect(project.updatedAt).toBeDefined();
    });

    it('should create project with custom initial state', async () => {
      const customState = {
        html: '<p>Custom HTML</p>',
        settings: {
          ...DEFAULT_PROJECT_SETTINGS,
          autoSave: false,
        },
      };

      const project = await service.createProject(
        'Custom Project',
        undefined,
        customState
      );

      expect(project.html).toBe('<p>Custom HTML</p>');
      expect(project.settings.autoSave).toBe(false);
    });

    it('should save project to storage', async () => {
      await service.createProject('Saved Project');
      const projects = await service.getProjectsList();

      expect(projects).toHaveLength(1);
      expect(projects[0].name).toBe('Saved Project');
    });
  });

  describe('saveProject and loadProject', () => {
    it('should save and load project successfully', async () => {
      await service.saveProject(mockProject);
      const loaded = await service.loadProject(mockProject.id);

      expect(loaded).toEqual(mockProject);
    });

    it('should update existing project on save', async () => {
      await service.saveProject(mockProject);

      const updated = { ...mockProject, name: 'Updated Project' };
      await service.saveProject(updated);

      const loaded = await service.loadProject(mockProject.id);
      expect(loaded?.name).toBe('Updated Project');
    });

    it('should return null for non-existent project', async () => {
      const loaded = await service.loadProject('non-existent');
      expect(loaded).toBeNull();
    });
  });

  describe('deleteProject', () => {
    it('should delete project from storage', async () => {
      await service.saveProject(mockProject);
      await service.deleteProject(mockProject.id);

      const loaded = await service.loadProject(mockProject.id);
      expect(loaded).toBeNull();
    });

    it('should update projects list after deletion', async () => {
      await service.saveProject(mockProject);
      await service.deleteProject(mockProject.id);

      const projects = await service.getProjectsList();
      expect(projects).toHaveLength(0);
    });
  });

  describe('getProjectsList', () => {
    it('should return empty list when no projects', async () => {
      const projects = await service.getProjectsList();
      expect(projects).toEqual([]);
    });

    it('should return list of all projects', async () => {
      await service.saveProject(mockProject);
      await service.createProject('Project 2');
      await service.createProject('Project 3');

      const projects = await service.getProjectsList();
      expect(projects).toHaveLength(3);
    });

    it('should sort projects by updated date (newest first)', async () => {
      const project1 = await service.createProject('Project 1');

      // Wait to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      const project2 = await service.createProject('Project 2');

      const projects = await service.getProjectsList();
      expect(projects[0].id).toBe(project2.id);
      expect(projects[1].id).toBe(project1.id);
    });

    it('should include only metadata, not full project data', async () => {
      await service.saveProject(mockProject);

      const projects = await service.getProjectsList();
      const listItem = projects[0];

      expect(listItem.id).toBe(mockProject.id);
      expect(listItem.name).toBe(mockProject.name);
      expect(listItem.description).toBe(mockProject.description);
      expect(listItem.createdAt).toBe(mockProject.createdAt);
      expect(listItem.updatedAt).toBe(mockProject.updatedAt);
      expect(listItem).not.toHaveProperty('html');
      expect(listItem).not.toHaveProperty('canvasState');
    });
  });

  describe('duplicateProject', () => {
    it('should create a copy of existing project', async () => {
      await service.saveProject(mockProject);
      const duplicate = await service.duplicateProject(mockProject.id);

      expect(duplicate.id).not.toBe(mockProject.id);
      expect(duplicate.name).toBe('Test Project (Copy)');
      expect(duplicate.html).toBe(mockProject.html);
    });

    it('should throw error for non-existent project', async () => {
      await expect(
        service.duplicateProject('non-existent')
      ).rejects.toThrow('Project not found');
    });
  });

  describe('autoSave', () => {
    it('should debounce save operations', async () => {
      vi.useFakeTimers();

      const debounceService = new ProjectStorageService({
        backend: 'localStorage',
        debounceMs: 100,
      });

      debounceService.autoSave(mockProject);
      debounceService.autoSave({ ...mockProject, name: 'Updated' });

      // Should not save immediately
      const loaded1 = await debounceService.loadProject(mockProject.id);
      expect(loaded1).toBeNull();

      // Fast-forward past debounce time
      await vi.advanceTimersByTimeAsync(150);

      // Wait for all pending timers and promises
      await vi.runAllTimersAsync();
      await vi.runOnlyPendingTimersAsync();

      const loaded2 = await debounceService.loadProject(mockProject.id);
      expect(loaded2?.name).toBe('Updated');

      debounceService.destroy();

      vi.useRealTimers();
    });
  });

  describe('getStorageStats', () => {
    it('should return storage statistics', async () => {
      await service.saveProject(mockProject);
      await service.createProject('Project 2');

      const stats = await service.getStorageStats();

      expect(stats.totalProjects).toBe(2);
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.availableSize).toBeGreaterThan(0);
      expect(stats.usagePercentage).toBeGreaterThanOrEqual(0);
      expect(stats.usagePercentage).toBeLessThanOrEqual(100);
    });
  });

  describe('error handling', () => {
    it('should handle storage quota exceeded', async () => {
      // Mock localStorage to throw quota exceeded error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new DOMException('QuotaExceededError', 'QuotaExceededError');
      });

      await expect(
        service.saveProject(mockProject)
      ).rejects.toThrow(/quota/i);

      localStorage.setItem = originalSetItem;
    });

    it('should handle corrupted data gracefully', async () => {
      localStorage.setItem(
        'visual-builder-project-meta-test-project-1',
        'invalid json'
      );

      const loaded = await service.loadProject('test-project-1');
      expect(loaded).toBeNull();
    });
  });
});
