# State Validator Module

Centralized state validation module that all agentful commands can use.

## Problem

State file validation was duplicated across commands, and many commands had no validation at all. This led to:
- Inconsistent error handling
- Code duplication
- Poor user experience when state files became corrupted
- No standardized recovery strategies

## Solution

`lib/state-validator.js` provides comprehensive validation and recovery functions for all 7 agentful state files:

1. `state.json` - Core initialization state
2. `completion.json` - Feature completion tracking and quality gates
3. `decisions.json` - Pending and resolved decisions
4. `architecture.json` - Tech stack detection and generated agents (optional)
5. `conversation-state.json` - Natural language conversation context
6. `conversation-history.json` - Message history for context tracking
7. `agent-metrics.json` - Agent lifecycle hooks and metrics (optional)

## Quick Start

```javascript
import { validateAllState, getStateFile, updateStateFile } from '@itz4blitz/agentful';

// Validate and auto-recover all state files
const validation = validateAllState(process.cwd(), {
  autoRecover: true,
  skipOptional: true
});

if (!validation.valid) {
  console.error('State validation failed');
  process.exit(1);
}

// Get state file with automatic recovery
const state = getStateFile(process.cwd(), 'completion.json', {
  autoRecover: true
});

console.log('Overall progress:', state.data.overall_progress);

// Update state file safely
updateStateFile(process.cwd(), 'completion.json', {
  overall_progress: 75,
  features_complete: 3
});
```

## Exported Functions

### `validateStateFile(filePath, schema)`

Validates a single state file against its schema.

**Parameters:**
- `filePath` - Absolute path to the state file
- `schema` - Schema object with `requiredFields` and `defaults`

**Returns:**
```javascript
{
  valid: boolean,
  error?: string,
  action?: 'initialize' | 'backup_and_reset' | 'add_field',
  missing_field?: string,
  data?: Object
}
```

**Example:**
```javascript
import { validateStateFile, STATE_SCHEMAS } from '@itz4blitz/agentful';

const result = validateStateFile(
  '/path/to/.agentful/state.json',
  STATE_SCHEMAS['state.json']
);

if (!result.valid) {
  console.log('Error:', result.error);
  console.log('Action:', result.action);
}
```

### `recoverStateFile(filePath, defaults, action, missingField)`

Recovers a corrupted or missing state file.

**Parameters:**
- `filePath` - Absolute path to the state file
- `defaults` - Default values for the state file
- `action` - Recovery action: `'initialize'`, `'backup_and_reset'`, or `'add_field'`
- `missingField` - Field to add (if action is `'add_field'`)

**Returns:**
```javascript
{
  success: boolean,
  message: string
}
```

**Example:**
```javascript
import { recoverStateFile, STATE_SCHEMAS } from '@itz4blitz/agentful';

const recovery = recoverStateFile(
  '/path/to/.agentful/state.json',
  STATE_SCHEMAS['state.json'].defaults,
  'backup_and_reset'
);

console.log(recovery.message);
```

### `validateAllState(projectRoot, options)`

Validates all state files in a project.

**Parameters:**
- `projectRoot` - Absolute path to project root directory
- `options` - Validation options:
  - `autoRecover` (boolean, default: `false`) - Automatically recover invalid files
  - `skipOptional` (boolean, default: `true`) - Skip validation of optional files
  - `verbose` (boolean, default: `false`) - Include detailed validation info

**Returns:**
```javascript
{
  valid: boolean,
  files: { [fileName]: ValidationResult },
  errors: string[],
  warnings: string[],
  recovered: string[]
}
```

**Example:**
```javascript
import { validateAllState, formatValidationResults } from '@itz4blitz/agentful';

const results = validateAllState(process.cwd(), {
  autoRecover: true,
  skipOptional: true,
  verbose: true
});

console.log(formatValidationResults(results));
```

### `getDefaultState(fileName)`

Gets the default state for a specific file.

**Parameters:**
- `fileName` - Name of the state file (e.g., `'state.json'`)

**Returns:** Object with default values or `null` if file not found in schemas

**Example:**
```javascript
import { getDefaultState } from '@itz4blitz/agentful';

const defaults = getDefaultState('completion.json');
console.log('Default gates:', defaults.gates);
```

### `isStateFileValid(projectRoot, fileName)`

Quick check if a state file exists and is valid.

**Parameters:**
- `projectRoot` - Absolute path to project root directory
- `fileName` - Name of the state file (e.g., `'state.json'`)

**Returns:** `boolean` - True if file exists and is valid

**Example:**
```javascript
import { isStateFileValid } from '@itz4blitz/agentful';

if (!isStateFileValid(process.cwd(), 'state.json')) {
  console.error('State file is invalid or missing');
  process.exit(1);
}
```

### `getStateFile(projectRoot, fileName, options)`

Gets state file content with validation.

**Parameters:**
- `projectRoot` - Absolute path to project root directory
- `fileName` - Name of the state file (e.g., `'state.json'`)
- `options` - Options:
  - `autoRecover` (boolean, default: `false`) - Automatically recover invalid files

**Returns:**
```javascript
{
  valid: boolean,
  data: Object | null,
  error: string | null,
  recovered?: boolean
}
```

**Example:**
```javascript
import { getStateFile } from '@itz4blitz/agentful';

const result = getStateFile(process.cwd(), 'completion.json', {
  autoRecover: true
});

if (result.valid) {
  console.log('Features:', result.data.features);
  if (result.recovered) {
    console.log('⚠️  File was auto-recovered');
  }
}
```

### `updateStateFile(projectRoot, fileName, updates)`

Updates a state file with validation.

**Parameters:**
- `projectRoot` - Absolute path to project root directory
- `fileName` - Name of the state file (e.g., `'state.json'`)
- `updates` - Object with updates or function that receives current state

**Returns:**
```javascript
{
  success: boolean,
  message: string,
  data?: Object
}
```

**Example:**
```javascript
import { updateStateFile } from '@itz4blitz/agentful';

// Update with object
updateStateFile(process.cwd(), 'state.json', {
  agents: ['orchestrator', 'backend']
});

// Update with function
updateStateFile(process.cwd(), 'completion.json', (current) => ({
  ...current,
  overall_progress: current.overall_progress + 10,
  last_updated: new Date().toISOString()
}));
```

### `formatValidationResults(results)`

Formats validation results for display.

**Parameters:**
- `results` - Results from `validateAllState()`

**Returns:** Formatted string with errors, warnings, and recovery messages

**Example:**
```javascript
import { validateAllState, formatValidationResults } from '@itz4blitz/agentful';

const results = validateAllState(process.cwd());
console.log(formatValidationResults(results));
```

## STATE_SCHEMAS

Exported constant containing schemas for all state files:

```javascript
import { STATE_SCHEMAS } from '@itz4blitz/agentful';

// List all state files
for (const [fileName, schema] of Object.entries(STATE_SCHEMAS)) {
  console.log(`${fileName}: ${schema.description}`);
  console.log('Required fields:', schema.requiredFields);
  console.log('Optional:', schema.optional || false);
}
```

## Usage in Commands

### Basic Validation Pattern

```javascript
import { validateAllState, formatValidationResults } from '@itz4blitz/agentful';

export async function runCommand() {
  const projectRoot = process.cwd();

  // Validate state at start of command
  const validation = validateAllState(projectRoot, {
    autoRecover: true,
    skipOptional: true
  });

  if (!validation.valid) {
    console.error('❌ State validation failed');
    console.error(formatValidationResults(validation));
    return false;
  }

  // Continue with command...
}
```

### Safe State Access Pattern

```javascript
import { getStateFile, updateStateFile } from '@itz4blitz/agentful';

export async function runCommand() {
  const projectRoot = process.cwd();

  // Get state safely
  const state = getStateFile(projectRoot, 'completion.json', {
    autoRecover: true
  });

  if (!state.valid) {
    console.error('Failed to load state:', state.error);
    return false;
  }

  // Use state
  console.log('Progress:', state.data.overall_progress);

  // Update state safely
  const updateResult = updateStateFile(projectRoot, 'completion.json', {
    overall_progress: 100,
    features_complete: state.data.features_total
  });

  if (!updateResult.success) {
    console.error('Failed to update state:', updateResult.message);
    return false;
  }

  return true;
}
```

## Testing

The module includes comprehensive unit tests covering:
- Individual file validation
- File recovery strategies
- Batch validation of all state files
- Auto-recovery workflows
- Error handling edge cases
- Integration scenarios

Run tests:
```bash
npm test -- test/unit/state-validator.test.js
```

## Migration Guide

### Before (duplicated validation)

```javascript
// In each command
if (!fs.existsSync('.agentful/state.json')) {
  fs.writeFileSync('.agentful/state.json', JSON.stringify({
    initialized: new Date().toISOString(),
    version: '1.0.0'
  }));
}

const state = JSON.parse(fs.readFileSync('.agentful/state.json', 'utf-8'));
```

### After (centralized validation)

```javascript
import { getStateFile } from '@itz4blitz/agentful';

const result = getStateFile(process.cwd(), 'state.json', {
  autoRecover: true
});

const state = result.data;
```

## Error Messages and Recovery

The module provides clear error messages and recovery strategies:

### File Not Found
```
❌ state.json: File not found: /path/to/.agentful/state.json
```
**Action:** `initialize` - Creates file with defaults

### Invalid JSON
```
❌ state.json: Invalid JSON in /path/to/.agentful/state.json: Unexpected token
```
**Action:** `backup_and_reset` - Backs up corrupted file and creates fresh one

### Missing Field
```
❌ state.json: Missing required field 'version' in /path/to/.agentful/state.json
```
**Action:** `add_field` - Adds missing field with default value

## Best Practices

1. **Always use auto-recovery in commands**: Set `autoRecover: true` when calling `validateAllState()` or `getStateFile()` in user-facing commands

2. **Skip optional files by default**: Set `skipOptional: true` unless you specifically need to validate architecture.json or agent-metrics.json

3. **Use verbose mode for debugging**: Set `verbose: true` when troubleshooting state issues

4. **Update state safely**: Always use `updateStateFile()` instead of direct JSON.parse/stringify to ensure required fields aren't removed

5. **Check validation results**: Never assume validation succeeded - always check the `valid` flag

6. **Format error messages**: Use `formatValidationResults()` to display user-friendly error messages

## Related Files

- `/Users/blitz/Development/agentful/lib/state-validator.js` - Main module
- `/Users/blitz/Development/agentful/test/unit/state-validator.test.js` - Unit tests
- `/Users/blitz/Development/agentful/lib/state-validator.example.js` - Usage examples
