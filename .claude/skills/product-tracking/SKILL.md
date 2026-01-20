---
name: product-tracking
description: Tracks product completion progress across domains, features, subtasks, and quality gates. Supports hierarchical product structure.
model: sonnet
tools: Read, Write, Edit, Glob, Grep
---

# Product Tracking Skill

This skill tracks the completion progress of product development with support for hierarchical product structure.

## Product Structure

### Hybrid Product Organization

The system supports **both** flat and hierarchical product structures with automatic detection:

```
Option 1: Flat Structure (Simple)
└── .claude/product/
    └── index.md                  # Single file with all features

Option 2: Hierarchical Structure (Organized)
└── .claude/product/
    ├── index.md                  # Product overview and goals
    └── domains/
        ├── authentication/
        │   ├── index.md          # Domain overview
        │   └── features/
        │       ├── login.md
        │       ├── register.md
        │       └── logout.md
        ├── user-management/
        │   ├── index.md
        │   └── features/
        │       ├── profile.md
        │       └── settings.md
        └── dashboard/
            ├── index.md
            └── features/
                └── main-dashboard.md
```

### Auto-Detection Algorithm

```bash
# Step 1: Check for hierarchical structure first
if exists(".claude/product/domains/*/index.md"):
    structure_type = "hierarchical"
    product_root = ".claude/product"
    use_domains = true
else:
    # Step 2: Fall back to flat structure
    if exists(".claude/product/index.md"):
        structure_type = "flat"
        product_root = ".claude/product"
        use_domains = false
    else:
        error("No product specification found")
```

**Priority Order:**
1. Hierarchical (`.claude/product/domains/*/index.md`) - preferred for organized projects
2. Flat (`.claude/product/index.md`) - simple flat format for projects without domains

### Parsing Product Structure

#### For Hierarchical Structure

```bash
# 1. Detect structure
domain_files = Glob(".claude/product/domains/*/index.md")

if domain_files.length > 0:
    # Hierarchical structure detected
    structure_type = "hierarchical"

    # 2. Read product index
    Read .claude/product/index.md
    # Extract: product name, overview, goals

    # 3. Discover all domains
    for domain_file in domain_files:
        Read domain_file
        # Extract: domain name, description, priority

        # 4. For each domain, discover features
        domain_name = extract_from_path(domain_file)
        feature_files = Glob(".claude/product/domains/{domain_name}/features/*.md")

        # 5. For each feature, read feature details
        for feature_file in feature_files:
            Read feature_file
            # Extract: feature name, priority, acceptance criteria, subtasks
```

#### For Flat Structure

```bash
# 1. Detect structure
if exists(".claude/product/index.md"):
    product_file = ".claude/product/index.md"
else:
    error("No product specification found")

# 2. Read product specification
Read product_file
# Extract: product name, overview, goals, feature list

# 3. Parse features from markdown
# Features are typically under "## Features" section
# Each feature has: name, priority, acceptance criteria
```

## State File: .agentful/completion.json

### Hierarchical Schema

```json
{
  "domains": {
    "domain-id": {
      "name": "Domain Name",
      "priority": "CRITICAL|HIGH|MEDIUM|LOW",
      "status": "pending|in_progress|complete|blocked",
      "score": 0-100,
      "started_at": "2026-01-18T00:00:00Z",
      "completed_at": "2026-01-18T01:00:00Z",
      "features": {
        "feature-id": {
          "name": "Feature Name",
          "priority": "CRITICAL|HIGH|MEDIUM|LOW",
          "status": "pending|in_progress|complete|blocked",
          "score": 0-100,
          "started_at": "2026-01-18T00:00:00Z",
          "completed_at": "2026-01-18T01:00:00Z",
          "subtasks": {
            "subtask-id": {
              "name": "Subtask Name",
              "status": "pending|in_progress|complete",
              "completed_at": "2026-01-18T01:00:00Z"
            }
          },
          "notes": "Optional notes about progress"
        }
      },
      "notes": "Optional notes about domain progress"
    }
  },
  "gates": {
    "tests_passing": false,
    "no_type_errors": false,
    "no_dead_code": false,
    "coverage_80": false,
    "security_clean": false
  },
  "overall": 0,
  "last_updated": "2026-01-18T00:00:00Z"
}
```

### Flat Schema (Legacy Support)

For products without domain structure, the flat schema is still supported:

```json
{
  "features": {
    "feature-id": {
      "status": "pending|in_progress|complete|blocked",
      "score": 0-100,
      "started_at": "2026-01-18T00:00:00Z",
      "completed_at": "2026-01-18T01:00:00Z",
      "notes": "Optional notes about progress"
    }
  },
  "gates": {
    "tests_passing": false,
    "no_type_errors": false,
    "no_dead_code": false,
    "coverage_80": false,
    "security_clean": false
  },
  "overall": 0,
  "last_updated": "2026-01-18T00:00:00Z"
}
```

## Reading Progress

### Hierarchical Structure

```bash
# Read current state
Read .agentful/completion.json

# Display hierarchical progress
# Overall: 48%
# Domains: 2/3 complete
#   - Authentication: 100% (3/3 features)
#   - User Management: 45% (1/2 features)
#   - Dashboard: 0% (0/1 features)
# Gates passing: 3/5
```

### Flat Structure (Legacy)

```bash
# Read current state
Read .agentful/completion.json

# Parse and display
# Overall: 48%
# Features complete: 2/5
# Gates passing: 3/5
```

## Updating Progress

### Updating Hierarchical Structure

When a subtask is completed:

```json
{
  "domains": {
    "authentication": {
      "features": {
        "login": {
          "subtasks": {
            "login-ui": {
              "status": "complete",
              "completed_at": "2026-01-18T01:00:00Z"
            },
            "login-api": {
              "status": "in_progress"
            }
          },
          "score": 50,
          "status": "in_progress"
        }
      },
      "score": 50,
      "status": "in_progress"
    }
  }
}
```

When a feature is completed (all subtasks done):

```json
{
  "domains": {
    "authentication": {
      "features": {
        "login": {
          "status": "complete",
          "score": 100,
          "completed_at": "2026-01-18T02:00:00Z",
          "notes": "Login UI and API fully implemented with tests"
        }
      },
      "score": 33,
      "status": "in_progress"
    }
  }
}
```

When starting work on a feature:

```json
{
  "domains": {
    "authentication": {
      "features": {
        "register": {
          "status": "in_progress",
          "score": 0,
          "started_at": "2026-01-18T02:30:00Z",
          "subtasks": {
            "register-ui": {
              "status": "in_progress"
            },
            "register-api": {
              "status": "pending"
            }
          }
        }
      },
      "score": 22,
      "status": "in_progress"
    }
  }
}
```

### Updating Flat Structure (Legacy)

When work is completed on a feature:

```json
{
  "features": {
    "authentication": {
      "status": "complete",
      "score": 100,
      "started_at": "2026-01-18T00:00:00Z",
      "completed_at": "2026-01-18T01:30:00Z",
      "notes": "JWT authentication fully implemented with tests"
    }
  }
}
```

When starting work on a feature:

```json
{
  "features": {
    "user-profile": {
      "status": "in_progress",
      "score": 0,
      "started_at": "2026-01-18T01:30:00Z"
    }
  }
}
```

When progress is made:

```json
{
  "features": {
    "user-profile": {
      "status": "in_progress",
      "score": 45,
      "notes": "Backend service complete, frontend pending"
    }
  }
}
```

## Calculating Overall Score

### Hierarchical Score Calculation

```javascript
// For hierarchical structure with domains
function calculateHierarchicalScore(domains, gates) {
  let totalDomainScore = 0;
  let domainCount = 0;

  // Calculate each domain's score
  for (const [domainId, domain] of Object.entries(domains)) {
    const features = domain.features;
    if (!features || Object.keys(features).length === 0) continue;

    // Calculate feature scores (average of subtasks or direct score)
    let featureTotal = 0;
    let featureCount = 0;

    for (const [featureId, feature] of Object.entries(features)) {
      if (feature.subtasks) {
        // Calculate from subtasks
        const subtasks = Object.values(feature.subtasks);
        const completed = subtasks.filter(st => st.status === 'complete').length;
        feature.score = Math.round((completed / subtasks.length) * 100);
      }
      featureTotal += feature.score;
      featureCount++;
    }

    // Domain score is average of its features
    domain.score = Math.round(featureTotal / featureCount);
    totalDomainScore += domain.score;
    domainCount++;
  }

  // Calculate gate scores
  const gateScores = Object.values(gates).map(g => g ? 100 : 0);
  const gateScore = gateScores.reduce((a, b) => a + b, 0) / gateScores.length;

  // Overall is weighted average of domains and gates
  const domainScore = domainCount > 0 ? totalDomainScore / domainCount : 0;
  const overall = Math.round((domainScore * 0.8) + (gateScore * 0.2));

  return { overall, domainScore, gateScore };
}
```

**Priority Weights:**

| Priority | Weight |
|----------|--------|
| CRITICAL | 1.5x |
| HIGH | 1.2x |
| MEDIUM | 1.0x |
| LOW | 0.5x |

Weighted score calculation:
```javascript
function calculateWeightedScore(domains) {
  let totalWeightedScore = 0;
  let totalWeight = 0;

  const priorityWeights = {
    CRITICAL: 1.5,
    HIGH: 1.2,
    MEDIUM: 1.0,
    LOW: 0.5
  };

  for (const [domainId, domain] of Object.entries(domains)) {
    const weight = priorityWeights[domain.priority] || 1.0;
    totalWeightedScore += domain.score * weight;
    totalWeight += weight;
  }

  return Math.round(totalWeightedScore / totalWeight);
}
```

### Flat Score Calculation (Legacy)

```javascript
// Average of all feature scores
const featureScores = Object.values(features).map(f => f.score);
const featureScore = Math.round(
  featureScores.reduce((a, b) => a + b, 0) / featureScores.length
);

// Gate scores
const gateScores = Object.values(gates).map(g => g ? 100 : 0);
const gateScore = gateScores.reduce((a, b) => a + b, 0) / gateScores.length;

// Overall is average of features and gates
const overall = Math.round((featureScore * 0.8) + (gateScore * 0.2));

// Adjusted by gates (legacy method)
const gatePenalty = Object.values(gates).filter(g => !g).length * 5;
const finalScore = Math.max(0, overall - gatePenalty);
```

## Quality Gates

Each gate must pass for production readiness:

| Gate | Check | Command |
|------|-------|---------|
| tests_passing | All tests pass | `npm test` |
| no_type_errors | No TypeScript errors | `npx tsc --noEmit` |
| no_dead_code | No unused code | `npx knip` |
| coverage_80 | Test coverage ≥ 80% | `npm test -- --coverage` |
| security_clean | No secrets/vulnerabilities | `npm audit` |

## Feature Status Values

| Status | Meaning | Score Range |
|--------|---------|-------------|
| pending | Not started | 0 |
| in_progress | Work in progress | 1-99 |
| complete | Fully done and validated | 100 |
| blocked | Waiting on decision/dependency | any |

## Integration with Product Structure

### Parsing Hierarchical Product Structure

Parse `.claude/product/index.md` and all domain/feature files:

```markdown
<!-- .claude/product/index.md -->
# My Product

## Domain: Authentication
Priority: CRITICAL

## Domain: User Management
Priority: HIGH

<!-- .claude/product/domains/authentication/index.md -->
# Authentication Domain

Provides user authentication and authorization features.

## Features
- User Registration
- User Login
- Password Reset

<!-- .claude/product/domains/authentication/features/login.md -->
# Feature: User Login

Priority: CRITICAL

## Subtasks
1. Create login form UI
   - Status: pending
   - Acceptance: [ ] Email field, [ ] Password field, [ ] Submit button
2. Implement login API
   - Status: pending
   - Acceptance: [ ] POST /api/auth/login, [ ] JWT generation, [ ] Error handling
```

Map to completion.json:

```json
{
  "domains": {
    "authentication": {
      "name": "Authentication",
      "priority": "CRITICAL",
      "status": "in_progress",
      "score": 33,
      "features": {
        "login": {
          "name": "User Login",
          "priority": "CRITICAL",
          "status": "in_progress",
          "score": 50,
          "subtasks": {
            "login-ui": {
              "name": "Create login form UI",
              "status": "complete",
              "completed_at": "2026-01-18T01:00:00Z"
            },
            "login-api": {
              "name": "Implement login API",
              "status": "pending"
            }
          }
        }
      }
    }
  }
}
```

### Parsing Flat Product Structure

Parse `.claude/product/index.md` to extract feature list:

```markdown
## Features

### 1. Authentication - CRITICAL
**Description**: User login with JWT
**Acceptance**:
- [x] Login endpoint
- [x] Registration endpoint
- [x] JWT token generation
- [ ] Refresh token flow
```

Map to completion.json:

```json
{
  "features": {
    "authentication": {
      "status": "in_progress",
      "score": 75,
      "acceptance": {
        "login_endpoint": true,
        "registration_endpoint": true,
        "jwt_generation": true,
        "refresh_token": false
      }
    }
  }
}
```

## Usage

### Auto-Detection First

Always detect structure type before any operation:

```bash
# Detect structure
domains_found = Glob(".claude/product/domains/*/index.md")
product_index_exists = exists(".claude/product/index.md")

if domains_found:
    use_hierarchical_tracking()
else if product_index_exists:
    use_flat_tracking()
else:
    error("No product specification found")
```

### For Hierarchical Structure

When orchestrator asks for progress update:

1. Detect structure type (domains found → hierarchical)
2. Read `.claude/product/index.md` to discover domains
3. Use Glob to find all `.claude/product/domains/*/index.md` files
4. For each domain, read its index and discover features
5. Read `.agentful/completion.json`
6. Calculate overall percentage with weighted hierarchy
7. Identify next priority subtask within highest priority domain
8. Check for blocked items
9. Report summary with domain/feature/subtask breakdown

When subtask work completes:

1. Update subtask status to "complete"
2. Add completed_at timestamp
3. Recalculate feature score (based on completed subtasks)
4. Recalculate domain score (based on feature scores)
5. Recalculate overall score (weighted average)
6. Write back to completion.json

### For Flat Structure

When orchestrator asks for progress update:

1. Detect structure type (no domains, `.claude/product/index.md` exists → flat)
2. Read `.claude/product/index.md` for product specification
3. Read completion.json
4. Calculate overall percentage
5. Identify next priority feature
6. Check for blocked items
7. Report summary

When feature work completes:

1. Update feature status to "complete"
2. Set score to 100
3. Add completed_at timestamp
4. Recalculate overall score
5. Write back to completion.json

### Structure Compatibility

| Structure Type | Detection | Product File | Completion Schema | Tracking Method |
|---------------|-----------|--------------|-------------------|-----------------|
| Hierarchical | `.claude/product/domains/*/index.md` exists | `.claude/product/index.md` | Nested `domains` object | Track at subtask → feature → domain levels |
| Flat | `.claude/product/index.md` exists | `.claude/product/index.md` | Flat `features` object | Track at feature level |
