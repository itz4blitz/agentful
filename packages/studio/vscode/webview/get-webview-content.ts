import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri, initialRoute?: string): string {
  // Read the generated index.html from Vite
  const indexPath = path.join(extensionUri.fsPath, 'dist', 'index.html');

  if (!fs.existsSync(indexPath)) {
    return getErrorHtml('index.html not found. Please run: npm run build');
  }

  let html = fs.readFileSync(indexPath, 'utf-8');

  // Replace script src paths with webview URIs
  // Matches: <script ... src="/assets/..."></script> or <script ... src="/assets/...">
  html = html.replace(/<script\s+([^>]*)src="\/([^"]+)"([^>]*)>/g, (match, beforeSrc, src, afterSrc) => {
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', src));
    return `<script ${beforeSrc}src="${scriptUri}"${afterSrc}>`;
  });

  // Replace link href paths with webview URIs
  // Matches: <link ... href="/assets/..." ...>
  html = html.replace(/<link\s+([^>]*)href="\/([^"]+)"([^>]*)\/?>/g, (match, beforeHref, href, afterHref) => {
    const linkUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', href));
    return `<link ${beforeHref}href="${linkUri}"${afterHref}>`;
  });

  // Also replace favicon and other root-relative links that might have been missed
  html = html.replace(/href="\/([^"]+)"/g, (match, href) => {
    const linkUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', href));
    return `href="${linkUri}"`;
  });

  // Remove crossorigin attribute from script tags (not needed in webview)
  html = html.replace(/\scrossorigin/g, '');

  // Add CSP for webview security
  // Note: Using unsafe-inline for scripts to avoid nonce complexity
  const csp = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src ${webview.cspSource} 'unsafe-eval' 'unsafe-inline'; style-src ${webview.cspSource} 'unsafe-inline'; img-src ${webview.cspSource} https: data: http:; font-src ${webview.cspSource}; connect-src https: http: ws: wss:;">`;

  // Insert CSP after the opening head tag
  html = html.replace('<head>', `<head>${csp}`);

  // Inject initial route script if provided
  if (initialRoute) {
    const routeScript = `
    <script>
      window.__INITIAL_ROUTE__ = '${initialRoute}';
    </script>`;
    html = html.replace('</head>', `${routeScript}</head>`);
  }

  return html;
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

function getErrorHtml(message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Error</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
           padding: 40px; background: #1e1e1e; color: #fff; }
    .error { max-width: 600px; margin: 0 auto; padding: 20px;
             border-left: 4px solid #f44336; background: #2d2d2d; }
    h1 { margin-top: 0; }
  </style>
</head>
<body>
  <div class="error">
    <h1>⚠️ Error Loading agentful Studio</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
}
