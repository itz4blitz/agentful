/**
 * Layout system type definitions for the Visual Website Builder
 */

export interface LayoutState {
  canvasPanel: number;
  componentsPanel: number;
}

export interface LayoutConfig {
  canvasPanel: {
    defaultSize: number;
    minSize: number;
    maxSize?: number;
    collapsible: boolean;
  };
  componentsPanel: {
    defaultSize: number;
    minSize: number;
    maxSize?: number;
    collapsible: boolean;
  };
}

export const DEFAULT_LAYOUT_STATE: LayoutState = {
  canvasPanel: 70,
  componentsPanel: 30,
};

export const LAYOUT_STORAGE_KEY = 'visual-builder-layout';
