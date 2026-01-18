# Smart Agent Generation System

Production-ready agent generation system for agentful that creates contextually-aware agents based on project analysis.

## Overview

The agent generation system analyzes a codebase and generates specialized agents that understand:

- **Project-specific patterns** - Real code samples from the project
- **Naming conventions** - How the project names files, functions, classes
- **Architecture patterns** - Repository, service, controller patterns
- **Tech stack specifics** - Framework, ORM, database patterns
- **Domain knowledge** - Auth, billing, content, etc.

## Architecture

```
lib/
├── agent-generator.js           # Main agent generation engine
├── domain-structure-generator.js # Domain product structure generator
└── template-engine.js           # Template variable interpolation

templates/agents/
├── domain-agent.template.md     # Domain-specific agent template
└── tech-agent.template.md       # Tech-specific agent template
```

## Features

### 1. Core Agents (Always Generated)

- **backend** - Repository, service, controller patterns
- **frontend** - Component, page, UI patterns
- **tester** - Testing patterns and conventions
- **reviewer** - Code review standards
- **fixer** - Bug fixing patterns

### 2. Domain Agents (Conditional)

Generated when domains are detected:

- **auth-agent** - Authentication and authorization
- **billing-agent** - Payments and subscriptions
- **content-agent** - CMS and content management
- **notification-agent** - Email, SMS, push notifications
- **user-agent** - User management
- **admin-agent** - Admin panel functionality

### 3. Tech-Specific Agents (Conditional)

Generated based on tech stack:

**Frameworks:**
- **nextjs-agent** - Next.js patterns
- **nuxt-agent** - Nuxt.js patterns
- **remix-agent** - Remix patterns

**ORMs:**
- **prisma-agent** - Prisma ORM patterns
- **drizzle-agent** - Drizzle ORM patterns
- **typeorm-agent** - TypeORM patterns
- **mongoose-agent** - Mongoose patterns

**Databases:**
- **postgresql-agent** - PostgreSQL patterns
- **mongodb-agent** - MongoDB patterns
- **mysql-agent** - MySQL patterns

## How It Works

### 1. Pattern Mining

The system samples 5-10 files per domain and extracts:

```javascript
// Sample pattern extraction
{
  patterns: [
    {
      keyword: 'repository',
      context: 'Found in src/repositories/user.repository.ts'
    }
  ],
  conventions: [
    'Uses @ alias for imports',
    'Class-based components',
    'Functional exports'
  ],
  samples: [
    {
      path: 'src/repositories/user.repository.ts',
      content: 'export class UserRepository { ... }'
    }
  ]
}
```

### 2. Template Interpolation

Templates use variable substitution:

```markdown
# {{domain}} Agent

Technology: {{tech}}
Language: {{language}}

## Code Samples:
{{samples}}

## Conventions:
{{conventions}}
```

### 3. Agent Generation

Final generated agent includes:

```markdown
# Auth Agent

You are the **auth** domain specialist.

## Project Conventions
- Uses @ alias for imports
- Class-based components
- Functional exports

## Code Samples from This Project
#### src/repositories/user.repository.ts
```typescript
export class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    return db.user.findUnique({ where: { email } });
  }
}
```
```

## Usage

### Basic Usage

```javascript
import AgentGenerator from './lib/agent-generator.js';
import ProjectAnalyzer from './lib/project-analyzer.js';

// Analyze project
const analyzer = new ProjectAnalyzer('/path/to/project');
const analysis = await analyzer.analyze();

// Generate agents
const generator = new AgentGenerator('/path/to/project', analysis);
const result = await generator.generateAgents();

console.log(`Generated ${result.core.length} core agents`);
console.log(`Generated ${result.domains.length} domain agents`);
console.log(`Generated ${result.tech.length} tech agents`);
```

### Domain Structure Generation

```javascript
import DomainStructureGenerator from './lib/domain-structure-generator.js';

const domainGen = new DomainStructureGenerator('/path/to/project', analysis);
await domainGen.generateDomainStructure();

// Generates:
// .claude/product/index.md
// .claude/product/domains/auth/index.md
// .claude/product/domains/auth/features/user-registration.md
// .claude/product/domains/auth/technical.md
```

## Generated Files

### Agents

```
.claude/agents/auto-generated/
├── backend.md
├── frontend.md
├── tester.md
├── reviewer.md
├── fixer.md
├── auth-agent.md
├── billing-agent.md
├── nextjs-agent.md
├── prisma-agent.md
└── postgresql-agent.md
```

### Domain Structure

```
.claude/product/
├── index.md                    # Product overview
├── completion.json             # Completion schema
└── domains/
    ├── auth/
    │   ├── index.md           # Domain overview
    │   ├── features/
    │   │   ├── user-registration.md
    │   │   └── user-login.md
    │   └── technical.md       # Technical spec
    └── billing/
        ├── index.md
        ├── features/
        │   └── subscription-management.md
        └── technical.md
```

## Template System

### Variables

- `{{domain}}` - Domain name
- `{{tech}}` - Technology name
- `{{techType}}` - Technology type (framework, orm, database)
- `{{language}}` - Detected language
- `{{framework}}` - Detected framework
- `{{confidence}}` - Detection confidence (0-1)
- `{{code_samples}}` - Real code examples
- `{{patterns}}` - Detected patterns
- `{{conventions}}` - Project conventions
- `{{samples}}` - Code samples
- `{{features}}` - Domain features
- `{{endpoints}}` - API endpoints
- `{{models}}` - Data models
- `{{generated_at}}` - ISO timestamp

### Template Example

```markdown
---
name: {{tech}}-agent
description: {{techType}} specialist
model: sonnet
tools: Read, Write, Edit, Glob, Grep, Bash
---

# {{tech}} Agent

## Project Conventions

{{conventions}}

## Code Samples

{{samples}}
```

## Examples

See the demo:

```bash
node examples/agent-generation-demo.js
```

Output:

```
🚀 Agent Generation System Demo

✨ Would generate:
  • Core agents: backend, frontend, tester, reviewer, fixer
  • Domain agents: auth-agent, billing-agent
  • Tech agents: nextjs-agent, prisma-agent, postgresql-agent

✅ Rendered Output:
# nextjs Agent

Technology: nextjs
Type: framework
Language: typescript

## Conventions:
- Uses App Router
- Components in app/ directory
- Server components by default

## Code Samples:
#### app/page.tsx
```
export default function Page() {
  return <div>Hello</div>
}
```
```

## Key Features

✓ **Context-aware** - Agents know the project's patterns
✓ **Real code samples** - Extracted from actual codebase
✓ **Project conventions** - Detects naming and architecture patterns
✓ **Domain-specific** - Specialized agents for each domain
✓ **Tech-specific** - Framework and ORM specific agents
✓ **Hierarchical structure** - Organized domain documentation
✓ **Works with any stack** - JavaScript, TypeScript, Python, Go, etc.
✓ **Handles empty projects** - Creates starter structure

## Integration with agentful Init

The agent generation system integrates seamlessly with `agentful init`:

```javascript
import ProjectAnalyzer from './lib/project-analyzer.js';
import AgentGenerator from './lib/agent-generator.js';
import DomainStructureGenerator from './lib/domain-structure-generator.js';

async function init(projectPath) {
  // 1. Analyze project
  const analyzer = new ProjectAnalyzer(projectPath);
  const analysis = await analyzer.analyze();

  // 2. Generate agents
  const agentGen = new AgentGenerator(projectPath, analysis);
  await agentGen.generateAgents();

  // 3. Generate domain structure
  const domainGen = new DomainStructureGenerator(projectPath, analysis);
  await domainGen.generateDomainStructure();

  console.log('✅ agentful initialized successfully');
}
```

## Testing

```bash
# Run demo
node examples/agent-generation-demo.js

# Run tests (when implemented)
npm test
```

## API Reference

### AgentGenerator

```javascript
const generator = new AgentGenerator(projectPath, analysis);

// Generate all agents
const result = await generator.generateAgents();
// Returns: { core: [], domains: [], tech: [] }

// Generate only core agents
const coreAgents = await generator.generateCoreAgents();

// Generate domain agents
const domainAgents = await generator.generateDomainAgents();

// Generate tech agents
const techAgents = await generator.generateTechAgents();
```

### DomainStructureGenerator

```javascript
const domainGen = new DomainStructureGenerator(projectPath, analysis);

// Generate complete structure
const result = await domainGen.generateDomainStructure();
// Returns: { domains: number, features: number }
```

### TemplateEngine

```javascript
import TemplateEngine from './lib/template-engine.js';

const template = 'Hello {{name}}!';
const data = { name: 'World' };

const rendered = TemplateEngine.render(template, data);
// Returns: 'Hello World!'
```

## Contributing

When adding new agent types:

1. Create template in `templates/agents/{type}-agent.template.md`
2. Add generation logic in `lib/agent-generator.js`
3. Add pattern extraction logic
4. Update documentation

## License

MIT
