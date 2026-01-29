/**
 * EditorCanvas
 * Main iframe-based canvas for live preview with PostMessage communication
 * Also acts as a drop target for drag-and-drop component insertion
 * Syncs theme with parent app
 */

import * as React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useCanvasStore } from '@/stores/canvas-store';
import { useTheme } from 'next-themes';
import {
  initCanvasIframe,
  domToCanvasElement,
  parseHTMLToElements,
  selectElementInIframe,
  hoverElementInIframe,
  setupMutationObserver,
  updateElementInIframe,
  type CanvasPostMessage,
} from '@/services/canvas/canvas-manager';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { CanvasOverlay } from '@/components/editor/canvas/canvas-overlay';
import type { CanvasSelection, CanvasElement } from '@/types/canvas';
import type { ComponentTemplate } from '@/types/components';
import { nanoid } from 'nanoid';
import { useInspectorStore } from '@/stores/inspector-store';

export interface EditorCanvasProps {
  initialHTML?: string;
  className?: string;
  onElementSelect?: (elementId: string | null) => void;
  onElementHover?: (elementId: string | null) => void;
  canvasThemeMode?: CanvasThemeMode;
  sidebarPosition?: 'left' | 'right';
  viewportSize?: 'desktop' | 'tablet' | 'mobile';
}

// Canvas theme mode: 'auto' follows app theme, 'light'/'dark' are manual overrides
export type CanvasThemeMode = 'auto' | 'light' | 'dark';

/**
 * Convert component template to canvas element and insert into iframe
 */
const insertComponentIntoIframe = (
  iframe: HTMLIFrameElement,
  component: ComponentTemplate,
  targetElementId?: string
): string | null => {
  const doc = iframe.contentDocument;
  if (!doc) return null;

  // Parse the component HTML
  const parser = new DOMParser();
  const parsedDoc = parser.parseFromString(component.html, 'text/html');
  const newElement = parsedDoc.body.firstElementChild;
  
  if (!newElement) return null;

  // Generate unique ID for the new element
  const elementId = nanoid();
  newElement.setAttribute('data-canvas-id', elementId);
  newElement.setAttribute('data-canvas-tag', newElement.tagName.toLowerCase());

  // Find target container
  let targetContainer: Element | null = null;
  
  if (targetElementId) {
    // Try to find the specific target element
    targetContainer = doc.querySelector(`[data-canvas-id="${targetElementId}"]`);
  }
  
  // Fallback to root container or body
  if (!targetContainer) {
    targetContainer = doc.querySelector('[data-canvas-id="root"]') || doc.body;
  }

  // If target is not a container, use its parent
  const isContainer = ['div', 'section', 'article', 'main', 'header', 'footer', 'nav', 'body'].includes(
    targetContainer.tagName.toLowerCase()
  );
  
  if (!isContainer && targetContainer.parentElement) {
    targetContainer = targetContainer.parentElement;
  }

  // Insert the new element
  targetContainer.appendChild(newElement);

  return elementId;
};

/**
 * Apply theme to iframe document
 */
const applyThemeToIframe = (iframe: HTMLIFrameElement, isDark: boolean) => {
  try {
    const doc = iframe.contentDocument;
    if (!doc) return;

    const root = doc.documentElement;
    
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  } catch (error) {
    console.error('[EditorCanvas] Error applying theme:', error);
  }
};

export const EditorCanvas = React.forwardRef<HTMLIFrameElement, EditorCanvasProps>(
  ({ initialHTML = '', className, onElementSelect, onElementHover, canvasThemeMode = 'auto', sidebarPosition = 'right' }, ref) => {
    const internalRef = React.useRef<HTMLIFrameElement>(null);
    const iframeRef = (ref as React.RefObject<HTMLIFrameElement>) || internalRef;
    const {
      html,
      selectedElement,
      hoveredElement,
      setHTML,
      setSelectedElement,
      setHoveredElement,
      setElements,
    } = useCanvasStore();
    const { setSelectedElement: setInspectorSelectedElement } = useInspectorStore();

    const [isLoaded, setIsLoaded] = React.useState(false);
    const observerRef = React.useRef<MutationObserver | null>(null);
    
    const { resolvedTheme } = useTheme();

    // Determine effective theme based on mode
    const effectiveTheme = React.useMemo(() => {
      if (canvasThemeMode === 'auto') {
        return resolvedTheme === 'dark' ? 'dark' : 'light';
      }
      return canvasThemeMode;
    }, [canvasThemeMode, resolvedTheme]);

    // Setup droppable for the canvas
    const { isOver, setNodeRef } = useDroppable({
      id: 'canvas-drop-zone',
      data: {
        type: 'canvas',
      },
    });

    const syncSelectionFromIframe = React.useCallback(
      (elementId: string | null) => {
        const iframe = iframeRef.current;
        if (!iframe) return;

        if (!elementId) {
          setSelectedElement(null);
          setInspectorSelectedElement(null, null);
          return;
        }

        const element = iframe.contentDocument?.querySelector(
          `[data-canvas-id="${elementId}"]`
        ) as HTMLElement | null;

        if (!element) {
          setSelectedElement(null);
          setInspectorSelectedElement(null, null);
          return;
        }

        const canvasElement = domToCanvasElement(element);
        setSelectedElement({
          elementId,
          element: canvasElement,
          path: [],
        } as CanvasSelection);
        setInspectorSelectedElement(elementId, canvasElement);
      },
      [iframeRef, setInspectorSelectedElement, setSelectedElement]
    );

    // Initialize iframe with content
    React.useEffect(() => {
      const iframe = iframeRef.current;
      if (!iframe) return;

      const handlePostMessage = (message: CanvasPostMessage) => {
        switch (message.type) {
          case 'select-element': {
            const elementId = (message.payload as { elementId: string })?.elementId || null;
            syncSelectionFromIframe(elementId);
            onElementSelect?.(elementId);
            break;
          }
          case 'hover-element': {
            const hoverId = (message.payload as { elementId: string | null })?.elementId || null;
            setHoveredElement(hoverId);
            onElementHover?.(hoverId);
            break;
          }
        }
      };

      initCanvasIframe(iframe, initialHTML || getDefaultHTML(), handlePostMessage);
      const doc = iframe.contentDocument;
      if (doc) {
        setHTML(doc.body.innerHTML);
        setElements(parseHTMLToElements(doc.body.innerHTML));
      }
      setIsLoaded(true);

      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
      };
    }, [initialHTML, onElementHover, onElementSelect, setElements, setHTML, setHoveredElement, syncSelectionFromIframe]);

    // Apply theme to iframe when it changes
    React.useEffect(() => {
      const iframe = iframeRef.current;
      if (!iframe || !isLoaded) return;

      applyThemeToIframe(iframe, effectiveTheme === 'dark');
    }, [effectiveTheme, isLoaded]);

    // Update HTML when changed externally
    React.useEffect(() => {
      if (isLoaded && html && html !== initialHTML) {
        const iframe = iframeRef.current;
        if (!iframe) return;

        const doc = iframe.contentDocument;
        if (!doc) return;

        doc.body.innerHTML = html;
        setElements(parseHTMLToElements(doc.body.innerHTML));
      }
    }, [html, initialHTML, isLoaded, setElements]);

    // Handle element selection in iframe
    React.useEffect(() => {
      const iframe = iframeRef.current;
      if (!iframe || !isLoaded) return;

      selectElementInIframe(iframe, selectedElement?.elementId || null);
    }, [selectedElement?.elementId, isLoaded]);

    // Handle element hover in iframe
    React.useEffect(() => {
      const iframe = iframeRef.current;
      if (!iframe || !isLoaded) return;

      hoverElementInIframe(iframe, hoveredElement);
    }, [hoveredElement, isLoaded]);

    React.useEffect(() => {
      if (!isLoaded) return;

      if (!selectedElement?.elementId) {
        setInspectorSelectedElement(null, null);
        return;
      }

      if (!selectedElement.element) {
        syncSelectionFromIframe(selectedElement.elementId);
        return;
      }

      setInspectorSelectedElement(selectedElement.elementId, selectedElement.element);
    }, [isLoaded, selectedElement?.elementId, selectedElement?.element, setInspectorSelectedElement, syncSelectionFromIframe]);

    // Setup mutation observer to track changes
    React.useEffect(() => {
      const iframe = iframeRef.current;
      if (!iframe || !isLoaded) return;

      const observer = setupMutationObserver(iframe, () => {
        // Update store when DOM changes
        const doc = iframe.contentDocument;
        if (!doc) return;

        setHTML(doc.body.innerHTML);
        setElements(parseHTMLToElements(doc.body.innerHTML));
      });

      observerRef.current = observer;

      return () => {
        if (observer) {
          observer.disconnect();
        }
      };
    }, [isLoaded]);

    const handleLoad = React.useCallback(() => {
      setIsLoaded(true);
    }, []);

    // Handle drop events from dnd-kit
    React.useEffect(() => {
      const handleDropEvent = (e: Event) => {
        const customEvent = e as CustomEvent<{
          component: ComponentTemplate;
          targetId?: string;
        }>;
        
        const iframe = iframeRef.current;
        if (!iframe || !isLoaded) return;

        const { component, targetId } = customEvent.detail;
        const elementId = insertComponentIntoIframe(iframe, component, targetId);
        
        if (elementId) {
          // Update store with new HTML
          const doc = iframe.contentDocument;
          if (doc) {
            setHTML(doc.body.innerHTML);
            setElements(parseHTMLToElements(doc.body.innerHTML));
          }
          
          // Select the newly added element
          const insertedElement = iframe.contentDocument?.querySelector(
            `[data-canvas-id="${elementId}"]`
          ) as HTMLElement | null;
          if (insertedElement) {
            const canvasElement = domToCanvasElement(insertedElement);
            setSelectedElement({
              elementId,
              element: canvasElement,
              path: [],
            });
            setInspectorSelectedElement(elementId, canvasElement);
          }
        }
      };

      window.addEventListener('canvas-drop-component', handleDropEvent);
      return () => window.removeEventListener('canvas-drop-component', handleDropEvent);
    }, [isLoaded, setElements, setHTML, setInspectorSelectedElement, setSelectedElement]);

    React.useEffect(() => {
      const handleUpdateEvent = (event: Event) => {
        const customEvent = event as CustomEvent<{
          elementId: string;
          updates: Partial<CanvasElement>;
        }>;
        const iframe = iframeRef.current;
        if (!iframe || !isLoaded) return;

        const { elementId, updates } = customEvent.detail;
        updateElementInIframe(iframe, elementId, updates);

        const doc = iframe.contentDocument;
        if (doc) {
          setHTML(doc.body.innerHTML);
          setElements(parseHTMLToElements(doc.body.innerHTML));
        }

        const updatedElement = iframe.contentDocument?.querySelector(
          `[data-canvas-id="${elementId}"]`
        ) as HTMLElement | null;

        if (updatedElement) {
          const canvasElement = domToCanvasElement(updatedElement);
          setSelectedElement({
            elementId,
            element: canvasElement,
            path: [],
          });
          setInspectorSelectedElement(elementId, canvasElement);
        }
      };

      window.addEventListener('canvas-update-element', handleUpdateEvent);
      return () => window.removeEventListener('canvas-update-element', handleUpdateEvent);
    }, [isLoaded, iframeRef, setElements, setHTML, setInspectorSelectedElement, setSelectedElement]);

    const handleResizeEnd = React.useCallback(
      (elementId: string, styles: Record<string, string>) => {
        const iframe = iframeRef.current;
        if (!iframe || !isLoaded) return;

        updateElementInIframe(iframe, elementId, { styles });

        const doc = iframe.contentDocument;
        if (doc) {
          setHTML(doc.body.innerHTML);
          setElements(parseHTMLToElements(doc.body.innerHTML));
        }

        const resizedElement = iframe.contentDocument?.querySelector(
          `[data-canvas-id="${elementId}"]`
        ) as HTMLElement | null;
        if (resizedElement) {
          const canvasElement = domToCanvasElement(resizedElement);
          setSelectedElement({
            elementId,
            element: canvasElement,
            path: [],
          });
          setInspectorSelectedElement(elementId, canvasElement);
        }
      },
      [iframeRef, isLoaded, setElements, setHTML, setInspectorSelectedElement, setSelectedElement]
    );

    // Viewport width constraints
    const viewportWidth = viewportSize === 'mobile' ? '375px' : viewportSize === 'tablet' ? '768px' : '100%';
    const isConstrained = viewportSize !== 'desktop';

    return (
      <div 
        ref={setNodeRef}
        className={cn(
          'relative h-full w-full bg-muted/30 transition-colors overflow-auto',
          isOver && 'bg-primary/5 ring-2 ring-primary ring-inset',
          className
        )}
        data-droppable="true"
        data-droppable-id="canvas-drop-zone"
      >
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Skeleton className="h-full w-full" />
          </div>
        )}
        
        {/* Drop overlay */}
        {isOver && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-primary/10 pointer-events-none">
            <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg font-medium">
              Drop component here
            </div>
          </div>
        )}

        {/* Canvas container with optional width constraint */}
        <div 
          className={cn(
            'h-full transition-all duration-300 ease-in-out',
            isConstrained ? 'mx-auto shadow-2xl' : 'w-full'
          )}
          style={{ 
            width: viewportWidth,
            maxWidth: '100%'
          }}
        >
          <iframe
            ref={iframeRef}
            className="h-full w-full border-0 bg-background"
            title="Canvas Editor"
            onLoad={handleLoad}
            aria-label="Live website preview canvas"
          />
        </div>
        <CanvasOverlay
          key={`overlay-${sidebarPosition}`}
          iframeRef={iframeRef}
          onResizeEnd={handleResizeEnd}
        />
      </div>
    );
  }
);

EditorCanvas.displayName = 'EditorCanvas';

/**
 * Get default HTML for empty canvas
 */
const getDefaultHTML = (): string => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Canvas</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      background: var(--background, #ffffff);
      color: var(--foreground, #000000);
    }
    /* Dark mode support */
    .dark body {
      background: #0a0a0a;
      color: #fafafa;
    }
  </style>
</head>
<body>
  <div data-canvas-id="root" data-canvas-tag="div" style="min-height: 100vh; padding: 20px;">
    <h1 data-canvas-id="h1-1" data-canvas-tag="h1" style="font-size: 2rem; margin-bottom: 1rem;">
      Welcome to Visual Builder
    </h1>
    <p data-canvas-id="p-1" data-canvas-tag="p" style="color: inherit; opacity: 0.6;">
      Start by dragging components from the palette or using AI chat.
    </p>
  </div>
</body>
</html>`;
};
