import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..', '..');

/**
 * CLI Unit Tests
 *
 * Tests for the agentful CLI wrapper (bin/cli.js)
 * Tests command parsing, version display, and help text
 */

describe('CLI', () => {
  describe('version', () => {
    it('should have a valid version.json file', () => {
      const versionPath = path.join(projectRoot, 'version.json');
      expect(fs.existsSync(versionPath)).toBe(true);

      const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf-8'));
      expect(versionData).toHaveProperty('version');
      expect(typeof versionData.version).toBe('string');
      expect(versionData.version).toMatch(/^\d+\.\d+\.\d+/);
    });

    it('should use semantic versioning format', () => {
      const versionPath = path.join(projectRoot, 'version.json');
      const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf-8'));

      // Semantic versioning: MAJOR.MINOR.PATCH
      const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;
      expect(versionData.version).toMatch(semverRegex);
    });
  });

  describe('package.json', () => {
    it('should have a valid bin entry', () => {
      const packagePath = path.join(projectRoot, 'package.json');
      const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

      expect(packageData).toHaveProperty('bin');
      expect(packageData.bin).toHaveProperty('agentful');
      expect(packageData.bin.agentful).toBe('bin/cli.js');
    });

    it('should specify type as module', () => {
      const packagePath = path.join(projectRoot, 'package.json');
      const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

      expect(packageData.type).toBe('module');
    });

    it('should have required metadata', () => {
      const packagePath = path.join(projectRoot, 'package.json');
      const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

      expect(packageData).toHaveProperty('name');
      expect(packageData).toHaveProperty('description');
      expect(packageData).toHaveProperty('version');
      expect(packageData).toHaveProperty('author');
      expect(packageData).toHaveProperty('license');
    });
  });

  describe('CLI file', () => {
    it('should exist and be executable', () => {
      const cliPath = path.join(projectRoot, 'bin', 'cli.js');
      expect(fs.existsSync(cliPath)).toBe(true);

      const content = fs.readFileSync(cliPath, 'utf-8');
      expect(content.startsWith('#!/usr/bin/env node')).toBe(true);
    });

    it('should import from lib/init.js', () => {
      const cliPath = path.join(projectRoot, 'bin', 'cli.js');
      const content = fs.readFileSync(cliPath, 'utf-8');

      expect(content).toContain("from '../lib/init.js'");
    });

    it('should define color constants', () => {
      const cliPath = path.join(projectRoot, 'bin', 'cli.js');
      const content = fs.readFileSync(cliPath, 'utf-8');

      expect(content).toContain('const colors = {');
      expect(content).toContain('reset:');
      expect(content).toContain('green:');
      expect(content).toContain('red:');
    });

    it('should define main command handler', () => {
      const cliPath = path.join(projectRoot, 'bin', 'cli.js');
      const content = fs.readFileSync(cliPath, 'utf-8');

      expect(content).toContain('async function main()');
      expect(content).toContain('main().catch');
    });

    it('should handle init command', () => {
      const cliPath = path.join(projectRoot, 'bin', 'cli.js');
      const content = fs.readFileSync(cliPath, 'utf-8');

      expect(content).toContain("case 'init':");
      expect(content).toContain('await init()');
    });

    it('should handle status command', () => {
      const cliPath = path.join(projectRoot, 'bin', 'cli.js');
      const content = fs.readFileSync(cliPath, 'utf-8');

      expect(content).toContain("case 'status':");
      expect(content).toContain('showStatus()');
    });

    it('should handle help command', () => {
      const cliPath = path.join(projectRoot, 'bin', 'cli.js');
      const content = fs.readFileSync(cliPath, 'utf-8');

      expect(content).toContain("case 'help':");
      expect(content).toContain('showHelp()');
    });

    it('should handle version command', () => {
      const cliPath = path.join(projectRoot, 'bin', 'cli.js');
      const content = fs.readFileSync(cliPath, 'utf-8');

      expect(content).toContain("case 'version':");
      expect(content).toContain('showVersion()');
    });
  });

  describe('banner and help text', () => {
    it('should define showBanner function', () => {
      const cliPath = path.join(projectRoot, 'bin', 'cli.js');
      const content = fs.readFileSync(cliPath, 'utf-8');

      expect(content).toContain('function showBanner()');
      expect(content).toContain('AGENTFUL');
    });

    it('should define showHelp function', () => {
      const cliPath = path.join(projectRoot, 'bin', 'cli.js');
      const content = fs.readFileSync(cliPath, 'utf-8');

      expect(content).toContain('function showHelp()');
      expect(content).toContain('USAGE:');
      expect(content).toContain('COMMANDS:');
    });

    it('should document all commands in help text', () => {
      const cliPath = path.join(projectRoot, 'bin', 'cli.js');
      const content = fs.readFileSync(cliPath, 'utf-8');

      expect(content).toContain('init');
      expect(content).toContain('status');
      expect(content).toContain('help');
      expect(content).toContain('--version');
    });

    it('should mention Claude Code commands', () => {
      const cliPath = path.join(projectRoot, 'bin', 'cli.js');
      const content = fs.readFileSync(cliPath, 'utf-8');

      expect(content).toContain('/agentful-generate');
      expect(content).toContain('/agentful-start');
      expect(content).toContain('CLAUDE CODE COMMANDS');
    });
  });

  describe('gitignore handling', () => {
    it('should define checkGitignore function', () => {
      const cliPath = path.join(projectRoot, 'bin', 'cli.js');
      const content = fs.readFileSync(cliPath, 'utf-8');

      expect(content).toContain('function checkGitignore()');
      expect(content).toContain('.agentful/');
    });
  });

  describe('error handling', () => {
    it('should have error handling in main function', () => {
      const cliPath = path.join(projectRoot, 'bin', 'cli.js');
      const content = fs.readFileSync(cliPath, 'utf-8');

      expect(content).toContain('main().catch');
      expect(content).toContain('process.exit(1)');
    });

    it('should handle unknown commands', () => {
      const cliPath = path.join(projectRoot, 'bin', 'cli.js');
      const content = fs.readFileSync(cliPath, 'utf-8');

      expect(content).toContain('Unknown command');
      expect(content).toContain('default:');
    });
  });
});
