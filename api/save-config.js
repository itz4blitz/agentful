import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const CONFIGS_DIR = path.join(process.cwd(), 'docs', '.configs');
const MAX_CONFIG_SIZE = 50 * 1024; // 50KB
const MAX_CONFIGS_PER_IP_PER_HOUR = 10;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in ms

// In-memory rate limiting (resets on cold start)
// For production, consider using Vercel KV or similar
const rateLimitStore = new Map();

/**
 * Generate a unique 8-character alphanumeric ID
 */
function generateId() {
  return crypto.randomBytes(4).toString('hex');
}

/**
 * Hash IP address for privacy
 */
function hashIp(ip) {
  return crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);
}

/**
 * Check rate limit for IP
 */
function checkRateLimit(ipHash) {
  const now = Date.now();
  const entry = rateLimitStore.get(ipHash);

  if (!entry) {
    rateLimitStore.set(ipHash, { count: 1, firstRequest: now });
    return { allowed: true, remaining: MAX_CONFIGS_PER_IP_PER_HOUR - 1 };
  }

  // Reset if window expired
  if (now - entry.firstRequest > RATE_LIMIT_WINDOW) {
    rateLimitStore.set(ipHash, { count: 1, firstRequest: now });
    return { allowed: true, remaining: MAX_CONFIGS_PER_IP_PER_HOUR - 1 };
  }

  // Check if limit exceeded
  if (entry.count >= MAX_CONFIGS_PER_IP_PER_HOUR) {
    const resetTime = new Date(entry.firstRequest + RATE_LIMIT_WINDOW);
    return {
      allowed: false,
      remaining: 0,
      resetAt: resetTime.toISOString()
    };
  }

  // Increment count
  entry.count += 1;
  return { allowed: true, remaining: MAX_CONFIGS_PER_IP_PER_HOUR - entry.count };
}

/**
 * Validate configuration structure
 */
function validateConfig(config) {
  if (!config || typeof config !== 'object') {
    return { valid: false, error: 'Config must be an object' };
  }

  // Required fields
  const requiredFields = ['projectType', 'agents'];
  for (const field of requiredFields) {
    if (!config[field]) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }

  // Validate arrays
  const arrayFields = ['agents', 'skills', 'hooks', 'gates'];
  for (const field of arrayFields) {
    if (config[field] && !Array.isArray(config[field])) {
      return { valid: false, error: `${field} must be an array` };
    }
  }

  // Validate projectType
  if (!['new', 'existing', 'monorepo'].includes(config.projectType)) {
    return { valid: false, error: 'Invalid projectType' };
  }

  return { valid: true };
}

/**
 * Sanitize config values to prevent XSS
 */
function sanitizeConfig(config) {
  const sanitized = { ...config };

  // Remove any script tags or dangerous content
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str.replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  };

  // Recursively sanitize all string values
  const sanitizeObject = (obj) => {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    return obj;
  };

  return sanitizeObject(sanitized);
}

/**
 * Save configuration to file system
 */
async function saveConfig(id, config, metadata) {
  // Ensure configs directory exists
  await fs.mkdir(CONFIGS_DIR, { recursive: true });

  const configData = {
    id,
    config,
    metadata
  };

  const filePath = path.join(CONFIGS_DIR, `${id}.json`);
  await fs.writeFile(filePath, JSON.stringify(configData, null, 2));

  return filePath;
}

/**
 * Main handler
 */
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get IP address for rate limiting
    const ip = req.headers['x-forwarded-for']?.split(',')[0] ||
               req.headers['x-real-ip'] ||
               req.socket.remoteAddress ||
               'unknown';
    const ipHash = hashIp(ip);

    // Check rate limit
    const rateLimit = checkRateLimit(ipHash);
    if (!rateLimit.allowed) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Maximum 10 configurations per hour.',
        resetAt: rateLimit.resetAt
      });
    }

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', MAX_CONFIGS_PER_IP_PER_HOUR);
    res.setHeader('X-RateLimit-Remaining', rateLimit.remaining);

    // Parse and validate request body
    const { config } = req.body;

    if (!config) {
      return res.status(400).json({ error: 'Missing config in request body' });
    }

    // Check size
    const configSize = JSON.stringify(config).length;
    if (configSize > MAX_CONFIG_SIZE) {
      return res.status(400).json({
        error: 'Configuration too large',
        message: `Config size ${configSize} bytes exceeds maximum of ${MAX_CONFIG_SIZE} bytes`,
      });
    }

    // Validate structure
    const validation = validateConfig(config);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid configuration',
        message: validation.error,
      });
    }

    // Sanitize config
    const sanitizedConfig = sanitizeConfig(config);

    // Generate unique ID
    const id = generateId();

    // Prepare metadata
    const metadata = {
      created_at: new Date().toISOString(),
      ip_hash: ipHash,
      views: 0,
      size_bytes: configSize,
    };

    // Save to file system
    await saveConfig(id, sanitizedConfig, metadata);

    // Prepare response
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://agentful.app';

    const response = {
      id,
      url: `${baseUrl}/c/${id}`,
      installCommand: `npx @itz4blitz/agentful init --config=${id}`,
      fullCommand: `npx @itz4blitz/agentful init --config=${baseUrl}/c/${id}`,
    };

    return res.status(201).json(response);
  } catch (error) {
    console.error('Error saving config:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to save configuration',
    });
  }
}
