#!/bin/bash

echo "🔧 Testing agentful Studio Extension..."
echo ""

# Check if extension is built
if [ ! -f "dist/extension.js" ]; then
    echo "❌ Extension not built. Building now..."
    npm run build:extension
    if [ $? -ne 0 ]; then
        echo "❌ Build failed!"
        exit 1
    fi
fi

echo "✅ Extension built successfully"
echo ""

# Check if webview is built
if [ ! -f "dist/assets/index.js" ]; then
    echo "⚠️  Webview not built. Building now..."
    npm run build:webview
fi

echo "✅ Ready to test!"
echo ""
echo "📋 To test in VS Code:"
echo "1. Open this folder in VS Code: cd $(pwd)"
echo "2. Press F5 or use 'Run Extension' debug configuration"
echo "3. In the new window, open Command Palette (Cmd+Shift+P)"
echo "4. Type: 'Open agentful Studio'"
echo ""
echo "🔍 Debugging tips:"
echo "- Check 'Output' panel -> 'Extension Host' for errors"
echo "- Check 'Debug Console' for console.log output"
echo "- Set breakpoints in extension.ts or vscode/ files"
