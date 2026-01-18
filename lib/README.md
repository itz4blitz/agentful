# agentful Analysis Engine

A comprehensive, language-agnostic project analysis system for autonomous development. Smart detection of tech stacks, business domains, and code patterns with confidence scoring.

## Features

- **Multi-Language Support**: JavaScript, TypeScript, Python, Go, Rust, Java, C#, Ruby, PHP, Elixir, Dart, Swift, Kotlin, Scala, Clojure, and more
- **Framework Detection**: Next.js, React, Vue, Django, Flask, FastAPI, Express, NestJS, Spring Boot, ASP.NET, Rails, Laravel, Phoenix, and 30+ more
- **Domain Detection**: Identifies business domains like authentication, billing, content management, e-commerce, messaging, analytics, etc.
- **Pattern Mining**: Detects code conventions, import styles, API patterns, state management approaches, and testing frameworks
- **Confidence Scoring**: All detections include confidence scores for reliable decision-making
- **Smart Caching**: 24-hour cache for performance optimization
- **Graceful Fallbacks**: Handles edge cases like empty projects, monorepos, and unsupported languages

## Installation

```bash
npm install @itz4blitz/agentful
```

## Quick Start

### Command Line

```bash
# Initialize agentful in your project (includes smart analysis)
npx @itz4blitz/agentful init

# Generate analysis report
npx agentful generate

# Check status (includes analysis summary)
npx agentful status
```

### Programmatic Usage

```javascript
import { analyzeProject } from '@itz4blitz/agentful/lib';

// Perform comprehensive analysis
const analysis = await analyzeProject('/path/to/project');

console.log('Language:', analysis.language);
console.log('Frameworks:', analysis.frameworks);
console.log('Domains:', analysis.domains);
console.log('Confidence:', analysis.confidence);
```

## Module API

### `analyzeProject(projectRoot)`

Main entry point for project analysis. Performs multi-phase analysis:

1. **Quick Scan**: Determines project type, structure, and basic organization
2. **Deep Analysis**: Analyzes dependencies, frameworks, build systems
3. **Pattern Mining**: Samples code files to detect conventions and patterns
4. **Domain Detection**: Identifies business domains from structure, APIs, and schemas

**Returns:**

```javascript
{
  projectRoot: '/path/to/project',
  analyzedAt: '2026-01-18T00:00:00.000Z',
  analysisDuration: 1234,
  projectType: 'web-application',
  language: 'TypeScript',
  primaryLanguage: 'TypeScript',
  frameworks: ['Next.js', 'React'],
  structure: 'src-based',
  buildSystem: 'tsc',
  packageManager: 'npm',
  domains: ['authentication', 'user-management', 'content-management'],
  domainConfidence: {
    'authentication': 0.95,
    'user-management': 0.87,
    'content-management': 0.72
  },
  patterns: {
    imports: ['import ... from', 'require(...)'],
    exports: ['export const', 'export default'],
    styling: ['tailwind', 'css-modules'],
    stateManagement: ['react-hooks', 'zustand'],
    apiPatterns: ['route-handlers', 'fetch'],
    testingFrameworks: ['jest', 'vitest']
  },
  conventions: {
    naming: { files: 'kebab-case' },
    fileOrganization: 'src-based',
    importStyle: ['es6'],
    codeStyle: ['async-await', 'arrow-functions', 'functional']
  },
  samples: {
    controllers: [...],
    models: [...],
    utilities: [...],
    components: [...],
    configs: [...],
    tests: [...]
  },
  confidence: 0.85,
  warnings: [],
  recommendations: []
}
```

### `detectTechStack(projectRoot)`

Detects the technology stack used in the project.

**Returns:**

```javascript
{
  language: 'TypeScript',
  primaryLanguage: 'TypeScript',
  languages: ['TypeScript', 'JavaScript'],
  frameworks: ['Next.js', 'React'],
  databases: ['PostgreSQL', 'Redis'],
  testingFrameworks: ['Jest', 'Vitest'],
  styling: ['Tailwind CSS', 'CSS Modules'],
  buildSystem: 'tsc',
  packageManager: 'npm',
  dependencies: ['next', 'react', 'typescript', ...],
  devDependencies: ['jest', '@types/node', ...],
  confidence: 0.9
}
```

### `detectDomains(projectRoot, quickScan)`

Identifies business domains from project structure, APIs, and code patterns.

**Returns:**

```javascript
{
  detected: ['authentication', 'user-management', 'billing'],
  confidence: {
    'authentication': 0.95,
    'user-management': 0.87,
    'billing': 0.65
  },
  signals: {
    structure: { 'authentication': 0.8, 'user-management': 0.7 },
    api: { 'authentication': 0.9, 'billing': 0.6 },
    schema: { 'user-management': 0.8 },
    modules: { 'authentication': 0.5 }
  },
  totalConfidence: 0.82
}
```

## Supported Technologies

### Languages

- JavaScript/TypeScript (ESM, CommonJS)
- Python (2, 3)
- Go
- Rust
- Java (8+)
- C# (.NET, .NET Core)
- Ruby
- PHP
- Elixir/Erlang
- Dart
- Swift
- Kotlin
- Scala
- Clojure
- C/C++
- And more...

### Frameworks

#### JavaScript/TypeScript
- Next.js, Nuxt, Remix
- React, Vue, Angular, Svelte, Astro
- Express, NestJS, Koa, Fastify, Hapi

#### Python
- Django, Flask, FastAPI, Tornado, Falcon, Pyramid

#### Go
- Gin, Echo, Fiber, standard library

#### Rust
- Actix Web, Rocket, Warp

#### Java
- Spring Boot, Micronaut, Quarkus, Vert.x, Jakarta EE

#### .NET
- ASP.NET Core, Entity Framework

#### Ruby
- Rails, Sinatra, Grape

#### PHP
- Laravel, Symfony, Slim

#### Elixir
- Phoenix

#### Dart
- Flutter, Angel

#### Swift
- Vapor

### Databases

- PostgreSQL, MySQL, SQLite
- MongoDB, Redis
- DynamoDB, Cassandra, Couchbase

### Testing Frameworks

- Jest, Vitest, Mocha, Jasmine
- PyTest, unittest
- Go testing
- JUnit, TestNG
- RSpec
- PHPUnit

### Styling

- Tailwind CSS
- CSS Modules
- Styled Components
- Emotion
- Sass/SCSS
- Less
- And more...

## Architecture

The analysis engine uses a multi-phase approach:

### Phase 1: Quick Scan
- Detects project type (web, mobile, desktop, service)
- Identifies directory structure (flat, src-based, feature-based)
- Checks for monorepo indicators
- Determines source organization

### Phase 2: Deep Analysis
- Analyzes dependency files (package.json, requirements.txt, go.mod, etc.)
- Detects frameworks and libraries
- Identifies build systems and package managers
- Determines testing frameworks

### Phase 3: Pattern Mining
- Samples representative files from the codebase
- Detects import/export patterns
- Identifies styling approaches
- Analyzes state management
- Detects API patterns (REST, GraphQL, etc.)

### Phase 4: Domain Detection
- Analyzes directory structure for domain indicators (40% weight)
- Examines API routes for domain patterns (30% weight)
- Reviews database schema for domain entities (20% weight)
- Checks module boundaries for domain separation (10% weight)

## Confidence Scoring

All detections include confidence scores from 0.0 to 1.0:

- **0.9-1.0**: Very high confidence - almost certainly correct
- **0.7-0.9**: High confidence - likely correct
- **0.5-0.7**: Medium confidence - reasonably confident
- **0.3-0.5**: Low confidence - possible match
- **0.0-0.3**: Very low confidence - uncertain

Domains below 0.3 confidence are filtered out by default.

## Caching

Analysis results are cached for 24 hours in `.agentful/analysis-cache.json`. Cache is automatically invalidated when:

- Cache expires (24 hours)
- Cache version changes
- Explicitly cleared by deleting the cache file

## Error Handling

The analysis engine handles errors gracefully:

- Empty projects return minimal analysis with warnings
- Unsupported languages return partial analysis
- File system errors are caught and logged
- All functions return valid objects even on failure

## Performance

- Typical analysis time: <5 seconds for medium projects
- Memory usage: <100MB for most projects
- Supports projects with 10,000+ files
- Efficient file sampling (doesn't read entire codebase)

## Testing

Run the test suite:

```bash
node lib/test-analyzer.js
```

## Integration with Architect Agent

The analysis engine powers the Architect agent, which uses the detected patterns to generate project-specific specialized agents. See `.claude/agents/architect.md` for details.

## License

MIT
