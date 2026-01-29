# agentful Studio - Architecture Analysis & Solutions

## Executive Summary

This document analyzes 4 architectural gaps identified in agentful Studio and provides comprehensive solutions for each gap.

**Status**: 🟡 Architecture Analysis Phase - Ready for Implementation Planning

---

## Gap 1: Route Persistence on Hot Reload

### Current Behavior
- When hot reload triggers (extension.ts:120-144), webview HTML is regenerated
- HashRouter state is lost, user returns to main page (`/`)
- User loses their place in the app (e.g., `/integrations`, `/c/forms`)

### Root Cause
The `reloadWebview` command regenerates HTML from `index.html` without preserving the current route:

```typescript
// extension.ts:100-117
const reloadCommand = vscode.commands.registerCommand('agentful.studio.reloadWebview', async () => {
  // ...
  if (panel) {
    const html = getWebviewContent(panel.webview, context.extensionUri); // ❌ No route parameter
    panel.webview.html = html; // Route lost
  }
});
```

### Proposed Solution

**Phase 1: Route Persistence (localStorage)**

1. **Save route before reload** - Add to webview message handler:
```typescript
// Before reload, ask webview for current route
panel.webview.postMessage({ command: 'getBeforeReload' });
```

2. **Webview responds with current route**:
```typescript
// App.tsx
useEffect(() => {
  const handler = (e: MessageEvent) => {
    if (e.data.command === 'getBeforeReload') {
      // Send current route back to extension
      const currentRoute = window.location.hash.replace('#', '') || '/';
      vscode.postMessage({
        command: 'saveBeforeReload',
        route: currentRoute
      });
    }
  };
  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);
}, []);
```

3. **Extension persists route to workspaceState**:
```typescript
// extension.ts
let pendingRoute: string | undefined;

panel.webview.onDidReceiveMessage(async (message) => {
  if (message.command === 'saveBeforeReload') {
    pendingRoute = message.route;
  }
});

// In reloadWebview command
const html = getWebviewContent(
  panel.webview,
  context.extensionUri,
  pendingRoute // ✅ Use saved route
);
```

**Phase 2: Auto-save on route change**

Store route to `localStorage` on every navigation:
```typescript
// App.tsx - useLocation hook
const location = useLocation();
useEffect(() => {
  localStorage.setItem('agentful:last-route', location.pathname);
}, [location.pathname]);
```

Then read from localStorage as fallback:
```typescript
// getInitialRoute() in App.tsx
const getInitialRoute = () => {
  if (typeof window !== 'undefined') {
    // Priority 1: Extension-provided route (hot reload)
    if ((window as any).__INITIAL_ROUTE__) {
      return (window as any).__INITIAL_ROUTE__;
    }
    // Priority 2: localStorage (accidental close)
    const saved = localStorage.getItem('agentful:last-route');
    if (saved) return saved;
  }
  return '/';
};
```

### Benefits
- ✅ Preserves user context across hot reloads
- ✅ Survives accidental webview closes
- ✅ Minimal code changes required

---

## Gap 2: Integration Hub Sidebar Navigation

### Current Behavior
- Sidebar button calls `openFullscreenStudio('/integrations')`
- This posts a message to extension to open a NEW panel
- If panel already open, it doesn't navigate to `/integrations`
- User sees no feedback when clicking the button

### Root Cause

The sidebar webview and main panel webview are separate contexts. The sidebar button:

```typescript
// studio-sidebar.tsx:81-87
const handleOpenIntegrationHub = () => {
  if (isVSCode) {
    openFullscreenStudio('/integrations') // Opens NEW panel
  } else {
    navigate('/integrations') // This works in browser
  }
};
```

The extension handler:
```typescript
// extension.ts:89-92
const openIntegrationHubCommand = vscode.commands.registerCommand(
  'agentful.studio.openIntegrationHub',
  () => {
    openStudioPanel(context, '/integrations'); // Creates NEW panel
  }
);
```

### Proposed Solution

**Option A: Navigate Existing Panel (Recommended)**

Modify the extension to check if panel exists and navigate it:

```typescript
// extension.ts - modify openIntegrationHubCommand
const openIntegrationHubCommand = vscode.commands.registerCommand(
  'agentful.studio.openIntegrationHub',
  () => {
    if (panel) {
      // Panel exists - navigate it
      panel.webview.postMessage({ command: 'navigate', route: '/integrations' });
      panel.reveal(vscode.ViewColumn.Active);
    } else {
      // No panel - create new one
      openStudioPanel(context, '/integrations');
    }
  }
);
```

Add message handler in webview:
```typescript
// App.tsx - add to message listener
useEffect(() => {
  const handler = (e: MessageEvent) => {
    if (e.data.command === 'navigate' && e.data.route) {
      navigate(e.data.route);
    }
  };
  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);
}, [navigate]);
```

**Option B: Sidebar-to-Panel Direct Message**

Let sidebar post directly to panel (if both webviews can communicate):

```typescript
// studio-sidebar.tsx
const handleOpenIntegrationHub = () => {
  if (isVSCode) {
    // Post to extension to forward to panel
    vscode.postMessage({
      command: 'navigatePanel',
      route: '/integrations'
    });
  } else {
    navigate('/integrations');
  }
};
```

### Benefits
- ✅ Integration Hub button works as expected
- ✅ Reuses existing panel instead of opening duplicates
- ✅ Consistent behavior across all sidebar navigation buttons

---

## Gap 3: Live Preview Architecture

### Current Behavior
- Main canvas shows `VisualWebsiteBuilder` component
- This is a mocked visual editor with:
  - Canvas editor for drag-drop components
  - Component palette with shadcn/ui components
  - Project manager and export dialogs
- **Not connected to any running dev server**
- Shows placeholder content, not user's actual app

### User's Requirement
> "The main canvas area should not show this mocked visual builder. It should instead show the live webserver. We need to think of a way to set this up where a user will be able to see their running app -> and use the component library and visual editor."

### Proposed Architecture

#### Phase 1: Live Preview Foundation

**1. Detect Running Dev Server**

```typescript
// packages/studio/vscode/dev-server-detector.ts
export interface DevServerInfo {
  url: string;
  port: number;
  framework: Framework;
  processId?: number;
}

export class DevServerDetector {
  async detectRunningServer(workspacePath: string): Promise<DevServerInfo | null> {
    // Check common ports: 3000, 5173, 8080, 4200, etc.
    const commonPorts = [3000, 5173, 8080, 4200, 3001, 4173];

    for (const port of commonPorts) {
      const running = await this.isPortInUse(port);
      if (running) {
        return {
          url: `http://localhost:${port}`,
          port,
          framework: await this.detectFramework(workspacePath)
        };
      }
    }

    return null;
  }

  private async isPortInUse(port: number): Promise<boolean> {
    // Use VS Code extension API to check if port is in use
    // Or try to fetch from localhost:port
  }

  private async detectFramework(workspacePath: string): Promise<Framework> {
    // Read package.json to detect framework
    // - vite -> Vite (React/Vue/Svelte)
    // - next -> Next.js
    // - nuxt -> Nuxt.js
    // - angular -> Angular
    // - @sveltejs/kit -> SvelteKit
  }
}
```

**2. Live Preview Component**

```typescript
// packages/studio/src/components/live-preview.tsx
interface LivePreviewProps {
  devServer: DevServerInfo;
  framework: Framework;
  showOverlay?: boolean; // For component palette/injector
}

export function LivePreview({ devServer, showOverlay }: LivePreviewProps) {
  return (
    <div className="relative h-full w-full">
      {/* Live app preview */}
      <iframe
        src={devServer.url}
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin allow-forms"
      />

      {/* Optional overlay for component palette/injector */}
      {showOverlay && (
        <ComponentInjectorOverlay framework={framework} />
      )}
    </div>
  );
}
```

**3. MainView Logic**

```typescript
// packages/studio/src/components/main-view.tsx
export function MainView() {
  const [devServer, setDevServer] = useState<DevServerInfo | null>(null);
  const sidebarMode = useSidebarMode();

  useEffect(() => {
    // Detect running dev server
    if (isRunningInVSCode()) {
      vscode.postMessage({ command: 'detectDevServer' });
    }
  }, []);

  return (
    <div className="h-full flex">
      {sidebarMode ? (
        <StudioSidebar />
      ) : (
        <>
          {devServer ? (
            <LivePreview devServer={devServer} />
          ) : (
            <VisualWebsiteBuilder /> // Fallback for now
          )}
        </>
      )}
    </div>
  );
}
```

#### Phase 2: Component Library Integration

**1. Framework Detection**

```typescript
// packages/studio/vscode/framework-detector.ts
export enum Framework {
  REACT = 'react',
  NEXT = 'next',
  VUE = 'vue',
  NUXT = 'nuxt',
  SVELTE = 'svelte',
  SVELTEKIT = 'sveltekit',
  ANGULAR = 'angular',
  SOLID = 'solid',
  UNKNOWN = 'unknown'
}

export interface FrameworkInfo {
  framework: Framework;
  hasTypeScript: boolean;
  componentLibrary?: ComponentLibrary;
  buildTool: 'vite' | 'webpack' | 'esbuild' | 'turbopack' | 'unknown';
}

export enum ComponentLibrary {
  SHADCN_UI = 'shadcn-ui',
  CHAKRA_UI = 'chakra-ui',
  MATERIAL_UI = 'material-ui',
  ANTD = 'antd',
  PRIME_REACT = 'prime-react',
  TAILWIND_UI = 'tailwind-ui',
  RADIX_UI = 'radix-ui',
  NONE = 'none'
}
```

**2. Component Library Detector**

```typescript
// packages/studio/vscode/component-library-detector.ts
export class ComponentLibraryDetector {
  async detect(workspacePath: string): Promise<FrameworkInfo> {
    const packageJson = await this.readPackageJson(workspacePath);
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

    // Detect framework
    const framework = this.detectFramework(dependencies);

    // Detect component library
    const componentLibrary = this.detectComponentLibrary(dependencies, framework);

    // Detect build tool
    const buildTool = this.detectBuildTool(dependencies);

    return {
      framework,
      hasTypeScript: !!devDependencies.typescript,
      componentLibrary,
      buildTool
    };
  }

  private detectComponentLibrary(
    dependencies: Record<string, string>,
    framework: Framework
  ): ComponentLibrary {
    // Check for shadcn/ui
    if (dependencies['@shadcn/ui'] || this.hasShadcnComponents()) {
      return ComponentLibrary.SHADCN_UI;
    }

    // Check for other libraries
    if (dependencies['@chakra-ui/react']) return ComponentLibrary.CHAKRA_UI;
    if (dependencies['@mui/material']) return ComponentLibrary.MATERIAL_UI;
    if (dependencies['antd']) return ComponentLibrary.ANTD;
    if (dependencies['primevue']) return ComponentLibrary.PRIME_REACT; // Vue version

    return ComponentLibrary.NONE;
  }

  private hasShadcnComponents(): boolean {
    // Check for components.json or ui/ directory structure
    const hasComponentsJson = fs.existsSync(path.join(workspacePath, 'components.json'));
    const hasUiDir = fs.existsSync(path.join(workspacePath, 'components/ui'));

    return hasComponentsJson || hasUiDir;
  }
}
```

**3. Component Palette (React + shadcn)**

```typescript
// packages/studio/src/components/component-palette.tsx
interface ComponentPaletteProps {
  framework: Framework;
  componentLibrary: ComponentLibrary;
  onInsertComponent: (component: Component) => void;
}

export function ComponentPalette({ framework, componentLibrary }: ComponentPaletteProps) {
  const components = useMemo(() => {
    if (framework === Framework.REACT && componentLibrary === ComponentLibrary.SHADCN_UI) {
      return getShadcnComponents();
    }
    // Add other framework/library combinations
    return [];
  }, [framework, componentLibrary]);

  return (
    <div className="component-palette">
      <h3>Components</h3>
      {components.map(component => (
        <ComponentItem
          key={component.name}
          component={component}
          onInsert={onInsertComponent}
        />
      ))}
    </div>
  );
}
```

#### Phase 3: Multi-Stack Support

**Universal Component Injector**

For frameworks other than React + shadcn, provide generic tools:

```typescript
// packages/studio/src/services/component-injector.ts
export interface ComponentInjector {
  // Insert component at cursor position
  insertComponent(component: string, template: string): Promise<void>;

  // Get available components for current framework
  getAvailableComponents(): Promise<Component[]>;

  // Generate boilerplate for new component
  generateComponent(name: string): Promise<string>;
}

export class ReactInjector implements ComponentInjector {
  async insertComponent(component: string, template: string) {
    // Find active text editor
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    // Insert at cursor position
    editor.edit(editBuilder => {
      editBuilder.insert(editor.selection.active, template);
    });
  }
}

export class VueInjector implements ComponentInjector {
  // Vue-specific implementation
}

export class SvelteInjector implements ComponentInjector {
  // Svelte-specific implementation
}
```

### Benefits
- ✅ Shows actual running app, not mock builder
- ✅ Works with any frontend stack
- ✅ Component library integration adapts to detected framework
- ✅ Can be phased in gradually (live preview first, then tools)

---

## Gap 4: Component Library Integration (React + shadcn)

### User's Requirement
> "To use the built in components it would have to detect react + shadcn and support that."

### Proposed Solution

**Phase 1: Detection (Already covered in Gap 3)**

**Phase 2: shadcn Component Browser**

```typescript
// packages/studio/src/components/shadcn-component-browser.tsx
interface ShadcnComponent {
  name: string;
  category: 'layout' | 'forms' | 'data-display' | 'feedback' | 'navigation';
  description: string;
  props: PropDef[];
  sourcePath?: string; // If component exists in project
}

export function ShadcnComponentBrowser() {
  const [components, setComponents] = useState<ShadcnComponent[]>([]);

  useEffect(() => {
    // Load shadcn components from project
    vscode.postMessage({ command: 'getShadcnComponents' });
  }, []);

  const handleInsertComponent = (component: ShadcnComponent) => {
    vscode.postMessage({
      command: 'insertShadcnComponent',
      component: component.name
    });
  };

  return (
    <div className="shadcn-browser">
      {components.map(component => (
        <ComponentCard
          key={component.name}
          component={component}
          onInsert={handleInsertComponent}
        />
      ))}
    </div>
  );
}
```

**Phase 3: Component Insertion**

```typescript
// packages/studio/vscode/component-inserter.ts
export class ComponentInserter {
  async insertShadcnComponent(componentName: string, workspacePath: string) {
    // Check if component exists
    const componentPath = path.join(workspacePath, 'components', 'ui', `${componentName}.tsx`);

    if (fs.existsSync(componentPath)) {
      // Component exists - insert import and usage
      await this.insertExistingComponent(componentName, componentPath);
    } else {
      // Component doesn't exist - offer to install it
      const choice = await vscode.window.showInformationMessage(
        `Component ${componentName} not found. Install it?`,
        'Install',
        'Cancel'
      );

      if (choice === 'Install') {
        await this.installShadcnComponent(componentName);
      }
    }
  }

  private async insertExistingComponent(name: string, path: string) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    // Add import if not present
    const importStatement = `import { ${name} } from '@/components/ui/${name}'\n`;
    await this.addImportIfNeeded(editor, importStatement);

    // Insert component usage at cursor
    const usage = `<${name} />`;
    editor.edit(editBuilder => {
      editBuilder.insert(editor.selection.active, usage);
    });
  }

  private async installShadcnComponent(name: string) {
    // Run: npx shadcn@latest add [component]
    const terminal = vscode.window.createTerminal('Install shadcn component');
    terminal.sendText(`npx shadcn@latest add ${name}`);
  }
}
```

### Benefits
- ✅ Works with existing shadcn/ui installations
- ✅ Offers to install missing components
- ✅ Handles imports automatically
- ✅ Inserts component usage at cursor position

---

## Implementation Priority

### Phase 1: Quick Wins (1-2 days)
1. ✅ **Route persistence** - Critical for developer experience
2. ✅ **Integration Hub navigation** - Expected behavior, broken currently

### Phase 2: Live Preview Foundation (3-5 days)
3. ✅ **Dev server detection** - Core infrastructure
4. ✅ **Live preview component** - Replace mock builder
5. ✅ **Framework detection** - Multi-stack support foundation

### Phase 3: Component Library Integration (5-7 days)
6. ✅ **Component library detection** - React + shadcn priority
7. ✅ **Component browser UI** - Browse available components
8. ✅ **Component insertion** - Auto-import + insert usage

### Phase 4: Multi-Stack Expansion (Ongoing)
9. ✅ **Vue + Nuxt UI** - Vue component library
10. ✅ **Svelte + Skeleton UI** - Svelte component library
11. ✅ **Angular + Angular Material** - Angular component library

---

## Architecture Readiness: Are We Setup for This?

### ✅ Strengths
- VS Code Extension API - Full access to file system, processes, terminals
- React webview - Can render sophisticated UIs
- Message passing architecture - Extension ↔ Webview communication established
- Hot reload system - Already in place, just needs route preservation
- HashRouter - Client-side routing works well

### ⚠️ Gaps to Address
- **No dev server detection** - Need to implement process/port detection
- **No framework detection** - Need package.json parsing
- **No component library detection** - Need workspace scanning
- **Mock builder in place** - Need to replace with live preview
- **No component insertion** - Need text editor manipulation

### 🟡 Architecture Assessment

**Can we support this?** YES ✅

**Current state**: 70% ready
- Extension infrastructure: ✅ Complete
- Webview rendering: ✅ Complete
- Message passing: ✅ Complete
- Live preview: ❌ Not implemented
- Framework detection: ❌ Not implemented
- Component injection: ❌ Not implemented

**Recommended approach**: Incremental implementation
1. Fix route persistence (high impact, low effort)
2. Fix sidebar navigation (high impact, low effort)
3. Add dev server detection (medium effort, enables live preview)
4. Replace mock builder with live preview (high impact, medium effort)
5. Add framework detection (enables component library features)
6. Build component library integration (complex, high value)

---

## Next Steps

1. **Review this analysis** with stakeholders
2. **Prioritize phases** based on user needs
3. **Create implementation plan** with task breakdown
4. **Start with Phase 1** (Quick Wins)

**Estimated total effort**: 10-15 days for full implementation
**Quick wins alone**: 1-2 days for route + navigation fixes
