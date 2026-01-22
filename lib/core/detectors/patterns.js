import path from 'path';
import fs from 'fs/promises';

/**
 * Pattern Detector
 *
 * Detects code patterns and architectural styles:
 * - Component patterns (React, Vue, etc.)
 * - API patterns (REST, GraphQL, RPC)
 * - Database patterns (SQL, NoSQL, ORM)
 * - Test patterns (unit, integration, e2e)
 * - Authentication patterns (JWT, OAuth, sessions)
 */

/**
 * Detect component patterns
 *
 * @param {string[]} files - Array of file paths
 * @param {string} projectRoot - Absolute path to project root
 * @returns {Promise<Object>} Component pattern detection result
 */
export async function detectComponentPatterns(files, projectRoot) {
  const componentFiles = files.filter(file =>
    /\.(jsx|tsx|vue|svelte)$/.test(file) ||
    file.includes('/components/') ||
    file.includes('/ui/')
  );

  if (componentFiles.length === 0) {
    return { detected: false };
  }

  const examples = componentFiles.slice(0, 5);
  const patterns = {
    functional: 0,
    class: 0,
    hooks: 0
  };

  // Sample a few files to detect patterns
  for (const file of examples.slice(0, 3)) {
    try {
      const filePath = path.join(projectRoot, file);
      const content = await fs.readFile(filePath, 'utf-8');

      if (/export\s+default\s+function|const\s+\w+\s*=\s*\(\)/.test(content)) {
        patterns.functional++;
      }
      if (/class\s+\w+\s+extends/.test(content)) {
        patterns.class++;
      }
      if (/use[A-Z]\w+/.test(content)) {
        patterns.hooks++;
      }
    } catch (error) {
      // Skip files that can't be read
    }
  }

  return {
    detected: true,
    count: componentFiles.length,
    examples: examples.map(f => path.basename(f)),
    style: patterns.functional > patterns.class ? 'functional' : 'class',
    usesHooks: patterns.hooks > 0
  };
}

/**
 * Detect API patterns
 *
 * @param {string[]} files - Array of file paths
 * @param {string} projectRoot - Absolute path to project root
 * @returns {Promise<Object>} API pattern detection result
 */
export async function detectAPIPatterns(files, projectRoot) {
  const apiFiles = files.filter(file =>
    file.includes('/api/') ||
    file.includes('/routes/') ||
    file.includes('/controllers/') ||
    file.includes('/endpoints/')
  );

  if (apiFiles.length === 0) {
    return { detected: false };
  }

  const patterns = {
    rest: 0,
    graphql: 0,
    rpc: 0
  };

  // Check for GraphQL files
  const hasGraphQL = files.some(file =>
    file.endsWith('.graphql') ||
    file.endsWith('.gql') ||
    file.includes('schema.') ||
    file.includes('resolvers')
  );
  if (hasGraphQL) patterns.graphql++;

  // Check for RPC/tRPC
  const hasRPC = files.some(file =>
    file.includes('trpc') ||
    file.includes('.proto') ||
    file.includes('grpc')
  );
  if (hasRPC) patterns.rpc++;

  // Default to REST if API files exist
  if (apiFiles.length > 0) patterns.rest++;

  // Determine pattern directories
  const apiDirs = new Set();
  for (const file of apiFiles) {
    const dir = path.dirname(file);
    const parts = dir.split('/');
    if (parts.includes('api')) {
      apiDirs.add(parts.slice(0, parts.indexOf('api') + 1).join('/'));
    }
  }

  return {
    detected: true,
    pattern: Array.from(apiDirs)[0] || 'api/',
    count: apiFiles.length,
    type: patterns.graphql > 0 ? 'GraphQL' : patterns.rpc > 0 ? 'RPC' : 'REST',
    examples: apiFiles.slice(0, 3).map(f => path.basename(f))
  };
}

/**
 * Detect database patterns
 *
 * @param {string[]} files - Array of file paths
 * @param {string} projectRoot - Absolute path to project root
 * @returns {Promise<Object>} Database pattern detection result
 */
export async function detectDatabasePatterns(files, projectRoot) {
  const dbFiles = files.filter(file =>
    file.includes('/models/') ||
    file.includes('/entities/') ||
    file.includes('/schema') ||
    file.includes('/migrations/') ||
    file.includes('prisma/') ||
    file.includes('database/')
  );

  const patterns = {
    orm: null,
    migrations: false,
    type: 'unknown'
  };

  // Check for ORM
  if (files.some(file => file.includes('prisma/schema.prisma'))) {
    patterns.orm = 'Prisma';
    patterns.type = 'SQL';
  } else if (files.some(file => file.includes('drizzle.config'))) {
    patterns.orm = 'Drizzle';
    patterns.type = 'SQL';
  } else if (files.some(file => file.includes('typeorm') || file.endsWith('.entity.ts'))) {
    patterns.orm = 'TypeORM';
    patterns.type = 'SQL';
  } else if (files.some(file => file.includes('sequelize'))) {
    patterns.orm = 'Sequelize';
    patterns.type = 'SQL';
  } else if (files.some(file => file.includes('mongoose'))) {
    patterns.orm = 'Mongoose';
    patterns.type = 'NoSQL';
  }

  // Check for migrations
  patterns.migrations = files.some(file =>
    file.includes('/migrations/') ||
    file.includes('migrate')
  );

  if (dbFiles.length === 0 && !patterns.orm) {
    return { detected: false };
  }

  return {
    detected: true,
    orm: patterns.orm,
    type: patterns.type,
    migrations: patterns.migrations,
    files: dbFiles.length,
    examples: dbFiles.slice(0, 3).map(f => path.basename(f))
  };
}

/**
 * Detect test patterns
 *
 * @param {string[]} files - Array of file paths
 * @param {string} projectRoot - Absolute path to project root
 * @returns {Promise<Object>} Test pattern detection result
 */
export async function detectTestPatterns(files, projectRoot) {
  const testFiles = files.filter(file =>
    /\.(test|spec)\.(js|ts|jsx|tsx)$/.test(file) ||
    file.includes('/tests/') ||
    file.includes('/__tests__/') ||
    file.includes('/test/')
  );

  if (testFiles.length === 0) {
    return { detected: false };
  }

  const patterns = {
    unit: 0,
    integration: 0,
    e2e: 0
  };

  // Categorize tests by directory
  for (const file of testFiles) {
    if (file.includes('/unit/') || file.includes('.unit.')) {
      patterns.unit++;
    } else if (file.includes('/integration/') || file.includes('.integration.')) {
      patterns.integration++;
    } else if (file.includes('/e2e/') || file.includes('.e2e.') || file.includes('cypress/') || file.includes('playwright/')) {
      patterns.e2e++;
    } else {
      // Default to unit tests
      patterns.unit++;
    }
  }

  // Detect test framework from file content
  let framework = 'unknown';
  try {
    const sampleFile = path.join(projectRoot, testFiles[0]);
    const content = await fs.readFile(sampleFile, 'utf-8');

    if (content.includes('vitest') || content.includes('describe.only')) {
      framework = 'vitest';
    } else if (content.includes('jest') || content.includes('@jest')) {
      framework = 'jest';
    } else if (content.includes('mocha') || content.includes('chai')) {
      framework = 'mocha';
    } else if (content.includes('cypress')) {
      framework = 'cypress';
    } else if (content.includes('playwright')) {
      framework = 'playwright';
    } else if (/describe\(|it\(|test\(/.test(content)) {
      framework = 'jest'; // Default assumption
    }
  } catch (error) {
    // Can't read file, framework remains unknown
  }

  return {
    detected: true,
    framework,
    count: testFiles.length,
    types: {
      unit: patterns.unit,
      integration: patterns.integration,
      e2e: patterns.e2e
    },
    coverage: files.some(file => file.includes('coverage/')) || files.some(file => file.includes('.coverage'))
  };
}

/**
 * Detect authentication patterns
 *
 * @param {string[]} files - Array of file paths
 * @param {string} projectRoot - Absolute path to project root
 * @returns {Promise<Object>} Auth pattern detection result
 */
export async function detectAuthPatterns(files, projectRoot) {
  const authFiles = files.filter(file =>
    file.includes('/auth/') ||
    file.includes('authentication') ||
    file.includes('login') ||
    file.includes('session') ||
    file.includes('jwt') ||
    file.includes('oauth')
  );

  if (authFiles.length === 0) {
    return { detected: false };
  }

  const patterns = {
    jwt: false,
    oauth: false,
    sessions: false,
    nextAuth: false
  };

  // Check for specific auth patterns
  patterns.jwt = authFiles.some(file =>
    file.includes('jwt') || file.includes('token')
  );

  patterns.oauth = authFiles.some(file =>
    file.includes('oauth') || file.includes('passport')
  );

  patterns.sessions = authFiles.some(file =>
    file.includes('session')
  );

  patterns.nextAuth = files.some(file =>
    file.includes('next-auth') || file.includes('[...nextauth]')
  );

  return {
    detected: true,
    methods: Object.entries(patterns)
      .filter(([_, detected]) => detected)
      .map(([method]) => method),
    files: authFiles.length,
    examples: authFiles.slice(0, 3).map(f => path.basename(f))
  };
}

/**
 * Detect all patterns in project
 *
 * @param {string[]} files - Array of file paths
 * @param {string} projectRoot - Absolute path to project root
 * @returns {Promise<Object>} All detected patterns
 */
export async function detectPatterns(files, projectRoot) {
  const [components, api, database, tests, auth] = await Promise.all([
    detectComponentPatterns(files, projectRoot),
    detectAPIPatterns(files, projectRoot),
    detectDatabasePatterns(files, projectRoot),
    detectTestPatterns(files, projectRoot),
    detectAuthPatterns(files, projectRoot)
  ]);

  return {
    components,
    api,
    database,
    tests,
    auth
  };
}

export default {
  detectPatterns,
  detectComponentPatterns,
  detectAPIPatterns,
  detectDatabasePatterns,
  detectTestPatterns,
  detectAuthPatterns
};
