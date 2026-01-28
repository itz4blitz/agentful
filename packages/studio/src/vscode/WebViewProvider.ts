import * as vscode from 'vscode';

export class WebViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'agentfulStudioView';

  private _view?: vscode.WebviewView;

  constructor(
    private readonly _extensionUri: vscode.Uri
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(
      message => {
        console.log('Received message from webview:', message);
        // Message handling will be implemented later
      },
      undefined
    );
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource};">
  <title>Agentful Studio</title>
</head>
<body>
  <div id="root">
    <h1>Agentful Studio</h1>
    <p>Studio interface will be rendered here.</p>
  </div>
</body>
</html>`;
  }
}
