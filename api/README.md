# Agentful Shareable Configurations API

This directory contains Vercel Serverless Functions that power the shareable configuration feature.

## Endpoints

### POST /api/save-config

Save a new shareable configuration.

**Request Body:**
```json
{
  "config": {
    "projectType": "existing",
    "language": "typescript",
    "frontend": "nextjs",
    "backend": "nextjs-api",
    "database": "postgresql",
    "orm": "prisma",
    "testing": "vitest",
    "agents": ["orchestrator", "backend", "frontend"],
    "skills": ["product-tracking", "validation"],
    "hooks": ["health-check", "typescript-validation"],
    "gates": ["types", "tests", "coverage"]
  }
}
```

**Response (201 Created):**
```json
{
  "id": "abc12345",
  "url": "https://agentful.app/c/abc12345",
  "installCommand": "npx @itz4blitz/agentful init --config=abc12345",
  "fullCommand": "npx @itz4blitz/agentful init --config=https://agentful.app/c/abc12345"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid configuration structure or too large (>50KB)
- `429 Too Many Requests` - Rate limit exceeded (10 configs per IP per hour)
- `500 Internal Server Error` - Server error

**Rate Limiting:**
- Maximum 10 configurations per IP address per hour
- Responses include `X-RateLimit-Limit` and `X-RateLimit-Remaining` headers

### GET /api/get-config/:id

Retrieve a saved configuration by ID.

**Parameters:**
- `id` - 8-character hexadecimal configuration ID

**Response (200 OK):**
```json
{
  "id": "abc12345",
  "config": {
    "projectType": "existing",
    "agents": ["orchestrator", "backend", "frontend"],
    "skills": ["product-tracking"],
    "hooks": ["health-check"],
    "gates": ["types"]
  },
  "metadata": {
    "created_at": "2026-01-21T12:00:00.000Z",
    "views": 42
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid ID format
- `404 Not Found` - Configuration not found
- `410 Gone` - Configuration expired (1 year TTL)
- `500 Internal Server Error` - Server error

**Caching:**
- Responses are cached for 1 hour via `Cache-Control` header

## Storage

Configurations are stored in the file system at `docs/.configs/{id}.json`.

Each configuration file contains:
```json
{
  "id": "abc12345",
  "config": { ... },
  "metadata": {
    "created_at": "2026-01-21T12:00:00.000Z",
    "ip_hash": "hashed_ip_address",
    "views": 42,
    "size_bytes": 1234
  }
}
```

## Security Features

1. **Input Validation**
   - Configuration structure is validated before saving
   - Required fields: `projectType`, `agents`
   - Array fields validated: `agents`, `skills`, `hooks`, `gates`

2. **Sanitization**
   - All string values are sanitized to prevent XSS attacks
   - Script tags and JavaScript URLs are removed

3. **Rate Limiting**
   - IP-based rate limiting (10 configs per hour)
   - IP addresses are hashed for privacy (SHA-256)

4. **Size Limits**
   - Maximum configuration size: 50KB
   - Prevents resource exhaustion

5. **TTL**
   - Configurations expire after 1 year
   - Expired configs return 410 Gone

6. **Privacy**
   - IP addresses are hashed before storage
   - Only hash is stored, not original IP
   - No personally identifiable information is stored

## Development

To test locally:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run Vercel CLI:
   ```bash
   npx vercel dev
   ```

3. Test endpoints:
   ```bash
   # Save config
   curl -X POST http://localhost:3000/api/save-config \
     -H "Content-Type: application/json" \
     -d '{"config": {"projectType": "existing", "agents": ["orchestrator"]}}'

   # Get config
   curl http://localhost:3000/api/get-config/abc12345
   ```

## Production Deployment

The API is automatically deployed to Vercel when changes are pushed to the main branch.

Configuration files are persisted in the deployment and survive across builds.

## Monitoring

Key metrics to monitor:
- Rate limit hits (429 responses)
- Configuration size (average and max)
- Storage usage (number and total size of configs)
- View counts per configuration
- Error rates by endpoint

## Cleanup

Old configurations should be periodically cleaned up:

```bash
# Find configs older than 1 year
find docs/.configs -name "*.json" -mtime +365

# Delete expired configs
find docs/.configs -name "*.json" -mtime +365 -delete
```

Consider adding a scheduled job (Vercel Cron) to automate cleanup.
