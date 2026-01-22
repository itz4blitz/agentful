import { describe, it, expect } from 'vitest';
import { checkAnalyzeTrigger } from '../../../bin/hooks/analyze-trigger.js';

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

  describe('no FILE environment variable', () => {
    it('should return null when FILE is not set', () => {
      const result = checkAnalyzeTrigger('');
      expect(result).toBeNull();
    });

    it('should return null when FILE is undefined', () => {
      const result = checkAnalyzeTrigger(undefined);
      expect(result).toBeNull();
    });

    it('should return null when FILE is null', () => {
      const result = checkAnalyzeTrigger(null);
      expect(result).toBeNull();
    });
  });

  describe('package.json', () => {
    it('should suggest analyze for root package.json', () => {
      const result = checkAnalyzeTrigger('package.json');
      expect(result).toContain('Dependencies changed in package.json');
      expect(result).toContain('/agentful-analyze');
    });

    it('should suggest analyze for package.json in project subdirectory', () => {
      const result = checkAnalyzeTrigger('src/package.json');
      expect(result).toContain('Dependencies changed in package.json');
    });

    it('should NOT suggest analyze for package.json in node_modules', () => {
      const result = checkAnalyzeTrigger('node_modules/some-package/package.json');
      expect(result).toBeNull();
    });

    it('should NOT suggest analyze for package.json in nested node_modules', () => {
      const result = checkAnalyzeTrigger('packages/backend/node_modules/express/package.json');
      expect(result).toBeNull();
    });
  });

  describe('architecture.json', () => {
    it('should suggest analyze for architecture.json', () => {
      const result = checkAnalyzeTrigger('architecture.json');
      expect(result).toContain('Architecture configuration updated');
      expect(result).toContain('/agentful-analyze');
    });

    it('should suggest analyze for architecture.json in subdirectory', () => {
      const result = checkAnalyzeTrigger('.agentful/architecture.json');
      expect(result).toContain('Architecture configuration updated');
    });
  });

  describe('TypeScript and JavaScript configs', () => {
    it('should suggest analyze for tsconfig.json', () => {
      const result = checkAnalyzeTrigger('tsconfig.json');
      expect(result).toContain('TypeScript/JavaScript configuration changed');
      expect(result).toContain('/agentful-analyze');
    });

    it('should suggest analyze for jsconfig.json', () => {
      const result = checkAnalyzeTrigger('jsconfig.json');
      expect(result).toContain('TypeScript/JavaScript configuration changed');
      expect(result).toContain('/agentful-analyze');
    });

    it('should suggest analyze for tsconfig.json in subdirectory', () => {
      const result = checkAnalyzeTrigger('packages/frontend/tsconfig.json');
      expect(result).toContain('TypeScript/JavaScript configuration changed');
    });
  });

  describe('environment templates', () => {
    it('should suggest analyze for .env.example', () => {
      const result = checkAnalyzeTrigger('.env.example');
      expect(result).toContain('Environment template changed');
      expect(result).toContain('/agentful-analyze');
    });

    it('should suggest analyze for .env.sample', () => {
      const result = checkAnalyzeTrigger('.env.sample');
      expect(result).toContain('Environment template changed');
      expect(result).toContain('/agentful-analyze');
    });

    it('should suggest analyze for .env.example in subdirectory', () => {
      const result = checkAnalyzeTrigger('backend/.env.example');
      expect(result).toContain('Environment template changed');
    });
  });

  describe('Docker configuration', () => {
    it('should suggest analyze for docker-compose.yml', () => {
      const result = checkAnalyzeTrigger('docker-compose.yml');
      expect(result).toContain('Docker configuration changed');
      expect(result).toContain('/agentful-analyze');
    });

    it('should suggest analyze for Dockerfile', () => {
      const result = checkAnalyzeTrigger('Dockerfile');
      expect(result).toContain('Docker configuration changed');
      expect(result).toContain('/agentful-analyze');
    });

    it('should suggest analyze for docker-compose.yml in subdirectory', () => {
      const result = checkAnalyzeTrigger('services/api/docker-compose.yml');
      expect(result).toContain('Docker configuration changed');
    });

    it('should suggest analyze for Dockerfile in subdirectory', () => {
      const result = checkAnalyzeTrigger('apps/web/Dockerfile');
      expect(result).toContain('Docker configuration changed');
    });
  });

  describe('build configuration files', () => {
    describe('Vite configs', () => {
      it('should suggest analyze for vite.config.js', () => {
        const result = checkAnalyzeTrigger('vite.config.js');
        expect(result).toContain('Build configuration changed');
        expect(result).toContain('/agentful-analyze');
      });

      it('should suggest analyze for vite.config.ts', () => {
        const result = checkAnalyzeTrigger('vite.config.ts');
        expect(result).toContain('Build configuration changed');
      });

      it('should suggest analyze for vite.config.mjs', () => {
        const result = checkAnalyzeTrigger('vite.config.mjs');
        expect(result).toContain('Build configuration changed');
      });

      it('should suggest analyze for vite.config.cjs', () => {
        const result = checkAnalyzeTrigger('vite.config.cjs');
        expect(result).toContain('Build configuration changed');
      });

      it('should suggest analyze for vite config in subdirectory', () => {
        const result = checkAnalyzeTrigger('packages/ui/vite.config.ts');
        expect(result).toContain('Build configuration changed');
      });
    });

    describe('Webpack configs', () => {
      it('should suggest analyze for webpack.config.js', () => {
        const result = checkAnalyzeTrigger('webpack.config.js');
        expect(result).toContain('Build configuration changed');
        expect(result).toContain('/agentful-analyze');
      });

      it('should suggest analyze for webpack.config.ts', () => {
        const result = checkAnalyzeTrigger('webpack.config.ts');
        expect(result).toContain('Build configuration changed');
      });

      it('should suggest analyze for webpack.config.prod.js', () => {
        const result = checkAnalyzeTrigger('webpack.config.prod.js');
        expect(result).toContain('Build configuration changed');
      });

      it('should suggest analyze for webpack config in subdirectory', () => {
        const result = checkAnalyzeTrigger('apps/admin/webpack.config.js');
        expect(result).toContain('Build configuration changed');
      });
    });

    describe('Rollup configs', () => {
      it('should suggest analyze for rollup.config.js', () => {
        const result = checkAnalyzeTrigger('rollup.config.js');
        expect(result).toContain('Build configuration changed');
        expect(result).toContain('/agentful-analyze');
      });

      it('should suggest analyze for rollup.config.ts', () => {
        const result = checkAnalyzeTrigger('rollup.config.ts');
        expect(result).toContain('Build configuration changed');
      });

      it('should suggest analyze for rollup.config.mjs', () => {
        const result = checkAnalyzeTrigger('rollup.config.mjs');
        expect(result).toContain('Build configuration changed');
      });
    });

    describe('Next.js configs', () => {
      it('should suggest analyze for next.config.js', () => {
        const result = checkAnalyzeTrigger('next.config.js');
        expect(result).toContain('Build configuration changed');
        expect(result).toContain('/agentful-analyze');
      });

      it('should suggest analyze for next.config.mjs', () => {
        const result = checkAnalyzeTrigger('next.config.mjs');
        expect(result).toContain('Build configuration changed');
      });

      it('should suggest analyze for next.config.ts', () => {
        const result = checkAnalyzeTrigger('next.config.ts');
        expect(result).toContain('Build configuration changed');
      });
    });
  });

  describe('files that should NOT trigger suggestions', () => {
    it('should return null for regular JavaScript files', () => {
      const result = checkAnalyzeTrigger('src/index.js');
      expect(result).toBeNull();
    });

    it('should return null for TypeScript files', () => {
      const result = checkAnalyzeTrigger('src/components/Button.tsx');
      expect(result).toBeNull();
    });

    it('should return null for CSS files', () => {
      const result = checkAnalyzeTrigger('src/styles/main.css');
      expect(result).toBeNull();
    });

    it('should return null for markdown files', () => {
      const result = checkAnalyzeTrigger('README.md');
      expect(result).toBeNull();
    });

    it('should return null for .env files (not templates)', () => {
      const result = checkAnalyzeTrigger('.env');
      expect(result).toBeNull();
    });

    it('should return null for .env.local', () => {
      const result = checkAnalyzeTrigger('.env.local');
      expect(result).toBeNull();
    });

    it('should return null for .env.production', () => {
      const result = checkAnalyzeTrigger('.env.production');
      expect(result).toBeNull();
    });

    it('should return null for JSON files that are not special configs', () => {
      const result = checkAnalyzeTrigger('data/config.json');
      expect(result).toBeNull();
    });

    it('should return null for YAML files that are not docker-compose', () => {
      const result = checkAnalyzeTrigger('.github/workflows/test.yml');
      expect(result).toBeNull();
    });

    it('should return null for lock files', () => {
      const result = checkAnalyzeTrigger('package-lock.json');
      expect(result).toBeNull();
    });

    it('should return null for config files that are not build configs', () => {
      const result = checkAnalyzeTrigger('eslint.config.js');
      expect(result).toBeNull();
    });

    it('should return null for babel.config.js', () => {
      const result = checkAnalyzeTrigger('babel.config.js');
      expect(result).toBeNull();
    });

    it('should return null for jest.config.js', () => {
      const result = checkAnalyzeTrigger('jest.config.js');
      expect(result).toBeNull();
    });
  });

  describe('edge cases with file paths', () => {
    it('should handle absolute paths correctly', () => {
      const result = checkAnalyzeTrigger('/home/user/project/package.json');
      expect(result).toContain('Dependencies changed in package.json');
    });

    it('should handle paths with spaces', () => {
      const result = checkAnalyzeTrigger('my project/vite.config.js');
      expect(result).toContain('Build configuration changed');
    });

    it('should handle deeply nested paths', () => {
      const result = checkAnalyzeTrigger('a/b/c/d/e/f/g/tsconfig.json');
      expect(result).toContain('TypeScript/JavaScript configuration changed');
    });

    it('should handle paths with forward slashes', () => {
      const result = checkAnalyzeTrigger('C:/Users/dev/project/Dockerfile');
      expect(result).toContain('Docker configuration changed');
    });

    it('should handle paths with special characters', () => {
      const result = checkAnalyzeTrigger('project-123/sub_dir/next.config.js');
      expect(result).toContain('Build configuration changed');
    });
  });

  describe('console output validation', () => {
    it('should output correct message for package.json', () => {
      const result = checkAnalyzeTrigger('package.json');
      expect(result).toMatch(/Dependencies changed in package\.json\. Consider running \/agentful-analyze/);
    });

    it('should output correct message for architecture.json', () => {
      const result = checkAnalyzeTrigger('architecture.json');
      expect(result).toMatch(/Architecture configuration updated\. Run \/agentful-analyze/);
    });

    it('should output correct message for tsconfig.json', () => {
      const result = checkAnalyzeTrigger('tsconfig.json');
      expect(result).toMatch(/TypeScript\/JavaScript configuration changed\. Consider running \/agentful-analyze/);
    });

    it('should output correct message for .env.example', () => {
      const result = checkAnalyzeTrigger('.env.example');
      expect(result).toMatch(/Environment template changed\. Consider running \/agentful-analyze/);
    });

    it('should output correct message for docker-compose.yml', () => {
      const result = checkAnalyzeTrigger('docker-compose.yml');
      expect(result).toMatch(/Docker configuration changed\. Consider running \/agentful-analyze/);
    });

    it('should output correct message for vite.config.js', () => {
      const result = checkAnalyzeTrigger('vite.config.js');
      expect(result).toMatch(/Build configuration changed\. Consider running \/agentful-analyze/);
    });
  });

  describe('case sensitivity', () => {
    it('should be case-sensitive for filenames', () => {
      const result = checkAnalyzeTrigger('Package.json');
      expect(result).toBeNull();
    });

    it('should be case-sensitive for Dockerfile', () => {
      const result = checkAnalyzeTrigger('dockerfile');
      expect(result).toBeNull();
    });

    it('should be case-sensitive for config patterns', () => {
      const result = checkAnalyzeTrigger('Vite.Config.js');
      expect(result).toBeNull();
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
        const result = checkAnalyzeTrigger(file);
        expect(result).not.toBeNull();
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
        const result = checkAnalyzeTrigger(file);
        expect(result).toContain('Build configuration changed');
      });
    });

    it('should cover the default case (no match)', () => {
      const result = checkAnalyzeTrigger('random-file.txt');
      expect(result).toBeNull();
    });
  });
});
