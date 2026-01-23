/**
 * Example Usage: Claude Code Executor with Streaming
 *
 * This file demonstrates how to use the ClaudeExecutor for real-time
 * streaming of agent execution output.
 */

import { ClaudeExecutor, createClaudeExecutor } from './claude-executor.js';

/**
 * Example 1: Basic streaming execution
 */
async function basicStreamingExample() {
  const executor = createClaudeExecutor({
    timeout: 5 * 60 * 1000, // 5 minutes
  });

  console.log('Starting backend agent...\n');

  try {
    const result = await executor.executeWithStreaming(
      'backend',
      'Build REST API for user authentication with JWT tokens',
      {
        onChunk: (text) => {
          process.stdout.write(text);
        },
        onProgress: (percentage, message) => {
          console.log(`\n[Progress: ${percentage}%] ${message}`);
        },
        onQuestion: (question) => {
          console.log(`\n[Question] ${question}`);
        },
        onError: (error, source) => {
          console.error(`\n[Error from ${source}] ${error}`);
        }
      }
    );

    console.log('\n\nExecution completed!');
    console.log('Duration:', result.duration, 'ms');
    console.log('Exit code:', result.exitCode);
  } catch (error) {
    console.error('Execution failed:', error.message);
  }
}

/**
 * Example 2: Event-based streaming (lower-level API)
 */
async function eventBasedExample() {
  const executor = createClaudeExecutor();

  // Register event listeners
  executor.on('start', (event) => {
    console.log(`Started: ${event.agent} - ${event.task}`);
  });

  executor.on('chunk', (event) => {
    // Process raw chunks
    process.stdout.write(event.text);
  });

  executor.on('progress', (event) => {
    console.log(`\nProgress: ${event.percentage}%`);
  });

  executor.on('question', (event) => {
    console.log(`\nQuestion detected: ${event.text}`);
  });

  executor.on('error', (event) => {
    console.error(`\nError: ${event.message}`);
  });

  executor.on('complete', (event) => {
    console.log(`\nCompleted in ${event.duration}ms`);
  });

  try {
    await executor.executeViaSubprocess(
      'frontend',
      'Create responsive dashboard with charts'
    );
  } catch (error) {
    console.error('Execution failed:', error.message);
  }
}

/**
 * Example 3: Multiple concurrent executions with progress tracking
 */
async function concurrentExecutionExample() {
  const executor = createClaudeExecutor();

  const tasks = [
    { agent: 'backend', task: 'Build API endpoints' },
    { agent: 'frontend', task: 'Create UI components' },
    { agent: 'tester', task: 'Write integration tests' },
  ];

  const progressMap = new Map();

  // Track progress for all executions
  executor.on('progress', (event) => {
    progressMap.set(event.executionId, event.percentage);
    console.log(`[${event.executionId.substring(0, 8)}] ${event.percentage}%`);
  });

  executor.on('complete', (event) => {
    console.log(`[${event.executionId.substring(0, 8)}] Completed!`);
  });

  try {
    // Execute all tasks in parallel
    const results = await Promise.all(
      tasks.map(({ agent, task }) =>
        executor.executeViaSubprocess(agent, task)
      )
    );

    console.log(`\nAll tasks completed! Total: ${results.length}`);
  } catch (error) {
    console.error('One or more executions failed:', error.message);
  }
}

/**
 * Example 4: Execution with cancellation
 */
async function cancellationExample() {
  const executor = createClaudeExecutor({
    timeout: 60 * 1000, // 1 minute
  });

  let executionId = null;

  executor.on('start', (event) => {
    executionId = event.executionId;
    console.log(`Started execution: ${executionId}`);

    // Cancel after 10 seconds
    setTimeout(() => {
      console.log('\nCancelling execution...');
      const cancelled = executor.cancel(executionId);
      console.log('Cancelled:', cancelled);
    }, 10000);
  });

  try {
    await executor.executeViaSubprocess(
      'backend',
      'Build complex microservices architecture'
    );
  } catch (error) {
    console.error('Execution was cancelled or failed:', error.message);
  }
}

/**
 * Example 5: Custom prompt with streaming
 */
async function customPromptExample() {
  const executor = createClaudeExecutor();

  const customPrompt = `
You are a backend agent. Your task is to:

1. Analyze the existing database schema
2. Identify optimization opportunities
3. Suggest indexing strategies
4. Report progress using [PROGRESS: X%] markers

Begin analysis...
`;

  try {
    const result = await executor.executeWithStreaming(
      'backend',
      'Database optimization', // Task name (for logging)
      {
        onChunk: (text) => console.log(text),
        onProgress: (pct, msg) => console.log(`\n>>> ${pct}%: ${msg}`)
      },
      {
        prompt: customPrompt, // Override with custom prompt
        timeout: 2 * 60 * 1000 // 2 minutes
      }
    );

    console.log('\nAnalysis complete!');
  } catch (error) {
    console.error('Analysis failed:', error.message);
  }
}

// Run examples (uncomment to test)
// basicStreamingExample();
// eventBasedExample();
// concurrentExecutionExample();
// cancellationExample();
// customPromptExample();

export {
  basicStreamingExample,
  eventBasedExample,
  concurrentExecutionExample,
  cancellationExample,
  customPromptExample
};
