/**
 * Component Loader Service
 * Watches user's project for components and loads them dynamically
 */

import type { UserComponent, ComponentDefinition, HotReloadEvent } from '@/types/component-system';
import { useShadcnPaletteStore } from '@/stores/shadcn-palette-store';
import { isRunningInVSCode } from '@/services/vscode';

// Component file patterns to watch
const COMPONENT_PATTERNS = [
  '**/components/**/*.tsx',
  '**/app/**/*-component.tsx',
  '**/ui/**/*.tsx', // shadcn style
];

// Cache for loaded components
const componentCache = new Map<string, UserComponent>();

// Event listeners for hot reload
const hotReloadListeners: ((event: HotReloadEvent) => void)[] = [];

/**
 * Initialize the component loader
 * Scans user's project and sets up file watching
 */
export async function initializeComponentLoader(): Promise<void> {
  console.log('[ComponentLoader] Initializing...');
  
  if (!isRunningInVSCode()) {
    console.log('[ComponentLoader] Not in VS Code, skipping file watch');
    return;
  }

  // Request VS Code to scan for components
  const components = await scanForComponents();
  
  // Load each component
  for (const component of components) {
    await loadUserComponent(component);
  }

  // Setup file watching via VS Code
  setupFileWatcher();
  
  console.log('[ComponentLoader] Initialized with', components.length, 'components');
}

/**
 * Scan for component files in user's project
 */
async function scanForComponents(): Promise<string[]> {
  // Request VS Code extension to scan files
  const response = await postMessageToVSCode<{ files: string[] }>({
    command: 'scanComponents',
    patterns: COMPONENT_PATTERNS,
  });
  
  return response?.files || [];
}

/**
 * Load a user component from file
 */
async function loadUserComponent(filePath: string): Promise<UserComponent | null> {
  try {
    // Request file content from VS Code
    const response = await postMessageToVSCode<{ 
      content: string;
      fileName: string;
      lastModified: number;
    }>({
      command: 'readComponent',
      filePath,
    });

    if (!response) return null;

    // Parse the component
    const component = parseUserComponent(response.content, filePath, response.fileName);
    
    if (component) {
      componentCache.set(filePath, component);
      
      // Add to store
      const store = useShadcnPaletteStore.getState();
      store.addUserComponent(component);
      
      console.log('[ComponentLoader] Loaded:', component.name);
    }
    
    return component;
  } catch (error) {
    console.error('[ComponentLoader] Failed to load:', filePath, error);
    return null;
  }
}

/**
 * Parse a user component from source code
 * Extracts props, JSDoc, and metadata
 */
function parseUserComponent(
  content: string, 
  filePath: string, 
  fileName: string
): UserComponent | null {
  // Extract component name from file
  const nameMatch = content.match(/export\s+(?:default\s+)?(?:function|const)\s+(\w+)/);
  const name = nameMatch?.[1] || fileName.replace(/\.tsx?$/, '');
  
  // Extract JSDoc description
  const jsdocMatch = content.match(/\/\*\*\s*\n([^*]|\*(?!\/))*\*\//);
  const description = extractDescriptionFromJsdoc(jsdocMatch?.[0] || '');
  
  // Extract props interface
  const propsInterface = extractPropsInterface(content);
  
  // Determine category from file path
  const category = determineCategory(filePath);
  
  // Generate component definition
  const component: UserComponent = {
    id: `user-${name.toLowerCase()}`,
    name,
    description: description || `${name} component`,
    category,
    tags: ['user-defined', category],
    icon: 'component',
    source: 'user',
    filePath,
    imports: [filePath],
    component: name,
    defaultProps: generateDefaultProps(propsInterface),
    props: propsInterface,
    children: {
      allowed: content.includes('children') || content.includes('ReactNode'),
      description: 'Child elements',
    },
  };
  
  return component;
}

/**
 * Extract description from JSDoc comment
 */
function extractDescriptionFromJsdoc(jsdoc: string): string {
  const lines = jsdoc
    .replace(/\/\*\*\s*/, '')
    .replace(/\s*\*\//, '')
    .split('\n')
    .map(line => line.replace(/^\s*\*\s?/, ''))
    .filter(line => !line.startsWith('@') && line.trim());
  
  return lines.join(' ').trim();
}

/**
 * Extract props from TypeScript interface
 */
function extractPropsInterface(content: string): ComponentDefinition['props'] {
  const props: ComponentDefinition['props'] = [];
  
  // Match interface Props or type Props
  const interfaceMatch = content.match(/interface\s+Props\s*{([^}]+)}/s);
  const typeMatch = content.match(/type\s+Props\s*=\s*{([^}]+)}/s);
  const propsBlock = interfaceMatch?.[1] || typeMatch?.[1];
  
  if (!propsBlock) return props;
  
  // Parse each property
  const propLines = propsBlock.split('\n').filter(line => line.trim() && !line.trim().startsWith('//'));
  
  for (const line of propLines) {
    const match = line.match(/(\w+)(\?)?:\s*(.+?)(?:;|$)/);
    if (!match) continue;
    
    const [, name, optional, typeStr] = match;
    const type = parsePropType(typeStr.trim());
    
    props.push({
      type,
      name,
      label: name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1'),
      defaultValue: type === 'boolean' ? false : '',
      ...(type === 'select' && { options: extractEnumOptions(typeStr) }),
    });
  }
  
  return props;
}

/**
 * Parse TypeScript type to prop type
 */
function parsePropType(tsType: string): ComponentDefinition['props'][0]['type'] {
  if (tsType.includes('boolean') || tsType === 'boolean') return 'boolean';
  if (tsType.includes('number')) return 'number';
  if (tsType.includes('string') && tsType.includes('|')) return 'select';
  if (tsType === 'string') return 'string';
  return 'string';
}

/**
 * Extract enum options from union type
 */
function extractEnumOptions(tsType: string): string[] {
  const match = tsType.match(/['"]([^'"]+)['"]/g);
  if (!match) return [];
  return match.map(s => s.replace(/['"]/g, ''));
}

/**
 * Determine category from file path
 */
function determineCategory(filePath: string): string {
  const path = filePath.toLowerCase();
  if (path.includes('form')) return 'forms';
  if (path.includes('nav')) return 'navigation';
  if (path.includes('overlay') || path.includes('modal')) return 'overlays';
  if (path.includes('feedback') || path.includes('alert')) return 'feedback';
  if (path.includes('display') || path.includes('data')) return 'data-display';
  if (path.includes('layout')) return 'layout';
  return 'custom';
}

/**
 * Generate default props from interface
 */
function generateDefaultProps(props: ComponentDefinition['props']): Record<string, any> {
  const defaults: Record<string, any> = {};
  
  for (const prop of props) {
    if (prop.defaultValue !== undefined) {
      defaults[prop.name] = prop.defaultValue;
    } else {
      switch (prop.type) {
        case 'boolean': defaults[prop.name] = false; break;
        case 'number': defaults[prop.name] = 0; break;
        case 'select': defaults[prop.name] = prop.options?.[0] || ''; break;
        default: defaults[prop.name] = '';
      }
    }
  }
  
  return defaults;
}

/**
 * Setup file watching via VS Code
 */
function setupFileWatcher(): void {
  // Listen for file change events from VS Code
  window.addEventListener('message', (event) => {
    const message = event.data;
    
    if (message?.command === 'componentFileChanged') {
      handleFileChange(message.filePath, message.changeType);
    }
  });
  
  // Request VS Code to start watching
  postMessageToVSCode({
    command: 'watchComponents',
    patterns: COMPONENT_PATTERNS,
  });
}

/**
 * Handle file change event
 */
async function handleFileChange(filePath: string, changeType: 'created' | 'changed' | 'deleted'): Promise<void> {
  console.log('[ComponentLoader] File changed:', filePath, changeType);
  
  const store = useShadcnPaletteStore.getState();
  
  switch (changeType) {
    case 'created':
      const newComponent = await loadUserComponent(filePath);
      if (newComponent) {
        emitHotReloadEvent({
          type: 'component-added',
          componentId: newComponent.id,
          filePath,
        });
      }
      break;
      
    case 'changed':
      const existingComponent = componentCache.get(filePath);
      if (existingComponent) {
        store.removeUserComponent(existingComponent.id);
      }
      const updatedComponent = await loadUserComponent(filePath);
      if (updatedComponent) {
        emitHotReloadEvent({
          type: 'component-updated',
          componentId: updatedComponent.id,
          filePath,
        });
      }
      break;
      
    case 'deleted':
      const deletedComponent = componentCache.get(filePath);
      if (deletedComponent) {
        store.removeUserComponent(deletedComponent.id);
        componentCache.delete(filePath);
        emitHotReloadEvent({
          type: 'component-removed',
          componentId: deletedComponent.id,
          filePath,
        });
      }
      break;
  }
}

/**
 * Post message to VS Code extension
 */
function postMessageToVSCode<T>(message: any): Promise<T | null> {
  return new Promise((resolve) => {
    if (!isRunningInVSCode()) {
      resolve(null);
      return;
    }
    
    const requestId = Math.random().toString(36).substring(7);
    const handler = (event: MessageEvent) => {
      if (event.data?.requestId === requestId) {
        window.removeEventListener('message', handler);
        resolve(event.data.payload);
      }
    };
    
    window.addEventListener('message', handler);
    
    // @ts-ignore
    if (window.acquireVsCodeApi) {
      // @ts-ignore
      window.acquireVsCodeApi().postMessage({
        ...message,
        requestId,
      });
    }
    
    // Timeout after 5 seconds
    setTimeout(() => {
      window.removeEventListener('message', handler);
      resolve(null);
    }, 5000);
  });
}

/**
 * Subscribe to hot reload events
 */
export function onHotReload(callback: (event: HotReloadEvent) => void): () => void {
  hotReloadListeners.push(callback);
  
  return () => {
    const index = hotReloadListeners.indexOf(callback);
    if (index > -1) {
      hotReloadListeners.splice(index, 1);
    }
  };
}

/**
 * Emit hot reload event
 */
function emitHotReloadEvent(event: HotReloadEvent): void {
  hotReloadListeners.forEach(listener => {
    try {
      listener(event);
    } catch (error) {
      console.error('[ComponentLoader] Hot reload listener error:', error);
    }
  });
}

/**
 * Get all loaded user components
 */
export function getUserComponents(): UserComponent[] {
  return Array.from(componentCache.values());
}

/**
 * Get component by file path
 */
export function getComponentByPath(filePath: string): UserComponent | undefined {
  return componentCache.get(filePath);
}

/**
 * Manually trigger a rescan (for refresh button)
 */
export async function rescanComponents(): Promise<void> {
  const store = useShadcnPaletteStore.getState();
  
  // Clear existing user components
  for (const component of getUserComponents()) {
    store.removeUserComponent(component.id);
  }
  componentCache.clear();
  
  // Rescan
  await initializeComponentLoader();
}
