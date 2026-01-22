/**
 * Example Client for Agentful Server
 *
 * Demonstrates how to make authenticated requests to agentful serve
 *
 * @module server/client-example
 */

import { generateHMACHeaders } from './auth.js';

/**
 * Example: Trigger agent execution with HMAC authentication
 */
async function triggerAgentWithHMAC() {
  const serverUrl = 'https://your-server.com:3000';
  const secret = 'your-shared-secret';

  // Request body
  const body = JSON.stringify({
    agent: 'backend',
    task: 'Implement user authentication API',
  });

  // Generate HMAC headers
  const headers = generateHMACHeaders(body, secret);

  // Make request
  const response = await fetch(`${serverUrl}/trigger`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Request failed: ${error.message}`);
  }

  const result = await response.json();
  console.log('Execution started:', result.executionId);

  return result.executionId;
}

/**
 * Example: Check execution status
 */
async function checkExecutionStatus(executionId) {
  const serverUrl = 'https://your-server.com:3000';
  const secret = 'your-shared-secret';

  // For GET requests, body is empty
  const body = '';
  const headers = generateHMACHeaders(body, secret);

  const response = await fetch(`${serverUrl}/status/${executionId}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Request failed: ${error.message}`);
  }

  const status = await response.json();
  console.log('Execution status:', status.state);
  console.log('Duration:', status.duration, 'ms');

  return status;
}

/**
 * Example: Trigger and poll for completion
 */
async function triggerAndWait() {
  const executionId = await triggerAgentWithHMAC();

  console.log('Waiting for execution to complete...');

  // Poll every 5 seconds
  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const status = await checkExecutionStatus(executionId);

    if (status.state === 'completed') {
      console.log('Execution completed successfully!');
      console.log('Output:', status.output);
      break;
    }

    if (status.state === 'failed') {
      console.error('Execution failed:', status.error);
      break;
    }
  }
}

/**
 * Example: No authentication (localhost only)
 */
async function triggerAgentLocalhost() {
  const serverUrl = 'http://localhost:3000';

  const response = await fetch(`${serverUrl}/trigger`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      agent: 'backend',
      task: 'Implement user authentication API',
    }),
  });

  const result = await response.json();
  console.log('Execution started:', result.executionId);

  return result.executionId;
}

/**
 * Example: Tailscale mode (no auth headers needed)
 */
async function triggerAgentTailscale() {
  const serverUrl = 'http://your-tailscale-ip:3000';

  const response = await fetch(`${serverUrl}/trigger`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      agent: 'backend',
      task: 'Implement user authentication API',
    }),
  });

  const result = await response.json();
  console.log('Execution started:', result.executionId);

  return result.executionId;
}

/**
 * Example: List available agents
 */
async function listAgents() {
  const serverUrl = 'http://localhost:3000';

  const response = await fetch(`${serverUrl}/agents`);
  const result = await response.json();

  console.log('Available agents:', result.agents);
  return result.agents;
}

/**
 * Example: List recent executions
 */
async function listExecutions(filters = {}) {
  const serverUrl = 'http://localhost:3000';

  // Build query string
  const params = new URLSearchParams();
  if (filters.agent) params.append('agent', filters.agent);
  if (filters.state) params.append('state', filters.state);
  if (filters.limit) params.append('limit', filters.limit.toString());

  const response = await fetch(`${serverUrl}/executions?${params}`);
  const result = await response.json();

  console.log(`Found ${result.count} executions`);
  return result.executions;
}

// Export examples
export default {
  triggerAgentWithHMAC,
  checkExecutionStatus,
  triggerAndWait,
  triggerAgentLocalhost,
  triggerAgentTailscale,
  listAgents,
  listExecutions,
};
