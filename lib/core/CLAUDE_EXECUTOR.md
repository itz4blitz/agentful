# Claude Code Executor - Streaming Implementation

## Overview

The Claude Code Executor provides real-time streaming execution of Claude Code subprocess with event-based progress tracking, question detection, and error handling.

## Architecture

### Components

1. **ClaudeExecutor** - Main executor class (extends EventEmitter)
2. **OutputParser** - Parses streaming output for structured events
3. **ExecutionState** - Enum for tracking execution lifecycle

### Files Created

- `/Users/blitz/Development/agentful/lib/core/claude-executor.js` - Main implementation
- `/Users/blitz/Development/agentful/lib/core/claude-executor.example.js` - Usage examples

## Features

### 1. Real-Time Streaming

Emits events for each chunk of output as it arrives from the Claude Code subprocess:

```javascript
executor.on('chunk', (event) => {
  console.log(event.text); // Raw stdout chunk
});
```

### 2. Progress Detection

Automatically detects progress markers in output:
- `[PROGRESS: 45%]` format
- `Progress: 45%` format
- Task completion markers (`Task completed`, `✓ Complete`)

```javascript
executor.on('progress', (event) => {
  console.log(`${event.percentage}%`); // 0-100
});
```

### 3. Question Detection

Identifies when the agent asks questions:
- Lines ending with `?`
- Lines containing "Please provide"

```javascript
executor.on('question', (event) => {
  console.log(`Question: ${event.text}`);
});
```

### 4. Error Detection

Detects errors from both stdout and stderr:
- Lines starting with "Error:" or "ERROR:"
- Lines containing "❌"
- All stderr output

```javascript
executor.on('error', (event) => {
  console.error(`Error from ${event.source}: ${event.message}`);
});
```

### 5. Execution Lifecycle Events

- `start` - Execution began
- `chunk` - Raw output chunk received
- `progress` - Progress marker detected
- `question` - Question detected
- `error` - Error detected
- `complete` - Execution finished successfully

## API Reference

### ClaudeExecutor Class

#### Constructor

```javascript
const executor = new ClaudeExecutor({
  claudeCommand: 'claude',           // Claude CLI command
  workingDir: process.cwd(),         // Working directory
  timeout: 10 * 60 * 1000,          // 10 minutes
  maxOutputSize: 1 * 1024 * 1024    // 1MB
});
```

#### Methods

##### executeViaSubprocess(agentName, task, options)

Execute agent via subprocess with event emission:

```javascript
const result = await executor.executeViaSubprocess('backend', 'Build API', {
  prompt: 'Custom prompt...',  // Optional: override task with custom prompt
  timeout: 5 * 60 * 1000,     // Optional: custom timeout
  workingDir: '/path/to/dir'  // Optional: custom working directory
});

// Returns:
// {
//   executionId: 'uuid',
//   state: 'completed',
//   output: 'full output text',
//   duration: 12345,
//   exitCode: 0,
//   truncated: false
// }
```

##### executeWithStreaming(agentName, task, callbacks, options)

Execute with callback-based streaming:

```javascript
const result = await executor.executeWithStreaming(
  'backend',
  'Build API',
  {
    onChunk: (text) => console.log(text),
    onProgress: (pct, msg) => console.log(`${pct}%: ${msg}`),
    onQuestion: (text) => console.log(`Question: ${text}`),
    onError: (msg, source) => console.error(`Error from ${source}: ${msg}`)
  },
  {
    timeout: 5 * 60 * 1000
  }
);
```

##### cancel(executionId)

Cancel an active execution:

```javascript
const cancelled = executor.cancel(executionId);
// Returns true if cancelled, false if not found
```

##### getExecutionStatus(executionId)

Get status of an execution:

```javascript
const status = executor.getExecutionStatus(executionId);
// {
//   id: 'uuid',
//   agent: 'backend',
//   task: 'Build API',
//   state: 'running',
//   startTime: 1234567890,
//   endTime: null,
//   duration: 5000,
//   exitCode: null,
//   outputLength: 1024,
//   errorLength: 0
// }
```

##### listActiveExecutions()

List all active executions:

```javascript
const active = executor.listActiveExecutions();
// Returns array of execution statuses
```

### OutputParser Class

Internal class for parsing streaming output. Detects:
- Progress markers
- Questions
- Errors

```javascript
const parser = new OutputParser();
const events = parser.parse(chunk);
// {
//   progress?: { percentage: 45, raw: '[PROGRESS: 45%]' },
//   question?: { text: 'What database?', timestamp: 1234567890 },
//   error?: { message: 'Connection failed', timestamp: 1234567890 }
// }
```

## Usage Examples

### Basic Streaming

```javascript
import { createClaudeExecutor } from './claude-executor.js';

const executor = createClaudeExecutor();

await executor.executeWithStreaming('backend', 'Build API', {
  onChunk: (text) => process.stdout.write(text),
  onProgress: (pct) => console.log(`Progress: ${pct}%`),
  onQuestion: (q) => console.log(`Question: ${q}`),
  onError: (err) => console.error(err)
});
```

### Event-Based Approach

```javascript
const executor = createClaudeExecutor();

executor.on('progress', (event) => {
  console.log(`${event.percentage}%`);
});

executor.on('complete', (event) => {
  console.log(`Completed in ${event.duration}ms`);
});

await executor.executeViaSubprocess('backend', 'Build API');
```

### Concurrent Executions

```javascript
const executor = createClaudeExecutor();

const results = await Promise.all([
  executor.executeViaSubprocess('backend', 'Build API'),
  executor.executeViaSubprocess('frontend', 'Build UI'),
  executor.executeViaSubprocess('tester', 'Write tests')
]);

console.log(`All ${results.length} tasks completed!`);
```

### With Cancellation

```javascript
const executor = createClaudeExecutor();

let executionId;

executor.on('start', (event) => {
  executionId = event.executionId;

  // Cancel after 10 seconds
  setTimeout(() => {
    executor.cancel(executionId);
  }, 10000);
});

await executor.executeViaSubprocess('backend', 'Long task');
```

## Integration with Existing Code

This new executor can be integrated into:

1. **lib/server/executor.js** - Replace non-streaming subprocess logic
2. **lib/pipeline/executor.js** - Add streaming to pipeline execution
3. Future web UI - Real-time progress display

### Migration Path

For `lib/server/executor.js`:

```javascript
// Old (non-streaming):
const result = await executeAgent(agentName, task, options);

// New (with streaming):
import { createClaudeExecutor } from '../core/claude-executor.js';
const executor = createClaudeExecutor();
const result = await executor.executeViaSubprocess(agentName, task, options);
```

## Progress Marker Format

For agents to emit progress, use these formats in output:

```bash
# Format 1 (recommended)
[PROGRESS: 25%]

# Format 2
Progress: 50%

# Format 3 (completion)
Task completed
✓ Complete
```

## Security Features

1. **Output Size Limiting** - Max 1MB per execution (configurable)
2. **Timeout Enforcement** - Default 10 minutes (configurable)
3. **Process Cleanup** - Proper SIGTERM → SIGKILL cascade
4. **No Shell Injection** - Uses spawn with array args, not shell

## Error Handling

The executor handles:

1. **Spawn Errors** - Claude CLI not found or fails to start
2. **Timeout Errors** - Execution exceeds timeout
3. **Exit Code Errors** - Non-zero exit codes
4. **Output Truncation** - Graceful handling of size limits

All errors are emitted as events and also throw from async methods.

## Performance Considerations

1. **Memory Usage** - Output buffered in memory (1MB limit)
2. **Event Overhead** - EventEmitter overhead for high-frequency chunks
3. **Concurrent Executions** - No hard limit, but spawns multiple processes

For production use:
- Consider streaming to disk for large outputs
- Implement execution queue for rate limiting
- Add persistent storage for execution history

## Testing

See `/Users/blitz/Development/agentful/lib/core/claude-executor.example.js` for runnable examples.

To test manually:

```bash
node -e "
import('./claude-executor.example.js').then(({ basicStreamingExample }) => {
  basicStreamingExample();
});
"
```

## Future Enhancements

1. **Disk Streaming** - Stream large outputs to disk instead of memory
2. **Structured Output** - Parse JSON or YAML outputs automatically
3. **Retry Logic** - Automatic retry on transient failures
4. **Rate Limiting** - Queue and throttle concurrent executions
5. **Metrics** - Track execution times, success rates, etc.
6. **API Execution** - Direct Claude API integration (non-CLI)

## Related Files

- `/Users/blitz/Development/agentful/lib/server/executor.js` - Existing server executor (non-streaming)
- `/Users/blitz/Development/agentful/lib/pipeline/executor.js` - Existing pipeline executor (partial streaming)
- `/Users/blitz/Development/agentful/lib/ci/claude-action-integration.js` - Agent definition loading

## Version

- **Created**: 2026-01-22
- **Author**: Backend Agent
- **Status**: Ready for integration

## Summary

The Claude Code Executor provides a robust, event-driven streaming execution framework for Claude Code subprocess. It enables real-time progress tracking, question detection, and error handling with a clean, composable API.

Key benefits:
- Real-time output streaming
- Automatic progress/question/error detection
- Callback and event-based APIs
- Concurrent execution support
- Proper timeout and cancellation handling
- Memory-safe with output size limits
