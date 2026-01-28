/**
 * Inspector Types
 * Type definitions for the Property Inspector panel
 */

import type { CanvasElement } from './canvas';

/**
 * Property field types
 */
export type PropertyFieldType =
  | 'text'
  | 'number'
  | 'color'
  | 'select'
  | 'textarea'
  | 'checkbox'
  | 'slider'
  | 'font'
  | 'spacing'
  | 'border';

/**
 * Select option for select-type fields
 */
export interface SelectOption {
  value: string;
  label: string;
  icon?: string;
}

/**
 * Individual property field
 */
export interface PropertyField {
  id: string;
  label: string;
  type: PropertyFieldType;
  value: unknown;
  defaultValue?: unknown;
  options?: SelectOption[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  placeholder?: string;
  validation?: (value: unknown) => string | undefined;
  description?: string;
}

/**
 * Property group
 */
export interface PropertyGroup {
  id: string;
  label: string;
  icon: string;
  properties: PropertyField[];
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

/**
 * Inspector tabs
 */
export type InspectorTab = 'styles' | 'attributes' | 'content' | 'accessibility';

/**
 * Property change for tracking modifications
 */
export interface PropertyChange {
  groupId: string;
  fieldId: string;
  property: 'style' | 'attribute';
  propertyKey: string;
  oldValue: unknown;
  newValue: unknown;
}

/**
 * Spacing value (top, right, bottom, left)
 */
export interface SpacingValue {
  top: string;
  right: string;
  bottom: string;
  left: string;
}

/**
 * Border value
 */
export interface BorderValue {
  width: string;
  style: string;
  color: string;
  radius: string;
}

/**
 * Inspector state
 */
export interface InspectorState {
  selectedElementId: string | null;
  elementData: CanvasElement | null;
  groups: PropertyGroup[];
  expandedGroups: Set<string>;
  activeTab: InspectorTab;
  changes: PropertyChange[];
  hasChanges: boolean;
}

/**
 * Common font families
 */
export const FONT_FAMILIES: SelectOption[] = [
  { value: 'Inter', label: 'Inter' },
  { value: 'system-ui', label: 'System UI' },
  { value: 'sans-serif', label: 'Sans Serif' },
  { value: 'serif', label: 'Serif' },
  { value: 'monospace', label: 'Monospace' },
  { value: 'cursive', label: 'Cursive' },
  { value: 'fantasy', label: 'Fantasy' },
];

/**
 * Common font sizes
 */
export const FONT_SIZES: SelectOption[] = [
  { value: '12px', label: '12px' },
  { value: '14px', label: '14px' },
  { value: '16px', label: '16px' },
  { value: '18px', label: '18px' },
  { value: '20px', label: '20px' },
  { value: '24px', label: '24px' },
  { value: '32px', label: '32px' },
  { value: '48px', label: '48px' },
  { value: '64px', label: '64px' },
];

/**
 * Common border styles
 */
export const BORDER_STYLES: SelectOption[] = [
  { value: 'none', label: 'None' },
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
  { value: 'double', label: 'Double' },
  { value: 'groove', label: 'Groove' },
  { value: 'ridge', label: 'Ridge' },
  { value: 'inset', label: 'Inset' },
  { value: 'outset', label: 'Outset' },
];

/**
 * Display options
 */
export const DISPLAY_OPTIONS: SelectOption[] = [
  { value: 'block', label: 'Block' },
  { value: 'inline', label: 'Inline' },
  { value: 'inline-block', label: 'Inline Block' },
  { value: 'flex', label: 'Flex' },
  { value: 'inline-flex', label: 'Inline Flex' },
  { value: 'grid', label: 'Grid' },
  { value: 'inline-grid', label: 'Inline Grid' },
  { value: 'none', label: 'None' },
];

/**
 * Position options
 */
export const POSITION_OPTIONS: SelectOption[] = [
  { value: 'static', label: 'Static' },
  { value: 'relative', label: 'Relative' },
  { value: 'absolute', label: 'Absolute' },
  { value: 'fixed', label: 'Fixed' },
  { value: 'sticky', label: 'Sticky' },
];

/**
 * Text align options
 */
export const TEXT_ALIGN_OPTIONS: SelectOption[] = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
  { value: 'justify', label: 'Justify' },
];

/**
 * Text decoration options
 */
export const TEXT_DECORATION_OPTIONS: SelectOption[] = [
  { value: 'none', label: 'None' },
  { value: 'underline', label: 'Underline' },
  { value: 'overline', label: 'Overline' },
  { value: 'line-through', label: 'Line Through' },
];

/**
 * Text transform options
 */
export const TEXT_TRANSFORM_OPTIONS: SelectOption[] = [
  { value: 'none', label: 'None' },
  { value: 'uppercase', label: 'Uppercase' },
  { value: 'lowercase', label: 'Lowercase' },
  { value: 'capitalize', label: 'Capitalize' },
];
