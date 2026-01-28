/**
 * CanvasContextMenu
 * Right-click context menu on canvas elements with edit actions
 */

import * as React from 'react';
import { useCanvasStore } from '@/stores/canvas-store';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import type { ContextMenuAction } from '@/types/canvas';
import {
  Copy,
  Trash2,
  CornerUpRight,
  CornerDownLeft,
  Edit,
} from 'lucide-react';

export interface CanvasContextMenuProps {
  children: React.ReactNode;
  onAction?: (action: ContextMenuAction, elementId: string) => void;
}

export const CanvasContextMenu = React.forwardRef<HTMLDivElement, CanvasContextMenuProps>(
  ({ children, onAction }, _ref) => {
    const {
      selectedElement,
      copyToClipboard,
      duplicateElement,
      removeElement,
      pasteFromClipboard,
      wrapElement,
      unwrapElement,
      reorderElement,
      undo,
      redo,
    } = useCanvasStore();

    const handleAction = React.useCallback(
      (action: ContextMenuAction) => {
        if (!selectedElement?.elementId) return;

        switch (action) {
          case 'edit':
            // Focus property editor
            onAction?.(action, selectedElement.elementId);
            break;
          case 'duplicate':
            duplicateElement(selectedElement.elementId);
            break;
          case 'delete':
            removeElement(selectedElement.elementId);
            break;
          case 'copy':
            copyToClipboard(selectedElement.elementId);
            break;
          case 'paste':
            pasteFromClipboard(selectedElement.elementId);
            break;
          case 'wrap':
            wrapElement(selectedElement.elementId);
            break;
          case 'unwrap':
            unwrapElement(selectedElement.elementId);
            break;
          case 'move-up':
            reorderElement(selectedElement.elementId, 'up');
            break;
          case 'move-down':
            reorderElement(selectedElement.elementId, 'down');
            break;
          default:
            onAction?.(action, selectedElement.elementId);
        }
      },
      [
        selectedElement?.elementId,
        duplicateElement,
        removeElement,
        copyToClipboard,
        pasteFromClipboard,
        wrapElement,
        unwrapElement,
        reorderElement,
        onAction,
      ]
    );

    const handleKeyDown = React.useCallback(
      (e: KeyboardEvent) => {
        if (!selectedElement?.elementId) return;

        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const modifierKey = isMac ? e.metaKey : e.ctrlKey;

        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          handleAction('delete');
        } else if (e.key === 'd' && modifierKey) {
          e.preventDefault();
          handleAction('duplicate');
        } else if (e.key === 'c' && modifierKey) {
          e.preventDefault();
          handleAction('copy');
        } else if (e.key === 'v' && modifierKey) {
          e.preventDefault();
          handleAction('paste');
        } else if (e.key === 'ArrowUp' && modifierKey) {
          e.preventDefault();
          handleAction('move-up');
        } else if (e.key === 'ArrowDown' && modifierKey) {
          e.preventDefault();
          handleAction('move-down');
        } else if (e.key === 'z' && modifierKey && e.shiftKey) {
          e.preventDefault();
          redo();
        } else if (e.key === 'z' && modifierKey) {
          e.preventDefault();
          undo();
        }
      },
      [selectedElement?.elementId, handleAction, undo, redo]
    );

    React.useEffect(() => {
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }, [handleKeyDown]);

    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={() => handleAction('edit')}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
            <span className="ml-auto text-xs text-muted-foreground">Enter</span>
          </ContextMenuItem>

          <ContextMenuItem onClick={() => handleAction('duplicate')}>
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
            <span className="ml-auto text-xs text-muted-foreground">
              {navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘D' : 'Ctrl+D'}
            </span>
          </ContextMenuItem>

          <ContextMenuItem onClick={() => handleAction('copy')}>
            <Copy className="h-4 w-4 mr-2" />
            Copy
            <span className="ml-auto text-xs text-muted-foreground">
              {navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘C' : 'Ctrl+C'}
            </span>
          </ContextMenuItem>

          <ContextMenuItem onClick={() => handleAction('paste')}>
            <Copy className="h-4 w-4 mr-2" />
            Paste
            <span className="ml-auto text-xs text-muted-foreground">
              {navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘V' : 'Ctrl+V'}
            </span>
          </ContextMenuItem>

          <ContextMenuItem onClick={() => handleAction('wrap')}>
            <CornerUpRight className="h-4 w-4 mr-2" />
            Wrap Element
          </ContextMenuItem>

          <ContextMenuItem onClick={() => handleAction('unwrap')}>
            <CornerDownLeft className="h-4 w-4 mr-2" />
            Unwrap Element
          </ContextMenuItem>

          <ContextMenuItem onClick={() => handleAction('move-up')}>
            <CornerUpRight className="h-4 w-4 mr-2" />
            Move Up
            <span className="ml-auto text-xs text-muted-foreground">
              {navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘↑' : 'Ctrl+↑'}
            </span>
          </ContextMenuItem>

          <ContextMenuItem onClick={() => handleAction('move-down')}>
            <CornerDownLeft className="h-4 w-4 mr-2" />
            Move Down
            <span className="ml-auto text-xs text-muted-foreground">
              {navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘↓' : 'Ctrl+↓'}
            </span>
          </ContextMenuItem>

          <div className="h-px my-1 bg-border" />

          <ContextMenuItem
            onClick={() => handleAction('delete')}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
            <span className="ml-auto text-xs text-muted-foreground">Del</span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  }
);

CanvasContextMenu.displayName = 'CanvasContextMenu';
