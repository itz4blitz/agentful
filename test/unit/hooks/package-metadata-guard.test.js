import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawnSync, execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..', '..', '..');
const hookPath = path.join(projectRoot, 'bin', 'hooks', 'package-metadata-guard.js');

describe('package-metadata-guard hook', () => {
  let testDir;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'package-metadata-guard-'));
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  async function writePackageJson(content) {
    await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify(content, null, 2), 'utf8');
  }

  function initGit(owner = 'octocat', repo = 'demo') {
    execSync('git init -q', { cwd: testDir, stdio: 'ignore' });
    execSync(`git remote add origin https://github.com/${owner}/${repo}.git`, { cwd: testDir, stdio: 'ignore' });
  }

  function runHook(file = 'package.json', toolName = 'Edit') {
    return spawnSync('node', [hookPath], {
      cwd: testDir,
      encoding: 'utf8',
      env: {
        ...process.env,
        FILE: file,
        TOOL_NAME: toolName
      }
    });
  }

  it('allows valid repository metadata', async () => {
    initGit('octocat', 'demo');
    await writePackageJson({
      name: 'demo',
      repository: {
        type: 'git',
        url: 'https://github.com/octocat/demo.git'
      }
    });

    const result = runHook();
    expect(result.status).toBe(0);
  });

  it('blocks repository.type changes away from git', async () => {
    initGit('octocat', 'demo');
    await writePackageJson({
      name: 'demo',
      repository: {
        type: 'module',
        url: 'https://github.com/octocat/demo.git'
      }
    });

    const result = runHook();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('repository.type is "module"');
  });

  it('blocks ownership drift to itz4blitz for non-itz4blitz repos', async () => {
    initGit('octocat', 'demo');
    await writePackageJson({
      name: 'demo',
      repository: {
        type: 'git',
        url: 'https://github.com/itz4blitz/demo.git'
      }
    });

    const result = runHook();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('repository.url points to "itz4blitz"');
  });

  it('allows itz4blitz ownership when origin owner is itz4blitz', async () => {
    initGit('itz4blitz', 'demo');
    await writePackageJson({
      name: 'demo',
      repository: {
        type: 'git',
        url: 'https://github.com/itz4blitz/demo.git'
      }
    });

    const result = runHook();
    expect(result.status).toBe(0);
  });

  it('ignores non-package.json files', async () => {
    initGit('octocat', 'demo');
    const result = runHook('README.md', 'Edit');
    expect(result.status).toBe(0);
  });
});
