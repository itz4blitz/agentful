# Product Structure Examples

agentful supports two product specification formats.

## Flat Structure (Simple Projects)

**Best for**: Small projects with < 20 features

**Structure**:
```
.claude/product/
└── index.md                 # All features in one file
```

**Example** (.claude/product/index.md):
```markdown
# TaskFlow - Task Management App

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind
- **Backend**: Node.js, Prisma, PostgreSQL
- **Testing**: Vitest, Playwright

## Features

### 1. User Authentication - CRITICAL
**Description**: User registration, login, JWT tokens

**Acceptance Criteria**:
- [ ] User can register with email/password
- [ ] User can login and receive JWT token
- [ ] Protected routes require valid token

---

### 2. Task Management - CRITICAL
**Description**: Create, read, update, delete tasks

**Acceptance Criteria**:
- [ ] User can create task with title, description, due date
- [ ] User can edit and delete tasks
- [ ] Tasks paginated (20 per page)

---

### 3. Project Organization - HIGH
**Description**: Group tasks into projects

**Acceptance Criteria**:
- [ ] User can create projects
- [ ] User can assign tasks to projects
```

**Tracking** (.agentful/completion.json):
```json
{
  "features": {
    "user-authentication": { "status": "complete", "score": 100 },
    "task-management": { "status": "in_progress", "score": 60 },
    "project-organization": { "status": "pending", "score": 0 }
  },
  "overall": 53
}
```

---

## Hierarchical Structure (Complex Projects)

**Best for**: Large projects with 20+ features, team collaboration

**Structure**:
```
.claude/product/
├── index.md                          # Product overview
└── domains/
    ├── authentication/
    │   ├── index.md                  # Domain overview
    │   └── features/
    │       ├── registration.md
    │       ├── login.md
    │       └── password-reset.md
    ├── task-management/
    │   ├── index.md
    │   └── features/
    │       ├── task-crud.md
    │       └── task-search.md
    └── dashboard/
        ├── index.md
        └── features/
            └── analytics.md
```

**Example** (.claude/product/index.md):
```markdown
# TaskFlow - Task Management App

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind
- **Backend**: Node.js, Prisma, PostgreSQL

## Domains

| Domain | Priority | Description |
|--------|----------|-------------|
| Authentication | CRITICAL | User identity and access |
| Task Management | CRITICAL | Core task CRUD |
| Dashboard | MEDIUM | Analytics and insights |
```

**Example** (.claude/product/domains/authentication/features/login.md):
```markdown
# Feature: User Login

## Priority
CRITICAL

## Description
Authenticate users with email/password and issue JWT tokens.

## Acceptance Criteria
- [ ] POST /api/auth/login endpoint
- [ ] Returns JWT on success
- [ ] Rate limit: 5 attempts per 15min
- [ ] HTTP-only refresh token cookie

## User Stories
- As a user, I want to login so that I can access my account
```

**Tracking** (.agentful/completion.json):
```json
{
  "domains": {
    "authentication": {
      "status": "in_progress",
      "score": 50,
      "features": {
        "registration": { "status": "complete", "score": 100 },
        "login": { "status": "in_progress", "score": 50 },
        "password-reset": { "status": "pending", "score": 0 }
      }
    },
    "task-management": {
      "status": "pending",
      "score": 0
    }
  },
  "overall": 25
}
```

---

## Comparison

| Aspect | Flat | Hierarchical |
|--------|------|--------------|
| **Files** | 1 file | 10+ files |
| **Organization** | Feature list | Domains → Features |
| **Best for** | < 20 features | 20+ features |
| **Team collab** | Harder (merge conflicts) | Easier (separate files) |
| **Visibility** | Feature-level | Subtask-level |

Choose based on your project size and team needs!
