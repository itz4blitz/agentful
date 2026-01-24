---
name: agentful-init
description: Interactive onboarding - 7 guided questions to set up agentful for your project
---

# /agentful-init

Interactive first-time setup for agentful. Collects product requirements through guided questions and auto-generates specialized agents.

## When to Use

- **Fresh project**: No product spec exists yet
- **New to agentful**: First time using the framework
- **Quick start**: Want guided setup instead of manual editing

## Flow Overview

```
/agentful-init
  ↓
7 Guided Questions (AskUserQuestion)
  ↓
Generate .claude/product/index.md
  ↓
Auto-trigger /agentful-generate
  ↓
Research best practices (Context7/WebSearch)
  ↓
Generate specialized agents + skills
  ↓
Ready for /agentful-start
```

## Implementation

### Step 1: Detect Existing Setup

```javascript
// Check if already initialized
const hasProductSpec = exists('.claude/product/index.md') &&
                       Read('.claude/product/index.md').length > 200;
const hasAgents = exists('.agentful/architecture.json');

if (hasProductSpec && hasAgents) {
  // Already set up - offer to re-run or skip
  const answer = AskUserQuestion({
    question: `agentful is already set up for this project.

What would you like to do?`,
    options: [
      'Continue with existing setup',
      'Re-run initialization (will overwrite product spec)',
      'Cancel'
    ]
  });

  if (answer === 'Continue with existing setup') {
    console.log(`
✅ Keeping existing setup.

Current status:
- Product spec: .claude/product/index.md
- Generated agents: ${getAgentCount()} agents
- Tech stack: ${getTechStack()}

Run /agentful-start to begin development.
`);
    return;
  } else if (answer === 'Cancel') {
    return;
  }
  // Otherwise continue with re-initialization
}
```

### Step 2: Detect Tech Stack

```javascript
// Auto-detect before asking questions
const techStack = detectTechStack();

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   agentful - Interactive Setup
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Let's get you set up! I'll ask 7 quick questions to understand your project.

Tech Stack Detected:
${formatTechStack(techStack)}

This will take about 5 minutes.
`);
```

### Step 3: Ask 7 Guided Questions

Use `AskUserQuestion` for each question with validation:

#### Q1: What are you building?

```javascript
const productDescription = AskUserQuestion({
  question: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Question 1/7: Product Description
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What are you building?

Describe your product in 1-3 sentences:
- What problem does it solve?
- Who is it for?
- What makes it unique?

Example: "A task management app for remote teams that integrates with Slack and automatically prioritizes work based on deadlines and dependencies."
`,
  // Free-form text input
});

// Validate response
if (!productDescription || productDescription.trim().length < 20) {
  throw new Error('Please provide a more detailed description (at least 20 characters)');
}
```

#### Q2: Tech Stack Confirmation

```javascript
const techStackConfirmation = AskUserQuestion({
  question: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Question 2/7: Tech Stack
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

I detected this tech stack:

${formatTechStack(techStack)}

Is this correct?
`,
  options: ['Yes, correct', 'No, let me specify manually']
});

let finalTechStack = techStack;

if (techStackConfirmation === 'No, let me specify manually') {
  // Ask for manual input
  const manualStack = AskUserQuestion({
    question: `
Please describe your tech stack:

Format: Language, Framework, Database, Testing
Example: TypeScript, Next.js 15, PostgreSQL with Prisma, Vitest
`,
  });

  finalTechStack = parseManualTechStack(manualStack);
}
```

#### Q3: Key Features

```javascript
const features = AskUserQuestion({
  question: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Question 3/7: Key Features
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What are the main features you want to build?

List 3-10 key features, one per line.

Example:
User authentication with email/password
Task creation and assignment
Real-time notifications
Calendar integration
Team collaboration spaces
`,
});

const featureList = features.split('\n')
  .map(f => f.trim())
  .filter(f => f.length > 0);

if (featureList.length < 2) {
  throw new Error('Please provide at least 2 features');
}
```

#### Q4: Priority Levels

```javascript
const priorityGuidance = AskUserQuestion({
  question: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Question 4/7: Feature Priorities
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

I'll assign priority levels to your features.

Priority Levels:
- CRITICAL: Must have for MVP (core value prop)
- HIGH: Important for launch
- MEDIUM: Nice to have soon
- LOW: Future enhancements

Should I:
`,
  options: [
    'Auto-assign priorities based on typical MVP (recommended)',
    'Let me set priorities for each feature manually'
  ]
});

let featuresPrioritized = [];

if (priorityGuidance.includes('Auto-assign')) {
  // First 2-3 features = CRITICAL, next 3-4 = HIGH, rest = MEDIUM
  featuresPrioritized = autoAssignPriorities(featureList);
} else {
  // Ask for each feature
  for (const feature of featureList) {
    const priority = AskUserQuestion({
      question: `Priority for "${feature}"?`,
      options: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
    });
    featuresPrioritized.push({ feature, priority });
  }
}
```

#### Q5: Testing Preferences

```javascript
const testingPreference = AskUserQuestion({
  question: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Question 5/7: Testing Strategy
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

How should agentful handle testing?

agentful automatically ensures:
- ✅ All tests passing
- ✅ 80% code coverage minimum
- ✅ No type errors
- ✅ Security scans

What level of testing do you want?
`,
  options: [
    'Comprehensive (unit + integration + E2E)',
    'Standard (unit + integration)',
    'Minimal (unit tests only)'
  ]
});

const coverageTarget = testingPreference.includes('Comprehensive') ? 85 : 80;
```

#### Q6: Deployment Target

```javascript
const deploymentTarget = AskUserQuestion({
  question: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Question 6/7: Deployment
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Where will this be deployed?

This helps optimize build configs and suggest best practices.
`,
  options: [
    'Vercel',
    'AWS (EC2, Lambda, etc.)',
    'Google Cloud',
    'Docker/Self-hosted',
    'Not sure yet / Multiple targets'
  ]
});
```

#### Q7: Experience Level

```javascript
const experienceLevel = AskUserQuestion({
  question: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Question 7/7: Your Experience
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What's your experience level with ${finalTechStack.framework}?

This helps me explain decisions and suggest best practices.
`,
  options: [
    'Expert - I know the internals',
    'Proficient - I build with it regularly',
    'Intermediate - I know the basics',
    'Beginner - First time using this stack'
  ]
});

const verbosityLevel = experienceLevel.includes('Beginner') ? 'detailed' :
                       experienceLevel.includes('Intermediate') ? 'moderate' :
                       'concise';
```

### Step 4: Generate Product Specification

```javascript
console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Generating Product Specification
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Creating .claude/product/index.md...
`);

// Generate structured product spec
const productSpec = generateProductSpec({
  description: productDescription,
  techStack: finalTechStack,
  features: featuresPrioritized,
  testing: {
    level: testingPreference,
    coverageTarget
  },
  deployment: deploymentTarget,
  verbosity: verbosityLevel
});

// Write to file
Write('.claude/product/index.md', productSpec);

console.log(`✅ Product specification created

File: .claude/product/index.md
Features: ${featureList.length}
Priorities: ${countByPriority(featuresPrioritized)}
`);

// Save setup progress
const setupProgress = {
  completed: true,
  timestamp: new Date().toISOString(),
  answers: {
    productDescription,
    techStack: finalTechStack,
    features: featuresPrioritized,
    testing: testingPreference,
    deployment: deploymentTarget,
    experience: experienceLevel
  }
};

Write('.agentful/setup-progress.json', JSON.stringify(setupProgress, null, 2));
```

### Step 5: Auto-Trigger Research & Generation

```javascript
console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Analyzing & Generating Agents
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Now that I understand your product, I'll:
1. Research best practices for ${finalTechStack.framework}
2. Research patterns for your domain
3. Generate specialized agents
4. Create workflow skills

This takes about 30-60 seconds...
`);

// Delegate to architect agent with FULL context
Task('architect', `
You have been invoked by /agentful-init after collecting user requirements.

Context:
- Product: ${productDescription}
- Tech Stack: ${JSON.stringify(finalTechStack)}
- Features: ${featureList.length} features defined
- Experience Level: ${experienceLevel}

Your tasks:
1. Research best practices for this tech stack using Context7 MCP or WebSearch
2. Research domain-specific patterns for the product type
3. Generate specialized agents tailored to this product
4. Create skills for the tech stack
5. Save architecture.json with findings

IMPORTANT: You have BOTH tech stack AND product requirements.
Generate agents specific to the user's actual product domains.
`);
```

### Step 6: Completion Message

```javascript
console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ✅ Setup Complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your agentful project is ready for autonomous development.

What was created:
  📄 .claude/product/index.md (${featureList.length} features)
  🤖 Specialized agents (generated for your domains)
  📚 Tech skills (${finalTechStack.framework}, etc.)
  ⚙️  Quality gates (tests, linting, security)

Next steps:

1. Review your product spec:
   cat .claude/product/index.md

2. Start development:
   /agentful-start

3. Monitor progress:
   /agentful-status

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Need help? Run /agentful (no arguments) for quick reference.
`);
```

## Product Spec Template

The generated `.claude/product/index.md` should follow this structure:

```markdown
# [Product Name]

[Product description from Q1]

## Tech Stack

- **Language**: [Language]
- **Framework**: [Framework + Version]
- **Database**: [Database + ORM]
- **Testing**: [Testing framework]
- **Deployment**: [Deployment target]

## Features

### [Feature 1] - CRITICAL
[Auto-generated description based on feature name]

**Acceptance Criteria**:
- [ ] [Generated criterion 1]
- [ ] [Generated criterion 2]

**Priority**: CRITICAL
**Status**: Not started

---

### [Feature 2] - HIGH
...

[Repeat for all features]
```

## Resume Support

If initialization is interrupted:

```javascript
if (exists('.agentful/setup-progress.json')) {
  const progress = JSON.parse(Read('.agentful/setup-progress.json'));

  if (!progress.completed) {
    const resume = AskUserQuestion({
      question: `
Found incomplete setup from ${progress.timestamp}.

Completed so far:
${formatCompletedSteps(progress)}

Would you like to:
`,
      options: [
        'Resume where I left off',
        'Start over from beginning'
      ]
    });

    if (resume === 'Resume where I left off') {
      return resumeSetup(progress);
    }
  }
}
```

## Error Handling

```javascript
try {
  // Run initialization
  runInit();
} catch (error) {
  console.error(`
❌ Setup failed: ${error.message}

Your progress has been saved to .agentful/setup-progress.json

To retry:
  /agentful-init (will resume where you left off)

To start fresh:
  rm .agentful/setup-progress.json
  /agentful-init

Need help? https://github.com/itz4blitz/agentful/issues
`);

  // Save error state
  const progress = exists('.agentful/setup-progress.json')
    ? JSON.parse(Read('.agentful/setup-progress.json'))
    : {};

  progress.error = {
    message: error.message,
    timestamp: new Date().toISOString()
  };

  Write('.agentful/setup-progress.json', JSON.stringify(progress, null, 2));
}
```

## Integration with Existing Commands

### Hook: PostToolUse on Product Spec

After `Write(.claude/product/index.md)`, auto-trigger analysis if from `/agentful-init`:

```javascript
// In bin/hooks/product-spec-watcher.js

const toolUse = JSON.parse(process.env.CLAUDE_TOOL_USE || '{}');
const filePath = toolUse.parameters?.file_path || '';

if (filePath.includes('.claude/product/index.md')) {
  // Check if this came from /agentful-init
  const setupProgress = exists('.agentful/setup-progress.json')
    ? JSON.parse(Read('.agentful/setup-progress.json'))
    : null;

  if (setupProgress && !setupProgress.agents_generated) {
    console.log(`
✅ Product specification created by /agentful-init

Auto-triggering agent generation...
`);

    // Trigger /agentful-generate
    // (Implementation depends on Claude Code hook system)
  }
}
```

## Helper Functions

```javascript
function detectTechStack() {
  // Read package.json, go.mod, requirements.txt, etc.
  // Return structured tech stack object
}

function formatTechStack(stack) {
  return `
- Language: ${stack.language}
- Framework: ${stack.framework} ${stack.version}
- Database: ${stack.database}
- ORM: ${stack.orm}
- Testing: ${stack.testing}
`.trim();
}

function autoAssignPriorities(features) {
  // First 30% = CRITICAL
  // Next 40% = HIGH
  // Rest = MEDIUM
}

function generateProductSpec(config) {
  // Generate markdown following template
}

function countByPriority(features) {
  // Count CRITICAL: X, HIGH: Y, etc.
}
```

## Success Metrics

Track in `.agentful/setup-progress.json`:

```json
{
  "completed": true,
  "timestamp": "2026-01-23T00:00:00Z",
  "duration_seconds": 247,
  "questions_answered": 7,
  "features_defined": 8,
  "agents_generated": 5,
  "metrics": {
    "time_to_first_feature": null,
    "setup_completion_rate": 100
  }
}
```
