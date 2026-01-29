/**
 * LayoutSeparator
 * Styled resize handle with keyboard support and visual feedback
 */

import * as React from 'react';
import { GripVertical } from 'lucide-react';
import { ResizableHandle } from '@/components/ui/resizable';
import { cn } from '@/lib/utils';

export interface LayoutSeparatorProps extends React.ComponentProps<typeof ResizableHandle> {
  withHandle?: boolean;
  direction?: 'horizontal' | 'vertical';
}

export const LayoutSeparator = React.forwardRef<HTMLDivElement, LayoutSeparatorProps>(
  ({ withHandle = true, direction = 'horizontal', className, elementRef, ...props }, ref) => {
    const [isDragging, setIsDragging] = React.useState(false);

    // Combine refs to support both forwardRef and elementRef
    const combinedRef = React.useMemo(
      () => (node: HTMLDivElement | null) => {
        // Handle the forwardRef from React.forwardRef
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
        // Handle the elementRef from react-resizable-panels
        if (typeof elementRef === 'function') {
          elementRef(node);
        } else if (elementRef) {
          elementRef.current = node;
        }
      },
      [ref, elementRef]
    );

    return (
      <ResizableHandle
        {...props}
        withHandle={withHandle}
        elementRef={combinedRef}
        className={cn(
          'relative flex',
          // Background and border
          'bg-border',
          // Hover state
          'hover:bg-primary/20',
          // Transition
          'transition-colors duration-200',
          // Focus styles
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1',
          // Direction styles
          direction === 'horizontal'
            ? 'w-px items-center justify-center'
            : 'h-px flex-col items-center justify-center',
          // Dragging state
          isDragging && 'bg-primary/30',
          className
        )}
        data-direction={direction}
        onPointerDown={() => setIsDragging(true)}
        onPointerUp={() => setIsDragging(false)}
        onPointerLeave={() => setIsDragging(false)}
        aria-label="Resize panel"
      >
        {withHandle && (
          <div
            className={cn(
              'z-10 flex items-center justify-center rounded-sm border bg-border transition-all',
              'hover:bg-primary/30 hover:border-primary/50',
              isDragging && 'bg-primary/30 border-primary/50',
              direction === 'horizontal' ? 'h-4 w-3' : 'h-3 w-4'
            )}
            aria-hidden="true"
          >
            <GripVertical
              className={cn(
                'text-muted-foreground transition-colors',
                isDragging && 'text-primary',
                direction === 'horizontal' ? 'h-2.5 w-2.5' : 'h-2.5 w-2.5 rotate-90'
              )}
            />
          </div>
        )}
      </ResizableHandle>
    );
  }
);

LayoutSeparator.displayName = 'LayoutSeparator';
