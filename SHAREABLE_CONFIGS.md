# Shareable Configurations Feature

This document describes the implementation of shareable agentful configurations.

## Overview

Users can now create, share, and install agentful configurations via unique URLs. This makes it easy to:
- Share team configurations
- Distribute recommended setups
- Create templates for specific tech stacks
- Onboard new developers with consistent configurations

## Architecture

### Components

1. **API Endpoints** (Vercel Serverless Functions)
   - `POST /api/save-config` - Save new configuration
   - `GET /api/get-config/:id` - Retrieve configuration

2. **Web UI Components**
   - `CommandGenerator.tsx` - Share button added
   - `ShareModal.tsx` - Modal for displaying shareable URL
   - `ConfigViewer.tsx` - View shared configurations

3. **CLI Support**
   - `--config` flag in `agentful init` command
   - Accepts full URL or just the ID
   - Fetches and installs configuration automatically

4. **Storage**
   - File-based storage in `docs/.configs/{id}.json`
   - Each config includes metadata (created_at, views, ip_hash)

## Usage

### Creating a Shareable Configuration

1. Visit https://agentful.app/configure
2. Configure your desired setup
3. Click the "Share" button
4. Copy the URL or install command

### Installing from Shareable Configuration

**Using full URL:**
```bash
npx @itz4blitz/agentful init --config=https://agentful.app/c/abc12345
```

**Using short ID:**
```bash
npx @itz4blitz/agentful init --config=abc12345
```

### Viewing a Configuration

Visit `https://agentful.app/c/{id}` to view configuration details before installing.

## API Specification

### Save Configuration

**Endpoint:** `POST /api/save-config`

**Request:**
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
    "agents": ["orchestrator", "backend", "frontend", "tester", "reviewer"],
    "skills": ["product-tracking", "validation"],
    "hooks": ["health-check", "typescript-validation"],
    "gates": ["types", "tests", "coverage"]
  }
}
```

**Response:**
```json
{
  "id": "abc12345",
  "url": "https://agentful.app/c/abc12345",
  "installCommand": "npx @itz4blitz/agentful init --config=abc12345",
  "fullCommand": "npx @itz4blitz/agentful init --config=https://agentful.app/c/abc12345"
}
```

### Retrieve Configuration

**Endpoint:** `GET /api/get-config/:id`

**Response:**
```json
{
  "id": "abc12345",
  "config": { ... },
  "metadata": {
    "created_at": "2026-01-21T12:00:00.000Z",
    "views": 42
  }
}
```

## Security Features

1. **Rate Limiting**
   - Maximum 10 configurations per IP per hour
   - Prevents abuse and spam

2. **Input Validation**
   - Configuration structure validated
   - Required fields enforced
   - Array types validated

3. **Sanitization**
   - All string values sanitized
   - Script tags removed
   - XSS prevention

4. **Size Limits**
   - Maximum configuration size: 50KB
   - Prevents resource exhaustion

5. **Privacy**
   - IP addresses hashed (SHA-256)
   - No PII stored
   - View counts tracked anonymously

6. **TTL (Time To Live)**
   - Configurations expire after 1 year
   - Automatic cleanup possible

## File Structure

```
agentful/
├── api/
│   ├── save-config.js           # Save endpoint
│   ├── get-config/
│   │   └── [id].js              # Retrieve endpoint
│   └── README.md                # API documentation
├── docs/
│   ├── .configs/                # Stored configurations (gitignored)
│   │   └── {id}.json
│   ├── components/
│   │   └── configurator/
│   │       ├── CommandGenerator.tsx  # Updated with share button
│   │       ├── ShareModal.tsx        # Share URL modal
│   │       └── ConfigViewer.tsx      # View shared configs
│   └── pages/
│       └── c/
│           └── [id].mdx         # Shared config viewer page
├── bin/
│   └── cli.js                   # Updated with --config flag
└── vercel.json                  # Vercel configuration
```

## Error Handling

### API Errors

| Status | Condition | Response |
|--------|-----------|----------|
| 400 | Invalid config structure | `{"error": "Invalid configuration", "message": "..."}` |
| 400 | Config too large (>50KB) | `{"error": "Configuration too large", "message": "..."}` |
| 404 | Config not found | `{"error": "Configuration not found", "message": "..."}` |
| 410 | Config expired | `{"error": "Configuration expired", "message": "..."}` |
| 429 | Rate limit exceeded | `{"error": "Too Many Requests", "message": "...", "resetAt": "..."}` |
| 500 | Server error | `{"error": "Internal Server Error", "message": "..."}` |

### CLI Errors

- Invalid URL/ID format
- Network errors fetching config
- Configuration not found
- Expired configuration

All errors are displayed with clear messages and suggested actions.

## Configuration Schema

```typescript
interface ConfigState {
  projectType: 'new' | 'existing' | 'monorepo'
  language: string
  frontend: string
  backend: string
  database: string
  orm: string
  testing: string
  agents: string[]
  skills: string[]
  hooks: string[]
  gates: string[]
}
```

### Required Fields
- `projectType`
- `agents` (must include at least 'orchestrator')

### Optional Fields
- All tech stack fields
- `skills`
- `hooks`
- `gates`

## Testing

### Manual Testing

1. **Create Configuration:**
   ```bash
   # Visit https://agentful.app/configure
   # Configure and click Share
   ```

2. **View Configuration:**
   ```bash
   # Visit https://agentful.app/c/{id}
   ```

3. **Install Configuration:**
   ```bash
   npx @itz4blitz/agentful init --config={id}
   ```

### API Testing

```bash
# Save config
curl -X POST https://agentful.app/api/save-config \
  -H "Content-Type: application/json" \
  -d '{"config": {"projectType": "existing", "agents": ["orchestrator"]}}'

# Get config
curl https://agentful.app/api/get-config/{id}
```

## Monitoring & Analytics

Track the following metrics:
- **Creation Rate:** Configs created per day/hour
- **View Count:** Total views per config
- **Install Count:** Implicit (views on viewer page)
- **Error Rate:** Failed API requests by type
- **Rate Limit Hits:** 429 responses per hour
- **Storage Usage:** Total configs and disk space

## Future Enhancements

1. **Vercel KV Integration**
   - Replace file storage with Vercel KV
   - Better performance and reliability
   - Easier cleanup and TTL management

2. **User Authentication**
   - Allow users to manage their configs
   - Edit and delete configurations
   - Private configurations

3. **Analytics Dashboard**
   - View stats for your shared configs
   - Track installs and views
   - Popular configurations

4. **Configuration Templates**
   - Curated templates by the team
   - Community voting/ranking
   - Featured configurations

5. **Version History**
   - Track config updates
   - Allow versioned configs
   - Compare versions

6. **Social Features**
   - Comments on configurations
   - Upvoting/favoriting
   - User profiles

7. **CLI Improvements**
   - Interactive preview before install
   - Diff against current config
   - Merge with existing setup

## Deployment

### Vercel Configuration

The `vercel.json` file configures:
- API route rewrites
- CORS headers
- Caching policies

### Environment Variables

No environment variables required for basic functionality.

Optional:
- `VERCEL_URL` - Automatically set by Vercel
- For Vercel KV (future):
  - `KV_REST_API_URL`
  - `KV_REST_API_TOKEN`

### Deployment Steps

1. Push to GitHub
2. Vercel automatically deploys
3. API routes are available immediately
4. No additional configuration needed

## Maintenance

### Cleanup Old Configurations

```bash
# Find configs older than 1 year
find docs/.configs -name "*.json" -mtime +365

# Delete expired configs
find docs/.configs -name "*.json" -mtime +365 -delete
```

Consider adding a Vercel Cron job for automated cleanup:

```json
{
  "crons": [{
    "path": "/api/cleanup-expired",
    "schedule": "0 0 * * *"
  }]
}
```

### Monitoring Storage

```bash
# Check storage usage
du -sh docs/.configs

# Count configs
ls docs/.configs | wc -l
```

## Support & Documentation

- API docs: `/api/README.md`
- User guide: https://agentful.app/docs/shareable-configs (to be created)
- Examples: https://agentful.app/configure

## License

Same as agentful package (MIT)
