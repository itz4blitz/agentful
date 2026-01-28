/**
 * ElementTree
 * Hierarchical tree view of DOM structure with expandable/collapsible nodes
 */

import * as React from 'react';
import { useCanvasStore } from '@/stores/canvas-store';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import type { CanvasElement } from '@/types/canvas';

export interface ElementTreeProps {
  className?: string;
}

interface TreeNodeProps {
  element: CanvasElement;
  level?: number;
  isSelected: boolean;
  onSelect: (elementId: string) => void;
  expandedNodes: Set<string>;
  onToggle: (elementId: string) => void;
}

const TreeNode = React.memo(
  ({ element, level = 0, isSelected, onSelect, expandedNodes, onToggle }: TreeNodeProps) => {
  const hasChildren = element.children && element.children.length > 0;
  const isExpanded = expandedNodes.has(element.id);

    return (
      <div>
        <div
          className={cn(
            'flex items-center gap-1 py-1 pr-2 text-sm hover:bg-accent cursor-pointer',
            isSelected && 'bg-accent',
            level > 0 && 'pl-2'
          )}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => onSelect(element.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelect(element.id);
            }
          }}
          role="button"
          tabIndex={0}
          aria-pressed={isSelected}
        >
          {hasChildren && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggle(element.id);
              }}
              className="h-4 w-4 flex items-center justify-center hover:bg-accent rounded"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          )}
          {!hasChildren && <div className="h-4 w-4" />}
          <span className={cn('text-xs font-mono', isSelected && 'font-semibold')}>
            {element.tagName}
          </span>
          {element.content && (
            <span className="text-xs text-muted-foreground truncate ml-2">
              {element.content.substring(0, 20)}
              {element.content.length > 20 && '...'}
            </span>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div>
            {element.children.map((child: CanvasElement) => (
              <TreeNode
                key={child.id}
                element={child}
                level={level + 1}
                isSelected={isSelected}
                onSelect={onSelect}
                expandedNodes={expandedNodes}
                onToggle={onToggle}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
);

TreeNode.displayName = 'TreeNode';

export const ElementTree = React.forwardRef<HTMLDivElement, ElementTreeProps>(
  ({ className }, ref) => {
    const { elements, selectedElement, setSelectedElement } = useCanvasStore();
    const [expandedNodes, setExpandedNodes] = React.useState<Set<string>>(() => new Set());
    const hasInitialized = React.useRef(false);

    const handleSelect = React.useCallback(
      (elementId: string) => {
        setSelectedElement({
          elementId,
          element: null as unknown as CanvasElement, // Will be populated by store
          path: [],
        });
      },
      [setSelectedElement]
    );

    const collectExpandableIds = React.useCallback((nodes: CanvasElement[], ids: Set<string>) => {
      nodes.forEach((node) => {
        if (node.children && node.children.length > 0) {
          ids.add(node.id);
          collectExpandableIds(node.children, ids);
        }
      });
    }, []);

    const handleToggleNode = React.useCallback((elementId: string) => {
      setExpandedNodes((prev) => {
        const next = new Set(prev);
        if (next.has(elementId)) {
          next.delete(elementId);
        } else {
          next.add(elementId);
        }
        return next;
      });
    }, []);

    const handleCollapseAll = React.useCallback(() => {
      setExpandedNodes(new Set());
    }, []);

    const handleExpandAll = React.useCallback(() => {
      const next = new Set<string>();
      collectExpandableIds(elements, next);
      setExpandedNodes(next);
    }, [collectExpandableIds, elements]);

    React.useEffect(() => {
      if (hasInitialized.current || elements.length === 0) return;
      const next = new Set<string>();
      collectExpandableIds(elements, next);
      setExpandedNodes(next);
      hasInitialized.current = true;
    }, [collectExpandableIds, elements]);

    return (
      <div
        ref={ref}
        className={cn('flex flex-col h-full', className)}
        role="tree"
        aria-label="Element tree"
      >
        {/* Header */}
        <div className="border-b px-3 py-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">DOM Tree</h3>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={handleExpandAll}>
              Expand
            </Button>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={handleCollapseAll}>
              Collapse
            </Button>
          </div>
        </div>

        {/* Tree */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-2">
            {elements.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                No elements yet. Add components to get started.
              </div>
            ) : (
              elements.map((element) => (
                <TreeNode
                  key={element.id}
                  element={element}
                  isSelected={selectedElement?.elementId === element.id}
                  onSelect={handleSelect}
                  expandedNodes={expandedNodes}
                  onToggle={handleToggleNode}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }
);

ElementTree.displayName = 'ElementTree';
