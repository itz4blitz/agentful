/**
 * Usage examples for state-validator module
 *
 * This file demonstrates how to use the state validation functions
 * in your agentful commands and hooks.
 */

import {
  validateStateFile,
  recoverStateFile,
  validateAllState,
  getDefaultState,
  isStateFileValid,
  getStateFile,
  updateStateFile,
  formatValidationResults,
  STATE_SCHEMAS
} from './state-validator.js';
import path from 'path';

// Example 1: Validate a single state file
function example_validateSingleFile() {
  const projectRoot = process.cwd();
  const statePath = path.join(projectRoot, '.agentful', 'state.json');
  const schema = STATE_SCHEMAS['state.json'];

  const result = validateStateFile(statePath, schema);

  if (result.valid) {
    console.log('✅ State file is valid');
    console.log('Data:', result.data);
  } else {
    console.log('❌ State file is invalid:', result.error);
    console.log('Recommended action:', result.action);
  }
}

// Example 2: Recover a corrupted state file
function example_recoverFile() {
  const projectRoot = process.cwd();
  const statePath = path.join(projectRoot, '.agentful', 'state.json');
  const schema = STATE_SCHEMAS['state.json'];

  const validation = validateStateFile(statePath, schema);

  if (!validation.valid) {
    const recovery = recoverStateFile(
      statePath,
      schema.defaults,
      validation.action,
      validation.missing_field
    );

    console.log(recovery.message);
  }
}

// Example 3: Validate all state files (without auto-recovery)
function example_validateAll() {
  const projectRoot = process.cwd();

  const results = validateAllState(projectRoot, {
    autoRecover: false,
    skipOptional: true,
    verbose: true
  });

  if (results.valid) {
    console.log('✅ All state files are valid');
  } else {
    console.log('❌ Some state files are invalid');
    console.log('\nErrors:');
    results.errors.forEach(error => console.log(`  ${error}`));
  }

  // Format and display results
  console.log('\n' + formatValidationResults(results));
}

// Example 4: Validate and auto-recover all state files
function example_validateAndRecover() {
  const projectRoot = process.cwd();

  const results = validateAllState(projectRoot, {
    autoRecover: true,
    skipOptional: true,
    verbose: false
  });

  if (results.recovered.length > 0) {
    console.log('Recovered files:');
    results.recovered.forEach(msg => console.log(`  ${msg}`));
  }

  return results.valid;
}

// Example 5: Get state file with automatic recovery
function example_getStateWithRecovery() {
  const projectRoot = process.cwd();

  const result = getStateFile(projectRoot, 'completion.json', {
    autoRecover: true
  });

  if (result.valid) {
    console.log('Completion data:', result.data);

    if (result.recovered) {
      console.log('⚠️  File was recovered from invalid state');
    }
  } else {
    console.error('Failed to get state file:', result.error);
  }
}

// Example 6: Update state file safely
function example_updateState() {
  const projectRoot = process.cwd();

  // Update with object
  const result1 = updateStateFile(projectRoot, 'state.json', {
    agents: ['new-agent'],
    skills: ['new-skill']
  });

  console.log(result1.message);

  // Update with function
  const result2 = updateStateFile(projectRoot, 'completion.json', (current) => ({
    ...current,
    overall_progress: 75,
    features_complete: 3,
    features_total: 4,
    last_updated: new Date().toISOString()
  }));

  console.log(result2.message);
}

// Example 7: Check if state file is valid (quick check)
function example_quickCheck() {
  const projectRoot = process.cwd();

  const files = ['state.json', 'completion.json', 'decisions.json'];

  for (const file of files) {
    const valid = isStateFileValid(projectRoot, file);
    console.log(`${file}: ${valid ? '✅' : '❌'}`);
  }
}

// Example 8: Initialize missing state files
function example_initializeState() {
  const projectRoot = process.cwd();

  const requiredFiles = [
    'state.json',
    'completion.json',
    'decisions.json',
    'conversation-state.json',
    'conversation-history.json'
  ];

  for (const fileName of requiredFiles) {
    const result = getStateFile(projectRoot, fileName, { autoRecover: true });

    if (result.recovered) {
      console.log(`✅ Initialized ${fileName}`);
    }
  }
}

// Example 9: Use in command validation
async function example_commandValidation() {
  const projectRoot = process.cwd();

  // Validate all state at start of command
  const validation = validateAllState(projectRoot, {
    autoRecover: true,
    skipOptional: true
  });

  if (!validation.valid) {
    console.error('❌ State validation failed. Cannot proceed.');
    console.error(formatValidationResults(validation));
    return false;
  }

  // Get state safely
  const state = getStateFile(projectRoot, 'state.json');
  const completion = getStateFile(projectRoot, 'completion.json');

  if (!state.valid || !completion.valid) {
    console.error('❌ Failed to load required state files');
    return false;
  }

  // Use state data
  console.log('Current agents:', state.data.agents);
  console.log('Overall progress:', completion.data.overall_progress);

  // Update state safely
  const updateResult = updateStateFile(projectRoot, 'state.json', (current) => ({
    ...current,
    agents: [...current.agents, 'orchestrator']
  }));

  if (!updateResult.success) {
    console.error('❌ Failed to update state:', updateResult.message);
    return false;
  }

  return true;
}

// Example 10: Get default state for new files
function example_getDefaults() {
  // Get default state for specific file
  const stateDefaults = getDefaultState('state.json');
  console.log('State defaults:', stateDefaults);

  const completionDefaults = getDefaultState('completion.json');
  console.log('Completion defaults:', completionDefaults);

  // List all available schemas
  console.log('\nAvailable state files:');
  for (const [fileName, schema] of Object.entries(STATE_SCHEMAS)) {
    console.log(`  - ${fileName}: ${schema.description}`);
    if (schema.optional) {
      console.log(`    (optional)`);
    }
  }
}

// Export examples for testing
export {
  example_validateSingleFile,
  example_recoverFile,
  example_validateAll,
  example_validateAndRecover,
  example_getStateWithRecovery,
  example_updateState,
  example_quickCheck,
  example_initializeState,
  example_commandValidation,
  example_getDefaults
};

// If run directly, show examples
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('=== State Validator Examples ===\n');

  console.log('Example 1: Quick check');
  example_quickCheck();

  console.log('\nExample 2: Get defaults');
  example_getDefaults();

  console.log('\nExample 3: Validate and auto-recover');
  example_validateAndRecover();
}
