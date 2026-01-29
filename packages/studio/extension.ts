import * as vscode from 'vscode';
import { StudioSidebarProvider } from './vscode/studio-sidebar';
import { getWebviewContent } from './vscode/webview/get-webview-content';
import { ComponentFileWatcher } from './vscode/component-file-watcher';
import { ToolIntegrationService } from './vscode/tool-integration';

let panel: vscode.WebviewPanel | undefined;
let outputChannel: vscode.OutputChannel;
let sidebarProvider: StudioSidebarProvider | undefined;
let fileWatcher: ComponentFileWatcher | undefined;
let toolIntegration: ToolIntegrationService | undefined;

export function activate(context: vscode.ExtensionContext) {
  try {
    // Create output channel
    outputChannel = vscode.window.createOutputChannel('agentful Studio');
    outputChannel.appendLine('========================================');
    outputChannel.appendLine('agentful Studio ACTIVATION STARTING');
    outputChannel.appendLine('========================================');

    // Show notification
    vscode.window.showInformationMessage('🚀 agentful Studio extension loaded!');
    outputChannel.show(true);

    // Initialize file watcher
    fileWatcher = new ComponentFileWatcher(context, outputChannel);
    
    // Initialize tool integration
    toolIntegration = new ToolIntegrationService(context);

    // Create sidebar provider
    outputChannel.appendLine('Creating StudioSidebarProvider...');
    sidebarProvider = new StudioSidebarProvider(context, (message) => {
      outputChannel.appendLine(`Sidebar message received: ${JSON.stringify(message)}`);
      
      switch (message.command) {
        case 'themeChanged':
          broadcastToAllWebviews(message, 'sidebar');
          break;
        case 'scanComponents':
          handleScanComponents();
          break;
        case 'readComponent':
          handleReadComponent(message.filePath, message.requestId);
          break;
        case 'watchComponents':
          if (sidebarProvider?.getWebview()) {
            fileWatcher?.watch(sidebarProvider.getWebview()!);
          }
          break;
        case 'detectTools':
        case 'getToolStatus':
        case 'readMCPConfig':
        case 'writeMCPConfig':
        case 'openFile':
        case 'openExternal':
          if (sidebarProvider?.getWebview()) {
            toolIntegration?.handleMessage(message, sidebarProvider.getWebview()!.webview);
          }
          break;
        case 'reloadWebview':
          vscode.commands.executeCommand('agentful.studio.reloadWebview');
          break;
      }
    });
    
    // Register sidebar
    outputChannel.appendLine('Registering webview view provider...');
    const registration = vscode.window.registerWebviewViewProvider(
      'agentful.studio.sidebar', 
      sidebarProvider,
      {
        webviewOptions: {
          retainContextWhenHidden: true
        }
      }
    );
    context.subscriptions.push(registration);
    outputChannel.appendLine('✓ Webview view provider registered');

    // Register commands
    outputChannel.appendLine('Registering commands...');
    
    const openCommand = vscode.commands.registerCommand('agentful.studio.open', () => {
      outputChannel.appendLine('agentful.studio.open command executed');
      openStudioPanel(context);
    });
    
    const openIntegrationHubCommand = vscode.commands.registerCommand('agentful.studio.openIntegrationHub', () => {
      outputChannel.appendLine('agentful.studio.openIntegrationHub command executed');
      openStudioPanel(context, '/integrations');
    });

    const rescanCommand = vscode.commands.registerCommand('agentful.studio.rescanComponents', async () => {
      outputChannel.appendLine('Rescanning components...');
      const files = await fileWatcher?.scanForComponents();
      vscode.window.showInformationMessage(`Found ${files?.length || 0} components`);
    });

    const reloadCommand = vscode.commands.registerCommand('agentful.studio.reloadWebview', async () => {
      outputChannel.appendLine('Reloading webview...');
      
      // Reload sidebar
      if (sidebarProvider) {
        sidebarProvider.refresh();
        outputChannel.appendLine('Sidebar refreshed');
      }
      
      // Reload panel if open
      if (panel) {
        const html = getWebviewContent(panel.webview, context.extensionUri);
        panel.webview.html = html;
        outputChannel.appendLine('Panel refreshed');
      }
      
      vscode.window.showInformationMessage('Agentful Studio webviews reloaded');
    });

    // Setup hot reload in development mode
    const isDevMode = context.extensionMode === vscode.ExtensionMode.Development;
    if (isDevMode) {
      outputChannel.appendLine('🔥 Hot reload enabled (development mode)');
      
      // Watch dist folder for changes
      const distWatcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(context.extensionUri, 'dist/assets/*.{js,css}')
      );
      
      let reloadTimeout: NodeJS.Timeout | undefined;
      
      const triggerReload = () => {
        // Debounce reloads
        if (reloadTimeout) clearTimeout(reloadTimeout);
        reloadTimeout = setTimeout(() => {
          outputChannel.appendLine('🔄 Assets changed, reloading webviews...');
          vscode.commands.executeCommand('agentful.studio.reloadWebview');
        }, 300);
      };
      
      distWatcher.onDidChange(triggerReload);
      distWatcher.onDidCreate(triggerReload);
      
      context.subscriptions.push(distWatcher);
    }

    context.subscriptions.push(openCommand, openIntegrationHubCommand, rescanCommand, reloadCommand);
    context.subscriptions.push(outputChannel);

    outputChannel.appendLine('========================================');
    outputChannel.appendLine('agentful Studio ACTIVATION COMPLETE');
    outputChannel.appendLine('========================================');
  } catch (error: any) {
    console.error('ERROR activating agentful Studio:', error);
    vscode.window.showErrorMessage(`agentful Studio activation error: ${error?.message || error}`);
  }
}

function openStudioPanel(context: vscode.ExtensionContext, route?: string) {
  outputChannel.appendLine(`openStudioPanel called${route ? ` with route: ${route}` : ''}`);

  if (panel) {
    outputChannel.appendLine('Panel exists, revealing it');
    panel.reveal(vscode.ViewColumn.Active);
    // Navigate to route if provided
    if (route) {
      panel.webview.postMessage({ command: 'navigate', route });
    }
    return;
  }

  outputChannel.appendLine('Creating new panel');
  panel = vscode.window.createWebviewPanel(
    'agentful.studio',
    'agentful studio',
    vscode.ViewColumn.Active,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [
        vscode.Uri.joinPath(context.extensionUri, 'dist'),
        vscode.Uri.joinPath(context.extensionUri, 'dist', 'assets'),
      ]
    }
  );

  // Set HTML with optional initial route
  const html = getWebviewContent(panel.webview, context.extensionUri, route);
  outputChannel.appendLine(`Setting panel HTML, length: ${html.length}`);
  panel.webview.html = html;

  // Start watching files for panel
  fileWatcher?.watch(panel);

  // Handle messages from panel
  panel.webview.onDidReceiveMessage(
    async (message) => {
      outputChannel.appendLine(`Panel received message: ${JSON.stringify(message)}`);
      
      switch (message.command) {
        case 'showNotification':
          vscode.window.showInformationMessage(message.text);
          break;
        case 'openFullscreen':
          openStudioPanel(context, message.route);
          break;
        case 'themeChanged':
          broadcastToAllWebviews(message, 'panel');
          break;
        case 'scanComponents':
          handleScanComponents(message.requestId);
          break;
        case 'readComponent':
          handleReadComponent(message.filePath, message.requestId);
          break;
        case 'watchComponents':
          if (panel) {
            fileWatcher?.watch(panel);
          }
          break;
        case 'detectTools':
        case 'getToolStatus':
        case 'readMCPConfig':
        case 'writeMCPConfig':
        case 'openFile':
        case 'openExternal':
          if (panel) {
            toolIntegration?.handleMessage(message, panel.webview);
          }
          break;
      }
    }
  );

  // Handle disposal
  panel.onDidDispose(() => {
    outputChannel.appendLine('Panel disposed');
    panel = undefined;
  });
}

/**
 * Handle scan components request
 */
async function handleScanComponents(requestId?: string) {
  const files = await fileWatcher?.scanForComponents();
  
  const response = {
    command: 'scanComponentsResponse',
    requestId,
    payload: { files },
  };
  
  panel?.webview.postMessage(response);
  sidebarProvider?.postMessage(response);
}

/**
 * Handle read component request
 */
async function handleReadComponent(filePath: string, requestId?: string) {
  const data = await fileWatcher?.readComponent(filePath);
  
  const response = {
    command: 'readComponentResponse',
    requestId,
    payload: data,
  };
  
  panel?.webview.postMessage(response);
  sidebarProvider?.postMessage(response);
}

/**
 * Broadcast message to all webviews
 */
function broadcastToAllWebviews(message: any, sender: 'sidebar' | 'panel'): void {
  outputChannel.appendLine(`Broadcasting from ${sender}: ${JSON.stringify(message)}`);
  
  if (sender !== 'sidebar' && sidebarProvider) {
    outputChannel.appendLine('Broadcasting to sidebar');
    sidebarProvider.postMessage(message);
  }
  
  if (sender !== 'panel' && panel) {
    outputChannel.appendLine('Broadcasting to panel');
    panel.webview.postMessage(message);
  }
}

export function deactivate() {
  outputChannel?.appendLine('agentful Studio deactivating');
  fileWatcher?.dispose();
  panel?.dispose();
  outputChannel?.dispose();
}
