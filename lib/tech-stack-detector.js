#!/usr/bin/env node

/**
 * Tech Stack Detector
 * Comprehensive technology detection for multiple languages and frameworks
 * Supports: JavaScript, TypeScript, Python, Go, Rust, Java, .NET, Ruby, PHP, and more
 */

import fs from 'fs';
import path from 'path';

/**
 * Language detection patterns
 */
const LANGUAGE_PATTERNS = {
  'JavaScript': {
    extensions: ['.js', '.jsx'],
    dependencies: ['javascript'],
    configFiles: ['package.json']
  },
  'TypeScript': {
    extensions: ['.ts', '.tsx'],
    dependencies: ['typescript'],
    configFiles: ['tsconfig.json', 'jsconfig.json']
  },
  'Python': {
    extensions: ['.py'],
    dependencies: [],
    configFiles: ['requirements.txt', 'pyproject.toml', 'setup.py', 'Pipfile', 'poetry.lock']
  },
  'Go': {
    extensions: ['.go'],
    dependencies: [],
    configFiles: ['go.mod', 'go.sum']
  },
  'Rust': {
    extensions: ['.rs'],
    dependencies: [],
    configFiles: ['Cargo.toml', 'Cargo.lock']
  },
  'Java': {
    extensions: ['.java'],
    dependencies: [],
    configFiles: ['pom.xml', 'build.gradle', 'gradle.properties']
  },
  'C#': {
    extensions: ['.cs'],
    dependencies: [],
    configFiles: ['*.csproj', '*.vbproj', 'project.json']
  },
  'Ruby': {
    extensions: ['.rb'],
    dependencies: [],
    configFiles: ['Gemfile', '*.gemspec']
  },
  'PHP': {
    extensions: ['.php'],
    dependencies: [],
    configFiles: ['composer.json']
  },
  'C++': {
    extensions: ['.cpp', '.cc', '.cxx'],
    dependencies: [],
    configFiles: ['CMakeLists.txt', 'Makefile']
  },
  'Elixir': {
    extensions: ['.ex', '.exs'],
    dependencies: [],
    configFiles: ['mix.exs']
  },
  'Dart': {
    extensions: ['.dart'],
    dependencies: [],
    configFiles: ['pubspec.yaml']
  },
  'Swift': {
    extensions: ['.swift'],
    dependencies: [],
    configFiles: ['Package.swift']
  },
  'Kotlin': {
    extensions: ['.kt', '.kts'],
    dependencies: [],
    configFiles: ['build.gradle.kts']
  },
  'Scala': {
    extensions: ['.scala'],
    dependencies: [],
    configFiles: ['build.sbt']
  },
  'Clojure': {
    extensions: ['.clj', '.cljs'],
    dependencies: [],
    configFiles: ['project.clj', 'deps.edn']
  }
};

/**
 * Framework detection patterns
 */
const FRAMEWORK_PATTERNS = {
  // JavaScript/TypeScript frameworks
  'Next.js': {
    dependencies: ['next', 'next.js'],
    configFiles: ['next.config.js', 'next.config.mjs', 'next.config.ts'],
    language: ['TypeScript', 'JavaScript']
  },
  'React': {
    dependencies: ['react', 'react-dom'],
    configFiles: [],
    language: ['TypeScript', 'JavaScript']
  },
  'Vue': {
    dependencies: ['vue', '@vue/core'],
    configFiles: ['vue.config.js', 'vite.config.js', 'nuxt.config.js'],
    language: ['TypeScript', 'JavaScript']
  },
  'Angular': {
    dependencies: ['@angular/core', '@angular/common'],
    configFiles: ['angular.json'],
    language: ['TypeScript']
  },
  'Svelte': {
    dependencies: ['svelte'],
    configFiles: ['svelte.config.js'],
    language: ['TypeScript', 'JavaScript']
  },
  'Express': {
    dependencies: ['express'],
    configFiles: [],
    language: ['TypeScript', 'JavaScript']
  },
  'NestJS': {
    dependencies: ['@nestjs/common', '@nestjs/core'],
    configFiles: [],
    language: ['TypeScript']
  },
  'Koa': {
    dependencies: ['koa'],
    configFiles: [],
    language: ['TypeScript', 'JavaScript']
  },
  'Fastify': {
    dependencies: ['fastify'],
    configFiles: [],
    language: ['TypeScript', 'JavaScript']
  },
  'Remix': {
    dependencies: ['@remix-run/node', '@remix-run/react'],
    configFiles: [],
    language: ['TypeScript', 'JavaScript']
  },
  'Astro': {
    dependencies: ['astro'],
    configFiles: ['astro.config.js'],
    language: ['TypeScript', 'JavaScript']
  },

  // Python frameworks
  'Django': {
    dependencies: ['django'],
    configFiles: ['settings.py', 'manage.py'],
    language: ['Python']
  },
  'Flask': {
    dependencies: ['flask'],
    configFiles: [],
    language: ['Python']
  },
  'FastAPI': {
    dependencies: ['fastapi', 'starlette'],
    configFiles: [],
    language: ['Python']
  },
  'Tornado': {
    dependencies: ['tornado'],
    configFiles: [],
    language: ['Python']
  },
  'Falcon': {
    dependencies: ['falcon'],
    configFiles: [],
    language: ['Python']
  },
  'Pyramid': {
    dependencies: ['pyramid'],
    configFiles: [],
    language: ['Python']
  },

  // Go frameworks
  'Gin': {
    dependencies: ['gin-gonic/gin', 'github.com/gin-gonic/gin'],
    configFiles: [],
    language: ['Go']
  },
  'Echo': {
    dependencies: ['labstack/echo', 'github.com/labstack/echo'],
    configFiles: [],
    language: ['Go']
  },
  'Fiber': {
    dependencies: ['gofiber/fiber', 'github.com/gofiber/fiber'],
    configFiles: [],
    language: ['Go']
  },

  // Rust frameworks
  'Actix Web': {
    dependencies: ['actix-web'],
    configFiles: [],
    language: ['Rust']
  },
  'Rocket': {
    dependencies: ['rocket'],
    configFiles: [],
    language: ['Rust']
  },
  'Warp': {
    dependencies: ['warp'],
    configFiles: [],
    language: ['Rust']
  },

  // Java frameworks
  'Spring Boot': {
    dependencies: ['spring-boot-starter'],
    configFiles: [],
    language: ['Java']
  },
  'Micronaut': {
    dependencies: ['io.micronaut'],
    configFiles: [],
    language: ['Java']
  },
  'Quarkus': {
    dependencies: ['io.quarkus'],
    configFiles: [],
    language: ['Java']
  },
  'Vert.x': {
    dependencies: ['io.vertx'],
    configFiles: [],
    language: ['Java']
  },
  'Jakarta EE': {
    dependencies: ['jakarta'],
    configFiles: [],
    language: ['Java']
  },

  // .NET frameworks
  'ASP.NET Core': {
    dependencies: ['Microsoft.AspNetCore'],
    configFiles: [],
    language: ['C#']
  },
  'Entity Framework': {
    dependencies: ['Microsoft.EntityFrameworkCore'],
    configFiles: [],
    language: ['C#']
  },

  // Ruby frameworks
  'Rails': {
    dependencies: ['rails'],
    configFiles: ['config/application.rb'],
    language: ['Ruby']
  },
  'Sinatra': {
    dependencies: ['sinatra'],
    configFiles: [],
    language: ['Ruby']
  },
  'Grape': {
    dependencies: ['grape'],
    configFiles: [],
    language: ['Ruby']
  },

  // PHP frameworks
  'Laravel': {
    dependencies: ['laravel/framework'],
    configFiles: [],
    language: ['PHP']
  },
  'Symfony': {
    dependencies: ['symfony'],
    configFiles: [],
    language: ['PHP']
  },
  'Slim': {
    dependencies: ['slim/slim'],
    configFiles: [],
    language: ['PHP']
  },

  // Elixir frameworks
  'Phoenix': {
    dependencies: ['phoenix'],
    configFiles: ['mix.exs'],
    language: ['Elixir']
  },

  // Dart/Flutter
  'Flutter': {
    dependencies: ['flutter'],
    configFiles: [],
    language: ['Dart']
  },
  'Angel': {
    dependencies: ['angel'],
    configFiles: [],
    language: ['Dart']
  },

  // Swift frameworks
  'Vapor': {
    dependencies: ['vapor'],
    configFiles: [],
    language: ['Swift']
  }
};

/**
 * Database detection patterns
 */
const DATABASE_PATTERNS = {
  'PostgreSQL': {
    dependencies: ['pg', 'postgres', 'postgresql', 'pg-promise', 'node-postgres'],
    orm: ['prisma', 'typeorm', 'sequelize', 'knex'],
    configFiles: []
  },
  'MySQL': {
    dependencies: ['mysql', 'mysql2', 'mysqldb'],
    orm: ['prisma', 'typeorm', 'sequelize', 'knex'],
    configFiles: []
  },
  'SQLite': {
    dependencies: ['sqlite3', 'better-sqlite3'],
    orm: ['prisma', 'typeorm', 'sequelize'],
    configFiles: []
  },
  'MongoDB': {
    dependencies: ['mongodb', 'mongoose'],
    orm: ['mongoose', 'mongodb'],
    configFiles: []
  },
  'Redis': {
    dependencies: ['redis', 'ioredis'],
    orm: [],
    configFiles: []
  },
  'DynamoDB': {
    dependencies: ['aws-sdk', '@aws-sdk/client-dynamodb'],
    orm: [],
    configFiles: []
  },
  'Cassandra': {
    dependencies: ['cassandra-driver'],
    orm: [],
    configFiles: []
  },
  'Couchbase': {
    dependencies: ['couchbase'],
    orm: [],
    configFiles: []
  }
};

/**
 * Testing framework detection
 */
const TESTING_PATTERNS = {
  'Jest': {
    dependencies: ['jest', '@jest/globals'],
    configFiles: ['jest.config.js', 'jest.config.ts', 'jest.config.json']
  },
  'Vitest': {
    dependencies: ['vitest'],
    configFiles: ['vitest.config.js', 'vitest.config.ts']
  },
  'Mocha': {
    dependencies: ['mocha'],
    configFiles: ['.mocharc.js', '.mocharc.json']
  },
  'Jasmine': {
    dependencies: ['jasmine'],
    configFiles: []
  },
  'PyTest': {
    dependencies: ['pytest'],
    configFiles: ['pytest.ini', 'pyproject.toml', 'setup.cfg']
  },
  'unittest': {
    dependencies: [],
    configFiles: [],
    language: ['Python']
  },
  'Go Testing': {
    dependencies: [],
    configFiles: [],
    language: ['Go']
  },
  'JUnit': {
    dependencies: ['junit'],
    configFiles: [],
    language: ['Java']
  },
  'TestNG': {
    dependencies: ['testng'],
    configFiles: [],
    language: ['Java']
  },
  'RSpec': {
    dependencies: ['rspec'],
    configFiles: [],
    language: ['Ruby']
  },
  'PHPUnit': {
    dependencies: ['phpunit'],
    configFiles: ['phpunit.xml'],
    language: ['PHP']
  }
};

/**
 * Styling detection patterns
 */
const STYLING_PATTERNS = {
  'Tailwind CSS': {
    dependencies: ['tailwindcss', 'autoprefixer', 'postcss'],
    configFiles: ['tailwind.config.js', 'tailwind.config.ts', 'postcss.config.js']
  },
  'CSS Modules': {
    dependencies: [],
    configFiles: [],
    filePattern: ['.module.css', '.module.scss', '.module.sass']
  },
  'Styled Components': {
    dependencies: ['styled-components'],
    configFiles: []
  },
  'Emotion': {
    dependencies: ['@emotion/react', '@emotion/styled'],
    configFiles: []
  },
  'Sass/SCSS': {
    dependencies: ['sass', 'node-sass', 'dart-sass'],
    configFiles: []
  },
  'Less': {
    dependencies: ['less'],
    configFiles: []
  },
  'Styled JSX': {
    dependencies: ['styled-jsx'],
    configFiles: []
  },
  'Aphrodite': {
    dependencies: ['aphrodite'],
    configFiles: []
  },
  'Radium': {
    dependencies: ['radium'],
    configFiles: []
  },
  'Glamor': {
    dependencies: ['glamor'],
    configFiles: []
  }
};

/**
 * Main tech stack detection function
 * @param {string} projectRoot - Root directory of the project
 * @returns {Promise<Object>} Comprehensive tech stack analysis
 */
export async function detectTechStack(projectRoot = process.cwd()) {
  const techStack = {
    language: 'unknown',
    primaryLanguage: 'unknown',
    languages: [],
    frameworks: [],
    databases: [],
    testingFrameworks: [],
    styling: [],
    buildSystem: 'unknown',
    packageManager: 'unknown',
    dependencies: [],
    devDependencies: [],
    confidence: 0
  };

  try {
    // Detect primary language
    const languageDetection = await detectLanguage(projectRoot);
    techStack.language = languageDetection.primary;
    techStack.primaryLanguage = languageDetection.primary;
    techStack.languages = languageDetection.all;

    // Detect package manager and build system
    const buildDetection = await detectBuildSystem(projectRoot, languageDetection.primary);
    techStack.packageManager = buildDetection.packageManager;
    techStack.buildSystem = buildDetection.buildSystem;

    // Load dependencies if available
    const depAnalysis = await analyzeDependencies(projectRoot, languageDetection.primary);
    techStack.dependencies = depAnalysis.dependencies;
    techStack.devDependencies = depAnalysis.devDependencies;

    // Detect frameworks
    techStack.frameworks = await detectFrameworks(projectRoot, languageDetection.primary, depAnalysis);

    // Detect databases
    techStack.databases = await detectDatabases(projectRoot, depAnalysis);

    // Detect testing frameworks
    techStack.testingFrameworks = await detectTestingFrameworks(projectRoot, languageDetection.primary, depAnalysis);

    // Detect styling (for web projects)
    if (['JavaScript', 'TypeScript'].includes(languageDetection.primary)) {
      techStack.styling = await detectStyling(projectRoot, depAnalysis);
    }

    // Calculate overall confidence
    techStack.confidence = calculateTechStackConfidence(techStack);

  } catch (error) {
    techStack.error = error.message;
  }

  return techStack;
}

/**
 * Detect primary programming language
 */
async function detectLanguage(projectRoot) {
  const detection = {
    primary: 'unknown',
    all: [],
    scores: {}
  };

  try {
    const entries = fs.readdirSync(projectRoot, { withFileTypes: true });

    // Score languages based on file extensions and config files
    for (const [language, patterns] of Object.entries(LANGUAGE_PATTERNS)) {
      let score = 0;

      // Check for config files
      for (const configFile of patterns.configFiles) {
        const configPath = path.join(projectRoot, configFile.replace('*', ''));
        if (fs.existsSync(configPath)) {
          score += 10;
        }
      }

      // Check for files with matching extensions (sample a few directories)
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const dirPath = path.join(projectRoot, entry.name);
          try {
            const subEntries = fs.readdirSync(dirPath, { withFileTypes: true });
            for (const subEntry of subEntries) {
              if (subEntry.isFile()) {
                const ext = path.extname(subEntry.name);
                if (patterns.extensions.includes(ext)) {
                  score += 1;
                }
              }
            }
          } catch (error) {
            // Skip directories we can't read
          }
        }
      }

      if (score > 0) {
        detection.scores[language] = score;
        detection.all.push(language);
      }
    }

    // Determine primary language (highest score)
    let maxScore = 0;
    for (const [language, score] of Object.entries(detection.scores)) {
      if (score > maxScore) {
        maxScore = score;
        detection.primary = language;
      }
    }

    // Sort languages by score
    detection.all.sort((a, b) => detection.scores[b] - detection.scores[a]);

  } catch (error) {
    detection.error = error.message;
  }

  return detection;
}

/**
 * Detect build system and package manager
 */
async function detectBuildSystem(projectRoot, primaryLanguage) {
  const detection = {
    packageManager: 'unknown',
    buildSystem: 'unknown'
  };

  try {
    // Detect by language
    switch (primaryLanguage) {
      case 'JavaScript':
      case 'TypeScript':
        // Detect package manager
        if (fs.existsSync(path.join(projectRoot, 'pnpm-lock.yaml'))) {
          detection.packageManager = 'pnpm';
        } else if (fs.existsSync(path.join(projectRoot, 'yarn.lock'))) {
          detection.packageManager = 'yarn';
        } else if (fs.existsSync(path.join(projectRoot, 'package-lock.json'))) {
          detection.packageManager = 'npm';
        } else if (fs.existsSync(path.join(projectRoot, 'bun.lockb'))) {
          detection.packageManager = 'bun';
        }

        // Detect build system
        if (fs.existsSync(path.join(projectRoot, 'tsconfig.json'))) {
          detection.buildSystem = 'tsc';
        }
        if (fs.existsSync(path.join(projectRoot, 'webpack.config.js')) ||
            fs.existsSync(path.join(projectRoot, 'webpack.config.ts'))) {
          detection.buildSystem = 'webpack';
        }
        if (fs.existsSync(path.join(projectRoot, 'vite.config.js')) ||
            fs.existsSync(path.join(projectRoot, 'vite.config.ts'))) {
          detection.buildSystem = 'vite';
        }
        if (fs.existsSync(path.join(projectRoot, 'rollup.config.js')) ||
            fs.existsSync(path.join(projectRoot, 'rollup.config.ts'))) {
          detection.buildSystem = 'rollup';
        }
        if (fs.existsSync(path.join(projectRoot, 'esbuild.config.js'))) {
          detection.buildSystem = 'esbuild';
        }
        if (fs.existsSync(path.join(projectRoot, 'next.config.js'))) {
          detection.buildSystem = 'next.js';
        }
        if (fs.existsSync(path.join(projectRoot, 'nuxt.config.js'))) {
          detection.buildSystem = 'nuxt';
        }
        break;

      case 'Python':
        if (fs.existsSync(path.join(projectRoot, 'poetry.lock'))) {
          detection.packageManager = 'poetry';
        } else if (fs.existsSync(path.join(projectRoot, 'Pipfile'))) {
          detection.packageManager = 'pipenv';
        } else {
          detection.packageManager = 'pip';
        }
        detection.buildSystem = 'setuptools';
        break;

      case 'Go':
        detection.packageManager = 'go modules';
        detection.buildSystem = 'go build';
        break;

      case 'Rust':
        detection.packageManager = 'cargo';
        detection.buildSystem = 'cargo';
        break;

      case 'Java':
        if (fs.existsSync(path.join(projectRoot, 'pom.xml'))) {
          detection.packageManager = 'maven';
          detection.buildSystem = 'maven';
        } else if (fs.existsSync(path.join(projectRoot, 'build.gradle'))) {
          detection.packageManager = 'gradle';
          detection.buildSystem = 'gradle';
        }
        break;

      case 'C#':
        detection.packageManager = 'nuget';
        detection.buildSystem = 'dotnet';
        break;

      case 'Ruby':
        detection.packageManager = 'bundler';
        detection.buildSystem = 'rubygems';
        break;

      case 'PHP':
        detection.packageManager = 'composer';
        detection.buildSystem = 'composer';
        break;

      case 'Elixir':
        detection.packageManager = 'hex';
        detection.buildSystem = 'mix';
        break;

      case 'Dart':
        detection.packageManager = 'pub';
        detection.buildSystem = 'dart';
        break;

      case 'Swift':
        detection.packageManager = 'swift package manager';
        detection.buildSystem = 'swift';
        break;
    }

  } catch (error) {
    detection.error = error.message;
  }

  return detection;
}

/**
 * Analyze project dependencies
 */
async function analyzeDependencies(projectRoot, primaryLanguage) {
  const analysis = {
    dependencies: [],
    devDependencies: []
  };

  try {
    switch (primaryLanguage) {
      case 'JavaScript':
      case 'TypeScript':
        const packageJsonPath = path.join(projectRoot, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
          const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
          analysis.dependencies = Object.keys(pkg.dependencies || {});
          analysis.devDependencies = Object.keys(pkg.devDependencies || {});
        }
        break;

      case 'Python':
        const requirementsPath = path.join(projectRoot, 'requirements.txt');
        if (fs.existsSync(requirementsPath)) {
          const requirements = fs.readFileSync(requirementsPath, 'utf-8');
          analysis.dependencies = requirements
            .split('\n')
            .filter(line => line.trim() && !line.startsWith('#'))
            .map(line => line.split('==')[0].split('>=')[0].split('<=')[0].trim())
            .filter(dep => dep);
        }

        const pyprojectPath = path.join(projectRoot, 'pyproject.toml');
        if (fs.existsSync(pyprojectPath)) {
          const pyproject = fs.readFileSync(pyprojectPath, 'utf-8');
          // Simple extraction (would need proper TOML parser for production)
          const deps = pyproject.match(/([a-zA-Z0-9_-]+)\s*=/g) || [];
          analysis.dependencies = [...new Set([...analysis.dependencies, ...deps.map(d => d.replace(/\s*=/, ''))])];
        }
        break;

      case 'Go':
        const goModPath = path.join(projectRoot, 'go.mod');
        if (fs.existsSync(goModPath)) {
          const goMod = fs.readFileSync(goModPath, 'utf-8');
          const requireMatches = goMod.match(/require\s+([^\s]+)\s+[^\s]+/g) || [];
          analysis.dependencies = requireMatches.map(match => match.split(/\s+/)[1]);
        }
        break;

      case 'Rust':
        const cargoPath = path.join(projectRoot, 'Cargo.toml');
        if (fs.existsSync(cargoPath)) {
          const cargo = fs.readFileSync(cargoPath, 'utf-8');
          // Simple extraction (would need proper TOML parser for production)
          const deps = cargo.match(/([a-zA-Z0-9_-]+)\s*=/g) || [];
          analysis.dependencies = deps.map(d => d.replace(/\s*=/, ''));
        }
        break;

      case 'Java':
        const pomPath = path.join(projectRoot, 'pom.xml');
        if (fs.existsSync(pomPath)) {
          const pom = fs.readFileSync(pomPath, 'utf-8');
          const artifactIds = pom.match(/<artifactId>([^<]+)<\/artifactId>/g) || [];
          analysis.dependencies = artifactIds.map(id => id.replace(/<\/?artifactId>/g, ''));
        }
        break;

      case 'C#':
        const csprojFiles = fs.readdirSync(projectRoot).filter(f => f.endsWith('.csproj'));
        if (csprojFiles.length > 0) {
          const csprojPath = path.join(projectRoot, csprojFiles[0]);
          const csproj = fs.readFileSync(csprojPath, 'utf-8');
          const packageRefs = csproj.match(/<PackageReference.*Include="([^"]+)"/g) || [];
          analysis.dependencies = packageRefs.map(ref => ref.match(/Include="([^"]+)"/)[1]);
        }
        break;

      case 'Ruby':
        const gemfilePath = path.join(projectRoot, 'Gemfile');
        if (fs.existsSync(gemfilePath)) {
          const gemfile = fs.readFileSync(gemfilePath, 'utf-8');
          const gems = gemfile.match(/gem\s+['"]([^'"]+)['"]/g) || [];
          analysis.dependencies = gems.map(gem => gem.match(/['"]([^'"]+)['"]/)[1]);
        }
        break;

      case 'PHP':
        const composerPath = path.join(projectRoot, 'composer.json');
        if (fs.existsSync(composerPath)) {
          const composer = JSON.parse(fs.readFileSync(composerPath, 'utf-8'));
          analysis.dependencies = Object.keys(composer.require || {});
          analysis.devDependencies = Object.keys(composer['require-dev'] || {});
        }
        break;
    }

  } catch (error) {
    analysis.error = error.message;
  }

  return analysis;
}

/**
 * Detect frameworks used in the project
 */
async function detectFrameworks(projectRoot, primaryLanguage, depAnalysis) {
  const detected = [];

  try {
    const allDeps = [
      ...depAnalysis.dependencies,
      ...depAnalysis.devDependencies
    ].map(dep => dep.toLowerCase());

    for (const [framework, pattern] of Object.entries(FRAMEWORK_PATTERNS)) {
      // Skip if language doesn't match
      if (pattern.language.length > 0 && !pattern.language.includes(primaryLanguage)) {
        continue;
      }

      let confidence = 0;

      // Check dependencies
      for (const dep of pattern.dependencies) {
        if (allDeps.some(d => d.includes(dep.toLowerCase()))) {
          confidence += 0.5;
        }
      }

      // Check config files
      for (const configFile of pattern.configFiles) {
        if (fs.existsSync(path.join(projectRoot, configFile))) {
          confidence += 0.5;
        }
      }

      if (confidence >= 0.5) {
        detected.push({
          name: framework,
          confidence: Math.min(confidence, 1.0)
        });
      }
    }

    // Sort by confidence
    detected.sort((a, b) => b.confidence - a.confidence);

  } catch (error) {
    // Return empty array on error
  }

  return detected.map(f => f.name);
}

/**
 * Detect databases used in the project
 */
async function detectDatabases(projectRoot, depAnalysis) {
  const detected = [];

  try {
    const allDeps = [
      ...depAnalysis.dependencies,
      ...depAnalysis.devDependencies
    ].map(dep => dep.toLowerCase());

    for (const [database, pattern] of Object.entries(DATABASE_PATTERNS)) {
      let confidence = 0;

      // Check direct dependencies
      for (const dep of pattern.dependencies) {
        if (allDeps.some(d => d.includes(dep.toLowerCase()))) {
          confidence += 0.7;
        }
      }

      // Check ORM dependencies
      for (const orm of pattern.orm) {
        if (allDeps.some(d => d.includes(orm.toLowerCase()))) {
          confidence += 0.3;
        }
      }

      if (confidence >= 0.5) {
        detected.push({
          name: database,
          confidence: Math.min(confidence, 1.0)
        });
      }
    }

    // Sort by confidence
    detected.sort((a, b) => b.confidence - a.confidence);

  } catch (error) {
    // Return empty array on error
  }

  return detected.map(d => d.name);
}

/**
 * Detect testing frameworks
 */
async function detectTestingFrameworks(projectRoot, primaryLanguage, depAnalysis) {
  const detected = [];

  try {
    const allDeps = [
      ...depAnalysis.dependencies,
      ...depAnalysis.devDependencies
    ].map(dep => dep.toLowerCase());

    for (const [framework, pattern] of Object.entries(TESTING_PATTERNS)) {
      // Skip if language doesn't match (when specified)
      if (pattern.language.length > 0 && !pattern.language.includes(primaryLanguage)) {
        continue;
      }

      let confidence = 0;

      // Check dependencies
      for (const dep of pattern.dependencies) {
        if (allDeps.some(d => d.includes(dep.toLowerCase()))) {
          confidence += 0.6;
        }
      }

      // Check config files
      for (const configFile of pattern.configFiles) {
        if (fs.existsSync(path.join(projectRoot, configFile))) {
          confidence += 0.4;
        }
      }

      if (confidence >= 0.5) {
        detected.push({
          name: framework,
          confidence: Math.min(confidence, 1.0)
        });
      }
    }

    // Sort by confidence
    detected.sort((a, b) => b.confidence - a.confidence);

  } catch (error) {
    // Return empty array on error
  }

  return detected.map(f => f.name);
}

/**
 * Detect styling approaches
 */
async function detectStyling(projectRoot, depAnalysis) {
  const detected = [];

  try {
    const allDeps = [
      ...depAnalysis.dependencies,
      ...depAnalysis.devDependencies
    ].map(dep => dep.toLowerCase());

    for (const [style, pattern] of Object.entries(STYLING_PATTERNS)) {
      let confidence = 0;

      // Check dependencies
      for (const dep of pattern.dependencies) {
        if (allDeps.some(d => d.includes(dep.toLowerCase()))) {
          confidence += 0.5;
        }
      }

      // Check config files
      for (const configFile of pattern.configFiles) {
        if (fs.existsSync(path.join(projectRoot, configFile))) {
          confidence += 0.5;
        }
      }

      // Check file patterns (for CSS modules)
      if (pattern.filePattern) {
        for (const entry of fs.readdirSync(projectRoot, { withFileTypes: true })) {
          if (entry.isDirectory()) {
            const dirPath = path.join(projectRoot, entry.name);
            try {
              const subEntries = fs.readdirSync(dirPath, { withFileTypes: true });
              for (const subEntry of subEntries) {
                if (subEntry.isFile()) {
                  const fileName = subEntry.name.toLowerCase();
                  if (pattern.filePattern.some(ext => fileName.endsWith(ext))) {
                    confidence += 0.3;
                    break;
                  }
                }
              }
            } catch (error) {
              // Skip directories we can't read
            }
          }
        }
      }

      if (confidence >= 0.5) {
        detected.push({
          name: style,
          confidence: Math.min(confidence, 1.0)
        });
      }
    }

    // Sort by confidence
    detected.sort((a, b) => b.confidence - a.confidence);

  } catch (error) {
    // Return empty array on error
  }

  return detected.map(s => s.name);
}

/**
 * Calculate overall confidence score for tech stack detection
 */
function calculateTechStackConfidence(techStack) {
  let confidence = 0;
  let factors = 0;

  if (techStack.language && techStack.language !== 'unknown') {
    confidence += 0.3;
    factors++;
  }

  if (techStack.frameworks.length > 0) {
    confidence += 0.25;
    factors++;
  }

  if (techStack.packageManager && techStack.packageManager !== 'unknown') {
    confidence += 0.15;
    factors++;
  }

  if (techStack.buildSystem && techStack.buildSystem !== 'unknown') {
    confidence += 0.15;
    factors++;
  }

  if (techStack.databases.length > 0) {
    confidence += 0.1;
    factors++;
  }

  if (techStack.testingFrameworks.length > 0) {
    confidence += 0.05;
    factors++;
  }

  return Math.min(confidence, 1.0);
}
