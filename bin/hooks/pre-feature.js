#!/usr/bin/env node
// pre-feature.js
// Validates feature readiness before implementation

import fs from 'fs';

const FEATURE = process.env.AGENTFUL_FEATURE || '';
const DOMAIN = process.env.AGENTFUL_DOMAIN || '';

// Exit successfully if no feature specified
if (!FEATURE) {
  process.exit(0);
}

let errors = 0;
let warnings = 0;

// Check 1: Feature file exists
let featureFile = '';
if (DOMAIN) {
  // Hierarchical structure
  featureFile = `.claude/product/domains/${DOMAIN}/features/${FEATURE}.md`;
} else {
  // Flat structure
  featureFile = `.claude/product/features/${FEATURE}.md`;
}

if (!fs.existsSync(featureFile)) {
  console.error(`ERROR: Feature file not found: ${featureFile}`);
  errors++;
}

// Check 2: Verify completion.json exists
const completionJsonPath = '.agentful/completion.json';
if (!fs.existsSync(completionJsonPath)) {
  console.error('ERROR: .agentful/completion.json not found');
  errors++;
}

// Check 3: Check feature dependencies
if (fs.existsSync(completionJsonPath)) {
  try {
    const completionContent = fs.readFileSync(completionJsonPath, 'utf8');
    const completion = JSON.parse(completionContent);

    // Check if feature has dependencies that are incomplete
    if (DOMAIN) {
      // Hierarchical: check domain-level dependencies
      const domainStatus = completion.domains?.[DOMAIN]?.status || 'unknown';
      if (domainStatus === 'blocked') {
        console.error(`ERROR: Domain '${DOMAIN}' is blocked`);
        errors++;
      }
    }

    // Check for blocking decisions
    const decisionsJsonPath = '.agentful/decisions.json';
    if (fs.existsSync(decisionsJsonPath)) {
      try {
        const decisionsContent = fs.readFileSync(decisionsJsonPath, 'utf8');
        const decisions = JSON.parse(decisionsContent);

        const featurePath = DOMAIN ? `${DOMAIN}/${FEATURE}` : FEATURE;
        const blockingDecisions = (decisions.pending || [])
          .filter(d => (d.blocking || []).some(b => b.includes(featurePath)))
          .map(d => d.id);

        if (blockingDecisions.length > 0) {
          console.error(`ERROR: Feature '${FEATURE}' is blocked by decisions: ${blockingDecisions.join(', ')}`);
          console.error('Run /agentful-decide to resolve blocking decisions');
          errors++;
        }
      } catch (err) {
        // Ignore JSON parse errors for decisions.json
      }
    }
  } catch (err) {
    // Ignore JSON parse errors for completion.json
  }
}

// Check 4: Tech stack compatibility (if architecture.json exists)
const architectureJsonPath = '.agentful/architecture.json';
if (fs.existsSync(architectureJsonPath)) {
  try {
    const archContent = fs.readFileSync(architectureJsonPath, 'utf8');
    const arch = JSON.parse(archContent);
    const techStack = arch.techStack;

    if (!techStack || techStack === null) {
      console.log('WARNING: Tech stack not analyzed. Run /agentful-generate');
      warnings++;
    }
  } catch (err) {
    // Ignore JSON parse errors
  }
}

// Check 5: Verify required agents exist
const requiredAgents = ['backend', 'frontend', 'tester', 'reviewer'];
for (const agent of requiredAgents) {
  const agentPath = `.claude/agents/${agent}.md`;
  if (!fs.existsSync(agentPath)) {
    console.log(`WARNING: Core agent missing: ${agentPath}`);
    warnings++;
  }
}

// Exit with error if critical checks failed
if (errors > 0) {
  console.log('');
  console.log(`Pre-feature validation failed with ${errors} error(s)`);
  console.log(`Feature: ${FEATURE}`);
  if (DOMAIN) console.log(`Domain: ${DOMAIN}`);
  process.exit(1);
}

if (warnings > 0) {
  console.log('');
  console.log(`Pre-feature validation passed with ${warnings} warning(s)`);
}

// All checks passed
process.exit(0);
