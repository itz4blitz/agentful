# Hot Reload Development Guide

## Overview

For VS Code extension development, you work across **two VS Code windows**:
1. **Main Window** - Where you edit code (the workspace)
2. **Extension Host** - The new VS Code window that opens when you debug (where the extension runs)

Hot reload works by watching the `dist/` folder and auto-reloading webviews when files change.

## Quick Start (Recommended)

### Option 1: Using the Workspace (Easiest)

1. **Open the workspace** from project root:
   ```bash
   code agentful.code-workspace
   ```

2. **In the workspace VS Code**, open a terminal and run:
   ```bash
   cd packages/studio
   npm run watch:dev
   ```
   This builds the extension once, then watches webview files for changes.

3. **Press F5** to start debugging (or Run → Start Debugging)
   - This opens a NEW VS Code window (Extension Development Host)
   - The extension is now running in this new window

4. **Make edits** to files in `packages/studio/src/`
   - Vite automatically rebuilds
   - Extension auto-reloads webviews (debounced 300ms)

### Option 2: Manual Steps

**Terminal 1** - Watch webview files:
```bash
cd packages/studio
npm run watch:webview
```

**VS Code** - Launch debugger:
- Press F5 (or Run → Start Debugging)

## How It Works

```
You edit → Vite rebuilds → Extension detects change → Webview reloads
     ↓              ↓                    ↓                  ↓
src/*.tsx    dist/assets/*.js    FileSystemWatcher    webview.html = ...
```

The extension watches `dist/assets/*.{js,css}` for changes and automatically calls `reloadWebview`.

## Keyboard Shortcuts

In the **Extension Development Host** (the new VS Code window):

| Key | Action |
|-----|--------|
| `Cmd+Shift+R` | Manual reload webview |
| `Cmd+R` | Restart Extension Host |

## Available Commands

In the Command Palette (`Cmd+Shift+P`):

- **Agentful: Reload Webview** - Force refresh without restart
- **Agentful: Open Studio** - Opens main panel
- **Agentful: Open Integration Hub** - Opens integration hub

## Troubleshooting

### "Changes not showing up"

1. Check the **Output panel** → "agentful Studio" for rebuild messages:
   ```
   🔄 Assets changed, reloading webviews...
   ```

2. Check that `npm run watch:dev` is running in Terminal

3. Try manual reload: `Cmd+Shift+P` → "Agentful: Reload Webview"

### "Extension Development Host not opening"

1. Make sure you pressed F5 in the **main VS Code window** (not the extension host)
2. Check Debug Console for errors

### "Build errors"

```bash
cd packages/studio
npm run build
```

### "Port already in use"

Kill all node processes:
```bash
pkill -f node
```

## File Structure

```
packages/studio/
├── src/              ← Edit these files
├── dist/             ← Auto-generated (don't edit)
│   ├── extension.js  ← Extension code
│   ├── assets/       ← Webview code
│   └── index.html    ← Webview HTML
├── extension.ts      ← Extension entry point
└── vite.config.ts    ← Build config
```

## Workflow Summary

1. **Start**: `npm run watch:dev` in terminal + F5 in VS Code
2. **Edit**: Change files in `src/`
3. **Wait**: Vite rebuilds (~1-2 seconds)
4. **See**: Webview auto-reloads
5. **Repeat**: Edit → Wait → See

## Tips

- **Don't close** the terminal running `npm run watch:dev`
- **Extension Host** is the new VS Code window - look for the Agentful icon in sidebar
- **Main Window** is where you edit code
- Changes to `extension.ts` require restart (Cmd+R in Extension Host)
- Changes to `.tsx` files auto-reload via file watcher
