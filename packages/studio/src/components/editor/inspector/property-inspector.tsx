/**
 * PropertyInspector
 * Main property inspector panel for editing element properties
 */

import * as React from 'react';
import {
  Settings2,
  X,
  Check,
  RotateCcw,
  Trash2,
  Palette,
  Tag,
  FileText,
  Accessibility,
} from 'lucide-react';
import { useInspectorStore } from '@/stores/inspector-store';
import { useCanvasStore } from '@/stores/canvas-store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { PropertyGroup } from './property-group';
import type { InspectorTab } from '@/types/inspector';
import type { CanvasElement } from '@/types/canvas';

export interface PropertyInspectorProps {
  className?: string;
}

export const PropertyInspector = React.memo(
  ({ className }: PropertyInspectorProps) => {
    const {
      selectedElementId,
      elementData,
      groups,
      activeTab,
      hasChanges,
      setActiveTab,
      applyChanges,
      discardChanges,
      resetAll,
      setSelectedElement,
    } = useInspectorStore();

    const { updateElement } = useCanvasStore();

    const handleApplyChanges = React.useCallback(() => {
      if (!elementData) return;

      // Apply changes to canvas store
      const updates: Record<string, Record<string, unknown>> = {};

      const styleGroupIds = new Set(['layout', 'spacing', 'typography', 'appearance']);
      const attributeGroupIds = new Set(['attributes', 'accessibility']);

      groups.forEach((group) => {
        group.properties.forEach((field) => {
          if (styleGroupIds.has(group.id)) {
            if (!updates.styles) {
              updates.styles = {};
            }
            updates.styles[field.id] = field.value;
          } else if (attributeGroupIds.has(group.id)) {
            if (!updates.attributes) {
              updates.attributes = {};
            }
            // Map field id to attribute name
            const attrName =
              field.id === 'className' ? 'class' :
              field.id === 'ariaLabel' ? 'aria-label' :
              field.id === 'ariaDescription' ? 'aria-description' :
              field.id;
            updates.attributes[attrName] = field.value;
          }
        });
      });

      // Update element in canvas store
      updateElement(selectedElementId!, updates as unknown as Parameters<typeof updateElement>[1], true);
      window.dispatchEvent(
        new CustomEvent('canvas-update-element', {
          detail: {
            elementId: selectedElementId,
            updates: updates as unknown as Partial<CanvasElement>,
          },
        })
      );

      // Clear changes in inspector store
      applyChanges();
    }, [elementData, groups, selectedElementId, updateElement, applyChanges]);

    const handleDiscardChanges = React.useCallback(() => {
      discardChanges();
    }, [discardChanges]);

    const handleResetAll = React.useCallback(() => {
      resetAll();
    }, [resetAll]);

    const handleTabChange = React.useCallback(
      (tab: string) => {
        setActiveTab(tab as InspectorTab);
      },
      [setActiveTab]
    );

    const tabGroupMap = React.useMemo<Record<InspectorTab, string[]>>(
      () => ({
        styles: ['layout', 'spacing', 'typography', 'appearance'],
        attributes: ['attributes'],
        content: [], // Future: content editing
        accessibility: ['accessibility'],
      }),
      []
    );

    const renderTabContent = React.useCallback(
      (tab: InspectorTab) => {
        const groupIds = tabGroupMap[tab] ?? [];
        const tabGroups = groups.filter((group) => groupIds.includes(group.id));

        return (
          <ScrollArea className="h-full">
            <div className="py-2">
              {tabGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    {tab === 'content'
                      ? 'Content editing coming soon'
                      : 'No properties available for this tab'}
                  </p>
                </div>
              ) : (
                tabGroups.map((group) => <PropertyGroup key={group.id} group={group} />)
              )}
            </div>
          </ScrollArea>
        );
      },
      [groups, tabGroupMap]
    );

    // Empty state
    if (!selectedElementId || !elementData) {
      return (
        <div
          className={cn('flex flex-col h-full min-h-0 bg-background', className)}
          aria-label="Property inspector"
        >
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Settings2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-sm mb-1">No element selected</h3>
            <p className="text-xs text-muted-foreground max-w-[200px]">
              Select an element in the canvas to view and edit its properties
            </p>
          </div>
        </div>
      );
    }

    return (
      <div
        className={cn('flex flex-col h-full min-h-0 bg-background', className)}
        aria-label="Property inspector"
      >
        {/* Element info */}
        <div className="px-3 py-2 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                {elementData.tagName}
              </code>
              {elementData.attributes?.id && (
                <>
                  <span className="text-xs text-muted-foreground">#</span>
                  <code className="text-xs font-mono text-muted-foreground">
                    {elementData.attributes.id}
                  </code>
                </>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setSelectedElement(null, null)}
              aria-label="Deselect element"
              title="Deselect element"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          {elementData.attributes?.class && (
            <div className="mt-1 flex items-center gap-1">
              <span className="text-xs text-muted-foreground">.</span>
              <code className="text-xs font-mono text-muted-foreground truncate max-w-[200px]">
                {elementData.attributes.class}
              </code>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col min-h-0">
          <div className="px-3 pt-3">
            <TabsList className="grid w-full grid-cols-4 h-8">
              <TabsTrigger value="styles" className="text-xs h-7">
                <Palette className="h-3.5 w-3.5 mr-1" />
                Styles
              </TabsTrigger>
              <TabsTrigger value="attributes" className="text-xs h-7">
                <Tag className="h-3.5 w-3.5 mr-1" />
                Attrs
              </TabsTrigger>
              <TabsTrigger value="content" className="text-xs h-7" disabled>
                <FileText className="h-3.5 w-3.5 mr-1" />
                Content
              </TabsTrigger>
              <TabsTrigger value="accessibility" className="text-xs h-7">
                <Accessibility className="h-3.5 w-3.5 mr-1" />
                A11y
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="styles" className="flex-1 min-h-0 mt-0">
            {renderTabContent('styles')}
          </TabsContent>
          <TabsContent value="attributes" className="flex-1 min-h-0 mt-0">
            {renderTabContent('attributes')}
          </TabsContent>
          <TabsContent value="content" className="flex-1 min-h-0 mt-0">
            {renderTabContent('content')}
          </TabsContent>
          <TabsContent value="accessibility" className="flex-1 min-h-0 mt-0">
            {renderTabContent('accessibility')}
          </TabsContent>
        </Tabs>

        {/* Footer with actions */}
        {hasChanges && (
          <>
            <Separator />
            <div className="flex items-center justify-between p-3 gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDiscardChanges}
                  className="gap-1.5 text-xs h-7"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Discard
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetAll}
                  className="gap-1.5 text-xs h-7"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Reset
                </Button>
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={handleApplyChanges}
                className="gap-1.5 text-xs h-7"
              >
                <Check className="h-3.5 w-3.5" />
                Apply
              </Button>
            </div>
          </>
        )}
      </div>
    );
  }
);

PropertyInspector.displayName = 'PropertyInspector';
