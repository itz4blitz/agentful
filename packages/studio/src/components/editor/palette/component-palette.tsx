/**
 * ComponentPalette
 * Main component palette with categories and search
 */

import * as React from 'react';
import { Grid3x3, List, Minus, Plus } from 'lucide-react';
import { usePaletteStore } from '@/stores/palette-store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PaletteSearch } from './palette-search';
import { ComponentCategory } from './component-category';
import type { ComponentCategory as ComponentCategoryType } from '@/types/components';
import { CATEGORY_INFO } from '@/types/components';

export interface ComponentPaletteProps {
  onComponentSelect?: (componentId: string) => void;
  className?: string;
}

export const ComponentPalette = React.memo(
  ({ onComponentSelect, className }: ComponentPaletteProps) => {
    const {
      expandedCategories,
      searchQuery,
      selectedTags,
      viewMode,
      toggleCategory,
      expandAllCategories,
      collapseAllCategories,
      setSelectedComponent,
      setSearchQuery,
      setSelectedTags,
      setViewMode,
      getFilteredComponents,
      getAllTags,
      getComponentsByCategory,
    } = usePaletteStore();

    const forcedListRef = React.useRef(false);

    React.useEffect(() => {
      const handleResize = () => {
        if (window.innerWidth < 768 && viewMode === 'grid') {
          forcedListRef.current = true;
          setViewMode('list');
        } else if (window.innerWidth >= 768 && forcedListRef.current) {
          forcedListRef.current = false;
          setViewMode('grid');
        }
      };

      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, [setViewMode, viewMode]);

    const allTags = React.useMemo(() => getAllTags(), [getAllTags]);

    const filteredComponents = React.useMemo(
      () => getFilteredComponents(),
      [getFilteredComponents]
    );

    // Group components by category
    const componentsByCategory = React.useMemo(() => {
      const grouped: Record<ComponentCategoryType, ReturnType<typeof getComponentsByCategory>> =
        {} as Record<ComponentCategoryType, ReturnType<typeof getComponentsByCategory>>;

      (Object.keys(CATEGORY_INFO) as ComponentCategoryType[]).forEach((category) => {
        grouped[category] = getComponentsByCategory(category);
      });

      return grouped;
    }, [getComponentsByCategory]);

    const handleComponentSelect = React.useCallback(
      (componentId: string) => {
        setSelectedComponent(componentId);
        onComponentSelect?.(componentId);
      },
      [setSelectedComponent, onComponentSelect]
    );

    const isEmpty = filteredComponents.length === 0;

    return (
      <div
        className={cn('flex flex-col h-full bg-background', className)}
        aria-label="Component palette"
      >
        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border flex-wrap gap-2">
          <div className="flex items-center gap-1">
            {/* Expand/Collapse All */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={expandAllCategories}
              aria-label="Expand all categories"
              title="Expand all"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={collapseAllCategories}
              aria-label="Collapse all categories"
              title="Collapse all"
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              title="Grid view"
            >
              <Grid3x3 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMode('list')}
              aria-label="List view"
              title="List view"
            >
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <PaletteSearch
          query={searchQuery}
          onQueryChange={setSearchQuery}
          selectedTags={selectedTags}
          onTagsChange={setSelectedTags}
          allTags={allTags}
        />

        {/* Component List */}
        <ScrollArea className="flex-1">
          <div className="py-2">
            {isEmpty ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">
                  No components found
                </p>
                <p className="text-xs text-muted-foreground">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              (Object.keys(CATEGORY_INFO) as ComponentCategoryType[]).map(
                (category) => {
                  const categoryComponents = componentsByCategory[category];

                  if (categoryComponents.length === 0) {
                    return null;
                  }

                  return (
                    <ComponentCategory
                      key={category}
                      category={category}
                      components={categoryComponents}
                      isExpanded={expandedCategories.includes(category)}
                      onToggle={() => toggleCategory(category)}
                      onComponentSelect={handleComponentSelect}
                      viewMode={viewMode}
                    />
                  );
                }
              )
            )}
          </div>
        </ScrollArea>

        {/* Footer with component count */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-border text-xs text-muted-foreground">
          <span>
            {filteredComponents.length} of {usePaletteStore.getState().components.length} components
          </span>
          {searchQuery && (
            <span>Active search</span>
          )}
          {selectedTags.length > 0 && (
            <span>{selectedTags.length} tag{selectedTags.length > 1 ? 's' : ''}</span>
          )}
        </div>
      </div>
    );
  }
);

ComponentPalette.displayName = 'ComponentPalette';
