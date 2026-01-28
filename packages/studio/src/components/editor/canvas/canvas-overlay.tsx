/**
 * CanvasOverlay
 * Visual overlay for selected elements with bounding box and resize indicators
 */

import * as React from 'react';
import { useCanvasStore } from '@/stores/canvas-store';
import { cn } from '@/lib/utils';

export interface CanvasOverlayProps {
  className?: string;
  iframeRef: React.RefObject<HTMLIFrameElement>;
  onResizeEnd?: (elementId: string, styles: Record<string, string>) => void;
}

export const CanvasOverlay = React.forwardRef<HTMLDivElement, CanvasOverlayProps>(
  ({ className, iframeRef, onResizeEnd }, ref) => {
    const { selectedElement } = useCanvasStore();
    const [position, setPosition] = React.useState<DOMRect | null>(null);
    const resizeStateRef = React.useRef<{
      direction: string;
      startX: number;
      startY: number;
      startRect: DOMRect;
    } | null>(null);
    const latestSizeRef = React.useRef<{ width: number; height: number } | null>(null);

    const getTargetElement = React.useCallback(() => {
      const iframe = iframeRef.current;
      const doc = iframe?.contentDocument;
      if (!doc || !selectedElement?.elementId) return null;
      return doc.querySelector(`[data-canvas-id="${selectedElement.elementId}"]`) as HTMLElement | null;
    }, [iframeRef, selectedElement?.elementId]);

    const updatePosition = React.useCallback(() => {
      const iframe = iframeRef.current;
      const element = getTargetElement();
      if (!iframe || !element) {
        setPosition(null);
        return;
      }

      const rect = element.getBoundingClientRect();
      const iframeRect = iframe.getBoundingClientRect();
      const merged = new DOMRect(
        rect.left + iframeRect.left,
        rect.top + iframeRect.top,
        rect.width,
        rect.height
      );
      setPosition(merged);
    }, [getTargetElement, iframeRef]);

    // Update overlay position when selection changes
    React.useEffect(() => {
      if (!selectedElement?.elementId) {
        setPosition(null);
        return;
      }

      // Find element in DOM and get position
      updatePosition();
    }, [selectedElement?.elementId, updatePosition]);

    // Update position on scroll/resize
    React.useEffect(() => {
      if (!selectedElement?.elementId) return;

      const iframe = iframeRef.current;
      const contentWindow = iframe?.contentWindow;

      updatePosition();

      window.addEventListener('resize', updatePosition);
      contentWindow?.addEventListener('scroll', updatePosition, true);

      return () => {
        window.removeEventListener('resize', updatePosition);
        contentWindow?.removeEventListener('scroll', updatePosition, true);
      };
    }, [selectedElement?.elementId, iframeRef, updatePosition]);

    React.useEffect(() => {
      const handlePointerMove = (event: PointerEvent) => {
        const resizeState = resizeStateRef.current;
        const element = getTargetElement();
        if (!resizeState || !element) return;

        const deltaX = event.clientX - resizeState.startX;
        const deltaY = event.clientY - resizeState.startY;
        let nextWidth = resizeState.startRect.width;
        let nextHeight = resizeState.startRect.height;

        if (resizeState.direction.includes('e')) {
          nextWidth = resizeState.startRect.width + deltaX;
        }
        if (resizeState.direction.includes('w')) {
          nextWidth = resizeState.startRect.width - deltaX;
        }
        if (resizeState.direction.includes('s')) {
          nextHeight = resizeState.startRect.height + deltaY;
        }
        if (resizeState.direction.includes('n')) {
          nextHeight = resizeState.startRect.height - deltaY;
        }

        nextWidth = Math.max(20, nextWidth);
        nextHeight = Math.max(20, nextHeight);

        element.style.width = `${nextWidth}px`;
        element.style.height = `${nextHeight}px`;
        latestSizeRef.current = { width: nextWidth, height: nextHeight };
        updatePosition();
      };

      const handlePointerUp = () => {
        const resizeState = resizeStateRef.current;
        if (!resizeState || !selectedElement?.elementId) return;

        const latestSize = latestSizeRef.current;
        if (latestSize) {
          onResizeEnd?.(selectedElement.elementId, {
            width: `${latestSize.width}px`,
            height: `${latestSize.height}px`,
          });
        }

        resizeStateRef.current = null;
        latestSizeRef.current = null;
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };

      if (resizeStateRef.current) {
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
      }

      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }, [getTargetElement, onResizeEnd, selectedElement?.elementId, updatePosition]);

    const handleResizeStart = (event: React.PointerEvent<HTMLDivElement>, direction: string) => {
      event.preventDefault();
      const element = getTargetElement();
      if (!element) return;

      resizeStateRef.current = {
        direction,
        startX: event.clientX,
        startY: event.clientY,
        startRect: element.getBoundingClientRect(),
      };
      latestSizeRef.current = {
        width: element.getBoundingClientRect().width,
        height: element.getBoundingClientRect().height,
      };
    };

    if (!position) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn('pointer-events-none fixed z-50', className)}
        style={{
          top: position.top,
          left: position.left,
          width: position.width,
          height: position.height,
        }}
      >
        {/* Selection border */}
        <div className="absolute inset-0 border-2 border-primary" />

        {/* Corner handles */}
        <div
          className="absolute -top-1 -left-1 h-3 w-3 rounded-sm bg-primary pointer-events-auto cursor-nwse-resize"
          onPointerDown={(event) => handleResizeStart(event, 'nw')}
        />
        <div
          className="absolute -top-1 -right-1 h-3 w-3 rounded-sm bg-primary pointer-events-auto cursor-nesw-resize"
          onPointerDown={(event) => handleResizeStart(event, 'ne')}
        />
        <div
          className="absolute -bottom-1 -left-1 h-3 w-3 rounded-sm bg-primary pointer-events-auto cursor-nesw-resize"
          onPointerDown={(event) => handleResizeStart(event, 'sw')}
        />
        <div
          className="absolute -bottom-1 -right-1 h-3 w-3 rounded-sm bg-primary pointer-events-auto cursor-nwse-resize"
          onPointerDown={(event) => handleResizeStart(event, 'se')}
        />

        {/* Edge handles */}
        <div
          className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-sm bg-primary pointer-events-auto cursor-ns-resize"
          onPointerDown={(event) => handleResizeStart(event, 'n')}
        />
        <div
          className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-sm bg-primary pointer-events-auto cursor-ns-resize"
          onPointerDown={(event) => handleResizeStart(event, 's')}
        />
        <div
          className="absolute left-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-sm bg-primary pointer-events-auto cursor-ew-resize"
          onPointerDown={(event) => handleResizeStart(event, 'w')}
        />
        <div
          className="absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-sm bg-primary pointer-events-auto cursor-ew-resize"
          onPointerDown={(event) => handleResizeStart(event, 'e')}
        />

        {/* Element info tooltip */}
        {selectedElement?.element && (
          <div className="absolute -top-8 left-0 rounded bg-primary px-2 py-1 text-xs text-primary-foreground">
            {selectedElement.element.tagName}
            <span className="ml-2 opacity-70">#{selectedElement.elementId}</span>
          </div>
        )}
      </div>
    );
  }
);

CanvasOverlay.displayName = 'CanvasOverlay';
