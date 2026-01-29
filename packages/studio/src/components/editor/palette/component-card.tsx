/**
 * ComponentCard
 * Individual component card in the palette
 */

import * as React from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { ComponentTemplate } from '@/types/components';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface ComponentCardProps {
  component: ComponentTemplate;
  viewMode: 'grid' | 'list';
  onSelect: (componentId: string) => void;
  isDraggable?: boolean;
}

const IconMap: Record<string, LucideIcon> = LucideIcons as unknown as Record<string, LucideIcon>;

export const ComponentCard = React.memo(
  ({ component, viewMode, onSelect, isDraggable = true }: ComponentCardProps) => {
    const {
      attributes,
      isDragging,
      listeners,
      setNodeRef,
      transform,
    } = useDraggable({
      id: `palette-${component.id}`,
      data: {
        component,
        type: 'palette',
        source: 'palette',
      },
      disabled: !isDraggable,
    });

    const handleClick = React.useCallback(() => {
      onSelect(component.id);
    }, [component.id, onSelect]);

    const style = transform
      ? {
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        }
      : undefined;

    const IconComponent = IconMap[component.icon] || LucideIcons.Square;

    const cardContent = (
      <div
        ref={isDraggable ? setNodeRef : undefined}
        style={style}
        className={cn(
          'group relative bg-card border border-border rounded-lg transition-all duration-200 min-w-0',
          'hover:border-primary hover:shadow-md',
          viewMode === 'grid'
            ? 'p-4 cursor-grab active:cursor-grabbing'
            : 'p-3 flex items-center gap-3 cursor-grab active:cursor-grabbing',
          isDragging && 'opacity-50 scale-95',
          !isDraggable && 'cursor-pointer'
        )}
        {...(isDraggable ? listeners : {})}
        {...attributes}
        onClick={!isDraggable ? handleClick : undefined}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        role={!isDraggable ? 'button' : undefined}
        tabIndex={!isDraggable ? 0 : undefined}
        aria-label={`Select ${component.name} component`}
      >
        {viewMode === 'grid' ? (
          // Grid View
          <div className="space-y-3">
            {/* Icon */}
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-muted rounded-lg group-hover:bg-primary/10 transition-colors">
              <IconComponent className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>

            {/* Name */}
            <div className="text-center">
              <h4 className="font-semibold text-sm">{component.name}</h4>
            </div>

            {/* Description */}
            <p className="text-xs text-muted-foreground text-center line-clamp-2">
              {component.description}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1 justify-center">
              {component.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs bg-muted rounded-full text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
              {component.tags.length > 3 && (
                <span className="px-2 py-0.5 text-xs bg-muted rounded-full text-muted-foreground">
                  +{component.tags.length - 3}
                </span>
              )}
            </div>

            {/* Drag handle indicator */}
            {isDraggable && (
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="p-1">
                  <LucideIcons.GripVertical className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        ) : (
          // List View
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Icon */}
            <div className="flex-shrink-0 w-10 h-10 bg-muted rounded-lg flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <IconComponent className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate">{component.name}</h4>
              <p className="text-xs text-muted-foreground truncate">{component.description}</p>
            </div>

            {/* Tags */}
            <div className="hidden sm:flex flex-shrink-0 gap-1">
              {component.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs bg-muted rounded-full text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Drag handle */}
            {isDraggable && (
              <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <LucideIcons.GripVertical className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </div>
        )}
      </div>
    );

    return cardContent;
  }
);

ComponentCard.displayName = 'ComponentCard';
