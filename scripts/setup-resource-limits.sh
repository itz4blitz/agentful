#!/bin/bash

###############################################################################
# Setup Resource Limits for Claude Code on macOS
#
# This script configures recommended resource limits for running Claude Code
# safely on macOS without runaway CPU or memory usage.
#
# Usage:
#   ./setup-resource-limits.sh [profile]
#
# Profiles:
#   conservative  - Moderate limits (default)
#   aggressive    - Strict limits for constrained systems
#   monitoring    - Log only, don't kill processes
###############################################################################

PROFILE="${1:-conservative}"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "=== Claude Code Resource Limit Setup ==="
echo "Profile: $PROFILE"
echo ""

# Detect shell
SHELL_NAME=$(basename "$SHELL")
if [ "$SHELL_NAME" = "zsh" ]; then
    PROFILE_FILE="$HOME/.zshrc"
elif [ "$SHELL_NAME" = "bash" ]; then
    PROFILE_FILE="$HOME/.bash_profile"
else
    echo "Warning: Unknown shell $SHELL_NAME, defaulting to ~/.zshrc"
    PROFILE_FILE="$HOME/.zshrc"
fi

echo "Detected shell: $SHELL_NAME"
echo "Profile file: $PROFILE_FILE"
echo ""

# Set profile-specific values
case "$PROFILE" in
    conservative)
        NODE_MEMORY=2048
        CPU_THRESHOLD=150
        CHECK_INTERVAL=10
        GRACE_PERIOD=3
        CPU_TIME_LIMIT=300
        echo "Conservative limits:"
        echo "  - Node.js heap: 2GB"
        echo "  - CPU threshold: 150% for 30 seconds"
        echo "  - Max CPU time: 5 minutes"
        ;;
    aggressive)
        NODE_MEMORY=1024
        CPU_THRESHOLD=100
        CHECK_INTERVAL=10
        GRACE_PERIOD=2
        CPU_TIME_LIMIT=120
        echo "Aggressive limits:"
        echo "  - Node.js heap: 1GB"
        echo "  - CPU threshold: 100% for 20 seconds"
        echo "  - Max CPU time: 2 minutes"
        ;;
    monitoring)
        NODE_MEMORY=2048
        CPU_THRESHOLD=9999  # Won't trigger
        CHECK_INTERVAL=10
        GRACE_PERIOD=999
        CPU_TIME_LIMIT=unlimited
        echo "Monitoring mode:"
        echo "  - Node.js heap: 2GB"
        echo "  - CPU monitoring: enabled (no killing)"
        echo "  - Max CPU time: unlimited"
        ;;
    *)
        echo "Error: Unknown profile '$PROFILE'"
        echo "Valid profiles: conservative, aggressive, monitoring"
        exit 1
        ;;
esac

echo ""
echo "=== Step 1: Configure Shell Profile ==="

# Backup existing profile
if [ -f "$PROFILE_FILE" ]; then
    cp "$PROFILE_FILE" "${PROFILE_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    echo "Backed up existing profile to ${PROFILE_FILE}.backup.*"
fi

# Check if already configured
if grep -q "AGENTFUL_RESOURCE_LIMITS" "$PROFILE_FILE" 2>/dev/null; then
    echo "Warning: Profile already contains agentful resource limits"
    echo "Remove the existing section and re-run this script to update"
    exit 1
fi

# Add configuration to profile
cat >> "$PROFILE_FILE" << EOF

# === AGENTFUL_RESOURCE_LIMITS (Added by setup-resource-limits.sh) ===
# Profile: $PROFILE

# Limit Node.js heap memory (inherited by child processes)
export NODE_OPTIONS="--max-old-space-size=$NODE_MEMORY"

# Set CPU time limit before running claude
claude_limited() {
    if [ "$CPU_TIME_LIMIT" != "unlimited" ]; then
        ulimit -t $CPU_TIME_LIMIT
    fi
    command claude "\$@"
}

# Alias to use limited version
alias claude='claude_limited'

# === END AGENTFUL_RESOURCE_LIMITS ===
EOF

echo "Added resource limit configuration to $PROFILE_FILE"
echo ""

echo "=== Step 2: Configure VS Code Settings ==="

VSCODE_SETTINGS="$HOME/Library/Application Support/Code/User/settings.json"

if [ ! -f "$VSCODE_SETTINGS" ]; then
    echo "VS Code settings.json not found at: $VSCODE_SETTINGS"
    echo "Please configure manually or install VS Code first"
else
    # Check if settings already configured
    if grep -q "workbench.extensionHost.maxMemory" "$VSCODE_SETTINGS"; then
        echo "VS Code already has extensionHost.maxMemory configured"
    else
        echo "Adding extension host memory limit to VS Code settings..."
        # Backup
        cp "$VSCODE_SETTINGS" "${VSCODE_SETTINGS}.backup.$(date +%Y%m%d_%H%M%S)"

        # Add setting (requires jq or manual edit)
        if command -v jq &> /dev/null; then
            tmp=$(mktemp)
            jq '. + {"workbench.extensionHost.maxMemory": 4096}' "$VSCODE_SETTINGS" > "$tmp"
            mv "$tmp" "$VSCODE_SETTINGS"
            echo "Added workbench.extensionHost.maxMemory: 4096 to VS Code settings"
        else
            echo "jq not found - please manually add to VS Code settings.json:"
            echo '  "workbench.extensionHost.maxMemory": 4096'
        fi
    fi
fi

echo ""

echo "=== Step 3: Setup CPU Watchdog ==="

WATCHDOG_SCRIPT="$SCRIPT_DIR/watchdog-cpu-limit.sh"

if [ ! -f "$WATCHDOG_SCRIPT" ]; then
    echo "Error: Watchdog script not found at $WATCHDOG_SCRIPT"
    exit 1
fi

chmod +x "$WATCHDOG_SCRIPT"

# Create launchd plist for automatic startup (optional)
read -p "Start watchdog automatically on login? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    PLIST_FILE="$HOME/Library/LaunchAgents/com.agentful.watchdog.plist"

    cat > "$PLIST_FILE" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.agentful.watchdog</string>
    <key>ProgramArguments</key>
    <array>
        <string>$WATCHDOG_SCRIPT</string>
        <string>claude</string>
        <string>$CPU_THRESHOLD</string>
        <string>$CHECK_INTERVAL</string>
        <string>$GRACE_PERIOD</string>
    </array>
    <key>StandardOutPath</key>
    <string>/tmp/agentful-watchdog.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/agentful-watchdog.err</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
EOF

    launchctl load "$PLIST_FILE" 2>/dev/null || true
    echo "Created launchd service: $PLIST_FILE"
    echo "Watchdog will start automatically on login"
    echo "Check logs at: /tmp/agentful-watchdog.log"
else
    echo "To start watchdog manually:"
    echo "  $WATCHDOG_SCRIPT claude $CPU_THRESHOLD $CHECK_INTERVAL $GRACE_PERIOD > /tmp/watchdog.log 2>&1 &"
fi

echo ""
echo "=== Setup Complete! ==="
echo ""
echo "Next steps:"
echo "1. Restart your terminal or run: source $PROFILE_FILE"
echo "2. Restart VS Code to apply settings"
echo "3. Test with: claude --version"
echo ""
echo "To verify configuration:"
echo "  echo \$NODE_OPTIONS     # Should show: --max-old-space-size=$NODE_MEMORY"
echo "  ulimit -a              # Check current limits"
echo "  ps aux | grep watchdog # Verify watchdog is running"
echo ""
echo "To uninstall:"
echo "  1. Remove the AGENTFUL_RESOURCE_LIMITS section from $PROFILE_FILE"
echo "  2. launchctl unload ~/Library/LaunchAgents/com.agentful.watchdog.plist (if installed)"
echo "  3. rm ~/Library/LaunchAgents/com.agentful.watchdog.plist"
echo ""
