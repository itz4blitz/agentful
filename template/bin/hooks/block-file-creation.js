#!/usr/bin/env node

/**
 * Block File Creation Hook
 *
 * Prevents creation of arbitrary files outside of permitted directories and types.
 * Stops agents from littering the codebase with random JSON, TXT, LOG files.
 *
 * Allowed file creation:
 * - Source code files (.js, .ts, .jsx, .tsx, .py, .go, .rs, .java, .c, .cpp, .h, .cs, .rb, .php, etc.)
 * - Config files in project root (package.json, tsconfig.json, vite.config.js, etc.)
 * - Test files in test directories
 * - Documentation in approved locations (see block-random-docs hook)
 *
 * Blocked:
 * - Random .json files outside of root config
 * - Random .txt, .log, .tmp files anywhere
 * - State snapshots outside .agentful/
 * - Arbitrary data files in src/, lib/, test/ directories
 *
 * Permitted directories for non-code artifacts:
 * - .agentful/ - Runtime state (with validation)
 * - fixtures/ - Test fixtures
 * - mocks/ - Test mocks
 * - public/assets/ - Static assets
 * - docs/ - Documentation (if directory exists)
 */

import path from 'path';
import fs from 'fs';

// Get file path from environment (set by Claude Code hooks)
const filePath = process.env.FILE || '';
const toolName = process.env.TOOL_NAME || '';

// Only intercept Write tool calls
if (toolName !== 'Write') {
  process.exit(0);
}

// Normalize path
const normalizedPath = path.normalize(filePath);

// Source code extensions (always allowed)
const SOURCE_CODE_EXTENSIONS = [
  '.js', '.mjs', '.cjs',
  '.ts', '.mts', '.cts',
  '.jsx', '.tsx',
  '.py', '.pyi',
  '.go',
  '.rs',
  '.java',
  '.c', '.cpp', '.cc', '.cxx', '.h', '.hpp',
  '.cs',
  '.rb',
  '.php',
  '.swift',
  '.kt', '.kts',
  '.scala',
  '.ex', '.exs',
  '.clj', '.cljs',
  '.sh', '.bash',
  '.sql',
  '.graphql', '.gql',
  '.proto',
  '.vue', '.svelte',
  '.css', '.scss', '.sass', '.less',
  '.html', '.htm',
  '.xml', '.yaml', '.yml',
  '.toml', '.ini', '.env.example',
  '.gitignore', '.dockerignore', '.eslintignore'
];

// Check if file is source code
const ext = path.extname(normalizedPath);
if (SOURCE_CODE_EXTENSIONS.includes(ext)) {
  process.exit(0);
}

// Markdown files are handled by block-random-docs hook
if (ext === '.md' || ext === '.mdx') {
  process.exit(0);
}

// Root-level config files (explicitly allowed)
const ROOT_CONFIG_FILES = [
  'package.json',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'bun.lockb',
  'tsconfig.json',
  'jsconfig.json',
  'vite.config.js',
  'vite.config.ts',
  'vitest.config.js',
  'vitest.config.ts',
  'vitest.setup.js',
  'vitest.setup.ts',
  'vitest.global-teardown.js',
  'jest.config.js',
  'jest.config.ts',
  'next.config.js',
  'next.config.mjs',
  'nuxt.config.js',
  'nuxt.config.ts',
  'svelte.config.js',
  'astro.config.mjs',
  'tailwind.config.js',
  'tailwind.config.ts',
  'postcss.config.js',
  'eslint.config.js',
  '.eslintrc.json',
  '.eslintrc.js',
  '.prettierrc',
  '.prettierrc.json',
  'prettier.config.js',
  'turbo.json',
  'nx.json',
  'lerna.json',
  'Dockerfile',
  'docker-compose.yml',
  'docker-compose.yaml',
  '.dockerignore',
  '.gitignore',
  '.env.example',
  'vercel.json',
  'railway.json',
  'render.yaml',
  'fly.toml'
];

// Check if file is a root config file
const fileName = path.basename(normalizedPath);
if (ROOT_CONFIG_FILES.includes(fileName) && !normalizedPath.includes('/')) {
  process.exit(0);
}

// Allowed directory patterns for non-code files
const ALLOWED_DIRECTORY_PATTERNS = [
  /^\.agentful\//,                       // Runtime state
  /^\.claude\//,                         // Claude configuration
  /^fixtures\//,                         // Test fixtures
  /^test\/fixtures\//,
  /^tests\/fixtures\//,
  /^__fixtures__\//,
  /^mocks\//,                           // Test mocks
  /^test\/mocks\//,
  /^tests\/mocks\//,
  /^__mocks__\//,
  /^public\/assets\//,                  // Static assets
  /^public\/data\//,
  /^static\/assets\//,
  /^static\/data\//,
  /^docs\/assets\//,                    // Documentation assets
  /^\.github\//,                        // GitHub config
  /^\.vscode\//,                        // VSCode config
  /^config\//,                          // Config directory
  /^\.config\//,
  /^dist\//,                            // Build output (warn but allow)
  /^build\//,
  /^out\//
];

// Check if file is in allowed directory
const isInAllowedDir = ALLOWED_DIRECTORY_PATTERNS.some(pattern => pattern.test(normalizedPath));

if (isInAllowedDir) {
  // Additional validation for .agentful/ files
  if (normalizedPath.startsWith('.agentful/')) {
    const agentfulFiles = [
      '.agentful/state.json',
      '.agentful/completion.json',
      '.agentful/decisions.json',
      '.agentful/architecture.json',
      '.agentful/conversation-state.json',
      '.agentful/conversation-history.json',
      '.agentful/agent-metrics.json',
      '.agentful/metadata.json'
    ];

    if (agentfulFiles.includes(normalizedPath)) {
      process.exit(0);
    }

    // Block random files in .agentful/
    console.error(`
❌ BLOCKED: Arbitrary file creation in .agentful/

File: ${filePath}

Allowed .agentful/ files:
  - state.json (current work phase)
  - completion.json (feature progress)
  - decisions.json (pending decisions)
  - architecture.json (tech stack)
  - conversation-state.json (conversation context)
  - conversation-history.json (message history)
  - agent-metrics.json (agent lifecycle hooks)
  - metadata.json (version tracking)

Do NOT create random state snapshots or debug files in .agentful/.
`);
    process.exit(1);
  }

  // Allow other permitted directories
  process.exit(0);
}

// Risky file extensions (almost never allowed outside approved directories)
const RISKY_EXTENSIONS = [
  '.json',
  '.txt',
  '.log',
  '.tmp',
  '.temp',
  '.bak',
  '.backup',
  '.old',
  '.data',
  '.dat',
  '.bin',
  '.dump',
  '.out'
];

if (RISKY_EXTENSIONS.includes(ext)) {
  console.error(`
❌ BLOCKED: Random file creation

File: ${filePath}
Type: ${ext} file

This file type is not allowed outside of approved directories.

Allowed locations for ${ext} files:
  ${ext === '.json' ? '- Project root (config files like package.json, tsconfig.json)' : ''}
  - .agentful/ (runtime state, validation required)
  - fixtures/ (test fixtures)
  - mocks/ (test mocks)
  - public/assets/ (static assets)
  ${ext === '.json' ? '- test/**/fixtures/ (test data)' : ''}

Source code files (.js, .ts, .py, etc.) can be created anywhere.

Instead of creating random ${ext} files:
  1. Use proper source code files
  2. Store test data in fixtures/
  3. Store config in root (package.json, tsconfig.json)
  4. Store runtime state in .agentful/ (validated files only)

Do NOT litter the codebase with arbitrary data files.
`);
  process.exit(1);
}

// Unknown file type - warn but allow (might be a legitimate file)
console.warn(`
⚠️  WARNING: Creating file with uncommon extension

File: ${filePath}
Extension: ${ext || '(no extension)'}

This file type is not explicitly allowed or blocked.
If this is a legitimate file, you can proceed.
If this is a random artifact, please reconsider.
`);

// Allow with warning
process.exit(0);
