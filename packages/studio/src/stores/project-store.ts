/**
 * Project Store
 * Zustand store for managing project state
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  Project,
  ProjectListItem,
  ExportOptions,
  ProjectStorageStats,
} from '@/types/project';
import {
  projectStorageService,
  projectExporterService,
  projectImporterService,
} from '@/services/project';

interface ProjectStore {
  // State
  currentProject: Project | null;
  projects: ProjectListItem[];
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: string | null;
  autoSaveEnabled: boolean;
  autoSaveTimer: ReturnType<typeof setInterval> | null;
  storageStats: ProjectStorageStats | null;

  // Actions
  createProject: (name: string, description?: string) => Promise<Project>;
  loadProject: (projectId: string) => Promise<void>;
  saveProject: () => Promise<void>;
  saveAsProject: (name: string, description?: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  duplicateProject: (projectId: string) => Promise<Project>;
  setCurrentProject: (project: Project | null) => void;
  updateCurrentProject: (updates: Partial<Project>) => void;
  markDirty: () => void;
  markClean: () => void;

  // Auto-save
  enableAutoSave: () => void;
  disableAutoSave: () => void;

  // Export
  exportProject: (options: ExportOptions) => Promise<Blob>;

  // Import
  importProject: (file: File) => Promise<void>;

  // List management
  refreshProjectsList: () => Promise<void>;
  getStorageStats: () => Promise<void>;

  // Cleanup
  reset: () => void;
}

export const useProjectStore = create<ProjectStore>()(
  immer((set, get) => ({
    // Initial state
    currentProject: null,
    projects: [],
    isDirty: false,
    isSaving: false,
    lastSaved: null,
    autoSaveEnabled: true,
    autoSaveTimer: null,
    storageStats: null,

    // Actions

    /**
     * Create a new project
     */
    createProject: async (name, description) => {
      const project = await projectStorageService.createProject(name, description);

      set((state) => {
        state.currentProject = project;
        state.isDirty = false;
        state.lastSaved = new Date().toISOString();
      });

      // Refresh projects list
      await get().refreshProjectsList();

      return project;
    },

    /**
     * Load a project
     */
    loadProject: async (projectId) => {
      const project = await projectStorageService.loadProject(projectId);

      if (!project) {
        throw new Error('Project not found');
      }

      set((state) => {
        state.currentProject = project;
        state.isDirty = false;
        state.lastSaved = new Date().toISOString();
      });
    },

    /**
     * Save current project
     */
    saveProject: async () => {
      const { currentProject } = get();

      if (!currentProject) {
        throw new Error('No project loaded');
      }

      set((state) => {
        state.isSaving = true;
      });

      try {
        // Update timestamp
        currentProject.updatedAt = new Date().toISOString();

        await projectStorageService.saveProject(currentProject);

        set((state) => {
          state.isSaving = false;
          state.isDirty = false;
          state.lastSaved = currentProject.updatedAt;
        });
      } catch (error) {
        set((state) => {
          state.isSaving = false;
        });
        throw error;
      }
    },

    /**
     * Save project as new
     */
    saveAsProject: async (name, description) => {
      const { currentProject } = get();

      if (!currentProject) {
        throw new Error('No project loaded');
      }

      // Create new project with current content
      const newProject = await projectStorageService.createProject(name, description, {
        html: currentProject.html,
        canvasState: JSON.parse(JSON.stringify(currentProject.canvasState)),
        settings: { ...currentProject.settings },
      });

      set((state) => {
        state.currentProject = newProject;
        state.isDirty = false;
        state.lastSaved = newProject.updatedAt;
      });

      await get().refreshProjectsList();
    },

    /**
     * Delete a project
     */
    deleteProject: async (projectId) => {
      await projectStorageService.deleteProject(projectId);

      set((state) => {
        // If we deleted the current project, clear it
        if (state.currentProject?.id === projectId) {
          state.currentProject = null;
          state.isDirty = false;
          state.lastSaved = null;
        }
      });

      await get().refreshProjectsList();
    },

    /**
     * Duplicate a project
     */
    duplicateProject: async (projectId) => {
      const duplicated = await projectStorageService.duplicateProject(projectId);

      await get().refreshProjectsList();

      return duplicated;
    },

    /**
     * Set current project
     */
    setCurrentProject: (project) => {
      set((state) => {
        state.currentProject = project;
        state.isDirty = false;
      });
    },

    /**
     * Update current project
     */
    updateCurrentProject: (updates) => {
      set((state) => {
        if (state.currentProject) {
          Object.assign(state.currentProject, updates);
          state.isDirty = true;
        }
      });
    },

    /**
     * Mark project as dirty
     */
    markDirty: () => {
      set((state) => {
        state.isDirty = true;
      });
    },

    /**
     * Mark project as clean
     */
    markClean: () => {
      set((state) => {
        state.isDirty = false;
      });
    },

    /**
     * Enable auto-save
     */
    enableAutoSave: () => {
      const { autoSaveTimer, currentProject } = get();

      // Clear existing timer
      if (autoSaveTimer) {
        clearInterval(autoSaveTimer);
      }

      // Get auto-save interval from project settings
      const interval = currentProject?.settings.autoSaveInterval || 30000;

      // Set up new timer
      const timer = setInterval(async () => {
        const { isDirty, isSaving } = get();

        if (isDirty && !isSaving && currentProject) {
          try {
            await get().saveProject();
          } catch (error) {
            console.error('Auto-save failed:', error);
          }
        }
      }, interval);

      set((state) => {
        state.autoSaveEnabled = true;
        state.autoSaveTimer = timer;
      });
    },

    /**
     * Disable auto-save
     */
    disableAutoSave: () => {
      const { autoSaveTimer } = get();

      if (autoSaveTimer) {
        clearInterval(autoSaveTimer);
      }

      set((state) => {
        state.autoSaveEnabled = false;
        state.autoSaveTimer = null;
      });
    },

    /**
     * Export current project
     */
    exportProject: async (options) => {
      const { currentProject } = get();

      if (!currentProject) {
        throw new Error('No project loaded');
      }

      const result = await projectExporterService.exportProject(currentProject, options);

      // Trigger download
      const url = URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return result.blob;
    },

    /**
     * Import project from file
     */
    importProject: async (file) => {
      const result = await projectImporterService.importFile(file);

      if (!result.success || !result.project) {
        throw new Error(result.errors?.join(', ') || 'Import failed');
      }

      set((state) => {
        state.currentProject = result.project!;
        state.isDirty = false;
        state.lastSaved = new Date().toISOString();
      });

      await get().refreshProjectsList();

      if (result.warnings && result.warnings.length > 0) {
        console.warn('Import warnings:', result.warnings);
      }
    },

    /**
     * Refresh projects list
     */
    refreshProjectsList: async () => {
      const projects = await projectStorageService.getProjectsList();

      set((state) => {
        state.projects = projects;
      });
    },

    /**
     * Get storage statistics
     */
    getStorageStats: async () => {
      const stats = await projectStorageService.getStorageStats();

      set((state) => {
        state.storageStats = stats;
      });
    },

    /**
     * Reset store
     */
    reset: () => {
      const { autoSaveTimer } = get();

      if (autoSaveTimer) {
        clearInterval(autoSaveTimer);
      }

      set((state) => {
        state.currentProject = null;
        state.projects = [];
        state.isDirty = false;
        state.isSaving = false;
        state.lastSaved = null;
        state.autoSaveEnabled = true;
        state.autoSaveTimer = null;
        state.storageStats = null;
      });
    },
  }))
);

export type { ProjectStore };
