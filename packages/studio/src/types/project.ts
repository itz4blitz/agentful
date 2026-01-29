/**
 * Project Types
 * Type definitions for the Project Management feature
 */

import type { CanvasState } from './canvas';
import type { Theme } from './theme';

/**
 * Project metadata and content
 */
export interface Project {
  /** Unique project identifier */
  id: string;
  /** Project name */
  name: string;
  /** Optional project description */
  description?: string;
  /** Project creation timestamp (ISO string) */
  createdAt: string;
  /** Project last updated timestamp (ISO string) */
  updatedAt: string;
  /** Optional base64-encoded thumbnail image */
  thumbnail?: string;
  /** Complete HTML output */
  html: string;
  /** Canvas state including elements, selection, history */
  canvasState: CanvasState;
  /** Project-specific settings */
  settings: ProjectSettings;
}

/**
 * Project settings
 */
export interface ProjectSettings {
  /** Active theme */
  theme: Theme;
  /** Enable auto-save */
  autoSave: boolean;
  /** Auto-save interval in milliseconds */
  autoSaveInterval: number;
  /** Default export format */
  exportFormat: ExportFormat;
  /** Whether to include comments in exports */
  includeComments: boolean;
  /** Whether to use semantic HTML */
  useSemanticHTML: boolean;
}

/**
 * Export format options
 */
export type ExportFormat = 'html' | 'react' | 'zip';

/**
 * Export options
 */
export interface ExportOptions {
  /** Export format */
  format: ExportFormat;
  /** Minify HTML/CSS/JS */
  minify: boolean;
  /** Inline CSS in HTML */
  inlineCSS: boolean;
  /** Include assets (images, fonts) in export */
  includeAssets: boolean;
  /** Add source comments */
  includeComments: boolean;
  /** Generate source map */
  sourceMap: boolean;
}

/**
 * Project state for Zustand store
 */
export interface ProjectState {
  /** Currently loaded project */
  currentProject: Project | null;
  /** List of all saved projects */
  projects: Project[];
  /** Whether project has unsaved changes */
  isDirty: boolean;
  /** Currently saving */
  isSaving: boolean;
  /** Last save timestamp (ISO string) */
  lastSaved: string | null;
  /** Auto-save enabled */
  autoSaveEnabled: boolean;
}

/**
 * Project list item for display
 */
export interface ProjectListItem {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
}

/**
 * Export result
 */
export interface ExportResult {
  /** Exported file/blob */
  blob: Blob;
  /** Suggested filename */
  filename: string;
  /** File MIME type */
  mimeType: string;
  /** Export size in bytes */
  size: number;
}

/**
 * Project validation result
 */
export interface ProjectValidationResult {
  /** Whether project is valid */
  valid: boolean;
  /** Validation errors */
  errors: string[];
  /** Validation warnings */
  warnings: string[];
}

/**
 * Project storage statistics
 */
export interface ProjectStorageStats {
  /** Total projects stored */
  totalProjects: number;
  /** Total storage used in bytes */
  totalSize: number;
  /** Available storage in bytes */
  availableSize: number;
  /** Storage usage percentage */
  usagePercentage: number;
}

/**
 * Project template
 */
export interface ProjectTemplate {
  /** Template identifier */
  id: string;
  /** Template name */
  name: string;
  /** Template description */
  description: string;
  /** Template category */
  category: string;
  /** Preview thumbnail */
  thumbnail?: string;
  /** Initial canvas state */
  canvasState: Partial<CanvasState>;
  /** Initial HTML */
  html: string;
  /** Default settings */
  settings: Partial<ProjectSettings>;
  /** Template tags */
  tags: string[];
}

/**
 * Import result
 */
export interface ImportResult {
  /** Whether import was successful */
  success: boolean;
  /** Imported project (if successful) */
  project?: Project;
  /** Import errors (if failed) */
  errors?: string[];
  /** Import warnings */
  warnings?: string[];
}

/**
 * Storage backend type
 */
export type StorageBackend = 'localStorage' | 'indexedDB';

/**
 * Storage configuration
 */
export interface StorageConfig {
  /** Storage backend to use */
  backend: StorageBackend;
  /** IndexedDB database name */
  databaseName?: string;
  /** IndexedDB store name */
  storeName?: string;
  /** Auto-save debounce milliseconds */
  debounceMs?: number;
}

/**
 * Default project settings
 */
export const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  theme: {
    id: 'default',
    name: 'Default Theme',
    description: 'Default light theme',
    mode: 'light',
    colors: {
      background: '0 0% 100%',
      foreground: '222.2 84% 4.9%',
      primary: '222.2 47.4% 11.2%',
      'primary-foreground': '210 40% 98%',
      secondary: '210 40% 96.1%',
      'secondary-foreground': '222.2 47.4% 11.2%',
      accent: '210 40% 96.1%',
      'accent-foreground': '222.2 47.4% 11.2%',
      muted: '210 40% 96.1%',
      'muted-foreground': '215.4 16.3% 46.9%',
      destructive: '0 84.2% 60.2%',
      'destructive-foreground': '210 40% 98%',
      border: '214.3 31.8% 91.4%',
      input: '214.3 31.8% 91.4%',
      ring: '222.2 84% 4.9%',
    },
  },
  autoSave: true,
  autoSaveInterval: 30000, // 30 seconds
  exportFormat: 'html',
  includeComments: false,
  useSemanticHTML: true,
};

/**
 * Project storage keys
 */
export const PROJECT_STORAGE_KEYS = {
  PROJECTS_LIST: 'visual-builder-projects',
  CURRENT_PROJECT: 'visual-builder-current-project',
  PROJECT_METADATA_PREFIX: 'visual-builder-project-meta-',
} as const;

/**
 * IndexedDB configuration
 */
export const INDEXEDDB_CONFIG = {
  DATABASE_NAME: 'VisualBuilderDB',
  VERSION: 1,
  STORE_NAME: 'projects',
} as const;
