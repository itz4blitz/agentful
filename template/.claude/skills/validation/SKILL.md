---
name: validation
description: Runs production readiness validation checks. Includes type checking, linting, tests, coverage, security, and dead code detection. Stack-agnostic.
model: sonnet
tools: Read, Write, Edit, Glob, Grep, Bash
---

# Validation Skill

This skill defines how to run comprehensive production readiness validation checks across any tech stack.

## The 6 Core Quality Gates

Every codebase, regardless of language, must pass these gates:

1. **Type Checking** - No type errors (if language supports types)
2. **Linting** - Code follows project style guide
3. **Tests** - All tests passing
4. **Coverage** - Minimum 80% code coverage
5. **Security** - No known vulnerabilities, hardcoded secrets
6. **Dead Code** - No unused exports, imports, files, dependencies

## Stack Detection

Before running validation, detect the tech stack:

```bash
# Detect primary language
if exists("package.json"): stack = "JavaScript/TypeScript"
if exists("requirements.txt") OR exists("pyproject.toml"): stack = "Python"
if exists("go.mod"): stack = "Go"
if exists("pom.xml") OR exists("build.gradle"): stack = "Java"
if exists("Gemfile"): stack = "Ruby"
if exists("Cargo.toml"): stack = "Rust"
if exists("composer.json"): stack = "PHP"
if exists("mix.exs"): stack = "Elixir"
```

## Gate 1: Type Checking

### JavaScript/TypeScript

```bash
# Detect
if exists("tsconfig.json"):
  type_checker = "tsc"

# Run
npx tsc --noEmit

# Pass criteria
exit_code == 0
```

### Python

```bash
# Detect
if "mypy" in requirements.txt OR pyproject.toml:
  type_checker = "mypy"

# Run
mypy . --ignore-missing-imports

# Pass criteria
exit_code == 0
```

### Go

```bash
# Built-in type checking
go vet ./...

# Pass criteria
exit_code == 0
```

### Java

```bash
# Compilation is type checking
mvn compile
# OR
gradle build --dry-run

# Pass criteria
exit_code == 0
```

### Rust

```bash
cargo check

# Pass criteria
exit_code == 0
```

### Other Languages

If no type checker found, skip this gate and note in report.

## Gate 2: Linting

### JavaScript/TypeScript

```bash
# Detect
Check package.json for: eslint, @typescript-eslint, prettier

# Run
npm run lint
# OR
npx eslint .

# Pass criteria
exit_code == 0 (errors = 0, warnings acceptable)
```

### Python

```bash
# Detect
Check for: pylint, flake8, black, ruff

# Run
pylint **/*.py
# OR
flake8 .
# OR
ruff check .

# Pass criteria
No errors (warnings acceptable)
```

### Go

```bash
# Use golangci-lint (combines multiple linters)
golangci-lint run

# Pass criteria
exit_code == 0
```

### Java

```bash
# Detect
Check for: checkstyle, spotless

# Run
mvn checkstyle:check
# OR
gradle checkstyleMain

# Pass criteria
exit_code == 0
```

### Ruby

```bash
# RuboCop
rubocop

# Pass criteria
exit_code == 0
```

### Rust

```bash
cargo clippy -- -D warnings

# Pass criteria
exit_code == 0
```

## Gate 3: Dead Code Detection

### JavaScript/TypeScript

```bash
# Try in order
npx knip --reporter json 2>/dev/null && exit 0
npx ts-prune 2>/dev/null && exit 0

# Fallback: Manual detection
grep -r "export.*function\|export.*class\|export.*const" src/ --include="*.ts" --include="*.tsx" -h | \
  while read line; do
    export_name=$(echo "$line" | grep -oE "\w+")
    usage=$(grep -r "$export_name" src/ | wc -l)
    if [ "$usage" -eq 1 ]; then
      echo "Unused: $export_name"
    fi
  done
```

### Python

```bash
# Use vulture
vulture . --min-confidence 80

# Pass criteria
No unused code detected
```

### Go

```bash
# Use deadcode
go install golang.org/x/tools/cmd/deadcode@latest
deadcode ./...

# Pass criteria
No dead code found
```

### Java

```bash
# Use spotbugs or PMD
mvn pmd:check

# Pass criteria
No dead code violations
```

### Other Languages

Manual Grep-based detection as fallback for any language.

## Gate 4: Test Execution

### JavaScript/TypeScript

```bash
# Detect
Check package.json for: jest, vitest, mocha

# Run
npm test
# OR
npx vitest run
# OR
npx jest

# Pass criteria
exit_code == 0, all tests passing
```

### Python

```bash
# Detect
Check for: pytest, unittest, nose

# Run
pytest
# OR
python -m unittest discover

# Pass criteria
exit_code == 0
```

### Go

```bash
# Built-in
go test ./...

# Pass criteria
exit_code == 0
```

### Java

```bash
mvn test
# OR
gradle test

# Pass criteria
exit_code == 0
```

### Ruby

```bash
bundle exec rspec
# OR
rake test

# Pass criteria
exit_code == 0
```

### Rust

```bash
cargo test

# Pass criteria
exit_code == 0
```

## Gate 5: Coverage Check

### JavaScript/TypeScript

```bash
# Jest
npm test -- --coverage
# OR vitest
npx vitest run --coverage

# Parse JSON output
coverage=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')

# Pass criteria
coverage >= 80
```

### Python

```bash
pytest --cov --cov-report=json

# Parse JSON
coverage=$(cat coverage.json | jq '.totals.percent_covered')

# Pass criteria
coverage >= 80
```

### Go

```bash
go test -cover -coverprofile=coverage.out ./...
coverage=$(go tool cover -func=coverage.out | grep total | awk '{print $3}' | sed 's/%//')

# Pass criteria
coverage >= 80
```

### Java

```bash
mvn test jacoco:report

# Check target/site/jacoco/index.html for coverage
# Pass criteria: >= 80%
```

### Ruby

```bash
bundle exec rspec --coverage

# Check coverage/index.html
# Pass criteria: >= 80%
```

### Rust

```bash
cargo tarpaulin --out Json

# Parse coverage from tarpaulin output
# Pass criteria: >= 80%
```

## Gate 6: Security Audit

### Dependency Vulnerabilities

**JavaScript/TypeScript**:
```bash
npm audit --production --json
```

**Python**:
```bash
pip-audit --format json
# OR
safety check --json
```

**Go**:
```bash
go list -json -m all | nancy sleuth
```

**Java**:
```bash
mvn dependency-check:check
```

**Ruby**:
```bash
bundle audit
```

**Rust**:
```bash
cargo audit
```

### Hardcoded Secrets (Language-Agnostic)

```bash
# Search for common secret patterns
grep -rE "(password|secret|token|api_key|apikey|private_key)\s*[:=]\s*['\"][^'\"]{10,}['\"]" \
  src/ --include="*.{ts,tsx,js,jsx,py,go,java,rb,rs,php}" -n

# Pass criteria
No hardcoded secrets found
```

### Debug Statements (Language-Specific)

**JavaScript/TypeScript**:
```bash
grep -rn "console\.(log|debug|warn)" src/ --include="*.ts" --include="*.tsx" --include="*.js"
```

**Python**:
```bash
grep -rn "print(" src/ --include="*.py" | grep -v "# allowed print"
```

**Go**:
```bash
grep -rn "fmt.Println" . --include="*.go" | grep -v "main.go"
```

**Java**:
```bash
grep -rn "System.out.println" src/ --include="*.java"
```

### Type Escape Hatches

**TypeScript**:
```bash
grep -rn "@ts-ignore\|@ts-nocheck" src/ --include="*.ts" --include="*.tsx"
```

**Python**:
```bash
grep -rn "# type: ignore" src/ --include="*.py"
```

## Validation Report Format

```json
{
  "timestamp": "2026-01-22T00:00:00Z",
  "stack": "JavaScript/TypeScript",
  "overall": "passed" | "failed",
  "checks": {
    "typescript": {
      "passed": true,
      "error_count": 0,
      "files_checked": 47
    },
    "lint": {
      "passed": true,
      "error_count": 0,
      "warning_count": 3
    },
    "dead_code": {
      "passed": false,
      "issues": [
        {
          "type": "unused_export",
          "file": "src/utils/date.ts",
          "name": "formatDate"
        },
        {
          "type": "unused_file",
          "file": "src/components/OldWidget.tsx"
        }
      ]
    },
    "tests": {
      "passed": true,
      "test_count": 47,
      "failed": 0,
      "skipped": 2
    },
    "coverage": {
      "passed": false,
      "actual": 72.3,
      "required": 80,
      "diff": -7.7
    },
    "security": {
      "passed": false,
      "vulnerabilities": {
        "critical": 0,
        "high": 0,
        "moderate": 2,
        "low": 5
      },
      "hardcoded_secrets": 1,
      "debug_statements": 3
    }
  },
  "must_fix": [
    "Remove unused export: formatDate in src/utils/date.ts",
    "Delete unused file: src/components/OldWidget.tsx",
    "Add tests to reach 80% coverage (currently 72.3%)",
    "Remove hardcoded secret from src/config/api.ts:12",
    "Remove console.log from src/auth/login.ts:45"
  ],
  "can_ignore": [
    "3 lint warnings in legacy code",
    "5 low severity npm vulnerabilities (dev dependencies)"
  ]
}
```

## Save Report

```bash
# Always save to this location
cat > .agentful/last-validation.json << 'EOF'
{...report json...}
EOF
```

## Update Completion Gates

```bash
# Update .agentful/completion.json
{
  "gates": {
    "tests_passing": true,
    "no_type_errors": true,
    "no_dead_code": false,
    "coverage_80": false,
    "security_clean": false
  }
}
```

## Quick Validation (Faster Feedback)

For faster iteration during development:

```bash
# Type check only
npx tsc --noEmit  # TypeScript
mypy .            # Python
go vet ./...      # Go

# Tests only
npm test          # JavaScript
pytest            # Python
go test ./...     # Go

# Coverage only
npm test -- --coverage  # JavaScript
pytest --cov            # Python
go test -cover ./...    # Go
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Validation
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup environment
        run: |
          # Install dependencies based on detected stack
      - name: Type check
        run: npx tsc --noEmit
      - name: Lint
        run: npm run lint
      - name: Tests
        run: npm test
      - name: Coverage
        run: npm test -- --coverage
      - name: Security
        run: npm audit --production
```

### Adapt for Other Stacks

Replace commands based on stack detection logic above.

## Error Handling

### Tool Not Available

If a validation tool is not installed or unavailable:

1. **Check if tool is in dependencies**
2. **Try alternative tool** (e.g., eslint → prettier)
3. **Skip that specific check** if no alternatives
4. **Note in report** that check was skipped
5. **Continue with remaining checks**

### Timeout on Large Codebases

If validation takes too long:

1. **Run incrementally** (check changed files only)
2. **Increase timeout** in CI/CD
3. **Use caching** (e.g., tsc --incremental)
4. **Parallelize** where possible

### False Positives

If dead code detection finds false positives:

1. **Verify manually** with Grep
2. **Check for dynamic imports/requires**
3. **Exclude known false positives** (update tool config)
4. **Report findings** with confidence levels

## Best Practices

1. **Run locally before pushing** - Catch issues early
2. **Run in CI/CD** - Ensure all contributions pass gates
3. **Fix issues incrementally** - Don't accumulate technical debt
4. **Update tools regularly** - Security vulnerabilities change
5. **Customize thresholds** - Adjust coverage target if needed (but ≥80% recommended)
6. **Review reports** - Don't just pass/fail, understand issues

## Integration with agentful

The **reviewer agent** uses this skill to run all validation checks.
The **fixer agent** uses this skill to understand what needs fixing.
The **orchestrator** uses this skill to determine if features are truly complete.

This skill is **stack-agnostic** - it adapts to whatever tech stack is detected in the project.
