#!/bin/bash

###############################################################################
# CPU Watchdog Script for macOS
#
# Monitors processes matching a pattern and kills them if CPU usage exceeds
# a threshold for a sustained period.
#
# Usage:
#   ./watchdog-cpu-limit.sh [process_pattern] [cpu_threshold] [check_interval] [grace_period]
#
# Arguments:
#   process_pattern  - grep pattern to match processes (default: "claude")
#   cpu_threshold    - CPU % threshold per core (default: 100, meaning 100% of one core)
#   check_interval   - How often to check in seconds (default: 10)
#   grace_period     - How many checks before killing (default: 3)
#
# Examples:
#   # Kill claude processes using >150% CPU for 30+ seconds
#   ./watchdog-cpu-limit.sh "claude" 150 10 3
#
#   # Kill any node process using >200% CPU for 60+ seconds
#   ./watchdog-cpu-limit.sh "node" 200 20 3
#
# Note: On macOS, CPU percentages from `ps` are per-core. A process using
#       2 full cores would show as 200% CPU.
###############################################################################

PROCESS_PATTERN="${1:-claude}"
CPU_THRESHOLD="${2:-100}"
CHECK_INTERVAL="${3:-10}"
GRACE_PERIOD="${4:-3}"

# Track violation counts per PID
declare -A violation_counts

echo "=== CPU Watchdog Started ==="
echo "Pattern: $PROCESS_PATTERN"
echo "Threshold: ${CPU_THRESHOLD}% CPU"
echo "Check interval: ${CHECK_INTERVAL}s"
echo "Grace period: ${GRACE_PERIOD} checks ($(($GRACE_PERIOD * $CHECK_INTERVAL))s)"
echo ""

while true; do
    # Get current timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    # Find all processes matching pattern with their CPU usage
    # Format: PID CPU_PERCENT COMMAND
    ps aux | grep -i "$PROCESS_PATTERN" | grep -v "grep" | grep -v "watchdog" | \
    awk '{print $2" "$3" "$11}' | while read pid cpu_percent command; do

        # Convert CPU to integer for comparison (remove decimal)
        cpu_int=$(echo "$cpu_percent" | awk '{print int($1)}')

        if [ "$cpu_int" -gt "$CPU_THRESHOLD" ]; then
            # Increment violation count
            if [ -z "${violation_counts[$pid]}" ]; then
                violation_counts[$pid]=1
            else
                violation_counts[$pid]=$((${violation_counts[$pid]} + 1))
            fi

            echo "[$timestamp] WARNING: PID $pid ($command) at ${cpu_percent}% CPU (violation ${violation_counts[$pid]}/$GRACE_PERIOD)"

            # Check if grace period exceeded
            if [ "${violation_counts[$pid]}" -ge "$GRACE_PERIOD" ]; then
                echo "[$timestamp] KILLING: PID $pid ($command) exceeded threshold for ${violation_counts[$pid]} checks"
                kill -9 "$pid"

                # Remove from tracking
                unset violation_counts[$pid]
            fi
        else
            # Reset violation count if CPU is below threshold
            if [ -n "${violation_counts[$pid]}" ]; then
                echo "[$timestamp] RESET: PID $pid ($command) back to ${cpu_percent}% CPU"
                unset violation_counts[$pid]
            fi
        fi
    done

    sleep "$CHECK_INTERVAL"
done
