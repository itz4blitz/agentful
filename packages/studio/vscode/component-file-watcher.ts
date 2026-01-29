/**
 * VS Code Component File Watcher
 * Watches user's project for component changes and communicates with webview
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// File patterns to watch
const WATCH_PATTERNS = [
  '**/*.tsx',
  '**/*.jsx',
];

// Exclude patterns
const EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  '**/.next/**',
  '**/dist/**',
  '**/build/**',
  '**/out/**',
  '**/*.test.tsx',
  '**/*.spec.tsx',
  '**/__tests__/**',
];

export class ComponentFileWatcher {
  private disposables: vscode.Disposable[] = [];
  private fileWatcher: vscode.FileSystemWatcher | undefined;
  private webviewPanel: vscode.WebviewPanel | undefined;
  private webviewView: vscode.WebviewView | undefined;

  constructor(
    private context: vscode.ExtensionContext,
    private outputChannel: vscode.OutputChannel
  ) {}

  /**
   * Start watching for component file changes
   */
  public watch(webviewPanel: vscode.WebviewPanel | vscode.WebviewView): void {
    this.webviewPanel = webviewPanel as vscode.WebviewPanel;
    this.webviewView = webviewPanel as vscode.WebviewView;

    this.outputChannel.appendLine('[ComponentFileWatcher] Starting file watcher...');

    // Create file system watcher
    const pattern = new vscode.RelativePattern(
      vscode.workspace.workspaceFolders?.[0] || '',
      '**/*.tsx'
    );

    this.fileWatcher = vscode.workspace.createFileSystemWatcher(
      pattern,
      false, // ignoreCreateEvents
      false, // ignoreChangeEvents
      false  // ignoreDeleteEvents
    );

    // Watch for file creation
    this.fileWatcher.onDidCreate((uri) => {
      if (this.shouldIgnore(uri)) return;
      this.handleFileChange(uri, 'created');
    }, null, this.disposables);

    // Watch for file changes
    this.fileWatcher.onDidChange((uri) => {
      if (this.shouldIgnore(uri)) return;
      this.handleFileChange(uri, 'changed');
    }, null, this.disposables);

    // Watch for file deletion
    this.fileWatcher.onDidDelete((uri) => {
      if (this.shouldIgnore(uri)) return;
      this.handleFileChange(uri, 'deleted');
    }, null, this.disposables);

    this.outputChannel.appendLine('[ComponentFileWatcher] File watcher active');
  }

  /**
   * Stop watching
   */
  public dispose(): void {
    this.disposables.forEach(d => d.dispose());
    this.fileWatcher?.dispose();
    this.outputChannel.appendLine('[ComponentFileWatcher] File watcher disposed');
  }

  /**
   * Check if file should be ignored
   */
  private shouldIgnore(uri: vscode.Uri): boolean {
    const filePath = uri.fsPath;
    
    // Check exclude patterns
    for (const pattern of EXCLUDE_PATTERNS) {
      const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
      if (regex.test(filePath)) {
        return true;
      }
    }

    // Only watch .tsx and .jsx files
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.jsx')) {
      return true;
    }

    return false;
  }

  /**
   * Handle file change event
   */
  private handleFileChange(uri: vscode.Uri, changeType: 'created' | 'changed' | 'deleted'): void {
    const relativePath = vscode.workspace.asRelativePath(uri);
    this.outputChannel.appendLine(`[ComponentFileWatcher] ${changeType}: ${relativePath}`);

    const message = {
      command: 'componentFileChanged',
      filePath: uri.fsPath,
      relativePath,
      changeType,
    };

    // Send to webview
    if (this.webviewPanel?.webview) {
      this.webviewPanel.webview.postMessage(message);
    }
    if (this.webviewView?.webview) {
      this.webviewView.webview.postMessage(message);
    }
  }

  /**
   * Scan workspace for component files
   */
  public async scanForComponents(): Promise<string[]> {
    const files: string[] = [];

    if (!vscode.workspace.workspaceFolders) {
      return files;
    }

    for (const folder of vscode.workspace.workspaceFolders) {
      const pattern = new vscode.RelativePattern(folder, '**/*.tsx');
      const uris = await vscode.workspace.findFiles(
        pattern,
        '**/node_modules/**'
      );

      for (const uri of uris) {
        if (!this.shouldIgnore(uri)) {
          files.push(uri.fsPath);
        }
      }
    }

    this.outputChannel.appendLine(`[ComponentFileWatcher] Scanned ${files.length} components`);
    return files;
  }

  /**
   * Read component file content
   */
  public async readComponent(filePath: string): Promise<{
    content: string;
    fileName: string;
    lastModified: number;
  } | null> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      const stats = await fs.promises.stat(filePath);
      
      return {
        content,
        fileName: path.basename(filePath),
        lastModified: stats.mtimeMs,
      };
    } catch (error) {
      this.outputChannel.appendLine(`[ComponentFileWatcher] Error reading file: ${error}`);
      return null;
    }
  }
}
