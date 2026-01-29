import * as vscode from 'vscode';
import { getWebviewOptions } from './webview/get-webview-options';
import { getWebviewContent } from './webview/get-webview-content';
import { setupWebviewMessaging } from './webview/message-handler';

export class StudioPanelProvider {
  private static readonly viewType = 'agentful.studio.panel';
  private panel: vscode.WebviewPanel | undefined;
  private disposables: vscode.Disposable[] = [];

  constructor(private readonly context: vscode.ExtensionContext) {}

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

    // Handle messages from the webview
    setupWebviewMessaging(this.panel.webview, this.context);

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
}
