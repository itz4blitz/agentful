/**
 * PropertyGroup
 * Collapsible property group component
 */

import * as React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { PropertyGroup as PropertyGroupType } from '@/types/inspector';
import * as icons from 'lucide-react';
import { PropertyField } from './property-field';
import { useInspectorStore } from '@/stores/inspector-store';

export interface PropertyGroupProps {
  group: PropertyGroupType;
}

// Map icon names to Lucide icons
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Layout: icons.Layout,
  Spacing: icons.Square,
  Type: icons.Type,
  Palette: icons.Palette,
  Tag: icons.Tag,
  Accessibility: iconsAccessibility,
};

function iconsAccessibility(props: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="16" cy="4" r="2" />
      <path d="m22 10-4.5 4.5" />
      <path d="m7 11-5.5 5.5" />
      <path d="M12 20a9 9 0 0 1-9-9 9 9 0 0 1 6-2.3L10 21" />
      <path d="m22 16-4.5-4.5" />
      <path d="m7 11-5.5-5.5" />
    </svg>
  );
}

export const PropertyGroup = React.memo(({ group }: PropertyGroupProps) => {
  const { expandedGroups, toggleGroup, changes, updateProperty, resetProperty } =
    useInspectorStore();

  const isExpanded = expandedGroups.has(group.id);

  const handleToggle = React.useCallback(() => {
    toggleGroup(group.id);
  }, [group.id, toggleGroup]);

  const handleFieldChange = React.useCallback(
    (fieldId: string, value: unknown) => {
      updateProperty(group.id, fieldId, value);
    },
    [group.id, updateProperty]
  );

  const handleFieldReset = React.useCallback(
    (fieldId: string) => {
      resetProperty(group.id, fieldId);
    },
    [group.id, resetProperty]
  );

  const IconComponent = ICON_MAP[group.icon] || icons.Settings;

  // Count changed fields in this group
  const changedFieldsCount = React.useMemo(() => {
    return changes.filter((c) => c.groupId === group.id).length;
  }, [changes, group.id]);

  if (group.collapsible && !isExpanded) {
    return (
      <div className="border-b border-border">
        <button
          type="button"
          onClick={handleToggle}
          className="w-full flex items-center gap-2 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
          aria-expanded={isExpanded}
        >
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <IconComponent className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm flex-1">{group.label}</span>
          {changedFieldsCount > 0 && (
            <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {changedFieldsCount} changed
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="border-b border-border">
      {group.collapsible ? (
        <button
          type="button"
          onClick={handleToggle}
          className="w-full flex items-center gap-2 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
          aria-expanded={isExpanded}
        >
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
          <IconComponent className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm flex-1">{group.label}</span>
          {changedFieldsCount > 0 && (
            <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {changedFieldsCount} changed
            </span>
          )}
        </button>
      ) : (
        <div className="flex items-center gap-2 px-4 py-3">
          <IconComponent className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">{group.label}</span>
        </div>
      )}

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {group.properties.map((field) => {
            const hasChange = changes.some(
              (c) => c.groupId === group.id && c.fieldId === field.id
            );

            return (
              <PropertyField
                key={field.id}
                field={field}
                value={field.value}
                onChange={(value) => handleFieldChange(field.id, value)}
                onReset={() => handleFieldReset(field.id)}
                hasChange={hasChange}
              />
            );
          })}
        </div>
      )}
    </div>
  );
});

PropertyGroup.displayName = 'PropertyGroup';
