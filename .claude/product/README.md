# Product Structure Guide

agentful supports **both** flat and hierarchical product structures with automatic detection. This guide explains how to use each format.

## Quick Start

### Simple Projects (Flat Structure)

Just create a single `PRODUCT.md` file at your project root:

```bash
your-project/
├── PRODUCT.md          # All features in one file
├── src/
└── package.json
```

Or use `.claude/product/index.md`:

```bash
your-project/
├── .claude/
│   └── product/
│       └── index.md    # All features in one file
├── src/
└── package.json
```

### Organized Projects (Hierarchical Structure)

Create a hierarchical structure under `.claude/product/domains/`:

```bash
your-project/
├── .claude/
│   └── product/
│       ├── index.md              # Product overview
│       └── domains/
│           ├── authentication/
│           │   ├── index.md      # Domain overview
│           │   └── features/
│           │       ├── login.md
│           │       └── register.md
│           └── user-management/
│               ├── index.md
│               └── features/
│                   └── profile.md
├── src/
└── package.json
```

## Auto-Detection

The system automatically detects which format you're using:

1. **Hierarchical**: If `.claude/product/domains/*/index.md` exists
2. **Flat (legacy)**: If `PRODUCT.md` exists at root
3. **Flat (new)**: If `.claude/product/index.md` exists (without domains)

### Detection Algorithm

```bash
if exists(".claude/product/domains/*/index.md"):
    → Use hierarchical structure
    → Track at subtask → feature → domain levels
else if exists("PRODUCT.md"):
    → Use flat structure (legacy)
    → Track at feature level
else if exists(".claude/product/index.md"):
    → Use flat structure (new)
    → Track at feature level
else:
    → Error: No product specification found
```

## When to Use Each Format

### Flat Structure

**Use when:**
- Quick prototype or MVP
- Small project with 5-10 features
- Single developer or small team
- Simple feature list without dependencies

**Example `PRODUCT.md`:**

```markdown
# My App

## Features

### 1. User Authentication - CRITICAL
- Login with email/password
- JWT token handling
- Password reset

### 2. User Profile - HIGH
- Edit profile information
- Upload avatar

### 3. Dashboard - MEDIUM
- Display user stats
- Recent activity
```

### Hierarchical Structure

**Use when:**
- Large project with 20+ features
- Multiple team members working in parallel
- Complex feature dependencies
- Need domain-driven organization

**Example structure:**

```markdown
<!-- .claude/product/index.md -->
# My App

## Domains
- Authentication (CRITICAL)
- User Management (HIGH)
- Dashboard (MEDIUM)

<!-- .claude/product/domains/authentication/index.md -->
# Authentication Domain

Handles user identity and access control.

## Features
- Login
- Register
- Password Reset

<!-- .claude/product/domains/authentication/features/login.md -->
# Feature: Login

Priority: CRITICAL

## Subtasks
1. Create login UI
2. Implement login API
3. Add JWT handling
4. Write tests
```

## Completion Tracking

### Flat Structure Tracking

```json
{
  "features": {
    "authentication": {
      "status": "complete",
      "score": 100
    },
    "user-profile": {
      "status": "in_progress",
      "score": 60
    }
  },
  "gates": {
    "tests_passing": true,
    "no_type_errors": true
  },
  "overall": 72
}
```

### Hierarchical Structure Tracking

```json
{
  "domains": {
    "authentication": {
      "status": "complete",
      "score": 100,
      "features": {
        "login": {
          "status": "complete",
          "score": 100,
          "subtasks": {
            "login-ui": { "status": "complete" },
            "login-api": { "status": "complete" }
          }
        }
      }
    },
    "user-management": {
      "status": "in_progress",
      "score": 60,
      "features": {
        "profile": {
          "status": "in_progress",
          "score": 60
        }
      }
    }
  },
  "gates": {
    "tests_passing": true,
    "no_type_errors": true
  },
  "overall": 72
}
```

## Migration Path

You can start flat and migrate to hierarchical as your project grows:

```
Phase 1: Quick Start
└── PRODUCT.md (all features in one file)

Phase 2: Organize (optional)
└── .claude/product/index.md (move to .claude directory)

Phase 3: Scale Up (when needed)
└── .claude/product/domains/ (split by domain)
    ├── authentication/
    ├── user-management/
    └── dashboard/
```

### How to Migrate

1. **Create domain directories:**
   ```bash
   mkdir -p .claude/product/domains/authentication/features
   mkdir -p .claude/product/domains/user-management/features
   ```

2. **Split features into domain files:**
   ```bash
   # Move authentication features
   # .claude/product/domains/authentication/features/login.md
   # .claude/product/domains/authentication/features/register.md
   ```

3. **Create domain index files:**
   ```bash
   # .claude/product/domains/authentication/index.md
   # List overview, goals, and feature summaries
   ```

4. **Update .claude/product/index.md:**
   ```bash
   # Keep only product overview and domain list
   # Remove detailed feature specs (now in domain files)
   ```

5. **System auto-detects the change:**
   - Next agent run will detect hierarchical structure
   - No configuration changes needed

## Best Practices

### Flat Structure

1. **Keep features focused**: Each feature should be independently testable
2. **Use priorities**: CRITICAL, HIGH, MEDIUM, LOW
3. **Clear acceptance criteria**: Specific requirements for each feature
4. **Track progress**: Update completion.json after validated work

### Hierarchical Structure

1. **Domain boundaries**: Group related features (e.g., authentication, billing)
2. **Feature independence**: Each feature should be completable independently
3. **Subtask granularity**: Break features into small, testable subtasks
4. **Cross-domain dependencies**: Document in feature files, minimize where possible

## Examples

See `.claude/product/index.md` template for a complete flat structure example.

For hierarchical structure examples, check:
- `.claude/agents/orchestrator.md` - Product structure reading algorithm
- `.claude/skills/product-tracking/SKILL.md` - Progress tracking for both formats

## Troubleshooting

### "No product specification found"

**Solution**: Create one of:
- `PRODUCT.md` at root
- `.claude/product/index.md`
- `.claude/product/domains/*/index.md`

### "Format mismatch" error

**Cause**: completion.json structure doesn't match product files

**Solution**: Don't mix formats. Choose one:
- All flat: `PRODUCT.md` + `completion.json` with `features` object
- All hierarchical: `.claude/product/domains/` + `completion.json` with `domains` object

### Can I use both formats?

**No**: The system auto-detects ONE format. Choose the format that best fits your project size and complexity.

## Product Analysis File

After running `/agentful-product`, a `product-analysis.json` file is generated:

```bash
.claude/product/
├── index.md                    # Your product spec (template)
└── product-analysis.json       # Generated analysis (created by /agentful-product)
```

**Key points:**
- **Not in templates**: This file doesn't exist in the agentful package itself
- **Generated on demand**: Created when you run `/agentful-product` in your project
- **Purpose**: Analyzes your product spec for completeness, clarity, feasibility, testability, and consistency
- **Scores readiness**: 0-100% score with blocking issues and recommendations
- **Version controlled**: Commit to git to track spec quality improvements over time

**Example content:**
```json
{
  "version": "1.0",
  "timestamp": "2026-01-20T00:00:00Z",
  "readiness_score": 75,
  "dimensions": {
    "completeness": { "score": 85 },
    "clarity": { "score": 90 }
  },
  "blocking_issues": [],
  "can_start_development": true
}
```

## Summary

| Format | Best For | Tracking | File Structure |
|--------|----------|----------|----------------|
| Flat (PRODUCT.md) | Small projects, MVPs | Feature level | Single file |
| Flat (.claude/product/index.md) | Small projects, organized | Feature level | Single file in .claude |
| Hierarchical | Large projects, teams | Subtask/feature/domain level | Multiple files, domain folders |

Choose the format that matches your project needs. The system will auto-detect and adapt!
