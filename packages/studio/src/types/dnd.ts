/**
 * Drag and Drop Types
 * Type definitions for the DnD system
 */

import type { ComponentTemplate } from './components';
import type { CanvasElement } from './canvas';

/**
 * Drag operation types
 */
export type DragType = 'palette' | 'canvas' | 'reorder';

/**
 * Source of drag operation
 */
export type DragSource = 'palette' | 'canvas' | 'components';

/**
 * Drop position relative to target
 */
export type DropPosition = 'before' | 'after' | 'inside';

/**
 * Drag data transferred during drag operation
 */
export interface DragData {
  type: DragType;
  source: DragSource;
  componentId?: string;
  component?: ComponentTemplate;
  elementId?: string;
  element?: CanvasElement;
  html?: string;
  react?: string;
}

/**
 * Drop target information
 */
export interface DropTarget {
  targetId: string;
  position: DropPosition;
  index: number;
  parentId?: string;
}

/**
 * Drag and drop event types
 */
export type DndEventType = 'dragstart' | 'dragend' | 'dragover' | 'drop' | 'dragcancel';

/**
 * DnD event payload
 */
export interface DndEvent {
  type: DndEventType;
  dragData: DragData;
  dropTarget?: DropTarget;
  timestamp: Date;
}

/**
 * Drag and drop state
 */
export interface DndState {
  isDragging: boolean;
  activeId: string | null;
  overId: string | null;
  dragData: DragData | null;
  dropTarget: DropTarget | null;
  draggedElement: HTMLElement | null;
  pointerCoordinates: { x: number; y: number } | null;
}

/**
 * Default DnD state
 */
export const DEFAULT_DND_STATE: DndState = {
  isDragging: false,
  activeId: null,
  overId: null,
  dragData: null,
  dropTarget: null,
  draggedElement: null,
  pointerCoordinates: null,
};

/**
 * Sensor configuration
 */
export interface SensorConfig {
  activationConstraint?: {
    distance?: number;
    delay?: number;
    tolerance?: number;
  };
}

/**
 * Collision detection options
 */
export interface CollisionDetectionOptions {
  pointerWithin?: boolean;
  distanceThreshold?: number;
}

/**
 * Drop zone configuration
 */
export interface DropZoneConfig {
  id: string;
  accepts?: string[];
  disabled?: boolean;
}

/**
 * Drag overlay appearance
 */
export interface DragOverlayAppearance {
  opacity?: number;
  scale?: number;
  zIndex?: number;
  className?: string;
}

/**
 * Drop indicator style
 */
export interface DropIndicatorStyle {
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  offset: number;
  color: string;
  width: number;
}
