#!/bin/bash

echo "🧪 Manual Extension Test"
echo "========================"
echo ""

# Check dist files
echo "📦 Checking extension files..."
if [ -f "dist/extension.js" ]; then
    echo "✅ extension.js exists ($(wc -l < dist/extension.js) lines)"
else
    echo "❌ extension.js missing!"
    exit 1
fi

if [ -f "dist/vscode/studio-panel.js" ]; then
    echo "✅ studio-panel.js exists"
else
    echo "❌ studio-panel.js missing!"
    exit 1
fi

if [ -f "dist/vscode/auth/clerk-service.js" ]; then
    echo "✅ clerk-service.js exists"
else
    echo "❌ clerk-service.js missing!"
    exit 1
fi

if [ -d "dist/assets" ] && [ "$(ls -A dist/assets)" ]; then
    echo "✅ webview assets exist ($(ls dist/assets | wc -l) files)"
else
    echo "❌ webview assets missing!"
    exit 1
fi

echo ""
echo "✅ Extension structure looks good!"
echo ""
echo "🚀 Next steps:"
echo "1. Open this folder in VS Code: code ."
echo "2. Press F5 to launch Extension Development Host"
echo "3. Run: 'Open agentful Studio' command"
