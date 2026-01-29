/**
 * VS Code API Service
 * Provides a bridge between the webview React app and the VS Code extension host
 */

// VS Code API instance - acquired once and cached
let vscodeApi: any = null;

// Message handlers registry
const messageHandlers: Map<string, ((data: any) => void)[]> = new Map();

// Theme change listeners
const themeChangeListeners: ((theme: string) => void)[] = [];

/**
 * Initialize the VS Code API
 * Must be called once before using any other functions
 */
export function initializeVSCodeApi(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    // @ts-ignore - acquireVsCodeApi is injected by VS Code
    if (window.acquireVsCodeApi) {
      // @ts-ignore
      vscodeApi = window.acquireVsCodeApi();
      
      // Set up message listener
      window.addEventListener('message', handleMessage);
      
      console.log('[VSCode API] Initialized successfully');
      return true;
    }
  } catch (error) {
    console.error('[VSCode API] Failed to initialize:', error);
  }

  return false;
}

/**
 * Check if running inside VS Code webview
 */
export function isRunningInVSCode(): boolean {
  return vscodeApi !== null;
}

/**
 * Send a message to the VS Code extension host
 */
export function postMessage(command: string, data?: any): void {
  if (!vscodeApi) {
    console.warn('[VSCode API] Not initialized, cannot send message:', command, data);
    return;
  }

  vscodeApi.postMessage({
    command,
    ...data
  });
}

/**
 * Handle incoming messages from VS Code extension host
 */
function handleMessage(event: MessageEvent) {
  const message = event.data;
  
  if (!message || !message.command) {
    return;
  }

  console.log('[VSCode API] Received message:', message);

  // Handle theme sync messages
  if (message.command === 'themeChanged' && message.theme) {
    themeChangeListeners.forEach(listener => {
      try {
        listener(message.theme);
      } catch (error) {
        console.error('[VSCode API] Theme listener error:', error);
      }
    });
    return;
  }

  // Call registered handlers for this command
  const handlers = messageHandlers.get(message.command);
  if (handlers) {
    handlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('[VSCode API] Handler error:', error);
      }
    });
  }
}

/**
 * Register a message handler
 */
export function onMessage(command: string, handler: (data: any) => void): () => void {
  if (!messageHandlers.has(command)) {
    messageHandlers.set(command, []);
  }
  
  messageHandlers.get(command)!.push(handler);

  // Return unsubscribe function
  return () => {
    const handlers = messageHandlers.get(command);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  };
}

/**
 * Subscribe to theme changes from other webviews
 */
export function onThemeChange(listener: (theme: string) => void): () => void {
  themeChangeListeners.push(listener);
  
  return () => {
    const index = themeChangeListeners.indexOf(listener);
    if (index > -1) {
      themeChangeListeners.splice(index, 1);
    }
  };
}

/**
 * Notify extension that webview is ready
 */
export function notifyReady(): void {
  postMessage('webviewReady');
}

/**
 * Request authentication status from extension
 */
export function requestAuthStatus(): void {
  postMessage('getAuthStatus');
}

/**
 * Open fullscreen studio panel
 */
export function openFullscreenStudio(route?: string): void {
  postMessage('openFullscreen', { route });
}

/**
 * Show a notification in VS Code
 */
export function showNotification(text: string): void {
  postMessage('showNotification', { text });
}

/**
 * Request VS Code to reload the webview
 */
export function reloadWebview(): void {
  postMessage('reloadWebview');
}

// Theme storage keys
const THEME_STORAGE_KEY = 'agentful-theme';
const THEME_COLOR_KEY = 'agentful-theme-color';

/**
 * Save theme to VS Code state and notify other webviews
 */
export function saveTheme(theme: 'light' | 'dark' | 'system'): void {
  // Save to VS Code state
  const state = getState<Record<string, any>>() || {};
  state[THEME_STORAGE_KEY] = theme;
  setState(state);
  
  // Notify extension to broadcast to other webviews
  postMessage('themeChanged', { theme, themeType: 'mode' });
  
  console.log('[VSCode API] Theme saved:', theme);
}

/**
 * Save theme color to VS Code state and notify other webviews
 */
export function saveThemeColor(color: string): void {
  // Save to VS Code state
  const state = getState<Record<string, any>>() || {};
  state[THEME_COLOR_KEY] = color;
  setState(state);
  
  // Notify extension to broadcast to other webviews
  postMessage('themeChanged', { color, themeType: 'color' });
  
  console.log('[VSCode API] Theme color saved:', color);
}

/**
 * Get saved theme from VS Code state
 */
export function getSavedTheme(): 'light' | 'dark' | 'system' | null {
  const state = getState<Record<string, any>>();
  return state?.[THEME_STORAGE_KEY] || null;
}

/**
 * Get saved theme color from VS Code state
 */
export function getSavedThemeColor(): string | null {
  const state = getState<Record<string, any>>();
  return state?.[THEME_COLOR_KEY] || null;
}

/**
 * Store state in VS Code's webview state
 */
export function setState<T>(state: T): void {
  if (vscodeApi) {
    vscodeApi.setState(state);
  }
}

/**
 * Get state from VS Code's webview state
 */
export function getState<T>(): T | undefined {
  if (vscodeApi) {
    return vscodeApi.getState();
  }
  return undefined;
}

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
  initializeVSCodeApi();
}
