import fs from 'fs/promises';
import path from 'path';

const CONFIGS_DIR = path.join(process.cwd(), 'docs', '.configs');

/**
 * Load configuration from file system
 */
async function loadConfig(id) {
  const filePath = path.join(CONFIGS_DIR, `${id}.json`);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

/**
 * Update view count
 */
async function incrementViews(id, configData) {
  configData.metadata.views += 1;
  const filePath = path.join(CONFIGS_DIR, `${id}.json`);
  await fs.writeFile(filePath, JSON.stringify(configData, null, 2));
}

/**
 * Check if config is expired (1 year TTL)
 */
function isExpired(createdAt) {
  const oneYearMs = 365 * 24 * 60 * 60 * 1000;
  const createdTime = new Date(createdAt).getTime();
  const now = Date.now();

  return (now - createdTime) > oneYearMs;
}

/**
 * Main handler
 */
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    // Validate ID format (8 hex characters)
    if (!id || !/^[a-f0-9]{8}$/i.test(id)) {
      return res.status(400).json({
        error: 'Invalid configuration ID',
        message: 'ID must be an 8-character hexadecimal string'
      });
    }

    // Load configuration
    const configData = await loadConfig(id);

    if (!configData) {
      return res.status(404).json({
        error: 'Configuration not found',
        message: `No configuration found with ID: ${id}`
      });
    }

    // Check if expired
    if (isExpired(configData.metadata.created_at)) {
      return res.status(410).json({
        error: 'Configuration expired',
        message: 'This configuration has expired (1 year TTL)'
      });
    }

    // Increment view count (async, don't wait)
    incrementViews(id, configData).catch(err => {
      console.error('Error incrementing views:', err);
    });

    // Return config data (excluding sensitive metadata like ip_hash)
    const response = {
      id: configData.id,
      config: configData.config,
      metadata: {
        created_at: configData.metadata.created_at,
        views: configData.metadata.views + 1 // Include incremented count
      }
    };

    // Cache for 1 hour
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error retrieving config:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve configuration'
    });
  }
}
