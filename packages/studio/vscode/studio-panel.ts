import * as vscode from 'vscode';
import { getWebviewOptions } from './webview/get-webview-options';
import { getWebviewContent } from './webview/get-webview-content';
import { setupWebviewMessaging } from './webview/message-handler';
import { ClerkAuthService } from './auth/clerk-service';

export class StudioPanelProvider {
  private static readonly viewType = 'agentful.studio.panel';
  private panel: vscode.WebviewPanel | undefined;
  private disposables: vscode.Disposable[] = [];
  private clerkService: ClerkAuthService;

  constructor(private readonly context: vscode.ExtensionContext) {
    // Initialize Clerk auth service
    const clerkConfig = this.getClerkConfig();
    this.clerkService = new ClerkAuthService(context, clerkConfig);
  }

  public show() {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it
    if (this.panel) {
      this.panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel
    this.panel = vscode.window.createWebviewPanel(
      StudioPanelProvider.viewType,
      'agentful Studio',
      column || vscode.ViewColumn.One,
      getWebviewOptions(this.context.extensionUri)
    );

    // Set the webview's initial HTML content
    this.panel.webview.html = getWebviewContent(
      this.panel.webview,
      this.context.extensionUri
    );

    // Handle messages from the webview with Clerk service
    setupWebviewMessaging(this.panel.webview, this.context, this.clerkService);

    // Listen for when the panel is disposed
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
  }

  public showFullscreen() {
    // If we already have a panel, show it in the last active column
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.Beside);
      return;
    }

    // Create a new panel that takes up multiple columns for fullscreen effect
    this.panel = vscode.window.createWebviewPanel(
      StudioPanelProvider.viewType,
      'agentful Studio',
      {
        viewColumn: vscode.ViewColumn.One,
        preserveFocus: false
      },
      {
        ...getWebviewOptions(this.context.extensionUri),
        retainContextWhenHidden: true,
        enableFindWidget: false,
        localResourceRoots: [
          vscode.Uri.joinPath(this.context.extensionUri, 'dist'),
          vscode.Uri.joinPath(this.context.extensionUri, 'assets'),
        ]
      }
    );

    // Set the webview's initial HTML content
    this.panel.webview.html = getWebviewContent(
      this.panel.webview,
      this.context.extensionUri
    );

    // Handle messages from the webview with Clerk service
    setupWebviewMessaging(this.panel.webview, this.context, this.clerkService);

    // Make the panel take up more space by revealing it in the next column
    this.panel.reveal(vscode.ViewColumn.Active);

    // Listen for when the panel is disposed
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
  }

  public dispose() {
    this.panel?.dispose();
    this.panel = undefined;

    while (this.disposables.length) {
      const disposable = this.disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  /**
   * Get Clerk configuration from environment or config
   */
  private getClerkConfig() {
    // For now, use environment variables. In production, you'd want to load
    // this from a config file or secret storage
    const publishableKey = process.env.AGENTFUL_CLERK_PUBLISHABLE_KEY ||
                          process.env.VSCODE_CLERK_PUBLISHABLE_KEY ||
                          'pk_test_placeholder'; // Fallback for development

    const clerkApiUrl = process.env.AGENTFUL_CLERK_API_URL ||
                       process.env.VSCODE_CLERK_API_URL;

    return {
      publishableKey,
      clerkApiUrl
    };
  }

  /**
   * Get the Clerk auth service instance
   */
  getClerkService(): ClerkAuthService {
    return this.clerkService;
  }
}
