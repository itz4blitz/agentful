# agentful: Technical Architecture

**Version:** 2.0
**Date:** January 2026
**Status:** Design Phase

---

## Executive Summary

agentful is transforming from a Claude Code development assistant into **the industry-standard open-source framework for AI agent orchestration** - the "Playwright of AI agents."

### Vision

Enable any development team to generate custom AI agents tailored to their exact codebase, then orchestrate those agents in long-running pipelines for code review, testing, deployment, and feature development.

### Core Value Proposition

1. **Custom Agent Generation**: Analyze codebases and generate agents that understand YOUR patterns, not generic best practices
2. **Pipeline Orchestration**: Run agents in async workflows (5-30 minutes) with dependencies, parallelization, and error recovery
3. **Multi-Platform**: Works with Claude Code, GitHub Actions, GitLab CI, Aider, OpenCode, Gemini CLI, and more
4. **100% Open Source**: MIT licensed, sponsored by companies that benefit (Anthropic, Google, GitHub)

---

## System Architecture

### High-Level Components

```
┌─────────────────────────────────────────────────────────────┐
│                    agentful Framework                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐         ┌───────────────────┐         │
│  │  Codebase        │────────>│  Agent Generator  │         │
│  │  Analyzer        │         │                   │         │
│  │                  │         │  Custom Agents    │         │
│  │  - Pattern Det.  │         │  Per Codebase     │         │
│  │  - Tech Stack    │         └───────────────────┘         │
│  │  - Conventions   │                  │                    │
│  └──────────────────┘                  │                    │
│           │                            ▼                    │
│           │                  ┌────────────────────┐         │
│           └─────────────────>│  Pipeline          │         │
│                              │  Orchestrator      │         │
│                              │                    │         │
│                              │  - Dependency DAG  │         │
│                              │  - Parallel Exec   │         │
│                              │  - State Persist   │         │
│                              └────────────────────┘         │
│                                       │                     │
│                                       ▼                     │
│                      ┌────────────────────────────┐         │
│                      │   Platform Adapters        │         │
│                      │                            │         │
│                      │  - GitHub Actions          │         │
│                      │  - GitLab CI               │         │
│                      │  - Claude Code             │         │
│                      │  - Aider / OpenCode        │         │
│                      └────────────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

---

## Component 1: Codebase Analyzer

**Purpose:** Understand project structure, patterns, and conventions to generate tailored agents.

### Architecture

**Location:** `lib/core/analyzer.ts`

**Key Responsibilities:**
- Scan codebase directory structure
- Detect tech stack (languages, frameworks, tools)
- Extract coding patterns (imports, components, API styles)
- Learn conventions (naming, file organization, error handling)
- Calculate confidence scores (0.0-1.0) for each detection

### Pattern Detection Strategies

```typescript
interface PatternDetector {
  name: string;
  detect(files: CodeFile[]): Pattern[];
  confidence(pattern: Pattern): number;
}

// Example detectors:
- ImportPatternDetector    // How modules are imported
- ComponentPatternDetector // Functional vs class components
- APIPatternDetector       // REST vs GraphQL vs RPC
- DatabasePatternDetector  // ORM vs raw SQL
- TestPatternDetector      // Testing conventions
- AuthPatternDetector      // Authentication patterns
```

### Tech Stack Detection

```typescript
interface TechStackDetector {
  detectLanguages(): Language[];     // TypeScript, Python, Go, etc.
  detectFrameworks(): Framework[];   // Next.js, Django, etc.
  detectTools(): Tool[];             // Prisma, Jest, etc.
}

// Detection methods:
1. package.json / requirements.txt / go.mod analysis
2. Import statement analysis
3. File extension patterns
4. Configuration file presence
5. Directory structure patterns
```

### Convention Extraction

```typescript
interface ConventionExtractor {
  extractNaming(): NamingConventions;
  extractFileStructure(): FileStructure;
  extractCodeStyle(): CodeStyle;
}

// Examples:
- Naming: camelCase vs snake_case, prefixes, suffixes
- File Structure: co-location vs separation of concerns
- Code Style: async/await vs promises, error handling patterns
```

### Output Format

```json
{
  "version": "1.0",
  "analyzedAt": "2026-01-21T00:00:00Z",
  "techStack": {
    "languages": ["TypeScript"],
    "frameworks": ["Next.js", "React"],
    "tools": ["Prisma", "Vitest", "Tailwind"]
  },
  "patterns": [
    {
      "type": "component",
      "style": "functional",
      "confidence": 0.95,
      "examples": ["src/components/Button.tsx", "..."]
    },
    {
      "type": "api",
      "style": "REST",
      "confidence": 0.88,
      "examples": ["api/users/route.ts", "..."]
    }
  ],
  "conventions": {
    "naming": "camelCase",
    "fileStructure": "co-located",
    "errorHandling": "try-catch-async"
  }
}
```

**Stored:** `.agentful/architecture.json`

---

## Component 2: Agent Generator

**Purpose:** Transform codebase analysis into custom AI agents that understand the specific project.

### Architecture

**Location:** `lib/core/generator.ts`

### Agent Template System

```
templates/
├── base/
│   ├── agent.md.hbs          # Base agent template
│   └── README.md             # Template documentation
├── frameworks/
│   ├── nextjs.md.hbs         # Next.js specialist
│   ├── django.md.hbs         # Django specialist
│   └── express.md.hbs        # Express specialist
└── patterns/
    ├── rest-api.md.hbs       # REST API patterns
    ├── graphql.md.hbs        # GraphQL patterns
    └── orm.md.hbs            # ORM usage patterns
```

### Template Compilation

```typescript
interface AgentGenerator {
  async generate(analysis: CodebaseAnalysis): Promise<Agent[]> {
    // 1. Select templates based on tech stack
    const templates = selectTemplates(analysis.techStack);

    // 2. Build context from analysis
    const context = buildContext(analysis);

    // 3. Compile templates with context
    const agents = await Promise.all(
      templates.map(t => compileTemplate(t, context))
    );

    // 4. Validate generated agents
    await validateAgents(agents);

    return agents;
  }
}
```

### Template Variables

```handlebars
---
name: {{agentName}}
description: {{description}}
model: sonnet
tools: Read, Write, Edit, Glob, Grep, Bash
---

# {{agentName}} Agent

## Your Scope

{{#each responsibilities}}
- {{this}}
{{/each}}

## Tech Stack

{{#each techStack}}
- **{{name}}**: {{version}}
{{/each}}

## Patterns in This Codebase

{{#each patterns}}
### {{type}}

{{#if examples}}
Example from your code:
\`\`\`{{language}}
{{examples.[0]}}
\`\`\`
{{/if}}

{{description}}
{{/each}}

## Conventions

{{#each conventions}}
- **{{name}}**: {{rule}}
{{/each}}
```

### Generated Agent Example

```markdown
---
name: nextjs-api-specialist
description: API route specialist for this Next.js codebase
model: sonnet
tools: Read, Write, Edit, Glob, Grep, Bash
---

# Next.js API Specialist

## Your Scope

- Implement API routes in app/api/
- Follow this project's error handling pattern: try-catch with standardized error responses
- Use Prisma for database queries (detected in 15 files)
- Validate inputs with Zod schemas (convention in api/users/route.ts)

## Patterns in This Codebase

### API Error Handling

Example from your code:
\`\`\`typescript
// From api/auth/login/route.ts (lines 12-18)
try {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  // ...
} catch (error) {
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
\`\`\`

### Database Queries

This project uses Prisma with async/await pattern. Always use try-catch.

## Conventions

- **Naming**: camelCase for variables, PascalCase for types
- **File Structure**: One route per file in app/api/
- **Error Responses**: Always include `{ error: string }` shape
```

### Storage

```
.agentful/
├── agents/
│   ├── generated/              # Auto-generated (regenerated on changes)
│   │   ├── nextjs-api-specialist.md
│   │   ├── react-component-specialist.md
│   │   └── prisma-data-specialist.md
│   └── custom/                 # User-modified (preserved on regeneration)
│       └── my-custom-agent.md
├── templates/                  # Local template overrides
└── versions/                   # Version history
```

---

## Component 3: Pipeline Orchestrator

**Purpose:** Execute agents in long-running async workflows with dependencies, parallelization, and error recovery.

### Architecture

**Location:** `lib/pipeline/engine.js`

### Pipeline Definition Format

```yaml
# .agentful/pipelines/code-review.yml
name: Code Review Pipeline
description: Comprehensive code review with security, testing, and quality checks

triggers:
  - pull_request
  - workflow_dispatch

env:
  MAX_PARALLEL: 3
  TIMEOUT: 1800  # 30 minutes

jobs:
  security-scan:
    agent: security-specialist
    timeout: 600  # 10 minutes
    retry:
      max_attempts: 2
      backoff: exponential

  type-check:
    agent: typescript-specialist
    timeout: 300
    parallel: true

  lint-check:
    agent: style-specialist
    timeout: 300
    parallel: true

  test-coverage:
    agent: test-specialist
    dependsOn: [type-check]
    timeout: 900

  review:
    agent: review-specialist
    dependsOn: [security-scan, lint-check, test-coverage]
    timeout: 1200

  comment:
    agent: pr-commenter
    dependsOn: [review]
    timeout: 60
    when: github.event_name == 'pull_request'
```

### Execution Flow

```
1. Parse pipeline YAML
2. Build dependency graph (DAG)
3. Validate (no cycles, all dependencies exist)
4. Schedule jobs:
   - Queue: pending jobs
   - Running: currently executing (max: 3)
   - Completed: finished successfully
   - Failed: errored out
5. Execute with strategies:
   - Parallel: Independent jobs run concurrently
   - Sequential: Dependent jobs wait
   - Conditional: Skip based on when clause
6. Persist state after each job
7. Aggregate results
8. Report to user
```

### State Management

```json
// .agentful/runs/<run-id>/state.json
{
  "runId": "feature-dev-1234567890-abc",
  "pipeline": "code-review",
  "status": "running",
  "startedAt": "2026-01-21T10:00:00Z",
  "jobs": {
    "security-scan": {
      "status": "completed",
      "startedAt": "2026-01-21T10:00:00Z",
      "completedAt": "2026-01-21T10:05:00Z",
      "result": { "issues": 2, "severity": "medium" }
    },
    "type-check": {
      "status": "running",
      "startedAt": "2026-01-21T10:00:30Z"
    },
    "lint-check": {
      "status": "queued"
    }
  }
}
```

### Error Recovery

```typescript
// Resume interrupted pipeline
const pipeline = await PipelineEngine.resume('feature-dev-1234567890-abc');

// State preserved:
// - Completed jobs: NOT re-executed (saves LLM API costs)
// - Failed jobs: Retried based on retry policy
// - Queued jobs: Executed when dependencies met
// - Running jobs: Re-queued (assume crashed)
```

### Integration with GitHub Actions

```yaml
# .github/workflows/agentful.yml (auto-generated)
name: agentful Pipeline

on:
  pull_request:
  workflow_dispatch:

jobs:
  run-pipeline:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4

      - name: Setup agentful
        uses: agentful/setup@v1
        with:
          api-key: ${{ secrets.ANTHROPIC_API_KEY }}

      - name: Run Code Review Pipeline
        run: |
          npx agentful pipeline run \
            --pipeline .agentful/pipelines/code-review.yml \
            --context github-pr

      - name: Comment Results
        if: github.event_name == 'pull_request'
        uses: agentful/comment@v1
        with:
          run-id: ${{ steps.run.outputs.run-id }}
```

---

## Component 4: Platform Adapters

**Purpose:** Enable agentful to work across multiple platforms (GitHub Actions, GitLab CI, Claude Code, Aider, etc.)

### Architecture

**Location:** `lib/platforms/`

### Adapter Interface

```typescript
interface PlatformAdapter {
  name: string;

  // Generate platform-specific config
  generateConfig(pipeline: Pipeline): PlatformConfig;

  // Execute agents on this platform
  executeAgent(agent: Agent, context: Context): Promise<Result>;

  // Handle platform-specific events
  handleEvent(event: PlatformEvent): void;
}
```

### GitHub Actions Adapter

**File:** `lib/platforms/github-actions.ts`

```typescript
class GitHubActionsAdapter implements PlatformAdapter {
  generateConfig(pipeline: Pipeline): string {
    // Convert agentful pipeline → .github/workflows/*.yml
    return renderWorkflow(pipeline);
  }

  executeAgent(agent: Agent, context: Context): Promise<Result> {
    // Use @agentful/github-action composite action
    return githubAction.run(agent, context);
  }
}
```

### Claude Code Adapter

**File:** `lib/platforms/claude-code.ts`

```typescript
class ClaudeCodeAdapter implements PlatformAdapter {
  executeAgent(agent: Agent, context: Context): Promise<Result> {
    // Use Task() tool for sub-agent delegation
    return Task(agent.name, context.prompt);
  }
}
```

### Aider Adapter

**File:** `lib/platforms/aider.ts`

```typescript
class AiderAdapter implements PlatformAdapter {
  executeAgent(agent: Agent, context: Context): Promise<Result> {
    // Execute via aider CLI with agent context
    const result = await exec(`aider --message "${context.prompt}"`);
    return parseAiderOutput(result);
  }
}
```

---

## Data Flow

### End-to-End Example: Feature Development

```
1. User: "Build authentication system"

2. agentful analyze
   - Scans codebase
   - Detects: Next.js + Prisma + Tailwind
   - Identifies patterns: REST APIs, server actions, form validation
   - Output: .agentful/architecture.json

3. agentful generate
   - Reads architecture.json
   - Selects templates: nextjs, prisma, react, api
   - Generates custom agents:
     * nextjs-api-specialist
     * prisma-data-specialist
     * react-component-specialist
     * auth-security-specialist
   - Output: .agentful/agents/generated/*.md

4. User creates pipeline: .agentful/pipelines/auth-feature.yml
   jobs:
     - design (architect agent)
     - backend (nextjs-api-specialist + prisma-data-specialist)
     - frontend (react-component-specialist)
     - security (auth-security-specialist)
     - test (test-specialist)
     - review (review-specialist)

5. agentful pipeline run --pipeline auth-feature.yml
   - Parses YAML
   - Builds dependency graph
   - Executes jobs (some parallel):
     [design] → [backend + frontend] → [security + test] → [review]
   - Each job:
     * Loads agent from .agentful/agents/generated/
     * Executes agent with context
     * Saves result to .agentful/runs/<run-id>/
   - Total time: 20-30 minutes
   - Output: Complete auth system with tests + review

6. Results
   - Code committed to feature branch
   - PR created with agentful review comment
   - All quality gates passed
```

---

## Technology Stack

### Core Framework
- **Language**: Node.js 22+ (JavaScript/TypeScript support)
- **CLI**: Commander.js
- **Config Parsing**: js-yaml
- **Templating**: Handlebars
- **Validation**: Zod schemas
- **State Storage**: JSON files (atomic writes)

### Agent Execution
- **Primary**: Subprocess (`claude` CLI)
- **Future**: HTTP API calls (Claude API, Gemini API, etc.)
- **Context**: Temp JSON files for input/output

### Platform Integration
- **GitHub**: Composite Actions + CLI
- **GitLab**: CLI via CI config
- **Local**: Direct CLI execution

### Distribution
- **NPM Package**: `@itz4blitz/agentful`
- **GitHub Action**: `agentful/run@v1`
- **GitLab Template**: `.agentful-ci.yml`

---

## Deployment Architecture

### Local Development

```
Developer Machine
├── Project Code
├── .agentful/
│   ├── agents/generated/    # Custom agents
│   ├── pipelines/           # Pipeline definitions
│   └── runs/                # Execution history
└── node_modules/@itz4blitz/agentful/
    ├── lib/core/            # Analyzer, Generator
    ├── lib/pipeline/        # Orchestrator
    └── lib/platforms/       # Adapters
```

### CI/CD (GitHub Actions)

```
GitHub Actions Runner
├── Checkout code
├── Install agentful (npx @itz4blitz/agentful)
├── Run pipeline (npx agentful pipeline run)
├── Post results to PR
└── Store artifacts
```

### Future: Hosted Service (Optional)

```
agentful.dev (Optional Managed Service)
├── Web UI for pipeline visualization
├── Hosted orchestration (saves CI minutes)
├── Advanced analytics
├── Shared agent registry
└── Enterprise features (SSO, audit logs)
```

---

## Security & Privacy

### API Key Management
- Support multiple providers (Anthropic, Google, OpenAI)
- Environment variables (ANTHROPIC_API_KEY, etc.)
- GitHub Secrets integration
- Never log or persist API keys

### Code Privacy
- All processing local or in user's CI/CD
- No code sent to agentful servers (unless user opts into hosted service)
- Telemetry opt-in only (anonymized usage stats)

### Agent Isolation
- Agents run in subprocesses (can't access parent process)
- Temp file cleanup after execution
- No shared state between agents (except explicit context)

---

## Scalability & Performance

### Codebase Analysis
- **Strategy**: Sample-based (analyze subset of files, not all)
- **Caching**: Cache analysis results, invalidate on file changes
- **Incremental**: Only re-analyze changed files
- **Target**: <30 seconds for 1000-file project

### Agent Generation
- **Strategy**: Template compilation (fast)
- **Caching**: Only regenerate if analysis changes
- **Target**: <5 seconds to generate 5-10 agents

### Pipeline Execution
- **Concurrency**: 3-5 parallel jobs (configurable)
- **State Persistence**: After each job (enables resume)
- **Target**: 5-30 minutes for typical workflows

### Cost Optimization
- **Avoid Re-execution**: State persistence means completed jobs never re-run
- **Parallel Execution**: Finish faster (same cost, less wall time)
- **Conditional Jobs**: Skip unnecessary work

---

## Testing Strategy

### Unit Tests
- Analyzer: Pattern detection accuracy (90%+ precision)
- Generator: Template compilation correctness
- Orchestrator: Dependency resolution, state management
- Adapters: Platform config generation

### Integration Tests
- End-to-end pipeline execution
- Multi-platform compatibility
- State persistence and recovery
- Error handling and retries

### Performance Tests
- Analysis time vs codebase size
- Pipeline execution time vs job count
- Memory usage during parallel execution

### Compatibility Tests
- Node.js versions (22+)
- Operating systems (macOS, Linux, Windows)
- CI/CD platforms (GitHub, GitLab, Jenkins)

---

## Monitoring & Telemetry

### Metrics (Opt-In)

```typescript
interface TelemetryEvent {
  event: 'pipeline_run' | 'agent_generated' | 'platform_used';
  timestamp: string;
  metadata: {
    duration?: number;
    techStack?: string[];
    platform?: string;
    modelUsed?: string;  // claude, gemini, gpt4
    success?: boolean;
  };
}
```

### Privacy-Respecting
- Anonymous user IDs (no PII)
- No code content sent
- Aggregate stats only
- Easy opt-out

### Purpose
- Understand adoption (which platforms, tech stacks)
- Prove sponsor ROI (API calls generated)
- Improve product (which features used)

---

## Versioning & Compatibility

### Semantic Versioning
- **Major**: Breaking changes to CLI, config format
- **Minor**: New features, backwards-compatible
- **Patch**: Bug fixes

### Config Format Versioning
```yaml
# .agentful/pipelines/example.yml
version: "1.0"  # Explicit version
```

### Upgrade Path
```bash
# agentful detects outdated configs
npx agentful migrate

# Migrates:
# - Pipeline YAML (v1.0 → v2.0)
# - Architecture JSON (old format → new format)
# - Preserves custom agents
```

---

## Success Metrics

### Phase 1: Adoption (Months 1-6)
- **Stars**: 2,000+ GitHub stars
- **Projects**: 500+ weekly active projects
- **Platforms**: Working on 3+ platforms (Claude Code, GitHub, Aider)

### Phase 2: Engagement (Months 7-12)
- **API Calls**: $50k+/month in LLM API usage driven by agentful
- **Retention**: 50%+ monthly active users return
- **Case Studies**: 5+ published case studies

### Phase 3: Revenue (Months 13-18)
- **Sponsorship**: $20-30k/month from corporate sponsors
- **Attribution**: Prove 2-5x ROI for sponsors
- **Community**: 1,000+ Discord members, 100+ contributors

---

## Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **LLM API costs too high** | Medium | High | Aggressive caching, state persistence, cost limits |
| **Competitors clone agentful** | High | Medium | Strong community, first-mover advantage, ongoing innovation |
| **Sponsors don't see ROI** | Medium | Critical | Revenue attribution, transparent reporting, case studies |
| **Adoption too slow** | Medium | High | Focus on GitHub Actions (largest distribution), OOTB presets |
| **Tech stack detection fails** | Low | Medium | Manual overrides, confidence scores, graceful degradation |

---

## Roadmap

### Phase 1: Core Framework (Weeks 1-8)
- ✅ Codebase analyzer
- ✅ Agent generator
- ✅ Pipeline orchestrator
- ✅ GitHub Actions adapter
- ✅ CLI tool
- ✅ Documentation

### Phase 2: Multi-Platform (Weeks 9-16)
- Aider adapter
- OpenCode adapter
- GitLab CI adapter
- Gemini CLI adapter
- Codex adapter

### Phase 3: Growth (Weeks 17-24)
- OOTB presets (Next.js, Django, etc.)
- Agent marketplace
- Advanced orchestration (complex DAGs)
- Performance optimizations
- Enterprise features

### Phase 4: Sustainability (Months 7-12)
- Secure sponsorships ($30k+/month)
- Build community (Discord, docs, tutorials)
- Annual conference
- Certification program

---

## Open Questions

1. **Agent Execution**: Should we support HTTP API execution (not just subprocess)?
2. **Hosted Service**: Offer optional managed service, or pure OSS forever?
3. **Agent Marketplace**: Allow users to share/sell custom agents?
4. **Multi-Language**: Support non-JavaScript projects (Python, Go, Rust)?
5. **Real-Time Collaboration**: Live progress updates in web UI?

---

## References

- [GITHUB_ACTIONS_RESEARCH.md](./GITHUB_ACTIONS_RESEARCH.md) - GitHub Actions patterns
- [PIPELINE_ARCHITECTURE.md](./PIPELINE_ARCHITECTURE.md) - Pipeline orchestration details
- [SPONSORSHIP_PLAYBOOK.md](./SPONSORSHIP_PLAYBOOK.md) - Revenue strategy
- [agentful.app/docs](https://agentful.app/docs) - Public documentation

---

**Last Updated:** January 21, 2026
**Next Review:** February 2026
**Owner:** agentful core team
