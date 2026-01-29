/**
 * MCP Server Install Dialog
 * 1-click installation of MCP servers
 */

import { useState } from 'react';
import { Search, Download, Check, AlertCircle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  mcpConfigManager,
  type MCPRegistryEntry 
} from '@/services/integrations/mcp-config-manager';
import { getMCPIconComponent, getMCPColorClass } from './mcp-icons';
import type { CLITool } from '@/services/integrations/tool-detection';
import { cn } from '@/lib/utils';

interface MCPServerInstallDialogProps {
  open: boolean;
  onClose: () => void;
  tool: CLITool;
  onInstalled: () => void;
}

export function MCPServerInstallDialog({ 
  open, 
  onClose, 
  tool,
  onInstalled 
}: MCPServerInstallDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<MCPRegistryEntry | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [isInstalling, setIsInstalling] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);

  

  const handleSelectEntry = (entry: MCPRegistryEntry) => {
    setSelectedEntry(entry);
    setConfigValues({});
    setInstallError(null);
  };

  const handleInstall = async () => {
    if (!selectedEntry) return;
    
    setIsInstalling(true);
    setInstallError(null);
    
    try {
      // Validate required fields
      if (selectedEntry.requirements) {
        for (const req of selectedEntry.requirements) {
          if (!configValues[req]) {
            throw new Error(`${req} is required`);
          }
        }
      }
      
      if (selectedEntry.env) {
        for (const key of Object.keys(selectedEntry.env)) {
          if (!configValues[key]) {
            throw new Error(`${key} environment variable is required`);
          }
        }
      }
      
      await mcpConfigManager.addServer(tool, selectedEntry, configValues);
      onInstalled();
      onClose();
    } catch (error) {
      setInstallError(error instanceof Error ? error.message : 'Installation failed');
    } finally {
      setIsInstalling(false);
    }
  };

  const renderConfigForm = () => {
    if (!selectedEntry) return null;
    
    const fields: JSX.Element[] = [];
    
    // Requirements fields
    if (selectedEntry.requirements) {
      for (const req of selectedEntry.requirements) {
        fields.push(
          <div key={req} className="space-y-2">
            <label className="text-sm font-medium capitalize">
              {req.replace(/([A-Z])/g, ' $1').trim()}
            </label>
            <Input
              placeholder={`Enter ${req}...`}
              value={configValues[req] || ''}
              onChange={(e) => setConfigValues(prev => ({ ...prev, [req]: e.target.value }))}
            />
          </div>
        );
      }
    }
    
    // Environment variable fields
    if (selectedEntry.env) {
      for (const [key, defaultValue] of Object.entries(selectedEntry.env)) {
        fields.push(
          <div key={key} className="space-y-2">
            <label className="text-sm font-medium">{key}</label>
            <Input
              type="password"
              placeholder={defaultValue || `Enter ${key}...`}
              value={configValues[key] || ''}
              onChange={(e) => setConfigValues(prev => ({ ...prev, [key]: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              This will be stored in your tool's configuration
            </p>
          </div>
        );
      }
    }
    
    return fields.length > 0 ? (
      <div className="space-y-4 mt-4">
        <Separator />
        <h4 className="font-medium">Configuration</h4>
        {fields}
      </div>
    ) : null;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Add MCP Server</DialogTitle>
          <DialogDescription>
            Install MCP servers to extend {tool.name} with new capabilities
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search */}
          {!selectedEntry && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search MCP servers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          )}
          
          {/* Server List or Config Form */}
          {!selectedEntry ? (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {mcpConfigManager.searchRegistry(searchQuery).map(entry => (
                  <Card
                    key={entry.id}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleSelectEntry(entry)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <span className={cn("p-2 rounded-lg", getMCPColorClass(entry.id))}>
                          {getMCPIconComponent(entry.id, 24)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{entry.name}</h4>
                            {entry.publisher === 'Anthropic' && (
                              <Badge variant="secondary" className="text-xs">Official</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {entry.description}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {entry.tags.map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          {entry.npmPackage && (
                            <p className="text-xs text-muted-foreground mt-2 font-mono">
                              {entry.npmPackage}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {mcpConfigManager.searchRegistry(searchQuery).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No MCP servers found matching "{searchQuery}"
                  </div>
                )}
              </div>
            </ScrollArea>
          ) : (
            <div>
              {/* Selected Entry Details */}
              <div className="flex items-start gap-4">
                <span className="text-4xl">{selectedEntry.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{selectedEntry.name}</h3>
                    {selectedEntry.publisher === 'Anthropic' && (
                      <Badge variant="secondary">Official</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-1">
                    {selectedEntry.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedEntry.tags.map(tag => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Config Form */}
              {renderConfigForm()}
              
              {/* Error */}
              {installError && (
                <div className="flex items-center gap-2 text-sm text-red-500 mt-4">
                  <AlertCircle className="h-4 w-4" />
                  {installError}
                </div>
              )}
              
              {/* Actions */}
              <div className="flex justify-end gap-2 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedEntry(null)}
                  disabled={isInstalling}
                >
                  Back
                </Button>
                <Button 
                  onClick={handleInstall}
                  disabled={isInstalling}
                >
                  {isInstalling ? (
                    <>
                      <Download className="h-4 w-4 mr-2 animate-bounce" />
                      Installing...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Install for {tool.name}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
