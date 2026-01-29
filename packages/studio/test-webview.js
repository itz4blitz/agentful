import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

const extensionUri = vscode.Uri.file('/Users/blitz/Development/agentful/packages/studio');
const indexPath = path.join(extensionUri.fsPath, 'dist', 'index.html');

console.log('Extension URI:', extensionUri.fsPath);
console.log('Index path:', indexPath);
console.log('Index exists:', fs.existsSync(indexPath));

if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf-8');
  console.log('Original HTML length:', html.length);
  
  // Test path replacement
  const scriptRegex = /<script\s+src="([^"]+)"/g;
  const linkRegex = /<link\s+href="([^"]+)"/g;
  
  html = html.replace(scriptRegex, (match, src) => {
    console.log('Found script src:', src);
    return `<script src="${src}">`;
  });
}
