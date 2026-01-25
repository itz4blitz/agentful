import { execSync } from 'child_process';

export default function globalTeardown() {
  try {
    // Kill any hanging inspector processes
    execSync('pkill -9 -f "mcp-inspector" 2>/dev/null || true', { stdio: 'ignore' });
    execSync('pkill -9 -f "start-inspector" 2>/dev/null || true', { stdio: 'ignore' });
  } catch (error) {
    // Ignore errors - processes may not exist
  }
}
