/**
 * Canvas Types
 * Type definitions for the Canvas Editor
 */

/**
 * Represents an element in the canvas DOM tree
 */
export interface CanvasElement {
  id: string;
  tagName: string;
  attributes: Record<string, string>;
  styles: Record<string, string>;
  children: CanvasElement[];
  content?: string;
  parentId?: string;
  locked?: boolean;
  hidden?: boolean;
  zIndex?: number;
}

/**
 * Represents a selected element in the canvas
 */
export interface CanvasSelection {
  elementId: string;
  element: CanvasElement;
  path: string[];
}

/**
 * Represents a change to an element for undo/redo
 */
export interface ElementChange {
  type: 'attribute' | 'style' | 'content' | 'structure';
  elementId: string;
  property?: string;
  oldValue?: unknown;
  newValue?: unknown;
  timestamp: Date;
}

/**
 * Represents a context menu action
 */
export type ContextMenuAction =
  | 'edit'
  | 'duplicate'
  | 'delete'
  | 'copy'
  | 'paste'
  | 'wrap'
  | 'unwrap'
  | 'move-up'
  | 'move-down';

/**
 * Canvas state
 */
export interface CanvasState {
  elements: CanvasElement[];
  selectedElement: CanvasSelection | null;
  hoveredElement: string | null;
  html: string;
  isDirty: boolean;
  history: ElementChange[];
  historyIndex: number;
  clipboard: CanvasElement | null;
}

/**
 * Default canvas state
 */
export const DEFAULT_CANVAS_STATE: CanvasState = {
  elements: [],
  selectedElement: null,
  hoveredElement: null,
  html: '',
  isDirty: false,
  history: [],
  historyIndex: -1,
  clipboard: null,
};

/**
 * PostMessage types for iframe communication
 */
export interface CanvasPostMessage {
  type:
    | 'select-element'
    | 'hover-element'
    | 'update-element'
    | 'get-element'
    | 'init-canvas';
  payload?: unknown;
}

/**
 * Element position for overlay
 */
export interface ElementPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * Canvas settings
 */
export interface CanvasSettings {
  enableSelection: boolean;
  enableHover: boolean;
  showOverlay: boolean;
  gridEnabled: boolean;
  gridSize: number;
}
