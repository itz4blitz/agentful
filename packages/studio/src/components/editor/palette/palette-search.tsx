/**
 * PaletteSearch
 * Search and filter components in the palette
 */

import * as React from 'react';
import { Search, X, Tag, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  CommandPopover,
  CommandPopoverTrigger,
  CommandPopoverContent,
} from '@/components/ui/command-popover';

export interface PaletteSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  allTags: string[];
}

export const PaletteSearch = React.memo(
  ({ query, onQueryChange, selectedTags, onTagsChange, allTags }: PaletteSearchProps) => {
    const [isCommandOpen, setIsCommandOpen] = React.useState(false);
    const [localQuery, setLocalQuery] = React.useState(query);

    // Debounced search
    React.useEffect(() => {
      const timer = setTimeout(() => {
        onQueryChange(localQuery);
      }, 300);
      return () => clearTimeout(timer);
    }, [localQuery, onQueryChange]);

    const handleClear = React.useCallback(() => {
      setLocalQuery('');
      onQueryChange('');
    }, [onQueryChange]);

    const handleRemoveTag = React.useCallback(
      (tagToRemove: string) => {
        onTagsChange(selectedTags.filter((tag) => tag !== tagToRemove));
      },
      [selectedTags, onTagsChange]
    );

    const handleAddTag = React.useCallback(
      (tagToAdd: string) => {
        if (!selectedTags.includes(tagToAdd)) {
          onTagsChange([...selectedTags, tagToAdd]);
        }
        setIsCommandOpen(false);
      },
      [selectedTags, onTagsChange]
    );

    const availableTags = React.useMemo(
      () => allTags.filter((tag) => !selectedTags.includes(tag)),
      [allTags, selectedTags]
    );

    const hasActiveFilters = query.length > 0 || selectedTags.length > 0;

    return (
      <div className="p-4 border-b border-border space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search components..."
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            className="pl-9 pr-9"
            aria-label="Search components"
          />
          {localQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={handleClear}
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Tag Filter */}
        <div className="space-y-2">
          {/* Selected Tags */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="gap-1 pr-1"
                  aria-label={`Remove ${tag} filter`}
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => {
                    setLocalQuery('');
                    onQueryChange('');
                    onTagsChange([]);
                  }}
                >
                  Clear all
                </Button>
              )}
            </div>
          )}

          {/* Add Tag Button */}
          <CommandPopover open={isCommandOpen} onOpenChange={setIsCommandOpen}>
            <CommandPopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-left"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add tag filter
              </Button>
            </CommandPopoverTrigger>
            <CommandPopoverContent className="p-0">
              <Command>
                <CommandInput placeholder="Search tags..." />
                <CommandList>
                  <CommandGroup>
                    {availableTags.map((tag) => (
                      <CommandItem
                        key={tag}
                        value={tag}
                        onSelect={() => handleAddTag(tag)}
                      >
                        <Tag className="w-4 h-4 mr-2" />
                        {tag}
                      </CommandItem>
                    ))}
                    {availableTags.length === 0 && (
                      <CommandItem disabled>No tags available</CommandItem>
                    )}
                  </CommandGroup>
                </CommandList>
              </Command>
            </CommandPopoverContent>
          </CommandPopover>
        </div>

        {/* Active Filter Count */}
        {hasActiveFilters && (
          <div className="text-xs text-muted-foreground">
            {query.length > 0 && (
              <span>Search: &quot;{query}&quot; </span>
            )}
            {selectedTags.length > 0 && (
              <span>
                {query.length > 0 && '• '}
                Tags: {selectedTags.length}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);

PaletteSearch.displayName = 'PaletteSearch';
