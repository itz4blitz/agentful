/**
 * Authentication Middleware for Agentful Server
 *
 * Supports three authentication modes:
 * - tailscale: Network-level security (Tailscale handles auth)
 * - hmac: HMAC-SHA256 signature verification with replay protection
 * - none: Local-only access (127.0.0.1)
 *
 * @module server/auth
 */

import crypto from 'crypto';

/**
 * Replay protection window (5 minutes)
 */
const REPLAY_WINDOW_MS = 5 * 60 * 1000;

/**
 * Maximum size for signature cache (prevents memory exhaustion)
 */
const MAX_SIGNATURE_CACHE_SIZE = 10000;

/**
 * In-memory store for seen request signatures (prevents replay attacks)
 * In production, use Redis or similar distributed cache
 */
const seenSignatures = new Map();

/**
 * Clean up old signatures periodically (every 10 minutes)
 */
setInterval(() => {
  const cutoff = Date.now() - REPLAY_WINDOW_MS;
  for (const [signature, timestamp] of seenSignatures.entries()) {
    if (timestamp < cutoff) {
      seenSignatures.delete(signature);
    }
  }

  // If cache is still too large after cleanup, remove oldest entries (LRU)
  if (seenSignatures.size > MAX_SIGNATURE_CACHE_SIZE) {
    const sortedEntries = Array.from(seenSignatures.entries())
      .sort((a, b) => a[1] - b[1]);
    const toRemove = sortedEntries.slice(0, seenSignatures.size - MAX_SIGNATURE_CACHE_SIZE);
    for (const [sig] of toRemove) {
      seenSignatures.delete(sig);
    }
  }
}, 10 * 60 * 1000);

/**
 * Verify HMAC signature with replay protection
 * @param {string} timestamp - Request timestamp
 * @param {string} body - Request body (JSON string)
 * @param {string} signature - HMAC signature from header
 * @param {string} secret - Shared secret
 * @returns {Object} Verification result { valid: boolean, error?: string }
 */
export function verifyHMACSignature(timestamp, body, signature, secret) {
  // Validate timestamp format
  const requestTime = parseInt(timestamp, 10);
  if (isNaN(requestTime)) {
    return { valid: false, error: 'Invalid timestamp format' };
  }

  // Check timestamp is within acceptable window
  const now = Date.now();
  const timeDiff = Math.abs(now - requestTime);

  if (timeDiff > REPLAY_WINDOW_MS) {
    return {
      valid: false,
      error: `Timestamp outside acceptable window (${REPLAY_WINDOW_MS / 1000}s)`,
    };
  }

  // Check for replay attack
  if (seenSignatures.has(signature)) {
    return { valid: false, error: 'Signature already used (replay attack)' };
  }

  // Compute expected signature
  const message = timestamp + body;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex');

  // Compare signatures (constant-time comparison to prevent timing attacks)
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  // Ensure buffers are same length before timingSafeEqual to prevent crash
  if (signatureBuffer.length !== expectedBuffer.length) {
    return { valid: false, error: 'Invalid signature' };
  }

  const isValid = crypto.timingSafeEqual(signatureBuffer, expectedBuffer);

  if (!isValid) {
    return { valid: false, error: 'Invalid signature' };
  }

  // Store signature to prevent replay (with cache size limit)
  if (seenSignatures.size >= MAX_SIGNATURE_CACHE_SIZE) {
    // Find and remove oldest entry
    let oldestSig = null;
    let oldestTime = Infinity;
    for (const [sig, time] of seenSignatures.entries()) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestSig = sig;
      }
    }
    if (oldestSig) {
      seenSignatures.delete(oldestSig);
    }
  }

  seenSignatures.set(signature, requestTime);

  return { valid: true };
}

/**
 * Minimum secret length for HMAC (256 bits / 32 bytes)
 */
const MIN_SECRET_LENGTH = 32;

/**
 * Create authentication middleware based on mode
 * @param {string} mode - Authentication mode ('tailscale', 'hmac', 'none')
 * @param {Object} config - Configuration options
 * @param {string} [config.secret] - Shared secret (required for HMAC mode)
 * @returns {Function} Middleware function
 */
export function createAuthMiddleware(mode, config = {}) {
  switch (mode) {
    case 'tailscale':
      // Tailscale mode: No authentication needed (network-level security)
      return (req, res, next) => {
        next();
      };

    case 'hmac':
      if (!config.secret) {
        throw new Error('HMAC mode requires a secret');
      }

      // Validate secret strength
      if (config.secret.length < MIN_SECRET_LENGTH) {
        throw new Error(
          `HMAC secret must be at least ${MIN_SECRET_LENGTH} characters. ` +
          `Use: openssl rand -hex 32`
        );
      }

      return (req, res, next) => {
        // Extract headers
        const signature = req.headers['x-agentful-signature'];
        const timestamp = req.headers['x-agentful-timestamp'];

        // Validate headers present
        if (!signature || !timestamp) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          return res.end(
            JSON.stringify({
              error: 'Authentication required',
              message: 'Missing X-Agentful-Signature or X-Agentful-Timestamp header',
            })
          );
        }

        // Verify signature
        const result = verifyHMACSignature(
          timestamp,
          req.rawBody || '',
          signature,
          config.secret
        );

        if (!result.valid) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          return res.end(
            JSON.stringify({
              error: 'Authentication failed',
              message: result.error,
            })
          );
        }

        next();
      };

    case 'none':
      // None mode: Allow all connections (use with SSH tunnel for security)
      return (req, res, next) => {
        next();
      };

    default:
      throw new Error(`Unknown authentication mode: ${mode}`);
  }
}

/**
 * Maximum request body size (10MB)
 */
const MAX_BODY_SIZE = 10 * 1024 * 1024;

/**
 * Middleware to capture raw request body (needed for HMAC verification)
 * Must be used before express.json() middleware
 */
export function captureRawBody(req, res, next) {
  let data = '';
  let size = 0;

  req.on('data', (chunk) => {
    size += chunk.length;

    // Check if body size exceeds limit
    if (size > MAX_BODY_SIZE) {
      req.destroy();
      res.writeHead(413, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: 'Payload Too Large',
          message: `Request body exceeds maximum size of ${MAX_BODY_SIZE / 1024 / 1024}MB`,
        })
      );
      return;
    }

    data += chunk.toString();
  });

  req.on('end', () => {
    req.rawBody = data;
    next();
  });
}

/**
 * Generate HMAC signature for a request (for client use)
 * @param {string} body - Request body (JSON string)
 * @param {string} secret - Shared secret
 * @returns {Object} Headers to add to request { 'X-Agentful-Signature', 'X-Agentful-Timestamp' }
 */
export function generateHMACHeaders(body, secret) {
  const timestamp = Date.now().toString();
  const message = timestamp + body;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex');

  return {
    'X-Agentful-Signature': signature,
    'X-Agentful-Timestamp': timestamp,
  };
}

export default {
  createAuthMiddleware,
  verifyHMACSignature,
  captureRawBody,
  generateHMACHeaders,
};
