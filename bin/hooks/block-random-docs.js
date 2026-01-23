#!/usr/bin/env node

/**
 * Block Random Documentation Hook
 *
 * Prevents creation of random markdown files outside of allowed directories.
 *
 * Allowed markdown locations:
 * - docs/pages/*.mdx (Vocs documentation)
 * - README.md, CONTRIBUTING.md, CHANGELOG.md (root project docs)
 * - .claude/agents/*.md (agent definitions)
 * - .claude/skills/*\/SKILL.md (skill documentation)
 * - .claude/product/**\/*.md (product specifications)
 * - template/**\/*.md (template files)
 * - examples/**\/*.md (example documentation)
 *
 * Blocked:
 * - Random *.md files in project root
 * - Documentation in lib/, src/, test/ directories
 * - Any ad-hoc "summary", "guide", "notes" files
 */

import path from 'path';
import fs from 'fs';

// Get file path from environment (set by Claude Code hooks)
const filePath = process.env.FILE || '';

// Only check markdown files
if (!filePath.endsWith('.md') && !filePath.endsWith('.mdx')) {
  process.exit(0);
}

// Normalize path
const normalizedPath = path.normalize(filePath);

// Allowed patterns (regex)
const ALLOWED_PATTERNS = [
  /^docs\/pages\/.*\.mdx$/,                    // Vocs docs
  /^(README|CONTRIBUTING|CHANGELOG)\.md$/,     // Root project docs
  /^\.claude\/agents\/[^\/]+\.md$/,            // Agent definitions
  /^\.claude\/skills\/[^\/]+\/SKILL\.md$/,     // Skill docs
  /^\.claude\/product\/.*\.md$/,               // Product specs
  /^template\/.*\.md$/,                        // Template files
  /^examples\/.*\.md$/,                        // Examples
  /^\.agentful\/.*\.md$/                       // Internal agentful state docs (rare)
];

// Check if file matches any allowed pattern
const isAllowed = ALLOWED_PATTERNS.some(pattern => pattern.test(normalizedPath));

if (!isAllowed) {
  console.error(`
❌ BLOCKED: Random markdown file creation

File: ${filePath}

Allowed locations:
  - docs/pages/*.mdx (user-facing documentation)
  - README.md, CONTRIBUTING.md, CHANGELOG.md (root project docs)
  - .claude/agents/*.md (agent definitions)
  - .claude/skills/*/SKILL.md (skill documentation)
  - .claude/product/**/*.md (product specifications)

Instead of creating random markdown files:
  1. Update CLAUDE.md for instructions
  2. Update skills for implementation patterns
  3. Update docs/pages/*.mdx for user docs
  4. Update agents for role definitions

Do NOT litter the codebase with ad-hoc documentation files.
`);
  process.exit(1);
}

// File is allowed
process.exit(0);
