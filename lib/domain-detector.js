#!/usr/bin/env node

/**
 * Domain Detector
 * Multi-source domain detection with confidence scoring
 * Identifies business domains from project structure, APIs, and code patterns
 */

import fs from 'fs';
import path from 'path';

/**
 * Domain mapping table with keyword patterns
 */
const DOMAIN_PATTERNS = {
  'authentication': {
    keywords: ['auth', 'login', 'signup', 'signin', 'register', 'password', 'token', 'jwt', 'session', 'oauth', 'saml', '2fa', 'mfa', 'credential'],
    extensions: ['.js', '.ts', '.py', '.go', '.rs', '.java', '.cs'],
    weight: 1.0
  },
  'user-management': {
    keywords: ['user', 'profile', 'account', 'member', 'participant', 'subscriber', 'customer', 'tenant', 'role', 'permission', 'group'],
    extensions: ['.js', '.ts', '.py', '.go', '.rs', '.java', '.cs'],
    weight: 1.0
  },
  'billing': {
    keywords: ['billing', 'invoice', 'payment', 'subscription', 'pricing', 'plan', 'checkout', 'stripe', 'paypal', 'refund', 'transaction', 'order'],
    extensions: ['.js', '.ts', '.py', '.go', '.rs', '.java', '.cs'],
    weight: 1.0
  },
  'content-management': {
    keywords: ['content', 'article', 'post', 'blog', 'page', 'cms', 'editor', 'media', 'asset', 'document', 'publication', 'draft'],
    extensions: ['.js', '.ts', '.py', '.go', '.rs', '.java', '.cs'],
    weight: 0.9
  },
  'e-commerce': {
    keywords: ['product', 'cart', 'shop', 'store', 'catalog', 'inventory', 'wishlist', 'review', 'rating', 'shipping', 'discount', 'coupon'],
    extensions: ['.js', '.ts', '.py', '.go', '.rs', '.java', '.cs'],
    weight: 1.0
  },
  'messaging': {
    keywords: ['message', 'chat', 'conversation', 'notification', 'alert', 'email', 'sms', 'push', 'websocket', 'realtime', 'channel'],
    extensions: ['.js', '.ts', '.py', '.go', '.rs', '.java', '.cs'],
    weight: 0.9
  },
  'analytics': {
    keywords: ['analytics', 'metric', 'statistic', 'report', 'dashboard', 'chart', 'graph', 'tracking', 'event', 'log', 'monitor'],
    extensions: ['.js', '.ts', '.py', '.go', '.rs', '.java', '.cs'],
    weight: 0.8
  },
  'search': {
    keywords: ['search', 'query', 'filter', 'index', 'elasticsearch', 'algolia', 'suggestion', 'autocomplete'],
    extensions: ['.js', '.ts', '.py', '.go', '.rs', '.java', '.cs'],
    weight: 0.8
  },
  'file-management': {
    keywords: ['file', 'upload', 'download', 'storage', 'attachment', 'document', 'image', 'video', 's3', 'bucket', 'drive'],
    extensions: ['.js', '.ts', '.py', '.go', '.rs', '.java', '.cs'],
    weight: 0.8
  },
  'social': {
    keywords: ['social', 'friend', 'follow', 'like', 'comment', 'share', 'feed', 'timeline', 'activity', 'community'],
    extensions: ['.js', '.ts', '.py', '.go', '.rs', '.java', '.cs'],
    weight: 0.7
  },
  'workflow': {
    keywords: ['workflow', 'process', 'approval', 'task', 'job', 'queue', 'pipeline', 'automation', 'scheduler', 'cron'],
    extensions: ['.js', '.ts', '.py', '.go', '.rs', '.java', '.cs'],
    weight: 0.8
  },
  'api-management': {
    keywords: ['api', 'endpoint', 'route', 'controller', 'handler', 'middleware', 'graphql', 'rest', 'grpc', 'webhook'],
    extensions: ['.js', '.ts', '.py', '.go', '.rs', '.java', '.cs'],
    weight: 0.7
  },
  'database': {
    keywords: ['database', 'repository', 'dao', 'orm', 'migration', 'schema', 'seed', 'model', 'entity'],
    extensions: ['.js', '.ts', '.py', '.go', '.rs', '.java', '.cs'],
    weight: 0.6
  },
  'configuration': {
    keywords: ['config', 'setting', 'preference', 'option', 'feature-flag', 'toggle', 'localization', 'i18n', 'locale'],
    extensions: ['.js', '.ts', '.py', '.go', '.rs', '.java', '.cs'],
    weight: 0.6
  },
  'security': {
    keywords: ['security', 'encryption', 'hash', 'captcha', 'firewall', 'audit', 'compliance', 'policy', 'acl', 'rbac'],
    extensions: ['.js', '.ts', '.py', '.go', '.rs', '.java', '.cs'],
    weight: 0.9
  },
  'integration': {
    keywords: ['integration', 'webhook', 'api-client', 'sync', 'import', 'export', 'connector', 'adapter', 'proxy'],
    extensions: ['.js', '.ts', '.py', '.go', '.rs', '.java', '.cs'],
    weight: 0.7
  },
  'admin': {
    keywords: ['admin', 'management', 'panel', 'console', 'backend', 'portal', 'dashboard', 'control'],
    extensions: ['.js', '.ts', '.py', '.go', '.rs', '.java', '.cs'],
    weight: 0.7
  }
};

/**
 * Main domain detection function
 * @param {string} projectRoot - Root directory of the project
 * @param {Object} quickScan - Quick scan results from project analyzer
 * @returns {Promise<Object>} Detected domains with confidence scores
 */
export async function detectDomains(projectRoot, quickScan = {}) {
  const results = {
    detected: [],
    confidence: {},
    signals: {},
    totalConfidence: 0
  };

  try {
    // Signal 1: Directory structure analysis (40% weight)
    const structureSignals = await analyzeDirectoryStructure(projectRoot);
    results.signals.structure = structureSignals;

    // Signal 2: API route analysis (30% weight)
    const apiSignals = await analyzeApiRoutes(projectRoot, quickScan);
    results.signals.api = apiSignals;

    // Signal 3: Database schema analysis (20% weight)
    const schemaSignals = await analyzeDatabaseSchema(projectRoot);
    results.signals.schema = schemaSignals;

    // Signal 4: Module boundary analysis (10% weight)
    const moduleSignals = await analyzeModuleBoundaries(projectRoot);
    results.signals.modules = moduleSignals;

    // Aggregate signals with weights
    const domainScores = {};

    // Structure signals (40%)
    for (const [domain, score] of Object.entries(structureSignals)) {
      domainScores[domain] = (domainScores[domain] || 0) + (score * 0.4);
    }

    // API signals (30%)
    for (const [domain, score] of Object.entries(apiSignals)) {
      domainScores[domain] = (domainScores[domain] || 0) + (score * 0.3);
    }

    // Schema signals (20%)
    for (const [domain, score] of Object.entries(schemaSignals)) {
      domainScores[domain] = (domainScores[domain] || 0) + (score * 0.2);
    }

    // Module signals (10%)
    for (const [domain, score] of Object.entries(moduleSignals)) {
      domainScores[domain] = (domainScores[domain] || 0) + (score * 0.1);
    }

    // Filter by confidence threshold (0.3) and sort
    const threshold = 0.3;
    for (const [domain, score] of Object.entries(domainScores)) {
      if (score >= threshold) {
        results.detected.push(domain);
        results.confidence[domain] = Math.min(score, 1.0);
      }
    }

    // Sort by confidence (descending)
    results.detected.sort((a, b) => results.confidence[b] - results.confidence[a]);

    // Calculate total confidence
    results.totalConfidence = results.detected.length > 0
      ? Object.values(results.confidence).reduce((sum, conf) => sum + conf, 0) / results.detected.length
      : 0;

  } catch (error) {
    results.error = error.message;
  }

  return results;
}

/**
 * Analyze directory structure for domain indicators
 */
async function analyzeDirectoryStructure(projectRoot) {
  const signals = {};

  try {
    const entries = fs.readdirSync(projectRoot, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const dirName = entry.name.toLowerCase();

      // Check each domain pattern
      for (const [domain, pattern] of Object.entries(DOMAIN_PATTERNS)) {
        for (const keyword of pattern.keywords) {
          if (dirName.includes(keyword.toLowerCase())) {
            // Exact match gets higher score
            if (dirName === keyword.toLowerCase()) {
              signals[domain] = Math.min((signals[domain] || 0) + 0.8, 1.0);
            } else {
              signals[domain] = Math.min((signals[domain] || 0) + 0.5, 1.0);
            }
          }
        }
      }

      // Recursively analyze subdirectories (limit depth)
      const subPath = path.join(projectRoot, entry.name);
      try {
        const subEntries = fs.readdirSync(subPath, { withFileTypes: true });
        for (const subEntry of subEntries) {
          if (subEntry.isDirectory()) {
            const subDirName = subEntry.name.toLowerCase();

            for (const [domain, pattern] of Object.entries(DOMAIN_PATTERNS)) {
              for (const keyword of pattern.keywords) {
                if (subDirName.includes(keyword.toLowerCase())) {
                  signals[domain] = Math.min((signals[domain] || 0) + 0.3, 1.0);
                }
              }
            }
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    }

  } catch (error) {
    // Return empty signals on error
  }

  return signals;
}

/**
 * Analyze API routes for domain indicators
 */
async function analyzeApiRoutes(projectRoot, quickScan) {
  const signals = {};

  try {
    // Common API directory patterns
    const apiDirs = [
      'api', 'routes', 'controllers', 'handlers', 'app/api',
      'src/api', 'src/routes', 'src/controllers', 'src/handlers'
    ];

    for (const apiDir of apiDirs) {
      const apiPath = path.join(projectRoot, apiDir);

      if (!fs.existsSync(apiPath)) continue;

      const walkDir = (dir, depth = 0) => {
        if (depth > 3) return;

        try {
          const entries = fs.readdirSync(dir, { withFileTypes: true });

          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
              walkDir(fullPath, depth + 1);
            } else if (entry.isFile()) {
              const ext = path.extname(entry.name);
              if (['.js', '.ts', '.py', '.go', '.rs'].includes(ext)) {
                analyzeFileForDomains(fullPath, signals);
              }
            }
          }
        } catch (error) {
          // Skip files we can't read
        }
      };

      walkDir(apiPath);
    }

  } catch (error) {
    // Return empty signals on error
  }

  return signals;
}

/**
 * Analyze individual file for domain indicators
 */
function analyzeFileForDomains(filePath, signals) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath).toLowerCase();

    for (const [domain, pattern] of Object.entries(DOMAIN_PATTERNS)) {
      for (const keyword of pattern.keywords) {
        // Check filename
        if (fileName.includes(keyword.toLowerCase())) {
          signals[domain] = Math.min((signals[domain] || 0) + 0.4, 1.0);
        }

        // Check content with regex for word boundaries
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = content.match(regex);
        if (matches) {
          // More matches = higher confidence, but cap the contribution
          const matchScore = Math.min(matches.length * 0.1, 0.5);
          signals[domain] = Math.min((signals[domain] || 0) + matchScore, 1.0);
        }
      }
    }

  } catch (error) {
    // Skip files we can't read
  }
}

/**
 * Analyze database schema files for domain indicators
 */
async function analyzeDatabaseSchema(projectRoot) {
  const signals = {};

  try {
    // Common schema file patterns
    const schemaPatterns = [
      '**/schema.prisma',
      '**/models.py',
      '**/entities/*.ts',
      '**/migrations/*.sql',
      '**/seeds/*.js',
      '**/db/schema.ts',
      '**/database/schema.*'
    ];

    // Look for schema directories
    const schemaDirs = [
      'prisma', 'models', 'entities', 'migrations', 'schema',
      'src/models', 'src/entities', 'src/schema', 'database'
    ];

    for (const schemaDir of schemaDirs) {
      const schemaPath = path.join(projectRoot, schemaDir);

      if (!fs.existsSync(schemaPath)) continue;

      const walkDir = (dir, depth = 0) => {
        if (depth > 2) return;

        try {
          const entries = fs.readdirSync(dir, { withFileTypes: true });

          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
              walkDir(fullPath, depth + 1);
            } else if (entry.isFile()) {
              const ext = path.extname(entry.name);
              if (['.prisma', '.py', '.ts', '.js', '.sql'].includes(ext)) {
                analyzeFileForDomains(fullPath, signals);
              }
            }
          }
        } catch (error) {
          // Skip files we can't read
        }
      };

      walkDir(schemaPath);
    }

  } catch (error) {
    // Return empty signals on error
  }

  return signals;
}

/**
 * Analyze module boundaries for domain indicators
 */
async function analyzeModuleBoundaries(projectRoot) {
  const signals = {};

  try {
    // Look for module boundary indicators
    const moduleIndicators = [
      'package.json',
      'go.mod',
      'Cargo.toml',
      'pom.xml',
      '.csproj'
    ];

    for (const indicator of moduleIndicators) {
      const indicatorPath = path.join(projectRoot, indicator);

      if (!fs.existsSync(indicatorPath)) continue;

      const content = fs.readFileSync(indicatorPath, 'utf-8');

      for (const [domain, pattern] of Object.entries(DOMAIN_PATTERNS)) {
        for (const keyword of pattern.keywords) {
          if (content.toLowerCase().includes(keyword)) {
            signals[domain] = Math.min((signals[domain] || 0) + 0.2, 1.0);
          }
        }
      }
    }

    // Check for feature-based module organization
    const featureDirs = ['features', 'modules', 'domains', 'slices'];
    for (const featureDir of featureDirs) {
      const featurePath = path.join(projectRoot, featureDir);

      if (!fs.existsSync(featurePath)) continue;

      const entries = fs.readdirSync(featurePath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const moduleName = entry.name.toLowerCase();

          for (const [domain, pattern] of Object.entries(DOMAIN_PATTERNS)) {
            for (const keyword of pattern.keywords) {
              if (moduleName.includes(keyword.toLowerCase())) {
                signals[domain] = Math.min((signals[domain] || 0) + 0.3, 1.0);
              }
            }
          }
        }
      }
    }

  } catch (error) {
    // Return empty signals on error
  }

  return signals;
}

/**
 * Get domain-specific keywords for a given domain
 */
export function getDomainKeywords(domain) {
  return DOMAIN_PATTERNS[domain]?.keywords || [];
}

/**
 * Get all available domain names
 */
export function getAllDomains() {
  return Object.keys(DOMAIN_PATTERNS);
}

/**
 * Add custom domain pattern
 */
export function addCustomDomainPattern(domain, keywords, weight = 1.0) {
  DOMAIN_PATTERNS[domain] = {
    keywords,
    extensions: ['.js', '.ts', '.py', '.go', '.rs', '.java', '.cs'],
    weight
  };
}
