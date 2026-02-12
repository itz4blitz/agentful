# Agentful Workspace Setup

This monorepo uses a VS Code workspace file for multi-package development.

## 🚀 Quick Start

### 1. Open the Workspace

```bash
# From the project root
code agentful.code-workspace
```

Or in VS Code: **File → Open Workspace from File...** → Select `agentful.code-workspace`

### 2. Install All Dependencies

```bash
npm run install:all
```

Or use the VS Code task: **Terminal → Run Task...** → `📦 Install All Dependencies`

### 3. Start Developing

#### Studio Extension Development

1. Go to **Run & Debug** panel (Cmd+Shift+D)
2. Select **"🎨 Studio Extension (Watch Mode)"**
3. Press F5

This will:
- Start TypeScript watch for extension code
- Start Vite watch for webview (React) code
- Launch Extension Development Host

#### Hot Reload

| Action | Command | What It Does |
|--------|---------|-------------|
| Reload Webview | `Cmd+Shift+R` | Refresh React UI without restart |
| Restart Extension | `Cmd+R` | Restart Extension Host (for .ts changes) |
| Build All | `npm run build:all` | Build all packages |

## 📁 Workspace Structure

The workspace is organized into 5 folders:

---

## 🔧 Recent Improvements

### Better Search (2025-02-11)

**Problem**: Client-side search was excluding too many files, making it hard to find content.

**Fixes**:
1. **`.vocsrc`** - Added Pagefind configuration for faster local search
   - Full-text search across all docs
   - 300 character excerpts for context
   - `searchExclude=[]` removes unnecessary exclusions

2. **`.vscode/settings.json`** - Improved workspace search configuration
   - Removed excessive search excludes
   - Keeps important files searchable (docs, skills, commands)
   - Only excludes: node_modules, dist, .git, .vocs

**To use**: Run `npm run docs:dev` and use Cmd+Shift+F for full workspace search.

### Automatic Worktree Mode (2025-02-11)

**Problem**: Agents were editing root repository directly instead of using worktrees.

**Fix**: New projects now default to `AGENTFUL_WORKTREE_MODE=auto` in template settings:
- Agents automatically create worktrees before making changes
- Safer parallel development
- Clean main branch from experimental changes

See [/concepts/git-worktrees](docs/pages/concepts/git-worktrees) for details.

---

| Folder | Path | Purpose |
|--------|------|---------|
| 🚀 Root | `/` | Main project, docs, config |
| 📦 CLI | `packages/cli` | CLI tool |
| 🔌 MCP Server | `packages/mcp-server` | MCP server implementation |
| 📦 Shared | `packages/shared` | Shared utilities |
| 🎨 VS Code Extension (Studio) | `packages/studio` | VS Code extension |

## 🛠 Available Tasks

Open **Terminal → Run Task...** (Cmd+Shift+T) to see:

- `📦 Build Studio` - Build the VS Code extension
- `👀 Watch Studio` - Watch mode for development
- `📦 Build All Packages` - Build everything
- `📦 Install All Dependencies` - Install deps in all packages

## 🔧 Workspace Settings

The workspace includes:

- **TypeScript**: Uses workspace TypeScript version
- **ESLint**: Automatic linting on save
- **Prettier**: Format on save enabled
- **File Excludes**: node_modules, dist, etc. hidden from explorer
- **Search Excludes**: Excludes large/generated files from search

## 💡 Tips

### Working Across Packages

Use `${workspaceFolder:Folder Name}` in paths:

```json
// Example: Import from shared in studio
"${workspaceFolder:📦 Shared}/src/types"
```

### Terminal Sessions

Each folder can have its own terminal session:
- Click the `+` in terminal panel
- Select which package to open terminal in

### Search Across All Packages

Use the global search (Cmd+Shift+F) - it searches all workspace folders while respecting `search.exclude` settings.

### Debug Console

When running the Studio extension, the Debug Console shows:
- Extension logs
- Webview messages
- Tool detection output

## 🐛 Troubleshooting

### "Cannot find module"

Make sure you've run `npm run install:all` from the root.

### "Extension not loading"

1. Check that `packages/studio/dist/` exists
2. Run the `📦 Build Studio` task
3. Check Debug Console for errors

### "Port already in use"

Kill all node processes:
```bash
pkill -f node
```

## 📚 See Also

- [Studio Hot Reload Guide](packages/studio/HOT_RELOAD.md) - Detailed Studio development
- [Main README](README.md) - Project overview
- [Contributing](CONTRIBUTING.md) - Contribution guidelines
