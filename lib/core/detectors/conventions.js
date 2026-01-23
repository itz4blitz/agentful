import path from 'path';
import fs from 'fs/promises';

/**
 * Convention Detector
 *
 * Extracts coding conventions and style guidelines:
 * - Naming conventions (camelCase, PascalCase, snake_case, kebab-case)
 * - File structure organization (feature-based, layer-based, domain-driven)
 * - Code style (indentation, quotes, semicolons)
 * - Import style (named, default, relative vs absolute)
 */

/**
 * Detect naming conventions from files
 *
 * @param {string[]} files - Array of file paths
 * @returns {Object} Naming convention analysis
 */
export function detectNamingConventions(files) {
  const patterns = {
    camelCase: 0,
    PascalCase: 0,
    'snake_case': 0,
    'kebab-case': 0
  };

  for (const file of files) {
    const basename = path.basename(file, path.extname(file));

    if (/^[a-z][a-zA-Z0-9]*$/.test(basename)) {
      patterns.camelCase++;
    } else if (/^[A-Z][a-zA-Z0-9]*$/.test(basename)) {
      patterns.PascalCase++;
    } else if (/^[a-z][a-z0-9_]*$/.test(basename)) {
      patterns['snake_case']++;
    } else if (/^[a-z][a-z0-9-]*$/.test(basename)) {
      patterns['kebab-case']++;
    }
  }

  // Determine dominant pattern
  const sortedPatterns = Object.entries(patterns)
    .sort(([, a], [, b]) => b - a);

  const totalFiles = files.length;
  const [dominant, count] = sortedPatterns[0];
  const confidence = totalFiles > 0 ? Math.round((count / totalFiles) * 100) : 0;

  return {
    dominant,
    confidence,
    distribution: patterns
  };
}

/**
 * Detect file structure organization
 *
 * @param {string[]} files - Array of file paths
 * @returns {Object} File structure analysis
 */
export function detectFileStructure(files) {
  const indicators = {
    'feature-based': 0,
    'layer-based': 0,
    'domain-driven': 0,
    'atomic': 0
  };

  // Feature-based indicators
  const hasFeatureDirs = files.some(file =>
    file.includes('/features/') || file.match(/\/[a-z]+-feature\//)
  );
  if (hasFeatureDirs) indicators['feature-based'] += 3;

  // Layer-based indicators (controllers, models, views pattern)
  const layers = ['controllers', 'models', 'views', 'services', 'repositories'];
  const layerCount = layers.filter(layer =>
    files.some(file => file.includes(`/${layer}/`))
  ).length;
  indicators['layer-based'] = layerCount;

  // Domain-driven indicators
  const hasDomains = files.some(file =>
    file.includes('/domains/') || file.includes('/domain/')
  );
  const hasAggregates = files.some(file =>
    file.includes('/aggregates/') || file.includes('/entities/')
  );
  if (hasDomains || hasAggregates) {
    indicators['domain-driven'] += 2;
  }

  // Atomic design indicators
  const hasAtoms = files.some(file =>
    file.includes('/atoms/') || file.includes('/molecules/') || file.includes('/organisms/')
  );
  if (hasAtoms) indicators['atomic'] += 3;

  // Determine dominant structure
  const sortedIndicators = Object.entries(indicators)
    .sort(([, a], [, b]) => b - a);

  const [structure, score] = sortedIndicators[0];

  return {
    structure: score > 0 ? structure : 'mixed',
    confidence: Math.min(90, score * 20),
    indicators
  };
}

/**
 * Detect code style conventions from file content
 *
 * @param {string} content - File content to analyze
 * @returns {Object} Code style analysis
 */
export function detectCodeStyle(content) {
  const style = {
    indentation: 'unknown',
    quotes: 'unknown',
    semicolons: 'unknown',
    trailingCommas: 'unknown'
  };

  // Detect indentation
  const lines = content.split('\n');
  let twoSpaces = 0;
  let fourSpaces = 0;
  let tabs = 0;

  for (const line of lines) {
    const match = line.match(/^(\s+)/);
    if (match) {
      const indent = match[1];
      if (indent === '  ') twoSpaces++;
      else if (indent === '    ') fourSpaces++;
      else if (indent.includes('\t')) tabs++;
    }
  }

  if (twoSpaces > fourSpaces && twoSpaces > tabs) {
    style.indentation = '2 spaces';
  } else if (fourSpaces > twoSpaces && fourSpaces > tabs) {
    style.indentation = '4 spaces';
  } else if (tabs > twoSpaces && tabs > fourSpaces) {
    style.indentation = 'tabs';
  }

  // Detect quotes
  const singleQuotes = (content.match(/'\w+'/g) || []).length;
  const doubleQuotes = (content.match(/"\w+"/g) || []).length;
  const backticks = (content.match(/`[^`]+`/g) || []).length;

  if (singleQuotes > doubleQuotes && singleQuotes > backticks) {
    style.quotes = 'single';
  } else if (doubleQuotes > singleQuotes && doubleQuotes > backticks) {
    style.quotes = 'double';
  } else if (backticks > 0) {
    style.quotes = 'template literals preferred';
  }

  // Detect semicolons
  const withSemicolon = (content.match(/;$/gm) || []).length;
  const withoutSemicolon = (content.match(/[^;{}\s]$/gm) || []).length;

  style.semicolons = withSemicolon > withoutSemicolon ? 'required' : 'omitted';

  // Detect trailing commas
  const trailingCommas = (content.match(/,\s*[\]}]/g) || []).length;
  style.trailingCommas = trailingCommas > 5 ? 'preferred' : 'avoided';

  return style;
}

/**
 * Detect import style conventions
 *
 * @param {string} content - File content to analyze
 * @returns {Object} Import style analysis
 */
export function detectImportStyle(content) {
  const style = {
    namedImports: 0,
    defaultImports: 0,
    namespaceImports: 0,
    relativeImports: 0,
    absoluteImports: 0,
    aliasedImports: 0
  };

  const importRegex = /import\s+(?:{[^}]+}|[\w]+|\*\s+as\s+[\w]+)\s+from\s+['"]([^'"]+)['"]/g;
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    const importStatement = match[0];
    const importPath = match[1];

    // Count import types
    if (importStatement.includes('{')) {
      style.namedImports++;
    } else if (importStatement.includes('* as')) {
      style.namespaceImports++;
    } else {
      style.defaultImports++;
    }

    // Count path types
    if (importPath.startsWith('.')) {
      style.relativeImports++;
    } else if (importPath.startsWith('@/') || importPath.startsWith('~/')) {
      style.aliasedImports++;
    } else {
      style.absoluteImports++;
    }
  }

  // Determine preferences
  const total = style.namedImports + style.defaultImports + style.namespaceImports;
  const preference = total > 0 ? {
    importType: style.namedImports > style.defaultImports ? 'named' : 'default',
    pathStyle: style.aliasedImports > style.relativeImports ? 'aliased' :
               style.relativeImports > 0 ? 'relative' : 'absolute'
  } : null;

  return {
    ...style,
    preference
  };
}

/**
 * Detect ESLint/Prettier configuration
 *
 * @param {string[]} files - Array of file paths
 * @param {string} projectRoot - Absolute path to project root
 * @returns {Promise<Object>} Linting configuration
 */
export async function detectLintingConfig(files, projectRoot) {
  const config = {
    eslint: false,
    prettier: false,
    styleGuide: null
  };

  // Check for config files
  const hasEslint = files.some(file =>
    file.endsWith('.eslintrc') ||
    file.endsWith('.eslintrc.js') ||
    file.endsWith('.eslintrc.json') ||
    file.endsWith('eslint.config.js')
  );

  const hasPrettier = files.some(file =>
    file.endsWith('.prettierrc') ||
    file.endsWith('.prettierrc.js') ||
    file.endsWith('.prettierrc.json') ||
    file.endsWith('prettier.config.js')
  );

  config.eslint = hasEslint;
  config.prettier = hasPrettier;

  // Try to detect style guide from package.json
  try {
    const packageJsonPath = path.join(projectRoot, 'package.json');
    const content = await fs.readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(content);

    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    if (allDeps['eslint-config-airbnb']) {
      config.styleGuide = 'airbnb';
    } else if (allDeps['eslint-config-standard']) {
      config.styleGuide = 'standard';
    } else if (allDeps['eslint-config-google']) {
      config.styleGuide = 'google';
    } else if (allDeps['@typescript-eslint/eslint-plugin']) {
      config.styleGuide = 'typescript';
    }
  } catch (error) {
    // Can't read package.json, skip style guide detection
  }

  return config;
}

/**
 * Detect all conventions in project
 *
 * @param {string[]} files - Array of file paths
 * @param {string} projectRoot - Absolute path to project root
 * @returns {Promise<Object>} All detected conventions
 */
export async function detectConventions(files, projectRoot) {
  const naming = detectNamingConventions(files);
  const fileStructure = detectFileStructure(files);
  const linting = await detectLintingConfig(files, projectRoot);

  // Sample a few files for code style analysis
  let codeStyle = null;
  let importStyle = null;

  const sampleFiles = files
    .filter(file => /\.(js|ts|jsx|tsx)$/.test(file))
    .slice(0, 3);

  if (sampleFiles.length > 0) {
    try {
      const samplePath = path.join(projectRoot, sampleFiles[0]);
      const content = await fs.readFile(samplePath, 'utf-8');
      codeStyle = detectCodeStyle(content);
      importStyle = detectImportStyle(content);
    } catch (error) {
      // Can't read sample file, skip style detection
    }
  }

  return {
    naming: naming.dominant,
    namingConfidence: naming.confidence,
    fileStructure: fileStructure.structure,
    structureConfidence: fileStructure.confidence,
    codeStyle,
    importStyle,
    linting
  };
}

export default {
  detectConventions,
  detectNamingConventions,
  detectFileStructure,
  detectCodeStyle,
  detectImportStyle,
  detectLintingConfig
};
