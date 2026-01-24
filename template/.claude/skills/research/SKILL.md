---
name: research
description: Research best practices for tech stacks and product domains using Context7 or WebSearch
---

# Research Skill

Enables agents to research current best practices, design patterns, and implementation approaches for technologies and product domains.

## When to Use

- **Tech Stack Analysis**: Learning current best practices for detected frameworks/languages
- **Domain Patterns**: Understanding implementation approaches for specific business domains
- **Agent Generation**: Informing specialized agent creation with research findings
- **Architecture Decisions**: Comparing approaches before implementation
- **Trend Analysis**: Understanding what's current vs deprecated

## Available Research Methods

### 1. Context7 MCP (Preferred)

Context7 provides curated, high-quality technical documentation and best practices.

**Advantages**:
- ✅ Curated, accurate results
- ✅ Up-to-date framework documentation
- ✅ Language-specific patterns
- ✅ Faster than web search
- ✅ No noise or outdated content

**Check Availability**:
```javascript
function hasContext7() {
  // Check if Context7 MCP is connected
  // Claude Code automatically exposes MCP tools
  return typeof mcp__context7__search !== 'undefined';
}
```

**Usage**:
```javascript
// Example: Research Next.js 15 patterns
const results = await mcp__context7__search({
  query: 'Next.js 15 app router best practices',
  limit: 5
});

// Results include:
// - Official documentation
// - Verified patterns
// - Current recommendations
```

### 2. WebSearch (Fallback)

When Context7 is unavailable, use WebSearch for broader coverage.

**Advantages**:
- ✅ Always available
- ✅ Broader coverage (blogs, forums, etc.)
- ✅ Real-world examples
- ✅ Community insights

**Limitations**:
- ⚠️ May include outdated content
- ⚠️ Requires filtering and verification
- ⚠️ More noise

**Usage**:
```javascript
const results = await WebSearch({
  query: 'Next.js 15 app router best practices 2026',
  limit: 5
});

// Always include current year in query for freshness
```

## Research Workflow

### Step 1: Determine Research Method

```javascript
const researchMethod = hasContext7() ? 'context7' : 'websearch';

console.log(`Research method: ${researchMethod}`);
```

### Step 2: Formulate Queries

Create specific, targeted queries:

**Good queries**:
- "Next.js 15 server components best practices"
- "React 19 concurrent rendering patterns"
- "PostgreSQL connection pooling with Prisma"
- "Authentication implementation patterns 2026"

**Bad queries**:
- "Next.js" (too broad)
- "How to code" (too generic)
- "Best JavaScript framework" (subjective, not actionable)

**Query Template**:
```
[Technology/Framework] + [Specific Topic] + [Year]
```

### Step 3: Execute Research

```javascript
async function researchTopic(topic, context = {}) {
  const queries = generateQueries(topic, context);
  const findings = [];

  for (const query of queries) {
    let result;

    if (hasContext7()) {
      result = await mcp__context7__search({
        query,
        limit: 3
      });
    } else {
      result = await WebSearch({
        query: `${query} ${new Date().getFullYear()}`,
        limit: 3
      });
    }

    findings.push({
      query,
      results: result,
      source: hasContext7() ? 'context7' : 'websearch'
    });
  }

  return findings;
}
```

### Step 4: Synthesize Findings

Extract actionable insights from research results:

```javascript
function synthesizeResearch(findings, context) {
  // Aggregate findings by category
  const synthesis = {
    techStackPatterns: {},
    domainPatterns: {},
    bestPractices: [],
    commonPitfalls: [],
    references: []
  };

  for (const finding of findings) {
    // Extract tech stack patterns
    if (finding.query.includes(context.techStack.framework)) {
      synthesis.techStackPatterns[context.techStack.framework] = extractPatterns(finding.results);
    }

    // Extract domain-specific patterns
    for (const domain of context.domains || []) {
      if (finding.query.includes(domain)) {
        synthesis.domainPatterns[domain] = extractPatterns(finding.results);
      }
    }

    // Collect best practices
    synthesis.bestPractices.push(...extractBestPractices(finding.results));

    // Collect common pitfalls
    synthesis.commonPitfalls.push(...extractPitfalls(finding.results));

    // Store references
    synthesis.references.push({
      query: finding.query,
      source: finding.source,
      url: extractURL(finding.results)
    });
  }

  // Deduplicate and rank
  synthesis.bestPractices = deduplicateAndRank(synthesis.bestPractices);
  synthesis.commonPitfalls = deduplicateAndRank(synthesis.commonPitfalls);

  return synthesis;
}
```

## Research Use Cases

### Use Case 1: Tech Stack Research

Research current best practices for detected technologies:

```javascript
// Called by /agentful-generate after tech stack detection
const techStack = {
  framework: 'Next.js',
  version: '15.1.0',
  language: 'TypeScript',
  database: 'PostgreSQL',
  orm: 'Prisma'
};

const queries = [
  `${techStack.framework} ${techStack.version} best practices`,
  `${techStack.framework} project structure patterns`,
  `${techStack.orm} with ${techStack.database} optimization`,
  `TypeScript configuration for ${techStack.framework}`
];

const findings = await researchTopic('tech-stack', { techStack, queries });
const synthesis = synthesizeResearch(findings, { techStack });

// Use synthesis to inform:
// - Agent generation (what agents should know)
// - Skill creation (patterns to document)
// - Architecture decisions
```

### Use Case 2: Domain Research

Research implementation patterns for product domains:

```javascript
// Called by /agentful-generate after domain discovery
const product = {
  type: 'task management app',
  domains: ['authentication', 'tasks', 'collaboration']
};

const queries = [
  `${product.type} architecture patterns`,
  `authentication implementation best practices ${techStack.framework}`,
  `task management data model design`,
  `real-time collaboration implementation`
];

const findings = await researchTopic('domains', { product, queries });
const synthesis = synthesizeResearch(findings, { domains: product.domains });

// Use synthesis to inform:
// - Domain agent specialization
// - Database schema design
// - API design patterns
```

### Use Case 3: Pre-Implementation Research

Research before implementing a complex feature:

```javascript
// Called by orchestrator before delegating complex work
const feature = {
  name: 'Real-time notifications',
  complexity: 'high',
  technologies: ['WebSockets', 'Redis', 'React']
};

const queries = [
  `WebSocket implementation ${techStack.framework}`,
  `Redis pub/sub patterns for notifications`,
  `React real-time updates best practices`,
  `scaling WebSocket connections`
];

const findings = await researchTopic('feature', { feature, queries });
const synthesis = synthesizeResearch(findings, { feature });

// Share findings with specialist agent before implementation
```

## Quality Criteria

When evaluating research findings:

1. **Recency**: Prefer results from current year
2. **Authority**: Official docs > verified blogs > forums
3. **Specificity**: Specific patterns > general advice
4. **Actionability**: Code examples > theory
5. **Relevance**: Exact version match > general version

## Integration Points

### /agentful-generate

Research is integrated into agent generation:

```javascript
// Step 3 of /agentful-generate workflow
console.log('Researching best practices...');

const research = await researchTopic('generation', {
  techStack,
  domains,
  productType
});

const synthesis = synthesizeResearch(research, { techStack, domains });

// Use synthesis when generating:
// - Domain agent responsibilities
// - Tech skill documentation
// - Best practices sections
```

### Orchestrator

Research can inform architectural decisions:

```javascript
// Before implementing complex features
if (feature.complexity === 'high') {
  console.log(`Researching implementation approaches for ${feature.name}...`);

  const research = await researchTopic('feature-planning', {
    feature,
    techStack
  });

  const synthesis = synthesizeResearch(research, { feature });

  // Present findings to user for decision
  AskUserQuestion({
    question: `
Research findings for ${feature.name}:

Recommended approach:
${synthesis.bestPractices[0]}

Alternatives:
${synthesis.bestPractices.slice(1, 3).join('\n')}

Which approach should we use?
`,
    options: synthesis.bestPractices.map(p => p.summary)
  });
}
```

## Example: Full Research Flow

```javascript
// 1. Detect tech stack
const techStack = detectTechStack();

// 2. Read product requirements
const product = Read('.claude/product/index.md');
const productType = extractProductType(product);
const domains = extractDomains(product);

// 3. Research
console.log('Researching best practices...');

const method = hasContext7() ? 'Context7' : 'WebSearch';
console.log(`Method: ${method}`);

// Tech stack research
const techResearch = await researchTopic('tech-stack', {
  techStack,
  queries: [
    `${techStack.framework} ${techStack.version} best practices`,
    `${techStack.framework} project structure`,
    `${techStack.orm} patterns`
  ]
});

// Domain research
const domainResearch = await researchTopic('domains', {
  domains,
  queries: domains.map(d => `${d} domain implementation patterns`)
});

// Product type research
const productResearch = await researchTopic('product-type', {
  productType,
  queries: [`${productType} application architecture`]
});

// 4. Synthesize
const synthesis = synthesizeResearch(
  [...techResearch, ...domainResearch, ...productResearch],
  { techStack, domains, productType }
);

// 5. Apply findings
console.log('Research complete. Applying findings to agent generation...');

// Generate agents with research-informed patterns
generateAgentsWithResearch(synthesis);
```

## Error Handling

```javascript
async function safeResearch(query, context = {}) {
  try {
    if (hasContext7()) {
      return await mcp__context7__search({ query, limit: 3 });
    } else {
      return await WebSearch({ query: `${query} ${new Date().getFullYear()}`, limit: 3 });
    }
  } catch (error) {
    console.warn(`Research failed for query "${query}": ${error.message}`);
    return {
      query,
      results: [],
      error: error.message,
      fallback: true
    };
  }
}
```

## Best Practices

1. **Always check Context7 availability first** - More accurate results
2. **Include year in WebSearch queries** - Ensure freshness
3. **Limit queries to 5-10** - Balance coverage vs speed
4. **Synthesize findings** - Don't just dump raw results
5. **Cache research results** - Avoid redundant queries
6. **Provide references** - Link to source material
7. **Time-box research** - Don't spend hours researching

## References

- Context7 MCP Documentation
- Claude Code WebSearch API
- Research methodology best practices
