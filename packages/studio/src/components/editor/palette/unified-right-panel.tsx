/**
 * UnifiedRightPanel
 * Combines Component Palette and Property Inspector into a single panel with tabs
 * Shows Components when no element is selected, Properties when an element is selected
 */

import * as React from 'react';
import { Boxes, Settings2, ChevronLeft, PanelRightClose, TreePine } from 'lucide-react';
import { useCanvasStore } from '@/stores/canvas-store';
import { useInspectorStore } from '@/stores/inspector-store';
import { useMediaQuery } from '@/hooks/use-media-query';
import { PanelCollapseContext } from '@/components/editor/layout/resizable-layout';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ComponentPalette } from './component-palette';
import { EnhancedPropertyInspector } from '../inspector/enhanced-property-inspector';
import { ElementTree } from '@/components/editor/canvas/element-tree';

export interface UnifiedRightPanelProps {
  className?: string;
}

export const UnifiedRightPanel = React.memo(
  ({ className }: UnifiedRightPanelProps) => {
    const { selectedElement, setSelectedElement: setCanvasSelectedElement } = useCanvasStore();
    const { setSelectedElement } = useInspectorStore();

    // Safely get collapse context (may not exist on mobile)
    const context = React.useContext(PanelCollapseContext);
    const toggleRightPanel = context?.toggleRightPanel;

    // Mobile detection - don't show collapse button on mobile
    const isMobile = useMediaQuery('(max-width: 768px)');

    const [activeTab, setActiveTab] = React.useState<'components' | 'properties' | 'tree'>('components');

    // Switch to properties tab when element is selected
    React.useEffect(() => {
      if (selectedElement?.elementId) {
        if (activeTab === 'components') {
          setActiveTab('properties');
        }
      } else if (activeTab === 'properties') {
        setActiveTab('components');
      }
    }, [selectedElement?.elementId, activeTab]);

    const handleBackToComponents = () => {
      setSelectedElement(null, null);
      setCanvasSelectedElement(null);
      setActiveTab('components');
    };

    return (
      <div
        className={cn('flex flex-col h-full bg-background border-l min-w-0', className)}
        aria-label="Right panel"
      >
        {/* Header with tabs */}
        <div className="flex items-center justify-between p-3 border-b border-border">
          <div className="flex items-center gap-2">
            {activeTab === 'tree' ? (
              <>
                <TreePine className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-semibold text-sm">DOM Tree</h2>
              </>
            ) : selectedElement?.elementId && activeTab === 'properties' ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleBackToComponents}
                  aria-label="Back to components"
                  title="Back to components"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Settings2 className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-semibold text-sm">Properties</h2>
              </>
            ) : (
              <>
                <Boxes className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-semibold text-sm">Components</h2>
              </>
            )}
          </div>

          {toggleRightPanel && !isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={toggleRightPanel}
              aria-label="Collapse panel"
              title="Collapse panel"
            >
              <PanelRightClose className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="px-3 pt-3">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="components" className="text-xs">
                <Boxes className="h-3.5 w-3.5 mr-1.5" />
                Components
              </TabsTrigger>
              <TabsTrigger value="properties" className="text-xs">
                <Settings2 className="h-3.5 w-3.5 mr-1.5" />
                Properties
              </TabsTrigger>
              <TabsTrigger value="tree" className="text-xs">
                <TreePine className="h-3.5 w-3.5 mr-1.5" />
                Tree
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {activeTab === 'components' || !selectedElement?.elementId ? (
            <div className={cn('h-full', activeTab === 'properties' && 'hidden')}>
              <ComponentPalette />
            </div>
          ) : null}
          
          {activeTab === 'properties' && (
            <div className="h-full">
              {selectedElement?.elementId ? (
                <EnhancedPropertyInspector />
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <Settings2 className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-sm font-medium mb-2">No Element Selected</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Click on an element in the canvas or DOM tree to edit its properties
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActiveTab('components')}
                  >
                    <Boxes className="h-3.5 w-3.5 mr-1.5" />
                    Browse Components
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tree' && (
            <div className="h-full">
              <ElementTree />
            </div>
          )}
        </div>
      </div>
    );
  }
);

UnifiedRightPanel.displayName = 'UnifiedRightPanel';
