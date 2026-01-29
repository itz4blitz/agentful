# agentful Studio - VS Code Extension Architecture Guide

## Executive Summary

This document provides comprehensive architectural guidance for building agentful Studio as a VS Code extension, based on research into VS Code best practices, analysis of successful extensions (GitHub Copilot, Cursor), and current implementation patterns.

**Key Finding:** The current "auto-open panel from sidebar" approach violates VS Code UX patterns. Users expect control over their workspace layout.

---

## Table of Contents

1. [VS Code Extension Best Practices](#vs-code-extension-best-practices)
2. [Current Implementation Analysis](#current-implementation-analysis)
3. [Recommended Architecture](#recommended-architecture)
4. [User Experience Design](#user-experience-design)
5. [Technical Implementation Patterns](#technical-implementation-patterns)
6. [Fixing the Current "Loading" Issue](#fixing-the-current-loading-issue)
7. [Code Examples](#code-examples)
8. [References & Resources](#references--resources)

---

## 1. VS Code Extension Best Practices

### 1.1 Sidebar vs Panel: When to Use What

Based on official VS Code documentation and analysis of GitHub Copilot:

**Activity Bar → Sidebar Views:**
- **Purpose**: Quick access, navigation, persistent status indicators
- **Use when**:
  - Content is navigational (tree views, lists)
  - Users need quick access while coding
  - Persistent state monitoring (build status, tests, AI agents)
  - Compact UI that doesn't need much horizontal space
- **Examples**:
  - GitHub Copilot: Chat sidebar (right side)
  - Explorer: File tree
  - Debug: Variables, watch, call stack
  - Git: Changes, source control

**Editor Area → Webview Panels:**
- **Purpose**: Detailed content, document-based interaction, complex workflows
- **Use when**:
  - Content is document-like or requires significant screen space
  - User is doing focused work on that specific content
  - Complex interactions that benefit from more room
  - Temporary views that users can close when done
- **Examples**:
  - Markdown preview
  - Interactive notebooks (Jupyter)
  - Custom editors
  - agentful Studio: Main workspace, agent chat interface

**Bottom Panel (Terminal/Output/Problems):**
- **Purpose**: Logs, output, terminal, debug console
- **Use for**: Read-only information, logs, build output, test results

### 1.2 Logging Best Practices

**Never use `console.log()` in extensions** - it doesn't show in VS Code's Output panel.

**Proper approach - OutputChannel API:**

```typescript
// Create output channel
const outputChannel = vscode.window.createOutputChannel('agentful Studio');

// Log messages
outputChannel.appendLine('[INFO] Extension activated');
outputChannel.appendLine('[DEBUG] User clicked button');

// Show the output channel to user
outputChannel.show();

// Dispose when done
context.subscriptions.push(outputChannel);
```

**Benefits**:
- Shows in "Output" panel (View → Output)
- Users can select your channel from dropdown
- Persists across sessions
- Can be cleared, shown/hidden programmatically

### 1.3 Webview Best Practices

From official VS Code documentation:

**Security**:
- Always use Content Security Policy (CSP)
- Use nonces for inline scripts
- Restrict resource loading with `localResourceRoots`

**Performance**:
- Use `retainContextWhenHidden: true` to preserve state when webview loses focus
- Clean up event listeners in `onDidDispose`
- Minimize message passing between extension and webview

**User Experience**:
- Never auto-open panels without user action
- Provide clear CTAs (Call to Action) in sidebar
- Let users control their workspace layout
- Respect VS Code's view column system

---

## 2. Current Implementation Analysis

### 2.1 Problems Identified

**Problem 1: Auto-opening Panel**
```typescript
// studio-sidebar.ts:26
this.openFullscreenPanel(); // ❌ Violates UX best practices
```

**Issue**: Sidebar automatically tries to open a fullscreen panel when the sidebar view is resolved. This:
- Violates user's control over their workspace
- Feels "buggy" - why is something opening when I just clicked the Activity Bar icon?
- Confuses users who just wanted to check status or configure settings

**Problem 2: Using console.log()**
```typescript
// studio-sidebar.ts:10, 21, 25
console.log('StudioSidebarProvider.resolveWebviewView called');
```

**Issue**: These logs don't appear in VS Code's Output panel, making debugging impossible for users.

**Problem 3: Dual Webview Implementation**

Current state:
- Sidebar has its own webview with "Open Studio" button
- Panel has separate webview with test HTML
- Extension.ts also has manual panel creation

**Issue**: Confusing architecture with multiple ways to open panels. Which one is the "real" implementation?

**Problem 4: Panel "Loading" State**

The panel never opens because:
1. `resolveWebviewView()` is called (sidebar loads)
2. Immediately calls `openFullscreenPanel()`
3. VS Code may restrict auto-opening in certain contexts
4. User sees "loading" in sidebar, panel doesn't appear

### 2.2 What's Working Well

✅ Clerk authentication architecture is solid
✅ Webview messaging system is properly set up
✅ React app with shadcn/ui is comprehensive
✅ CSP nonce generation is secure
✅ Webview options are configured correctly

---

## 3. Recommended Architecture

### 3.1 High-Level Design

```
┌─────────────────────────────────────────────────────────────┐
│ VS Code Extension Host (extension.ts)                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────┐    ┌────────────────────────────┐    │
│  │ Activity Bar    │    │  OutputChannel             │    │
│  │ Icon            │    │  - Extension logs           │    │
│  │ - Click to      │    │  - Debug info               │    │
│  │   show sidebar  │    │  - User actions             │    │
│  └─────────────────┘    └────────────────────────────┘    │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Sidebar Webview (studio-sidebar.ts)                 │  │
│  │                                                      │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │ Quick Status                                  │  │  │
│  │  │ • Auth status (✓ authenticated)             │  │  │
│  │  │ • Active agents (3 running)                  │  │  │
│  │  │ • MCP servers (2 connected)                  │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  │                                                      │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │ Quick Actions                                 │  │  │
│  │  │ [Open Workspace] [Config] [Logs]              │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  │                                                      │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │ Navigation                                    │  │  │
│  │  │ • Projects (tree view)                       │  │  │
│  │  │ • Agents (list)                              │  │  │
│  │  │ • MCP Servers (list)                         │  │  │
│  │  │ • Settings                                   │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────┘  │
│           │                                                 │
│           │ User clicks "Open Workspace"                    │
│           ▼                                                 │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Main Panel Webview (studio-panel.ts)                │  │
│  │                                                      │  │
│  │  Full React app:                                     │  │
│  │  • Project management                               │  │
│  │  • Agent chat interface                             │  │
│  │  • MCP server configuration                         │  │
│  │  • Skills & agents management                       │  │
│  │  • Visual workflow builder                          │  │
│  │                                                      │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Component Responsibilities

**Sidebar Webview (`studio-sidebar.ts`)**:
- **Purpose**: Control center and navigation hub
- **Key Features**:
  - Authentication status indicator
  - Quick actions (open panel, view logs, settings)
  - Tree views: Projects, Agents, MCP Servers
  - Compact, always accessible
  - No heavy workflows
- **Technology**: Simple HTML/CSS/JS or lightweight React

**Main Panel (`studio-panel.ts`)**:
- **Purpose**: Full workspace for agentful workflows
- **Key Features**:
  - Project management (create, edit, delete)
  - Agent chat interface
  - MCP server CRUD operations
  - Skills.sh integration UI
  - Custom agents.md editor
  - Autonomous agent orchestration
  - Visual workflow builder
- **Technology**: Full React app with shadcn/ui (current implementation)

**Extension Host (`extension.ts`)**:
- **Purpose**: Extension lifecycle and VS Code API integration
- **Key Features**:
  - Register sidebar view provider
  - Register commands
  - Initialize OutputChannel
  - Manage authentication state
  - Handle webview messaging
  - Provide context to both sidebar and panel

**Authentication Service (`auth/clerk-service.ts`)**:
- **Purpose**: Centralized auth management
- **Key Features**:
  - Store/retrieve tokens from secret storage
  - Handle OAuth flow
  - Provide auth status to both sidebar and panel
  - Manage session lifecycle

---

## 4. User Experience Design

### 4.1 First Run Experience

```
1. User installs agentful Studio extension
   └─→ Shows welcome notification: "Get started with agentful Studio"

2. User clicks Activity Bar icon
   └─→ Sidebar opens with welcome state:
       "Welcome to agentful Studio!
        Let's get you set up in 3 steps:"
       • Step 1: Sign in (button)
       • Step 2: Configure providers
       • Step 3: Create your first project

3. User clicks "Sign in"
   └─→ Opens browser for Clerk OAuth
   └─→ Redirects back, sidebar shows: "✓ Authenticated as user@example.com"
   └─→ Automatically enables Step 2

4. User completes setup
   └─→ Sidebar shows normal state with "Open Workspace" CTA
   └─→ Button is prominent, calls to action
```

### 4.2 Daily Usage Flow

```
User opens VS Code:
  → Agent icon in Activity Bar (sidebar indicator shows badge if agents running)

User wants to:

1. Check agent status
   → Click Activity Bar icon
   → Sidebar shows: "3 agents running" + quick status
   → Done! No need to open panel

2. Start new autonomous dev session
   → Click Activity Bar icon
   → Click "Open Workspace" button in sidebar
   → Main panel opens with project selection
   → User selects project and starts session

3. Configure MCP server
   → Click Activity Bar icon
   → Sidebar shows "MCP Servers" tree
   → User clicks server or "Add Server" button
   → Panel opens with MCP configuration UI
   → User makes changes and saves

4. View logs/debug
   → Click "View Logs" button in sidebar (or Cmd+Shift+P → "agentful: Show Logs")
   → Output panel opens with "agentful Studio" channel selected
```

### 4.3 Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Initial State: Not Authenticated                         │
└─────────────────────────────────────────────────────────────┘

Sidebar shows:
  ┌──────────────────────────────┐
  │ 🔒 Sign In                   │
  │                              │
  │ Connect to agentful Cloud    │
  │ to sync projects and agents  │
  │                              │
  │ [Sign In with Clerk]         │
  └──────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 2. User clicks "Sign In"                                     │
└─────────────────────────────────────────────────────────────┘

Extension flow:
  • Sidebar sends message: { command: 'triggerAuth' }
  • Extension opens browser for Clerk OAuth
  • User completes auth in browser
  • Extension receives callback
  • ClerkAuthService.saveToken()
  • Extension notifies sidebar: { command: 'authSuccess', userId: '...' }

Sidebar updates:
  ┌──────────────────────────────┐
  │ ✓ user@example.com           │
  │                              │
  │ [Sign Out]                   │
  └──────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 3. Authenticated State (Persistent)                          │
└─────────────────────────────────────────────────────────────┘

On next VS Code session:
  • Extension activates
  • ClerkAuthService.getToken() → returns valid token
  • Sidebar shows authenticated state immediately
  • No re-auth required (until token expires)
```

---

## 5. Technical Implementation Patterns

### 5.1 Proper Logging Implementation

**Create a logging utility** (`utils/logger.ts`):

```typescript
import * as vscode from 'vscode';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export class Logger {
  private channel: vscode.OutputChannel;
  private currentLevel: LogLevel;

  constructor(name: string, level: LogLevel = LogLevel.INFO) {
    this.channel = vscode.window.createOutputChannel(name);
    this.currentLevel = level;
  }

  private log(level: LogLevel, message: string, ...args: any[]) {
    if (level < this.currentLevel) {
      return;
    }

    const timestamp = new Date().toISOString();
    const prefix = {
      [LogLevel.DEBUG]: '[DEBUG]',
      [LogLevel.INFO]: '[INFO]',
      [LogLevel.WARN]: '[WARN]',
      [LogLevel.ERROR]: '[ERROR]',
    }[level];

    const formattedMessage = `${timestamp} ${prefix} ${message}`;
    this.channel.appendLine(formattedMessage);

    if (args.length > 0) {
      this.channel.appendLine(JSON.stringify(args, null, 2));
    }
  }

  debug(message: string, ...args: any[]) {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  info(message: string, ...args: any[]) {
    this.log(LogLevel.INFO, message, ...args);
  }

  warn(message: string, ...args: any[]) {
    this.log(LogLevel.WARN, message, ...args);
  }

  error(message: string, ...args: any[]) {
    this.log(LogLevel.ERROR, message, ...args);
  }

  show() {
    this.channel.show();
  }

  dispose() {
    this.channel.dispose();
  }
}

// Usage in extension.ts
const logger = new Logger('agentful Studio', LogLevel.DEBUG);

export function activate(context: vscode.ExtensionContext) {
  logger.info('Extension activated');
  logger.debug('Extension context path:', context.extensionUri.fsPath);

  context.subscriptions.push(logger);
}
```

### 5.2 Sidebar Webview Pattern

**Optimized sidebar implementation** (`studio-sidebar.ts`):

```typescript
import * as vscode from 'vscode';

export class StudioSidebarProvider {
  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly logger: Logger
  ) {}

  public resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.logger.info('Sidebar webview resolving');

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, 'dist'),
        vscode.Uri.joinPath(this.context.extensionUri, 'assets'),
      ],
    };

    // Get auth status
    const authService = new ClerkAuthService(this.context);
    const isAuthenticated = authService.isAuthenticated();

    webviewView.webview.html = this.getSidebarHtml(isAuthenticated);

    // Handle messages from sidebar
    webviewView.webview.onDidReceiveMessage(
      async (message) => {
        this.logger.debug('Message from sidebar:', message);

        switch (message.command) {
          case 'openWorkspace':
            await vscode.commands.executeCommand('agentful.studio.open');
            break;

          case 'signIn':
            await this.handleSignIn(webviewView.webview);
            break;

          case 'signOut':
            await this.handleSignOut(webviewView.webview);
            break;

          case 'showLogs':
            this.logger.show();
            break;
        }
      },
      null,
      this.context.subscriptions
    );
  }

  private async handleSignIn(webview: vscode.Webview) {
    const clerkService = new ClerkAuthService(this.context);
    const oauthHandler = new ClerkOAuthHandler(clerkService, this.context);

    this.logger.info('Initiating sign in flow');
    const success = await oauthHandler.authenticate();

    webview.postMessage({
      command: 'authComplete',
      success,
      isAuthenticated: await clerkService.isAuthenticated()
    });
  }

  private async handleSignOut(webview: vscode.Webview) {
    const clerkService = new ClerkAuthService(this.context);
    await clerkService.clearToken();

    this.logger.info('User signed out');

    webview.postMessage({
      command: 'authCleared'
    });

    // Refresh sidebar
    webview.html = this.getSidebarHtml(false);
  }

  private getSidebarHtml(isAuthenticated: boolean): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 16px;
      background: var(--vscode-sideBar-background);
      color: var(--vscode-sideBar-foreground);
    }
    .section {
      margin-bottom: 16px;
    }
    .status {
      padding: 8px 12px;
      background: var(--vscode-textBlockQuote-background);
      border-left: 3px solid var(--vscode-textBlockQuote-border);
      border-radius: 2px;
      margin-bottom: 12px;
      font-size: 12px;
    }
    .status.authenticated {
      border-left-color: #4ec9b0;
    }
    .status.unauthenticated {
      border-left-color: #f48771;
    }
    button {
      width: 100%;
      padding: 8px 16px;
      margin-bottom: 8px;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 2px;
      cursor: pointer;
      font-size: 13px;
      font-family: inherit;
    }
    button:hover {
      background: var(--vscode-button-hoverBackground);
    }
    button.secondary {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }
    button.secondary:hover {
      background: var(--vscode-button-secondaryHoverBackground);
    }
    .divider {
      height: 1px;
      background: var(--vscode-sideBar-border);
      margin: 16px 0;
    }
    .section-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      color: var(--vscode-descriptionForeground);
    }
  </style>
</head>
<body>
  ${isAuthenticated ? this.getAuthenticatedContent() : this.getUnauthenticatedContent()}

  <script>
    const vscode = acquireVsCodeApi();

    function openWorkspace() {
      vscode.postMessage({ command: 'openWorkspace' });
    }

    function signIn() {
      vscode.postMessage({ command: 'signIn' });
    }

    function signOut() {
      vscode.postMessage({ command: 'signOut' });
    }

    function showLogs() {
      vscode.postMessage({ command: 'showLogs' });
    }
  </script>
</body>
</html>`;
  }

  private getAuthenticatedContent(): string {
    return `
      <div class="section">
        <div class="status authenticated">✓ Authenticated</div>
        <button onclick="openWorkspace()">🚀 Open Workspace</button>
        <button class="secondary" onclick="showLogs()">📋 View Logs</button>
      </div>

      <div class="divider"></div>

      <div class="section">
        <div class="section-title">Navigation</div>
        <button class="secondary" onclick="showLogs()">⚙️ Settings</button>
        <button class="secondary" onclick="signOut()">🔒 Sign Out</button>
      </div>
    `;
  }

  private getUnauthenticatedContent(): string {
    return `
      <div class="section">
        <div class="status unauthenticated">Not authenticated</div>
        <button onclick="signIn()">🔑 Sign In</button>
        <button class="secondary" onclick="showLogs()">📋 View Logs</button>
      </div>

      <div class="divider"></div>

      <div class="section">
        <div class="section-title">Quick Start</div>
        <div style="font-size: 12px; color: var(--vscode-descriptionForeground); line-height: 1.6;">
          Get started with agentful Studio:<br><br>
          1. Sign in to your account<br>
          2. Configure AI providers<br>
          3. Create your first project
        </div>
      </div>
    `;
  }
}
```

### 5.3 Message Passing Pattern

**Type-safe messaging** (`types/messages.ts`):

```typescript
// Extension → Webview messages
export type ExtensionMessage =
  | { command: 'authSuccess'; userId: string }
  | { command: 'authCleared' }
  | { command: 'authComplete'; success: boolean; isAuthenticated: boolean }
  | { command: ' authToken'; token: string | null; userId: string | null; isAuthenticated: boolean }
  | { command: 'projectList'; projects: Project[] }
  | { command: 'agentStatus'; agents: AgentStatus[] };

// Webview → Extension messages
export type WebviewMessage =
  | { command: 'openWorkspace' }
  | { command: 'signIn' }
  | { command: 'signOut' }
  | { command: 'getAuthToken' }
  | { command: 'setAuthToken'; token: string; userId: string; expiresIn?: number }
  | { command: 'clearAuthToken' }
  | { command: 'triggerAuth' }
  | { command: 'getProjects' }
  | { command: 'createProject'; project: CreateProjectInput };

// Type-safe message handler
export function setupMessageHandler(
  webview: vscode.Webview,
  handlers: {
    [K in WebviewMessage['command']]: (
      message: Extract<WebviewMessage, { command: K }>
    ) => void | Promise<void>;
  }
) {
  webview.onDidReceiveMessage(async (message: WebviewMessage) => {
    const handler = handlers[message.command];
    if (handler) {
      await handler(message as any);
    }
  });
}
```

### 5.4 State Management Pattern

**Shared state between extension and webview** (`state/extension-state.ts`):

```typescript
interface ExtensionState {
  isAuthenticated: boolean;
  userId?: string;
  projects: Project[];
  activeAgents: AgentStatus[];
  mcpServers: MCPServer[];
}

export class ExtensionStateManager {
  private state: ExtensionState = {
    isAuthenticated: false,
    projects: [],
    activeAgents: [],
    mcpServers: [],
  };

  private readonly _stateDidChange = new vscode.EventEmitter<ExtensionState>();
  public readonly onStateDidChange = this._stateDidChange.event;

  constructor(private context: vscode.ExtensionContext) {
    this.loadState();
  }

  private loadState() {
    // Load from context.globalState
    this.state = this.context.globalState.get('agentful.state', this.state);
  }

  private async saveState() {
    await this.context.globalState.update('agentful.state', this.state);
    this._stateDidChange.fire(this.state);
  }

  async updateAuth(authenticated: boolean, userId?: string) {
    this.state.isAuthenticated = authenticated;
    this.state.userId = userId;
    await this.saveState();
  }

  async addProject(project: Project) {
    this.state.projects.push(project);
    await this.saveState();
  }

  // ... other state methods

  getState(): Readonly<ExtensionState> {
    return this.state;
  }
}
```

---

## 6. Fixing the Current "Loading" Issue

### 6.1 Root Cause

The sidebar shows "loading" because:
1. `resolveWebviewView()` is called and sets HTML
2. Immediately calls `openFullscreenPanel()`
3. VS Code may block panel creation in certain contexts
4. No feedback to user about what's happening
5. Panel never opens, sidebar remains in loading state

### 6.2 Immediate Fix

**Step 1: Remove auto-open from sidebar**

```typescript
// studio-sidebar.ts
public resolveWebviewView(webviewView: vscode.WebviewView): void {
  this.logger.info('Sidebar webview resolving');

  // ❌ REMOVE THIS LINE:
  // this.openFullscreenPanel();

  // ✅ Just set the sidebar content
  webviewView.webview.options = { /* ... */ };
  webviewView.webview.html = this.getSidebarHtml();
}
```

**Step 2: Add explicit user action to open panel**

In sidebar HTML, add a clear CTA button:

```html
<button onclick="openStudio()">Open agentful Studio</button>

<script>
  const vscode = acquireVsCodeApi();
  function openStudio() {
    vscode.postMessage({ command: 'openFullscreen' });
  }
</script>
```

**Step 3: Handle the message to open panel**

```typescript
webviewView.webview.onDidReceiveMessage(async (message) => {
  if (message.command === 'openFullscreen') {
    // Use VS Code command to open panel
    await vscode.commands.executeCommand('agentful.studio.open');
  }
});
```

**Step 4: Replace all console.log() with proper logging**

```typescript
// ❌ BEFORE
console.log('StudioSidebarProvider.resolveWebviewView called');

// ✅ AFTER
this.logger.info('Sidebar webview resolving');
```

### 6.3 Verification Steps

After implementing the fix:

1. **Clear extension state**:
   ```bash
   # In VS Code, run:
   Cmd+Shift+P → "Developer: Reload Window"
   ```

2. **Open Output panel**:
   - View → Output
   - Select "Extension Host" from dropdown
   - Look for extension loading errors

3. **Open Debug Console**:
   - View → Debug Console
   - Run extension with F5
   - Check for your logger output

4. **Test sidebar**:
   - Click agent icon in Activity Bar
   - Sidebar should show immediately with "Open Studio" button
   - No loading state

5. **Test panel opening**:
   - Click "Open Studio" button in sidebar
   - Panel should open in editor area
   - Should show your React app

---

## 7. Code Examples

### 7.1 Complete Extension Entry Point

```typescript
// extension.ts
import * as vscode from 'vscode';
import { StudioSidebarProvider } from './vscode/studio-sidebar';
import { StudioPanelProvider } from './vscode/studio-panel';
import { Logger } from './utils/logger';

let logger: Logger;
let panelProvider: StudioPanelProvider;

export function activate(context: vscode.ExtensionContext) {
  // Initialize logger
  logger = new Logger('agentful Studio', LogLevel.DEBUG);
  logger.info('=================================================');
  logger.info('agentful Studio Extension Activating...');
  logger.info('Version:', context.extension.packageJSON.version);
  logger.info('=================================================');

  // Initialize panel provider
  panelProvider = new StudioPanelProvider(context, logger);

  // Register sidebar provider
  logger.info('Registering sidebar provider');
  const sidebarProvider = new StudioSidebarProvider(context, logger);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'agentful.studio.sidebar',
      sidebarProvider
    )
  );

  // Register commands
  logger.info('Registering commands');

  const openCommand = vscode.commands.registerCommand(
    'agentful.studio.open',
    () => {
      logger.info('Command: Open Studio Panel');
      panelProvider.show();
    }
  );
  context.subscriptions.push(openCommand);

  const logsCommand = vscode.commands.registerCommand(
    'agentful.studio.showLogs',
    () => {
      logger.show();
    }
  );
  context.subscriptions.push(logsCommand);

  logger.info('Extension activated successfully');
  logger.info('Run "agentful: Show Logs" to view extension logs');
}

export function deactivate() {
  logger?.info('Extension deactivating');
  logger?.dispose();
  panelProvider?.dispose();
}
```

### 7.2 Improved Panel Provider

```typescript
// studio-panel.ts
import * as vscode from 'vscode';
import { getWebviewOptions } from './webview/get-webview-options';
import { getWebviewContent } from './webview/get-webview-content';
import { setupWebviewMessaging } from './webview/message-handler';
import { ClerkAuthService } from './auth/clerk-service';
import { Logger } from '../utils/logger';

export class StudioPanelProvider {
  private static readonly viewType = 'agentful.studio.panel';
  private panel: vscode.WebviewPanel | undefined;
  private disposables: vscode.Disposable[] = [];
  private clerkService: ClerkAuthService;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly logger: Logger
  ) {
    this.clerkService = new ClerkAuthService(context);
    logger.debug('PanelProvider initialized');
  }

  public show() {
    this.logger.info('Opening Studio panel');

    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it
    if (this.panel) {
      this.logger.debug('Revealing existing panel');
      this.panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel
    this.logger.debug('Creating new panel');
    this.panel = vscode.window.createWebviewPanel(
      StudioPanelProvider.viewType,
      'agentful Studio',
      column || vscode.ViewColumn.One,
      getWebviewOptions(this.context.extensionUri)
    );

    // Set the webview's initial HTML content
    this.logger.debug('Loading React app in webview');
    this.panel.webview.html = getWebviewContent(
      this.panel.webview,
      this.context.extensionUri
    );

    // Handle messages from the webview
    setupWebviewMessaging(
      this.panel.webview,
      this.context,
      this.clerkService,
      this.logger
    );

    // Listen for when the panel is disposed
    this.panel.onDidDispose(() => {
      this.logger.debug('Panel disposed');
      this.dispose();
    }, null, this.disposables);

    this.logger.info('Studio panel opened successfully');
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

    this.logger.debug('PanelProvider disposed');
  }
}
```

### 7.3 Enhanced Message Handler

```typescript
// webview/message-handler.ts
import * as vscode from 'vscode';
import { ClerkAuthService } from '../auth/clerk-service';
import { Logger } from '../../utils/logger';

export function setupWebviewMessaging(
  webview: vscode.Webview,
  context: vscode.ExtensionContext,
  clerkService: ClerkAuthService,
  logger: Logger
) {
  webview.onDidReceiveMessage(
    async (message) => {
      logger.debug('Message from webview:', message.command);

      try {
        switch (message.command) {
          case 'alert':
            vscode.window.showErrorMessage(message.text);
            return;

          case 'info':
            vscode.window.showInformationMessage(message.text);
            return;

          case 'getAuthToken':
            logger.debug('Fetching auth token');
            const tokenData = await clerkService.getToken();
            webview.postMessage({
              command: 'authToken',
              token: tokenData?.token || null,
              userId: tokenData?.userId || null,
              isAuthenticated: tokenData !== null
            });
            return;

          case 'setAuthToken':
            logger.info('Saving auth token for user:', message.userId);
            await clerkService.saveToken(
              message.token,
              message.userId,
              message.expiresIn || 3600
            );
            vscode.window.showInformationMessage('Successfully authenticated with agentful');
            webview.postMessage({
              command: 'authSuccess',
              userId: message.userId
            });
            return;

          case 'clearAuthToken':
            logger.info('Clearing auth token');
            await clerkService.clearToken();
            vscode.window.showInformationMessage('Signed out of agentful');
            webview.postMessage({ command: 'authCleared' });
            return;

          case 'openFile':
            logger.debug('Opening file:', message.path);
            const uri = vscode.Uri.file(message.path);
            const doc = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(doc);
            return;

          case 'triggerAuth':
            logger.info('Triggering OAuth flow');
            const { ClerkOAuthHandler } = await import('../auth/oauth-handler');
            const oauthHandler = new ClerkOAuthHandler(clerkService, context);
            const success = await oauthHandler.authenticate();

            logger.info('OAuth flow completed:', success);
            webview.postMessage({
              command: 'authComplete',
              success,
              isAuthenticated: await clerkService.isAuthenticated()
            });
            return;

          default:
            logger.warn('Unknown message command:', message.command);
        }
      } catch (error) {
        logger.error('Error handling message:', error);
        webview.postMessage({
          command: 'error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    },
    undefined,
    context.subscriptions
  );

  logger.info('Webview messaging handler registered');
}
```

---

## 8. References & Resources

### Official VS Code Documentation

- **Webview API**: https://code.visualstudio.com/api/extension-guides/webview
- **Webview UX Guidelines**: https://code.visualstudio.com/api/ux-guidelines/webviews
- **Sidebar Guidelines**: https://code.visualstudio.com/api/ux-guidelines/sidebars
- **Views Guidelines**: https://code.visualstudio.com/api/ux-guidelines/views
- **UX Guidelines Overview**: https://code.visualstudio.com/api/ux-guidelines/overview
- **OutputChannel API**: https://code.visualstudio.com/api/references/vscode-api

### Community Resources

- **VS Code Extension with Sidebar Webview (GitHub)**:
  https://github.com/denyocrworld/vscode-extension-with-sidebar-webview

- **Create a VS Code Left Panel Webview Extension using React (Medium)**:
  https://medium.com/@luongquochuy1995/create-a-vs-code-left-panel-webview-extension-using-react-e765fd901f64

- **VS Code Extensions: Basic Concepts & Architecture (Medium)**:
  https://jessvint.medium.com/vs-code-extensions-basic-concepts-architecture-8c8f7069145c

### Extension Analysis

- **GitHub Copilot**: Observe the chat sidebar (right side) and how it opens panels only on user action
- **Cursor AI**: Fork of VS Code with native AI integration (reference for AI-first UX)

### Best Practices

- **Security**: Always use CSP with nonces for webviews
- **Logging**: Use OutputChannel, never console.log()
- **UX**: Never auto-open panels without explicit user action
- **State**: Use context.globalState for persistent data, context.workspaceState for workspace-specific data
- **Disposables**: Always clean up event listeners and resources
- **Performance**: Use retainContextWhenHidden for webviews that need to preserve state

---

## Next Steps

1. **Immediate fixes** (1-2 hours):
   - [ ] Remove auto-open from `studio-sidebar.ts`
   - [ ] Replace all `console.log()` with Logger
   - [ ] Add "Open Workspace" button to sidebar
   - [ ] Test panel opening from sidebar button

2. **Short-term improvements** (1 week):
   - [ ] Implement proper sidebar UI with auth status
   - [ ] Add tree views for Projects, Agents, MCP Servers
   - [ ] Implement OutputChannel logger utility
   - [ ] Add "Show Logs" command and button
   - [ ] Create proper message passing types

3. **Medium-term features** (2-4 weeks):
   - [ ] Build complete authentication flow in sidebar
   - [ ] Integrate React app into panel webview
   - [ ] Implement project management in panel
   - [ ] Add MCP server management UI
   - [ ] Build agent chat interface
   - [ ] Create autonomous agent orchestration UI

4. **Long-term vision** (1-3 months):
   - [ ] Skills.sh integration
   - [ ] Custom agents.md editor
   - [ ] Visual workflow builder
   - [ ] Provider-agnostic architecture (OpenAI, Anthropic, others)
   - [ ] Project templates and quickstarts
   - [ ] Advanced debugging and monitoring

---

## Summary

The key architectural decisions for agentful Studio:

1. **Sidebar = Control Center**: Quick access, status, navigation
2. **Panel = Workspace**: Full-featured UI for complex workflows
3. **Never Auto-Open**: Let users control their workspace
4. **Proper Logging**: Use OutputChannel API for debugging
5. **Clear CTAs**: Always have prominent "Open Workspace" button
6. **Type Safety**: Use TypeScript for message passing and state management
7. **Authentication**: Centralized service shared by sidebar and panel

This architecture follows VS Code best practices, provides a great user experience, and scales to support all of agentful Studio's ambitious features.
