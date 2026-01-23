/**
 * Output Parser Usage Examples
 *
 * Demonstrates how to use the OutputParser to extract structured data
 * from agent responses.
 */

import {
  OutputParser,
  parseAgentOutput,
  extractJSON,
  extractDecisions,
  extractProgress,
  extractQuestions
} from './output-parser.js';

// Example 1: Parsing structured JSON output
const jsonOutput = `
I've analyzed the codebase and found the following:

\`\`\`json
{
  "files": 42,
  "lines": 3500,
  "coverage": 85.2,
  "issues": [
    {"type": "warning", "file": "index.js", "line": 10}
  ]
}
\`\`\`

This shows good code quality overall.
`;

const result1 = parseAgentOutput(jsonOutput);
console.log('Type:', result1.type); // 'structured'
console.log('Data:', result1.data); // { files: 42, lines: 3500, ... }

// Example 2: Extracting decisions
const decisionOutput = `
I need your input on the authentication approach:

DECISION: Should we use JWT or sessions for authentication?
OPTIONS:
- JWT (stateless, scalable, better for microservices)
- Sessions (simpler, better for monoliths, easier to revoke)

This decision affects the architecture significantly.
`;

const result2 = parseAgentOutput(decisionOutput);
console.log('Type:', result2.type); // 'decisions'
console.log('Decisions:', result2.decisions);
// [{
//   question: "Should we use JWT or sessions for authentication?",
//   options: [
//     { value: "JWT", description: "stateless, scalable, better for microservices" },
//     { value: "Sessions", description: "simpler, better for monoliths, easier to revoke" }
//   ],
//   context: "..."
// }]

// Example 3: Tracking progress
const progressOutput = `
Running validation checks...

[PROGRESS: 75%]

Progress: 6/8 tests passing

Still working on the integration tests.
`;

const result3 = parseAgentOutput(progressOutput);
console.log('Type:', result3.type); // 'progress'
console.log('Progress:', result3.progress);
// {
//   percentage: 75,
//   format: 'percentage',
//   raw: '[PROGRESS: 75%]'
// }

// Example 4: Detecting questions
const questionOutput = `
I'm implementing the user service.

QUESTION: What should be the password minimum length?

Should we enforce special characters in passwords?

I'll continue with the default settings for now.
`;

const result4 = parseAgentOutput(questionOutput);
console.log('Type:', result4.type); // 'question'
console.log('Questions:', result4.questions);
// [
//   {
//     question: "What should be the password minimum length?",
//     type: "explicit",
//     line: 3,
//     context: [...]
//   },
//   {
//     question: "Should we enforce special characters in passwords?",
//     type: "inferred",
//     line: 5,
//     context: [...]
//   }
// ]

// Example 5: Plain text fallback
const plainOutput = `
I've completed the implementation. All tests are passing.
`;

const result5 = parseAgentOutput(plainOutput);
console.log('Type:', result5.type); // 'text'
console.log('Data:', result5.data); // "I've completed the implementation..."

// Example 6: Using specific extraction functions
const mixedOutput = `
Here's the analysis:

\`\`\`json
{"status": "complete", "score": 95}
\`\`\`

DECISION: Deploy to production now?
OPTIONS:
- Yes (code is ready)
- No (wait for QA)

Progress: 4/5 features complete

What's the deployment schedule?
`;

// Extract only JSON
const jsonOnly = extractJSON(mixedOutput);
console.log('Found JSON:', jsonOnly.found); // true
console.log('Data:', jsonOnly.data); // { status: "complete", score: 95 }

// Extract only decisions
const decisionsOnly = extractDecisions(mixedOutput);
console.log('Decisions:', decisionsOnly.length); // 1

// Extract only progress
const progressOnly = extractProgress(mixedOutput);
console.log('Progress:', progressOnly.percentage); // 80

// Extract only questions
const questionsOnly = extractQuestions(mixedOutput);
console.log('Questions:', questionsOnly.length); // 1

// Example 7: Using the parser class directly
const parser = new OutputParser();

const agentResponse = `
Implementation complete. Here's the summary:

\`\`\`json
{
  "endpoint": "/api/users",
  "method": "POST",
  "validation": "zod",
  "authentication": "JWT"
}
\`\`\`
`;

const parsed = parser.parse(agentResponse);
if (parsed.type === 'structured') {
  console.log('Extracted structured data:', parsed.data);
  console.log('Endpoint:', parsed.data.endpoint); // "/api/users"
  console.log('Method:', parsed.data.method); // "POST"
}

// Example 8: Multiple JSON blocks
const multiJsonOutput = `
\`\`\`json
{"config": "development"}
\`\`\`

And here's the production config:

\`\`\`json
{"config": "production", "debug": false}
\`\`\`
`;

const multiResult = extractJSON(multiJsonOutput);
console.log('All JSON blocks:', multiResult.all);
// [
//   { config: "development" },
//   { config: "production", debug: false }
// ]
console.log('First block:', multiResult.data); // { config: "development" }

// Example 9: Integration with agent orchestrator
async function handleAgentResponse(agentOutput) {
  const parsed = parseAgentOutput(agentOutput);

  switch (parsed.type) {
    case 'structured':
      // Store structured data in state
      await saveToState(parsed.data);
      break;

    case 'decisions':
      // Add to decisions.json for user resolution
      await addPendingDecisions(parsed.decisions);
      break;

    case 'progress':
      // Update completion tracking
      await updateProgress(parsed.progress.percentage);
      break;

    case 'question':
      // Prompt user for input
      await promptUser(parsed.questions);
      break;

    case 'text':
      // Log informational output
      console.log('Agent:', parsed.data);
      break;
  }
}

// Example 10: Error handling
try {
  const invalidOutput = null;
  const result = parseAgentOutput(invalidOutput);
  console.log('Type:', result.type); // 'text'
  console.log('Data:', result.data); // null
} catch (error) {
  console.error('Parser error:', error);
}

// Example 11: Complex progress patterns
const complexProgress = `
Testing progress: 3 of 5 features complete
Coverage increased to 82%
15% of integration tests still failing
`;

const prog1 = extractProgress(complexProgress);
console.log('Progress:', prog1.percentage); // 60 (from "3 of 5")
