import * as vscode from 'vscode';
import { getWebviewContent } from './webview/get-webview-content';

export class StudioSidebarProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private _outputChannel: vscode.OutputChannel | undefined;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly onMessage?: (message: any) => void
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._view = webviewView;

    this.getLogger().appendLine('========================================');
    this.getLogger().appendLine('resolveWebviewView CALLED');
    this.getLogger().appendLine('========================================');

    // Configure webview options
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, 'dist'),
        vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'assets'),
      ],
    };

    // Set the HTML content - use the full React app for the sidebar
    const html = getWebviewContent(webviewView.webview, this.context.extensionUri);
    this.getLogger().appendLine(`Setting sidebar HTML, length: ${html.length}`);
    webviewView.webview.html = html;
    this.getLogger().appendLine('✓ Sidebar HTML set');

    // Handle visibility changes
    webviewView.onDidChangeVisibility(() => {
      this.getLogger().appendLine(`Sidebar visibility changed: ${webviewView.visible}`);
    });

    // Handle dispose
    webviewView.onDidDispose(() => {
      this.getLogger().appendLine('Sidebar webview disposed');
      this._view = undefined;
    });

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(
      async (message) => {
        this.getLogger().appendLine(`Received message: ${JSON.stringify(message)}`);
        
        switch (message.command) {
          case 'openFullscreen':
            this.getLogger().appendLine('Executing agentful.studio.open command');
            await vscode.commands.executeCommand('agentful.studio.open');
            break;
          case 'showNotification':
            vscode.window.showInformationMessage(message.text);
            break;
          case 'getAuthStatus':
            // Send auth status back to webview
            webviewView.webview.postMessage({
              command: 'authStatus',
              isAuthenticated: false // TODO: Implement actual auth check
            });
            break;
          case 'themeChanged':
            // Forward to extension for broadcasting to other webviews
            this.getLogger().appendLine('Forwarding theme change to extension');
            this.onMessage?.(message);
            break;
        }
      }
    );

    this.getLogger().appendLine('✓ resolveWebviewView complete');
  }

  /**
   * Get the webview view for external access
   */
  public getWebview(): vscode.WebviewView | undefined {
    return this._view;
  }

  private getLogger(): vscode.OutputChannel {
    if (!this._outputChannel) {
      this._outputChannel = vscode.window.createOutputChannel('agentful Studio');
    }
    return this._outputChannel;
  }

  /**
   * Post a message to the sidebar webview
   */
  public postMessage(message: any): void {
    if (this._view) {
      this.getLogger().appendLine(`Posting message to sidebar: ${JSON.stringify(message)}`);
      this._view.webview.postMessage(message);
    } else {
      this.getLogger().appendLine('Cannot post message - sidebar view not available');
    }
  }

  public refresh(): void {
    if (this._view) {
      this._view.webview.html = getWebviewContent(this._view.webview, this.context.extensionUri);
    }
  }

  public dispose(): void {
    this._outputChannel?.dispose();
  }
}
