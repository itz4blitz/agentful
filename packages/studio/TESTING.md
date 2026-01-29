# Testing agentful Studio Extension

## Quick Start

### Option 1: VS Code Debugger (Recommended)

1. **Open the extension folder:**
   ```bash
   cd /Users/blitz/Development/agentful/packages/studio
   code .
   ```

2. **Launch the debugger:**
   - Press `F5` OR
   - Click "Run and Debug" → Select "Run Extension (No Build)"

3. **In the new window (Extension Development Host):**
   - Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
   - Type: `Open agentful Studio`
   - Press Enter

### Option 2: Install Pre-built Package

```bash
# Install the VSIX package
code --install-extension agentful-studio-0.0.1.vsix

# Or double-click the .vsix file in Finder
```

## Debugging Tips

### What to Check

**1. Debug Console** (View → Debug Console)
- Shows `console.log()` output from `extension.ts` and `vscode/` files
- Best place to see what your extension is doing

**2. Output Panel** (View → Output)
- Select "Extension Host" from the dropdown
- Shows VS Code extension loading errors
- Shows console output from the extension host

**3. Developer Tools**
- In the Extension Development Host window:
  - Press `Cmd+Option+I` (Mac) or `Ctrl+Shift+I` (Windows/Linux)
  - Helps debug webview issues

### Common Issues

**F5 doesn't work:**
- Make sure you're in the `packages/studio` directory
- Try "Run Extension (No Build)" instead of "Run Extension"
- Check the Debug Console for errors

**Command doesn't appear:**
- Press `Cmd+Shift+P` → type "Reload Window"
- Check if there are errors in the "Output" panel → "Extension Host"

**Webview doesn't load:**
- Open Developer Tools in the Extension Development Host
- Check the Console tab for webview errors
- Make sure `dist/assets/` exists and has the React app files

### Breakpoints

- Set breakpoints in `extension.ts` or any `vscode/` files
- Press F5 to start debugging
- Execution will pause at your breakpoints
- Use the Debug Console to inspect variables

### Environment Variables

For Clerk authentication, set these before launching:

```bash
export AGENTFUL_CLERK_PUBLISHABLE_KEY="your_key_here"
export AGENTFUL_CLERK_API_URL="https://your-clerk-instance.clerk.accounts.dev"
```

Or add them to `.vscode/launch.json`:

```json
"env": {
  "AGENTFUL_CLERK_PUBLISHABLE_KEY": "your_key_here",
  "AGENTFUL_CLERK_API_URL": "https://your-clerk-instance.clerk.accounts.dev"
}
```

## File Structure

```
dist/
├── extension.js              # Main extension entry point
├── vscode/                   # Extension code
│   ├── auth/                # Clerk authentication
│   ├── studio-panel.js      # Webview panel provider
│   └── webview/            # Webview helpers
└── assets/                  # React webview app
    └── index-*.js           # Compiled React app
```

## Testing Checklist

- [ ] Extension loads without errors
- [ ] "Open agentful Studio" command appears in command palette
- [ ] Webview panel opens when command is run
- [ ] React app loads in the webview
- [ ] No console errors in webview
- [ ] Auth buttons appear (if Clerk is configured)

## Getting Help

1. Check "Output" panel → "Extension Host" for errors
2. Check "Debug Console" for your console.log output
3. Open Developer Tools for webview debugging
4. Look at the `extension.ts` file for the main entry point

## Build Commands

```bash
# Build both extension and webview
npm run build

# Build only the extension
npm run build:extension

# Build only the webview
npm run build:webview

# Watch for changes
npm run watch

# Package as VSIX
npm run package
```
