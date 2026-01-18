# Product Specification

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

## Product Structure

This product is organized into **domains**, which contain **features**, which break down into **subtasks**.

### Hierarchical Structure

```
Product
└── Domain (e.g., authentication)
    └── Feature (e.g., login)
        └── Subtask (e.g., create login form)
```

**Definitions**:
- **Domain**: A major functional area (e.g., authentication, purchasing, user-management)
- **Feature**: A specific capability within a domain (e.g., login, registration, password-reset)
- **Subtask**: An implementable unit of work (e.g., create UI form, implement API endpoint)

**Priority Levels**:
- `CRITICAL` - Must have for MVP, blocks other features
- `HIGH` - Important for MVP, should include
- `MEDIUM` - Nice to have if time permits
- `LOW` - Future enhancement, not for MVP

**Status Tracking**:
- `pending` - Not started
- `in-progress` - Currently being worked on
- `complete` - Done and tested
- `blocked` - Waiting for decision or dependency

---

## Domain: Authentication

### Feature: User Registration - CRITICAL
**Description**: Allow new users to create accounts

**Subtasks**:

#### 1. Create registration form UI - CRITICAL
**Status**: pending

**Acceptance Criteria**:
- [ ] Form includes email, password, and confirm password fields
- [ ] Email validation with regex pattern
- [ ] Password minimum 8 characters with requirements shown
- [ ] Password match validation
- [ ] Submit button disabled until all valid
- [ ] Loading state during submission
- [ ] Error messages display inline
- [ ] Responsive design (mobile and desktop)

**User Stories**:
- As a new user, I want to create an account with email and password so that I can access the application

**Technical Notes**:
- Use React Hook Form or similar
- Zod validation schema
- Tailwind CSS for styling

---

#### 2. Implement registration API endpoint - CRITICAL
**Status**: pending

**Acceptance Criteria**:
- [ ] POST /api/auth/register endpoint created
- [ ] Validates email format and uniqueness
- [ ] Hashes password using bcrypt (cost factor 10)
- [ ] Creates user in database
- [ ] Returns 201 on success with user object (excluding password)
- [ ] Returns 400 for validation errors with specific messages
- [ ] Returns 409 if email already exists
- [ ] Rate limited to 5 requests per minute per IP

**Technical Notes**:
- Use Prisma/Drizzle for database operations
- Implement rate limiting middleware
- Log registration attempts for monitoring

---

### Feature: User Login - CRITICAL
**Description**: Allow existing users to authenticate

**Subtasks**:

#### 1. Create login form UI - CRITICAL
**Status**: pending

**Acceptance Criteria**:
- [ ] Form includes email and password fields
- [ ] "Remember me" checkbox
- [ ] "Forgot password" link
- [ ] Link to registration page
- [ ] Client-side validation before submission
- [ ] Loading state during authentication
- [ ] Clear error messages (invalid credentials, account locked, etc.)

**User Stories**:
- As a returning user, I want to log in with my credentials so that I can access my account

---

#### 2. Implement login API endpoint - CRITICAL
**Status**: pending

**Acceptance Criteria**:
- [ ] POST /api/auth/login endpoint created
- [ ] Verifies email exists in database
- [ ] Compares hashed password using bcrypt
- [ ] Generates JWT token with 7-day expiration
- [ ] Sets httpOnly cookie with token
- [ ] Returns 200 with user object on success
- [ ] Returns 401 for invalid credentials
- [ ] Implements account lockout after 5 failed attempts
- [ ] Rate limited to 10 requests per minute

**Technical Notes**:
- Use jose or jsonwebtoken for JWT
- Store failed attempts in Redis or database
- Set secure cookie flags: httpOnly, secure, sameSite

---

### Feature: Password Reset - HIGH
**Description**: Allow users to reset forgotten passwords

**Subtasks**:

#### 1. Create forgot password form - HIGH
**Status**: pending

**Acceptance Criteria**:
- [ ] Single email input field
- [ ] Submit button to send reset link
- [ ] Success message: "If email exists, reset link sent"
- [ ] Rate limited to 3 requests per hour

**User Stories**:
- As a user, I want to request a password reset email so that I can regain access to my account

---

#### 2. Implement password reset email flow - HIGH
**Status**: pending

**Acceptance Criteria**:
- [ ] Generates secure reset token (UUID, expires in 1 hour)
- [ ] Stores token in database with expiration
- [ ] Sends email with reset link containing token
- [ ] Validates token on reset attempt
- [ ] Updates password after validation
- [ ] Invalidates token after use
- [ ] Uses transaction for database updates

**Technical Notes**:
- Use Resend, SendGrid, or AWS SES for emails
- Store hashed token in database
- Background job for email sending

---

## Domain: Purchasing

### Feature: Product Catalog - CRITICAL
**Description**: Display and browse available products

**Subtasks**:

#### 1. Create product listing page - CRITICAL
**Status**: pending

**Acceptance Criteria**:
- [ ] Grid layout showing product cards
- [ ] Each card displays: image, name, price, short description
- [ ] Pagination or infinite scroll (20 items per page)
- [ ] Loading skeleton while fetching
- [ ] Empty state message when no products
- [ ] Clicking card navigates to product detail page
- [ ] Mobile-responsive (1 column) and desktop (3-4 columns)

**User Stories**:
- As a customer, I want to browse products so that I can see what's available

**Technical Notes**:
- Use virtual scrolling for performance
- Cache product list for 5 minutes
- Lazy load images

---

#### 2. Implement product API endpoints - CRITICAL
**Status**: pending

**Acceptance Criteria**:
- [ ] GET /api/products endpoint with pagination (page, limit)
- [ ] Supports filtering by category, price range
- [ ] Supports sorting by name, price, date
- [ ] Returns 200 with products array and metadata
- [ ] Returns 400 for invalid query parameters
- [ ] Response time < 200ms p95

**Technical Notes**:
- Use database indexes on category and price
- Implement query validation schema
- Cache popular queries

---

### Feature: Shopping Cart - HIGH
**Description**: Allow users to manage cart items

**Subtasks**:

#### 1. Create cart UI components - HIGH
**Status**: pending

**Acceptance Criteria**:
- [ ] Cart icon in header showing item count badge
- [ ] Cart drawer/modal for quick access
- [ ] Full cart page with item list
- [ ] Each item shows: image, name, price, quantity controls
- [ ] Remove item button with confirmation
- [ ] Subtotal calculation
- [ ] "Checkout" button
- [ ] Empty cart state with call-to-action

**User Stories**:
- As a customer, I want to view and edit my cart so that I can review items before purchase

---

#### 2. Implement cart state management - HIGH
**Status**: pending

**Acceptance Criteria**:
- [ ] Cart persisted in localStorage
- [ ] Sync cart state across tabs (storage event listener)
- [ ] Add to cart action (with quantity)
- [ ] Remove from cart action
- [ ] Update quantity action
- [ ] Clear cart action
- [ ] Calculate totals (subtotal, tax, shipping)
- [ ] Merge guest cart with user cart on login

**Technical Notes**:
- Use Zustand or Redux for state
- Debounce localStorage writes
- Validate cart integrity on load

---

## Domain: User Management

### Feature: User Profile - HIGH
**Description**: Allow users to view and edit their profile

**Subtasks**:

#### 1. Create profile page UI - HIGH
**Status**: pending

**Acceptance Criteria**:
- [ ] Display user information: name, email, avatar
- [ ] Editable fields: name, bio, location
- [ ] Avatar upload with preview
- [ ] Save button with loading state
- [ ] Success notification on save
- [ ] "Change password" section
- [ ] "Delete account" danger zone

**User Stories**:
- As a user, I want to edit my profile so that I can keep my information up to date

**Technical Notes**:
- Use file upload API for avatar (max 2MB, images only)
- Client-side image optimization before upload
- Confirmation modal for account deletion

---

#### 2. Implement profile API endpoints - HIGH
**Status**: pending

**Acceptance Criteria**:
- [ ] GET /api/user/profile - Returns current user profile
- [ ] PATCH /api/user/profile - Updates profile fields
- [ ] POST /api/user/avatar - Uploads avatar image
- [ ] DELETE /api/user/account - Deletes account (requires confirmation)
- [ ] All endpoints require authentication
- [ ] Returns 401 if not authenticated
- [ ] Validates file type and size for avatar

**Technical Notes**:
- Use S3 or Cloudflare R2 for image storage
- Generate unique filename for avatars
- Soft delete for user accounts
- Log all profile changes

---

### Feature: User Roles - MEDIUM
**Description**: Implement role-based access control

**Subtasks**:

#### 1. Define role system - MEDIUM
**Status**: pending

**Acceptance Criteria**:
- [ ] Database schema for roles (user, admin, moderator)
- [ ] User-role many-to-many relationship
- [ ] Seed default roles in database
- [ ] Utility function to check user role
- [ ] Middleware to protect routes by role
- [ ] Type definitions for role-based permissions

**User Stories**:
- As an admin, I want to have elevated permissions so that I can manage the application
- As a developer, I want role-based access control so that I can secure sensitive features

**Technical Notes**:
- Use enum for role names
- Cache user roles in JWT for fast access
- Create RBAC policy definitions

---

#### 2. Implement role-based UI - MEDIUM
**Status**: pending

**Acceptance Criteria**:
- [ ] Admin dashboard visible only to admins
- [ ] User management page for admins
- [ ] Role assignment interface
- [ ] Permission checks on client side (UI only)
- [ ] Graceful fallback for unauthorized access

**User Stories**:
- As an admin, I want to manage user roles so that I can control access

**Technical Notes**:
- Server-side validation is the source of truth
- Client-side checks only for UI/UX
- Log all role changes

---

## Architecture Notes

### Folder Structure (Optional)

If you have a preferred structure:

```
src/
├── app/              # Next.js app router
├── components/       # React components
│   ├── auth/         # Authentication components
│   ├── product/      # Product components
│   └── cart/         # Cart components
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

1. [All CRITICAL features implemented and tested]
2. [All HIGH priority features implemented or documented]
3. [All tests passing with 80%+ coverage]
4. [No TypeScript errors]
5. [No security vulnerabilities]
6. [Deployed to production]

## Notes

[Any additional context, links, or documentation]

---

## Template Guide

### How to Use This Template

1. **Keep the structure**: Maintain the domains → features → subtasks hierarchy
2. **Be specific**: Write detailed acceptance criteria for each subtask
3. **Think sequentially**: Order subtasks in implementation order
4. **Set priorities**: Use CRITICAL/HIGH/MEDIUM/LOW to guide development
5. **Track progress**: Update status as features are complete

### Example Domain Breakdown

```
Authentication (Domain)
├── User Registration (Feature)
│   ├── Create registration form UI (Subtask) - CRITICAL
│   └── Implement registration API endpoint (Subtask) - CRITICAL
├── User Login (Feature)
│   ├── Create login form UI (Subtask) - CRITICAL
│   └── Implement login API endpoint (Subtask) - CRITICAL
└── Password Reset (Feature)
    ├── Create forgot password form (Subtask) - HIGH
    └── Implement password reset email flow (Subtask) - HIGH
```

### Acceptance Criteria Format

Each subtask should have:
- **Status**: pending → in-progress → complete (or blocked)
- **Checkbox list**: [ ] Specific, testable requirements
- **User stories**: As a [role], I want [feature] so that [benefit]
- **Technical notes**: Implementation details and constraints

### Why This Structure Works

- **Domains** organize work by functional area
- **Features** break domains into user-facing capabilities
- **Subtasks** create implementable units that can be completed in one session
- **Priorities** ensure MVP features are built first
- **Status tracking** enables autonomous development loops

**Tip**: The more detailed your PRODUCT.md, the better Agentful can understand what to build. Include:
- Clear acceptance criteria with checkboxes
- User stories for context
- Technical constraints and notes
- Examples when helpful
