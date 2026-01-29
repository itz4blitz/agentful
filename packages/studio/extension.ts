import * as vscode from 'vscode';
import { StudioPanelProvider } from './vscode/studio-panel';

let studioPanelProvider: StudioPanelProvider;

export function activate(context: vscode.ExtensionContext) {
  console.log('agentful Studio is now active!');

  // Create the studio panel provider
  studioPanelProvider = new StudioPanelProvider(context);

  // Register the command to open the studio
  let disposable = vscode.commands.registerCommand('agentful.studio.open', () => {
    studioPanelProvider.show();
  });

  context.subscriptions.push(disposable);

  // Also open studio automatically on activation (optional)
  // studioPanelProvider.show();
}

export function deactivate() {
  studioPanelProvider?.dispose();
}
