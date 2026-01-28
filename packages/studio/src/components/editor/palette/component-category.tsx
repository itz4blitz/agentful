/**
 * ComponentCategory
 * Collapsible category section in the palette
 */

import * as React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { ComponentCategory as ComponentCategoryType, ComponentTemplate } from '@/types/components';
import { CATEGORY_INFO } from '@/types/components';
import { cn } from '@/lib/utils';
import { ComponentCard } from './component-card';

export interface ComponentCategoryProps {
  category: ComponentCategoryType;
  components: ComponentTemplate[];
  isExpanded: boolean;
  onToggle: () => void;
  onComponentSelect: (componentId: string) => void;
  viewMode: 'grid' | 'list';
}

export const ComponentCategory = React.memo(
  ({
    category,
    components,
    isExpanded,
    onToggle,
    onComponentSelect,
    viewMode,
  }: ComponentCategoryProps) => {
    const categoryInfo = CATEGORY_INFO[category];

    if (components.length === 0) {
      return null;
    }

    return (
      <div className="border-b border-border last:border-b-0">
        {/* Category Header */}
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            'w-full flex items-center gap-2 px-4 py-3 text-left',
            'hover:bg-muted/50 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary'
          )}
          aria-expanded={isExpanded}
          aria-controls={`${category}-panel`}
        >
          <span className="flex-shrink-0">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </span>
          <span className="font-semibold text-sm">{categoryInfo.label}</span>
          <span className="text-xs text-muted-foreground">({components.length})</span>
        </button>

        {/* Category Content */}
        {isExpanded && (
          <div
            id={`${category}-panel`}
            className={cn(
              'px-4 pb-4',
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 gap-3'
                : 'flex flex-col gap-2'
            )}
            role="region"
            aria-label={`${categoryInfo.label} components`}
          >
            {components.map((component) => (
              <ComponentCard
                key={component.id}
                component={component}
                viewMode={viewMode}
                onSelect={onComponentSelect}
                isDraggable={true}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
);

ComponentCategory.displayName = 'ComponentCategory';
