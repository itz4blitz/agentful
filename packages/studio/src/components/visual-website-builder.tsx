import { Link } from 'react-router-dom'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { ResizableLayout, type ResizableLayoutHandle } from '@/components/editor/layout/resizable-layout'
import { EditorCanvas, type CanvasThemeMode } from '@/components/editor/canvas/editor-canvas'
import { CanvasContextMenu } from '@/components/editor/canvas/canvas-context-menu'
import { UnifiedRightPanel } from '@/components/editor/palette/unified-right-panel'
import { DndContext } from '@/components/editor/dnd/dnd-context'
import { GlobalDragOverlay } from '@/components/editor/dnd/drag-overlay'
import { ProjectManager } from '@/components/editor/project/project-manager'
import { ExportDialog } from '@/components/editor/project/export-dialog'
import { useLayoutInitializer } from '@/components/editor/layout/layout-initializer'
import { Button } from '@/components/ui/button'
import { Box, Save, Download, LayoutGrid, RotateCcw, Boxes, Monitor, Sun, Moon, Check, PanelLeft, PanelRight, Puzzle, Smartphone, Tablet, Laptop } from 'lucide-react'
import { useState, useRef } from 'react'

type SidebarPosition = 'left' | 'right'
type ViewportSize = 'desktop' | 'tablet' | 'mobile'

// import { useProjectStore } from '@/stores/project-store'

export function VisualWebsiteBuilder() {
  const [showProjectManager, setShowProjectManager] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [canvasThemeMode, setCanvasThemeMode] = useState<CanvasThemeMode>('auto')
  const [sidebarPosition, setSidebarPosition] = useState<SidebarPosition>('right')
  const [viewportSize, setViewportSize] = useState<ViewportSize>('desktop')
  const layoutRef = useRef<ResizableLayoutHandle>(null)
  useLayoutInitializer()

  // Project store is available for future use
  // const { currentProject, saveProject } = useProjectStore()

  const handleResetLayout = () => {
    localStorage.removeItem('react-resizable-panels:visual-builder-layout-v4')
    window.location.reload()
  }

  const handleToggleSidebarPosition = () => {
    setSidebarPosition(prev => prev === 'right' ? 'left' : 'right')
  }

  return (
    <DndContext>
      <div className="h-screen flex flex-col bg-background min-w-0">
        {/* Header */}
        <header className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Box className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-sm font-bold">Visual Builder</h1>
                <p className="text-[10px] text-muted-foreground">Live Preview Editor</p>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-1 ml-4 border-l pl-4 h-6">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => layoutRef.current?.toggleRightPanel()}
                title="Toggle Components Panel"
              >
                <Boxes className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleToggleSidebarPosition}
                title={`Move sidebar to ${sidebarPosition === 'right' ? 'left' : 'right'}`}
              >
                {sidebarPosition === 'right' ? (
                  <PanelLeft className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <PanelRight className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Link to="/c/forms">
              <Button variant="ghost" size="sm" className="gap-2">
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">Components</span>
              </Button>
            </Link>

            <Link to="/integrations">
              <Button variant="ghost" size="sm" className="gap-2">
                <Puzzle className="h-4 w-4" />
                <span className="hidden sm:inline">Integrations</span>
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetLayout}
              className="gap-2"
              title="Reset panel sizes to default"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Reset Layout</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowProjectManager(true)}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">Project</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExportDialog(true)}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>

            <div className="w-px h-6 bg-border" />

            {/* Viewport Size Toggles */}
            <div className="relative flex items-center gap-1 rounded-lg border bg-background/80 px-1 py-1">
              <span className="hidden lg:inline text-[10px] text-muted-foreground px-1">Viewport</span>
              <Button
                variant={viewportSize === 'mobile' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-7 w-7"
                onClick={() => setViewportSize('mobile')}
                title="Mobile view (375px)"
              >
                <Smartphone className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={viewportSize === 'tablet' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-7 w-7"
                onClick={() => setViewportSize('tablet')}
                title="Tablet view (768px)"
              >
                <Tablet className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={viewportSize === 'desktop' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-7 w-7"
                onClick={() => setViewportSize('desktop')}
                title="Desktop view (100%)"
              >
                <Laptop className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="w-px h-6 bg-border hidden sm:block" />

            <div className="relative flex items-center gap-1 rounded-lg border bg-background/80 px-1 py-1">
              <span className="hidden lg:inline text-[10px] text-muted-foreground px-1">Theme</span>
              <Button
                variant={canvasThemeMode === 'auto' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-7 w-7"
                onClick={() => setCanvasThemeMode('auto')}
                title="Canvas: match app theme"
              >
                <Monitor className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={canvasThemeMode === 'light' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-7 w-7"
                onClick={() => setCanvasThemeMode('light')}
                title="Canvas: light mode"
              >
                <Sun className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={canvasThemeMode === 'dark' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-7 w-7"
                onClick={() => setCanvasThemeMode('dark')}
                title="Canvas: dark mode"
              >
                <Moon className="h-3.5 w-3.5" />
              </Button>
              {canvasThemeMode === 'auto' && (
                <div className="absolute -top-1 -right-1">
                  <div className="bg-primary text-primary-foreground rounded-full p-0.5">
                    <Check className="h-2 w-2" />
                  </div>
                </div>
              )}
            </div>

            <ThemeSwitcher />
          </div>
        </header>

        {/* Main Editor - 2 Panel Layout (Canvas + Sidebar) */}
        <ResizableLayout
          ref={layoutRef}
          sidebarPosition={sidebarPosition}
          canvasPanel={
            <CanvasContextMenu>
              <EditorCanvas canvasThemeMode={canvasThemeMode} sidebarPosition={sidebarPosition} viewportSize={viewportSize} />
            </CanvasContextMenu>
          }
          rightPanel={<UnifiedRightPanel />}
        />
        <GlobalDragOverlay />

        {/* Dialogs */}
        {showProjectManager && (
          <ProjectManager open={showProjectManager} onOpenChange={setShowProjectManager} />
        )}

        {showExportDialog && (
          <ExportDialog open={showExportDialog} onOpenChange={setShowExportDialog} />
        )}
      </div>
    </DndContext>
  )
}
