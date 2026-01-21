# Product Structure Examples

This file shows concrete examples of both flat and hierarchical product structures.

## Example 1: Flat Structure (Simple Project)

### File: .claude/product/index.md

```markdown
# TaskFlow - Task Management App

## Overview

A simple task management application for individuals and small teams. Users can create projects, add tasks with deadlines, set priorities, and track progress.

## Goals

- [ ] Enable users to create and manage tasks
- [ ] Provide project organization
- [ ] Support task prioritization and deadlines
- [ ] Real-time progress tracking

## Tech Stack

### Frontend
- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand

### Backend
- **Runtime**: Node.js
- **Framework**: Next.js API Routes
- **Language**: TypeScript

### Database
- **Database**: PostgreSQL
- **ORM**: Prisma

### Authentication
- **Method**: JWT

### Testing
- **Unit**: Vitest
- **E2E**: Playwright

### Deployment
- **Hosting**: Vercel

## Features (Priority Order)

### 1. User Authentication - CRITICAL
**Description**: User registration, login, and authentication

**Acceptance Criteria**:
- [ ] User can register with email/password
- [ ] User can login with email/password
- [ ] JWT token generated on successful login
- [ ] Protected routes require valid token
- [ ] Password reset flow via email

**User Stories**:
- As a user, I want to create an account so that I can manage my tasks
- As a user, I want to login so that I can access my tasks securely
- As a user, I want to reset my password if I forget it

---

### 2. Task Management - CRITICAL
**Description**: Create, read, update, and delete tasks

**Acceptance Criteria**:
- [ ] User can create a new task
- [ ] Task has title, description, due date, priority
- [ ] User can edit existing task
- [ ] User can delete task
- [ ] Tasks are stored per user
- [ ] Task list paginated (20 per page)

**User Stories**:
- As a user, I want to create tasks so that I can track my work
- As a user, I want to edit tasks so that I can update details
- As a user, I want to delete tasks I no longer need

---

### 3. Project Organization - HIGH
**Description**: Group tasks into projects

**Acceptance Criteria**:
- [ ] User can create a project
- [ ] Project has name and description
- [ ] User can assign tasks to projects
- [ ] User can view all tasks in a project
- [ ] User can delete a project (moves tasks to inbox)

**User Stories**:
- As a user, I want to create projects so that I can organize my tasks
- As a user, I want to assign tasks to projects so that I can find them easily

---

### 4. Task Prioritization - MEDIUM
**Description**: Set and sort by priority levels

**Acceptance Criteria**:
- [ ] Task can have priority: low, medium, high, urgent
- [ ] Default priority is medium
- [ ] User can filter tasks by priority
- [ ] Task list sorted by priority by default

**User Stories**:
- As a user, I want to set task priority so that I know what's important
- As a user, I want to filter by priority so that I can focus on urgent tasks

---

### 5. Due Dates & Reminders - MEDIUM
**Description**: Set due dates and receive reminders

**Acceptance Criteria**:
- [ ] Task can have optional due date
- [ ] Tasks due today shown in "Today" view
- [ ] Overdue tasks highlighted in red
- [ ] User receives email notification 24h before due date

**User Stories**:
- As a user, I want to set due dates so that I know when to complete tasks
- As a user, I want to see overdue tasks so that I can catch up

---

### 6. Progress Dashboard - LOW
**Description**: Visual overview of task completion

**Acceptance Criteria**:
- [ ] Dashboard shows total tasks
- [ ] Dashboard shows completed vs pending tasks
- [ ] Dashboard shows tasks due this week
- [ ] Simple bar chart for completion rate

**User Stories**:
- As a user, I want to see my progress so that I stay motivated

## Architecture Notes

### Folder Structure

```
src/
├── app/                    # Next.js app router
│   ├── (auth)/            # Auth routes
│   ├── dashboard/         # Dashboard pages
│   └── api/               # API routes
├── components/            # React components
│   ├── auth/
│   ├── tasks/
│   └── projects/
├── lib/                   # Utilities
│   ├── auth.ts
│   ├── db.ts
│   └── utils.ts
└── styles/                # Global styles
```

### Design Patterns

- Use server components for data fetching
- Client components only for interactivity
- API routes handle business logic
- Prisma for type-safe database access

## Out of Scope (for MVP)

- Team collaboration features
- File attachments on tasks
- Calendar view
- Mobile app
- Task templates
- Recurring tasks

## Success Criteria

The product is complete when:

1. All critical features implemented and tested
2. All tests passing with 80%+ coverage
3. No TypeScript errors
4. No security vulnerabilities
5. Deployed to production

## Notes

- Start with authentication first
- Then build task CRUD
- Add projects if time permits
- Keep UI simple and clean
```

### Completion Tracking (.agentful/completion.json)

```json
{
  "features": {
    "user-authentication": {
      "status": "complete",
      "score": 100,
      "completed_at": "2026-01-18T01:00:00Z",
      "notes": "JWT auth fully implemented with tests"
    },
    "task-management": {
      "status": "in_progress",
      "score": 70,
      "notes": "CRUD operations working, pagination pending"
    },
    "project-organization": {
      "status": "pending",
      "score": 0
    },
    "task-prioritization": {
      "status": "pending",
      "score": 0
    },
    "due-dates": {
      "status": "pending",
      "score": 0
    },
    "dashboard": {
      "status": "pending",
      "score": 0
    }
  },
  "gates": {
    "tests_passing": true,
    "no_type_errors": true,
    "no_dead_code": false,
    "coverage_80": false,
    "security_clean": true
  },
  "overall": 28,
  "last_updated": "2026-01-18T00:00:00Z"
}
```

---

## Example 2: Hierarchical Structure (Organized Project)

### File Structure

```
.claude/product/
├── index.md                          # Product overview (see below)
└── domains/
    ├── authentication/
    │   ├── index.md                  # Domain overview
    │   └── features/
    │       ├── registration.md
    │       ├── login.md
    │       ├── password-reset.md
    │       └── session-management.md
    ├── task-management/
    │   ├── index.md                  # Domain overview
    │   └── features/
    │       ├── task-crud.md
    │       ├── task-list.md
    │       ├── task-search.md
    │       └── bulk-operations.md
    ├── project-organization/
    │   ├── index.md                  # Domain overview
    │   └── features/
    │       ├── project-crud.md
    │       ├── task-assignment.md
    │       └── project-views.md
    └── dashboard/
        ├── index.md                  # Domain overview
        └── features/
            ├── progress-tracking.md
            ├── statistics.md
            └── analytics.md
```

### File: .claude/product/index.md

```markdown
# TaskFlow - Task Management App

## Overview

A comprehensive task management application for individuals and teams. Provides hierarchical organization, advanced task management, and powerful analytics.

## Goals

- [ ] Enable efficient task and project management
- [ ] Support individual and team workflows
- [ ] Provide actionable insights through analytics
- [ ] Scale to 10,000+ tasks per user

## Tech Stack

### Frontend
- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand + React Query

### Backend
- **Runtime**: Node.js
- **Framework**: Next.js API Routes
- **Language**: TypeScript

### Database
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Caching**: Redis

### Authentication
- **Method**: JWT + refresh tokens

### Testing
- **Unit**: Vitest
- **E2E**: Playwright
- **Coverage**: 80%+ required

### Deployment
- **Hosting**: Vercel
- **Database**: PlanetScale

## Domains

| Domain | Priority | Description |
|--------|----------|-------------|
| Authentication | CRITICAL | User identity and access control |
| Task Management | CRITICAL | Core task CRUD and organization |
| Project Organization | HIGH | Grouping and categorization |
| Dashboard | MEDIUM | Analytics and insights |

## Success Criteria

The product is complete when:

1. All CRITICAL and HIGH domains complete
2. All tests passing with 80%+ coverage
3. No TypeScript errors
4. Performance: < 100ms API response time
5. Deployed to production with monitoring
```

### File: .claude/product/domains/authentication/index.md

```markdown
# Authentication Domain

## Overview

Handles user identity, authentication, and authorization. Ensures secure access to user data and maintains session integrity.

## Goals

- [ ] Provide secure user registration and login
- [ ] Maintain secure sessions with JWT tokens
- [ ] Support password recovery flows
- [ ] Protect against common attacks (XSS, CSRF, injection)

## Priority

CRITICAL - Must be completed before any user data can be stored

## Features

1. **User Registration** - New user signup with validation
2. **User Login** - Email/password authentication with JWT
3. **Password Reset** - Secure password recovery via email
4. **Session Management** - Token refresh and logout

## Dependencies

- Depends on: Nothing (foundational)
- Blocks by: Task Management, Project Organization
- Integration: Email service for password reset

## Technical Notes

- Use bcrypt for password hashing
- JWT with 15min expiration + refresh tokens
- Rate limiting on auth endpoints
- Email verification optional for MVP

## Completion Criteria

Domain complete when:
- All 4 features have status: "complete"
- All auth tests passing
- No security vulnerabilities
- Token refresh working correctly
```

### File: .claude/product/domains/authentication/features/login.md

```markdown
# Feature: User Login

## Description

Authenticate users with email/password and issue JWT tokens for session management.

## Priority

CRITICAL

## Acceptance Criteria

- [ ] POST /api/auth/login endpoint accepts email/password
- [ ] Validates email format and password length
- [ ] Returns 401 for invalid credentials
- [ ] Returns JWT access token (15min expiry) on success
- [ ] Returns HTTP-only refresh token cookie (7 days)
- [ ] Rate limit: 5 attempts per 15 minutes
- [ ] Logs login attempts for security audit

## User Stories

- As a user, I want to login with my email so that I can access my account
- As a user, I want to stay logged in so that I don't have to re-authenticate constantly
- As a user, I want clear error messages if my login fails

## Subtasks

### 1. Create Login API Endpoint
- [ ] Create /api/auth/login route
- [ ] Implement request validation (zod)
- [ ] Query user by email from database
- [ ] Verify password with bcrypt
- [ ] Generate JWT access token
- [ ] Generate refresh token
- [ ] Set HTTP-only cookie
- [ ] Return tokens and user data

### 2. Create Login UI Component
- [ ] Design login form with email/password fields
- [ ] Add client-side validation
- [ ] Handle loading states
- [ ] Display error messages
- [ ] Redirect on success
- [ ] Store tokens securely

### 3. Implement Rate Limiting
- [ ] Configure rate limiter middleware
- [ ] Track attempts by IP/email
- [ ] Return 429 Too Many Requests when limit hit
- [ ] Add Retry-After header

### 4. Add Login Logging
- [ ] Log successful logins with timestamp
- [ ] Log failed attempts with IP
- [ ] Store in auth_logs table
- [ ] Create admin view for security audit

## Technical Notes

**API Request:**
```json
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Success Response (200):**
```json
{
  "access_token": "eyJ...",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Error Response (401):**
```json
{
  "error": "Invalid credentials"
}
```

## Dependencies

- Requires: User Registration (users must exist to login)
- Blocks by: Session Management
- Integration: Rate limiter, logging service

## Testing

- Unit tests for password verification
- Integration tests for login flow
- Rate limiting tests
- Error handling tests
- Security tests (SQL injection, XSS)

## Definition of Done

- [ ] All subtasks complete
- [ ] API endpoint tested with Postman/Insomnia
- [ ] UI component working in browser
- [ ] All tests passing
- [ ] Code reviewed
- [ ] Documentation updated
```

### Completion Tracking (.agentful/completion.json)

```json
{
  "domains": {
    "authentication": {
      "name": "Authentication",
      "priority": "CRITICAL",
      "status": "in_progress",
      "score": 50,
      "started_at": "2026-01-18T00:00:00Z",
      "features": {
        "registration": {
          "name": "User Registration",
          "priority": "CRITICAL",
          "status": "complete",
          "score": 100,
          "completed_at": "2026-01-18T01:00:00Z"
        },
        "login": {
          "name": "User Login",
          "priority": "CRITICAL",
          "status": "in_progress",
          "score": 50,
          "subtasks": {
            "login-api": {
              "name": "Create Login API Endpoint",
              "status": "complete",
              "completed_at": "2026-01-18T02:00:00Z"
            },
            "login-ui": {
              "name": "Create Login UI Component",
              "status": "in_progress"
            },
            "rate-limiting": {
              "name": "Implement Rate Limiting",
              "status": "pending"
            },
            "login-logging": {
              "name": "Add Login Logging",
              "status": "pending"
            }
          }
        },
        "password-reset": {
          "name": "Password Reset",
          "priority": "HIGH",
          "status": "pending",
          "score": 0
        },
        "session-management": {
          "name": "Session Management",
          "priority": "HIGH",
          "status": "pending",
          "score": 0
        }
      },
      "notes": "Registration complete, login in progress (API done, UI pending)"
    },
    "task-management": {
      "name": "Task Management",
      "priority": "CRITICAL",
      "status": "pending",
      "score": 0,
      "features": {
        "task-crud": {
          "name": "Task CRUD",
          "priority": "CRITICAL",
          "status": "pending",
          "score": 0
        }
      }
    }
  },
  "gates": {
    "tests_passing": true,
    "no_type_errors": true,
    "no_dead_code": true,
    "coverage_80": false,
    "security_clean": true
  },
  "overall": 25,
  "last_updated": "2026-01-18T00:00:00Z"
}
```

## Key Differences

| Aspect | Flat Structure | Hierarchical Structure |
|--------|---------------|----------------------|
| **Files** | 1 file (.claude/product/index.md) | 10+ files (domains/features) |
| **Organization** | Feature list | Domains → Features → Subtasks |
| **Tracking** | Feature-level (6 items) | Subtask-level (20+ items) |
| **Scalability** | Good for < 20 features | Good for 20+ features |
| **Team collaboration** | Harder (merge conflicts) | Easier (separate files) |
| **Progress visibility** | Basic (X/6 features) | Detailed (X/Y subtasks per feature) |

Choose the structure that fits your project size and team needs!
