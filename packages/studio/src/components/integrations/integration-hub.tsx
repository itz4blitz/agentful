/**
 * Integration Hub
 * Main panel for managing coding CLI tools, MCPs, skills, and agents
 */

import { useState, useEffect } from 'react';
import {
  Terminal, Package, Puzzle, Bot, Settings,
  ExternalLink, RefreshCw, Sparkles, Bug, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ToolSelector } from './tool-selector';
import { MCPServerList } from './mcp-server-list';
import { ToolCapabilityBadges } from './tool-capability-badges';
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
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Supported Features</p>
                        <ToolCapabilityBadges
                          supports={selectedTool.supports}
                          size="md"
                          showLabels={true}
                        />
                      </div>
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
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {selectedTool && (() => {
              // Calculate which features are supported
              const supports = selectedTool.supports || {};
              const hasMCP = supports.mcp;
              const hasSkills = supports.skills;
              const hasAgents = supports.agents;
              const hasHooks = supports.hooks;

              const supportedFeatures = [
                hasMCP && 'mcp',
                hasSkills && 'skills',
                hasAgents && 'agents',
                hasHooks && 'hooks',
              ].filter(Boolean) as string[];

              const hasAnyFeature = supportedFeatures.length > 0;
              const defaultTab = supportedFeatures[0] || 'mcp';

              // If no features supported, show helpful message
              if (!hasAnyFeature) {
                return (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>No Extension Support</AlertTitle>
                    <AlertDescription>
                      This tool doesn't support extensions yet.
                    </AlertDescription>
                  </Alert>
                );
              }

              // Calculate grid columns based on number of supported features
              const gridCols = supportedFeatures.length;

              return (
                <Tabs defaultValue={defaultTab} className="w-full">
                  <TabsList className={cn("grid w-full", `grid-cols-${gridCols}`)}>
                    {hasMCP && (
                      <TabsTrigger value="mcp" className="flex items-center gap-1">
                        <Puzzle className="h-3 w-3" />
                        MCP
                      </TabsTrigger>
                    )}
                    {hasSkills && (
                      <TabsTrigger value="skills" className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        Skills
                      </TabsTrigger>
                    )}
                    {hasAgents && (
                      <TabsTrigger value="agents" className="flex items-center gap-1">
                        <Bot className="h-3 w-3" />
                        Agents
                      </TabsTrigger>
                    )}
                    {hasHooks && (
                      <TabsTrigger value="hooks" className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        Hooks
                      </TabsTrigger>
                    )}
                  </TabsList>

                  {hasMCP && (
                    <TabsContent value="mcp" className="mt-4">
                      <MCPServerList tool={selectedTool} />
                    </TabsContent>
                  )}

                  {hasSkills && (
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
                  )}

                  {hasAgents && (
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
                  )}

                  {hasHooks && (
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
                  )}
                </Tabs>
              );
            })()}
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
  const [configValidation, setConfigValidation] = useState<{
    exists: boolean | null;
    expandedPath: string;
    isLoading: boolean;
  }>({
    exists: null,
    expandedPath: '',
    isLoading: false,
  });

  const toolOptions = [
    {
      id: 'claude',
      name: 'Claude Code',
      configPath: '~/.claude.json',
      supports: { mcp: true, skills: false, agents: false, hooks: true }
    },
    {
      id: 'gemini',
      name: 'Gemini CLI',
      configPath: '~/.gemini/settings.json',
      supports: { mcp: true, skills: true, agents: true, hooks: true }
    },
    {
      id: 'codex',
      name: 'Codex CLI',
      configPath: '~/.codex/config.toml',
      supports: { mcp: true, skills: true, agents: true, hooks: false }
    },
    {
      id: 'kiro',
      name: 'Kiro CLI',
      configPath: '~/.kiro/settings/mcp.json',
      supports: { mcp: true, skills: true, agents: true, hooks: true }
    },
    {
      id: 'cursor',
      name: 'Cursor',
      configPath: '.cursor/mcp.json',
      supports: { mcp: true, skills: true, agents: true, hooks: true }
    },
    {
      id: 'cline',
      name: 'Cline',
      configPath: 'cline_mcp_settings.json',
      supports: { mcp: true, skills: false, agents: false, hooks: false }
    },
  ];

  const selectedToolData = toolOptions.find(t => t.id === selectedTool);

  // Validate config path when tool is selected
  useEffect(() => {
    const validateConfig = async () => {
      const toolDef = toolOptions.find(t => t.id === selectedTool);
      if (!toolDef) return;

      setConfigValidation(prev => ({ ...prev, isLoading: true }));

      if (typeof acquireVsCodeApi !== 'undefined') {
        const vscode = acquireVsCodeApi();

        // Set up one-time listener for validation result
        const handler = (event: MessageEvent) => {
          const message = event.data;
          if (message.command === 'configPathValidated' && message.toolId === selectedTool) {
            setConfigValidation({
              exists: message.exists,
              expandedPath: message.expandedPath,
              isLoading: false,
            });
            window.removeEventListener('message', handler);
          }
        };
        window.addEventListener('message', handler);

        // Request validation
        vscode.postMessage({
          command: 'validateConfigPath',
          toolId: selectedTool,
          configPath: toolDef.configPath,
        });
      } else {
        // Not in VS Code, skip validation
        setConfigValidation({
          exists: null,
          expandedPath: toolDef.configPath,
          isLoading: false,
        });
      }
    };

    validateConfig();
  }, [selectedTool]);

  const handleCreateConfig = () => {
    const toolDef = toolOptions.find(t => t.id === selectedTool);
    if (!toolDef) return;

    if (typeof acquireVsCodeApi !== 'undefined') {
      const vscode = acquireVsCodeApi();

      // Set up one-time listener for creation result
      const handler = (event: MessageEvent) => {
        const message = event.data;
        if (message.command === 'configFileCreated' && message.toolId === selectedTool) {
          if (message.success) {
            setConfigValidation({
              exists: true,
              expandedPath: message.expandedPath,
              isLoading: false,
            });
          }
          window.removeEventListener('message', handler);
        }
      };
      window.addEventListener('message', handler);

      // Request config creation
      vscode.postMessage({
        command: 'createConfigFile',
        toolId: selectedTool,
        configPath: toolDef.configPath,
      });
    }
  };

  const handleSubmit = () => {
    const toolDef = toolOptions.find(t => t.id === selectedTool);
    if (!toolDef) return;

    // Don't allow submission if config doesn't exist
    if (configValidation.exists === false) {
      return;
    }

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
      description: '',
      website: '',
      supports: toolDef.supports,
    };

    onToolAdded(newTool);
  };

  const canSubmit = configValidation.exists !== false;

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
          {selectedToolData && (
            <div className="pt-2">
              <p className="text-xs text-muted-foreground mb-2">Supported Features</p>
              <ToolCapabilityBadges
                supports={selectedToolData.supports}
                size="md"
                showLabels={true}
              />
            </div>
          )}
        </div>

        {/* Config Path Validation */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Config File</label>
          <div className="flex items-center gap-2 p-2 rounded-md border bg-muted/50">
            {configValidation.isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Validating...</span>
              </>
            ) : configValidation.exists === true ? (
              <>
                <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center">
                  <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-xs text-green-700 dark:text-green-400 font-mono flex-1 truncate" title={configValidation.expandedPath}>
                  {configValidation.expandedPath}
                </span>
              </>
            ) : configValidation.exists === false ? (
              <>
                <div className="h-4 w-4 rounded-full bg-yellow-500 flex items-center justify-center">
                  <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-yellow-700 dark:text-yellow-400 font-mono truncate" title={configValidation.expandedPath || selectedToolData?.configPath}>
                    {configValidation.expandedPath || selectedToolData?.configPath}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Config file not found</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={handleCreateConfig}
                >
                  Create
                </Button>
              </>
            ) : (
              <>
                <div className="h-4 w-4 rounded-full bg-muted-foreground/50 flex items-center justify-center">
                  <svg className="h-3 w-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-xs text-muted-foreground">
                  {selectedToolData?.configPath}
                </span>
              </>
            )}
          </div>
          {configValidation.exists === false && (
            <p className="text-xs text-muted-foreground">
              The config file doesn't exist. Click "Create" to generate it, or create it manually.
            </p>
          )}
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

        <Button
          onClick={handleSubmit}
          className="w-full"
          disabled={!canSubmit || configValidation.isLoading}
        >
          {configValidation.isLoading ? 'Validating...' : 'Add Tool'}
        </Button>

        {!canSubmit && (
          <p className="text-xs text-destructive text-center">
            Please fix config file issue before adding tool
          </p>
        )}
      </CardContent>
    </Card>
  );
}
