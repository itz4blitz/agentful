import * as vscode from 'vscode';
import { WebViewProvider } from './src/vscode/WebViewProvider';

export function activate(context: vscode.ExtensionContext) {
  console.log('Agentful Studio extension is now active!');

  // Register the WebViewProvider
  const provider = new WebViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'agentfulStudioView',
      provider
    )
  );

  // Register command to open the studio
  const openStudioCommand = vscode.commands.registerCommand(
    'agentful.openStudio',
    () => {
      vscode.commands.executeCommand('agentfulStudioView.focus');
    }
  );

  context.subscriptions.push(openStudioCommand);
}

export function deactivate() {
  console.log('Agentful Studio extension is now deactivated!');
}
