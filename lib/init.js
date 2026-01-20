import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = path.join(__dirname, '..', 'template');
const CLAUDE_DIR = path.join(__dirname, '..', '.claude');
const HOOKS_DIR = path.join(__dirname, '..', 'bin', 'hooks');

/**
 * Initialize agentful in a target project directory
 * @param {string} targetDir - Target project directory
 * @returns {Promise<{success: boolean, files: string[]}>}
 */
export async function initProject(targetDir) {
  const createdFiles = [];

  try {
    // Ensure target directory exists
    await fs.access(targetDir);

    // 1. Copy .claude/ directory (agents, skills, commands)
    const claudeTargetDir = path.join(targetDir, '.claude');

    try {
      await fs.access(CLAUDE_DIR);
      await copyDirectory(CLAUDE_DIR, claudeTargetDir);
      createdFiles.push('.claude/');
    } catch (err) {
      // .claude directory doesn't exist in package, skip
    }

    // Copy hook scripts
    try {
      await fs.access(HOOKS_DIR);
      const targetHooksDir = path.join(targetDir, 'bin', 'hooks');
      await copyDirectory(HOOKS_DIR, targetHooksDir);
      createdFiles.push('bin/hooks/');
    } catch (err) {
      console.log('Warning: Hook scripts not found, skipping');
    }

    // 2. Copy CLAUDE.md template
    const claudeMdSource = path.join(TEMPLATE_DIR, 'CLAUDE.md');
    const claudeMdTarget = path.join(targetDir, 'CLAUDE.md');

    try {
      await fs.access(claudeMdSource);
      await fs.copyFile(claudeMdSource, claudeMdTarget);
      createdFiles.push('CLAUDE.md');
    } catch (err) {
      // CLAUDE.md template doesn't exist, skip
    }

    // 3. Create .agentful/ directory with state files
    const agentfulDir = path.join(targetDir, '.agentful');
    await fs.mkdir(agentfulDir, { recursive: true });
    createdFiles.push('.agentful/');

    // Create state.json
    const stateFile = path.join(agentfulDir, 'state.json');
    const initialState = {
      initialized: new Date().toISOString(),
      version: '1.0.0',
      agents: [],
      skills: []
    };
    await fs.writeFile(stateFile, JSON.stringify(initialState, null, 2));
    createdFiles.push('.agentful/state.json');

    // Create completion.json
    const completionFile = path.join(agentfulDir, 'completion.json');
    const initialCompletion = {
      agents: {},
      skills: {},
      lastUpdated: new Date().toISOString()
    };
    await fs.writeFile(completionFile, JSON.stringify(initialCompletion, null, 2));
    createdFiles.push('.agentful/completion.json');

    // Create decisions.json
    const decisionsFile = path.join(agentfulDir, 'decisions.json');
    const initialDecisions = {
      decisions: [],
      lastUpdated: new Date().toISOString()
    };
    await fs.writeFile(decisionsFile, JSON.stringify(initialDecisions, null, 2));
    createdFiles.push('.agentful/decisions.json');

    // Conversation state for natural language interface
    const conversationState = {
      current_phase: "idle",
      last_message_time: null,
      active_feature: null,
      unresolved_references: [],
      context_history: []
    };

    await fs.writeFile(
      path.join(agentfulDir, 'conversation-state.json'),
      JSON.stringify(conversationState, null, 2)
    );
    createdFiles.push('.agentful/conversation-state.json');

    // Conversation history
    const conversationHistory = {
      messages: [],
      created_at: new Date().toISOString()
    };

    await fs.writeFile(
      path.join(agentfulDir, 'conversation-history.json'),
      JSON.stringify(conversationHistory, null, 2)
    );
    createdFiles.push('.agentful/conversation-history.json');

    // 4. Create .claude/product/ hierarchical structure
    const productDir = path.join(targetDir, '.claude', 'product');
    await fs.mkdir(productDir, { recursive: true });

    // Create basic index.md template
    const indexMdContent = `# Product Specification

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

## Domains

Create domain-specific subdirectories under \`.claude/product/domains/\` to organize your features:

\`\`\`
.claude/product/
├── index.md (this file)
├── README.md
└── domains/
    ├── authentication/
    │   ├── index.md
    │   └── features/
    │       ├── login.md
    │       └── register.md
    └── user-management/
        ├── index.md
        └── features/
            └── profile.md
\`\`\`

See \`.claude/product/README.md\` for detailed structure guidance.

## Architecture Notes

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

**Tip**: The more detailed your product specification, the better agentful can understand what to build. Include:
- Clear acceptance criteria
- User stories for context
- Technical constraints
- Examples when helpful
`;

    const indexMdPath = path.join(productDir, 'index.md');
    await fs.writeFile(indexMdPath, indexMdContent);
    createdFiles.push('.claude/product/index.md');

    // Create README.md explaining the structure
    const readmeMdContent = `# Product Structure Guide

agentful uses a hierarchical product structure to organize features by domain.

## Structure

\`\`\`
.claude/product/
├── index.md              # Product overview (name, description, tech stack)
├── README.md             # This file - documentation about the structure
└── domains/              # Business domains (create as needed)
    ├── authentication/
    │   ├── index.md      # Domain overview
    │   └── features/
    │       ├── login.md
    │       └── register.md
    └── user-management/
        ├── index.md
        └── features/
            └── profile.md
\`\`\`

## Files Explained

### \`index.md\` (Product Level)
- Product name and description
- Tech stack
- High-level goals
- List of domains
- Architecture notes
- Success criteria

### \`domains/{domain-name}/index.md\` (Domain Level)
- Domain description and purpose
- List of features in this domain
- Domain-specific constraints
- Dependencies on other domains

### \`domains/{domain-name}/features/{feature-name}.md\` (Feature Level)
- Feature description
- Priority (CRITICAL, HIGH, MEDIUM, LOW)
- Acceptance criteria (checkboxes)
- User stories
- Technical notes
- Subtasks breakdown

## When to Create a Domain

Create a new domain when you have:
- A distinct business area (e.g., authentication, billing, analytics)
- Multiple related features (e.g., login, register, password reset)
- Shared logic or data models
- Clear boundaries from other domains

**Example domains:**
- \`authentication\` - Login, registration, password reset
- \`user-management\` - Profile, settings, preferences
- \`purchasing\` - Cart, checkout, orders, payments
- \`analytics\` - Dashboards, reports, metrics
- \`content\` - Posts, comments, media uploads

## Example Feature File

\`\`\`markdown
<!-- .claude/product/domains/authentication/features/login.md -->

# Feature: User Login

**Priority**: CRITICAL

**Description**: Allow existing users to authenticate with email and password.

## Acceptance Criteria

- [ ] Login form with email and password fields
- [ ] Client-side validation before submission
- [ ] API endpoint POST /api/auth/login
- [ ] Returns JWT token on success
- [ ] Sets httpOnly cookie with token
- [ ] Returns 401 for invalid credentials
- [ ] Rate limited to 10 requests per minute
- [ ] Account lockout after 5 failed attempts

## User Stories

- As a returning user, I want to log in with my credentials so that I can access my account

## Subtasks

### 1. Create login form UI
**Status**: pending

- [ ] Email and password input fields
- [ ] "Remember me" checkbox
- [ ] "Forgot password" link
- [ ] Loading state during authentication
- [ ] Error message display

### 2. Implement login API endpoint
**Status**: pending

- [ ] Verify email exists in database
- [ ] Compare hashed password using bcrypt
- [ ] Generate JWT token with 7-day expiration
- [ ] Set secure httpOnly cookie
- [ ] Implement rate limiting
- [ ] Track failed login attempts

## Technical Notes

- Use jose or jsonwebtoken for JWT
- Store failed attempts in Redis
- Set cookie flags: httpOnly, secure, sameSite=strict
\`\`\`

## Priority Levels

- **CRITICAL** - Must have for MVP, blocks other features
- **HIGH** - Important for MVP, should include
- **MEDIUM** - Nice to have if time permits
- **LOW** - Future enhancement, not for MVP

## Status Tracking

- \`pending\` - Not started
- \`in-progress\` - Currently being worked on
- \`complete\` - Done and tested
- \`blocked\` - Waiting for decision or dependency

## Getting Started

1. Edit \`index.md\` to describe your product
2. Create domains under \`domains/\` for major functional areas
3. Add features under each domain's \`features/\` directory
4. Run \`/agentful-start\` in Claude Code to begin development

For more information, see the agentful documentation.
`;

    const readmeMdPath = path.join(productDir, 'README.md');
    await fs.writeFile(readmeMdPath, readmeMdContent);
    createdFiles.push('.claude/product/README.md');

    return {
      success: true,
      files: createdFiles
    };
  } catch (error) {
    throw new Error(`Failed to initialize project: ${error.message}`);
  }
}

/**
 * Recursively copy a directory
 * @param {string} src - Source directory
 * @param {string} dest - Destination directory
 */
export async function copyDirectory(src, dest) {
  // Create destination directory
  await fs.mkdir(dest, { recursive: true });

  // Read source directory
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // Recursively copy subdirectory
      await copyDirectory(srcPath, destPath);
    } else {
      // Copy file
      await fs.copyFile(srcPath, destPath);
    }
  }
}

/**
 * Check if project is already initialized
 * @param {string} targetDir - Target project directory
 * @returns {Promise<boolean>}
 */
export async function isInitialized(targetDir) {
  const agentfulDir = path.join(targetDir, '.agentful');
  const stateFile = path.join(agentfulDir, 'state.json');

  try {
    await fs.access(stateFile);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get current state from .agentful/state.json
 * @param {string} targetDir - Target project directory
 * @returns {Promise<Object|null>}
 */
export async function getState(targetDir) {
  const stateFile = path.join(targetDir, '.agentful', 'state.json');

  try {
    const content = await fs.readFile(stateFile, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}
