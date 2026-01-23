/**
 * Agentful Remote Client
 *
 * HTTP client for triggering agent execution on remote agentful servers.
 * Supports Tailscale, HMAC, and SSH tunnel authentication modes.
 *
 * @module remote/client
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Remote configuration storage
 */
const CONFIG_DIR = path.join(os.homedir(), '.agentful');
const CONFIG_FILE = path.join(CONFIG_DIR, 'remotes.json');

/**
 * Ensure config directory exists
 */
function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

/**
 * Load remote configurations
 * @returns {Object} Remote configurations
 */
export function loadRemotes() {
  ensureConfigDir();

  if (!fs.existsSync(CONFIG_FILE)) {
    return {};
  }

  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
  } catch (error) {
    console.error('Failed to load remotes.json:', error.message);
    return {};
  }
}

/**
 * Save remote configurations
 * @param {Object} remotes - Remote configurations
 */
export function saveRemotes(remotes) {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(remotes, null, 2), 'utf-8');
}

/**
 * Add a remote configuration
 * @param {string} name - Remote name
 * @param {string} url - Server URL
 * @param {Object} options - Remote options
 * @param {string} [options.auth='tailscale'] - Auth mode
 * @param {string} [options.secret] - HMAC secret
 */
export function addRemote(name, url, options = {}) {
  const { auth = 'tailscale', secret } = options;

  // Validate auth mode
  if (auth === 'hmac' && !secret) {
    throw new Error('HMAC auth requires --secret');
  }

  // Parse and validate URL
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch (error) {
    throw new Error(`Invalid URL: ${url}`);
  }

  const remotes = loadRemotes();

  remotes[name] = {
    url: parsedUrl.toString(),
    auth,
    secret: secret || null,
    added: new Date().toISOString(),
  };

  saveRemotes(remotes);
}

/**
 * Remove a remote configuration
 * @param {string} name - Remote name
 */
export function removeRemote(name) {
  const remotes = loadRemotes();

  if (!remotes[name]) {
    throw new Error(`Remote not found: ${name}`);
  }

  delete remotes[name];
  saveRemotes(remotes);
}

/**
 * Get a remote configuration
 * @param {string} name - Remote name
 * @returns {Object} Remote configuration
 */
export function getRemote(name) {
  const remotes = loadRemotes();

  if (!remotes[name]) {
    throw new Error(`Remote not found: ${name}. Run: agentful remote add ${name} <url>`);
  }

  return remotes[name];
}

/**
 * List all remote configurations
 * @returns {Object} Remote configurations
 */
export function listRemotes() {
  return loadRemotes();
}

/**
 * Generate HMAC signature for request
 * @param {string} body - Request body
 * @param {string} secret - HMAC secret
 * @returns {Object} Headers with signature
 */
function generateHMACHeaders(body, secret) {
  const timestamp = Date.now().toString();
  const signature = crypto
    .createHmac('sha256', secret)
    .update(timestamp + body)
    .digest('hex');

  return {
    'X-Agentful-Signature': signature,
    'X-Agentful-Timestamp': timestamp,
  };
}

/**
 * Execute an agent on a remote server
 * @param {string} remoteName - Remote name
 * @param {string} agent - Agent name
 * @param {string} task - Task description
 * @param {Object} options - Execution options
 * @param {number} [options.timeout] - Execution timeout in ms
 * @param {Object} [options.env] - Environment variables
 * @returns {Promise<Object>} Execution result
 */
export async function executeRemoteAgent(remoteName, agent, task, options = {}) {
  const remote = getRemote(remoteName);
  const { timeout, env } = options;

  // Build request body
  const body = JSON.stringify({
    agent,
    task,
    timeout,
    env,
  });

  // Build headers
  const headers = {
    'Content-Type': 'application/json',
  };

  // Add HMAC signature if needed
  if (remote.auth === 'hmac') {
    Object.assign(headers, generateHMACHeaders(body, remote.secret));
  }

  // Make request
  const response = await fetch(`${remote.url}/trigger`, {
    method: 'POST',
    headers,
    body,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`Request failed (${response.status}): ${error.message || error.error}`);
  }

  return await response.json();
}

/**
 * Get execution status from remote server
 * @param {string} remoteName - Remote name
 * @param {string} executionId - Execution ID
 * @returns {Promise<Object>} Execution status
 */
export async function getRemoteExecutionStatus(remoteName, executionId) {
  const remote = getRemote(remoteName);

  // Build headers
  const headers = {};

  // Add HMAC signature if needed
  if (remote.auth === 'hmac') {
    Object.assign(headers, generateHMACHeaders('', remote.secret));
  }

  // Make request
  const response = await fetch(`${remote.url}/status/${executionId}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`Request failed (${response.status}): ${error.message || error.error}`);
  }

  return await response.json();
}

/**
 * List executions on remote server
 * @param {string} remoteName - Remote name
 * @param {Object} filters - Filter options
 * @param {string} [filters.agent] - Filter by agent name
 * @param {string} [filters.state] - Filter by state
 * @param {number} [filters.limit] - Maximum number of results
 * @returns {Promise<Object>} Executions list
 */
export async function listRemoteExecutions(remoteName, filters = {}) {
  const remote = getRemote(remoteName);

  // Build query string
  const params = new URLSearchParams();
  if (filters.agent) params.append('agent', filters.agent);
  if (filters.state) params.append('state', filters.state);
  if (filters.limit) params.append('limit', filters.limit.toString());

  // Build headers
  const headers = {};

  // Add HMAC signature if needed
  if (remote.auth === 'hmac') {
    Object.assign(headers, generateHMACHeaders('', remote.secret));
  }

  // Make request
  const url = `${remote.url}/executions${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`Request failed (${response.status}): ${error.message || error.error}`);
  }

  return await response.json();
}

/**
 * List available agents on remote server
 * @param {string} remoteName - Remote name
 * @returns {Promise<Object>} Agents list
 */
export async function listRemoteAgents(remoteName) {
  const remote = getRemote(remoteName);

  // Build headers
  const headers = {};

  // Add HMAC signature if needed
  if (remote.auth === 'hmac') {
    Object.assign(headers, generateHMACHeaders('', remote.secret));
  }

  // Make request
  const response = await fetch(`${remote.url}/agents`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`Request failed (${response.status}): ${error.message || error.error}`);
  }

  return await response.json();
}

/**
 * Check remote server health
 * @param {string} remoteName - Remote name
 * @returns {Promise<Object>} Health status
 */
export async function checkRemoteHealth(remoteName) {
  const remote = getRemote(remoteName);

  // No auth required for /health endpoint
  const response = await fetch(`${remote.url}/health`, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`Health check failed (${response.status}): ${error.message || error.error}`);
  }

  return await response.json();
}

/**
 * Poll execution until completion
 * @param {string} remoteName - Remote name
 * @param {string} executionId - Execution ID
 * @param {Object} options - Polling options
 * @param {number} [options.interval=5000] - Polling interval in ms
 * @param {Function} [options.onUpdate] - Callback for status updates
 * @returns {Promise<Object>} Final execution status
 */
export async function pollExecution(remoteName, executionId, options = {}) {
  const { interval = 5000, onUpdate } = options;

  while (true) {
    const status = await getRemoteExecutionStatus(remoteName, executionId);

    if (onUpdate) {
      onUpdate(status);
    }

    // Check if completed
    if (status.state === 'completed' || status.state === 'failed') {
      return status;
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

export default {
  addRemote,
  removeRemote,
  getRemote,
  listRemotes,
  executeRemoteAgent,
  getRemoteExecutionStatus,
  listRemoteExecutions,
  listRemoteAgents,
  checkRemoteHealth,
  pollExecution,
};
