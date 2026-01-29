/**
 * Tool Selector Component
 * Dropdown to select active coding CLI tool
 */

import { useState, useEffect } from 'react';
import { ChevronDown, Check, Terminal, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { toolDetection, type CLITool } from '@/services/integrations/tool-detection';
import { getToolIconComponent } from './tool-icons';
import { cn } from '@/lib/utils';

interface ToolSelectorProps {
  selectedTool?: string;
  onSelectTool: (tool: CLITool) => void;
}

export function ToolSelector({ selectedTool, onSelectTool }: ToolSelectorProps) {
  const [tools, setTools] = useState<CLITool[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const detectTools = async () => {
    setIsLoading(true);
    try {
      const detected = await toolDetection.detectInstalledTools();
      console.log('[ToolSelector] Detected tools:', detected);
      setTools(detected);
      
      // Auto-select first tool if none selected
      if (!selectedTool && detected.length > 0) {
        onSelectTool(detected[0]);
      }
    } catch (error) {
      console.error('[ToolSelector] Error detecting tools:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    detectTools();
  }, []);

  const selectedToolData = tools.find(t => t.id === selectedTool);



  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-between"
          disabled={isLoading}
        >
          <span className="flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            {selectedToolData ? (
              <>
                <span>{getToolIconComponent(selectedToolData.id, 18)}</span>
                <span>{selectedToolData.name}</span>
                {selectedToolData.version && (
                  <span className="text-muted-foreground text-xs">
                    v{selectedToolData.version}
                  </span>
                )}
              </>
            ) : (
              <span className="text-muted-foreground">Select coding tool...</span>
            )}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-72" align="start">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Detected Tools</span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              detectTools();
            }}
          >
            <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
          </Button>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {tools.length === 0 ? (
          <DropdownMenuItem disabled>
            <span className="text-muted-foreground">No tools detected</span>
          </DropdownMenuItem>
        ) : (
          tools.map(tool => (
            <DropdownMenuItem
              key={tool.id}
              onClick={() => {
                onSelectTool(tool);
                setIsOpen(false);
              }}
              className="flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <span>{getToolIconComponent(tool.id, 18)}</span>
                <span>{tool.name}</span>
              </span>
              <span className="flex items-center gap-2">
                {tool.version && (
                  <span className="text-xs text-muted-foreground">
                    v{tool.version}
                  </span>
                )}
                {tool.isRunning ? (
                  <Badge variant="default" className="h-5 text-xs">Running</Badge>
                ) : (
                  <Badge variant="secondary" className="h-5 text-xs">Idle</Badge>
                )}
                {selectedTool === tool.id && (
                  <Check className="h-4 w-4" />
                )}
              </span>
            </DropdownMenuItem>
          ))
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem disabled>
          <span className="text-xs text-muted-foreground">
            Install more tools to see them here
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
