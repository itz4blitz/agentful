import fs from 'fs/promises';
import path from 'path';

/**
 * Framework Detector
 *
 * Detects frameworks and libraries used in the project based on:
 * - package.json dependencies
 * - Import statements
 * - Configuration files
 * - File structure patterns
 */

/**
 * Framework detection rules
 * Maps package names to frameworks
 */
const FRAMEWORK_PACKAGES = {
  // JavaScript/TypeScript frameworks
  'next': { name: 'Next.js', type: 'framework', category: 'web' },
  'react': { name: 'React', type: 'library', category: 'ui' },
  'vue': { name: 'Vue', type: 'framework', category: 'web' },
  'nuxt': { name: 'Nuxt', type: 'framework', category: 'web' },
  'angular': { name: 'Angular', type: 'framework', category: 'web' },
  'svelte': { name: 'Svelte', type: 'framework', category: 'ui' },
  'express': { name: 'Express', type: 'framework', category: 'backend' },
  'fastify': { name: 'Fastify', type: 'framework', category: 'backend' },
  'nestjs': { name: 'NestJS', type: 'framework', category: 'backend' },
  'koa': { name: 'Koa', type: 'framework', category: 'backend' },
  'hapi': { name: 'Hapi', type: 'framework', category: 'backend' },

  // Testing frameworks
  'vitest': { name: 'Vitest', type: 'framework', category: 'testing' },
  'jest': { name: 'Jest', type: 'framework', category: 'testing' },
  'mocha': { name: 'Mocha', type: 'framework', category: 'testing' },
  'jasmine': { name: 'Jasmine', type: 'framework', category: 'testing' },
  'cypress': { name: 'Cypress', type: 'framework', category: 'testing' },
  'playwright': { name: 'Playwright', type: 'framework', category: 'testing' },

  // Build tools
  'vite': { name: 'Vite', type: 'tool', category: 'build' },
  'webpack': { name: 'Webpack', type: 'tool', category: 'build' },
  'rollup': { name: 'Rollup', type: 'tool', category: 'build' },
  'esbuild': { name: 'esbuild', type: 'tool', category: 'build' },
  'parcel': { name: 'Parcel', type: 'tool', category: 'build' },

  // Database/ORM
  'prisma': { name: 'Prisma', type: 'library', category: 'database' },
  'typeorm': { name: 'TypeORM', type: 'library', category: 'database' },
  'sequelize': { name: 'Sequelize', type: 'library', category: 'database' },
  'mongoose': { name: 'Mongoose', type: 'library', category: 'database' },
  'drizzle-orm': { name: 'Drizzle', type: 'library', category: 'database' },

  // Styling
  'tailwindcss': { name: 'Tailwind CSS', type: 'library', category: 'styling' },
  'styled-components': { name: 'Styled Components', type: 'library', category: 'styling' },
  '@emotion/react': { name: 'Emotion', type: 'library', category: 'styling' },
  'sass': { name: 'Sass', type: 'tool', category: 'styling' }
};

/**
 * Configuration files that indicate specific frameworks
 */
const CONFIG_FILES = {
  'next.config.js': 'Next.js',
  'next.config.mjs': 'Next.js',
  'next.config.ts': 'Next.js',
  'nuxt.config.js': 'Nuxt',
  'nuxt.config.ts': 'Nuxt',
  'vue.config.js': 'Vue',
  'angular.json': 'Angular',
  'svelte.config.js': 'Svelte',
  'vite.config.js': 'Vite',
  'vite.config.ts': 'Vite',
  'vitest.config.js': 'Vitest',
  'vitest.config.ts': 'Vitest',
  'jest.config.js': 'Jest',
  'jest.config.ts': 'Jest',
  'playwright.config.js': 'Playwright',
  'playwright.config.ts': 'Playwright',
  'tailwind.config.js': 'Tailwind CSS',
  'tailwind.config.ts': 'Tailwind CSS'
};

/**
 * File structure patterns that indicate frameworks
 */
const STRUCTURE_PATTERNS = {
  'Next.js': ['pages/', 'app/', 'public/'],
  'Nuxt': ['pages/', 'layouts/', 'nuxt.config'],
  'Angular': ['src/app/', 'angular.json'],
  'Vue': ['src/components/', 'src/views/'],
  'Express': ['routes/', 'middleware/'],
  'NestJS': ['src/modules/', 'src/controllers/']
};

/**
 * Detect frameworks from package.json
 *
 * @param {string} projectRoot - Absolute path to project root
 * @returns {Promise<Object[]>} Array of detected frameworks
 */
export async function detectFromPackageJson(projectRoot) {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  const frameworks = [];

  try {
    const content = await fs.readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(content);

    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    for (const [pkg, version] of Object.entries(allDeps)) {
      const framework = FRAMEWORK_PACKAGES[pkg];
      if (framework) {
        frameworks.push({
          name: framework.name,
          version: version.replace(/[\^~]/g, ''),
          type: framework.type,
          category: framework.category,
          confidence: 95,
          source: 'package.json'
        });
      }
    }
  } catch (error) {
    // package.json not found or invalid - not an error, just no data
  }

  return frameworks;
}

/**
 * Detect frameworks from config files
 *
 * @param {string[]} files - Array of file paths
 * @returns {Object[]} Array of detected frameworks
 */
export function detectFromConfigFiles(files) {
  const frameworks = [];
  const seen = new Set();

  for (const file of files) {
    const basename = path.basename(file);
    const frameworkName = CONFIG_FILES[basename];

    if (frameworkName && !seen.has(frameworkName)) {
      seen.add(frameworkName);
      frameworks.push({
        name: frameworkName,
        confidence: 90,
        source: 'config file',
        configFile: basename
      });
    }
  }

  return frameworks;
}

/**
 * Detect frameworks from file structure
 *
 * @param {string[]} files - Array of file paths
 * @returns {Object[]} Array of detected frameworks
 */
export function detectFromStructure(files) {
  const frameworks = [];

  for (const [frameworkName, patterns] of Object.entries(STRUCTURE_PATTERNS)) {
    let matchCount = 0;

    for (const pattern of patterns) {
      const hasPattern = files.some(file =>
        file.startsWith(pattern) || file.includes(`/${pattern}`)
      );
      if (hasPattern) matchCount++;
    }

    if (matchCount > 0) {
      const confidence = Math.min(85, 50 + (matchCount / patterns.length) * 35);
      frameworks.push({
        name: frameworkName,
        confidence: Math.round(confidence),
        source: 'file structure',
        patternsMatched: matchCount,
        patternsTotal: patterns.length
      });
    }
  }

  return frameworks;
}

/**
 * Detect frameworks from import statements
 *
 * @param {string} content - File content to analyze
 * @returns {string[]} Array of imported framework names
 */
export function detectFromImports(content) {
  const imports = new Set();
  const importRegex = /(?:import|require)\s*\(?['"]([^'"]+)['"]\)?/g;

  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    const packageName = importPath.startsWith('@')
      ? importPath.split('/').slice(0, 2).join('/')
      : importPath.split('/')[0];

    if (FRAMEWORK_PACKAGES[packageName]) {
      imports.add(FRAMEWORK_PACKAGES[packageName].name);
    }
  }

  return Array.from(imports);
}

/**
 * Merge and deduplicate framework detections
 *
 * @param {Object[][]} detectionResults - Multiple arrays of detected frameworks
 * @returns {Object[]} Merged and deduplicated frameworks with highest confidence
 */
export function mergeFrameworks(...detectionResults) {
  const frameworkMap = new Map();

  for (const results of detectionResults) {
    for (const framework of results) {
      const existing = frameworkMap.get(framework.name);

      if (!existing || framework.confidence > existing.confidence) {
        frameworkMap.set(framework.name, framework);
      } else if (existing) {
        // Merge sources
        existing.sources = existing.sources || [existing.source];
        if (!existing.sources.includes(framework.source)) {
          existing.sources.push(framework.source);
        }
        // Boost confidence if detected from multiple sources
        existing.confidence = Math.min(98, existing.confidence + 5);
      }
    }
  }

  return Array.from(frameworkMap.values())
    .sort((a, b) => b.confidence - a.confidence);
}

/**
 * Detect all frameworks in project
 *
 * @param {string[]} files - Array of file paths
 * @param {string} projectRoot - Absolute path to project root
 * @returns {Promise<Object[]>} Array of detected frameworks
 */
export async function detectFrameworks(files, projectRoot) {
  const fromPackage = await detectFromPackageJson(projectRoot);
  const fromConfig = detectFromConfigFiles(files);
  const fromStructure = detectFromStructure(files);

  return mergeFrameworks(fromPackage, fromConfig, fromStructure);
}

export default {
  detectFrameworks,
  detectFromPackageJson,
  detectFromConfigFiles,
  detectFromStructure,
  detectFromImports,
  mergeFrameworks
};
