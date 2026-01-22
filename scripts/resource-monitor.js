#!/usr/bin/env node

/**
 * Cross-Platform Resource Monitor for Claude Code
 *
 * Uses agentful orchestrator pattern with parallel sub-agents to monitor
 * and limit resource usage across macOS, Linux, and Windows.
 *
 * Usage:
 *   node resource-monitor.js [profile]
 *
 * Profiles:
 *   - conservative (default): 2GB memory, 150% CPU
 *   - aggressive: 1GB memory, 100% CPU
 *   - monitoring: Track only, no limits
 */

import { spawn } from 'child_process';
import os from 'os';
import process from 'process';
import { EventEmitter } from 'events';

// ============================================================================
// Configuration Profiles
// ============================================================================

const PROFILES = {
  conservative: {
    name: 'Conservative',
    memoryLimitMB: 2048,
    cpuThresholdPercent: 150,
    checkIntervalMs: 10000,
    gracePeriodChecks: 3,
    maxCpuTimeSeconds: 300,
    enforceLimits: true
  },
  aggressive: {
    name: 'Aggressive',
    memoryLimitMB: 1024,
    cpuThresholdPercent: 100,
    checkIntervalMs: 10000,
    gracePeriodChecks: 2,
    maxCpuTimeSeconds: 120,
    enforceLimits: true
  },
  monitoring: {
    name: 'Monitoring Only',
    memoryLimitMB: 2048,
    cpuThresholdPercent: 9999,
    checkIntervalMs: 10000,
    gracePeriodChecks: 999,
    maxCpuTimeSeconds: Infinity,
    enforceLimits: false
  }
};

// ============================================================================
// Process Monitor Agent
// ============================================================================

class ProcessMonitorAgent extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.platform = os.platform();
    this.violations = new Map(); // pid -> count
  }

  /**
   * Get all processes matching pattern
   */
  async getProcesses(pattern = 'claude') {
    return new Promise((resolve, reject) => {
      const processes = [];

      let command, args;
      if (this.platform === 'win32') {
        // Windows: Use tasklist
        command = 'tasklist';
        args = ['/FO', 'CSV', '/NH'];
      } else {
        // macOS/Linux: Use ps
        command = 'ps';
        args = ['aux'];
      }

      const ps = spawn(command, args);
      let output = '';

      ps.stdout.on('data', (data) => {
        output += data.toString();
      });

      ps.on('close', (code) => {
        if (code !== 0) {
          return reject(new Error(`ps command failed with code ${code}`));
        }

        const lines = output.split('\n');
        for (const line of lines) {
          if (!line.includes(pattern) || line.includes('grep') || line.includes('resource-monitor')) {
            continue;
          }

          const proc = this._parseProcessLine(line);
          if (proc) {
            processes.push(proc);
          }
        }

        resolve(processes);
      });

      ps.on('error', reject);
    });
  }

  /**
   * Parse process line based on platform
   */
  _parseProcessLine(line) {
    if (this.platform === 'win32') {
      // Windows CSV format: "name","pid","session","mem"
      const match = line.match(/"([^"]+)","(\d+)","(\d+)","([^"]+)"/);
      if (!match) return null;

      const [, name, pid, , memStr] = match;
      const memoryKB = parseInt(memStr.replace(/[^\d]/g, ''));

      return {
        pid: parseInt(pid),
        name,
        cpu: 0, // Windows tasklist doesn't provide CPU, need separate query
        memoryMB: memoryKB / 1024,
        command: name
      };
    } else {
      // macOS/Linux: USER PID %CPU %MEM VSZ RSS TTY STAT START TIME COMMAND
      const parts = line.trim().split(/\s+/);
      if (parts.length < 11) return null;

      return {
        pid: parseInt(parts[1]),
        name: parts[10],
        cpu: parseFloat(parts[2]),
        memoryMB: parseFloat(parts[3]) * (os.totalmem() / (1024 * 1024 * 100)),
        command: parts.slice(10).join(' ')
      };
    }
  }

  /**
   * Check if process violates resource limits
   */
  checkViolation(proc) {
    const violations = [];

    // Check CPU
    if (proc.cpu > this.config.cpuThresholdPercent) {
      violations.push({
        type: 'cpu',
        value: proc.cpu,
        limit: this.config.cpuThresholdPercent
      });
    }

    // Check memory
    if (proc.memoryMB > this.config.memoryLimitMB) {
      violations.push({
        type: 'memory',
        value: proc.memoryMB,
        limit: this.config.memoryLimitMB
      });
    }

    return violations;
  }

  /**
   * Kill process by PID
   */
  async killProcess(pid) {
    return new Promise((resolve, reject) => {
      const command = this.platform === 'win32' ? 'taskkill' : 'kill';
      const args = this.platform === 'win32' ? ['/F', '/PID', String(pid)] : ['-9', String(pid)];

      const killer = spawn(command, args);

      killer.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Failed to kill process ${pid}`));
        }
      });

      killer.on('error', reject);
    });
  }

  /**
   * Monitor loop
   */
  async monitor(pattern = 'claude') {
    try {
      const processes = await this.getProcesses(pattern);

      for (const proc of processes) {
        const violations = this.checkViolation(proc);

        if (violations.length > 0) {
          // Increment violation count
          const currentCount = (this.violations.get(proc.pid) || 0) + 1;
          this.violations.set(proc.pid, currentCount);

          this.emit('violation', {
            process: proc,
            violations,
            count: currentCount,
            threshold: this.config.gracePeriodChecks
          });

          // Check if grace period exceeded
          if (currentCount >= this.config.gracePeriodChecks && this.config.enforceLimits) {
            this.emit('killing', { process: proc, violations });

            try {
              await this.killProcess(proc.pid);
              this.emit('killed', { process: proc, violations });
            } catch (error) {
              this.emit('error', { error, process: proc });
            }

            this.violations.delete(proc.pid);
          }
        } else {
          // Reset violation count if no longer violating
          if (this.violations.has(proc.pid)) {
            this.emit('reset', { process: proc });
            this.violations.delete(proc.pid);
          }
        }
      }
    } catch (error) {
      this.emit('error', { error });
    }
  }
}

// ============================================================================
// CPU Monitor Agent
// ============================================================================

class CPUMonitorAgent extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.startTime = Date.now();
  }

  /**
   * Check total CPU time for current process
   */
  checkCpuTime() {
    const usage = process.cpuUsage();
    const totalSeconds = (usage.user + usage.system) / 1000000;

    if (totalSeconds > this.config.maxCpuTimeSeconds) {
      this.emit('limit-exceeded', {
        totalSeconds,
        limit: this.config.maxCpuTimeSeconds
      });

      if (this.config.enforceLimits) {
        this.emit('terminating');
        process.exit(1);
      }
    }

    return totalSeconds;
  }
}

// ============================================================================
// Memory Monitor Agent
// ============================================================================

class MemoryMonitorAgent extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
  }

  /**
   * Check current memory usage
   */
  checkMemory() {
    const usage = process.memoryUsage();
    const heapUsedMB = usage.heapUsed / (1024 * 1024);
    const totalMB = usage.rss / (1024 * 1024);

    this.emit('stats', {
      heapUsedMB,
      totalMB,
      limit: this.config.memoryLimitMB
    });

    if (heapUsedMB > this.config.memoryLimitMB) {
      this.emit('warning', {
        heapUsedMB,
        limit: this.config.memoryLimitMB
      });
    }

    return { heapUsedMB, totalMB };
  }
}

// ============================================================================
// Logger Agent
// ============================================================================

class LoggerAgent {
  constructor() {
    this.startTime = new Date();
  }

  timestamp() {
    return new Date().toISOString();
  }

  info(message, data = {}) {
    console.log(`[${this.timestamp()}] INFO: ${message}`, data);
  }

  warn(message, data = {}) {
    console.warn(`[${this.timestamp()}] WARN: ${message}`, data);
  }

  error(message, data = {}) {
    console.error(`[${this.timestamp()}] ERROR: ${message}`, data);
  }

  kill(message, data = {}) {
    console.error(`[${this.timestamp()}] KILL: ${message}`, data);
  }
}

// ============================================================================
// Orchestrator
// ============================================================================

class ResourceMonitorOrchestrator {
  constructor(profileOrConfig = 'conservative') {
    // Support both profile name and config object
    this.config = typeof profileOrConfig === 'string'
      ? (PROFILES[profileOrConfig] || PROFILES.conservative)
      : { ...PROFILES.conservative, ...profileOrConfig };
    this.logger = new LoggerAgent();

    // Initialize sub-agents
    this.processMonitor = new ProcessMonitorAgent(this.config);
    this.cpuMonitor = new CPUMonitorAgent(this.config);
    this.memoryMonitor = new MemoryMonitorAgent(this.config);

    this.running = false;
    this.intervals = [];

    this._wireUpAgents();
  }

  /**
   * Wire up agent event handlers
   */
  _wireUpAgents() {
    // Process monitor events
    this.processMonitor.on('violation', ({ process, violations, count, threshold }) => {
      const violationTypes = violations.map(v => `${v.type}=${v.value.toFixed(1)}/${v.limit}`).join(', ');
      this.logger.warn(
        `Process ${process.pid} (${process.command}) violation ${count}/${threshold}: ${violationTypes}`
      );
    });

    this.processMonitor.on('killing', ({ process, violations }) => {
      const violationTypes = violations.map(v => v.type).join(', ');
      this.logger.kill(
        `Killing process ${process.pid} (${process.command}) for ${violationTypes} violations`
      );
    });

    this.processMonitor.on('killed', ({ process }) => {
      this.logger.info(`Successfully killed process ${process.pid}`);
    });

    this.processMonitor.on('reset', ({ process }) => {
      this.logger.info(`Process ${process.pid} (${process.command}) back within limits`);
    });

    this.processMonitor.on('error', ({ error, process }) => {
      this.logger.error(`Process monitor error: ${error.message}`, { process });
    });

    // CPU monitor events
    this.cpuMonitor.on('limit-exceeded', ({ totalSeconds, limit }) => {
      this.logger.error(`CPU time limit exceeded: ${totalSeconds.toFixed(1)}s / ${limit}s`);
    });

    this.cpuMonitor.on('terminating', () => {
      this.logger.kill('Terminating due to CPU time limit');
    });

    // Memory monitor events
    this.memoryMonitor.on('warning', ({ heapUsedMB, limit }) => {
      this.logger.warn(`Memory usage high: ${heapUsedMB.toFixed(1)}MB / ${limit}MB`);
    });
  }

  /**
   * Start monitoring
   */
  start(pattern = 'claude') {
    if (this.running) {
      this.logger.warn('Monitor already running');
      return;
    }

    this.running = true;

    this.logger.info('Starting Resource Monitor', {
      profile: this.config.name,
      platform: os.platform(),
      pattern,
      config: this.config
    });

    // Start parallel monitoring agents
    const processInterval = setInterval(() => {
      this.processMonitor.monitor(pattern);
    }, this.config.checkIntervalMs);

    const cpuInterval = setInterval(() => {
      this.cpuMonitor.checkCpuTime();
    }, 5000);

    const memoryInterval = setInterval(() => {
      this.memoryMonitor.checkMemory();
    }, 10000);

    this.intervals.push(processInterval, cpuInterval, memoryInterval);

    // Initial checks
    this.processMonitor.monitor(pattern);
    this.cpuMonitor.checkCpuTime();
    this.memoryMonitor.checkMemory();
  }

  /**
   * Stop monitoring
   */
  stop() {
    this.logger.info('Stopping Resource Monitor');
    this.running = false;

    for (const interval of this.intervals) {
      clearInterval(interval);
    }

    this.intervals = [];
  }
}

// ============================================================================
// Configuration Loader
// ============================================================================

/**
 * Load configuration from file or use profile
 */
async function loadConfig(profileOrPath) {
  // Check if it's a file path
  if (profileOrPath.endsWith('.json') || profileOrPath.includes('/')) {
    try {
      const { readFile } = await import('fs/promises');
      const content = await readFile(profileOrPath, 'utf-8');
      const config = JSON.parse(content);
      return { ...PROFILES.conservative, ...config };
    } catch (error) {
      console.error(`Failed to load config from ${profileOrPath}: ${error.message}`);
      process.exit(1);
    }
  }

  // Otherwise treat as profile name
  if (!PROFILES[profileOrPath]) {
    console.error(`Unknown profile: ${profileOrPath}`);
    console.error(`Available profiles: ${Object.keys(PROFILES).join(', ')}`);
    console.error(`Or provide path to JSON config file`);
    process.exit(1);
  }

  return PROFILES[profileOrPath];
}

// ============================================================================
// CLI Entry Point
// ============================================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  const profileOrPath = process.argv[2] || 'conservative';
  const pattern = process.argv[3] || 'claude';

  (async () => {
    const config = await loadConfig(profileOrPath);

    const orchestrator = new ResourceMonitorOrchestrator(config);
    orchestrator.start(pattern);

    // Handle shutdown
    process.on('SIGINT', () => {
      orchestrator.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      orchestrator.stop();
      process.exit(0);
    });
  })();
}

export { ResourceMonitorOrchestrator, PROFILES };
