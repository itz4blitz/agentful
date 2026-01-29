/**
 * MCP Server List Component
 * Shows configured MCPs with status, logs, and controls
 */

import { useState, useEffect } from 'react';
import { 
  Activity, AlertCircle, Check, Settings, Trash2, 
  Power, PowerOff, Terminal, Plus 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  mcpConfigManager, 
  type MCPRegistryEntry,
  type MCPConfig 
} from '@/services/integrations/mcp-config-manager';
import { getMCPIconComponent, getMCPColorClass } from './mcp-icons';
import { toolDetection, type CLITool, type MCPServerStatus } from '@/services/integrations/tool-detection';
import { MCPServerInstallDialog } from './mcp-server-install-dialog';
import { cn } from '@/lib/utils';

interface MCPServerListProps {
  tool: CLITool;
}

export function MCPServerList({ tool }: MCPServerListProps) {
  const [config, setConfig] = useState<MCPConfig | null>(null);
  const [statuses, setStatuses] = useState<MCPServerStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [logs, setLogs] = useState<Record<string, string[]>>({});

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const cfg = await mcpConfigManager.readConfig(tool);
      setConfig(cfg);
      
      const status = await toolDetection.getToolStatus(tool.id);
      setStatuses(status?.mcpServers || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
    
    // Poll for status updates
    const interval = setInterval(loadConfig, 5000);
    return () => clearInterval(interval);
  }, [tool.id]);

  const handleToggleServer = async (serverId: string, enabled: boolean) => {
    await mcpConfigManager.toggleServer(tool, serverId, enabled);
    loadConfig();
  };

  const handleRemoveServer = async (serverId: string) => {
    await mcpConfigManager.removeServer(tool, serverId);
    loadConfig();
  };

  const getStatusIcon = (status: MCPServerStatus['status']) => {
    switch (status) {
      case 'active':
        return <Activity className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'connecting':
        return <Activity className="h-4 w-4 text-yellow-500 animate-pulse" />;
      default:
        return <PowerOff className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: MCPServerStatus['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'connecting':
        return <Badge variant="secondary">Connecting</Badge>;
      default:
        return <Badge variant="outline">Stopped</Badge>;
    }
  };

  const getRegistryEntry = (serverId: string): MCPRegistryEntry | undefined => {
    return mcpConfigManager.getMCPById(serverId);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          MCP Servers
        </CardTitle>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowInstallDialog(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground py-4">
            Loading...
          </div>
        ) : !config || config.servers.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-3">
              No MCP servers configured
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowInstallDialog(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add MCP Server
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {config.servers.map((server) => {
              const status = statuses.find(s => s.id === server.id);
              const registryEntry = getRegistryEntry(server.id);
              const isSelected = selectedServer === server.id;
              
              return (
                <div
                  key={server.id}
                  className={cn(
                    "border rounded-lg p-3 cursor-pointer transition-colors",
                    isSelected && "border-primary bg-primary/5",
                    !isSelected && "hover:bg-muted"
                  )}
                  onClick={() => setSelectedServer(isSelected ? null : server.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn("p-1.5 rounded-lg", getMCPColorClass(server.id))}>
                        {getMCPIconComponent(server.id, 20)}
                      </span>
                      <div>
                        <p className="text-sm font-medium">
                          {registryEntry?.name || server.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {registryEntry?.npmPackage || server.command}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {status && getStatusBadge(status.status)}
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleServer(server.id, !!server.disabled);
                        }}
                      >
                        {server.disabled ? (
                          <PowerOff className="h-4 w-4" />
                        ) : (
                          <Power className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveServer(server.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Expanded details */}
                  {isSelected && (
                    <div className="mt-3 pt-3 border-t space-y-3">
                      {status?.lastError && (
                        <div className="flex items-start gap-2 text-sm text-red-500">
                          <AlertCircle className="h-4 w-4 mt-0.5" />
                          <p>{status.lastError}</p>
                        </div>
                      )}
                      
                      {registryEntry?.description && (
                        <p className="text-sm text-muted-foreground">
                          {registryEntry.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Terminal className="h-3 w-3 mr-1" />
                          Logs
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="h-3 w-3 mr-1" />
                          Configure
                        </Button>
                      </div>
                      
                      {/* Tags */}
                      {registryEntry?.tags && (
                        <div className="flex flex-wrap gap-1">
                          {registryEntry.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {registryEntry.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{registryEntry.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <MCPServerInstallDialog
        open={showInstallDialog}
        onClose={() => setShowInstallDialog(false)}
        tool={tool}
        onInstalled={loadConfig}
      />
    </Card>
  );
}
