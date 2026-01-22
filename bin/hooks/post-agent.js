#!/usr/bin/env node
// post-agent.js
// Tracks agent execution metrics

import fs from 'fs';

const METRICS_FILE = '.agentful/agent-metrics.json';

/**
 * Track agent execution metrics
 * @param {Object} options - Tracking options
 * @param {string} options.agentName - Name of the agent
 * @param {string} [options.feature] - Feature being worked on
 * @param {string} [options.domain] - Domain context
 * @param {string} [options.timestamp] - ISO timestamp (defaults to current time)
 * @returns {Object} - Result with success flag and optional error
 */
export function trackAgentMetrics({ agentName, feature = '', domain = '', timestamp = new Date().toISOString() }) {
  // Exit successfully if no agent specified
  if (!agentName) {
    return { success: true };
  }

  // Create metrics file if it doesn't exist
  if (!fs.existsSync(METRICS_FILE)) {
    const initialMetrics = {
      invocations: {},
      last_invocation: null,
      feature_hooks: []
    };
    fs.writeFileSync(METRICS_FILE, JSON.stringify(initialMetrics, null, 2));
  }

  // Validate and read existing metrics file
  let metrics;
  try {
    const metricsContent = fs.readFileSync(METRICS_FILE, 'utf8');
    metrics = JSON.parse(metricsContent);
  } catch (err) {
    console.log('WARNING: agent-metrics.json is corrupted, recreating');
    metrics = {
      invocations: {},
      last_invocation: null,
      feature_hooks: []
    };
  }

  // Update invocation count for this agent
  const currentCount = metrics.invocations[agentName] || 0;
  const newCount = currentCount + 1;

  // Update metrics
  metrics.invocations[agentName] = newCount;
  metrics.last_invocation = {
    agent: agentName,
    timestamp: timestamp,
    feature: feature,
    domain: domain
  };

  // Write updated metrics
  try {
    fs.writeFileSync(METRICS_FILE, JSON.stringify(metrics, null, 2));
    return { success: true };
  } catch (err) {
    console.error('WARNING: Failed to write agent-metrics.json');
    return { success: true, error: err.message };
  }
}

// CLI entrypoint
if (import.meta.url === `file://${process.argv[1]}`) {
  const AGENT_NAME = process.env.AGENTFUL_AGENT || '';
  const FEATURE = process.env.AGENTFUL_FEATURE || '';
  const DOMAIN = process.env.AGENTFUL_DOMAIN || '';
  const TIMESTAMP = new Date().toISOString();

  trackAgentMetrics({
    agentName: AGENT_NAME,
    feature: FEATURE,
    domain: DOMAIN,
    timestamp: TIMESTAMP
  });

  process.exit(0);
}
