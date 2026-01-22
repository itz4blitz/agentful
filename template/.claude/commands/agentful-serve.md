---
name: agentful-serve
description: Start secure remote execution server with authentication
---

# agentful Serve

Start a secure HTTP API server for remote agent execution. Supports three authentication modes: Tailscale (recommended), HMAC, and SSH tunnel.

## Quick Start

```bash
# Tailscale mode (recommended for VPS)
/agentful-serve

# HMAC mode (for public endpoints/CI)
/agentful-serve --auth=hmac --secret=YOUR_SECRET

# SSH tunnel mode (localhost only)
/agentful-serve --auth=none
```

## Command Implementation

When the user invokes `/agentful-serve`, you should:

### 1. Parse Arguments

Extract optional flags from the command:

```javascript
const args = extract_command_args(); // Everything after "/agentful-serve"

// Parse flags
const config = {
  auth: 'tailscale',  // default
  port: 3737,         // default
  secret: null,
  https: false,
  cert: null,
  key: null,
  corsOrigin: null
};

// Extract --auth=X, --port=X, --secret=X, etc.
// See implementation pattern below
```

### 2. Validate Configuration

Check that required dependencies exist for the chosen auth mode:

```javascript
// For Tailscale mode
if (config.auth === 'tailscale') {
  const tailscaleInstalled = await check_command_exists('tailscale');
  if (!tailscaleInstalled) {
    console.log(`
⚠️  Tailscale not installed!

Tailscale provides zero-config networking with WireGuard encryption.
Perfect for VPS deployments with free tier (100 devices).

Install Tailscale:
  curl -fsSL https://tailscale.com/install.sh | sh
  sudo tailscale up

Or use a different auth mode:
  /agentful-serve --auth=hmac --secret=YOUR_SECRET
  /agentful-serve --auth=none  # localhost only
`);
    return;
  }
}

// For HMAC mode
if (config.auth === 'hmac' && !config.secret) {
  console.log(`
❌ HMAC mode requires --secret

Generate a strong secret:
  openssl rand -hex 32

Then run:
  /agentful-serve --auth=hmac --secret=YOUR_SECRET
`);
  return;
}

// For HTTPS mode
if (config.https && (!config.cert || !config.key)) {
  console.log(`
❌ HTTPS mode requires --cert and --key

Use Let's Encrypt to get SSL certificates:
  sudo certbot certonly --standalone -d yourdomain.com

Then run:
  /agentful-serve --auth=hmac --secret=YOUR_SECRET --https \\
    --cert=/etc/letsencrypt/live/yourdomain.com/fullchain.pem \\
    --key=/etc/letsencrypt/live/yourdomain.com/privkey.pem
`);
  return;
}
```

### 3. Start Server via CLI

Use the Bash tool to invoke the `agentful serve` CLI command:

```bash
# Build command arguments
let cmd = 'agentful serve';

if (config.auth !== 'tailscale') {
  cmd += ` --auth=${config.auth}`;
}

if (config.port !== 3737) {
  cmd += ` --port=${config.port}`;
}

if (config.secret) {
  cmd += ` --secret=${config.secret}`;
}

if (config.https) {
  cmd += ' --https';
  cmd += ` --cert=${config.cert}`;
  cmd += ` --key=${config.key}`;
}

if (config.corsOrigin) {
  cmd += ` --cors-origin=${config.corsOrigin}`;
}

# Execute with Bash tool
Bash(cmd);
```

### 4. Display Setup Instructions

After starting the server, provide the user with next steps:

```javascript
const protocol = config.https ? 'https' : 'http';
const host = config.auth === 'none' ? 'localhost' : 'your-server-ip';

console.log(`
✅ agentful server started!

Server: ${protocol}://${host}:${config.port}
Auth: ${config.auth}

${get_auth_instructions(config)}

API Endpoints:
  GET  /health              - Health check (no auth)
  GET  /agents              - List available agents
  POST /trigger             - Execute an agent
  GET  /status/:id          - Check execution status
  GET  /executions          - List recent executions

Documentation: https://agentful.app/remote-execution
`);
```

## Authentication Modes

### Tailscale (Recommended)

Zero-configuration networking with WireGuard encryption. Perfect for free VPS deployments.

**Benefits:**
- Network-level security (no application auth needed)
- Works behind NAT/firewalls automatically
- Free tier supports 100 devices
- Zero-trust architecture

**Setup:**
```bash
# On server
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# Start agentful server
/agentful-serve

# Trigger from any device on your tailnet
curl http://server-name:3737/trigger \
  -H "Content-Type: application/json" \
  -d '{"agent":"backend","task":"Review API changes"}'
```

### HMAC Authentication

Signature-based authentication with replay protection. Use for public endpoints and CI/CD integration.

**Features:**
- HMAC-SHA256 signatures
- 5-minute replay protection window
- Rate limiting (60 req/min per IP)
- Requires HTTPS in production

**Setup:**
```bash
# Generate strong secret
export SECRET=$(openssl rand -hex 32)

# Start server
/agentful-serve --auth=hmac --secret=$SECRET

# Client must sign requests
const timestamp = Date.now().toString();
const signature = crypto
  .createHmac('sha256', secret)
  .update(timestamp + body)
  .digest('hex');
```

### SSH Tunnel

Localhost-only access for traditional SSH tunnel setups.

**Setup:**
```bash
# On server: start server bound to localhost only
/agentful-serve --auth=none

# On client: create SSH tunnel
ssh -L 3737:localhost:3737 user@server

# Trigger from local machine
curl http://localhost:3737/trigger \
  -H "Content-Type: application/json" \
  -d '{"agent":"reviewer","task":"Review code quality"}'
```

## Example Usage

### Basic Tailscale Setup

```bash
# Install Tailscale on VPS
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# Clone your project
git clone https://github.com/yourname/project.git
cd project

# Start Claude Code
claude

# Start server
/agentful-serve
```

### Production HMAC Setup

```bash
# Generate SSL certificate
sudo certbot certonly --standalone -d yourdomain.com

# Generate HMAC secret
export SECRET=$(openssl rand -hex 32)

# Start server
/agentful-serve \
  --auth=hmac \
  --secret=$SECRET \
  --https \
  --cert=/etc/letsencrypt/live/yourdomain.com/fullchain.pem \
  --key=/etc/letsencrypt/live/yourdomain.com/privkey.pem
```

### Systemd Service

To run the server persistently, create a systemd service:

```bash
sudo tee /etc/systemd/system/agentful.service > /dev/null <<EOF
[Unit]
Description=agentful Remote Execution Server
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$PWD
Environment="AGENTFUL_SECRET=$SECRET"
ExecStart=/usr/bin/npx @itz4blitz/agentful serve --auth=hmac --secret=\${AGENTFUL_SECRET}
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable agentful
sudo systemctl start agentful
```

## Security Considerations

### Input Validation

All inputs are validated and sanitized:
- **Agent names**: Alphanumeric, hyphens, underscores only
- **Task descriptions**: Max 10KB, no shell metacharacters
- **Request bodies**: Max 10MB
- **Output storage**: Max 1MB per execution

### Rate Limiting

Default limits:
- 60 requests per minute per IP
- Returns `429 Too Many Requests` with `Retry-After` header

### Replay Protection

HMAC mode uses timestamp-based replay protection:
- Requests older than 5 minutes are rejected
- Signature cache limited to 10,000 entries

### Secret Requirements

HMAC secrets must be:
- Minimum 32 characters (256 bits)
- Generated with cryptographically secure random (e.g., `openssl rand -hex 32`)

## Troubleshooting

### "Tailscale not found"

Install Tailscale:
```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

### "HMAC signature verification failed"

Common causes:
- Clock skew (timestamp >5 minutes old)
- Wrong secret
- Signature calculated incorrectly
- Body modified after signature generated

### "Port already in use"

Change the port:
```bash
/agentful-serve --port=3738
```

Or find and kill the process:
```bash
lsof -ti:3737 | xargs kill
```

### "Rate limit exceeded"

Server returns `429 Too Many Requests`. Wait for `Retry-After` seconds or implement exponential backoff.

## API Reference

### POST /trigger

Execute an agent with a task.

**Request:**
```json
{
  "agent": "backend",
  "task": "Implement user authentication",
  "timeout": 600000,
  "env": {
    "NODE_ENV": "production"
  }
}
```

**Response:**
```json
{
  "executionId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Agent execution started",
  "statusUrl": "/status/550e8400-e29b-41d4-a716-446655440000"
}
```

### GET /status/:executionId

Check execution status and retrieve output.

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "agent": "backend",
  "task": "Implement user authentication",
  "state": "completed",
  "startTime": 1737536400000,
  "endTime": 1737536723000,
  "duration": 323000,
  "output": "✅ Implemented JWT authentication...",
  "exitCode": 0
}
```

**State values:** `pending`, `running`, `completed`, `failed`

### GET /agents

List all available agents.

**Response:**
```json
{
  "agents": ["backend", "frontend", "tester", "reviewer", "fixer"],
  "count": 5
}
```

### GET /executions

List recent executions with optional filtering.

**Query parameters:**
- `agent` - Filter by agent name
- `state` - Filter by state
- `limit` - Max results (default: 100)

**Response:**
```json
{
  "executions": [...],
  "count": 42
}
```

## Implementation Notes

**DO NOT:**
- Implement the server logic yourself (it already exists in `lib/server/`)
- Parse HTTP requests manually
- Handle authentication yourself

**DO:**
- Use the existing `agentful serve` CLI command via Bash tool
- Validate user input before passing to CLI
- Provide clear error messages for missing dependencies
- Display helpful next steps after starting the server

## Related Commands

- `/agentful-start` - Start autonomous development loop
- `/agentful-status` - Check progress and completion
- `/agentful-validate` - Run quality checks

## Documentation

Full documentation: https://agentful.app/remote-execution
