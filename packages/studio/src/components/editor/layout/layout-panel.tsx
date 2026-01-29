/**
 * LayoutPanel
 * Wrapper for react-resizable-panels ResizablePanel
 *
 * This component wraps ResizablePanel and adds collapse/expand functionality.
 * It integrates with react-resizable-panels' imperative API to properly manage collapse state.
 */

import * as React from 'react';
import { ResizablePanel } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PanelImperativeHandle } from 'react-resizable-panels';

export interface LayoutPanelProps extends Omit<React.ComponentProps<typeof ResizablePanel>, 'panelRef' | 'onResize'> {
  panelId: 'chat' | 'canvas' | 'components';
  onResize?: (size: number, id: string | number | undefined) => void;
}

export const LayoutPanel = React.forwardRef<HTMLDivElement, LayoutPanelProps>(
  ({ panelId, defaultSize, minSize, maxSize, collapsible, className, children, id, onResize: onResizeProp, ...props }, ref) => {
    const panelRef = React.useRef<PanelImperativeHandle | null>(null);
    const [isHovered, setIsHovered] = React.useState(false);
    const [isCollapsed, setIsCollapsed] = React.useState(false);

    // Sync collapse state with react-resizable-panels using onResize callback
    const handleResize = React.useCallback((size: number) => {
      // Panel is collapsed if size is at or below collapsedSize (0)
      setIsCollapsed(size <= 0.1);

      // Call user's onResize callback if provided
      onResizeProp?.(size, id || panelId);
    }, [onResizeProp, id, panelId]);

    const handleToggleCollapse = React.useCallback(() => {
      if (!panelRef.current) return;

      if (isCollapsed) {
        panelRef.current.expand();
      } else {
        panelRef.current.collapse();
      }
    }, [isCollapsed]);

    return (
      <ResizablePanel
        ref={ref}
        id={id || panelId}
        defaultSize={defaultSize}
        minSize={minSize}
        maxSize={maxSize}
        collapsible={collapsible}
        collapsedSize={0}
        panelRef={panelRef}
        onResize={handleResize}
        className={cn('relative overflow-hidden', className)}
        aria-label={`${panelId} panel`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...props}
      >
        {/* Collapse button (shown on hover when not collapsed) */}
        {collapsible && isHovered && !isCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'absolute top-2 z-10 h-6 w-6 transition-opacity',
              panelId === 'chat' ? 'left-2' : 'right-2',
              isHovered ? 'opacity-100' : 'opacity-0'
            )}
            onClick={handleToggleCollapse}
            aria-label={`Collapse ${panelId} panel`}
          >
            {panelId === 'chat' ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )}

        {/* Panel content - always render, let react-resizable-panels manage visibility */}
        <div className="h-full overflow-auto">
          {children}
        </div>

        {/* Expand button - shown when collapsed */}
        {collapsible && isCollapsed && (
          <div
            className={cn(
              'absolute top-2 z-20',
              panelId === 'chat' ? 'left-0' : 'right-0'
            )}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 bg-background border shadow-sm"
              onClick={handleToggleCollapse}
              aria-label={`Expand ${panelId} panel`}
              title={`Expand ${panelId} panel`}
            >
              {panelId === 'chat' ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </ResizablePanel>
    );
  }
);

LayoutPanel.displayName = 'LayoutPanel';
