/**
 * Project Storage Service
 * Handles localStorage and IndexedDB operations for project persistence
 */

import { nanoid } from 'nanoid';
import type {
  Project,
  ProjectListItem,
  ProjectStorageStats,
  StorageConfig,
  StorageBackend,
} from '@/types/project';
import {
  DEFAULT_PROJECT_SETTINGS,
  INDEXEDDB_CONFIG,
  PROJECT_STORAGE_KEYS,
} from '@/types/project';

/**
 * Project Storage Service
 * Handles saving/loading projects from localStorage and IndexedDB
 */
export class ProjectStorageService {
  private config: StorageConfig;
  private db: IDBDatabase | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(config?: Partial<StorageConfig>) {
    this.config = {
      backend: 'indexedDB',
      databaseName: INDEXEDDB_CONFIG.DATABASE_NAME,
      storeName: INDEXEDDB_CONFIG.STORE_NAME,
      debounceMs: 500,
      ...config,
    };
  }

  /**
   * Initialize IndexedDB database
   */
  private async initDB(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(
        this.config.databaseName!,
        INDEXEDDB_CONFIG.VERSION
      );

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB database'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create projects store
        if (!db.objectStoreNames.contains(this.config.storeName!)) {
          const store = db.createObjectStore(this.config.storeName!, {
            keyPath: 'id',
          });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  /**
   * Get storage backend based on configuration
   */
  private getBackend(): StorageBackend {
    // Check if IndexedDB is available
    if (this.config.backend === 'indexedDB' && typeof indexedDB !== 'undefined') {
      return 'indexedDB';
    }
    return 'localStorage';
  }

  /**
   * Save project to storage
   */
  async saveProject(project: Project): Promise<void> {
    const backend = this.getBackend();

    if (backend === 'indexedDB') {
      await this.saveToIndexedDB(project);
    } else {
      await this.saveToLocalStorage(project);
    }

    // Update projects list
    await this.updateProjectsList();
  }

  /**
   * Save project to IndexedDB
   */
  private async saveToIndexedDB(project: Project): Promise<void> {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.config.storeName!], 'readwrite');
      const store = transaction.objectStore(this.config.storeName!);
      const request = store.put(project);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save project to IndexedDB'));
    });
  }

  /**
   * Save project to localStorage (fallback)
   */
  private async saveToLocalStorage(project: Project): Promise<void> {
    try {
      const key = `${PROJECT_STORAGE_KEYS.PROJECT_METADATA_PREFIX}${project.id}`;
      localStorage.setItem(key, JSON.stringify(project));
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        throw new Error('Storage quota exceeded. Please delete some projects.');
      }
      throw error;
    }
  }

  /**
   * Load project from storage
   */
  async loadProject(projectId: string): Promise<Project | null> {
    const backend = this.getBackend();

    if (backend === 'indexedDB') {
      return this.loadFromIndexedDB(projectId);
    } else {
      return this.loadFromLocalStorage(projectId);
    }
  }

  /**
   * Load project from IndexedDB
   */
  private async loadFromIndexedDB(projectId: string): Promise<Project | null> {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.config.storeName!], 'readonly');
      const store = transaction.objectStore(this.config.storeName!);
      const request = store.get(projectId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(new Error('Failed to load project from IndexedDB'));
      };
    });
  }

  /**
   * Load project from localStorage
   */
  private async loadFromLocalStorage(projectId: string): Promise<Project | null> {
    try {
      const key = `${PROJECT_STORAGE_KEYS.PROJECT_METADATA_PREFIX}${projectId}`;
      const stored = localStorage.getItem(key);

      if (stored) {
        return JSON.parse(stored) as Project;
      }

      return null;
    } catch (error) {
      console.error('Failed to load project from localStorage:', error);
      return null;
    }
  }

  /**
   * Delete project from storage
   */
  async deleteProject(projectId: string): Promise<void> {
    const backend = this.getBackend();

    if (backend === 'indexedDB') {
      await this.deleteFromIndexedDB(projectId);
    } else {
      await this.deleteFromLocalStorage(projectId);
    }

    // Update projects list
    await this.updateProjectsList();
  }

  /**
   * Delete project from IndexedDB
   */
  private async deleteFromIndexedDB(projectId: string): Promise<void> {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.config.storeName!], 'readwrite');
      const store = transaction.objectStore(this.config.storeName!);
      const request = store.delete(projectId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete project from IndexedDB'));
    });
  }

  /**
   * Delete project from localStorage
   */
  private async deleteFromLocalStorage(projectId: string): Promise<void> {
    try {
      const key = `${PROJECT_STORAGE_KEYS.PROJECT_METADATA_PREFIX}${projectId}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to delete project from localStorage:', error);
    }
  }

  /**
   * Get list of all projects
   */
  async getProjectsList(): Promise<ProjectListItem[]> {
    const backend = this.getBackend();

    if (backend === 'indexedDB') {
      return this.getProjectsListFromIndexedDB();
    } else {
      return this.getProjectsListFromLocalStorage();
    }
  }

  /**
   * Get projects list from IndexedDB
   */
  private async getProjectsListFromIndexedDB(): Promise<ProjectListItem[]> {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.config.storeName!], 'readonly');
      const store = transaction.objectStore(this.config.storeName!);
      const request = store.getAll();

      request.onsuccess = () => {
        const projects = request.result as Project[];
        const listItems: ProjectListItem[] = projects.map((project) => ({
          id: project.id,
          name: project.name,
          description: project.description,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          thumbnail: project.thumbnail,
        }));

        // Sort by updated date (newest first)
        listItems.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );

        resolve(listItems);
      };

      request.onerror = () => {
        reject(new Error('Failed to get projects list from IndexedDB'));
      };
    });
  }

  /**
   * Get projects list from localStorage
   */
  private async getProjectsListFromLocalStorage(): Promise<ProjectListItem[]> {
    try {
      const projects: ProjectListItem[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(PROJECT_STORAGE_KEYS.PROJECT_METADATA_PREFIX)) {
          const stored = localStorage.getItem(key);
          if (stored) {
            const project = JSON.parse(stored) as Project;
            projects.push({
              id: project.id,
              name: project.name,
              description: project.description,
              createdAt: project.createdAt,
              updatedAt: project.updatedAt,
              thumbnail: project.thumbnail,
            });
          }
        }
      }

      // Sort by updated date (newest first)
      projects.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      return projects;
    } catch (error) {
      console.error('Failed to get projects list from localStorage:', error);
      return [];
    }
  }

  /**
   * Update cached projects list in localStorage
   */
  private async updateProjectsList(): Promise<void> {
    try {
      const list = await this.getProjectsList();
      localStorage.setItem(
        PROJECT_STORAGE_KEYS.PROJECTS_LIST,
        JSON.stringify(list)
      );
    } catch (error) {
      console.error('Failed to update projects list cache:', error);
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<ProjectStorageStats> {
    const backend = this.getBackend();

    if (backend === 'indexedDB') {
      return this.getIndexedDBStats();
    } else {
      return this.getLocalStorageStats();
    }
  }

  /**
   * Get IndexedDB statistics
   */
  private async getIndexedDBStats(): Promise<ProjectStorageStats> {
    const projects = await this.getProjectsList();

    // Rough estimation of storage usage
    const totalSize = projects.length * 1024 * 100; // Assume ~100KB per project
    const availableSize = 50 * 1024 * 1024; // IndexedDB typically allows ~50MB
    const usagePercentage = Math.min((totalSize / availableSize) * 100, 100);

    return {
      totalProjects: projects.length,
      totalSize,
      availableSize,
      usagePercentage,
    };
  }

  /**
   * Get localStorage statistics
   */
  private async getLocalStorageStats(): Promise<ProjectStorageStats> {
    const projects = await this.getProjectsList();

    let totalSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(PROJECT_STORAGE_KEYS.PROJECT_METADATA_PREFIX)) {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += key.length + value.length;
        }
      }
    }

    // localStorage typically allows ~5-10MB
    const availableSize = 5 * 1024 * 1024;
    const usagePercentage = Math.min((totalSize / availableSize) * 100, 100);

    return {
      totalProjects: projects.length,
      totalSize,
      availableSize,
      usagePercentage,
    };
  }

  /**
   * Create a new project
   */
  async createProject(
    name: string,
    description?: string,
    initialState?: Partial<Project>
  ): Promise<Project> {
    const now = new Date().toISOString();

    const project: Project = {
      id: nanoid(),
      name,
      description,
      createdAt: now,
      updatedAt: now,
      html: initialState?.html || '',
      canvasState: initialState?.canvasState || {
        elements: [],
        selectedElement: null,
        hoveredElement: null,
        html: '',
        isDirty: false,
        history: [],
        historyIndex: -1,
        clipboard: null,
      },
      settings: initialState?.settings || DEFAULT_PROJECT_SETTINGS,
    };

    await this.saveProject(project);
    return project;
  }

  /**
   * Duplicate a project
   */
  async duplicateProject(projectId: string): Promise<Project> {
    const original = await this.loadProject(projectId);

    if (!original) {
      throw new Error('Project not found');
    }

    return this.createProject(
      `${original.name} (Copy)`,
      original.description,
      {
        ...original,
        canvasState: JSON.parse(JSON.stringify(original.canvasState)),
        settings: { ...original.settings },
      }
    );
  }

  /**
   * Auto-save with debouncing
   */
  autoSave(project: Project): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.saveProject(project).catch(console.error);
    }, this.config.debounceMs);
  }

  /**
   * Clean up
   */
  destroy(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Singleton instance
export const projectStorageService = new ProjectStorageService();
