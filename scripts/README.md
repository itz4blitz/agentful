# Resource Limiting Scripts for Claude Code

This directory contains scripts and documentation for limiting Claude Code agent resources on macOS.

## Files

### 1. RESOURCE_LIMITING_GUIDE.md
**Comprehensive documentation** covering all OS-level and system-level solutions for resource limiting on macOS.

Topics covered:
- macOS resource limiting (ulimit, launchctl)
- Process monitoring solutions
- VS Code / Claude Code settings
- Node.js child process limits
- Complete solution recommendations

**Start here** to understand all available options.

### 2. watchdog-cpu-limit.sh
**CPU monitoring watchdog** that automatically kills processes exceeding CPU thresholds.

```bash
# Usage
./watchdog-cpu-limit.sh [process_pattern] [cpu_threshold] [check_interval] [grace_period]

# Examples
./watchdog-cpu-limit.sh "claude" 150 10 3  # Kill claude at >150% CPU for 30s
./watchdog-cpu-limit.sh "node" 200 20 3    # Kill node at >200% CPU for 60s

# Run in background
./watchdog-cpu-limit.sh "claude" 150 10 3 > /tmp/watchdog.log 2>&1 &
```

Features:
- Monitors any process by name pattern
- Configurable CPU threshold and grace period
- Logs all actions
- Prevents false positives with sustained-violation tracking

### 3. setup-resource-limits.sh
**One-command setup** for configuring all recommended resource limits.

```bash
# Usage
./setup-resource-limits.sh [profile]

# Profiles
./setup-resource-limits.sh conservative  # Moderate limits (default)
./setup-resource-limits.sh aggressive    # Strict limits
./setup-resource-limits.sh monitoring    # Log only, don't kill
```

What it does:
1. Configures NODE_OPTIONS in your shell profile
2. Sets up ulimit wrapper for claude command
3. Adds VS Code settings for extension host memory
4. Optionally installs watchdog as a launchd service

This is the **recommended quickstart** method.

## Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# Navigate to scripts directory
cd /Users/blitz/Development/agentful/scripts

# Run setup with conservative profile
./setup-resource-limits.sh conservative

# Restart your terminal
source ~/.zshrc  # or ~/.bash_profile

# Verify
echo $NODE_OPTIONS  # Should show: --max-old-space-size=2048
```

### Option 2: Manual Configuration

```bash
# 1. Set Node.js memory limit
echo 'export NODE_OPTIONS="--max-old-space-size=2048"' >> ~/.zshrc
source ~/.zshrc

# 2. Start watchdog
./watchdog-cpu-limit.sh "claude" 150 10 3 > /tmp/watchdog.log 2>&1 &

# 3. Set CPU time limit before running claude
ulimit -t 300  # 5 minutes max
claude --resume

# 4. Configure VS Code (manually edit settings.json)
# Add: "workbench.extensionHost.maxMemory": 4096
```

## Profiles Explained

### Conservative (Default)
Best for normal development work:
- Node.js heap: 2GB
- CPU threshold: 150% for 30 seconds
- Max CPU time: 5 minutes

### Aggressive
For resource-constrained systems:
- Node.js heap: 1GB
- CPU threshold: 100% for 20 seconds
- Max CPU time: 2 minutes

### Monitoring
Visibility without enforcement:
- Node.js heap: 2GB
- CPU monitoring: enabled (no killing)
- Max CPU time: unlimited

## Testing

```bash
# Test NODE_OPTIONS
node -e "console.log(v8.getHeapStatistics())"

# Check current limits
ulimit -a

# Monitor claude processes
ps aux | grep claude | grep -v grep

# Check watchdog log
tail -f /tmp/watchdog.log
```

## Troubleshooting

### Watchdog not killing processes
- Verify it's running: `ps aux | grep watchdog`
- Check logs: `tail -f /tmp/watchdog.log`
- Ensure CPU threshold is appropriate for your system

### NODE_OPTIONS not working
- Verify export: `echo $NODE_OPTIONS`
- Restart terminal
- Check for conflicting settings in package.json

### Changes don't persist
- ulimit only affects current shell session
- Add to shell profile (~/.zshrc) for persistence
- Re-source profile after changes

## Uninstalling

```bash
# 1. Remove from shell profile
# Edit ~/.zshrc and remove the AGENTFUL_RESOURCE_LIMITS section

# 2. Remove launchd service (if installed)
launchctl unload ~/Library/LaunchAgents/com.agentful.watchdog.plist
rm ~/Library/LaunchAgents/com.agentful.watchdog.plist

# 3. Restart terminal
source ~/.zshrc
```

## Important Limitations

### What Works
- CPU time limits (ulimit -t)
- CPU monitoring and killing (watchdog script)
- Node.js heap limits (NODE_OPTIONS)
- File descriptor limits
- Process count limits

### What Doesn't Work on macOS
- Memory limits via ulimit (not enforced)
- cgroups (not available)
- System-wide launchctl limits (blocked by SIP on modern macOS)

### Critical Note
There is **no perfect solution** for hard memory limits on macOS. The NODE_OPTIONS approach is the most effective for Node.js processes, but it's a soft limit that can be exceeded temporarily. The watchdog script provides a failsafe for CPU runaway, but memory leaks may still occur before detection.

For production environments or critical systems, consider:
- Running in Docker containers with cgroup limits
- Using a Linux VM where robust resource controls are available
- Implementing application-level monitoring and alerts

## Contributing

Found a better solution? Open an issue or PR at:
https://github.com/your-repo/agentful

## License

MIT
