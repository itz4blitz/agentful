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

  // Detect stack
  const hasPackageJson = fs.existsSync('package.json');
  const hasPyProject = fs.existsSync('pyproject.toml') || fs.existsSync('requirements.txt');
  const hasGoMod = fs.existsSync('go.mod');
  const hasPomXml = fs.existsSync('pom.xml');
  const hasCargoToml = fs.existsSync('Cargo.toml');

  // Check 1: Run tests
  console.log('[1/4] Running tests...');
  let testCmd = null;
  if (hasPackageJson) testCmd = 'npm test 2>&1';
  else if (hasPyProject) testCmd = 'pytest 2>&1';
  else if (hasGoMod) testCmd = 'go test ./... 2>&1';
  else if (hasPomXml) testCmd = 'mvn test 2>&1';
  else if (hasCargoToml) testCmd = 'cargo test 2>&1';

  if (testCmd) {
    const testResult = runCommand(testCmd, 'tests');
    if (testResult.success) {
      console.log('  Tests: PASS');
      validationResults.push('tests:pass');
    } else {
      console.log('  Tests: FAIL');
      validationResults.push('tests:fail');
      errors++;
    }
  } else {
    console.log('  Tests: SKIP (no test framework detected)');
    validationResults.push('tests:skip');
  }
  console.log('');

  // Check 2: Type checking
  console.log('[2/4] Running type check...');
  let typeCmd = null;
  if (fs.existsSync('tsconfig.json')) typeCmd = 'npx tsc --noEmit 2>&1';
  else if (hasPyProject) typeCmd = 'mypy . --ignore-missing-imports 2>&1';
  else if (hasGoMod) typeCmd = 'go vet ./... 2>&1';
  else if (hasCargoToml) typeCmd = 'cargo check 2>&1';

  if (typeCmd) {
    const tscResult = runCommand(typeCmd, 'type-check');
    if (tscResult.success) {
      console.log('  Type Check: PASS');
      validationResults.push('types:pass');
    } else {
      console.log('  Type Check: FAIL');
      validationResults.push('types:fail');
      errors++;
    }
  } else {
    console.log('  Type Check: SKIP (no type checker detected)');
    validationResults.push('types:skip');
  }
  console.log('');

  // Check 3: Linting
  console.log('[3/4] Running linter...');
  let lintCmd = null;
  if (hasPackageJson) lintCmd = 'npm run lint 2>&1';
  else if (hasPyProject) lintCmd = 'ruff check . 2>&1 || pylint **/*.py 2>&1';
  else if (hasGoMod) lintCmd = 'golangci-lint run 2>&1';
  else if (hasCargoToml) lintCmd = 'cargo clippy -- -D warnings 2>&1';

  if (lintCmd) {
    const lintResult = runCommand(lintCmd, 'lint');
    if (lintResult.success) {
      console.log('  Lint: PASS');
      validationResults.push('lint:pass');
    } else {
      console.log('  Lint: FAIL');
      validationResults.push('lint:fail');
      errors++;
    }
  } else {
    console.log('  Lint: SKIP (no linter detected)');
    validationResults.push('lint:skip');
  }
  console.log('');

  // Check 4: Coverage check
  console.log('[4/4] Checking test coverage...');
  console.log('  Coverage: SKIP (run /agentful-validate for full coverage report)');
  validationResults.push('coverage:skip');
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

      if (domain) {
        // Hierarchical structure
        if (!completion.domains) completion.domains = {};
        if (!completion.domains[domain]) completion.domains[domain] = {};
        if (!completion.domains[domain].features) completion.domains[domain].features = {};
        if (!completion.domains[domain].features[feature]) completion.domains[domain].features[feature] = {};
        completion.domains[domain].features[feature].validation = validationObject;
      } else {
        // Flat structure
        if (!completion.features) completion.features = {};
        if (!completion.features[feature]) completion.features[feature] = {};
        completion.features[feature].validation = validationObject;
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
        feature: feature,
        domain: domain,
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
      const commitMsg = domain
        ? `feat(${domain}): complete ${feature} feature`
        : `feat: complete ${feature} feature`;

      console.log('Creating git commit...');
      try {
        execSync('git add -A', { stdio: 'pipe' });
        execSync(`git commit -m "${commitMsg}"`, { stdio: 'pipe' });
        console.log(`  Commit created: ${commitMsg}`);
      } catch (err) {
        console.log('WARNING: Git commit failed (this is non-blocking)');
      }
    }

    return { errors: 0, validationResults, exitCode: 0 };
  } else {
    console.log(`=== Validation Failed (${errors} error(s)) ===`);
    console.log('');
    console.log('Fix validation errors before completing feature.');
    console.log('Run /agentful-validate for detailed output');
    return { errors, validationResults, exitCode: 1 };
  }
}

// CLI entrypoint
if (import.meta.url === `file://${process.argv[1]}`) {
  const FEATURE = process.env.AGENTFUL_FEATURE || '';
  const DOMAIN = process.env.AGENTFUL_DOMAIN || '';

  const result = validateFeatureCompletion(FEATURE, DOMAIN);
  process.exit(result.exitCode);
}
