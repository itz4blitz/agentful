/**
 * Canvas Editor Demo Page
 * Demonstrates the Canvas Editor feature
 */

import * as React from 'react';
import { EditorCanvas, ElementTree, CanvasContextMenu } from '@/components/editor/canvas';
import { useCanvasStore } from '@/stores/canvas-store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Undo2, Redo2, Download, Trash2 } from 'lucide-react';

export const CanvasDemo = () => {
  const {
    elements,
    selectedElement,
    html,
    isDirty,
    canUndo,
    canRedo,
    undo,
    redo,
    reset,
  } = useCanvasStore();

  const handleExport = React.useCallback(() => {
    const htmlContent = html || '<div>No content</div>';
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'exported-page.html';
    a.click();
    URL.revokeObjectURL(url);
  }, [html]);

  return (
    <div className="h-screen w-full flex flex-col">
      {/* Header */}
      <header className="border-b px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Canvas Editor Demo</h1>
          <p className="text-sm text-muted-foreground">
            Live website preview/editor with DOM manipulation
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDirty && (
            <span className="text-xs text-muted-foreground mr-2">Unsaved changes</span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={undo}
            disabled={!canUndo}
            aria-label="Undo"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={redo}
            disabled={!canRedo}
            aria-label="Redo"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-6 mx-2" />
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="destructive" size="sm" onClick={reset}>
            <Trash2 className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Element Tree Sidebar */}
        <aside className="w-64 border-r flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-semibold">DOM Tree</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {elements.length} element{elements.length !== 1 ? 's' : ''}
            </p>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2">
              <ElementTree />
            </div>
          </ScrollArea>
        </aside>

        {/* Canvas */}
        <main className="flex-1">
          <CanvasContextMenu>
            <EditorCanvas
              initialHTML={`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Canvas Demo</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; }
    h1 { font-size: 2.5rem; margin-bottom: 1rem; }
    p { color: #666; line-height: 1.6; }
    .card { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-top: 20px; }
    button { background: #3b82f6; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
    button:hover { background: #2563eb; }
  </style>
</head>
<body>
  <h1 data-canvas-id="h1-1" data-canvas-tag="h1">Welcome to Canvas Editor</h1>
  <p data-canvas-id="p-1" data-canvas-tag="p">This is a live preview. Click on any element to select it.</p>
  <div class="card" data-canvas-id="div-1" data-canvas-tag="div">
    <h2 data-canvas-id="h2-1" data-canvas-tag="h2">Interactive Card</h2>
    <p data-canvas-id="p-2" data-canvas-tag="p">You can select, edit, and manipulate elements in real-time.</p>
    <button data-canvas-id="button-1" data-canvas-tag="button">Click Me</button>
  </div>
</body>
</html>`}
            />
          </CanvasContextMenu>
        </main>

        {/* Properties Panel (placeholder for now) */}
        <aside className="w-64 border-l flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Properties</h2>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4">
              {selectedElement ? (
                <div className="space-y-4">
                  <div>
                    <span className="text-sm font-medium">Element</span>
                    <p className="text-lg">{selectedElement.element?.tagName || 'Unknown'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">ID</span>
                    <p className="text-sm text-muted-foreground font-mono">
                      {selectedElement.elementId}
                    </p>
                  </div>
                  <Separator />
                  <div className="text-sm text-muted-foreground">
                    Property editor coming soon...
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Select an element to view its properties
                </div>
              )}
            </div>
          </ScrollArea>
        </aside>
      </div>
    </div>
  );
};

export default CanvasDemo;
