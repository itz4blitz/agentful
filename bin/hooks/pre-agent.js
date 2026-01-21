#!/usr/bin/env node
// pre-agent.js
// Validates agent preconditions before invocation

import fs from 'fs';

const AGENT_NAME = process.env.AGENTFUL_AGENT || '';
const FEATURE = process.env.AGENTFUL_FEATURE || '';
const DOMAIN = process.env.AGENTFUL_DOMAIN || '';

// Exit successfully if no agent specified
if (!AGENT_NAME) {
  process.exit(0);
}

let errors = 0;

// Check 1: Agent file exists
const agentFile = `.claude/agents/${AGENT_NAME}.md`;
if (!fs.existsSync(agentFile)) {
  console.error(`ERROR: Agent file not found: ${agentFile}`);
  errors++;
}

// Check 2: Required state files exist
const stateFiles = ['state.json', 'completion.json', 'decisions.json'];
for (const file of stateFiles) {
  const filePath = `.agentful/${file}`;
  if (!fs.existsSync(filePath)) {
    console.error(`ERROR: Missing state file: ${filePath}`);
    errors++;
  }
}

// Check 3: Validate state.json structure
const stateJsonPath = '.agentful/state.json';
if (fs.existsSync(stateJsonPath)) {
  try {
    const stateContent = fs.readFileSync(stateJsonPath, 'utf8');
    const state = JSON.parse(stateContent);
    if (!state.current_phase) {
      console.error('ERROR: .agentful/state.json is malformed (missing current_phase)');
      errors++;
    }
  } catch (err) {
    console.error('ERROR: .agentful/state.json is invalid JSON');
    errors++;
  }
}

// Check 4: If feature specified, verify it exists in product spec
if (FEATURE) {
  let featureFound = false;

  // Check hierarchical structure
  if (DOMAIN) {
    const featureFile = `.claude/product/domains/${DOMAIN}/features/${FEATURE}.md`;
    if (fs.existsSync(featureFile)) {
      featureFound = true;
    }
  }

  // Check flat structure
  if (!featureFound) {
    const featureFile = `.claude/product/features/${FEATURE}.md`;
    if (fs.existsSync(featureFile)) {
      featureFound = true;
    }
  }

  if (!featureFound) {
    console.log(`WARNING: Feature '${FEATURE}' not found in product specification`);
    // Warning only, don't block
  }
}

// Check 5: Verify orchestrator isn't blocked
if (fs.existsSync(stateJsonPath)) {
  try {
    const stateContent = fs.readFileSync(stateJsonPath, 'utf8');
    const state = JSON.parse(stateContent);
    const blockedOn = state.blocked_on || [];
    if (Array.isArray(blockedOn) && blockedOn.length > 0) {
      console.log(`WARNING: Orchestrator is blocked on decisions: ${JSON.stringify(blockedOn)}`);
      // Warning only, don't block
    }
  } catch (err) {
    // Already handled in Check 3
  }
}

// Exit with error if critical checks failed
if (errors > 0) {
  console.log('');
  console.log(`Pre-agent validation failed with ${errors} error(s)`);
  console.log(`Agent: ${AGENT_NAME}`);
  if (FEATURE) console.log(`Feature: ${FEATURE}`);
  if (DOMAIN) console.log(`Domain: ${DOMAIN}`);
  process.exit(1);
}

// All checks passed
process.exit(0);
