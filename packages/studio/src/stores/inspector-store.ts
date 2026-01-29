/**
 * Inspector Store
 * Zustand store for managing property inspector state
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';

// Enable MapSet plugin for Immer to support Set and Map
enableMapSet();
import type {
  InspectorState,
  PropertyGroup,
  PropertyChange,
  InspectorTab,
} from '@/types/inspector';
import type { CanvasElement } from '@/types/canvas';
import {
  FONT_FAMILIES,
  FONT_SIZES,
  BORDER_STYLES,
  DISPLAY_OPTIONS,
  POSITION_OPTIONS,
  TEXT_ALIGN_OPTIONS,
  TEXT_DECORATION_OPTIONS,
  TEXT_TRANSFORM_OPTIONS,
} from '@/types/inspector';

interface InspectorStore extends InspectorState {
  // Actions
  setSelectedElement: (elementId: string | null, elementData: CanvasElement | null) => void;
  setElementData: (data: CanvasElement | null) => void;
  updateProperty: (groupId: string, fieldId: string, value: unknown) => void;
  resetProperty: (groupId: string, fieldId: string) => void;
  resetGroup: (groupId: string) => void;
  resetAll: () => void;
  toggleGroup: (groupId: string) => void;
  setActiveTab: (tab: InspectorTab) => void;
  applyChanges: () => void;
  discardChanges: () => void;

  // Computed helpers
  getChanges: () => PropertyChange[];
  canApply: () => boolean;
  generateGroups: (element: CanvasElement | null) => PropertyGroup[];
}

const createLayoutGroup = (element: CanvasElement | null): PropertyGroup => ({
  id: 'layout',
  label: 'Layout',
  icon: 'Layout',
  collapsible: true,
  defaultExpanded: true,
  properties: [
    {
      id: 'display',
      label: 'Display',
      type: 'select',
      value: element?.styles?.display || 'block',
      defaultValue: 'block',
      options: DISPLAY_OPTIONS,
      description: 'Controls the display type of the element',
    },
    {
      id: 'width',
      label: 'Width',
      type: 'text',
      value: element?.styles?.width || 'auto',
      defaultValue: 'auto',
      placeholder: 'auto, 100%, 200px',
      description: 'Width of the element',
    },
    {
      id: 'height',
      label: 'Height',
      type: 'text',
      value: element?.styles?.height || 'auto',
      defaultValue: 'auto',
      placeholder: 'auto, 100%, 200px',
      description: 'Height of the element',
    },
    {
      id: 'minWidth',
      label: 'Min Width',
      type: 'text',
      value: element?.styles?.minWidth || '',
      defaultValue: '',
      placeholder: '0, 100px',
    },
    {
      id: 'maxWidth',
      label: 'Max Width',
      type: 'text',
      value: element?.styles?.maxWidth || '',
      defaultValue: '',
      placeholder: 'none, 1200px',
    },
    {
      id: 'minHeight',
      label: 'Min Height',
      type: 'text',
      value: element?.styles?.minHeight || '',
      defaultValue: '',
      placeholder: '0, 100px',
    },
    {
      id: 'maxHeight',
      label: 'Max Height',
      type: 'text',
      value: element?.styles?.maxHeight || '',
      defaultValue: '',
      placeholder: 'none, 800px',
    },
    {
      id: 'position',
      label: 'Position',
      type: 'select',
      value: element?.styles?.position || 'static',
      defaultValue: 'static',
      options: POSITION_OPTIONS,
    },
    {
      id: 'zIndex',
      label: 'Z-Index',
      type: 'number',
      value: element?.styles?.zIndex || 'auto',
      defaultValue: 'auto',
      min: -9999,
      max: 9999,
      description: 'Stacking order of the element',
    },
  ],
});

const createSpacingGroup = (element: CanvasElement | null): PropertyGroup => ({
  id: 'spacing',
  label: 'Spacing',
  icon: 'Spacing',
  collapsible: true,
  defaultExpanded: false,
  properties: [
    {
      id: 'marginTop',
      label: 'Margin Top',
      type: 'text',
      value: element?.styles?.marginTop || '0',
      defaultValue: '0',
      placeholder: '0, 8px, 1rem',
    },
    {
      id: 'marginRight',
      label: 'Margin Right',
      type: 'text',
      value: element?.styles?.marginRight || '0',
      defaultValue: '0',
      placeholder: '0, 8px, 1rem',
    },
    {
      id: 'marginBottom',
      label: 'Margin Bottom',
      type: 'text',
      value: element?.styles?.marginBottom || '0',
      defaultValue: '0',
      placeholder: '0, 8px, 1rem',
    },
    {
      id: 'marginLeft',
      label: 'Margin Left',
      type: 'text',
      value: element?.styles?.marginLeft || '0',
      defaultValue: '0',
      placeholder: '0, 8px, 1rem',
    },
    {
      id: 'paddingTop',
      label: 'Padding Top',
      type: 'text',
      value: element?.styles?.paddingTop || '0',
      defaultValue: '0',
      placeholder: '0, 8px, 1rem',
    },
    {
      id: 'paddingRight',
      label: 'Padding Right',
      type: 'text',
      value: element?.styles?.paddingRight || '0',
      defaultValue: '0',
      placeholder: '0, 8px, 1rem',
    },
    {
      id: 'paddingBottom',
      label: 'Padding Bottom',
      type: 'text',
      value: element?.styles?.paddingBottom || '0',
      defaultValue: '0',
      placeholder: '0, 8px, 1rem',
    },
    {
      id: 'paddingLeft',
      label: 'Padding Left',
      type: 'text',
      value: element?.styles?.paddingLeft || '0',
      defaultValue: '0',
      placeholder: '0, 8px, 1rem',
    },
  ],
});

const createTypographyGroup = (element: CanvasElement | null): PropertyGroup => ({
  id: 'typography',
  label: 'Typography',
  icon: 'Type',
  collapsible: true,
  defaultExpanded: true,
  properties: [
    {
      id: 'fontFamily',
      label: 'Font Family',
      type: 'select',
      value: element?.styles?.fontFamily || 'Inter',
      defaultValue: 'Inter',
      options: FONT_FAMILIES,
    },
    {
      id: 'fontSize',
      label: 'Font Size',
      type: 'select',
      value: element?.styles?.fontSize || '16px',
      defaultValue: '16px',
      options: FONT_SIZES,
    },
    {
      id: 'fontWeight',
      label: 'Font Weight',
      type: 'select',
      value: element?.styles?.fontWeight || '400',
      defaultValue: '400',
      options: [
        { value: '100', label: '100 (Thin)' },
        { value: '200', label: '200 (Extra Light)' },
        { value: '300', label: '300 (Light)' },
        { value: '400', label: '400 (Regular)' },
        { value: '500', label: '500 (Medium)' },
        { value: '600', label: '600 (Semi Bold)' },
        { value: '700', label: '700 (Bold)' },
        { value: '800', label: '800 (Extra Bold)' },
        { value: '900', label: '900 (Black)' },
      ],
    },
    {
      id: 'lineHeight',
      label: 'Line Height',
      type: 'text',
      value: element?.styles?.lineHeight || 'normal',
      defaultValue: 'normal',
      placeholder: 'normal, 1.5, 24px',
    },
    {
      id: 'letterSpacing',
      label: 'Letter Spacing',
      type: 'text',
      value: element?.styles?.letterSpacing || 'normal',
      defaultValue: 'normal',
      placeholder: 'normal, 0.5px, -0.5px',
    },
    {
      id: 'textAlign',
      label: 'Text Align',
      type: 'select',
      value: element?.styles?.textAlign || 'left',
      defaultValue: 'left',
      options: TEXT_ALIGN_OPTIONS,
    },
    {
      id: 'textDecoration',
      label: 'Text Decoration',
      type: 'select',
      value: element?.styles?.textDecoration || 'none',
      defaultValue: 'none',
      options: TEXT_DECORATION_OPTIONS,
    },
    {
      id: 'textTransform',
      label: 'Text Transform',
      type: 'select',
      value: element?.styles?.textTransform || 'none',
      defaultValue: 'none',
      options: TEXT_TRANSFORM_OPTIONS,
    },
    {
      id: 'color',
      label: 'Text Color',
      type: 'color',
      value: element?.styles?.color || '#000000',
      defaultValue: '#000000',
    },
  ],
});

const createAppearanceGroup = (element: CanvasElement | null): PropertyGroup => ({
  id: 'appearance',
  label: 'Appearance',
  icon: 'Palette',
  collapsible: true,
  defaultExpanded: true,
  properties: [
    {
      id: 'backgroundColor',
      label: 'Background Color',
      type: 'color',
      value: element?.styles?.backgroundColor || 'transparent',
      defaultValue: 'transparent',
    },
    {
      id: 'borderWidth',
      label: 'Border Width',
      type: 'text',
      value: element?.styles?.borderWidth || '0',
      defaultValue: '0',
      placeholder: '0, 1px, 2px',
    },
    {
      id: 'borderStyle',
      label: 'Border Style',
      type: 'select',
      value: element?.styles?.borderStyle || 'solid',
      defaultValue: 'solid',
      options: BORDER_STYLES,
    },
    {
      id: 'borderColor',
      label: 'Border Color',
      type: 'color',
      value: element?.styles?.borderColor || '#000000',
      defaultValue: '#000000',
    },
    {
      id: 'borderRadius',
      label: 'Border Radius',
      type: 'text',
      value: element?.styles?.borderRadius || '0',
      defaultValue: '0',
      placeholder: '0, 4px, 50%',
    },
    {
      id: 'boxShadow',
      label: 'Box Shadow',
      type: 'text',
      value: element?.styles?.boxShadow || 'none',
      defaultValue: 'none',
      placeholder: 'none, 0 2px 4px rgba(0,0,0,0.1)',
    },
    {
      id: 'opacity',
      label: 'Opacity',
      type: 'slider',
      value: element?.styles?.opacity || '1',
      defaultValue: '1',
      min: 0,
      max: 1,
      step: 0.01,
    },
  ],
});

const createAttributesGroup = (element: CanvasElement | null): PropertyGroup => ({
  id: 'attributes',
  label: 'Attributes',
  icon: 'Tag',
  collapsible: true,
  defaultExpanded: true,
  properties: [
    {
      id: 'id',
      label: 'ID',
      type: 'text',
      value: element?.attributes?.id || '',
      defaultValue: '',
      placeholder: 'unique-element-id',
      description: 'Unique identifier for the element',
    },
    {
      id: 'className',
      label: 'Class Name',
      type: 'text',
      value: element?.attributes?.class || '',
      defaultValue: '',
      placeholder: 'class-1 class-2',
      description: 'CSS classes separated by spaces',
    },
    {
      id: 'href',
      label: 'Href',
      type: 'text',
      value: element?.attributes?.href || '',
      defaultValue: '',
      placeholder: 'https://example.com',
      description: 'URL for links',
    },
    {
      id: 'src',
      label: 'Src',
      type: 'text',
      value: element?.attributes?.src || '',
      defaultValue: '',
      placeholder: '/image.png',
      description: 'Source URL for images',
    },
    {
      id: 'alt',
      label: 'Alt Text',
      type: 'textarea',
      value: element?.attributes?.alt || '',
      defaultValue: '',
      placeholder: 'Description of the image',
      description: 'Alternative text for accessibility',
    },
  ],
});

const createAccessibilityGroup = (element: CanvasElement | null): PropertyGroup => ({
  id: 'accessibility',
  label: 'Accessibility',
  icon: 'Accessibility',
  collapsible: true,
  defaultExpanded: false,
  properties: [
    {
      id: 'ariaLabel',
      label: 'ARIA Label',
      type: 'text',
      value: element?.attributes?.['aria-label'] || '',
      defaultValue: '',
      placeholder: 'Descriptive label',
      description: 'Accessible label for screen readers',
    },
    {
      id: 'ariaDescription',
      label: 'ARIA Description',
      type: 'textarea',
      value: element?.attributes?.['aria-description'] || '',
      defaultValue: '',
      placeholder: 'Additional description',
      description: 'Extended description for screen readers',
    },
    {
      id: 'role',
      label: 'Role',
      type: 'select',
      value: element?.attributes?.role || '',
      defaultValue: '',
      options: [
        { value: '', label: 'None' },
        { value: 'button', label: 'Button' },
        { value: 'link', label: 'Link' },
        { value: 'navigation', label: 'Navigation' },
        { value: 'main', label: 'Main' },
        { value: 'complementary', label: 'Complementary' },
        { value: 'banner', label: 'Banner' },
        { value: 'contentinfo', label: 'Content Info' },
        { value: 'search', label: 'Search' },
        { value: 'form', label: 'Form' },
        { value: 'article', label: 'Article' },
        { value: 'region', label: 'Region' },
        { value: 'img', label: 'Image' },
        { value: 'dialog', label: 'Dialog' },
        { value: 'alert', label: 'Alert' },
        { value: 'status', label: 'Status' },
      ],
      description: 'ARIA role for the element',
    },
    {
      id: 'tabindex',
      label: 'Tab Index',
      type: 'number',
      value: element?.attributes?.tabindex || '0',
      defaultValue: '0',
      min: -1,
      max: 9999,
      description: 'Tab navigation order (-1 to skip)',
    },
  ],
});

export const useInspectorStore = create<InspectorStore>()(
  immer((set, get) => ({
    // Initial state
    selectedElementId: null,
    elementData: null,
    groups: [],
    expandedGroups: new Set<string>(['layout', 'typography', 'appearance', 'attributes']),
    activeTab: 'styles',
    changes: [],
    hasChanges: false,

    // Actions
    setSelectedElement: (elementId, elementData) =>
      set((state) => {
        state.selectedElementId = elementId;
        state.elementData = elementData;
        state.groups = get().generateGroups(elementData);
        state.changes = [];
        state.hasChanges = false;
        // Reset expanded groups to default
        state.expandedGroups = new Set<string>(['layout', 'typography', 'appearance', 'attributes']);
      }),

    setElementData: (data) =>
      set((state) => {
        state.elementData = data;
        state.groups = get().generateGroups(data);
        state.changes = [];
        state.hasChanges = false;
      }),

    updateProperty: (groupId, fieldId, value) =>
      set((state) => {
        const group = state.groups.find((g) => g.id === groupId);
        if (!group) return;

        const field = group.properties.find((f) => f.id === fieldId);
        if (!field) return;

        const oldValue = field.value;

        // Update field value
        field.value = value;

        // Track change
        const existingChangeIndex = state.changes.findIndex(
          (c) => c.groupId === groupId && c.fieldId === fieldId
        );

        if (existingChangeIndex !== -1) {
          // Update existing change
          state.changes[existingChangeIndex].newValue = value;
        } else {
          // Add new change
          const change: PropertyChange = {
            groupId,
            fieldId,
            property: ['styles', 'attributes'].includes(groupId) ? 'style' : 'attribute',
            propertyKey: fieldId,
            oldValue,
            newValue: value,
          };
          state.changes.push(change);
        }

        state.hasChanges = state.changes.length > 0;
      }),

    resetProperty: (groupId, fieldId) =>
      set((state) => {
        const group = state.groups.find((g) => g.id === groupId);
        if (!group) return;

        const field = group.properties.find((f) => f.id === fieldId);
        if (!field) return;

        const defaultValue = field.defaultValue || '';
        field.value = defaultValue;

        // Remove from changes
        state.changes = state.changes.filter((c) => !(c.groupId === groupId && c.fieldId === fieldId));
        state.hasChanges = state.changes.length > 0;
      }),

    resetGroup: (groupId) =>
      set((state) => {
        const group = state.groups.find((g) => g.id === groupId);
        if (!group) return;

        group.properties.forEach((field) => {
          field.value = field.defaultValue || '';
        });

        // Remove changes for this group
        state.changes = state.changes.filter((c) => c.groupId !== groupId);
        state.hasChanges = state.changes.length > 0;
      }),

    resetAll: () =>
      set((state) => {
        state.groups.forEach((group) => {
          group.properties.forEach((field) => {
            field.value = field.defaultValue || '';
          });
        });
        state.changes = [];
        state.hasChanges = false;
      }),

    toggleGroup: (groupId) =>
      set((state) => {
        if (state.expandedGroups.has(groupId)) {
          state.expandedGroups.delete(groupId);
        } else {
          state.expandedGroups.add(groupId);
        }
      }),

    setActiveTab: (tab) =>
      set((state) => {
        state.activeTab = tab;
      }),

    applyChanges: () =>
      set((state) => {
        // Apply changes to canvas element
        if (!state.elementData) return;

        state.changes.forEach((change) => {
          if (change.property === 'style') {
            if (!state.elementData!.styles) {
              state.elementData!.styles = {};
            }
            state.elementData!.styles[change.propertyKey] = change.newValue as string;
          } else if (change.property === 'attribute') {
            if (!state.elementData!.attributes) {
              state.elementData!.attributes = {};
            }
            state.elementData!.attributes[change.propertyKey] = change.newValue as string;
          }
        });

        state.changes = [];
        state.hasChanges = false;
      }),

    discardChanges: () =>
      set((state) => {
        // Revert all changes
        state.changes.forEach((change) => {
          const group = state.groups.find((g) => g.id === change.groupId);
          if (!group) return;

          const field = group.properties.find((f) => f.id === change.fieldId);
          if (!field) return;

          field.value = change.oldValue;
        });

        state.changes = [];
        state.hasChanges = false;
      }),

    // Computed helpers
    getChanges: () => {
      return get().changes;
    },

    canApply: () => {
      return get().hasChanges;
    },

    generateGroups: (element) => {
      if (!element) return [];

      return [
        createLayoutGroup(element),
        createSpacingGroup(element),
        createTypographyGroup(element),
        createAppearanceGroup(element),
        createAttributesGroup(element),
        createAccessibilityGroup(element),
      ];
    },
  }))
);
