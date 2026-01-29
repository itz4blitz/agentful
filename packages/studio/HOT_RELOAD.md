# Hot Reload Development Guide

## Quick Start (Recommended)

### Option 1: VS Code Launch Configurations (Easiest)

1. Open VS Code in the `packages/studio` folder
2. Press `F5` or go to **Run & Debug** panel
3. Select **"Run Extension (Debug + Watch)"**
4. This will:
   - Start TypeScript watch mode for extension code
   - Start Vite watch mode for webview (React) code
   - Launch Extension Development Host

### Option 2: Manual Watch Mode

```bash
cd packages/studio

# Terminal 1: Watch extension TypeScript
npm run watch:extension

# Terminal 2: Watch webview React
npm run watch:webview

# Terminal 3: Launch VS Code with extension
npm run dev:extension
```

## Reloading Changes

### Webview (React) Changes
When you save a `.tsx` file in `src/`:
- Vite automatically rebuilds
- Press **Cmd+Shift+R** (or run `Agentful: Reload Webview` command)
- Webview refreshes instantly - no IDE restart needed!

### Extension (TypeScript) Changes  
When you save a `.ts` file in `vscode/` or `extension.ts`:
- TypeScript watch rebuilds automatically
- **Extension Development Host needs restart** (Cmd+R or Stop/Start debug)
- This is a VS Code limitation - extension code requires restart

## Keyboard Shortcuts

| Key | Command |
|-----|---------|
| `Cmd+Shift+R` | Reload Webview |
| `F5` | Start Debugging |
| `Shift+Cmd+F5` | Restart Debugging |

## Available Commands

Open Command Palette (`Cmd+Shift+P`) and type "Agentful":

- **Open agentful studio** - Opens main panel
- **Open Integration Hub** - Opens integration hub directly
- **Reload Webview** - Refreshes webview without restart
- **Rescan Components** - Rescans for user components

## Development Workflow

### For UI/React Changes:
1. Edit files in `src/components/`
2. Save (Vite rebuilds automatically)
3. Press `Cmd+Shift+R` to reload webview
4. See changes instantly!

### For Extension Logic Changes:
1. Edit files in `vscode/` or `extension.ts`
2. Save (TypeScript rebuilds)
3. Press `Cmd+R` to restart Extension Host
4. Or click the Restart button in debug toolbar

### For Both:
1. Run the "Extension + Webview Watch" compound launch config
2. Edit any file
3. Reload as needed (Cmd+Shift+R for webview, Cmd+R for extension)

## Troubleshooting

### "Changes not showing up"
- Check the Output panel → "Agentful Studio" for build errors
- Make sure watch mode is running (check terminal for rebuild messages)
- Try Cmd+Shift+R to reload webview

### "Extension not loading"
- Check `dist/` folder exists with compiled files
- Run `npm run build` first if needed
- Check VS Code Debug Console for errors

### "Port already in use"
- Kill all node processes: `pkill -f node`
- Or restart VS Code

## VS Code Debug Configuration

The `.vscode/launch.json` includes:

1. **Run Extension (with Hot Reload)** - Standard debug with build
2. **Run Extension (Debug + Watch)** - With file watchers
3. **Extension + Webview Watch** - Compound config with both watchers

## Tips

1. **Use the Debug Console** - See extension logs in real-time
2. **Watch the Output Panel** - Build status and errors
3. **Status Bar** - Shows reload command when extension is active
4. **Source Maps** - Set breakpoints in TypeScript/TSX files directly

## Alternative: Browser Development

For rapid UI iteration without VS Code:

```bash
cd packages/studio
npm run dev
```

Opens at `http://localhost:5173` - but note this won't have VS Code API access.
