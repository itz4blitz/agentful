# Validation Library

Centralized validation library for agentful state files. This library consolidates duplicated validation logic from 8+ command files into a single, well-tested module.

## Features

- File existence checks
- JSON parsing validation
- Schema validation using AJV
- Required field validation
- Standardized error codes and messages
- Helper functions for common state files
- Batch validation support

## Installation

The validation library is already included in the agentful package. Import it from `lib/validation.js`:

```javascript
import {
  validateStateFile,
  validateState,
  validateCompletion,
  validateDecisions,
  validateArchitecture,
  validateProduct,
  ValidationActions
} from './lib/validation.js';
```

## Standardized Action Codes

All validation functions return a standardized `action` field indicating what went wrong:

- **`missing`**: File does not exist
- **`corrupted`**: File exists but is not valid JSON
- **`invalid`**: JSON is valid but doesn't match the schema
- **`incomplete`**: Schema is valid but required fields are missing

## Basic Usage

### Validate any state file

```javascript
import { validateStateFile } from './lib/validation.js';

const result = validateStateFile(
  '.agentful/state.json',
  'state',
  ['custom_field'] // optional additional required fields
);

if (!result.valid) {
  console.error(`Validation failed: ${result.action}`);
  console.error(`Error: ${result.error}`);

  // Handle different error types
  switch (result.action) {
    case 'missing':
      // Create the file
      break;
    case 'corrupted':
      // Backup and reset
      break;
    case 'invalid':
      // Show schema errors
      console.error(result.errors);
      break;
    case 'incomplete':
      // Add missing field
      console.error(`Missing field: ${result.missing_field}`);
      break;
  }
} else {
  // Use the validated content
  const data = result.content;
  console.log('Valid state:', data);
}
```

### Helper Functions

Use dedicated helper functions for common state files:

```javascript
import {
  validateState,
  validateCompletion,
  validateDecisions
} from './lib/validation.js';

// Validate state.json (default path: .agentful/state.json)
const stateResult = validateState();

// Validate completion.json with custom path
const completionResult = validateCompletion('.agentful/completion.json');

// Validate decisions.json with additional required fields
const decisionsResult = validateDecisions(
  '.agentful/decisions.json',
  ['custom_metadata']
);
```

### Batch Validation

Validate multiple files at once:

```javascript
import { validateBatch } from './lib/validation.js';

const results = validateBatch([
  { filePath: '.agentful/state.json', schemaName: 'state' },
  { filePath: '.agentful/completion.json', schemaName: 'completion' },
  { filePath: '.agentful/decisions.json', schemaName: 'decisions', requiredFields: ['pending'] }
]);

// Check all results
for (const [filePath, result] of Object.entries(results)) {
  if (!result.valid) {
    console.error(`${filePath}: ${result.action}`);
  }
}
```

### Error Messages

Get human-readable error messages:

```javascript
import { getErrorMessage, getSuggestedAction } from './lib/validation.js';

const result = validateState();

if (!result.valid) {
  console.error(getErrorMessage(result));
  console.log('Suggested action:', getSuggestedAction(result));
}
```

## Available Schemas

The library includes schemas for the following state files:

### 1. `state` - state.json

Tracks initialization and available agents/skills.

**Required fields:**
- `initialized` (string, ISO 8601 date-time)
- `version` (string, semantic version)
- `agents` (array of strings)
- `skills` (array of strings)

**Example:**
```json
{
  "initialized": "2026-01-21T10:00:00.000Z",
  "version": "1.0.0",
  "agents": ["frontend", "backend"],
  "skills": ["react", "nodejs"]
}
```

### 2. `completion` - completion.json

Tracks completion progress for agents and skills.

**Required fields:**
- `agents` (object with completion data)
- `skills` (object with completion data)
- `lastUpdated` (string, ISO 8601 date-time)

**Example:**
```json
{
  "agents": {
    "frontend": { "completed": true, "progress": 100 }
  },
  "skills": {
    "react": { "completed": false, "progress": 75 }
  },
  "lastUpdated": "2026-01-21T10:00:00.000Z"
}
```

### 3. `decisions` - decisions.json

Tracks pending decisions and their resolutions.

**Required fields:**
- `decisions` (array of decision objects)
- `lastUpdated` (string, ISO 8601 date-time)

**Decision object required fields:**
- `id` (string)
- `question` (string)
- `status` (enum: "pending", "answered", "cancelled")

**Example:**
```json
{
  "decisions": [
    {
      "id": "decision-1",
      "question": "Which database should we use?",
      "status": "pending",
      "created": "2026-01-21T10:00:00.000Z"
    }
  ],
  "lastUpdated": "2026-01-21T10:00:00.000Z"
}
```

### 4. `architecture` - architecture.json

Tracks project architecture decisions.

**Required fields:**
- `project_type` (string)
- `technologies` (object)
- `patterns` (array of strings)
- `lastUpdated` (string, ISO 8601 date-time)

**Example:**
```json
{
  "project_type": "web-app",
  "technologies": {
    "frontend": "React",
    "backend": "Node.js"
  },
  "patterns": ["MVC", "REST"],
  "lastUpdated": "2026-01-21T10:00:00.000Z"
}
```

### 5. `product` - product.json

Tracks product specification and features.

**Required fields:**
- `name` (string)
- `description` (string)
- `features` (array of feature objects)
- `lastUpdated` (string, ISO 8601 date-time)

**Feature object required fields:**
- `id` (string)
- `name` (string)

**Example:**
```json
{
  "name": "Task Manager",
  "description": "A simple task management app",
  "features": [
    {
      "id": "feature-1",
      "name": "User Authentication",
      "priority": "high"
    }
  ],
  "lastUpdated": "2026-01-21T10:00:00.000Z"
}
```

## Replacing Duplicated Code

The validation library replaces this duplicated pattern found in 8+ command files:

```javascript
// OLD - Duplicated in every command
function validate_state_file(file_path, required_fields) {
  if (!exists(file_path)) {
    return { valid: false, error: `File not found: ${file_path}`, action: "initialize" };
  }

  let content;
  try {
    content = JSON.parse(Read(file_path));
  } catch (e) {
    return { valid: false, error: `Invalid JSON in ${file_path}`, action: "backup_and_reset" };
  }

  for (const field of required_fields) {
    if (!(field in content)) {
      return { valid: false, error: `Missing field '${field}'`, action: "add_field", missing_field: field };
    }
  }

  return { valid: true, content };
}

// NEW - Single centralized function
import { validateStateFile } from './lib/validation.js';

const result = validateStateFile(filePath, schemaName, requiredFields);
```

## Benefits

1. **Consistency**: All commands use the same validation logic
2. **Maintainability**: Update validation logic in one place
3. **Testability**: Comprehensive test coverage (35+ tests)
4. **Type Safety**: AJV schema validation catches type errors
5. **Standardization**: Consistent error codes and messages
6. **Documentation**: Clear API with JSDoc comments

## Testing

Run the validation library tests:

```bash
npm test -- test/unit/validation.test.js
```

The test suite includes:
- Missing file validation
- Corrupted JSON handling
- Schema validation
- Required field checks
- Batch validation
- Error message generation
- Edge cases

## Advanced Usage

### Custom Schemas

You can access the raw AJV instance and schemas:

```javascript
import { ajv, schemas } from './lib/validation.js';

// Compile a custom schema
const customSchema = ajv.compile({
  type: 'object',
  required: ['custom_field'],
  properties: {
    custom_field: { type: 'string' }
  }
});

// Use it
const valid = customSchema(data);
if (!valid) {
  console.error(customSchema.errors);
}
```

### ValidationActions Constants

Use constants instead of strings for action codes:

```javascript
import { ValidationActions } from './lib/validation.js';

if (result.action === ValidationActions.MISSING) {
  // Handle missing file
} else if (result.action === ValidationActions.CORRUPTED) {
  // Handle corrupted file
}
```

## Migration Guide

To migrate existing command validation code to use this library:

1. **Import the validation library**:
   ```javascript
   import { validateStateFile } from './lib/validation.js';
   ```

2. **Replace inline validation with library call**:
   ```javascript
   // Before
   const validation = validate_state_file(".agentful/state.json", ["current_task"]);

   // After
   const validation = validateStateFile(".agentful/state.json", "state", ["current_task"]);
   ```

3. **Update action names**:
   - `"not_found"` → `"missing"`
   - `"initialize"` → `"missing"`
   - `"backup_and_reset"` → `"corrupted"`
   - `"add_field"` → `"incomplete"`
   - Schema errors → `"invalid"`

4. **Use helper functions for common files**:
   ```javascript
   // Before
   const validation = validate_state_file(".agentful/state.json", []);

   // After
   const validation = validateState();
   ```

## API Reference

### `validateStateFile(filePath, schemaName, requiredFields)`

Universal validation function for any state file.

**Parameters:**
- `filePath` (string): Absolute path to the file
- `schemaName` (string): Schema to use ('state', 'completion', 'decisions', 'architecture', 'product')
- `requiredFields` (string[], optional): Additional required fields beyond schema

**Returns:**
- `{ valid: true, content: object }` on success
- `{ valid: false, action: string, error: string, ... }` on failure

### `validateState(filePath?, additionalFields?)`

Validate state.json file. Default path: `.agentful/state.json`

### `validateCompletion(filePath?, additionalFields?)`

Validate completion.json file. Default path: `.agentful/completion.json`

### `validateDecisions(filePath?, additionalFields?)`

Validate decisions.json file. Default path: `.agentful/decisions.json`

### `validateArchitecture(filePath?, additionalFields?)`

Validate architecture.json file. Default path: `.agentful/architecture.json`

### `validateProduct(filePath?, additionalFields?)`

Validate product.json file. Default path: `.agentful/product.json`

### `validateBatch(files)`

Validate multiple files at once.

**Parameters:**
- `files` (array): Array of `{ filePath, schemaName, requiredFields? }`

**Returns:**
- Object mapping filePath to validation result

### `getErrorMessage(validationResult)`

Get human-readable error message for a validation result.

### `getSuggestedAction(validationResult)`

Get suggested action to fix a validation error.

## License

MIT
