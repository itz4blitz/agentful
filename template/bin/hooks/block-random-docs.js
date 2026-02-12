#!/usr/bin/env node

/**
 * Block Random Documentation Hook
 *
 * Prevents creation of random markdown files outside of allowed directories.
 *
 * Configuration:
 * - Set AGENTFUL_ALLOW_RANDOM_DOCS=true to disable this hook
 * - Edit allowed patterns below to customize
 *
 * Allowed markdown locations (default):
 * - docs/pages/*.mdx (Vocs/documentation site)
 * - README.md, CONTRIBUTING.md, CHANGELOG.md (root project docs)
 * - .claude/agents/*.md (agent definitions)
 * - .claude/skills/*\/SKILL.md (skill documentation)
 * - .claude/product/**\/*.md (product specifications)
 * - template/**\/*.md (template files)
 *
 * Blocked:
 * - Random *.md files in project root
 * - Documentation in lib/, src/, test/ directories
 * - Any ad-hoc "summary", "guide", "notes" files
 */

const path = require('path');
const fs = require('fs');

// Check if hook is disabled via environment variable
if (process.env.AGENTFUL_ALLOW_RANDOM_DOCS === 'true') {
  process.exit(0);
}

// Get file path from environment (set by Claude Code hooks)
const filePath = process.env.FILE || '';

// Only check markdown files
if (!filePath.endsWith('.md') && !filePath.endsWith('.mdx')) {
  process.exit(0);
}

// Normalize path
const normalizedPath = path.normalize(filePath);

// Always allowed patterns (agentful-specific)
// These don't require the directory to exist
const ALWAYS_ALLOWED = [
  /^(README|CONTRIBUTING|CHANGELOG|LICENSE)\.md$/,  // Root project docs
  /^\.claude\/agents\/[^\/]+\.md$/,            // Agent definitions
  /^\.claude\/skills\/[^\/]+\/SKILL\.md$/,     // Skill docs
  /^\.claude\/product\/.*\.md$/,               // Product specs
  /^\.agentful\/.*\.md$/                       // Internal agentful state docs (rare)
];

// Conditional patterns (only allowed if parent directory exists)
// This prevents creating docs/pages/foo.mdx if docs/ doesn't exist
const CONDITIONAL_PATTERNS = [
  { pattern: /^docs\/pages\/.*\.mdx$/, dir: 'docs' },        // Vocs site (only if docs/ exists)
  { pattern: /^docs\/.*\.md$/, dir: 'docs' },                 // General docs (only if docs/ exists)
  { pattern: /^documentation\/.*\.md$/, dir: 'documentation' }, // Alt docs dir
  { pattern: /^wiki\/.*\.md$/, dir: 'wiki' },                 // Wiki (if exists)
  { pattern: /^guides\/.*\.md$/, dir: 'guides' }              // Guides (if exists)
];

// Check always-allowed patterns first
let isAllowed = ALWAYS_ALLOWED.some(pattern => pattern.test(normalizedPath));

// Check conditional patterns (only if parent directory exists)
if (!isAllowed) {
  for (const { pattern, dir } of CONDITIONAL_PATTERNS) {
    if (pattern.test(normalizedPath)) {
      try {
        const dirPath = path.join(process.cwd(), dir);
        const stat = fs.statSync(dirPath);
        if (stat.isDirectory()) {
          isAllowed = true;
          break;
        }
      } catch (error) {
        // Directory doesn't exist, pattern not allowed
      }
    }
  }
}

if (!isAllowed) {
  console.error(`
❌ BLOCKED: Random markdown file creation

File: ${filePath}

This hook prevents creation of ad-hoc markdown files to keep your codebase clean.

Always allowed:
  ✅ README.md, CONTRIBUTING.md, CHANGELOG.md, LICENSE.md
  ✅ .claude/agents/*.md (agent definitions)
  ✅ .claude/skills/*/SKILL.md (skill documentation)
  ✅ .claude/product/**/*.md (product specifications)

Allowed if directory exists:
  📁 docs/*.md, docs/pages/*.mdx (requires docs/ directory)
  📁 documentation/*.md (requires documentation/ directory)
  📁 wiki/*.md (requires wiki/ directory)
  📁 guides/*.md (requires guides/ directory)

To bypass this hook:
  1. Temporary: export AGENTFUL_ALLOW_RANDOM_DOCS=true
  2. Permanent: Remove hook from .claude/settings.json
  3. Add to allowed: Edit bin/hooks/block-random-docs.js

Instead of creating random markdown files:
  - Update .claude/product/ for product requirements
  - Update CLAUDE.md for development instructions
  - Create docs/ directory first if you want documentation
`);
  process.exit(1);
}

// File is allowed
process.exit(0);
