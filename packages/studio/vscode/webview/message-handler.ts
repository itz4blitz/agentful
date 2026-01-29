import * as vscode from 'vscode';

export function setupWebviewMessaging(webview: vscode.Webview, context: vscode.ExtensionContext) {
  webview.onDidReceiveMessage(
    async (message) => {
      switch (message.command) {
        case 'alert':
          vscode.window.showErrorMessage(message.text);
          return;
        case 'info':
          vscode.window.showInformationMessage(message.text);
          return;
        case 'getAuthToken':
          // Handle Clerk auth token request
          const token = context.globalState.get('agentful.authToken');
          webview.postMessage({ command: 'authToken', token });
          return;
        case 'setAuthToken':
          // Store Clerk auth token
          await context.globalState.update('agentful.authToken', message.token);
          vscode.window.showInformationMessage('Successfully authenticated with agentful');
          return;
        case 'openFile':
          // Open a file in the editor
          const uri = vscode.Uri.file(message.path);
          const doc = await vscode.workspace.openTextDocument(uri);
          await vscode.window.showTextDocument(doc);
          return;
      }
    },
    undefined,
    context.subscriptions
  );
}
