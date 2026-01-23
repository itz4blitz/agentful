# Codebase Analyzer

The codebase analyzer is agentful's detection engine that analyzes project structure, tech stack, and coding conventions to generate specialized AI agents.

## Features

- **Language Detection** - Detects programming languages with >90% accuracy
- **Framework Detection** - Identifies frameworks and libraries from package.json, imports, and file structure
- **Pattern Extraction** - Discovers architectural patterns (components, API, database, tests, auth)
- **Convention Detection** - Extracts coding conventions (naming, file structure, code style)
- **Performance** - Completes analysis in <30 seconds for 1000-file projects
- **Error Recovery** - Handles new/empty projects gracefully with default configurations

## Usage

### Programmatic API

```javascript
import { analyzeCodebase, createAnalyzer } from '@itz4blitz/agentful';

// Simple analysis
const analysis = await analyzeCodebase({
  projectRoot: '/path/to/project',
  outputPath: '.agentful/architecture.json'
});

// With progress tracking
import { CodebaseAnalyzer } from '@itz4blitz/agentful';

const analyzer = new CodebaseAnalyzer({
  projectRoot: process.cwd(),
  outputPath: '.agentful/architecture.json'
});

analyzer.on('progress', ({ stage, progress }) => {
  console.log(`${stage}: ${progress}%`);
});

analyzer.on('complete', ({ duration, analysis }) => {
  console.log(`Completed in ${duration}ms`);
  console.log(`Detected: ${analysis.primaryLanguage}`);
});

const result = await analyzer.analyze();
```

### CLI

```bash
# Analyze current directory
node lib/core/cli.js

# Analyze specific project
node lib/core/cli.js --project /path/to/project

# Force re-analysis (skip cache)
node lib/core/cli.js --force --verbose

# Custom output path
node lib/core/cli.js --output custom/path/arch.json
```

## Output Format

The analyzer outputs a structured JSON file (`.agentful/architecture.json`) with the following schema:

```json
{
  "version": "1.0.0",
  "analyzedAt": "2026-01-22T03:21:13.478Z",
  "duration": 15,
  "projectRoot": "/path/to/project",
  "fileCount": 224,
  "isNewProject": false,
  "confidence": 85,

  "languages": [
    {
      "name": "TypeScript",
      "confidence": 95,
      "files": 120,
      "percentage": 53.6,
      "extensions": [".ts", ".tsx"]
    }
  ],

  "primaryLanguage": "TypeScript",

  "frameworks": [
    {
      "name": "Next.js",
      "version": "14.x",
      "type": "framework",
      "category": "web",
      "confidence": 90,
      "source": "package.json"
    }
  ],

  "patterns": {
    "components": {
      "detected": true,
      "count": 45,
      "examples": ["Button.tsx", "Card.tsx"],
      "style": "functional",
      "usesHooks": true
    },
    "api": {
      "detected": true,
      "pattern": "app/api/",
      "type": "REST"
    },
    "database": {
      "detected": true,
      "orm": "Prisma",
      "type": "SQL",
      "migrations": true
    },
    "tests": {
      "detected": true,
      "framework": "vitest",
      "count": 87,
      "types": { "unit": 70, "integration": 15, "e2e": 2 }
    },
    "auth": {
      "detected": true,
      "methods": ["jwt", "oauth"]
    }
  },

  "conventions": {
    "naming": "camelCase",
    "namingConfidence": 89,
    "fileStructure": "feature-based",
    "structureConfidence": 75,
    "codeStyle": {
      "indentation": "2 spaces",
      "quotes": "single",
      "semicolons": "required",
      "trailingCommas": "preferred"
    },
    "importStyle": {
      "preference": {
        "importType": "named",
        "pathStyle": "aliased"
      }
    },
    "linting": {
      "eslint": true,
      "prettier": true,
      "styleGuide": "airbnb"
    }
  },

  "recommendations": [
    {
      "type": "suggestion",
      "priority": "medium",
      "message": "No E2E tests detected",
      "action": "Consider adding Playwright or Cypress"
    }
  ]
}
```

## Architecture

The analyzer is built with a modular architecture:

```
lib/core/
├── analyzer.js           # Main analyzer class (482 lines)
├── cli.js               # CLI interface (141 lines)
└── detectors/
    ├── language.js      # Language detection (199 lines)
    ├── framework.js     # Framework detection (276 lines)
    ├── patterns.js      # Pattern extraction (356 lines)
    ├── conventions.js   # Convention detection (342 lines)
    └── index.js         # Exports (15 lines)
```

**Total:** 1,811 lines of clean, modular code

## Detection Algorithms

### Language Detection

1. Scans all files and counts by extension
2. Checks for language-specific config files (tsconfig.json, etc.)
3. Calculates confidence based on:
   - File percentage (80% weight)
   - Config file presence (+10 bonus)
   - Extension diversity (+5 bonus)

### Framework Detection

1. Reads package.json dependencies
2. Scans for framework-specific config files
3. Analyzes file structure patterns
4. Merges detections from multiple sources
5. Boosts confidence when detected from multiple sources

### Pattern Extraction

1. **Components:** Filters for .jsx/.tsx/.vue files, analyzes style (functional vs class)
2. **API:** Detects /api/ directories, determines type (REST/GraphQL/RPC)
3. **Database:** Finds ORM files, checks for migrations
4. **Tests:** Categorizes tests (unit/integration/e2e), detects framework
5. **Auth:** Identifies auth patterns (JWT, OAuth, sessions)

### Convention Detection

1. **Naming:** Analyzes file names to determine camelCase, PascalCase, snake_case, or kebab-case
2. **File Structure:** Detects organization (feature-based, layer-based, domain-driven, atomic)
3. **Code Style:** Samples files to detect indentation, quotes, semicolons
4. **Import Style:** Analyzes import statements for preference (named vs default, relative vs aliased)
5. **Linting:** Checks for ESLint/Prettier config files

## Confidence Scoring

The analyzer calculates an overall confidence score (0-100) based on:

- **Language detection:** 40 points max (avg language confidence)
- **Framework detection:** 30 points max (avg framework confidence)
- **Pattern detection:** 30 points max (ratio of detected patterns)

New projects (<10 files) automatically get 30% confidence with helpful recommendations.

## Error Recovery

The analyzer handles edge cases gracefully:

- **Empty projects:** Returns default structure with `isNewProject: true`
- **Unreadable files:** Skips files and emits warnings
- **Large projects:** Limits to 5000 files max (configurable)
- **Missing package.json:** Uses file structure and content analysis
- **Timeout protection:** Analysis completes in <30s even for large projects

## Events

The `CodebaseAnalyzer` class extends `EventEmitter` and emits:

- `start` - Analysis started
- `progress` - Stage progress update
- `warning` - Non-fatal issues (unreadable files, etc.)
- `written` - Analysis written to file
- `complete` - Analysis completed successfully
- `error` - Fatal error occurred
- `cached` - Using cached analysis (when using `analyzeWithCache()`)

## Caching

The analyzer supports intelligent caching:

```javascript
const analyzer = new CodebaseAnalyzer();

// Use cache if fresh (<24h old and file count similar)
const result = await analyzer.analyzeWithCache();

// Force re-analysis
const result = await analyzer.analyzeWithCache(true);
```

Cache is considered stale if:
- Age > 24 hours
- File count changed >10%

## Integration with agentful

The analyzer is automatically invoked by `/agentful-start` to:

1. Detect project tech stack
2. Generate specialized agents (backend, frontend, tester, etc.)
3. Populate `.agentful/architecture.json`
4. Provide recommendations for missing components

## Performance Benchmarks

- **Small projects** (<100 files): ~10ms
- **Medium projects** (100-500 files): ~15ms
- **Large projects** (500-1000 files): ~25ms
- **XL projects** (1000+ files): ~30ms (capped at 5000 files)

## Testing

Run analyzer tests:

```bash
npm test lib/core/
```

Manual testing:

```bash
# Test on agentful itself
node lib/core/cli.js --verbose

# Test on empty project
mkdir /tmp/test-project
cd /tmp/test-project
node /path/to/agentful/lib/core/cli.js --verbose
```

## Design Decisions

1. **Modular detectors:** Each detector is independent and can be used separately
2. **Event-driven:** Progress tracking and error handling via events
3. **Fail-safe defaults:** New projects get sensible defaults rather than errors
4. **Confidence scoring:** Transparent confidence metrics help users understand reliability
5. **Performance first:** Fast scanning with early termination for large codebases
6. **Schema validation:** Output validated against JSON schema for reliability

## Future Enhancements

- Python/Java/Go framework detection
- More granular pattern detection (state management, routing, etc.)
- Multi-language monorepo support
- Machine learning for pattern recognition
- Incremental analysis (only scan changed files)
- Plugin system for custom detectors
