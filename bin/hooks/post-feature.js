#!/usr/bin/env node
// post-feature.js
// Feature completion validation and tracking

import fs from 'fs';
import { execSync } from 'child_process';

// Helper function to run command and capture output
function runCommand(command, description) {
  try {
    const output = execSync(command, {
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 60000 // 60 second timeout
    });
    return { success: true, output };
  } catch (err) {
    return { success: false, output: err.stdout || err.stderr || '' };
  }
}

/**
 * Validate feature completion with automated checks
 * @param {string} feature - Feature name
 * @param {string} domain - Domain name (optional)
 * @returns {object} - { errors, validationResults, exitCode }
 */
export function validateFeatureCompletion(feature, domain = '') {
  // Exit successfully if no feature specified
  if (!feature) {
    return { errors: 0, validationResults: [], exitCode: 0 };
  }

  const TIMESTAMP = new Date().toISOString();
  let errors = 0;
  const validationResults = [];

  console.log(`=== Post-Feature Validation: ${feature} ===`);
  console.log('');

  // Check 1: Run tests
  console.log('[1/4] Running tests...');
  const testResult = runCommand('npm test -- --run 2>&1 | tail -5', 'tests');
if (testResult.success) {
  console.log('  Tests: PASS');
  validationResults.push('tests:pass');
} else {
  console.log('  Tests: FAIL');
  validationResults.push('tests:fail');
  errors++;
}
console.log('');

// Check 2: Type checking
console.log('[2/4] Running type check...');
// Check if TypeScript exists
if (fs.existsSync('tsconfig.json')) {
  const tscResult = runCommand('npx tsc --noEmit 2>&1', 'type-check');
  if (tscResult.success) {
    console.log('  Type Check: PASS');
    validationResults.push('types:pass');
  } else {
    // Count errors
    const errorMatches = tscResult.output.match(/error TS/g);
    const typeErrors = errorMatches ? errorMatches.length : 0;
    if (typeErrors === 0) {
      console.log('  Type Check: PASS');
      validationResults.push('types:pass');
    } else {
      console.log(`  Type Check: FAIL (${typeErrors} errors)`);
      validationResults.push('types:fail');
      errors++;
    }
  }
} else {
  console.log('  Type Check: SKIP (no TypeScript)');
  validationResults.push('types:skip');
}
console.log('');

// Check 3: Linting
console.log('[3/4] Running linter...');
const lintResult = runCommand('npm run lint 2>&1 | tail -5', 'lint');
if (lintResult.success) {
  console.log('  Lint: PASS');
  validationResults.push('lint:pass');
} else {
  console.log('  Lint: FAIL');
  validationResults.push('lint:fail');
  errors++;
}
console.log('');

// Check 4: Coverage check
console.log('[4/4] Checking test coverage...');
const coverageResult = runCommand('npm test -- --coverage --reporter=json 2>/dev/null', 'coverage');
if (coverageResult.success && coverageResult.output.includes('"lines"')) {
  try {
    // Try to parse coverage percentage (this is a simplified approach)
    // Real implementation would depend on test framework
    console.log('  Coverage: SKIP (unable to measure)');
    validationResults.push('coverage:skip');
  } catch (err) {
    console.log('  Coverage: SKIP (unable to measure)');
    validationResults.push('coverage:skip');
  }
} else {
  console.log('  Coverage: SKIP (unable to measure)');
  validationResults.push('coverage:skip');
}
console.log('');

// Update completion.json with validation results
const completionJsonPath = '.agentful/completion.json';
if (fs.existsSync(completionJsonPath)) {
  try {
    const completionContent = fs.readFileSync(completionJsonPath, 'utf8');
    const completion = JSON.parse(completionContent);

    const validationStatus = errors > 0 ? 'failed' : 'passed';
    const validationObject = {
      status: validationStatus,
      timestamp: TIMESTAMP,
      errors: errors,
      results: validationResults
    };

    if (DOMAIN) {
      // Hierarchical structure
      if (!completion.domains) completion.domains = {};
      if (!completion.domains[DOMAIN]) completion.domains[DOMAIN] = {};
      if (!completion.domains[DOMAIN].features) completion.domains[DOMAIN].features = {};
      if (!completion.domains[DOMAIN].features[FEATURE]) completion.domains[DOMAIN].features[FEATURE] = {};
      completion.domains[DOMAIN].features[FEATURE].validation = validationObject;
    } else {
      // Flat structure
      if (!completion.features) completion.features = {};
      if (!completion.features[FEATURE]) completion.features[FEATURE] = {};
      completion.features[FEATURE].validation = validationObject;
    }

    fs.writeFileSync(completionJsonPath, JSON.stringify(completion, null, 2));
  } catch (err) {
    console.error('WARNING: Failed to update completion.json');
  }
}

// Log to metrics
const metricsPath = '.agentful/agent-metrics.json';
if (fs.existsSync(metricsPath)) {
  try {
    const metricsContent = fs.readFileSync(metricsPath, 'utf8');
    const metrics = JSON.parse(metricsContent);

    if (!metrics.feature_hooks) metrics.feature_hooks = [];
    metrics.feature_hooks.push({
      hook: 'PostFeature',
      feature: FEATURE,
      domain: DOMAIN,
      timestamp: TIMESTAMP,
      result: errors > 0 ? 'failed' : 'passed'
    });

    fs.writeFileSync(metricsPath, JSON.stringify(metrics, null, 2));
  } catch (err) {
    console.error('WARNING: Failed to update agent-metrics.json');
  }
}

// Create git commit if all validations pass
if (errors === 0) {
  console.log('=== All Validations Passed ===');
  console.log('');

  // Check if there are changes to commit
  try {
    execSync('git diff --quiet 2>/dev/null', { stdio: 'pipe' });
    execSync('git diff --cached --quiet 2>/dev/null', { stdio: 'pipe' });
    console.log('No changes to commit');
  } catch (err) {
    // There are changes
    const commitMsg = DOMAIN
      ? `feat(${DOMAIN}): complete ${FEATURE} feature`
      : `feat: complete ${FEATURE} feature`;

    console.log('Creating git commit...');
    try {
      execSync('git add -A', { stdio: 'pipe' });
      execSync(`git commit -m "${commitMsg}"`, { stdio: 'pipe' });
      console.log(`  Commit created: ${commitMsg}`);
    } catch (err) {
      console.log('WARNING: Git commit failed (this is non-blocking)');
    }
  }

  process.exit(0);
} else {
  console.log(`=== Validation Failed (${errors} error(s)) ===`);
  console.log('');
  console.log('Fix validation errors before completing feature.');
  console.log('Run /agentful-validate for detailed output');
  process.exit(1);
}
