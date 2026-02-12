#!/usr/bin/env node

/**
 * Package Metadata Guard Hook
 *
 * Protects package.json metadata from accidental ownership corruption.
 *
 * Catches:
 * - repository.type being changed away from "git"
 * - repository.url being changed to github.com/itz4blitz/* in repos owned by someone else
 *
 * Run: PostToolUse (Write|Edit)
 * Action: Exit non-zero so the agent corrects the change immediately.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const AGENTFUL_OWNER = 'itz4blitz';

function getOriginOwner() {
  try {
    const remote = execSync('git config --get remote.origin.url', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();

    if (!remote) return null;

    const httpsMatch = remote.match(/github\.com[:/]+([^/]+)\/[^/]+(?:\.git)?$/i);
    if (httpsMatch?.[1]) {
      return httpsMatch[1].toLowerCase();
    }

    return null;
  } catch {
    return null;
  }
}

function resolveFilePath(filePath) {
  if (!filePath) return null;
  return path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
}

function isPackageJsonTarget(filePath) {
  if (!filePath) return false;
  const normalized = filePath.replace(/\\/g, '/');
  return path.basename(normalized) === 'package.json' && !normalized.includes('/node_modules/');
}

function inspectPackageMetadata(packageJsonPath, originOwner) {
  const issues = [];

  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  } catch {
    return issues;
  }

  if (!pkg.repository || typeof pkg.repository !== 'object') {
    return issues;
  }

  const repoType = pkg.repository.type;
  if (typeof repoType === 'string' && repoType.trim().toLowerCase() !== 'git') {
    issues.push(`repository.type is "${repoType}" (expected "git")`);
  }

  const repoUrl = pkg.repository.url;
  if (typeof repoUrl === 'string') {
    const ownerInUrl = repoUrl.match(/github\.com[:/]+([^/]+)\//i)?.[1]?.toLowerCase();
    if (ownerInUrl === AGENTFUL_OWNER && originOwner && originOwner !== AGENTFUL_OWNER) {
      issues.push(`repository.url points to "${AGENTFUL_OWNER}" but git remote owner is "${originOwner}"`);
    }
  }

  return issues;
}

function main() {
  const filePath = process.env.FILE || '';
  const toolName = process.env.TOOL_NAME || '';

  if (toolName !== 'Write' && toolName !== 'Edit') {
    process.exit(0);
  }

  if (!isPackageJsonTarget(filePath)) {
    process.exit(0);
  }

  const absolutePath = resolveFilePath(filePath);
  if (!absolutePath || !fs.existsSync(absolutePath)) {
    process.exit(0);
  }

  const originOwner = getOriginOwner();
  const issues = inspectPackageMetadata(absolutePath, originOwner);

  if (issues.length === 0) {
    process.exit(0);
  }

  console.error('\n❌ BLOCKED: Suspicious package.json metadata change\n');
  console.error(`File: ${filePath}`);
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  console.error('\nExpected behavior: preserve project ownership metadata and keep repository.type as "git".');
  console.error('Action: restore the package.json metadata to match the current project repository.\n');

  process.exit(1);
}

main();
