#!/usr/bin/env node
// post-agent.js
// Tracks agent execution metrics

import fs from 'fs';

const AGENT_NAME = process.env.AGENTFUL_AGENT || '';
const FEATURE = process.env.AGENTFUL_FEATURE || '';
const DOMAIN = process.env.AGENTFUL_DOMAIN || '';
const TIMESTAMP = new Date().toISOString();

// Exit successfully if no agent specified
if (!AGENT_NAME) {
  process.exit(0);
}

const METRICS_FILE = '.agentful/agent-metrics.json';

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
const currentCount = metrics.invocations[AGENT_NAME] || 0;
const newCount = currentCount + 1;

// Update metrics
metrics.invocations[AGENT_NAME] = newCount;
metrics.last_invocation = {
  agent: AGENT_NAME,
  timestamp: TIMESTAMP,
  feature: FEATURE,
  domain: DOMAIN
};

// Write updated metrics
try {
  fs.writeFileSync(METRICS_FILE, JSON.stringify(metrics, null, 2));
} catch (err) {
  console.error('WARNING: Failed to write agent-metrics.json');
}

// Log success (silently)
process.exit(0);
