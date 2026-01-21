# Quick Reference: Resource Limiting on macOS

## One-Line Solutions

```bash
# QUICK START: Automated setup with conservative limits
./scripts/setup-resource-limits.sh conservative

# QUICK FIX: Limit Node.js memory right now
export NODE_OPTIONS="--max-old-space-size=2048" && claude --resume

# EMERGENCY: Kill all runaway claude processes
pkill -9 claude

# WATCHDOG: Monitor and auto-kill high CPU processes
./scripts/watchdog-cpu-limit.sh "claude" 150 10 3 > /tmp/watchdog.log 2>&1 &
```

## Essential Commands

### Memory Limits
```bash
# Node.js heap limit (2GB) - inherited by child processes
export NODE_OPTIONS="--max-old-space-size=2048"

# Make permanent
echo 'export NODE_OPTIONS="--max-old-space-size=2048"' >> ~/.zshrc
```

### CPU Limits
```bash
# Max 5 minutes of CPU time
ulimit -t 300
claude --resume

# Watchdog: kill at >150% CPU for 30+ seconds
./scripts/watchdog-cpu-limit.sh "claude" 150 10 3 &
```

### VS Code Settings
Add to `~/Library/Application Support/Code/User/settings.json`:
```json
{
  "workbench.extensionHost.maxMemory": 4096
}
```

## Monitoring

```bash
# Check current limits
ulimit -a

# Watch claude processes
watch -n 2 'ps aux | grep -E "claude|node" | grep -v grep'

# Real-time CPU monitor
top -pid $(pgrep claude)

# Check Node.js settings
echo $NODE_OPTIONS
node --v8-options | grep -i max
```

## Common Scenarios

### Scenario 1: Claude using too much CPU
```bash
# Start watchdog with 100% CPU threshold (kill after 30s)
./scripts/watchdog-cpu-limit.sh "claude" 100 10 3 &
```

### Scenario 2: Running out of memory
```bash
# Limit Node.js to 1GB
export NODE_OPTIONS="--max-old-space-size=1024"
```

### Scenario 3: Process won't stop
```bash
# Find and kill
ps aux | grep claude
kill -9 [PID]

# Or kill all
pkill -9 claude
```

### Scenario 4: Want to monitor but not kill
```bash
# Log high CPU usage without killing
./scripts/watchdog-cpu-limit.sh "claude" 9999 10 999 > /tmp/cpu-monitor.log &
```

## Profiles

| Profile | Node Memory | CPU Threshold | Max CPU Time | Use Case |
|---------|-------------|---------------|--------------|----------|
| **conservative** | 2GB | 150% for 30s | 5 min | Normal development |
| **aggressive** | 1GB | 100% for 20s | 2 min | Constrained systems |
| **monitoring** | 2GB | No killing | Unlimited | Debugging |

## Testing

```bash
# Test memory limit
NODE_OPTIONS="--max-old-space-size=512" node -e "console.log(v8.getHeapStatistics())"

# Simulate high CPU (for testing watchdog)
yes > /dev/null &
PID=$!
sleep 35
kill $PID
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| NODE_OPTIONS not working | `export NODE_OPTIONS="..."` then restart terminal |
| Watchdog not killing | Check `ps aux | grep watchdog` and `/tmp/watchdog.log` |
| ulimit changes lost | Add to `~/.zshrc` and re-source |
| VS Code still using memory | Restart VS Code after settings change |

## Emergency Commands

```bash
# Kill everything agentful-related
pkill -9 -f agentful
pkill -9 claude
pkill -9 -f watchdog

# Reset all limits
ulimit -S -a  # Show soft limits
ulimit -H -a  # Show hard limits

# Restart VS Code
killall "Visual Studio Code"

# Clear watchdog
pkill -f watchdog-cpu-limit
rm /tmp/watchdog.log
```

## File Locations

| File | Location |
|------|----------|
| Shell profile | `~/.zshrc` or `~/.bash_profile` |
| VS Code settings | `~/Library/Application Support/Code/User/settings.json` |
| Watchdog log | `/tmp/watchdog.log` or `/tmp/agentful-watchdog.log` |
| Launchd plist | `~/Library/LaunchAgents/com.agentful.watchdog.plist` |

## Best Practice Stack

1. **NODE_OPTIONS** for memory: `export NODE_OPTIONS="--max-old-space-size=2048"`
2. **Watchdog** for CPU: `./scripts/watchdog-cpu-limit.sh "claude" 150 10 3 &`
3. **ulimit** for time: `ulimit -t 300` (before running claude)
4. **VS Code** setting: `"workbench.extensionHost.maxMemory": 4096`

## What DOESN'T Work on macOS

- `ulimit -m` (memory) - Not enforced
- `ulimit -v` (virtual memory) - Not enforced
- cgroups - Not available
- `launchctl limit` (on macOS 13.5+) - Blocked by SIP

## More Help

- Full guide: `scripts/RESOURCE_LIMITING_GUIDE.md`
- Setup script: `scripts/setup-resource-limits.sh`
- Watchdog script: `scripts/watchdog-cpu-limit.sh`
