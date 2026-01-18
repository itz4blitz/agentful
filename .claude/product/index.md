# Product Specification

> **Note**: This template supports **both** flat and hierarchical product structures. The system will auto-detect which format you're using:
> - **Flat (this file)**: Add all features here for simple projects
> - **Hierarchical**: Create `.claude/product/domains/*/` directories for organized projects
>
> See `.claude/agents/orchestrator.md` for details on product structure detection.

## Overview

[Describe what you're building in 2-3 sentences]

Example:
> A task management application that helps teams collaborate on projects. Users can create projects, add tasks with deadlines, assign team members, and track progress with real-time updates.

## Goals

- [ ] [Primary goal 1]
- [ ] [Primary goal 2]
- [ ] [Primary goal 3]

## Tech Stack

### Frontend
- **Framework**: [Next.js 14 / React + Vite / Vue + Nuxt / SvelteKit]
- **Language**: [TypeScript / JavaScript]
- **Styling**: [Tailwind CSS / CSS Modules / styled-components / shadcn/ui]
- **State Management**: [Zustand / Context API / Redux / Jotai]

### Backend
- **Runtime**: [Node.js / Bun / Deno]
- **Framework**: [Next.js API Routes / Express / Fastify / NestJS / Hono]
- **Language**: [TypeScript / JavaScript]

### Database
- **Database**: [PostgreSQL / MySQL / SQLite / MongoDB / PlanetScale]
- **ORM**: [Prisma / Drizzle / TypeORM / Mongoose]

### Authentication
- **Method**: [JWT / NextAuth / Clerk / Auth0 / Lucia]

### Testing
- **Unit**: [Vitest / Jest]
- **E2E**: [Playwright / Cypress]

### Deployment
- **Hosting**: [Vercel / Netlify / Railway / Fly.io]

## Features (Priority Order)

### 1. [Feature Name] - CRITICAL
**Description**: [What this feature does]

**Acceptance Criteria**:
- [ ] [Specific requirement 1]
- [ ] [Specific requirement 2]
- [ ] [Specific requirement 3]

**User Stories**:
- As a [user type], I want [feature] so that [benefit]

**Technical Notes**:
- [Any technical details or constraints]

---

### 2. [Feature Name] - HIGH
**Description**: [What this feature does]

**Acceptance Criteria**:
- [ ] [Specific requirement 1]
- [ ] [Specific requirement 2]

---

### 3. [Feature Name] - MEDIUM
**Description**: [What this feature does]

**Acceptance Criteria**:
- [ ] [Specific requirement 1]
- [ ] [Specific requirement 2]

---

### 4. [Feature Name] - LOW
**Description**: [What this feature does]

**Acceptance Criteria**:
- [ ] [Specific requirement 1]

---

## Architecture Notes

### Folder Structure (Optional)

If you have a preferred structure:

```
src/
├── app/              # Next.js app router
├── components/       # React components
├── lib/              # Utilities
├── hooks/            # Custom hooks
└── styles/           # Global styles
```

### Design Patterns

- [Any specific patterns to use]
- [Any patterns to avoid]

### Constraints

- [Performance requirements]
- [Accessibility requirements]
- [Browser support requirements]

## Third-Party Integrations (Optional)

- [API 1]: [Purpose]
- [API 2]: [Purpose]

## Out of Scope (for MVP)

List what you're explicitly NOT building:

- [Feature X] - Will add in v2
- [Feature Y] - Out of scope
- [Feature Z] - Not needed

## Success Criteria

The product is complete when:

1. [All critical features implemented and tested]
2. [All tests passing with 80%+ coverage]
3. [No TypeScript errors]
4. [No security vulnerabilities]
5. [Deployed to production]

## Notes

[Any additional context, links, or documentation]

---

**Tip**: The more detailed your product specification, the better Agentful can understand what to build. Include:
- Clear acceptance criteria
- User stories for context
- Technical constraints
- Examples when helpful
