import * as vscode from 'vscode';
import { ClerkAuthService } from './clerk-service';

export class ClerkOAuthHandler {
  private authPanel: vscode.WebviewPanel | undefined;
  private resolveAuthPromise: ((value: boolean) => void) | undefined;

  constructor(
    private clerkService: ClerkAuthService,
    private context: vscode.ExtensionContext
  ) {}

  /**
   * Start the OAuth flow by showing a webview panel
   */
  async authenticate(): Promise<boolean> {
    return new Promise((resolve) => {
      this.resolveAuthPromise = resolve;

      // Create or show the auth panel
      if (this.authPanel) {
        this.authPanel.reveal();
        return;
      }

      this.authPanel = vscode.window.createWebviewPanel(
        'agentful.auth',
        'Sign in with Clerk',
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          localResourceRoots: [],
          retainContextWhenHidden: true
        }
      );

      // Set the webview HTML content
      this.authPanel.webview.html = this.getAuthWebviewContent();

      // Handle messages from the webview
      this.authPanel.webview.onDidReceiveMessage(
        async (message) => {
          switch (message.command) {
            case 'auth-success':
              await this.clerkService.saveToken(
                message.token,
                message.userId,
                message.expiresIn || 3600
              );
              vscode.window.showInformationMessage('Successfully signed in!');
              this.authPanel?.dispose();
              this.resolveAuthPromise?.(true);
              break;

            case 'auth-error':
              vscode.window.showErrorMessage(`Authentication failed: ${message.error}`);
              this.authPanel?.dispose();
              this.resolveAuthPromise?.(false);
              break;

            case 'auth-cancel':
              this.authPanel?.dispose();
              this.resolveAuthPromise?.(false);
              break;
          }
        },
        undefined,
        this.context.subscriptions
      );

      // Clean up when panel is disposed
      this.authPanel.onDidDispose(() => {
        this.authPanel = undefined;
        if (this.resolveAuthPromise) {
          this.resolveAuthPromise(false);
          this.resolveAuthPromise = undefined;
        }
      });
    });
  }

  /**
   * Get the HTML content for the auth webview
   */
  private getAuthWebviewContent(): string {
    const publishableKey = this.clerkService.getPublishableKey();
    const clerkApiUrl = this.clerkService.getClerkApiUrl() || 'https://clerk.agentful.app';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in - agentful</title>
  <script
    async
    crossorigin="anonymous"
    data-clerk-publishable-key="${publishableKey}"
    src="${clerkApiUrl}/npm/@clerk/clerk-js@5/dist/clerk.browser.js"
    onload="window.ClerkLoaded = true"
  ></script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      margin: 0;
      padding: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #1e1e1e;
      color: #ffffff;
    }
    #container {
      width: 100%;
      max-width: 400px;
    }
    #loading {
      text-align: center;
      padding: 40px;
      font-size: 16px;
    }
    #clark-mount {
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div id="container">
    <div id="loading">Loading authentication...</div>
    <div id="clark-mount"></div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    let clerk;

    async function initClerk() {
      try {
        const publishableKey = "${publishableKey}";
        const clerkApiUrl = "${clerkApiUrl}";

        if (window.Clerk) {
          clerk = new window.Clerk(publishableKey, {
            proxyUrl: clerkApiUrl
          });

          await clerk.load();

          if (clerk.user) {
            // User is already signed in
            const token = await clerk.session?.getToken();
            if (token) {
              vscode.postMessage({
                command: 'auth-success',
                token: token,
                userId: clerk.user.id,
                expiresIn: clerk.session?.expireInSeconds || 3600
              });
              return;
            }
          }

          // Show sign-in component
          document.getElementById('loading').style.display = 'none';
          clerk.mountSignIn(document.getElementById('clark-mount'), {
            afterSignInUrl: '', // Stay on same page
            signUpUrl: '' // Stay on same page for signup
          });

          // Listen for sign-in completion
          clerk.addListener('session', async (event) => {
            if (event.user) {
              const token = await event.session?.getToken();
              if (token) {
                vscode.postMessage({
                  command: 'auth-success',
                  token: token,
                  userId: event.user.id,
                  expiresIn: event.session?.expireInSeconds || 3600
                });
              }
            }
          });
        }
      } catch (error) {
        console.error('Clerk initialization error:', error);
        document.getElementById('loading').innerHTML = 'Failed to load authentication. Please try again.';
        vscode.postMessage({
          command: 'auth-error',
          error: error.message
        });
      }
    }

    // Initialize Clerk when the page loads
    window.addEventListener('load', initClerk);
  </script>
</body>
</html>`;
  }
}
