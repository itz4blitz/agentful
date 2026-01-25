import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateHooksConfig } from './presets.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = path.join(__dirname, '..', 'template');
const CLAUDE_TEMPLATE_DIR = path.join(__dirname, '..', 'template', '.claude');
const HOOKS_DIR = path.join(__dirname, '..', 'bin', 'hooks');
const PACKAGE_ROOT = path.join(__dirname, '..');

/**
 * Initialize agentful in a target project directory
 * @param {string} targetDir - Target project directory
 * @param {Object} config - Configuration (optional)
 * @param {string[]} config.agents - Array of agent names to install
 * @param {string[]} config.skills - Array of skill names to install
 * @param {string[]} config.hooks - Array of hook identifiers to configure
 * @param {string[]} config.gates - Array of quality gate identifiers
 * @param {Object} config.techStack - Tech stack configuration
 * @returns {Promise<{success: boolean, files: string[]}>}
 */
export async function initProject(targetDir, config = null) {
  const createdFiles = [];

  try {
    // Ensure target directory exists
    await fs.access(targetDir);

    // Read package version
    const packageJsonPath = path.join(PACKAGE_ROOT, 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
    const version = packageJson.version;

    // 1. Copy .claude/ directory (agents, skills, commands) from template
    const claudeTargetDir = path.join(targetDir, '.claude');

    try {
      await fs.access(CLAUDE_TEMPLATE_DIR);

      if (config) {
        // Selective installation based on config
        await copySelectiveComponents(CLAUDE_TEMPLATE_DIR, claudeTargetDir, targetDir, config, version);
        createdFiles.push('.claude/ (selective)');
      } else {
        // Full installation (backward compatible)
        await copyDirectoryWithTracking(CLAUDE_TEMPLATE_DIR, claudeTargetDir, targetDir, '.claude', version);
        createdFiles.push('.claude/');
      }
    } catch {
      // .claude template directory doesn't exist in package, skip
    }

    // Copy hook scripts
    try {
      await fs.access(HOOKS_DIR);
      const targetHooksDir = path.join(targetDir, 'bin', 'hooks');
      await copyDirectoryWithTracking(HOOKS_DIR, targetHooksDir, targetDir, 'bin/hooks', version);
      createdFiles.push('bin/hooks/');
    } catch {
      console.log('Warning: Hook scripts not found, skipping');
    }

    // 2. Copy CLAUDE.md template
    const claudeMdSource = path.join(TEMPLATE_DIR, 'CLAUDE.md');
    const claudeMdTarget = path.join(targetDir, 'CLAUDE.md');

    try {
      await fs.access(claudeMdSource);
      await fs.copyFile(claudeMdSource, claudeMdTarget);

      // CLAUDE.md copied

      createdFiles.push('CLAUDE.md');
    } catch {
      // CLAUDE.md template doesn't exist, skip
    }

    // 3. Create .agentful/ directory with state files
    const agentfulDir = path.join(targetDir, '.agentful');
    await fs.mkdir(agentfulDir, { recursive: true });
    createdFiles.push('.agentful/');

    // Create state.json (runtime state for orchestrator)
    const stateFile = path.join(agentfulDir, 'state.json');
    const initialState = {
      version: '1.0',
      current_task: null,
      current_phase: 'idle',
      iterations: 0,
      last_updated: new Date().toISOString(),
      blocked_on: []
    };
    await fs.writeFile(stateFile, JSON.stringify(initialState, null, 2));
    createdFiles.push('.agentful/state.json');

    // Create completion.json (feature progress tracking)
    const completionFile = path.join(agentfulDir, 'completion.json');
    const initialCompletion = {
      features: {},
      gates: {
        tests_passing: false,
        no_type_errors: false,
        no_dead_code: false,
        coverage_80: false,
        security_clean: false
      },
      overall_progress: 0
    };
    await fs.writeFile(completionFile, JSON.stringify(initialCompletion, null, 2));
    createdFiles.push('.agentful/completion.json');

    // Create decisions.json (pending and resolved decisions)
    const decisionsFile = path.join(agentfulDir, 'decisions.json');
    const initialDecisions = {
      pending: [],
      resolved: []
    };
    await fs.writeFile(decisionsFile, JSON.stringify(initialDecisions, null, 2));
    createdFiles.push('.agentful/decisions.json');

    // Conversation state for natural language interface
    const conversationState = {
      current_phase: 'idle',
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

    // Conversation history - Full schema matching TypeScript types
    const now = new Date().toISOString();
    const conversationHistory = {
      _comment: 'Agentful Conversation History State - Tracks all interactions, context, and user preferences',
      _doc: 'This file maintains the complete conversation history with the Agentful CLI.',
      _schema_version: '1.0',

      version: '1.0',
      schema: 'conversation-history',

      session: {
        id: null,
        started_at: null,
        last_updated: null,
        message_count: 0,
        active: false,
        mode: 'interactive'
      },

      conversation: {
        messages: [],
        summary: null,
        key_topics: [],
        user_goals: []
      },

      context: {
        current_feature: null,
        current_phase: null,
        current_agent: null,
        last_action: null,
        last_action_time: null,
        active_files: [],
        active_branch: null
      },

      state_integration: {
        _comment: 'References to external state files - read these files for current state',
        state_file: '.agentful/state.json',
        completion_file: '.agentful/completion.json',
        decisions_file: '.agentful/decisions.json'
      },

      product_context: {
        structure: 'flat',
        current_feature_path: null,
        domain: null,
        all_features: [],
        feature_dependencies: {}
      },

      user: {
        preferences: {
          verbosity: 'normal',
          auto_approve: false,
          show_thinking: false,
          save_intermediate: false,
          confirmation_style: 'explicit',
          error_handling: 'interactive',
          output_format: 'markdown'
        },
        goals: [],
        constraints: [],
        avoidances: [],
        tech_preferences: [],
        architecture_notes: []
      },

      agents: {
        active: null,
        history: []
      },

      skills_invoked: {
        conversation: { count: 0, last_invoked: null },
        product: { count: 0, last_invoked: null },
        architecture: { count: 0, last_invoked: null },
        development: { count: 0, last_invoked: null },
        testing: { count: 0, last_invoked: null },
        documentation: { count: 0, last_invoked: null },
        review: { count: 0, last_invoked: null }
      },

      metadata: {
        created_at: now,
        created_by: 'agentful-cli',
        environment: {
          platform: process.platform,
          node_version: process.version,
          agentful_version: version
        },
        git_info: {
          branch: null,
          commit: null,
          remote: null
        },
        project_root: targetDir
      }
    };

    await fs.writeFile(
      path.join(agentfulDir, 'conversation-history.json'),
      JSON.stringify(conversationHistory, null, 2)
    );
    createdFiles.push('.agentful/conversation-history.json');

    // Agent metrics for lifecycle hooks
    const agentMetrics = {
      invocations: {},
      last_invocation: null,
      feature_hooks: []
    };

    await fs.writeFile(
      path.join(agentfulDir, 'agent-metrics.json'),
      JSON.stringify(agentMetrics, null, 2)
    );
    createdFiles.push('.agentful/agent-metrics.json');

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
 * Selectively copy components based on configuration
 * @param {string} src - Source directory
 * @param {string} dest - Destination directory
 * @param {string} targetDir - Project root directory
 * @param {Object} config - Configuration
 * @param {string} version - Package version
 */
async function copySelectiveComponents(src, dest, targetDir, config, version) {
  // Ensure orchestrator is always included
  if (!config.agents.includes('orchestrator')) {
    config.agents.unshift('orchestrator');
  }

  // Create base .claude directory
  await fs.mkdir(dest, { recursive: true });

  // 1. Copy selected agents
  const agentsSourceDir = path.join(src, 'agents');
  const agentsTargetDir = path.join(dest, 'agents');
  await fs.mkdir(agentsTargetDir, { recursive: true });

  for (const agentName of config.agents) {
    const agentFile = `${agentName}.md`;
    const sourcePath = path.join(agentsSourceDir, agentFile);
    const targetPath = path.join(agentsTargetDir, agentFile);

    try {
      await fs.copyFile(sourcePath, targetPath);
    } catch (error) {
      console.warn(`Warning: Agent ${agentName} not found, skipping`);
    }
  }

  // 2. Copy selected skills
  const skillsSourceDir = path.join(src, 'skills');
  const skillsTargetDir = path.join(dest, 'skills');
  await fs.mkdir(skillsTargetDir, { recursive: true });

  for (const skillName of config.skills) {
    const skillDir = path.join(skillsSourceDir, skillName);
    const targetSkillDir = path.join(skillsTargetDir, skillName);

    try {
      await copyDirectoryWithTracking(
        skillDir,
        targetSkillDir,
        targetDir,
        `.claude/skills/${skillName}`,
        version
      );
    } catch (error) {
      console.warn(`Warning: Skill ${skillName} not found, skipping`);
    }
  }

  // 3. Copy all commands (always include core commands)
  const commandsSourceDir = path.join(src, 'commands');
  const commandsTargetDir = path.join(dest, 'commands');

  try {
    await copyDirectoryWithTracking(
      commandsSourceDir,
      commandsTargetDir,
      targetDir,
      '.claude/commands',
      version
    );
  } catch (error) {
    console.warn('Warning: Commands directory not found, skipping');
  }

  // 4. Generate settings.json with selected hooks
  const settingsPath = path.join(dest, 'settings.json');

  const settings = {
    includeCoAuthoredBy: false,
    env: {
      ENABLE_TOOL_SEARCH: 'true'
    },
    hooks: generateHooksConfig(config.hooks || []),
    permissions: {
      deny: [
        'Bash(rm -rf /)',
        'Bash(rm -rf ~/.*)',
        'Bash(rm -rf /.*)',
        'Bash(dd:*)',
        'Bash(mkfs:*)'
      ]
    }
  };

  await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));

  // 5. Create product directory (always included)
  const productDir = path.join(dest, 'product');
  await fs.mkdir(productDir, { recursive: true });
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
 * Recursively copy a directory with metadata tracking
 * @param {string} src - Source directory
 * @param {string} dest - Destination directory
 * @param {string} targetDir - Project root directory
 * @param {string} baseRelativePath - Base relative path for tracking (e.g., '.claude', 'bin/hooks')
 * @param {string} version - Package version
 */
export async function copyDirectoryWithTracking(src, dest, targetDir, baseRelativePath, version) {
  // Create destination directory
  await fs.mkdir(dest, { recursive: true });

  // Read source directory
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // Recursively copy subdirectory
      const newBaseRelativePath = path.join(baseRelativePath, entry.name);
      await copyDirectoryWithTracking(srcPath, destPath, targetDir, newBaseRelativePath, version);
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
