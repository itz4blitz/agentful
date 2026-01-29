import * as vscode from 'vscode';
import { ClerkAuthService } from '../auth/clerk-service';

export function setupWebviewMessaging(
  webview: vscode.Webview,
  context: vscode.ExtensionContext,
  clerkService: ClerkAuthService
) {
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
          const tokenData = await clerkService.getToken();
          webview.postMessage({
            command: 'authToken',
            token: tokenData?.token || null,
            userId: tokenData?.userId || null,
            isAuthenticated: tokenData !== null
          });
          return;
        case 'setAuthToken':
          // Store Clerk auth token (from webview)
          await clerkService.saveToken(message.token, message.userId, message.expiresIn || 3600);
          vscode.window.showInformationMessage('Successfully authenticated with agentful');
          // Notify the webview of successful auth
          webview.postMessage({ command: 'authSuccess', userId: message.userId });
          return;
        case 'clearAuthToken':
          // Clear auth token (logout)
          await clerkService.clearToken();
          vscode.window.showInformationMessage('Signed out of agentful');
          webview.postMessage({ command: 'authCleared' });
          return;
        case 'openFile':
          // Open a file in the editor
          const uri = vscode.Uri.file(message.path);
          const doc = await vscode.workspace.openTextDocument(uri);
          await vscode.window.showTextDocument(doc);
          return;
        case 'triggerAuth':
          // Trigger the OAuth flow
          const { ClerkOAuthHandler } = await import('../auth/oauth-handler');
          const oauthHandler = new ClerkOAuthHandler(clerkService, context);
          const success = await oauthHandler.authenticate();
          // Notify webview of auth result
          webview.postMessage({
            command: 'authComplete',
            success,
            isAuthenticated: await clerkService.isAuthenticated()
          });
          return;
      }
    },
    undefined,
    context.subscriptions
  );
}
