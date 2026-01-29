/**
 * Integration Hub
 * Main panel for managing coding CLI tools, MCPs, skills, and agents
 */

import { useState, useEffect } from 'react';
import { 
  Terminal, Package, Puzzle, Bot, Settings, 
  ExternalLink, RefreshCw, Sparkles, Bug 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ToolSelector } from './tool-selector';
import { MCPServerList } from './mcp-server-list';
import { toolDetection, type CLITool } from '@/services/integrations/tool-detection';
import { cn } from '@/lib/utils';

export function IntegrationHub() {
  const [selectedTool, setSelectedTool] = useState<CLITool | null>(null);
  const [detectedTools, setDetectedTools] = useState<CLITool[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [manualMode, setManualMode] = useState(false);

  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    setIsLoading(true);
    setDebugLogs(prev => [...prev, '🔍 Starting tool detection...']);
    try {
      const tools = await toolDetection.detectInstalledTools();
      console.log('[IntegrationHub] Detected tools:', tools);
      setDebugLogs(prev => [...prev, `✅ Detection complete. Found ${tools.length} tools:`]);
      tools.forEach(t => {
        setDebugLogs(prev => [...prev, `   - ${t.name} ${t.version ? `v${t.version}` : ''} at ${t.installPath || 'unknown'}`]);
      });
      setDetectedTools(tools);
      
      // Auto-select first tool if none selected
      if (!selectedTool && tools.length > 0) {
        setSelectedTool(tools[0]);
      }
    } catch (error) {
      console.error('[IntegrationHub] Error loading tools:', error);
      setDebugLogs(prev => [...prev, `❌ Error: ${error}`]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenToolConfig = () => {
    if (!selectedTool) return;
    
    // Open tool config file in VS Code
    if (typeof acquireVsCodeApi !== 'undefined') {
      const vscode = acquireVsCodeApi();
      vscode.postMessage({
        command: 'openFile',
        path: selectedTool.configPath,
      });
    }
  };

  const handleOpenToolDocs = () => {
    if (!selectedTool) return;
    
    const docsUrls: Record<string, string> = {
      claude: 'https://docs.anthropic.com/en/docs/agents-and-tools/claude-code',
      gemini: 'https://ai.google.dev/gemini-api/docs/cli',
      codex: 'https://platform.openai.com/docs/codex',
      kiro: 'https://kiro.dev/docs',
      cursor: 'https://cursor.com/docs',
      roo: 'https://github.com/RooVetGit/Roo-Code',
    };
    
    const url = docsUrls[selectedTool.id];
    if (url && typeof acquireVsCodeApi !== 'undefined') {
      const vscode = acquireVsCodeApi();
      vscode.postMessage({
        command: 'openExternal',
        url,
      });
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Integration Hub
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage coding tools, MCPs, and extensions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowDebug(!showDebug)}
            className={showDebug ? 'text-primary' : ''}
          >
            <Bug className="h-4 w-4 mr-1" />
            Debug
          </Button>
          <Button variant="outline" size="sm" onClick={loadTools}>
            <RefreshCw className={cn("h-4 w-4 mr-1", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Debug Panel */}
        {showDebug && (
          <Card className="mb-4 border-yellow-500/50 bg-yellow-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Bug className="h-4 w-4" />
                Debug Output
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black/90 rounded p-3 font-mono text-xs text-green-400 h-48 overflow-auto">
                {debugLogs.length === 0 ? (
                  <p className="text-muted-foreground">No logs yet. Click Refresh to scan.</p>
                ) : (
                  debugLogs.map((log, i) => (
                    <div key={i} className="whitespace-pre-wrap">{log}</div>
                  ))
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Check the "agentful Tools" output channel in VS Code for detailed logs.
              </p>
            </CardContent>
          </Card>
        )}

        {detectedTools.length === 0 ? (
          <div className="space-y-4">
            <Card>
              <CardContent className="py-8 text-center">
                <Terminal className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Coding Tools Detected</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  We couldn't find Claude Code, Gemini CLI, or other supported tools automatically.
                </p>
                <div className="flex justify-center gap-2 mb-4">
                  <Button variant="outline" onClick={loadTools}>
                    <RefreshCw className={cn("h-4 w-4 mr-1", isLoading && "animate-spin")} />
                    Scan Again
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setManualMode(!manualMode)}
                  >
                    {manualMode ? 'Hide Manual Setup' : 'Manual Setup'}
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground space-y-2">
                  <p>Make sure tools are installed and in your PATH.</p>
                  <div className="bg-muted rounded p-2 text-left">
                    <p className="font-medium mb-1">Quick checks:</p>
                    <code className="block text-[10px]">which claude</code>
                    <code className="block text-[10px]">which gemini</code>
                    <code className="block text-[10px]">echo $PATH</code>
                  </div>
                  <p>Common install locations:</p>
                  <ul className="list-disc list-inside text-[10px]">
                    <li>npm global: ~/.npm-global/bin</li>
                    <li>Homebrew (Apple Silicon): /opt/homebrew/bin</li>
                    <li>Homebrew (Intel): /usr/local/bin</li>
                    <li>pnpm: ~/Library/pnpm</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {manualMode && (
              <ManualToolSetup 
                onToolAdded={(tool) => {
                  setDetectedTools([tool]);
                  setSelectedTool(tool);
                  setManualMode(false);
                }} 
              />
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tool Selector */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Active Tool</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ToolSelector
                  selectedTool={selectedTool?.id}
                  onSelectTool={setSelectedTool}
                />
                
                {selectedTool && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between text-sm">
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Config Location</p>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {selectedTool.configPath}
                        </code>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleOpenToolConfig}
                        >
                          <Settings className="h-3 w-3 mr-1" />
                          Edit Config
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleOpenToolDocs}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Docs
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {selectedTool && (
              <Tabs defaultValue="mcp" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="mcp" className="flex items-center gap-1">
                    <Puzzle className="h-3 w-3" />
                    MCP
                  </TabsTrigger>
                  <TabsTrigger value="skills" className="flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    Skills
                  </TabsTrigger>
                  <TabsTrigger value="agents" className="flex items-center gap-1">
                    <Bot className="h-3 w-3" />
                    Agents
                  </TabsTrigger>
                  <TabsTrigger value="hooks" className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Hooks
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="mcp" className="mt-4">
                  <MCPServerList tool={selectedTool} />
                </TabsContent>

                <TabsContent value="skills" className="mt-4">
                  <Card>
                    <CardContent className="py-8 text-center">
                      <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">Skills Marketplace</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        1-click install skills for {selectedTool.name}
                      </p>
                      <Badge variant="secondary">Coming Soon</Badge>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="agents" className="mt-4">
                  <Card>
                    <CardContent className="py-8 text-center">
                      <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">Agent Registry</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Discover and install specialized agents
                      </p>
                      <Badge variant="secondary">Coming Soon</Badge>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="hooks" className="mt-4">
                  <Card>
                    <CardContent className="py-8 text-center">
                      <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">Hooks Library</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Pre-built hooks and integrations
                      </p>
                      <Badge variant="secondary">Coming Soon</Badge>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Manual tool setup component for when auto-detection fails
function ManualToolSetup({ onToolAdded }: { onToolAdded: (tool: CLITool) => void }) {
  const [selectedTool, setSelectedTool] = useState<string>('claude');
  const [installPath, setInstallPath] = useState('');
  const [version, setVersion] = useState('');

  const toolOptions = [
    { id: 'claude', name: 'Claude Code', configPath: '~/.claude/settings.json' },
    { id: 'gemini', name: 'Gemini CLI', configPath: '~/.gemini/config.json' },
    { id: 'codex', name: 'Codex CLI', configPath: '~/.config/codex/config.json' },
    { id: 'kiro', name: 'Kiro CLI', configPath: '~/.kiro/config.yaml' },
    { id: 'cursor', name: 'Cursor', configPath: '.cursor/mcp.json' },
    { id: 'roo', name: 'Roo Code', configPath: '.vscode/settings.json' },
  ];

  const handleSubmit = () => {
    const toolDef = toolOptions.find(t => t.id === selectedTool);
    if (!toolDef) return;

    const newTool: CLITool = {
      id: toolDef.id as any,
      name: toolDef.name,
      command: toolDef.id === 'roo' ? 'code' : toolDef.id,
      configPath: toolDef.configPath,
      mcpFormat: toolDef.id as any,
      version: version || undefined,
      isInstalled: true,
      isRunning: false,
      installPath: installPath || toolDef.id,
      lastDetected: new Date(),
    };

    onToolAdded(newTool);
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Manual Tool Setup</CardTitle>
        <CardDescription>
          Manually specify tool location if auto-detection failed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Tool</label>
          <select 
            className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            value={selectedTool}
            onChange={(e) => setSelectedTool(e.target.value)}
          >
            {toolOptions.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Install Path (optional)</label>
          <input
            type="text"
            placeholder="e.g., /usr/local/bin/claude or leave empty"
            className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            value={installPath}
            onChange={(e) => setInstallPath(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Path to the executable. Leave empty if it's in your PATH.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Version (optional)</label>
          <input
            type="text"
            placeholder="e.g., 0.2.14"
            className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
          />
        </div>

        <Button onClick={handleSubmit} className="w-full">
          Add Tool
        </Button>
      </CardContent>
    </Card>
  );
}
