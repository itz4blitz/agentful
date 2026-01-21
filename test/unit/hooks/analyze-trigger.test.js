import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..', '..', '..');
const analyzeTriggerPath = path.join(projectRoot, 'bin/hooks/analyze-trigger.js');

/**
 * Analyze Trigger Hook Tests
 *
 * Tests for bin/hooks/analyze-trigger.js
 * Verifies that the hook correctly identifies files that should trigger
 * /agentful-analyze suggestions and outputs appropriate messages
 *
 * Coverage goals: 100% line, branch, function, and statement coverage
 */

describe('analyze-trigger hook', () => {
  let consoleOutput;
  let exitCode;

  /**
   * Helper function to run the analyze-trigger script with a given FILE env var
   * Captures console output and exit code
   */
  const runAnalyzeTrigger = (filePath) => {
    try {
      const result = execSync(`FILE="${filePath}" node "${analyzeTriggerPath}"`, {
        encoding: 'utf-8',
        cwd: projectRoot,
        stdio: 'pipe'
      });
      return { output: result, exitCode: 0 };
    } catch (error) {
      // execSync throws on non-zero exit, but exit(0) is success
      // We need to capture stdout even on "error"
      return { output: error.stdout || '', exitCode: error.status || 0 };
    }
  };

  describe('no FILE environment variable', () => {
    it('should exit silently when FILE is not set', () => {
      const result = runAnalyzeTrigger('');
      expect(result.exitCode).toBe(0);
      expect(result.output.trim()).toBe('');
    });

    it('should exit silently when FILE is undefined', () => {
      try {
        const result = execSync(`node "${analyzeTriggerPath}"`, {
          encoding: 'utf-8',
          cwd: projectRoot,
          stdio: 'pipe',
          env: { ...process.env, FILE: undefined }
        });
        expect(result.trim()).toBe('');
      } catch (error) {
        expect(error.status).toBe(0);
        expect((error.stdout || '').trim()).toBe('');
      }
    });
  });

  describe('package.json', () => {
    it('should suggest analyze for root package.json', () => {
      const result = runAnalyzeTrigger('package.json');
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('Dependencies changed in package.json');
      expect(result.output).toContain('/agentful-analyze');
    });

    it('should suggest analyze for package.json in project subdirectory', () => {
      const result = runAnalyzeTrigger('src/package.json');
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('Dependencies changed in package.json');
    });

    it('should NOT suggest analyze for package.json in node_modules', () => {
      const result = runAnalyzeTrigger('node_modules/some-package/package.json');
      expect(result.exitCode).toBe(0);
      expect(result.output.trim()).toBe('');
    });

    it('should NOT suggest analyze for package.json in nested node_modules', () => {
      const result = runAnalyzeTrigger('packages/backend/node_modules/express/package.json');
      expect(result.exitCode).toBe(0);
      expect(result.output.trim()).toBe('');
    });
  });

  describe('architecture.json', () => {
    it('should suggest analyze for architecture.json', () => {
      const result = runAnalyzeTrigger('architecture.json');
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('Architecture configuration updated');
      expect(result.output).toContain('/agentful-analyze');
    });

    it('should suggest analyze for architecture.json in subdirectory', () => {
      const result = runAnalyzeTrigger('.agentful/architecture.json');
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('Architecture configuration updated');
    });
  });

  describe('TypeScript and JavaScript configs', () => {
    it('should suggest analyze for tsconfig.json', () => {
      const result = runAnalyzeTrigger('tsconfig.json');
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('TypeScript/JavaScript configuration changed');
      expect(result.output).toContain('/agentful-analyze');
    });

    it('should suggest analyze for jsconfig.json', () => {
      const result = runAnalyzeTrigger('jsconfig.json');
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('TypeScript/JavaScript configuration changed');
      expect(result.output).toContain('/agentful-analyze');
    });

    it('should suggest analyze for tsconfig.json in subdirectory', () => {
      const result = runAnalyzeTrigger('packages/frontend/tsconfig.json');
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('TypeScript/JavaScript configuration changed');
    });
  });

  describe('environment templates', () => {
    it('should suggest analyze for .env.example', () => {
      const result = runAnalyzeTrigger('.env.example');
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('Environment template changed');
      expect(result.output).toContain('/agentful-analyze');
    });

    it('should suggest analyze for .env.sample', () => {
      const result = runAnalyzeTrigger('.env.sample');
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('Environment template changed');
      expect(result.output).toContain('/agentful-analyze');
    });

    it('should suggest analyze for .env.example in subdirectory', () => {
      const result = runAnalyzeTrigger('backend/.env.example');
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('Environment template changed');
    });
  });

  describe('Docker configuration', () => {
    it('should suggest analyze for docker-compose.yml', () => {
      const result = runAnalyzeTrigger('docker-compose.yml');
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('Docker configuration changed');
      expect(result.output).toContain('/agentful-analyze');
    });

    it('should suggest analyze for Dockerfile', () => {
      const result = runAnalyzeTrigger('Dockerfile');
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('Docker configuration changed');
      expect(result.output).toContain('/agentful-analyze');
    });

    it('should suggest analyze for docker-compose.yml in subdirectory', () => {
      const result = runAnalyzeTrigger('services/api/docker-compose.yml');
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('Docker configuration changed');
    });

    it('should suggest analyze for Dockerfile in subdirectory', () => {
      const result = runAnalyzeTrigger('apps/web/Dockerfile');
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('Docker configuration changed');
    });
  });

  describe('build configuration files', () => {
    describe('Vite configs', () => {
      it('should suggest analyze for vite.config.js', () => {
        const result = runAnalyzeTrigger('vite.config.js');
        expect(result.exitCode).toBe(0);
        expect(result.output).toContain('Build configuration changed');
        expect(result.output).toContain('/agentful-analyze');
      });

      it('should suggest analyze for vite.config.ts', () => {
        const result = runAnalyzeTrigger('vite.config.ts');
        expect(result.exitCode).toBe(0);
        expect(result.output).toContain('Build configuration changed');
      });

      it('should suggest analyze for vite.config.mjs', () => {
        const result = runAnalyzeTrigger('vite.config.mjs');
        expect(result.exitCode).toBe(0);
        expect(result.output).toContain('Build configuration changed');
      });

      it('should suggest analyze for vite.config.cjs', () => {
        const result = runAnalyzeTrigger('vite.config.cjs');
        expect(result.exitCode).toBe(0);
        expect(result.output).toContain('Build configuration changed');
      });

      it('should suggest analyze for vite config in subdirectory', () => {
        const result = runAnalyzeTrigger('packages/ui/vite.config.ts');
        expect(result.exitCode).toBe(0);
        expect(result.output).toContain('Build configuration changed');
      });
    });

    describe('Webpack configs', () => {
      it('should suggest analyze for webpack.config.js', () => {
        const result = runAnalyzeTrigger('webpack.config.js');
        expect(result.exitCode).toBe(0);
        expect(result.output).toContain('Build configuration changed');
        expect(result.output).toContain('/agentful-analyze');
      });

      it('should suggest analyze for webpack.config.ts', () => {
        const result = runAnalyzeTrigger('webpack.config.ts');
        expect(result.exitCode).toBe(0);
        expect(result.output).toContain('Build configuration changed');
      });

      it('should suggest analyze for webpack.config.prod.js', () => {
        const result = runAnalyzeTrigger('webpack.config.prod.js');
        expect(result.exitCode).toBe(0);
        expect(result.output).toContain('Build configuration changed');
      });

      it('should suggest analyze for webpack config in subdirectory', () => {
        const result = runAnalyzeTrigger('apps/admin/webpack.config.js');
        expect(result.exitCode).toBe(0);
        expect(result.output).toContain('Build configuration changed');
      });
    });

    describe('Rollup configs', () => {
      it('should suggest analyze for rollup.config.js', () => {
        const result = runAnalyzeTrigger('rollup.config.js');
        expect(result.exitCode).toBe(0);
        expect(result.output).toContain('Build configuration changed');
        expect(result.output).toContain('/agentful-analyze');
      });

      it('should suggest analyze for rollup.config.ts', () => {
        const result = runAnalyzeTrigger('rollup.config.ts');
        expect(result.exitCode).toBe(0);
        expect(result.output).toContain('Build configuration changed');
      });

      it('should suggest analyze for rollup.config.mjs', () => {
        const result = runAnalyzeTrigger('rollup.config.mjs');
        expect(result.exitCode).toBe(0);
        expect(result.output).toContain('Build configuration changed');
      });
    });

    describe('Next.js configs', () => {
      it('should suggest analyze for next.config.js', () => {
        const result = runAnalyzeTrigger('next.config.js');
        expect(result.exitCode).toBe(0);
        expect(result.output).toContain('Build configuration changed');
        expect(result.output).toContain('/agentful-analyze');
      });

      it('should suggest analyze for next.config.mjs', () => {
        const result = runAnalyzeTrigger('next.config.mjs');
        expect(result.exitCode).toBe(0);
        expect(result.output).toContain('Build configuration changed');
      });

      it('should suggest analyze for next.config.ts', () => {
        const result = runAnalyzeTrigger('next.config.ts');
        expect(result.exitCode).toBe(0);
        expect(result.output).toContain('Build configuration changed');
      });
    });
  });

  describe('files that should NOT trigger suggestions', () => {
    it('should exit silently for regular JavaScript files', () => {
      const result = runAnalyzeTrigger('src/index.js');
      expect(result.exitCode).toBe(0);
      expect(result.output.trim()).toBe('');
    });

    it('should exit silently for TypeScript files', () => {
      const result = runAnalyzeTrigger('src/components/Button.tsx');
      expect(result.exitCode).toBe(0);
      expect(result.output.trim()).toBe('');
    });

    it('should exit silently for CSS files', () => {
      const result = runAnalyzeTrigger('src/styles/main.css');
      expect(result.exitCode).toBe(0);
      expect(result.output.trim()).toBe('');
    });

    it('should exit silently for markdown files', () => {
      const result = runAnalyzeTrigger('README.md');
      expect(result.exitCode).toBe(0);
      expect(result.output.trim()).toBe('');
    });

    it('should exit silently for .env files (not templates)', () => {
      const result = runAnalyzeTrigger('.env');
      expect(result.exitCode).toBe(0);
      expect(result.output.trim()).toBe('');
    });

    it('should exit silently for .env.local', () => {
      const result = runAnalyzeTrigger('.env.local');
      expect(result.exitCode).toBe(0);
      expect(result.output.trim()).toBe('');
    });

    it('should exit silently for .env.production', () => {
      const result = runAnalyzeTrigger('.env.production');
      expect(result.exitCode).toBe(0);
      expect(result.output.trim()).toBe('');
    });

    it('should exit silently for JSON files that are not special configs', () => {
      const result = runAnalyzeTrigger('data/config.json');
      expect(result.exitCode).toBe(0);
      expect(result.output.trim()).toBe('');
    });

    it('should exit silently for YAML files that are not docker-compose', () => {
      const result = runAnalyzeTrigger('.github/workflows/test.yml');
      expect(result.exitCode).toBe(0);
      expect(result.output.trim()).toBe('');
    });

    it('should exit silently for lock files', () => {
      const result = runAnalyzeTrigger('package-lock.json');
      expect(result.exitCode).toBe(0);
      expect(result.output.trim()).toBe('');
    });

    it('should exit silently for config files that are not build configs', () => {
      const result = runAnalyzeTrigger('eslint.config.js');
      expect(result.exitCode).toBe(0);
      expect(result.output.trim()).toBe('');
    });

    it('should exit silently for babel.config.js', () => {
      const result = runAnalyzeTrigger('babel.config.js');
      expect(result.exitCode).toBe(0);
      expect(result.output.trim()).toBe('');
    });

    it('should exit silently for jest.config.js', () => {
      const result = runAnalyzeTrigger('jest.config.js');
      expect(result.exitCode).toBe(0);
      expect(result.output.trim()).toBe('');
    });
  });

  describe('edge cases with file paths', () => {
    it('should handle absolute paths correctly', () => {
      const result = runAnalyzeTrigger('/home/user/project/package.json');
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('Dependencies changed in package.json');
    });

    it('should handle paths with spaces', () => {
      const result = runAnalyzeTrigger('my project/vite.config.js');
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('Build configuration changed');
    });

    it('should handle deeply nested paths', () => {
      const result = runAnalyzeTrigger('a/b/c/d/e/f/g/tsconfig.json');
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('TypeScript/JavaScript configuration changed');
    });

    it('should handle paths with forward slashes', () => {
      const result = runAnalyzeTrigger('C:/Users/dev/project/Dockerfile');
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('Docker configuration changed');
    });

    it('should handle paths with special characters', () => {
      const result = runAnalyzeTrigger('project-123/sub_dir/next.config.js');
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('Build configuration changed');
    });
  });

  describe('console output validation', () => {
    it('should output correct message for package.json', () => {
      const result = runAnalyzeTrigger('package.json');
      expect(result.output).toMatch(/Dependencies changed in package\.json\. Consider running \/agentful-analyze/);
    });

    it('should output correct message for architecture.json', () => {
      const result = runAnalyzeTrigger('architecture.json');
      expect(result.output).toMatch(/Architecture configuration updated\. Run \/agentful-analyze/);
    });

    it('should output correct message for tsconfig.json', () => {
      const result = runAnalyzeTrigger('tsconfig.json');
      expect(result.output).toMatch(/TypeScript\/JavaScript configuration changed\. Consider running \/agentful-analyze/);
    });

    it('should output correct message for .env.example', () => {
      const result = runAnalyzeTrigger('.env.example');
      expect(result.output).toMatch(/Environment template changed\. Consider running \/agentful-analyze/);
    });

    it('should output correct message for docker-compose.yml', () => {
      const result = runAnalyzeTrigger('docker-compose.yml');
      expect(result.output).toMatch(/Docker configuration changed\. Consider running \/agentful-analyze/);
    });

    it('should output correct message for vite.config.js', () => {
      const result = runAnalyzeTrigger('vite.config.js');
      expect(result.output).toMatch(/Build configuration changed\. Consider running \/agentful-analyze/);
    });
  });

  describe('case sensitivity', () => {
    it('should be case-sensitive for filenames', () => {
      const result = runAnalyzeTrigger('Package.json');
      expect(result.exitCode).toBe(0);
      expect(result.output.trim()).toBe('');
    });

    it('should be case-sensitive for Dockerfile', () => {
      const result = runAnalyzeTrigger('dockerfile');
      expect(result.exitCode).toBe(0);
      expect(result.output.trim()).toBe('');
    });

    it('should be case-sensitive for config patterns', () => {
      const result = runAnalyzeTrigger('Vite.Config.js');
      expect(result.exitCode).toBe(0);
      expect(result.output.trim()).toBe('');
    });
  });

  describe('comprehensive branch coverage', () => {
    it('should cover all switch cases', () => {
      const testCases = [
        'package.json',
        'architecture.json',
        'tsconfig.json',
        'jsconfig.json',
        '.env.example',
        '.env.sample',
        'docker-compose.yml',
        'Dockerfile'
      ];

      testCases.forEach(file => {
        const result = runAnalyzeTrigger(file);
        expect(result.exitCode).toBe(0);
        expect(result.output.trim()).not.toBe('');
      });
    });

    it('should cover all build config patterns', () => {
      const testCases = [
        'vite.config.js',
        'webpack.config.js',
        'rollup.config.js',
        'next.config.js'
      ];

      testCases.forEach(file => {
        const result = runAnalyzeTrigger(file);
        expect(result.exitCode).toBe(0);
        expect(result.output).toContain('Build configuration changed');
      });
    });

    it('should cover the default case (no match)', () => {
      const result = runAnalyzeTrigger('random-file.txt');
      expect(result.exitCode).toBe(0);
      expect(result.output.trim()).toBe('');
    });
  });
});
