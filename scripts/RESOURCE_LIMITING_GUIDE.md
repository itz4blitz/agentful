# Resource Limiting Guide for Claude Code on macOS

This guide documents OS-level and system-level solutions for limiting Claude Code agent resources on macOS.

## Table of Contents

1. [macOS Resource Limiting](#macos-resource-limiting)
2. [Process Monitoring Solutions](#process-monitoring-solutions)
3. [VS Code / Claude Code Settings](#vs-code--claude-code-settings)
4. [Node.js Child Process Limits](#nodejs-child-process-limits)
5. [Complete Solution Recommendations](#complete-solution-recommendations)

---

## 1. macOS Resource Limiting

### ulimit (Limited Functionality)

**What works:**
- File descriptor limits (`-n`)
- Max processes (`-u`)
- Stack size (`-s`)
- CPU time limits (`-t`) - max CPU seconds before SIGKILL

**What DOESN'T work on macOS:**
- Memory limits (`-m`, `-v`) - **NOT ENFORCED on macOS**
- Data segment limits (`-d`) - **NOT ENFORCED on macOS**

#### Current System Limits

```bash
# Check current limits
ulimit -a

# Typical output on macOS:
# -t: cpu time (seconds)              unlimited
# -f: file size (blocks)              unlimited
# -d: data seg size (kbytes)          unlimited
# -s: stack size (kbytes)             8176
# -c: core file size (blocks)         0
# -v: address space (kbytes)          unlimited
# -l: locked-in-memory size (kbytes)  unlimited
# -u: processes                       10666
# -n: file descriptors                unlimited
```

#### Setting CPU Time Limits

```bash
# Limit CPU time to 60 seconds per process
ulimit -t 60

# Then run your command
claude --resume

# Process will be killed after 60 CPU seconds
```

**Limitations:**
- Only affects the current shell session
- Child processes inherit but can modify their own limits
- Does NOT limit real-time duration, only CPU time

### launchctl (System-Wide Limits)

**Note:** As of macOS 13.5+, setting system-wide limits via launchctl is restricted by SIP (System Integrity Protection).

```bash
# View current system limits
launchctl limit

# Typical output:
# cpu         unlimited      unlimited
# filesize    unlimited      unlimited
# data        unlimited      unlimited
# stack       8372224        67092480
# core        0              unlimited
# rss         unlimited      unlimited
# memlock     unlimited      unlimited
# maxproc     10666          16000
# maxfiles    256            unlimited
```

#### Temporary Changes (Requires sudo, may not work on recent macOS)

```bash
# Increase file descriptor limit
sudo launchctl limit maxfiles 524288 524288

# Note: This does NOT persist across reboots
# and may be blocked by SIP on macOS 13.5+
```

**Recommendation:** Don't rely on launchctl for resource limiting in modern macOS.

### macOS Does NOT Support cgroups

Linux cgroups are not available on macOS. There is no native equivalent for fine-grained resource control groups.

---

## 2. Process Monitoring Solutions

### Option A: Custom Watchdog Script (RECOMMENDED)

We provide a bash watchdog script that monitors and kills processes exceeding CPU thresholds.

**Location:** `/Users/blitz/Development/agentful/scripts/watchdog-cpu-limit.sh`

**Usage:**

```bash
# Make executable
chmod +x scripts/watchdog-cpu-limit.sh

# Kill claude processes using >150% CPU for 30+ seconds
./scripts/watchdog-cpu-limit.sh "claude" 150 10 3

# Kill any node process using >200% CPU for 60+ seconds
./scripts/watchdog-cpu-limit.sh "node" 200 20 3

# Run in background
./scripts/watchdog-cpu-limit.sh "claude" 150 10 3 > /tmp/watchdog.log 2>&1 &
```

**How it works:**
1. Monitors processes matching a pattern every N seconds
2. Tracks consecutive violations of CPU threshold
3. Kills process after grace period of sustained high CPU
4. Resets violation count if CPU drops below threshold

**Advantages:**
- Prevents runaway processes
- Grace period prevents killing legitimate high-CPU bursts
- Logs all actions for debugging
- Easy to customize thresholds

### Option B: macOS Activity Monitor Automation

Use AppleScript to monitor and kill via Activity Monitor:

```applescript
-- Save as ~/Library/Scripts/kill_high_cpu.scpt
tell application "System Events"
    repeat
        set processList to (do shell script "ps aux | awk '{if ($3 > 150.0) print $2}'")
        if processList is not "" then
            repeat with pid in paragraphs of processList
                try
                    do shell script "kill -9 " & pid
                end try
            end repeat
        end if
        delay 10
    end repeat
end tell
```

Run with:
```bash
osascript ~/Library/Scripts/kill_high_cpu.scpt
```

### Option C: Third-Party Tools

**cputhrottle** (Not available via brew, must compile):
```bash
# Compile from source
git clone https://github.com/ingenuitas/cputhrottle.git
cd cputhrottle
make
sudo mv cputhrottle /usr/local/bin/

# Usage
cputhrottle <pid> <limit_percentage>
cputhrottle 1234 50  # Limit PID 1234 to 50% CPU
```

**Note:** cputhrottle is outdated and may not work on modern macOS (M1/M2/M3).

---

## 3. VS Code / Claude Code Settings

### Extension Host Memory Limits

Add to VS Code `settings.json` (⌘+, then search "settings.json"):

```json
{
  // Limit extension host memory to 4GB (default is much higher)
  "workbench.extensionHost.maxMemory": 4096,

  // Reduce file watching to save resources
  "files.watcherExclude": {
    "**/.git/objects/**": true,
    "**/.git/subtree-cache/**": true,
    "**/node_modules/**": true,
    "**/dist/**": true,
    "**/build/**": true,
    "**/.next/**": true,
    "**/.turbo/**": true,
    "**/out/**": true
  },

  // Limit search indexing
  "search.followSymlinks": false,
  "search.exclude": {
    "**/node_modules": true,
    "**/bower_components": true,
    "**/.git": true,
    "**/dist": true,
    "**/build": true
  }
}
```

**Location of settings.json:**
- macOS: `~/Library/Application Support/Code/User/settings.json`

### Command-Line Launch Options

Launch VS Code with memory limits:

```bash
# Launch with 8GB max memory
code --max-memory=8192

# Launch with specific process limits
code --disable-extensions --max-memory=4096
```

**Note:** The `--max-memory` flag affects the main VS Code process but may not fully constrain extension processes.

### Claude Code Extension Settings

As of January 2025, Claude Code extension does not expose specific resource limit settings. The extension runs within VS Code's extension host, which is constrained by the settings above.

---

## 4. Node.js Child Process Limits

### NODE_OPTIONS Environment Variable (RECOMMENDED)

Set memory limits for all Node.js processes (including child processes):

```bash
# Set in your shell profile (~/.zshrc or ~/.bash_profile)
export NODE_OPTIONS="--max-old-space-size=2048"

# This limits Node.js heap to 2GB for ALL node processes
# Child processes spawned via child_process inherit this setting
```

**How it works:**
- `--max-old-space-size` sets V8 heap memory limit in MB
- Automatically inherited by child processes via `child_process.spawn()`
- Applies to the current terminal session and all subprocesses

**Per-session usage:**

```bash
# Temporarily limit for one command
NODE_OPTIONS="--max-old-space-size=1024" claude --resume

# Or export for the session
export NODE_OPTIONS="--max-old-space-size=2048"
claude --resume
```

### Other Node.js Memory Options

```bash
# Limit young generation (short-lived objects)
NODE_OPTIONS="--max-semi-space-size=512"

# Limit total heap (old + young)
NODE_OPTIONS="--max-heap-size=2048"

# Combine multiple flags
NODE_OPTIONS="--max-old-space-size=2048 --max-semi-space-size=512"
```

### Check Current Node.js Options

```bash
# View V8 memory options
node --v8-options | grep -i "max.*memory\|max.*heap"
```

### Wrap the Claude Binary

Create a wrapper script that enforces limits:

```bash
#!/bin/bash
# Save as ~/bin/claude-limited

# Set resource limits
export NODE_OPTIONS="--max-old-space-size=2048"
ulimit -t 300  # 5 minutes max CPU time

# Run actual claude binary
exec /path/to/real/claude "$@"
```

Make it executable and use it instead of the real claude:
```bash
chmod +x ~/bin/claude-limited
alias claude='~/bin/claude-limited'
```

---

## 5. Complete Solution Recommendations

### Strategy 1: Conservative Memory + CPU Watchdog (RECOMMENDED)

Combine multiple approaches for comprehensive protection:

```bash
# 1. Add to ~/.zshrc or ~/.bash_profile
export NODE_OPTIONS="--max-old-space-size=2048"  # 2GB Node.js heap limit

# 2. Run watchdog in background (add to .zshrc or run manually)
/path/to/agentful/scripts/watchdog-cpu-limit.sh "claude" 150 10 3 > /tmp/watchdog.log 2>&1 &

# 3. Set ulimit for CPU time (in shell before running claude)
ulimit -t 300  # 5 minutes max CPU time

# 4. Configure VS Code settings.json
# Set workbench.extensionHost.maxMemory to 4096
```

**This approach:**
- Limits Node.js memory to 2GB (prevents memory leaks)
- Kills processes using >150% CPU for 30+ seconds
- Hard kills processes after 5 minutes of CPU time
- Limits VS Code extension host memory

### Strategy 2: Aggressive Limits

For stricter control:

```bash
# Very aggressive Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=1024"  # 1GB only

# Stricter CPU watchdog (100% for 20 seconds)
./scripts/watchdog-cpu-limit.sh "claude" 100 10 2 &

# 2 minutes max CPU time
ulimit -t 120
```

### Strategy 3: Monitoring Only

If you just want visibility without killing:

```bash
# Monitor but don't kill - just log
while true; do
  ps aux | grep -i claude | grep -v grep | \
    awk '{if ($3 > 100) print strftime("%Y-%m-%d %H:%M:%S"), "PID", $2, "at", $3"% CPU"}' \
    >> /tmp/claude-cpu.log
  sleep 10
done &
```

---

## Quick Reference Commands

```bash
# Check current resource limits
ulimit -a
launchctl limit

# Check running claude/node processes
ps aux | grep -E "claude|node" | grep -v grep

# Kill all claude processes
pkill -9 claude

# Monitor CPU usage in real-time
top -pid $(pgrep -x claude)

# Check Node.js memory options
node --v8-options | grep -i max

# Test NODE_OPTIONS
NODE_OPTIONS="--max-old-space-size=512" node -e "console.log(v8.getHeapStatistics())"
```

---

## Troubleshooting

### Problem: Watchdog script isn't killing processes

**Solution:**
- Check the script is running: `ps aux | grep watchdog`
- Check the log: `tail -f /tmp/watchdog.log`
- Verify CPU threshold is reasonable for your machine
- Try reducing grace period or check interval

### Problem: NODE_OPTIONS not taking effect

**Solution:**
- Verify it's exported: `echo $NODE_OPTIONS`
- Restart your terminal session
- Check if package.json has conflicting NODE_OPTIONS
- Use `node --max-old-space-size=2048` directly in command

### Problem: ulimit changes don't persist

**Solution:**
- ulimit only affects current shell session
- Add to your shell profile (~/.zshrc)
- Must re-run before each claude invocation

### Problem: macOS 13.5+ blocks launchctl changes

**Solution:**
- This is by design (SIP protection)
- Use per-process limits instead (ulimit, NODE_OPTIONS)
- Use watchdog script for enforcement

---

## Summary

**Best practices for limiting Claude Code resources on macOS:**

1. **Memory:** Set `NODE_OPTIONS="--max-old-space-size=2048"` globally
2. **CPU:** Use the watchdog script with reasonable thresholds
3. **Time:** Set `ulimit -t` before running claude
4. **VS Code:** Configure `workbench.extensionHost.maxMemory` in settings.json
5. **Monitoring:** Keep logs and review regularly

**What doesn't work:**
- macOS memory limits via ulimit/launchctl (not enforced)
- cgroups (not available on macOS)
- System-wide launchctl limits (blocked by SIP on modern macOS)

**Critical limitation:**
There is no perfect solution on macOS for hard memory limits. The NODE_OPTIONS approach is the most effective for Node.js processes, but it's a soft limit that can be exceeded temporarily. The watchdog script provides a failsafe for CPU runaway, but memory leaks may still occur before the process is killed.

For production environments or critical systems, consider running resource-intensive tasks in Docker containers with proper cgroup limits, or use a Linux VM where more robust resource controls are available.
