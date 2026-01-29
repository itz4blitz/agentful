/**
 * ResizableLayout
 * Main 2-panel layout for the Visual Website Builder
 * Canvas Panel (75%) | Properties/Components Panel (25%)
 * Sidebar can be positioned on left or right side
 *
 * Uses react-resizable-panels for resizing functionality.
 */

import * as React from 'react';
import {
  type PanelImperativeHandle,
} from 'react-resizable-panels';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layout, Boxes } from 'lucide-react';

export type SidebarPosition = 'left' | 'right';

export interface ResizableLayoutProps {
  canvasPanel?: React.ReactNode;
  rightPanel?: React.ReactNode;
  sidebarPosition?: SidebarPosition;
  className?: string;
}

export interface ResizableLayoutHandle {
  toggleRightPanel: () => void;
}

const LAYOUT_STORAGE_KEY = 'visual-builder-layout-v4';
const LOCAL_STORAGE_KEY = `react-resizable-panels:${LAYOUT_STORAGE_KEY}`;

// Default panel sizes (percentages) - must add up to 100
const DEFAULT_SIZES = [75, 25] as const;

// Context for panel collapse/expand functionality
interface PanelContextType {
  rightPanelRef: React.RefObject<PanelImperativeHandle | null>;
  toggleRightPanel: () => void;
}

export const PanelCollapseContext = React.createContext<PanelContextType | null>(null);

export const usePanelCollapse = () => {
  const context = React.useContext(PanelCollapseContext);
  if (!context) {
    throw new Error('usePanelCollapse must be used within ResizableLayout');
  }
  return context;
};

export const ResizableLayout = React.forwardRef<ResizableLayoutHandle, ResizableLayoutProps>(
  ({ canvasPanel, rightPanel, sidebarPosition = 'right', className }, ref) => {
    // Panel refs for imperative control
    const sidebarPanelRef = React.useRef<PanelImperativeHandle>(null);
    const [isDragging, setIsDragging] = React.useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

    // Force clear localStorage on first load to fix corrupted layouts
    React.useEffect(() => {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          // Check if layout is corrupted (wrong number of panels or invalid sizes)
          // Now using 2 panels
          const isCorrupted =
            !Array.isArray(parsed) ||
            parsed.length !== 2 ||
            parsed.some((size: unknown) => typeof size !== 'number' || size < 5 || size > 90);
          if (isCorrupted) {
            console.log('[Layout] Clearing corrupted layout from localStorage');
            localStorage.removeItem(LOCAL_STORAGE_KEY);
          }
        }
      } catch {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    }, []);

    // Mobile detection
    const [isMobile, setIsMobile] = React.useState(false);

    React.useEffect(() => {
      const checkMobile = () => setIsMobile(window.innerWidth < 768);
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Toggle functions
    const toggleRightPanel = React.useCallback(() => {
      const panel = sidebarPanelRef.current;
      if (panel) {
        if (panel.isCollapsed()) {
          panel.expand();
          setIsSidebarCollapsed(false);
        } else {
          panel.collapse();
          setIsSidebarCollapsed(true);
        }
      }
    }, []);

    React.useImperativeHandle(ref, () => ({
      toggleRightPanel,
    }));

    const contextValue = React.useMemo(
      () => ({
        rightPanelRef: sidebarPanelRef,
        toggleRightPanel,
      }),
      [toggleRightPanel]
    );

    // On mobile, use tabs instead of resizable panels
    if (isMobile) {
      return (
        <div className={cn('h-[calc(100vh-3.5rem)] w-full overflow-hidden', className)}>
          <Tabs defaultValue="canvas" className="h-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="canvas" className="flex items-center gap-1 px-1">
                <Layout className="h-4 w-4" />
                <span className="hidden sm:inline text-xs">Canvas</span>
              </TabsTrigger>
              <TabsTrigger value="right" className="flex items-center gap-1 px-1">
                <Boxes className="h-4 w-4" />
                <span className="hidden sm:inline text-xs">Components</span>
              </TabsTrigger>
            </TabsList>
            <div className="h-[calc(100%-48px)] overflow-hidden">
              <TabsContent value="canvas" className="h-full p-0 m-0 mt-0">
                {canvasPanel}
              </TabsContent>
              <TabsContent value="right" className="h-full p-0 m-0 mt-0">
                {rightPanel}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      );
    }

    // Desktop: 2-panel resizable layout (Canvas + Sidebar)
    // Sidebar can be on left or right side
    const sidebarOnLeft = sidebarPosition === 'left';

    return (
      <PanelCollapseContext.Provider value={contextValue}>
        <ResizablePanelGroup
          className={cn('h-[calc(100vh-3.5rem)] w-full overflow-hidden flex min-w-0 relative', className)}
          orientation="horizontal"
        >
          {/* Sidebar Panel (when on left) */}
          {sidebarOnLeft && (
            <>
              <ResizablePanel
                id="sidebar-panel"
                panelRef={sidebarPanelRef}
                defaultSize={DEFAULT_SIZES[1]}
                minSize={10}
                maxSize={40}
                collapsible
                collapsedSize={0}
                className="min-w-0 overflow-hidden"
                style={{ minWidth: 0 }}
                onResize={(size) => setIsSidebarCollapsed(size.asPercentage <= 0.1)}
              >
                {rightPanel}
              </ResizablePanel>

              <ResizeHandle panelRef={sidebarPanelRef} onDragging={setIsDragging} />
            </>
          )}

          {/* Canvas Panel - Always in the middle, fills remaining space */}
          <ResizablePanel
            id="canvas-panel"
            defaultSize={sidebarOnLeft ? 75 : DEFAULT_SIZES[0]}
            minSize={30}
            maxSize={100}
            className={cn("relative min-w-0", isDragging && "pointer-events-none")}
          >
            {canvasPanel}
          </ResizablePanel>

          {/* Sidebar Panel (when on right) */}
          {!sidebarOnLeft && (
            <>
              <ResizeHandle panelRef={sidebarPanelRef} onDragging={setIsDragging} />

              <ResizablePanel
                id="sidebar-panel"
                panelRef={sidebarPanelRef}
                defaultSize={DEFAULT_SIZES[1]}
                minSize={10}
                maxSize={40}
                collapsible
                collapsedSize={0}
                className="min-w-0 overflow-hidden"
                style={{ minWidth: 0 }}
                onResize={(size) => setIsSidebarCollapsed(size.asPercentage <= 0.1)}
              >
                {rightPanel}
              </ResizablePanel>
            </>
          )}

          {isSidebarCollapsed && (
            <button
              type="button"
              onClick={toggleRightPanel}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 z-50 rounded bg-background/90 border px-2 py-1 text-xs shadow-sm",
                sidebarOnLeft ? "left-1" : "right-1"
              )}
              aria-label="Expand components panel"
            >
              Components
            </button>
          )}
        </ResizablePanelGroup>
      </PanelCollapseContext.Provider>
    );
  }
);

ResizableLayout.displayName = 'ResizableLayout';

/**
 * Resize handle component with visual indicator and collapse button
 */
function ResizeHandle({
  panelRef,
  onDragging,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  ...props
}: React.ComponentProps<typeof ResizableHandle> & {
  panelRef?: React.RefObject<PanelImperativeHandle | null>;
  onDragging?: (isDragging: boolean) => void;
}) {
  const handleDoubleClick = () => {
    if (panelRef?.current) {
      if (panelRef.current.isCollapsed()) {
        panelRef.current.expand();
      } else {
        panelRef.current.collapse();
      }
    }
  };

  return (
    <ResizableHandle
      withHandle
      onDoubleClick={handleDoubleClick}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        onDragging?.(true);
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event);
        onDragging?.(false);
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event);
        onDragging?.(false);
      }}
      className="w-1.5 bg-border/50 hover:bg-primary/50 focus:outline-none focus:bg-primary transition-colors relative group cursor-col-resize z-50 flex items-center justify-center -ml-0.5"
      {...props}
    />
  );
}
