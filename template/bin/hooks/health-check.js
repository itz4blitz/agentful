#!/usr/bin/env node
// health-check.js
// Comprehensive startup health check for agentful

import fs from 'fs';
import { execSync } from 'child_process';

let errors = 0;
let warnings = 0;

// === CRITICAL CHECKS (must pass) ===

// Check 1: .agentful directory
if (!fs.existsSync('.agentful')) {
  console.log('❌ Agentful not initialized.');
  console.log('   Run: npx @itz4blitz/agentful init');
  process.exit(0);
}

// Check 2: Core state files
const stateFiles = ['state.json', 'completion.json', 'decisions.json'];
for (const file of stateFiles) {
  const filePath = `.agentful/${file}`;
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Missing .agentful/${file}`);
    errors++;
  }
}

// Check 3: .claude directory structure
const claudeDirs = ['agents', 'commands', 'product', 'skills'];
for (const dir of claudeDirs) {
  const dirPath = `.claude/${dir}`;
  if (!fs.existsSync(dirPath)) {
    console.log(`❌ Missing .claude/${dir}/`);
    errors++;
  }
}

// Check 4: Core agents
const coreAgents = [
  'orchestrator',
  'backend',
  'frontend',
  'tester',
  'reviewer',
  'fixer',
  'architect',
  'product-analyzer'
];
for (const agent of coreAgents) {
  const agentPath = `.claude/agents/${agent}.md`;
  if (!fs.existsSync(agentPath)) {
    console.log(`❌ Missing core agent: ${agentPath}`);
    errors++;
  }
}

// Check 5: Product specification
if (!fs.existsSync('.claude/product/index.md')) {
  // Check for hierarchical structure
  let hasHierarchicalSpec = false;
  if (fs.existsSync('.claude/product/domains')) {
    try {
      const domains = fs.readdirSync('.claude/product/domains');
      for (const domain of domains) {
        if (fs.existsSync(`.claude/product/domains/${domain}/index.md`)) {
          hasHierarchicalSpec = true;
          break;
        }
      }
    } catch (err) {
      // Ignore errors
    }
  }

  if (!hasHierarchicalSpec) {
    console.log('⚠️  No product specification found');
    console.log('   Create .claude/product/index.md or run /agentful-product');
    warnings++;
  }
}

// Check 6: Settings file
const settingsPath = '.claude/settings.json';
if (!fs.existsSync(settingsPath)) {
  console.log('❌ Missing .claude/settings.json');
  errors++;
} else {
  try {
    const settingsContent = fs.readFileSync(settingsPath, 'utf8');
    JSON.parse(settingsContent);
  } catch (err) {
    console.log('❌ Invalid JSON in .claude/settings.json');
    errors++;
  }
}

// === WARNING CHECKS (nice to have) ===

// Check: Architecture analysis
const architecturePath = '.agentful/architecture.json';
if (!fs.existsSync(architecturePath)) {
  console.log('⚠️  Tech stack not analyzed. Run /agentful-generate to:');
  console.log('   - Detect your tech stack');
  console.log('   - Discover business domains');
  console.log('   - Generate specialized agents');
  warnings++;
} else {
  try {
    const archContent = fs.readFileSync(architecturePath, 'utf8');
    const arch = JSON.parse(archContent);
    if (!arch.techStack || !arch.domains) {
      console.log('⚠️  .agentful/architecture.json is malformed');
      console.log('   Run /agentful-generate to regenerate');
      warnings++;
    }
  } catch (err) {
    console.log('⚠️  .agentful/architecture.json is malformed');
    console.log('   Run /agentful-generate to regenerate');
    warnings++;
  }
}

// Check: Node version
try {
  const nodeVersion = process.version.replace('v', '');
  const majorVersion = parseInt(nodeVersion.split('.')[0], 10);
  if (majorVersion < 22) {
    console.log(`⚠️  Node.js ${nodeVersion} detected. Requires >=22.0.0`);
    warnings++;
  }
} catch (err) {
  // Ignore errors
}

// === SUMMARY ===

if (errors > 0) {
  console.log('');
  console.log(`❌ Found ${errors} critical issue(s)`);
  console.log('   Run: npx @itz4blitz/agentful init');
  process.exit(0);
}

if (warnings > 0) {
  console.log('');
  console.log(`⚠️  Agentful ready with ${warnings} warning(s)`);
} else {
  console.log('✅ Agentful ready');
}

process.exit(0);
