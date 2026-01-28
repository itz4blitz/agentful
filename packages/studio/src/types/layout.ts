/**
 * Layout system type definitions for the Visual Website Builder
 */

export interface LayoutState {
  chatPanel: number;
  canvasPanel: number;
  componentsPanel: number;
}

export interface LayoutConfig {
  chatPanel: {
    defaultSize: number;
    minSize: number;
    maxSize?: number;
    collapsible: boolean;
  };
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
  chatPanel: 20,
  canvasPanel: 60,
  componentsPanel: 20,
};

export const LAYOUT_STORAGE_KEY = 'visual-builder-layout';
