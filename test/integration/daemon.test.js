/**
 * Integration tests for daemon mode
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLI_PATH = path.join(__dirname, '../../bin/cli.js');
const PID_FILE = path.join(process.cwd(), '.agentful', 'server.pid');

describe('Daemon Mode', () => {
  beforeEach(() => {
    // Clean up any existing PID file
    if (fs.existsSync(PID_FILE)) {
      try {
        const pid = parseInt(fs.readFileSync(PID_FILE, 'utf-8').trim(), 10);
        try {
          process.kill(pid, 'SIGKILL');
        } catch {
          // Process already dead
        }
      } catch {
        // Invalid PID file
      }
      fs.unlinkSync(PID_FILE);
    }
  });

  afterEach(() => {
    // Clean up daemon if still running
    if (fs.existsSync(PID_FILE)) {
      try {
        const pid = parseInt(fs.readFileSync(PID_FILE, 'utf-8').trim(), 10);
        try {
          process.kill(pid, 'SIGKILL');
        } catch {
          // Process already dead
        }
      } catch {
        // Invalid PID file
      }
      fs.unlinkSync(PID_FILE);
    }
  });

  it('should create PID file when starting daemon', async () => {
    // Start daemon
    const child = spawn('node', [CLI_PATH, 'serve', '--daemon', '--port=3737'], {
      detached: false,
      stdio: 'pipe',
    });

    // Wait for PID file to be created
    await new Promise((resolve) => {
      const interval = setInterval(() => {
        if (fs.existsSync(PID_FILE)) {
          clearInterval(interval);
          resolve();
        }
      }, 100);

      setTimeout(() => {
        clearInterval(interval);
        resolve();
      }, 5000);
    });

    expect(fs.existsSync(PID_FILE)).toBe(true);

    // Verify PID is valid
    const pid = parseInt(fs.readFileSync(PID_FILE, 'utf-8').trim(), 10);
    expect(pid).toBeGreaterThan(0);

    // Clean up
    child.kill();
  }, 10000);

  it('should prevent starting daemon when already running', async () => {
    // Start first daemon
    const child1 = spawn('node', [CLI_PATH, 'serve', '--daemon', '--port=3737'], {
      detached: false,
      stdio: 'pipe',
    });

    // Wait for PID file
    await new Promise((resolve) => {
      const interval = setInterval(() => {
        if (fs.existsSync(PID_FILE)) {
          clearInterval(interval);
          resolve();
        }
      }, 100);

      setTimeout(() => {
        clearInterval(interval);
        resolve();
      }, 5000);
    });

    // Try to start second daemon
    const child2 = spawn('node', [CLI_PATH, 'serve', '--daemon', '--port=3737'], {
      detached: false,
      stdio: 'pipe',
    });

    let output = '';
    child2.stdout.on('data', (data) => {
      output += data.toString();
    });
    child2.stderr.on('data', (data) => {
      output += data.toString();
    });

    await new Promise((resolve) => {
      child2.on('exit', resolve);
      setTimeout(resolve, 3000);
    });

    expect(output).toMatch(/already running/i);

    // Clean up
    child1.kill();
    child2.kill();
  }, 15000);

  it('should show status when daemon is running', async () => {
    // Start daemon
    const child = spawn('node', [CLI_PATH, 'serve', '--daemon', '--port=3737'], {
      detached: false,
      stdio: 'pipe',
    });

    // Wait for daemon to start
    await new Promise((resolve) => {
      const interval = setInterval(() => {
        if (fs.existsSync(PID_FILE)) {
          clearInterval(interval);
          resolve();
        }
      }, 100);

      setTimeout(() => {
        clearInterval(interval);
        resolve();
      }, 5000);
    });

    // Check status
    const statusChild = spawn('node', [CLI_PATH, 'serve', '--status'], {
      stdio: 'pipe',
    });

    let output = '';
    statusChild.stdout.on('data', (data) => {
      output += data.toString();
    });

    await new Promise((resolve) => {
      statusChild.on('exit', resolve);
      setTimeout(resolve, 3000);
    });

    expect(output).toMatch(/running/i);
    expect(output).toMatch(/PID/i);

    // Clean up
    child.kill();
  }, 15000);

  it('should stop daemon with --stop', async () => {
    // Start daemon
    const child = spawn('node', [CLI_PATH, 'serve', '--daemon', '--port=3737'], {
      detached: false,
      stdio: 'pipe',
    });

    // Wait for daemon to start
    await new Promise((resolve) => {
      const interval = setInterval(() => {
        if (fs.existsSync(PID_FILE)) {
          clearInterval(interval);
          resolve();
        }
      }, 100);

      setTimeout(() => {
        clearInterval(interval);
        resolve();
      }, 5000);
    });

    const pid = parseInt(fs.readFileSync(PID_FILE, 'utf-8').trim(), 10);

    // Stop daemon
    const stopChild = spawn('node', [CLI_PATH, 'serve', '--stop'], {
      stdio: 'pipe',
    });

    await new Promise((resolve) => {
      stopChild.on('exit', resolve);
      setTimeout(resolve, 3000);
    });

    // Verify PID file is removed
    expect(fs.existsSync(PID_FILE)).toBe(false);

    // Verify process is dead
    let processExists = true;
    try {
      process.kill(pid, 0);
    } catch {
      processExists = false;
    }
    expect(processExists).toBe(false);

    child.kill();
  }, 15000);

  it('should handle --stop when no daemon is running', async () => {
    const stopChild = spawn('node', [CLI_PATH, 'serve', '--stop'], {
      stdio: 'pipe',
    });

    let output = '';
    stopChild.stdout.on('data', (data) => {
      output += data.toString();
    });
    stopChild.stderr.on('data', (data) => {
      output += data.toString();
    });

    await new Promise((resolve) => {
      stopChild.on('exit', resolve);
      setTimeout(resolve, 3000);
    });

    expect(output).toMatch(/no daemon/i);
  }, 10000);

  it('should handle --status when no daemon is running', async () => {
    const statusChild = spawn('node', [CLI_PATH, 'serve', '--status'], {
      stdio: 'pipe',
    });

    let output = '';
    statusChild.stdout.on('data', (data) => {
      output += data.toString();
    });
    statusChild.stderr.on('data', (data) => {
      output += data.toString();
    });

    await new Promise((resolve) => {
      statusChild.on('exit', resolve);
      setTimeout(resolve, 3000);
    });

    expect(output).toMatch(/no daemon/i);
  }, 10000);
});
